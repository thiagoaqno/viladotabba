// Corrida da Galera — o JEFF, o engenheiro que ouve: o que a pessoa falou (o texto do reconhecimento de voz do navegador, voz.js) vira um
// comando. Só a conta, sem nada de tela (UMD: window.JeffComandos no navegador, require() no Node). As frases são as que o Thiago pediu
// (2026-11-13) e os jeitos parecidos de dizer a mesma coisa; o nome "Jeff" no começo (ou o que o reconhecimento entende dele) é ignorado.
// Devolve { tipo, composto? } ou null:
//   box (ir para os boxes; `composto` se disse o pneu junto) · pneu (colocar o pneu `composto`) · completa (atualização completa)
//   frente / tras (o piloto da frente ou de trás) · pneus (o estado dos pneus) · carro (a condição do carro) · previsao (o tempo)
//   gapFrente (a diferença para o da frente) · gapCompanheiro (a diferença para o companheiro de equipe)
(function (root) {
const limpar = (t) => " " + String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]+/g, " ")
  .replace(/\b(jeff?|jefe|djeff?|chefe|geff?|jeffe|jefi)\b/g, " ").replace(/\s+/g, " ").trim() + " ";
const tem = (t, ...palavras) => palavras.some((p) => t.includes(" " + p + " ") || (p.endsWith("*") && t.includes(" " + p.slice(0, -1))));

// o pneu falado (macio, médio, duro, intermediário, chuva); "de chuva" e "molhado" contam como o de chuva
function compostoDe(t) {
  if (tem(t, "macio", "macios", "soft", "vermelho")) return "macio";
  if (tem(t, "medio", "medios", "media", "medium", "amarelo")) return "medio";
  if (tem(t, "duro", "duros", "hard", "branco")) return "duro";
  if (tem(t, "intermediario", "intermediarios", "inter", "intermediaria", "verde")) return "intermediario";
  if (tem(t, "chuva", "molhado", "molhados", "wet", "azul")) return "chuva";
  return null;
}
const PNEU = ["pneu", "pneus", "pneuzinho", "borracha", "composto"];
const BOX = ["box", "boxe", "boxes", "pit", "pits", "parar", "parada", "boca", "box box"];

function entender(texto) {
  const t = limpar(texto); if (t.trim() === "") return null;
  const composto = compostoDe(t), falaPneu = tem(t, ...PNEU), falaBox = tem(t, ...BOX);
  // "atualização completa" (e "me atualiza", "resumo", "como está a corrida")
  if (tem(t, "atualizacao", "atualiza", "atualizar", "resumo", "relatorio") || (tem(t, "corrida") && tem(t, "como", "situacao"))) return { tipo: "completa" };
  // as diferenças: para o companheiro de equipe ou para o da frente
  if (tem(t, "companheiro", "parceiro", "colega", "companheira") || (tem(t, "diferenca", "gap", "distancia") && tem(t, "equipe", "time"))) return { tipo: "gapCompanheiro" };
  if (tem(t, "diferenca", "gap", "distancia", "intervalo") && tem(t, "frente", "fente")) return { tipo: "gapFrente" };
  // a previsão do tempo (antes do pneu: "vai chover?" não é pedir pneu de chuva)
  if (tem(t, "previsao", "tempo", "clima", "chover", "chove", "radar") && !falaPneu && !falaBox && !tem(t, "colocar", "coloca", "bota", "botar", "trocar", "troca", "quero")) return { tipo: "previsao" };
  // colocar um pneu (com ou sem "box"): "colocar pneus macios", "box, médio", "vamos de intermediário"
  if (composto && (falaPneu || falaBox || tem(t, "colocar", "coloca", "bota", "botar", "trocar", "troca", "quero", "vamos", "vai", "manda"))) return falaBox ? { tipo: "box", composto } : { tipo: "pneu", composto };
  // o estado dos pneus e a condição do carro
  if (falaPneu && tem(t, "status", "como", "estado", "condicao", "vida", "gasto", "gastos", "desgaste", "ta", "tao", "estao", "esta")) return { tipo: "pneus" };
  if (tem(t, "carro", "veiculo", "dano", "danos", "diagnostico", "asa") && tem(t, "condicao", "como", "estado", "status", "ta", "esta", "diagnostico", "dano", "danos")) return { tipo: "carro" };
  if (tem(t, "condicao") && tem(t, "veiculo", "carro")) return { tipo: "carro" };
  // quem está na frente e atrás
  if (tem(t, "atras", "tras", "traz", "atraz") || (tem(t, "retrovisor"))) return { tipo: "tras" };
  if (tem(t, "frente", "fente", "adiante")) return { tipo: "frente" };
  // ir para os boxes
  if (falaBox) return composto ? { tipo: "box", composto } : { tipo: "box" };
  if (composto) return { tipo: "pneu", composto };
  if (falaPneu) return { tipo: "pneus" };
  return null;
}

const api = { entender, limpar };
if (typeof module !== "undefined" && module.exports) module.exports = api; else root.JeffComandos = api;
})(typeof window !== "undefined" ? window : globalThis);
