// Corrida da Galera — o engenheiro de equipe no rádio. Script comum (window.Radio) usado na garagem, na temporada e na corrida.
// Toca radio/<id>.mp3 (gerado por GERAR-VOZES-CORRIDA.bat); sem o arquivo, não toca nada (sem texto na tela e sem erro). O botão do fone liga e
// desliga a voz (store `corrida:radio`), sem mexer no som geral; sem legenda. A voz passa por um filtro de rádio
// (passa-faixa de 300 a 3000 Hz, com chiado e um clique antes e depois) e pelo volume geral (`master` de sons.js).
(function (root) {
const F = (typeof module !== "undefined" && module.exports) ? require("./radio/falas.js") : root.RadioFalas;
const INTERVALO = 10000; // no máximo uma fala a cada 10 s, salvo as urgentes (box, safety car): o rádio não pode cansar
const ESPERA = 30000;   // a mesma situação não se repete antes disso
const ESPERA_SIT = { ganhou: 90000, perdeu: 90000, dano: 60000, pneu: 60000, rival: 50000 }; // as que acontecem toda hora falam bem menos
const espera = (fn, ms) => { const t = setTimeout(fn, ms); if (t && t.unref) t.unref(); return t; };
const temDOM = typeof document !== "undefined" && typeof window !== "undefined";

// ---------- a escolha (pura, testável) ----------
// Uma variação da situação, sem repetir a última dita. `rnd` devolve [0, 1).
function escolher(situacao, ultimoId, rnd = Math.random) {
  // as falas da temporada em uso (radio/falas.js POR_ANO): somam às de sempre, ou ficam sozinhas nas de SO_DO_ANO
  const ano = root.F1Temporadas && root.F1Temporadas.anoAtual ? root.F1Temporadas.anoAtual() : null, doAno = ano ? F.porSituacao(`${situacao}-${ano}`) : [];
  const todas = doAno.length && (F.SO_DO_ANO || []).includes(situacao) ? doAno : F.porSituacao(situacao).concat(doAno); if (!todas.length) return null;
  const opcoes = todas.length > 1 ? todas.filter((f) => f.id !== ultimoId) : todas;
  return opcoes[Math.min(opcoes.length - 1, Math.floor(rnd() * opcoes.length))];
}

// ---------- o estado ----------
let ultimoId = null, ultimaFala = -Infinity, tocando = false, fila = [];
const porSituacao = {}, faltam = new Set(), buffers = new Map();
let mudo = false, saida = null, ac = null, ganho = null, timerFila = 0;
try { mudo = JSON.parse(localStorage.getItem("corrida:radio")) === false; } catch {}

// o contexto de áudio: o de sons.js (com o volume geral) se ele se apresentar; senão um próprio
function usarSaida(fn) { saida = fn; }
function contexto() {
  try {
    const s = saida && saida(); if (s && s.ac) return { c: s.ac, destino: s.saida, abafar: s.abafar };
    if (!ac) {
      const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
      ac = new C(); ganho = ac.createGain(); let v = 0.7;
      try { const x = JSON.parse(localStorage.getItem("corrida:volume")); if (typeof x === "number") v = x; } catch {}
      ganho.gain.value = v; ganho.connect(ac.destination);
    }
    return { c: ac, destino: ganho };
  } catch { return null; }
}

// ---------- o botão ----------
function desenharBotoes() {
  if (!temDOM) return;
  const risco = mudo ? '<path d="M3 3l18 18"/>' : "";
  document.querySelectorAll("[data-radio-botao]").forEach((b) => {
    b.setAttribute("aria-pressed", String(!mudo)); b.classList.toggle("mudo", mudo);
    b.title = mudo ? "Voz do engenheiro desligada" : "Voz do engenheiro ligada";
    b.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>${risco}</svg>`;
  });
}
function silenciar(v) {
  mudo = v == null ? !mudo : !!v;
  try { localStorage.setItem("corrida:radio", JSON.stringify(!mudo)); } catch {}
  if (mudo) fila = [];
  desenharBotoes(); return mudo;
}
if (temDOM) {
  document.addEventListener("click", (e) => { const b = e.target.closest && e.target.closest("[data-radio-botao]"); if (b) { silenciar(); e.stopPropagation(); } }, true);
  const primeiro = () => { const x = contexto(); if (x && x.c.state === "suspended") x.c.resume(); carregarAberturas(); proximo(); }; // (bip.mp3: a abertura do rádio, se o arquivo existir) // o navegador só libera o áudio depois de um toque
  window.addEventListener("pointerdown", primeiro, { once: true, capture: true }); window.addEventListener("keydown", primeiro, { once: true, capture: true });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", desenharBotoes); else desenharBotoes();
}

// ---------- tocar ----------
function carregar(f) {
  if (faltam.has(f.id)) return Promise.resolve(null);
  if (buffers.has(f.id)) return Promise.resolve(buffers.get(f.id));
  const x = contexto(); if (!x || typeof fetch !== "function") return Promise.resolve(null);
  return fetch(`/corrida/radio/${f.id}.mp3`).then((r) => { if (!r.ok) throw new Error("sem arquivo"); return r.arrayBuffer(); })
    .then((b) => x.c.decodeAudioData(b)).then((buf) => (buffers.set(f.id, buf), buf)).catch(() => (faltam.add(f.id), null)); // sem mp3: fica em silêncio
}
// as aberturas gravadas do rádio (os bipes antes da voz, da ElevenLabs: GERAR-SONS-PISTA.bat, "radio-bip"): o índice dos sons
// (sons/indice.json) diz quantas versões há; cada fala sorteia uma. Sem nenhuma, tenta o radio/bip.mp3 antigo.
const aberturas = [];
function carregarAberturas() {
  const x = contexto(); if (!x || typeof fetch !== "function" || aberturas.carregando) return; aberturas.carregando = true;
  fetch("/corrida/sons/indice.json").then((r) => (r.ok ? r.json() : {})).then((ind) => {
    const n = (ind && ind["radio-bip"]) || 0;
    if (!n) return carregar({ id: "bip" }).then((b) => { if (b) aberturas.push(b); });
    for (let k = 1; k <= n; k++) fetch(`/corrida/sons/radio-bip-${k}.mp3`).then((r) => (r.ok ? r.arrayBuffer() : null)).then((b) => b && x.c.decodeAudioData(b)).then((buf) => { if (buf) aberturas.push(buf); }).catch(() => {});
  }).catch(() => {});
}
function ruido(c, dur, vol, destino, t) {
  const n = Math.max(1, Math.floor(c.sampleRate * dur)), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = c.createBufferSource(), g = c.createGain(), fl = c.createBiquadFilter();
  fl.type = "bandpass"; fl.frequency.value = 2200; g.gain.value = vol; s.buffer = b; s.connect(fl).connect(g).connect(destino); s.start(t);
}
// o bipe do rádio da equipe (sintetizado): uma onda quadrada curta, abafada como o rádio (passa-baixa de 3 kHz)
function bip(c, f, dur, vol, destino, t) {
  const o = c.createOscillator(), g = c.createGain(), fl = c.createBiquadFilter();
  o.type = "square"; o.frequency.value = f; fl.type = "lowpass"; fl.frequency.value = 3000;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.006); g.gain.setValueAtTime(vol, t + dur - 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(fl).connect(g).connect(destino); o.start(t); o.stop(t + dur + 0.02);
}
// a abertura do rádio, antes da voz: o arquivo /corrida/radio/bip.mp3, se existir (o som de verdade, quando o Thiago achar); sem ele, o
// sintetizado: o chiado de abrir o canal e dois bipes subindo. Devolve quantos segundos ela dura (a voz entra depois)
function abertura(c, destino, t) {
  const b = aberturas.length ? aberturas[Math.floor(Math.random() * aberturas.length)] : null;
  if (b) { const s = c.createBufferSource(); s.buffer = b; s.connect(destino); s.start(t); return b.duration + 0.03; }
  ruido(c, 0.06, 0.07, destino, t);
  bip(c, 1150, 0.06, 0.05, destino, t + 0.05); bip(c, 1550, 0.08, 0.05, destino, t + 0.13);
  return 0.26;
}
// o HUD mostra o cartão "RÁDIO" do engenheiro enquanto ele fala (evento `radio:fala` com { on })
function avisarFala(on, atraso) { if (!temDOM) return; const ir = () => window.dispatchEvent(new CustomEvent("radio:fala", { detail: { on } })); if (atraso > 0.01) setTimeout(ir, atraso * 1000); else ir(); }
function tocar(buf, fim) {
  const x = contexto(); if (!x || x.c.state === "suspended") return false;
  const c = x.c, t = c.currentTime + 0.02;
  const alto = c.createBiquadFilter(), baixo = c.createBiquadFilter(), g = c.createGain(), s = c.createBufferSource();
  alto.type = "highpass"; alto.frequency.value = 300; baixo.type = "lowpass"; baixo.frequency.value = 3000; g.gain.value = 2.6; s.buffer = buf;
  const comp = c.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4; // (a voz mais alta que o motor, sem estourar)
  s.connect(alto).connect(baixo).connect(g).connect(comp).connect(x.destino);
  if (x.abafar) x.abafar(true);
  const ini = t + abertura(c, x.destino, t);                   // o chiado e os bipes de abrir o rádio
  avisarFala(true, ini - c.currentTime);
  s.start(ini); ruido(c, buf.duration + 0.04, 0.012, x.destino, ini); // chiado leve por baixo da voz
  ruido(c, 0.1, 0.07, x.destino, ini + buf.duration);         // o clique de fechar
  if (!aberturas.length) bip(c, 950, 0.07, 0.04, x.destino, ini + buf.duration + 0.05); // e um bipe mais grave
  s.onended = () => { if (x.abafar) x.abafar(false); avisarFala(false, 0); fim(); }; return true;
}
function proximo() {
  clearTimeout(timerFila); if (tocando || !fila.length) return;
  const agora = Date.now(), f = fila[0], urgente = F.URGENTES.includes(f.quando);
  if (!urgente && agora - ultimaFala < INTERVALO) { timerFila = espera(proximo, INTERVALO - (agora - ultimaFala) + 20); return; }
  fila.shift(); ultimaFala = agora; ultimoId = f.id; porSituacao[f.quando] = agora;
  if (mudo || !temDOM) { timerFila = espera(proximo, 50); return; }
  tocando = true;
  const livre = () => { tocando = false; ultimaFala = Date.now(); timerFila = espera(proximo, 80); }; // a fila não sobrepõe: a próxima só começa quando esta acaba
  const reserva = () => { const r = f.reserva && escolher(f.reserva, null); return r ? carregar(r) : null; }; // (a fala nova ainda sem mp3: a de reserva, `op.reserva` em dizer)
  (f.partes ? emendar(f.partes) : carregar(f)).then((buf) => buf || reserva()).then((buf) => { if (!buf || !tocar(buf, livre)) livre(); }).catch(livre);
}

// as falas montadas em pedaços (RadioFalas.PECAS): carrega cada mp3 e junta num buffer só, com uma pausa curta entre eles, para o rádio
// abrir e fechar uma vez. O pedaço que falta (o nome de quem não tem mp3) fica de fora; com menos de dois, não fala nada.
function emendar(ids) {
  return Promise.all(ids.map((id) => carregar({ id }))).then((bufs) => {
    const ok = bufs.filter(Boolean), x = contexto(); if (ok.length < 2 || !x) return null;
    const sr = ok[0].sampleRate, pausa = Math.round(sr * 0.06), n = ok.reduce((a, b) => a + b.length, 0) + pausa * (ok.length - 1);
    const out = x.c.createBuffer(1, n, sr), d = out.getChannelData(0); let pos = 0;
    for (const b of ok) { d.set(b.getChannelData(0).subarray(0, b.length), pos); pos += b.length + pausa; }
    return out;
  });
}
// uma fala em pedaços (ids de RadioFalas.PECAS), com a situação `quando` contando no intervalo dela
function frase(partes, quando, op = {}) {
  try {
    const agora = Date.now();
    if (!op.forcar && agora - (porSituacao[quando] || -Infinity) < (ESPERA_SIT[quando] || ESPERA)) return null;
    if (fila.length && !op.forcar) return null;
    const f = { id: partes.join("+"), partes: partes.filter(Boolean), quando }; porSituacao[quando] = agora;
    if (op.forcar) fila.unshift(f); else fila.push(f);
    proximo(); return f;
  } catch { return null; }
}
// um pedaço de um grupo (frente, tras, chegando...), sem repetir o último do mesmo grupo
const ultimoPedaco = {};
function pedaco(quando) {
  const l = F.pecasDe ? F.pecasDe(quando) : []; if (!l.length) return null;
  const op = l.length > 1 ? l.filter((p) => p.id !== ultimoPedaco[quando]) : l, p = op[Math.floor(Math.random() * op.length)];
  ultimoPedaco[quando] = p.id; return p.id;
}

// pede a fala de uma situação; devolve a escolhida (ou null se ficou de fora). `op.reserva`: outra situação que toca se esta ainda não tem mp3
function dizer(situacao, op = {}) {
  try {
    if (!F.SITUACOES[situacao]) return null;
    const agora = Date.now(), urgente = F.URGENTES.includes(situacao);
    if (!op.forcar && agora - (porSituacao[situacao] || -Infinity) < (ESPERA_SIT[situacao] || ESPERA)) return null;
    if (!urgente && fila.length && !op.forcar) return null; // não acumula fala velha; pedidos do piloto são explícitos
    const e = escolher(situacao, ultimoId); if (!e) return null; const f = op.reserva ? { ...e, reserva: op.reserva } : e;
    ultimoId = f.id; porSituacao[situacao] = agora;
    if (urgente || op.forcar) fila.unshift(f); else fila.push(f);
    proximo(); return f;
  } catch { return null; }
}

// ---------- as ligações com o jogo ----------
let posAtual = null, posCand = null, posDesde = 0, posChave = null, posInicio = 0;
function posicao(pos, chave) { // a posição na torre: ganhou/perdeu depois de ficar 2 s no lugar novo
  const agora = Date.now();
  if (chave !== posChave) { posChave = chave; posAtual = pos; posCand = null; posInicio = agora; return; }
  if (agora - posInicio < 12000) { posAtual = pos; return; } // a confusão da largada fica de fora
  if (pos === posAtual) { posCand = null; return; }
  if (posCand !== pos) { posCand = pos; posDesde = agora; return; }
  if (agora - posDesde >= 2000) { dizer(pos < posAtual ? "ganhou" : "perdeu"); posAtual = pos; posCand = null; }
}
const vistos = new Set();
function uma(chave, fn) { if (vistos.has(chave)) return; vistos.add(chave); fn(); } // uma vez por chave (a corrida, o pneu...)
function avisoF1(tipo) { // `tipo` vem de AvisosF1.tipoDoTexto
  const s = { sc: "safety", amarela: "amarela", quebra: "dano", batida: "dano", drs: "drs", vmr: "voltarapida", punicao: "punicao", preta: "abandono" }[tipo];
  if (s) dizer(s);
}
function fim(pos, pontos, dnf) { dizer(dnf ? "abandono" : pos === 1 ? "vitoria" : pos <= 3 ? "podio" : pontos > 0 ? "pontos" : "foradospontos", { forcar: true }); }
function classificacao(pos, total) { dizer(pos <= Math.ceil(total / 3) ? "classboa" : pos > Math.floor(total * 2 / 3) ? "classruim" : "", { forcar: true }); }

const api = { escolher, dizer, frase, pedaco, usarSaida, posicao, uma, avisoF1, fim, classificacao, silenciar, desenharBotoes, get mudo() { return mudo; }, get tocando() { return tocando; }, INTERVALO };
if (typeof module !== "undefined" && module.exports) module.exports = api; else root.Radio = api;
})(typeof self !== "undefined" ? self : this);
