#!/usr/bin/env node
// (2026-11-16, o Thiago: "o problema é passar com o carro dentro do muro... então é um problema de cálculo da linha, não do volante: eles precisam mirar
// longe para pilotar bem") A linha de corrida (corrida-linhas-f1.json) é feita como se o carro andasse em cima dela; o robô mira longe (é o que dá o
// ritmo) e corta as curvas para dentro, e onde a linha encosta no muro, o corte passa por dentro do muro (Baku, a 41% da volta: a linha a 20 u do meio,
// o carro a 33, o limite a 34). Esta ferramenta corrige a LINHA pelo caminho que o carro faz de verdade, sem mexer na mira:
//   1. roda um robô sozinho, 3 voltas, e guarda, ponto a ponto, o quanto o carro foi para cada lado;
//   2. onde ele passou do limite do muro (o centro do carro pode ir até o teto + 6 u; fica LIMITE_FOLGA antes disso), empurra a linha para o meio na
//      medida do excesso, espalhado pelos pontos vizinhos (sem quina);
//   3. repete até o caminho ficar limpo (ou RODADAS vezes) e grava em public/corrida/linha-correcao.json (corrida-robos.js tracado soma na linha).
//   node ferramentas/linha-muro.js [pista ...]      (sem pista: as da carreira que têm `muros`)
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const RAIZ = path.join(__dirname, ".."), ARQ = path.join(RAIZ, "public", "corrida", "linha-correcao.json");
const RODADAS = 8, LIMITE_FOLGA = 2, ESPALHA = 10, GANHO = 1.5; // GANHO: empurra um pouco mais que o excesso (o carro acompanha a linha só em parte)

// ---------- o filho: roda o robô e devolve o caminho (chamado com --medir pista) ----------
if (process.argv[2] === "--medir") {
  const pista = process.argv[3];
  const T = require(RAIZ + "/public/corrida/pistas.js"), F1 = require(RAIZ + "/public/corrida/f1-regras.js"), Eq = require(RAIZ + "/public/corrida/f1-equipes.js");
  const Robos = require(RAIZ + "/corrida-robos.js"), Direcao = require(RAIZ + "/corrida-f1-direcao.js"), Sim = require(RAIZ + "/public/corrida/sim.js");
  let relogio = 1e6; Date.now = () => relogio; Math.random = F1.sorteio("linha-muro:" + pista);
  Robos.usarFonte(() => []);
  const room = { config: { pista, regras: "f1", caixas: false, robos: 1, nivel: "dificil", voltas: 6 }, players: {}, order: [], phase: "race", startAt: relogio, semente: 777, finishOrder: [] };
  Robos.preparar(room, ["#a"], () => "x");
  const p = room.players[room.order[0]]; p.spec = Eq.specDaEquipe("mclaren"); Object.assign(p, { grid: 0, laps: 0, sector: T.SECTORS - 1, started: false, finish: null });
  Robos.largar(room); p.ia.pneu = F1.pneuNovo("macio"); p.ia.sim.pneu = p.ia.pneu; p.ia.plano = null; Direcao.iniciar(room);
  const pf = Robos.perfil(pista, p.spec, 0), n = pf.n, mais = new Float64Array(n).fill(-Infinity), menos = new Float64Array(n).fill(Infinity);
  const setor = (q, s) => { if (s === (q.sector + 1) % T.SECTORS) q.sector = s; };
  let voltas = 0, ult = -1;
  for (let t = 0; t < 400 && voltas < 4; t += 1 / 60) {
    relogio += 1000 / 60; Robos.passo(room, 1 / 60, setor, () => {});
    const c = p.ia.sim, lap = Math.floor(c.prog / n); if (lap !== ult) { voltas++; ult = lap; }
    if (voltas < 2) continue; // (a primeira volta é a da largada)
    const lat = Sim.quadro(Sim.criarPista(T.PISTAS[pista], pista), c.x, c.y, c.idx).lat, i = c.idx;
    if (lat > mais[i]) mais[i] = lat; if (lat < menos[i]) menos[i] = lat;
  }
  process.stdout.write(JSON.stringify({ n, teto: Array.from(pf.teto || []), mais: Array.from(mais), menos: Array.from(menos) }));
  process.exit(0);
}

// ---------- o principal ----------
const T = require(RAIZ + "/public/corrida/pistas.js");
const lista = process.argv.slice(2).length ? process.argv.slice(2) : require(RAIZ + "/public/corrida/temporada/regras.js").PISTAS_TRABALHADAS.filter((p) => T.PISTAS[p] && T.PISTAS[p].muros);
const tudo = fs.existsSync(ARQ) ? JSON.parse(fs.readFileSync(ARQ, "utf8")) : {};
for (const pista of lista) {
  delete tudo[pista]; fs.writeFileSync(ARQ, JSON.stringify(tudo));
  let corr = null, n = 0;
  for (let r = 0; r < RODADAS; r++) {
    const m = JSON.parse(execFileSync(process.execPath, [__filename, "--medir", pista], { cwd: RAIZ, maxBuffer: 64 << 20 }).toString());
    n = m.n; if (!corr) corr = new Float64Array(n);
    // o excesso de cada ponto: quanto o carro passou do limite (o teto + 6 u, menos LIMITE_FOLGA), para cada lado
    const exc = new Float64Array(n); let pior = 0, pontos = 0;
    for (let i = 0; i < n; i++) {
      const lim = (m.teto[i] ?? Infinity) + 6 - LIMITE_FOLGA; if (!Number.isFinite(lim)) continue;
      const fora = Math.max(0, (m.mais[i] ?? -Infinity) - lim), dentro = Math.max(0, -lim - (m.menos[i] ?? Infinity));
      if (fora > 0) { exc[i] = -fora; pontos++; } else if (dentro > 0) { exc[i] = dentro; pontos++; }
      pior = Math.max(pior, fora, dentro);
    }
    console.log(`${pista} rodada ${r + 1}: ${pontos} pontos passando do limite, o pior ${pior.toFixed(1)} u`);
    if (!pontos) break;
    // espalha a correção pelos vizinhos (o maior empurrão de cada lado, com peso que cai com a distância) e soma
    for (let i = 0; i < n; i++) {
      let d = 0; for (let k = -ESPALHA; k <= ESPALHA; k++) { const e = exc[(i + k + n) % n]; if (!e) continue; const w = 1 - Math.abs(k) / (ESPALHA + 1), v = e * w * GANHO; if (Math.abs(v) > Math.abs(d)) d = v; }
      corr[i] += d;
    }
    tudo[pista] = { n, d: Array.from(corr, (v, i) => [i, Math.round(v * 10) / 10]).filter(([, v]) => v) };
    fs.writeFileSync(ARQ, JSON.stringify(tudo));
  }
}
fs.writeFileSync(ARQ, JSON.stringify(tudo, null, 0) + String.fromCharCode(10));
console.log("gravado:", ARQ);
