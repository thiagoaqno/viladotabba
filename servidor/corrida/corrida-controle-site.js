// Corrida da Galera — o controle no celular pelo SITE (2026-11-25, o Thiago: "a gente precisa levar o controle para o site também"). No programa
// de PC o celular fala com o PC pela rede de casa (corrida-controle.js, HTTPS na porta 31518); no site não há rede de casa: o celular e o jogo falam
// com o servidor do site, e ele junta os dois por um CÓDIGO curto. O jogo pede o código ("abrir"), mostra https://<site>/c/<código>, e o celular
// abre esse endereço (ou /c e digita o código). Daí em diante é igual ao de casa, com os mesmos eventos: o celular manda "e" (a entrada, até 60 por
// segundo) e "acao", e o jogo manda "painel"; o jogo recebe "estado" ({ ligado, enderecos, celulares, codigo }) como no de casa.
// O código: 5 letras e números sem os que se confundem; vale enquanto o jogo estiver ligado e mais 10 minutos depois que ele sai (para voltar à
// sala sem trocar de código). O site é HTTPS: o iPhone entrega o giroscópio.

const LETRAS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", TAM = 5, FOLGA_MS = 10 * 60 * 1000, MAX_CELULARES = 3;
const pares = new Map(); // código -> { jogo, celulares: Set, solto (hora em que o jogo saiu) }

function novoCodigo() {
  for (let n = 0; n < 50; n++) { let c = ""; for (let i = 0; i < TAM; i++) c += LETRAS[Math.floor(Math.random() * LETRAS.length)]; if (!pares.has(c)) return c; }
  return null;
}
const limpo = (c) => String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, TAM);
function faxina() { const agora = Date.now(); for (const [c, p] of pares) if (!p.jogo && p.solto && agora - p.solto > FOLGA_MS) { for (const s of p.celulares) s.disconnect(true); pares.delete(c); } }

function attach(io, app) {
  const origem = (s) => { const h = s.handshake.headers || {}, proto = String(h["x-forwarded-proto"] || "").split(",")[0] || (s.handshake.secure ? "https" : "http"); return `${proto}://${h["x-forwarded-host"] || h.host || "viladotabba.com"}`; };
  const estado = (p, codigo, s) => ({ ligado: true, codigo, enderecos: [`${origem(s)}/c/${codigo}`], celulares: p.celulares.size });
  io.of("/controle-par").on("connection", (s) => {
    const cod = limpo(s.handshake.auth && s.handshake.auth.codigo);
    // ---- o celular (chega com o código) ----
    if (s.handshake.auth && s.handshake.auth.celular) {
      const p = cod && pares.get(cod);
      if (!p) { s.emit("jogo", { ligado: false, erro: "código" }); s.disconnect(true); return; }
      if (p.celulares.size >= MAX_CELULARES) { s.emit("jogo", { ligado: false, erro: "cheio" }); s.disconnect(true); return; }
      p.celulares.add(s); s.emit("jogo", { ligado: !!p.jogo });
      if (p.jogo) p.jogo.emit("estado", estado(p, cod, p.jogo));
      s.on("e", (d) => { if (p.jogo && d && typeof d === "object") p.jogo.volatile.emit("e", d); });
      s.on("acao", (a) => { if (p.jogo && typeof a === "string" && a.length < 20) p.jogo.emit("acao", a); });
      s.on("disconnect", () => { p.celulares.delete(s); if (p.jogo) p.jogo.emit("estado", estado(p, cod, p.jogo)); });
      return;
    }
    // ---- o jogo ----
    let meu = null; // o código deste jogo
    const prender = (c) => { const p = pares.get(c); p.jogo = s; p.solto = 0; meu = c; for (const x of p.celulares) x.emit("jogo", { ligado: true }); return p; };
    s.on("jogo", (d, cb) => { // (re)conectou: se ele já tinha um código e o código está livre, volta para ele
      const c = limpo(d && d.codigo), p = c && pares.get(c);
      if (p && (!p.jogo || p.jogo === s)) { prender(c); if (typeof cb === "function") cb(estado(p, c, s)); }
      else if (typeof cb === "function") cb({ ligado: false, enderecos: [], celulares: 0 });
    });
    s.on("abrir", (d, cb) => {
      faxina();
      let c = meu || limpo(d && d.codigo); if (!c || !pares.has(c) || (pares.get(c).jogo && pares.get(c).jogo !== s)) c = null;
      if (!c) { c = novoCodigo(); if (!c) { if (typeof cb === "function") cb({ ligado: false, enderecos: [], celulares: 0 }); return; } pares.set(c, { jogo: null, celulares: new Set(), solto: 0 }); }
      const p = prender(c); if (typeof cb === "function") cb(estado(p, c, s));
    });
    s.on("painel", (dados) => { const p = meu && pares.get(meu); if (p && p.jogo === s && dados && typeof dados === "object") for (const x of p.celulares) x.volatile.emit("painel", dados); });
    s.on("disconnect", () => { const p = meu && pares.get(meu); if (p && p.jogo === s) { p.jogo = null; p.solto = Date.now(); for (const x of p.celulares) x.emit("jogo", { ligado: false }); } });
  });
  // o endereço que se abre no celular: /c/<código> (e /c, para digitar o código). No programa de PC, o /c de corrida-controle.js vem antes
  app.get("/c/:codigo", (req, res) => res.redirect("/corrida/controle.html?k=" + encodeURIComponent(limpo(req.params.codigo))));
  app.get("/c", (req, res) => res.redirect("/corrida/controle.html"));
}

module.exports = { attach, _pares: pares };
