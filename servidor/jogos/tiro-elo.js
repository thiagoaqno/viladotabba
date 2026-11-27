// Elo do Tiro da Galera (pedido do Thiago, 26/nov). Ranques: Prata, Ouro, Diamante, Ascendente e Imortal, com 3 divisões
// de 100 pontos cada, e Radiante a partir de 1500 (sem divisão). Começa em Prata 1 (0) e não desce abaixo de 0.
// Pontos por partida (a faixa é a do Thiago; dentro dela, quem joga melhor no time ganha mais e perde menos):
//   até chegar no Ascendente 1 (< 900): vitória +20 a +26, derrota -10 a -15
//   Ascendente (900 a 1199):            vitória +19 a +22, derrota -19 a -20
//   Imortal (1200 a 1499):              vitória +14 a +18, derrota -20 a -22
//   Radiante (1500 ou mais):            vitória +13 a +16, derrota -22 a -24
// O que conta: partida online de mata-mata em time ou dominação, com pelo menos MIN_HUMANOS pessoas (os bots não contam).
// A partida roda no navegador de quem cria a sala e o servidor só repassa as mensagens, então cada jogador manda o próprio
// resultado no fim (POST /tiro/perfil/elo/resultado) e a partida só conta quando CONFIRMACOES perfis diferentes mandaram o
// mesmo placar, com as mesmas pessoas. Assim ninguém sobe sozinho inventando vitória.
const RANQUES = ["Prata", "Ouro", "Diamante", "Ascendente", "Imortal", "Radiante"];
const RADIANTE = 1500;
const MIN_HUMANOS = 4;
const CONFIRMACOES = 2;
const MODOS = new Set(["tdm", "dom"]);
const VIDA_GRUPO_MS = 10 * 60 * 1000; // relatos da mesma partida chegam em segundos; depois de 10 min, é outra partida

function ranque(pontos) {
  const p = Math.max(0, Math.floor(pontos || 0));
  if (p >= RADIANTE) return { nome: "Radiante", div: 0, indice: 5, rotulo: "Radiante", naDivisao: p - RADIANTE, proximo: null };
  const d = Math.floor(p / 100), i = Math.floor(d / 3), div = (d % 3) + 1;
  return { nome: RANQUES[i], div, indice: i, rotulo: RANQUES[i] + " " + div, naDivisao: p % 100, proximo: 100 };
}
function faixa(pontos) {
  if (pontos < 900) return { vitoria: [20, 26], derrota: [10, 15] };
  if (pontos < 1200) return { vitoria: [19, 22], derrota: [19, 20] };
  if (pontos < RADIANTE) return { vitoria: [14, 18], derrota: [20, 22] };
  return { vitoria: [13, 16], derrota: [22, 24] };
}
// desempenho: 1 = melhor do time, 0 = pior (pela posição no placar do time)
function delta(pontos, resultado, desempenho) {
  if (resultado === "empate") return 0;
  const f = Math.min(1, Math.max(0, Number(desempenho) || 0)), F = faixa(pontos);
  if (resultado === "vitoria") { const [a, b] = F.vitoria; return a + Math.round(f * (b - a)); }
  const [a, b] = F.derrota; return -(b - Math.round(f * (b - a)));
}

const limpa = (s, n) => String(s == null ? "" : s).replace(/[\u0000-\u001f|<>]/g, "").trim().slice(0, n);
// confere o relato e monta a chave da partida (igual para todos os jogadores da mesma partida)
function lerRelato(c) {
  if (!c || typeof c !== "object") return { erro: "relato vazio" };
  const sala = limpa(c.sala, 8).toUpperCase(), modo = limpa(c.modo, 8), mapa = limpa(c.mapa, 40);
  const placar = Array.isArray(c.placar) ? c.placar.slice(0, 2).map((v) => Math.max(0, Math.floor(Number(v) || 0))) : [];
  const humanos = Array.isArray(c.humanos) ? c.humanos.slice(0, 20).map((h) => ({ n: limpa(h && h.n, 24), t: h && h.t === 1 ? 1 : 0 })).filter((h) => h.n) : [];
  const eu = c.eu || {};
  if (!/^[A-Z0-9]{5}$/.test(sala) || placar.length !== 2) return { erro: "partida sem sala" };
  if (!MODOS.has(modo)) return { erro: "só mata-mata em time e dominação contam" };
  if (humanos.length < MIN_HUMANOS) return { erro: `precisa de pelo menos ${MIN_HUMANOS} pessoas na partida` };
  const meu = { n: limpa(eu.n, 24), t: eu.t === 1 ? 1 : 0, f: Math.min(1, Math.max(0, Number(eu.f) || 0)) };
  if (!humanos.some((h) => h.n === meu.n && h.t === meu.t)) return { erro: "você não está no placar" };
  const gente = humanos.map((h) => h.t + ":" + h.n).sort().join(",");
  return { chave: [sala, modo, mapa, placar.join("-"), gente].join("|"), sala, modo, mapa, placar, meu };
}
const resultadoDe = (placar, time) => (placar[0] === placar[1] ? "empate" : (placar[0] > placar[1] ? 0 : 1) === time ? "vitoria" : "derrota");

// as partidas esperando confirmação (na memória: um relato perdido num reinício do servidor só não conta)
const grupos = new Map(); // chave → { desde, relatos: Map(perfil → relato), feitos: Map(perfil → resposta) }
function grupoDe(chave, agora) {
  let g = grupos.get(chave);
  if (g && agora - g.desde > VIDA_GRUPO_MS) { grupos.delete(chave); g = null; }
  if (!g) { g = { desde: agora, relatos: new Map(), feitos: new Map() }; grupos.set(chave, g); }
  return g;
}
setInterval(() => { const agora = Date.now(); for (const [k, g] of grupos) if (agora - g.desde > VIDA_GRUPO_MS) grupos.delete(k); }, 60000).unref();

// recebe o relato de um perfil; devolve { estado: 'contou' | 'esperando' | 'nao_conta', ... }
function relatar(bd, perfil, corpo, agora = Date.now()) {
  const R = lerRelato(corpo);
  if (R.erro) return { estado: "nao_conta", motivo: R.erro };
  const g = grupoDe(R.chave, agora);
  if (g.feitos.has(perfil.id)) return g.feitos.get(perfil.id);
  g.relatos.set(perfil.id, R);
  if (g.relatos.size < CONFIRMACOES) return { estado: "esperando", faltam: CONFIRMACOES - g.relatos.size };
  // confirmada: aplica para todos que já mandaram (e, depois, para quem chegar)
  const chave = R.chave + "#" + g.desde;
  for (const [pid, r] of g.relatos) {
    if (g.feitos.has(pid)) continue;
    const res = resultadoDe(r.placar, r.meu.t);
    const antes = bd.eloTiro(pid).pontos, d = delta(antes, res, r.meu.f);
    const feito = bd.registrarEloTiro(pid, { chave, modo: r.modo, mapa: r.mapa, resultado: res, delta: d, agora });
    const depois = feito ? feito.pontos : antes;
    g.feitos.set(pid, { estado: "contou", resultado: res, antes, depois, delta: depois - antes, ranque: ranque(depois), ranqueAntes: ranque(antes) });
  }
  return g.feitos.get(perfil.id);
}

module.exports = { ranque, faixa, delta, relatar, lerRelato, RANQUES, MIN_HUMANOS, CONFIRMACOES };
