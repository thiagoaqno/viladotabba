// Corrida da Galera — o editor do capacete de quem joga na etapa "Carro" da sala: o cartão (desenho, as três cores, a viseira, a bandeira e o
// nome, com a prévia em 3D) está em capacete-editor-ui.js, o mesmo da Central da carreira. Aqui só a ligação com a sala: o capacete vai em
// `mods.capacete` (act "mods"; corrida.js `limparCapacete` confere), assim os outros o veem na pista (f1-piloto.js), e vai junto para toda
// sala em que você entrar (`sincronizarCapacete`).
import { E, $, me, act } from "./estado.js";
import { montarEditorCapacete, lerCapacete } from "./capacete-editor-ui.js";

let enviarT = 0, enviadoPara = null;
// manda para a sala uma vez, 1,2 s depois do último clique (cada envio faz o servidor mandar o estado para todos: a cada clique, a sala
// de todo mundo era redesenhada)
function enviar(cap) { clearTimeout(enviarT); enviarT = setTimeout(() => { if (me() && E.S && E.S.phase !== "race") act("mods", { mods: { capacete: cap } }); }, 1200); }
// ao entrar numa sala (ou quando ela volta para a sala de espera): o capacete guardado vai para lá, uma vez por sala
export function sincronizarCapacete() {
  const m = me(), salvo = lerCapacete(); if (!m || !salvo || !E.S || E.S.phase === "race") return;
  const chave = E.S.code + ":" + m.id; if (enviadoPara === chave) return; enviadoPara = chave;
  if (JSON.stringify(m.mods?.capacete || null) !== JSON.stringify(salvo)) act("mods", { mods: { capacete: salvo } });
}

// o cartão do editor (dentro de `#capaceteCartao`)
export function renderCapacete() {
  const el = $("capaceteCartao"); if (!el) return;
  montarEditorCapacete(el, { numero: () => me()?.numero ?? null, aoMudar: enviar });
}
