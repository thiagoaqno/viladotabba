// Corrida da Galera — o comando de voz: aperte e solte a tecla do Jeff (Caps Lock, ou a que estiver na tela Controles: ação "voz"; no controle,
// o botão que a pessoa escolher). O rádio apita (Radio.bipe), o Jeff fica ouvindo e fecha sozinho depois de SILENCIO_MS sem fala (ou no
// máximo MAX_MS); aí o que o navegador entendeu (Web Speech API, em português) vai para o Jeff (jeff-comandos.js entende, mfd.js
// `executarJeff` faz e responde). Apertar de novo enquanto ouve fecha na hora. Funciona no Chrome e no Edge (o programa de PC abre no
// Edge); no Firefox não existe: o aviso diz. O reconhecimento é do serviço do navegador (precisa de internet); o microfone é pedido na primeira vez.
import { toast } from "./estado.js";
import { executarJeff } from "./mfd.js";

const SILENCIO_MS = 2000, ESPERA_MS = 500, MAX_MS = 12000; // (2 s de silêncio + até 0,5 s pelo resultado final: o Jeff responde até 2,5 s depois da última palavra; antes eram 3 s + 2,5 s)
const Rec = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
let rec = null, ouvindo = false, fechando = false, texto = "", parcial = "", avisado = false, tSilencio = 0, tMax = 0, tEspera = 0;

function criar() {
  const r = new Rec(); r.lang = "pt-BR"; r.continuous = true; r.interimResults = true; r.maxAlternatives = 3;
  r.onresult = (e) => {
    let fim = "", meio = "";
    for (let i = 0; i < e.results.length; i++) { const res = e.results[i]; if (res.isFinal) fim += " " + res[0].transcript; else meio += " " + res[0].transcript; }
    texto = fim.trim(); parcial = meio.trim();
    if (!fechando) { toast("🎙️ Jeff ouvindo… " + (texto + " " + parcial).trim(), 8000); contarSilencio(); } // (cada pedaço de fala recomeça a contagem do silêncio)
  };
  r.onerror = (e) => {
    if (e.error === "not-allowed" || e.error === "service-not-allowed") toast("🎙️ O microfone está bloqueado. Libere o microfone para este site para falar com o Jeff.", 5000);
    else if (e.error === "network") toast("🎙️ Sem internet para o reconhecimento de voz.", 3500);
  };
  r.onend = () => { const era = ouvindo; ouvindo = false; limparTempos(); if (era) entregar(); };
  return r;
}
function limparTempos() { clearTimeout(tSilencio); clearTimeout(tMax); clearTimeout(tEspera); }
function contarSilencio() { clearTimeout(tSilencio); tSilencio = setTimeout(fechar, SILENCIO_MS); }
// o que foi ouvido vai para o Jeff (uma vez por escuta)
function entregar() {
  const J = window.JeffComandos, frase = (texto || parcial).trim(); texto = parcial = ""; fechando = false;
  if (!frase) { executarJeff(null, ""); return; }
  executarJeff(J ? J.entender(frase) : null, frase);
}
// para de ouvir: o resultado final chega no `onend` (com um limite, se o navegador demorar)
function fechar() {
  if (!ouvindo || fechando) return;
  fechando = true; clearTimeout(tSilencio); clearTimeout(tMax);
  try { rec.stop(); } catch (e) { /* já parou */ }
  tEspera = setTimeout(() => { if (ouvindo) { try { rec.abort(); } catch (e) {} } }, ESPERA_MS); // (o abort também chama o onend, que entrega o que já foi entendido)
}

// apertou: começa a ouvir (o rádio apita); apertou de novo ouvindo: fecha na hora
export function comecarVoz() {
  if (!Rec) { if (!avisado) { avisado = true; toast("🎙️ Este navegador não tem reconhecimento de voz. Use o Chrome, o Edge ou o programa de PC.", 4500); } return; }
  if (ouvindo) { fechar(); return; }
  try {
    rec = rec || criar(); texto = parcial = ""; fechando = false; rec.start(); ouvindo = true;
    try { window.Radio?.bipe?.(); } catch (e) { /* sem som */ }
    toast("🎙️ Jeff ouvindo…", 8000); contarSilencio(); tMax = setTimeout(fechar, MAX_MS);
  } catch (e) { ouvindo = false; }
}
export const vozDisponivel = () => !!Rec;
