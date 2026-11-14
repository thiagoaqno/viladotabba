// Corrida da Galera — o comando de voz: segura a tecla do Jeff (G, ou a que estiver na tela Controles: ação "voz"; no controle, o botão que a
// pessoa escolher) e fala; ao soltar, o que o navegador entendeu (Web Speech API, em português) vai para o Jeff (jeff-comandos.js entende,
// mfd.js `executarJeff` faz e responde). Funciona no Chrome e no Edge (o programa de PC abre no Edge); no Firefox não existe: o aviso diz.
// O reconhecimento é do serviço do navegador (precisa de internet); o microfone é pedido na primeira vez.
import { toast } from "./estado.js";
import { executarJeff } from "./mfd.js";

const Rec = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
let rec = null, ouvindo = false, texto = "", parcial = "", soltou = false, avisado = false, tEspera = 0;

function criar() {
  const r = new Rec(); r.lang = "pt-BR"; r.continuous = true; r.interimResults = true; r.maxAlternatives = 3;
  r.onresult = (e) => {
    let fim = "", meio = "";
    for (let i = 0; i < e.results.length; i++) { const res = e.results[i]; if (res.isFinal) fim += " " + res[0].transcript; else meio += " " + res[0].transcript; }
    texto = fim.trim(); parcial = meio.trim();
    if (!soltou) toast("🎙️ Jeff ouvindo… " + (texto + " " + parcial).trim(), 8000);
  };
  r.onerror = (e) => {
    if (e.error === "not-allowed" || e.error === "service-not-allowed") toast("🎙️ O microfone está bloqueado. Libere o microfone para este site para falar com o Jeff.", 5000);
    else if (e.error === "network") toast("🎙️ Sem internet para o reconhecimento de voz.", 3500);
  };
  r.onend = () => { ouvindo = false; if (soltou) entregar(); };
  return r;
}
// o que foi ouvido vai para o Jeff (o melhor entre as alternativas: a primeira que vira comando)
function entregar() {
  clearTimeout(tEspera); const J = window.JeffComandos, frase = (texto || parcial).trim(); texto = parcial = "";
  if (!frase) { executarJeff(null, ""); return; }
  executarJeff(J ? J.entender(frase) : null, frase);
}

// apertou: começa a ouvir
export function comecarVoz() {
  if (!Rec) { if (!avisado) { avisado = true; toast("🎙️ Este navegador não tem reconhecimento de voz. Use o Chrome, o Edge ou o programa de PC.", 4500); } return; }
  if (ouvindo) return;
  try { rec = rec || criar(); texto = parcial = ""; soltou = false; rec.start(); ouvindo = true; toast("🎙️ Jeff ouvindo…", 8000); } catch (e) { ouvindo = false; }
}
// soltou: para de ouvir e o resultado final chega no `onend` (com um limite, se o navegador demorar)
export function pararVoz() {
  if (!Rec || !rec || soltou) return;
  soltou = true;
  if (!ouvindo) { entregar(); return; }
  try { rec.stop(); } catch (e) { /* já parou */ }
  clearTimeout(tEspera); tEspera = setTimeout(() => { if (ouvindo) { ouvindo = false; try { rec.abort(); } catch (e) {} entregar(); } }, 2500);
}
export const vozDisponivel = () => !!Rec;
