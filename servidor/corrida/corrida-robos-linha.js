// Corrida da Galera — os robôs: o traçado de corrida de cada pista, o que eles aprendem com as voltas da galera e o perfil
// de velocidade (quanto o carro pode andar em cada ponto). Parte de corrida-robos.js.
const T = require("../../public/corrida/pistas.js");
const { Worker } = require("node:worker_threads");
const path = require("node:path");
const F1 = require("../../public/corrida/f1-regras.js"); // os pneus das regras de F1
const F1Equipes = require("../../public/corrida/f1-equipes.js"); // a montagem do carro de cada equipe
const D = require("../../public/corrida/dinamica.js");
const Piloto = require("./corrida-piloto.js");
const { STEP, FOLGA_LINHA, RAIO_MIN, PISTAS_FANTASIA, FATOR_LINHA, margemDaPista } = require("./corrida-robos-base.js");
const CACHE = new Map();
// O traçado de corrida: um elástico esticado dentro da pista. Começa no meio e, várias vezes, cada ponto vai para o
// meio dos vizinhos (o caminho mais reto possível), sem passar da beira. O resultado abre antes da curva, encosta
// por dentro no ápice e volta a abrir na saída. Devolve o deslocamento lateral de cada ponto (lat) e a curvatura dele.
const LINHAS = new Map();
const ESTREITO_BASE = +(process.env.ROBO_ESTREITO_BASE ?? 0.4), ESTREITO_K = +(process.env.ROBO_ESTREITO_K ?? 0.5);
let CORRECOES = null;
function correcaoDaLinha(pista) {
  if (process.env.ROBO_SEM_CORRECAO) return null;
  if (CORRECOES == null) { try { CORRECOES = JSON.parse(require("fs").readFileSync(path.join(__dirname, "..", "..", "public", "corrida", "linha-correcao.json"), "utf8")); } catch { CORRECOES = {}; } }
  return CORRECOES[pista] || null;
}
const FOLGA_TETO = +(process.env.ROBO_FOLGA_TETO ?? 3); // até onde a linha pode passar do teto do muro (o teto já desconta a folgaLinha de 6 u)
// o maior deslocamento do centro do carro que cabe entre as barreiras explícitas de uma pista (`muros` em pistas.js, Baku: a Cidade Velha é estreita); Infinity onde a pista é a de sempre
function tetoDoMuro(t, pts) {
  const n = pts.length, teto = new Float64Array(n).fill(Infinity); if (!t.muros) return teto;
  const m = T.murosDoEscape(pts, t.width, null, t), folga = t.muroFolga ?? 8;
  for (let i = 0; i < n; i++) for (const lado of [-1, 1]) if (m[lado][i]) teto[i] = Math.min(teto[i], t.width / 2 + m[lado][i] - folga - (t.folgaLinha ?? 6));
  return teto;
}
function tracado(pista, f1 = false, linhaPronta = null) {
  const cache = f1 ? pista + ":f1" : pista;
  if (LINHAS.has(cache)) return LINHAS.get(cache);
  T.usarEscala(pista); const t = T.PISTAS[pista], pts = T.pontos(t, STEP), n = pts.length, max = t.width / 2 - 16, teto = tetoDoMuro(t, pts);
  const lat = new Float64Array(n), X = new Float64Array(n), Y = new Float64Array(n);
  const pos = () => { for (let i = 0; i < n; i++) { X[i] = pts[i].x - pts[i].ty * lat[i]; Y[i] = pts[i].y + pts[i].tx * lat[i]; } };
  if (!f1) for (const k of [12, 8, 5, 3]) for (let it = 0; it < 60; it++) {
    pos();
    for (let i = 0; i < n; i++) {
      const a = (i - k + n) % n, b = (i + k) % n, mx = (X[a] + X[b]) / 2, my = (Y[a] + Y[b]) / 2;
      const alvo = (mx - pts[i].x) * -pts[i].ty + (my - pts[i].y) * pts[i].tx;
      lat[i] = Math.max(-Math.min(max, teto[i]), Math.min(Math.min(max, teto[i]), lat[i] + (alvo - lat[i]) * 0.5));
    }
  }
  // Linha de F1: a LINHA DE CORRIDA de verdade, por otimização (corrida-linha.js): curvatura mínima entre as beiras, com a folga do carro.
  // Abre por fora antes da curva, encosta por dentro no ápice e sai abrindo; as curvas em sequência saem resolvidas juntas.
  // (O relaxamento de antes, 12 mil passos de uma média local, não convergia: a linha ficava perto do eixo da pista.)
  // Em Mônaco a linha otimizada precisa caber no mesmo limite que o volante usa, evitando cortar o S em cima do muro.
  // (Quem lê usa lat[(i + 2) % n]: guardada assim para o ponto i receber exatamente a linha de i.)
  if (f1) { const nova = linhaPronta || Piloto.linhaDaPista(pista, t, pts, F1Equipes.specDaEquipe("mclaren"), aderRef()); for (let i = 0; i < n; i++) lat[(i + 2) % n] = nova[i]; }
  // (2026-11-16) a linha pronta (corrida-linhas-f1.json) foi feita sem o limite das barreiras em alguns trechos: em Mônaco, a 65% da volta, ela passava
  // a 31 u do meio onde o centro do carro só cabe até ~26 (o teto, que já desconta muroFolga e folgaLinha, mais folgaLinha de volta), ou seja, dentro
  // do muro: 78 dos 92 toques no muro da pista eram ali. Presa ao teto mais FOLGA_TETO (e suavizada para não virar quina):
  if (f1 && Number.isFinite(Math.min(...teto))) {
    const lim = (i) => teto[i] + FOLGA_TETO; let mexeu = 0;
    for (let i = 0; i < n; i++) { const l = lat[(i + 2) % n], m = lim(i); if (Math.abs(l) > m) { lat[(i + 2) % n] = Math.sign(l) * m; mexeu++; } }
    if (mexeu) for (let r = 0; r < 4; r++) { const c = Float64Array.from(lat); for (let i = 0; i < n; i++) { const v = (c[(i - 1 + n) % n] + 2 * c[i] + c[(i + 1) % n]) / 4, m = lim((i - 2 + n) % n); lat[i] = Math.max(-m, Math.min(m, v)); } }
  }  // (2026-11-16) a correção medida pelo caminho real do carro (ferramentas/linha-muro.js, public/corrida/linha-correcao.json): onde o robô, mirando
  // longe, cortava a curva por dentro do muro, a linha vem empurrada para o meio na medida do excesso. A mira não muda (é ela que dá o ritmo).
  if (f1) { const c = correcaoDaLinha(pista); if (c && c.n === n) for (const [i, d] of c.d) lat[i] += d; }

  pos();
  const k = new Float64Array(n), sinal = new Float64Array(n); // sinal: +1 se a curva vai para o lado de lat positivo, -1 para o outro
  for (let i = 0; i < n; i++) { // curvatura do traçado: quanto a direção vira por unidade andada
    const a = (i - 3 + n) % n, b = (i + 3) % n, d1 = Math.atan2(Y[i] - Y[a], X[i] - X[a]), d2 = Math.atan2(Y[b] - Y[i], X[b] - X[i]);
    k[i] = Math.abs(Math.atan2(Math.sin(d2 - d1), Math.cos(d2 - d1))) / Math.max(1, Math.hypot(X[b] - X[a], Y[b] - Y[a]) / 2);
    sinal[i] = Math.sin(d2 - d1) >= 0 ? 1 : -1;
  }
  const out = { pts, n, lat, k, sinal, X, Y, teto, ...(f1 ? Piloto.limitesDaPista(t, pts) : {}) }; LINHAS.set(cache, out); return out;
}
// Expõe apenas um traçado já pronto; nunca inicia uma otimização pelo pedido do navegador.
const LINHAS_PUBLICAS = new Map();
function linhaF1Pronta(pista) {
  if (!tracadoPronto(pista)) return null;
  if (!LINHAS_PUBLICAS.has(pista)) {
    const linha = tracado(pista, true), k = curvaturaDoCaminho(linha.pts, linha.lat, 12, 6);
    LINHAS_PUBLICAS.set(pista, { lat: Array.from(linha.lat, (v) => Math.round(v * 100) / 100), k: Array.from(k, (v) => Math.round(v * 1e7) / 1e7) });
  }
  return LINHAS_PUBLICAS.get(pista);
}
// Calcula a otimização em outra thread: outras salas continuam recebendo atualizações.
const TRACADOS_EM_PREPARO = new Map();
function tracadoPronto(pista) { return LINHAS.has(pista + ":f1"); }
function prepararTracado(pista) {
  if (tracadoPronto(pista)) return Promise.resolve();
  if (TRACADOS_EM_PREPARO.has(pista)) return TRACADOS_EM_PREPARO.get(pista);
  T.usarEscala(pista); const t = T.PISTAS[pista], pontos = T.pontos(t, STEP), teto = tetoDoMuro(t, pontos);
  if (Piloto.temLinhaPronta(pista, pontos.length)) { tracado(pista, true); return Promise.resolve(); } // a linha já vem pronta (corrida-linhas-f1.json): nada a calcular
  const base = T.baseDe(pista) === "monaco" ? t.width / 2 - 9 : t.width / 2 - FOLGA_LINHA;
  const limites = t.muros ? Float64Array.from(teto, (v) => Math.min(base, v + (T.baseDe(pista) === "monaco" ? 8 : 0))) : base;
  const promessa = new Promise((resolve, reject) => {
    const worker = new Worker(path.join(__dirname, "corrida-linha-worker.js"), { workerData: { pontos, limites } });
    worker.once("message", (r) => { try { if (r.erro) reject(new Error(r.erro)); else { tracado(pista, true, r.lat); resolve(); } } catch (e) { reject(e); } });
    worker.once("error", reject);
    worker.once("exit", (codigo) => { if (codigo !== 0) reject(new Error("worker do traçado terminou: " + codigo)); });
  }).finally(() => TRACADOS_EM_PREPARO.delete(pista));
  TRACADOS_EM_PREPARO.set(pista, promessa); return promessa;
}
// A curvatura do caminho que o robô de F1 faz (a pista mais `lat` de lado em cada ponto): o círculo por três pontos, a `m` pontos de cada
// lado, depois a média de uma janelinha, e nunca mais que 1/RAIO_MIN. Sem as quinas que o ruído do traçado cru deixava.
function curvaturaDoCaminho(pts, lat, m = 4, janela = 2) {
  const n = pts.length, X = new Float64Array(n), Y = new Float64Array(n), cru = new Float64Array(n), k = new Float64Array(n);
  for (let i = 0; i < n; i++) { X[i] = pts[i].x - pts[i].ty * lat[i]; Y[i] = pts[i].y + pts[i].tx * lat[i]; }
  for (let i = 0; i < n; i++) {
    const a = (i - m + n) % n, b = (i + m) % n, cruz = (X[i] - X[a]) * (Y[b] - Y[i]) - (Y[i] - Y[a]) * (X[b] - X[i]);
    const da = Math.hypot(X[i] - X[a], Y[i] - Y[a]), db = Math.hypot(X[b] - X[i], Y[b] - Y[i]), dc = Math.hypot(X[b] - X[a], Y[b] - Y[a]);
    cru[i] = da * db * dc > 1e-6 ? (2 * Math.abs(cruz)) / (da * db * dc) : 0;
  }
  for (let i = 0; i < n; i++) { let q = 0; for (let j = -janela; j <= janela; j++) q += cru[(i + j + n) % n]; k[i] = Math.min(1 / RAIO_MIN, q / (2 * janela + 1)); }
  return k;
}
// ---------- aprender com a volta de alguém ----------
// A volta gravada (amostras [tempo ms, x, y, z, ângulo, progresso] a cada 0,1 s) vira, para cada ponto da pista, o
// lado em que o carro passou (lat) e a velocidade dele, em fração da velocidade final daquele carro (para valer para
// qualquer um dos cinco). Pontos sem amostra são preenchidos pelos vizinhos, e tudo é suavizado.
const APRENDIDO = new Map(); // pista -> até cinco perfis humanos válidos
let fonte = () => []; // de onde vêm até cinco voltas guardadas (o servidor liga no banco)
let fonteRitmo = () => null; // o ritmo de quem joga: (pista, nomes da sala ou null) -> { tempo } (bd.ritmoCorrida)
let fonteRecorde = () => null;
let fonteAprendido = () => null; // a proximidade de quem joga aos robôs do Difícil: (pista, nomes da sala, condição) -> { prox } (bd.proximidadeCorrida)
function usarFonte(f, ritmo = () => null, recorde = () => null, aprendidoF1 = () => null) { fonte = f; fonteRitmo = ritmo; fonteRecorde = recorde; fonteAprendido = aprendidoF1; APRENDIDO.clear(); CACHE.clear(); }
function processar(pista, volta) {
  T.usarEscala(pista); const t = T.PISTAS[pista], linha = tracado(pista), pts = linha.pts, n = pts.length, s = volta && volta.s;
  const vmax = (T.CARROS[volta && volta.carro] || T.CARROS.equilibrado).vmax;
  if (!Array.isArray(s) || s.length < 100) return null;
  const somaL = new Float64Array(n), somaV = new Float64Array(n), cont = new Uint16Array(n);
  let avaliadas = 0, distantes = 0;
  for (let k = 0; k + 1 < s.length; k++) {
    const a = s[k], b = s[k + 1], dt = (b[0] - a[0]) / 1000; if (!(dt > 0.02 && dt < 0.5)) continue;
    const i = ((Math.round(a[5]) % n) + n) % n, p = pts[i];
    const dx = a[1] - p.x, dy = a[2] - p.y;
    avaliadas++; if (Math.hypot(dx, dy) > t.width / 2 + 30) distantes++;
    const lat = dx * -p.ty + dy * p.tx, v = Math.hypot(b[1] - a[1], b[2] - a[2]) / dt;
    if (Math.abs(lat) > t.width / 2 + 30 || v > vmax * 1.6) continue; // fora da pista ou pulo de posição: não serve
    // acima da velocidade final era vácuo, estilingue ou turbo de quem gravou: o robô não tem isso, então conta só o topo
    somaL[i] += lat; somaV[i] += Math.min(1, v / vmax); cont[i]++;
  }
  // O índice gravado pertence à versão da pista em que a volta foi feita. Depois de um retraçado,
  // ignorar só a distância lateral aceita pontos muito longe na direção da pista e produz uma linha falsa.
  if (avaliadas && distantes / avaliadas > 0.2) return null;
  const tem = cont.reduce((q, c) => q + (c ? 1 : 0), 0); if (tem < n * 0.12) return null; // volta incompleta
  const lat = new Float64Array(n), vel = new Float64Array(n);
  for (let i = 0; i < n; i++) if (cont[i]) { lat[i] = somaL[i] / cont[i]; vel[i] = somaV[i] / cont[i]; }
  for (let i = 0; i < n; i++) if (!cont[i]) { // preenche o buraco pelo ponto com amostra mais perto de cada lado
    let a = i, b = i; while (!cont[(a - 1 + n) % n] && a - i > -n) a--; while (!cont[(b + 1) % n] && b - i < n) b++;
    const ia = (a - 1 + n) % n, ib = (b + 1) % n, f = (i - a + 1) / (b - a + 2);
    lat[i] = lat[ia] + (lat[ib] - lat[ia]) * f; vel[i] = vel[ia] + (vel[ib] - vel[ia]) * f;
  }
  const suave = (arr, r) => { const out = new Float64Array(n); for (let i = 0; i < n; i++) { let q = 0; for (let k = -r; k <= r; k++) q += arr[(i + k + n) % n]; out[i] = q / (2 * r + 1); } return out; };
  return { lat: suave(lat, 4), vel: suave(vel, 3), tempo: volta.tempo, piloto: volta.piloto };
}
function aprendido(pista) {
  if (!APRENDIDO.has(pista)) { let v = []; try { const voltas = fonte(pista); v = (Array.isArray(voltas) ? voltas : [voltas]).map((volta) => processar(pista, volta)).filter(Boolean).slice(0, 5); } catch (e) { v = []; } APRENDIDO.set(pista, v); }
  return APRENDIDO.get(pista);
}
// Uma das cinco melhores voltas mudou: recarrega os perfis para a próxima largada.
function aprender(pista, volta) {
  const v = (Array.isArray(volta) ? volta : [volta]).map((item) => processar(pista, item)).filter(Boolean).slice(0, 5); if (!v.length) return false;
  APRENDIDO.set(pista, v); for (const k of [...CACHE.keys()]) if (k.startsWith(pista + ":")) CACHE.delete(k);
  return true;
}
// a pista amostrada, a linha e a velocidade de referência em cada ponto, para um carro
function perfil(pista, carro, tracadoId = 0) { // `carro`: o nome de um dos cinco carros ou um `spec` (a montagem de uma equipe de F1, com `chave`)
  const chave = pista + ":" + (carro.chave ? "spec-" + carro.chave : carro) + ":" + tracadoId; if (CACHE.has(chave)) return CACHE.get(chave);
  T.usarEscala(pista); const t = T.PISTAS[pista], c = carro.chave ? carro : T.CARROS[carro], f1 = !!carro.chave && !PISTAS_FANTASIA.has(pista), linha = tracado(pista, f1), pts = linha.pts, n = pts.length, perfis = f1 ? [] : aprendido(pista), ap = perfis[tracadoId % perfis.length];
  let lim, lat;
  const curva = Array.from(linha.k, (k) => (k > 1e-4 ? Math.min(c.turn / k * 1.1, Math.sqrt(c.grip / k) * 1.2, c.vmax) : c.vmax));
  if (linha.teto) for (let i = 0; i < n; i++) if (linha.teto[i] < 30) curva[i] = Math.min(curva[i], c.vmax * (0.3 + 0.7 * Math.max(0, linha.teto[i]) / 30)); // entre as barreiras da Cidade Velha (Baku) a pista estreita: mais devagar, sem bater
  for (let volta = 0; volta < 2; volta++) for (let i = n - 1; i >= 0; i--) curva[i] = Math.min(curva[i], Math.sqrt(curva[(i + 1) % n] ** 2 + 2 * c.brake * 0.72 * STEP));
  if (ap) { lim = Array.from(ap.vel, (v, i) => Math.min(curva[i], Math.max(40, v * c.vmax))); lat = ap.lat; }
  else {
    lim = curva;
    lat = linha.lat;
  }
  const fator = f1 ? 1 : FATOR_LINHA, latF1 = Float64Array.from({ length: n }, (_, i) => lat[(i + 2) % n] * fator); // o caminho do robô de F1 (passoF1 usa a mesma conta)
  const out = { pista, pts, n, lim, lat, t, c, linha, teto: linha.teto, aprendeu: !!ap, corredor: F1.corredor(t, n, t.width), fator, velHumana: ap ? ap.vel : null, kf: curvaturaDoCaminho(pts, latF1, f1 ? 12 : 4, f1 ? 6 : 2) }; CACHE.set(chave, out); return out; // corredor: o dos boxes, se a pista tem
}
// O tempo de uma volta lançada andando no limite do perfil vezes `escala`, com a arrancada do carro (a mesma conta do
// passo, sem tráfego). Serve para achar a escala que fecha a volta no tempo que o robô mira.
// `ader` (opcional, regras de F1): a aderência do pneu (F1.aderencia), aplicada como no passo: nas curvas a velocidade vai
// com a raiz do grip, a velocidade final com `final` e a arrancada com `tracao`.
function tempoDaVolta(pf, escala, ader) {
  if (pf.c.chave) { // classificação e ritmo da F1: o mesmo perfil de velocidade dos carros em movimento (tabela por nível, interpolada)
    const tab = tabelaF1(pf, ader), f = Math.min(1, Math.max(0.3, escala));
    let j = 1; while (j < NIVEIS_F1.length - 1 && f > NIVEIS_F1[j]) j++;
    const u = (f - NIVEIS_F1[j - 1]) / (NIVEIS_F1[j] - NIVEIS_F1[j - 1]);
    return tab[j - 1] + (tab[j] - tab[j - 1]) * u;
  }
  const { lim, n, c } = pf, raiz = ader ? Math.sqrt(ader.grip) : 1;
  let v = 0, t = 0;
  for (let volta = 0; volta < 2; volta++) {
    t = 0;
    for (let i = 0; i < n; i++) {
      const teto = Math.min(c.vmax * (ader ? ader.final : 1), Math.min(lim[i], lim[(i + 3) % n]) * escala * (ader && lim[i] < c.vmax * 0.97 ? raiz : 1));
      v = Math.min(teto, Math.sqrt(v * v + 2 * c.acc * (ader ? ader.tracao : 1) * (1 - 0.8 * Math.pow(Math.max(0, v) / c.vmax, 1.6)) * STEP));
      t += STEP / Math.max(v, 1);
    }
  }
  return t;
}
// ---------- o perfil de velocidade do robô de F1 ----------
// O nível `f` (0,4 a 1) do robô é a fração da margem do piloto ideal (MARGEM_F1) que ele usa nas curvas: 1 é o limite, abaixo disso
// ele faz as curvas mais devagar e freia mais cedo. Nas retas ninguém tira o pé por nível: só a curva e a frenagem custam tempo.
const NIVEIS_F1 = [0.3, 0.5, 0.65, 0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4, 1.5]; // (acima de 1: o difícil passa um pouco do ideal medido, como quem joga bem)
function topoDe(pf) { return pf.topo || (pf.topo = D.velocidadeFinal(pf.c)); }
function perfilF1(pf, f) {
  const q = Math.round(Math.min(1.5, Math.max(0.3, f)) * 100) / 100, mapa = pf.perfisF1 || (pf.perfisF1 = new Map());
  let v = mapa.get(q);
  if (!v && pf.linha.hi) { // pistas de GP: o ritmo do piloto novo (corrida-piloto.js), com os limites de verdade do carro
    const lat = Float64Array.from({ length: pf.n }, (_, i) => pf.lat[(i + 2) % pf.n]);
    v = Piloto.perfilDoNivel(pf.pts, lat, pf.c, aderRef(), q, pf.t.janelaRitmo);
    // (2026-11-16) o teto de velocidade entre as barreiras (o mesmo de baixo, de antes) não valia na linha de F1: no castelo de Baku (44% da volta, a pista
    // com ~19 u de folga para cada lado) o robô entrava a ~220 u/s, não fazia a chicane e raspava o muro mesmo com a linha corrigida. ESTREITO_BASE e
    // ESTREITO_K: a fração da velocidade máxima onde a folga do muro (pf.teto) vai a zero e o quanto ela sobe até `tetoMuro` (30 u). Mônaco tem a sua conta.
    if (pf.teto && pf.t.muros && T.baseDe(pf.pista) !== "monaco") {
      const n = pf.n, vmax = pf.c.vmax, lim = pf.t.tetoMuro ?? 30; let mexeu = false; v = Array.from(v);
      for (let i = 0; i < n; i++) if (pf.teto[i] < lim) { const cap = vmax * (ESTREITO_BASE + ESTREITO_K * Math.max(0, pf.teto[i]) / lim); if (cap < v[i]) { v[i] = cap; mexeu = true; } }
      if (mexeu) for (let volta = 0; volta < 2; volta++) for (let i = n - 1; i >= 0; i--) v[i] = Math.min(v[i], Math.sqrt(v[(i + 1) % n] ** 2 + 2 * pf.c.brake * 0.72 * STEP));
    }
    if (mapa.size >= 30) mapa.delete(mapa.keys().next().value);
    mapa.set(q, v);
  }
  if (!v) {
    v = D.perfilIdeal(pf.pts.map((p, i) => ({ k: pf.kf[i], h: p.h })), pf.c, STEP, margemDaPista(pf.pista).margem * q, null, margemDaPista(pf.pista).freio);
    if (pf.teto && pf.t.muros) { // entre as barreiras da Cidade Velha (Baku) a pista estreita: o perfil ideal passa a ser mais lento ali (e a freada vem antes), sem bater
      const n = pf.n, vmax = pf.c.vmax, lim = pf.t.tetoMuro ?? 30; v = Array.from(v); // (lim: a folga do centro do carro abaixo da qual a pista conta como estreita; Mônaco, de rua colada, diz o seu em `tetoMuro`)
      for (let i = 0; i < n; i++) {
        if (T.baseDe(pf.pista) !== "monaco" && pf.teto[i] < lim) v[i] = Math.min(v[i], vmax * (0.14 + 0.5 * Math.max(0, pf.teto[i]) / lim));
        // As velocidades humanas válidas também são referência em Mônaco.
        if (T.baseDe(pf.pista) === "monaco" && pf.velHumana) v[i] = Math.min(topoDe(pf), Math.max(v[i], pf.velHumana[i] * pf.c.vmax));
      }
      for (let volta = 0; volta < 2; volta++) for (let i = n - 1; i >= 0; i--) v[i] = Math.min(v[i], Math.sqrt(v[(i + 1) % n] ** 2 + 2 * pf.c.brake * 0.72 * STEP));
    }
    if (mapa.size >= 30) mapa.delete(mapa.keys().next().value);
    mapa.set(q, v);
  }
  return v;
}
// O tempo de uma volta lançada andando no perfil do nível `f`, com a arrancada do carro (sem tráfego), com a aderência `ader` do pneu.
function voltaDoPerfil(pf, f, ader) {
  const fis = perfilF1(pf, f), ext = ader ? { grip: ader.grip, tracao: ader.tracao } : null, raiz = ader ? Math.sqrt(pf.linha.hi ? ader.rel : ader.grip) : 1; // (o piloto novo: o `rel` é o limite de verdade do pneu)
  const topo = topoDe(pf), teto0 = topo * (ader ? ader.final : 1);
  let v = 0, t = 0;
  for (let volta = 0; volta < 2; volta++) {
    t = 0;
    for (let i = 0; i < pf.n; i++) {
      const teto = Math.min(teto0, fis[i] < topo * 0.97 ? fis[i] * raiz : fis[i]);
      const a = Math.max(0, D.aceleracaoMaxima(pf.c, v, 0, ext));
      v = Math.min(teto, Math.sqrt(v * v + 2 * a * STEP));
      t += STEP / Math.max(v, 1);
    }
  }
  return t;
}
function tabelaF1(pf, ader) {
  const chave = ader ? ader.grip + "|" + ader.tracao + "|" + ader.final : "-", mapa = pf.tabelas || (pf.tabelas = new Map());
  if (!mapa.has(chave)) mapa.set(chave, NIVEIS_F1.map((f) => voltaDoPerfil(pf, f, ader)));
  return mapa.get(chave);
}
function escalaPara(pf, alvo, ader, teto = 1.6) {
  let lo = 0.4, hi = teto;
  if (tempoDaVolta(pf, hi, ader) > alvo) return hi;
  for (let k = 0; k < (pf.c.chave ? 12 : 24); k++) { const m = (lo + hi) / 2; if (tempoDaVolta(pf, m, ader) > alvo) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
// O ritmo da largada: o de quem está na sala; sem volta deles nesta pista, o de todo mundo que já correu nela.
function ritmoDaSala(room) {
  const nomes = room.order.map((id) => room.players[id]).filter((p) => p && !p.bot).map((p) => p.name);
  try { return (nomes.length && fonteRitmo(room.config.pista, nomes)) || fonteRitmo(room.config.pista, null) || null; } catch (e) { return null; }
}
// No GP, o robô mira o tempo de volta do piloto ideal DO CARRO DELE nesta pista (o perfil de velocidade no limite, `tempoDaVolta(pf, 1)`)
// mais uma folga que depende do nível: o fácil fica uns 9% atrás, o médio uns 4,5% (perto de quem joga bem) e o difícil uns 2%. Cada
// piloto soma um pouco mais de acordo com o ritmo dele (até ~1,2%), e o carro fraco continua mais lento que o forte porque o ideal
// dele já é mais lento. Nunca abaixo do limite do carro. Se a galera já fez voltas quase perfeitas, o robô não passa de 2,5% delas.
// A referência do ritmo é o piloto ideal com o pneu neutro. O robô de verdade anda com o pneu de cada momento.
// o pneu de referência do ritmo é o médio novo e quente: o nível é medido contra o piloto ideal com ele, e o pneu de cada
// momento (o macio mais rápido, o duro mais lento, o gasto e o frio) mexe no ritmo de verdade, em passoF1
let ADER_REF = null;
const aderRef = () => ADER_REF || (ADER_REF = F1.aderencia({ composto: "medio", desgaste: 0, temp: 1 }));
function idealDe(pista, spec) { return tempoDaVolta(perfil(pista, spec || F1Equipes.specDaEquipe("mclaren")), 1, aderRef()); }

module.exports = { linhaF1Pronta, tracadoPronto, prepararTracado, get fonteRecorde() { return fonteRecorde; }, get fonteAprendido() { return fonteAprendido; }, usarFonte, aprendido, aprender, perfil, tempoDaVolta, topoDe, perfilF1, escalaPara, ritmoDaSala, aderRef, idealDe };
