// Corrida da Galera — as temporadas de F1 que dá para escolher (2023, 2024, 2025 e 2026), o mesmo no servidor e no navegador.
// Cada ano tem as equipes (nome, sigla e cor daquele ano), os pilotos titulares com número e nível, a força de cada carro
// (o orçamento de f1-equipes.js) e o calendário (só com as pistas que o jogo tem; Ímola e Portimão ficam de fora).
// As equipes guardam o id de 2026 da "linhagem" (AlphaTauri e RB são "racing-bulls"; Alfa Romeo e Sauber são "audi"): assim as
// pinturas, os logos, os capacetes e o rádio continuam achando a equipe. A Cadillac só existe em 2026.
// `usarAno(ano)` troca, no lugar, as tabelas de f1-pilotos-2026.js (EQUIPES e PILOTOS), de f1-equipes.js (EQUIPES) e o calendário de
// temporada/regras.js: quem já leu essas tabelas vê o ano novo. O servidor chama antes de mexer numa sala (corrida.js, com o `ano` da
// config) e na carreira (corrida-temporada.js, com o `anoF1` do save); o navegador ao montar a sala e a sede.
(function (root) {

const ANOS = [2026, 2025, 2024, 2023];
const ANO_PADRAO = 2026;

// a equipe de cada ano: [id da linhagem, nome, sigla, cor]
const EQUIPES_ANO = {
  2025: [["mclaren", "McLaren", "MCL", "#ff8000"], ["mercedes", "Mercedes", "MER", "#27f4d2"], ["red-bull", "Red Bull", "RBR", "#3671c6"], ["ferrari", "Ferrari", "FER", "#e8002d"],
    ["williams", "Williams", "WIL", "#64c4ff"], ["racing-bulls", "Racing Bulls", "RB", "#6692ff"], ["aston-martin", "Aston Martin", "AMR", "#229971"], ["haas", "Haas", "HAS", "#b6babd"],
    ["audi", "Sauber", "SAU", "#52e252"], ["alpine", "Alpine", "ALP", "#0093cc"]],
  2024: [["mclaren", "McLaren", "MCL", "#ff8000"], ["ferrari", "Ferrari", "FER", "#e8002d"], ["red-bull", "Red Bull", "RBR", "#3671c6"], ["mercedes", "Mercedes", "MER", "#27f4d2"],
    ["aston-martin", "Aston Martin", "AMR", "#229971"], ["alpine", "Alpine", "ALP", "#0093cc"], ["haas", "Haas", "HAS", "#b6babd"], ["racing-bulls", "RB", "RB", "#6692ff"],
    ["williams", "Williams", "WIL", "#64c4ff"], ["audi", "Sauber", "SAU", "#52e252"]],
  2023: [["red-bull", "Red Bull", "RBR", "#3671c6"], ["mercedes", "Mercedes", "MER", "#6cd3bf"], ["ferrari", "Ferrari", "FER", "#f91536"], ["mclaren", "McLaren", "MCL", "#f58020"],
    ["aston-martin", "Aston Martin", "AMR", "#358c75"], ["alpine", "Alpine", "ALP", "#2293d1"], ["williams", "Williams", "WIL", "#37bedd"], ["racing-bulls", "AlphaTauri", "AT", "#5e8faa"],
    ["audi", "Alfa Romeo", "ALF", "#c92d4b"], ["haas", "Haas", "HAS", "#b6babd"]],
};
// a força do carro: o orçamento de pontos de f1-equipes.js (2026 tem de 15 a 20; a Red Bull de 2023 ganhou 21 de 22 GPs)
const ORCAMENTO_ANO = {
  2025: { mclaren: 21, mercedes: 19, "red-bull": 19, ferrari: 19, williams: 17, "racing-bulls": 16, "aston-martin": 16, haas: 16, audi: 16, alpine: 14 },
  2024: { mclaren: 20, ferrari: 19, "red-bull": 19, mercedes: 19, "aston-martin": 16, alpine: 15, haas: 16, "racing-bulls": 16, williams: 15, audi: 14 },
  2023: { "red-bull": 21, mercedes: 18, ferrari: 18, mclaren: 17, "aston-martin": 18, alpine: 16, williams: 15, "racing-bulls": 15, audi: 15, haas: 15 },
};
// os titulares: [id, nome, sigla, número, equipe, ritmo, constância, largada] (o nível é estimado pelo que cada um fez naquele ano)
const PILOTOS_ANO = {
  2025: [
    ["norris", "Lando Norris", "NOR", 4, "mclaren", 96, 93, 84], ["piastri", "Oscar Piastri", "PIA", 81, "mclaren", 95, 92, 86],
    ["russell", "George Russell", "RUS", 63, "mercedes", 94, 93, 87], ["antonelli", "Kimi Antonelli", "ANT", 12, "mercedes", 89, 82, 86],
    ["verstappen", "Max Verstappen", "VER", 1, "red-bull", 98, 96, 93], ["tsunoda", "Yuki Tsunoda", "TSU", 22, "red-bull", 84, 80, 82],
    ["leclerc", "Charles Leclerc", "LEC", 16, "ferrari", 95, 90, 88], ["hamilton", "Lewis Hamilton", "HAM", 44, "ferrari", 91, 90, 85],
    ["albon", "Alexander Albon", "ALB", 23, "williams", 88, 89, 84], ["sainz", "Carlos Sainz", "SAI", 55, "williams", 89, 88, 86],
    ["hadjar", "Isack Hadjar", "HAD", 6, "racing-bulls", 85, 80, 82], ["lawson", "Liam Lawson", "LAW", 30, "racing-bulls", 83, 79, 80],
    ["alonso", "Fernando Alonso", "ALO", 14, "aston-martin", 91, 92, 90], ["stroll", "Lance Stroll", "STR", 18, "aston-martin", 79, 79, 78],
    ["ocon", "Esteban Ocon", "OCO", 31, "haas", 85, 85, 83], ["bearman", "Oliver Bearman", "BEA", 87, "haas", 84, 81, 83],
    ["hulkenberg", "Nico Hülkenberg", "HUL", 27, "audi", 86, 87, 84], ["bortoleto", "Gabriel Bortoleto", "BOR", 5, "audi", 81, 78, 80],
    ["gasly", "Pierre Gasly", "GAS", 10, "alpine", 87, 86, 85], ["colapinto", "Franco Colapinto", "COL", 43, "alpine", 79, 74, 78],
  ],
  2024: [
    ["norris", "Lando Norris", "NOR", 4, "mclaren", 95, 91, 82], ["piastri", "Oscar Piastri", "PIA", 81, "mclaren", 92, 90, 85],
    ["leclerc", "Charles Leclerc", "LEC", 16, "ferrari", 95, 90, 88], ["sainz", "Carlos Sainz", "SAI", 55, "ferrari", 92, 90, 87],
    ["verstappen", "Max Verstappen", "VER", 1, "red-bull", 98, 96, 93], ["perez", "Sergio Pérez", "PER", 11, "red-bull", 84, 80, 80],
    ["hamilton", "Lewis Hamilton", "HAM", 44, "mercedes", 93, 91, 86], ["russell", "George Russell", "RUS", 63, "mercedes", 93, 92, 87],
    ["alonso", "Fernando Alonso", "ALO", 14, "aston-martin", 90, 92, 90], ["stroll", "Lance Stroll", "STR", 18, "aston-martin", 79, 79, 78],
    ["gasly", "Pierre Gasly", "GAS", 10, "alpine", 87, 86, 85], ["ocon", "Esteban Ocon", "OCO", 31, "alpine", 85, 85, 83],
    ["hulkenberg", "Nico Hülkenberg", "HUL", 27, "haas", 87, 87, 84], ["magnussen", "Kevin Magnussen", "MAG", 20, "haas", 83, 80, 84],
    ["tsunoda", "Yuki Tsunoda", "TSU", 22, "racing-bulls", 85, 81, 82], ["ricciardo", "Daniel Ricciardo", "RIC", 3, "racing-bulls", 83, 82, 81],
    ["albon", "Alexander Albon", "ALB", 23, "williams", 88, 88, 84], ["colapinto", "Franco Colapinto", "COL", 43, "williams", 79, 74, 78],
    ["bottas", "Valtteri Bottas", "BOT", 77, "audi", 84, 86, 80], ["zhou", "Zhou Guanyu", "ZHO", 24, "audi", 80, 81, 78],
  ],
  2023: [
    ["verstappen", "Max Verstappen", "VER", 1, "red-bull", 99, 97, 93], ["perez", "Sergio Pérez", "PER", 11, "red-bull", 88, 82, 82],
    ["hamilton", "Lewis Hamilton", "HAM", 44, "mercedes", 94, 92, 87], ["russell", "George Russell", "RUS", 63, "mercedes", 91, 90, 86],
    ["leclerc", "Charles Leclerc", "LEC", 16, "ferrari", 94, 88, 88], ["sainz", "Carlos Sainz", "SAI", 55, "ferrari", 92, 90, 87],
    ["norris", "Lando Norris", "NOR", 4, "mclaren", 93, 90, 82], ["piastri", "Oscar Piastri", "PIA", 81, "mclaren", 88, 86, 82],
    ["alonso", "Fernando Alonso", "ALO", 14, "aston-martin", 94, 93, 91], ["stroll", "Lance Stroll", "STR", 18, "aston-martin", 80, 79, 78],
    ["gasly", "Pierre Gasly", "GAS", 10, "alpine", 87, 85, 85], ["ocon", "Esteban Ocon", "OCO", 31, "alpine", 86, 85, 84],
    ["albon", "Alexander Albon", "ALB", 23, "williams", 88, 88, 84], ["sargeant", "Logan Sargeant", "SAR", 2, "williams", 74, 72, 74],
    ["tsunoda", "Yuki Tsunoda", "TSU", 22, "racing-bulls", 84, 80, 81], ["ricciardo", "Daniel Ricciardo", "RIC", 3, "racing-bulls", 83, 82, 81],
    ["bottas", "Valtteri Bottas", "BOT", 77, "audi", 85, 86, 80], ["zhou", "Zhou Guanyu", "ZHO", 24, "audi", 80, 81, 78],
    ["hulkenberg", "Nico Hülkenberg", "HUL", 27, "haas", 86, 86, 84], ["magnussen", "Kevin Magnussen", "MAG", 20, "haas", 83, 80, 84],
  ],
};
// o calendário de cada ano, na ordem real (só as pistas que o jogo tem)
const NOMES = { melbourne: "Austrália", xangai: "China", suzuka: "Japão", bahrein: "Bahrein", jeddah: "Arábia Saudita", miami: "Miami", montreal: "Canadá", monaco: "Mônaco",
  barcelona: "Espanha", redbullring: "Áustria", silverstone: "Grã-Bretanha", spa: "Bélgica", hungaroring: "Hungria", zandvoort: "Holanda", monza: "Itália", madri: "Madri",
  baku: "Azerbaijão", singapura: "Singapura", austin: "Estados Unidos", mexico: "Cidade do México", interlagos: "São Paulo", lasvegas: "Las Vegas", catar: "Catar", abudhabi: "Abu Dhabi" };
const CALENDARIO_ANO = {
  2025: ["melbourne", "xangai", "suzuka", "bahrein", "jeddah", "miami", "monaco", "barcelona", "montreal", "redbullring", "silverstone", "spa", "hungaroring", "zandvoort", "monza", "baku", "singapura", "austin", "mexico", "interlagos", "lasvegas", "catar", "abudhabi"],
  2024: ["bahrein", "jeddah", "melbourne", "suzuka", "xangai", "miami", "monaco", "montreal", "barcelona", "redbullring", "silverstone", "hungaroring", "spa", "zandvoort", "monza", "baku", "singapura", "austin", "mexico", "interlagos", "lasvegas", "catar", "abudhabi"],
  2023: ["bahrein", "jeddah", "melbourne", "baku", "miami", "monaco", "barcelona", "montreal", "redbullring", "silverstone", "hungaroring", "spa", "zandvoort", "monza", "singapura", "suzuka", "catar", "austin", "mexico", "interlagos", "lasvegas", "abudhabi"],
};

const req = (nome, global) => root[global] || (typeof require === "function" ? require(nome) : null);
const Pilotos = () => req("./f1-pilotos-2026.js", "F1Pilotos"), Equipes = () => req("./f1-equipes.js", "F1Equipes");
const RegrasTemporada = () => { try { return root.F1Temporada || (typeof require === "function" ? require("./temporada/regras.js") : null); } catch (e) { return null; } };

let BASE = null; // as tabelas de 2026 como vieram dos arquivos (cópias), para voltar a elas
function guardarBase() {
  if (BASE) return BASE;
  const P = Pilotos(), E = Equipes(), R = RegrasTemporada();
  BASE = { equipes: { ...P.EQUIPES }, pilotos: P.PILOTOS.slice(), carros: { ...E.EQUIPES }, calendario: R && R.CALENDARIO ? R.CALENDARIO.slice() : null };
  return BASE;
}
const anoValido = (ano) => (ANOS.includes(Number(ano)) ? Number(ano) : ANO_PADRAO);
const trocar = (alvo, novo) => { for (const k of Object.keys(alvo)) delete alvo[k]; Object.assign(alvo, novo); };

// a montagem padrão de uma equipe naquele ano: a de 2026 da linhagem, com pontos tirados ou postos até fechar o orçamento
function padraoDoAno(base, orcamento) {
  const m = { ...base.padrao }, ordem = ["motor", "aero", "chassi", "freios", "suspensao", "confiab"], soma = () => ordem.reduce((s, k) => s + m[k], 0);
  for (let i = 0; soma() < orcamento && i < 60; i++) { const k = ordem[i % ordem.length]; if (m[k] < 8) m[k]++; }
  for (let i = 0; soma() > orcamento && i < 60; i++) { const k = ordem[ordem.length - 1 - (i % ordem.length)]; if (m[k] > 0) m[k]--; }
  return m;
}

const cache = {};
function tabelasDoAno(ano) {
  if (cache[ano]) return cache[ano];
  const b = guardarBase();
  if (ano === ANO_PADRAO) return (cache[ano] = { equipes: b.equipes, pilotos: b.pilotos, carros: b.carros, calendario: b.calendario });
  const equipes = {}, carros = {};
  for (const [id, nome, sigla, cor] of EQUIPES_ANO[ano]) {
    equipes[id] = { ...b.equipes[id], nome, sigla, cor };
    const base = b.carros[id], orcamento = ORCAMENTO_ANO[ano][id];
    carros[id] = { ...base, orcamento, padrao: padraoDoAno(base, orcamento) };
  }
  const pilotos = PILOTOS_ANO[ano].map(([id, nome, sigla, numero, equipe, ritmo, constancia, largada]) =>
    ({ id, nome, curto: nome.split(" ")[0][0] + ". " + nome.split(" ").slice(1).join(" "), sigla, numero, equipe, ritmo, constancia, largada }));
  const calendario = CALENDARIO_ANO[ano].map((p) => [p, NOMES[p]]);
  return (cache[ano] = { equipes, pilotos, carros, calendario });
}

let ANO = ANO_PADRAO;
function usarAno(ano) {
  ano = anoValido(ano);
  if (ano === ANO && BASE) return ano;
  const t = tabelasDoAno(ano), P = Pilotos(), E = Equipes(), R = RegrasTemporada();
  trocar(P.EQUIPES, t.equipes); P.PILOTOS.splice(0, P.PILOTOS.length, ...t.pilotos); trocar(E.EQUIPES, t.carros);
  if (R && R.CALENDARIO && t.calendario) { R.CALENDARIO.splice(0, R.CALENDARIO.length, ...t.calendario); if (R.PISTAS_TRABALHADAS) R.PISTAS_TRABALHADAS.splice(0, R.PISTAS_TRABALHADAS.length, ...t.calendario.map(([p]) => p)); }
  ANO = ano;
  return ano;
}
const anoAtual = () => ANO;
const nomeDoAno = (ano) => `Temporada ${anoValido(ano)}`;

const api = { ANOS, ANO_PADRAO, anoValido, usarAno, anoAtual, nomeDoAno, CALENDARIO_ANO };
if (typeof module !== "undefined" && module.exports) module.exports = api;
else root.F1Temporadas = api;
})(typeof window !== "undefined" ? window : globalThis);
