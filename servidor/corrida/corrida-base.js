// Corrida da Galera — as constantes da sala (tempos da TV e da largada, limites, cores e bonecos) e as funções pequenas
// que não dependem de sala nenhuma (o capacete de quem joga, o desempenho do laço). Parte de corrida.js.
const nomesDe = (room, ids) => ids.map((id) => room.players[id] && !room.players[id].bot && room.players[id].name).filter(Boolean); // robô não entra no placar da Noite

// CORRIDA_PERF=1: mede quanto o passo dos robôs (o laço de 50 ms) custa no servidor e imprime a cada 200 passos: média, p95 e pior, em ms, e o dt real
const PERF = !!process.env.CORRIDA_PERF;
function medirPerf(room, ms, dt) {
  const m = room.perf || (room.perf = { v: [], dt: [] }); m.v.push(ms); m.dt.push(dt);
  if (m.v.length < 200) return;
  const s = [...m.v].sort((a, b) => a - b), d = [...m.dt].sort((a, b) => a - b), r = (x) => x.toFixed(1);
  console.log(`perf ${room.config.pista} robôs=${room.order.filter((id) => room.players[id].bot).length}: passo média ${r(s.reduce((a, b) => a + b) / s.length)} ms, p95 ${r(s[Math.floor(s.length * 0.95)])}, pior ${r(s[s.length - 1])}; dt p95 ${r(d[Math.floor(d.length * 0.95)] * 1000)} ms, pior ${r(d[d.length - 1] * 1000)} ms`);
  room.perf = null;
}
const ROBOS_F1_MS = 8; // o laço dos robôs nas regras de F1 (o passo da física é pelo tempo real: Robos.tempoDoPasso)
// A transmissão (e com ela as luzes) espera todos os jogadores conectados carregarem a pista: o navegador manda `carregou` quando a cena já
// desenhou E o aquecimento terminou (shaders compilados e malhas na placa: jogo.js, aquecerPista; antes ia antes do aquecimento, e as luzes
// acendiam com os navegadores ainda travados compilando); com todos prontos, a TV encurta para os TV_*_MS dela a partir dali (o mesmo caminho do pular). Ninguém trava a sala: no máximo CARGA_MAX_MS.
const CARGA_MAX_MS = 40000;
const LUZES_MS = 3500; // regras de F1: o tempo até acender a primeira das cinco luzes (a largada vem 4 s mais a espera sorteada depois)
// regras de F1: a transmissão de TV (a pista, o clima, o campeonato e o grid) tem tempo próprio ANTES das luzes: 25 s numa
// temporada (com a tabela do campeonato), 20 s fora dela. `CORRIDA_TV_MS` troca os dois (0 desliga: os testes de rede usam).
const TV_TEMPORADA_MS = 25000, TV_AVULSA_MS = 20000; // (2026-11-25, o Thiago: "pode aumentar o tempo total para uns 20 s, aí dá tempo de exibir tudo com calma": o grid em pares, transmissao.js)
// (antes: a avulsa foi de 20 para 8 s em 2026-11-11, "a largada demorava demais"; dá para pular nas duas)
const HORAS_CARREIRA = 72, SALA_VAZIA_MS = Number(process.env.CORRIDA_SALA_VAZIA_MS) || 120000; // (os GPs da carreira ficam 3 dias; a sala rápida sem ninguém, 2 min)
const ESPERA_CHEGADA = 20000; // (depois da chegada de quem joga, o tempo para os robôs perto cruzarem a linha: estimarRobos)
const MAX_PLAYERS = 8, COUNTDOWN_MS = 4500, AFTER_FIRST_MS = 60000, MAX_RACE_MS = 45 * 60000; // 45 min: dá para as 21 voltas
const COLORS = ["#e63946", "#1e88e5", "#43a047", "#fdd835", "#8e24aa", "#fb8c00", "#00acc1", "#f06292"];
const PAWNS = ["😎", "🤠", "👽", "🤖", "🐸", "🦊", "🐼", "🐯", "🦄", "🐙", "👻", "🤡", "🦁", "🐵", "🐧", "🏎️"];
const int = (v, d) => { const n = parseInt(v); return Number.isFinite(n) ? n : d; };
const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : NaN);
// o capacete de quem joga (mods.capacete; f1-capacetes.js): só o que o editor oferece, e o nome curto e sem símbolos
const DESENHOS_CAPACETE = ["e_moderno", "e_classico", "e_mono", "e_racing", "e_geometrico", "e_galaxia", "e_neon", "e_vintage", "e_camuflado", "e_flame", "e_gradiente", "e_minimalista", "e_retro", "e_carbono", "e_split", "e_tech", "faixa", "bandas", "blocos", "cruz", "topo", "asas", "triangulos", "generico", "chamas", "onda", "degrade", "raio", "xadrez", "estrelas", "listras", "geometrico", "laminas", "garras", "corte", "velocidade", "stripe", "linhas", "topografico", "minimalista", "faixas", "pinceladas", "audi"], HEX = /^#[0-9a-f]{6}$/i;
function limparCapacete(c) {
  if (!c || typeof c !== "object") return null;
  const cores = Array.isArray(c.cores) ? c.cores.slice(0, 3) : [];
  if (!(DESENHOS_CAPACETE.includes(c.desenho) || /^(p_[A-Z]{3}|t_[a-z]{3,16})$/.test(c.desenho || "")) || // (p_XXX: os capacetes dos pilotos do grid, f1-capacetes-estilos.js ESTILOS_PILOTOS)
    cores.length !== 3 || !cores.every((x) => HEX.test(x)) || !HEX.test(c.viseira || "")) return null;
  const bandeira = /^[A-Z]{2}$/.test(c.bandeira || "") ? c.bandeira : "", nome = String(c.nome || "").normalize("NFC").replace(/[^\p{L}\p{N} .\-]/gu, "").trim().slice(0, 14);
  // (2026-11-14) o "Padrão" (0 a 3), o acabamento do casco e o patrocínio: os mesmos de f1-capacetes.js (VARIANTES, ACABAMENTOS, PATROCINIOS, LUGARES_PATROCINIO)
  const variante = [0, 1, 2, 3].includes(c.variante) ? c.variante : 0;
  const acabamento = ["brilho", "fosco", "acetinado", "metal", "perola", "camaleao", "flocos", "carbono", "cromo"].includes(c.acabamento) ? c.acabamento : "brilho";
  const patrocinio = ["vila", "galera", "energia", "pneus"].includes(c.patrocinio) ? c.patrocinio : "";
  // (2026-11-15) um patrocínio por lugar (os selos da galera ou as marcas dos carros, f1-capacetes.js MARCAS_CAPACETE: só o id curto passa) e a placa atrás deles
  const patrocinios = {};
  if (c.patrocinios && typeof c.patrocinios === "object") for (const l of ["testa", "faixa", "lados", "nuca", "queixo"]) { const v = c.patrocinios[l]; if (typeof v === "string" && /^[a-z0-9]{1,20}$/.test(v)) patrocinios[l] = v; }
  const fundoPatrocinio = ["auto", "escuro", "claro", "cor"].includes(c.fundoPatrocinio) ? c.fundoPatrocinio : "auto";
  return { desenho: c.desenho, cores, viseira: c.viseira, bandeira, nome, variante, acabamento, patrocinio, patrocinios, fundoPatrocinio };
}

// (2026-11-25) o seu piloto em pixel art (mods.pixel; o montador, piloto-pixel-editor.js; as listas são as de pixel-piloto.js): só o que o montador oferece
const PIXEL = { cabelo: ["curto", "raspado", "topete", "ondulado", "cacheado", "longo", "trancas", "calvo"], cor: ["preto", "castanho-escuro", "castanho", "castanho-claro", "loiro-escuro", "loiro", "ruivo", "grisalho"],
  barba: ["nenhuma", "rala", "cheia", "bigode", "cavanhaque"], olhos: ["castanho", "escuro", "azul", "verde", "mel"], rosto: ["oval", "fino", "largo", "quadrado"], nariz: ["pequeno", "medio", "grande"], sobr: ["fina", "media", "grossa"] };
function limparPixel(t) {
  if (!t || typeof t !== "object") return null;
  const r = { pele: [0, 1, 2, 3, 4, 5].includes(t.pele) ? t.pele : 1 };
  const PADRAO = { cabelo: "curto", cor: "castanho", barba: "nenhuma", olhos: "castanho", rosto: "oval", nariz: "medio", sobr: "media" };
  for (const [k, l] of Object.entries(PIXEL)) r[k] = l.includes(t[k]) ? t[k] : PADRAO[k];
  r.risca = t.risca === "esq" || t.risca === "dir" ? t.risca : null;
  for (const k of ["sorriso", "oculos", "brinco"]) r[k] = t[k] === true;
  return r;
}
module.exports = { limparPixel, nomesDe, PERF, medirPerf, ROBOS_F1_MS, CARGA_MAX_MS, LUZES_MS, TV_TEMPORADA_MS, TV_AVULSA_MS, HORAS_CARREIRA, SALA_VAZIA_MS, ESPERA_CHEGADA, MAX_PLAYERS, COUNTDOWN_MS, AFTER_FIRST_MS, MAX_RACE_MS, COLORS, PAWNS, int, num, DESENHOS_CAPACETE, HEX, limparCapacete };
