// Corrida da Galera — o PROGRAMA DE PC (desktop/: o instalador para Windows, feito pelo workflow programa-pc.yml).
// O programa leva o jogo inteiro (os arquivos de public/ e este servidor, com um node.exe) e roda tudo no próprio PC, em 127.0.0.1:
//  - SEM internet: tudo local (corrida rápida, contrarrelógio, carreira solo, o banco num SQLite em %LOCALAPPDATA%);
//  - COM internet: os arquivos continuam saindo do PC (nada de baixar 100 MB a cada vez), mas as salas, a carreira e os recordes são os do
//    site (a VPS): o /corrida/pc.js diz ao navegador para onde ligar o socket e os /api/ de dados (window.CORRIDA_SERVIDOR).
//    Só liga no site se o PROTOCOLO dele for o mesmo deste programa; senão fica local e avisa que tem atualização.
//  - os recordes feitos sem internet sobem para o site quando a internet volta (POST /api/corrida/recordes-offline). O site só troca um
//    recorde por um tempo MENOR (bd.registrarRecordeCorrida), então mandar de novo o que já foi não muda nada.
// No site (a VPS), este arquivo só abre a rota de versão, a de recordes vindos do programa e o CORS para a origem do programa.
// PROTOCOLO: subir de 1 em 1 quando a conversa do navegador com o servidor da Corrida mudar a ponto de um programa antigo não jogar
// direito no site (eventos do socket, física de sim.js/dinamica.js). Com isso, o programa velho para de entrar no site e pede o update.
const PROTOCOLO = 1;
const ORIGEM_PC = /^http:\/\/(127\.0\.0\.1|localhost):\d+$/; // o programa abre o jogo sempre em 127.0.0.1 (desktop/Corrida.cs)
const SITE = (process.env.CORRIDA_SITE || "").replace(/\/+$/, ""); // só no programa de PC: o endereço do site (desktop/site.txt)

const corsPC = (origem, cb) => cb(null, !origem || ORIGEM_PC.test(origem));

function attach(app) {
  const bd = () => require("./bd.js");
  // o CORS dos dados para a origem do programa (os GET de /api/ que o navegador do programa faz direto no site)
  app.use("/api/", (req, res, next) => {
    const o = req.headers.origin;
    if (o && ORIGEM_PC.test(o)) { res.set("Access-Control-Allow-Origin", o); res.set("Vary", "Origin"); }
    next();
  });
  app.get("/api/corrida/versao", (req, res) => res.set("Cache-Control", "no-store").json({ protocolo: PROTOCOLO }));
  // os recordes que o programa fez sem internet: [{ pista, piloto, tempo, carro }] e os setores [{ pista, setor, piloto, tempo }]
  app.post("/api/corrida/recordes-offline", require("express").json({ limit: "64kb" }), (req, res) => {
    const T = require("./public/corrida/pistas.js").PISTAS, b = req.body || {};
    const texto = (v, n) => typeof v === "string" && v.trim() && v.length <= n ? v.trim() : null;
    let aceitos = 0;
    try {
      for (const r of (Array.isArray(b.recordes) ? b.recordes : []).slice(0, 300)) {
        const piloto = texto(r?.piloto, 40), carro = texto(r?.carro, 40) || "f1";
        if (!Object.hasOwn(T, r?.pista) || !piloto || !(r.tempo > 0 && r.tempo < 600)) continue;
        if (bd().registrarRecordeCorrida(r.pista, r.tempo, carro, piloto)) aceitos++;
      }
      for (const r of (Array.isArray(b.setores) ? b.setores : []).slice(0, 300)) {
        const piloto = texto(r?.piloto, 40);
        if (!Object.hasOwn(T, r?.pista) || ![0, 1, 2].includes(r?.setor) || !piloto || !(r.tempo > 0 && r.tempo < 300)) continue;
        bd().registrarSetorCorrida(r.pista, r.setor, r.tempo, piloto);
      }
      res.json({ ok: true, aceitos });
    } catch (e) { res.status(500).json({ ok: false }); }
  });

  const Atualizar = require("./corrida-pc-atualizar.js");
  Atualizar.rotasDoSite(app); // a lista dos arquivos do programa e cada arquivo, para ele se atualizar sozinho

  // ---- daqui para baixo, só no programa de PC ----
  let online = false, ultimoAviso = "", avisoAtualizacao = "";
  app.get("/corrida/pc.js", (req, res) => {
    res.set("Cache-Control", "no-store").type("application/javascript");
    res.send(`window.CORRIDA_PC = ${JSON.stringify({ pc: !!SITE, servidor: online ? SITE : "", aviso: avisoAtualizacao || ultimoAviso })};\n${PC_JS}`);
  });
  if (!SITE) return;
  // ao abrir, com internet: baixa só os arquivos que mudaram no site (corrida-pc-atualizar.js); vale na próxima abertura
  setTimeout(() => Atualizar.atualizar(SITE, (t) => { avisoAtualizacao = t; }).catch((e) => console.warn("Atualização:", e.message)), 3000).unref();
  async function conferir() {
    try {
      const r = await fetch(SITE + "/api/corrida/versao", { signal: AbortSignal.timeout(5000) }), v = await r.json();
      online = v.protocolo === PROTOCOLO;
      ultimoAviso = online ? "" : "Tem atualização do programa no site: até baixar, as salas online ficam fechadas e o jogo roda no seu PC.";
      if (online) await subirRecordes();
    } catch { online = false; ultimoAviso = ""; }
  }
  async function subirRecordes() {
    const rec = bd().recordesCorrida(), set = bd().setoresCorrida();
    const recordes = Object.entries(rec).flatMap(([pista, l]) => l.map((x) => ({ pista, piloto: x.piloto, tempo: x.tempo, carro: x.carro })));
    const setores = Object.entries(set).flatMap(([pista, l]) => l.map((x, setor) => x && { pista, setor, piloto: x.piloto, tempo: x.tempo }).filter(Boolean));
    if (!recordes.length && !setores.length) return;
    await fetch(SITE + "/api/corrida/recordes-offline", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ recordes, setores }), signal: AbortSignal.timeout(10000) });
  }
  conferir(); setInterval(conferir, 60000).unref();
}

// O que roda no navegador do programa (logo depois do /socket.io/socket.io.js, antes dos módulos): com o site no ar, os sockets e os
// /api/ de DADOS vão para o site; os arquivos e o que é calculado do próprio jogo (logos, traçado dos robôs, músicas) seguem no PC.
const PC_JS = `(function () {
  var C = window.CORRIDA_PC, S = C && C.servidor;
  // o jogo SOZINHO (corrida rápida direto, contrarrelógio, treino da carreira: menu.js, ?solo= e ?treino=) roda sempre no PC, mesmo com
  // internet: sem ping, o carro responde na hora. O site fica para as salas com os amigos, a carreira e os recordes (que sobem sozinhos).
  if (C && C.pc && /[?&](solo|treino)=/.test(location.search)) { C.local = true; S = ""; }
  // no programa, um selo discreto no canto: online (salas do site), no PC (sozinho, ou sem internet) e o aviso de atualização quando houver
  if (C && C.pc) addEventListener("DOMContentLoaded", function () { var d = document.createElement("div"); d.textContent = C.aviso || (C.local ? "Sozinho, rodando no seu PC (sem ping)" : S ? "Online" : "Sem internet: jogando no seu PC"); d.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:99999;padding:4px 8px;font:600 12px system-ui,sans-serif;color:#fff;background:" + (C.aviso ? "#b8860bdd" : S ? "#1e7e34aa" : "#444a") + ";pointer-events:none;max-width:60vw"; document.body.appendChild(d); if (!C.aviso) setTimeout(function () { d.remove(); }, 6000); });
  if (!S) return;
  if (window.io) { var io0 = window.io, io1 = function (ns, op) { return io0(typeof ns === "string" && ns.charAt(0) === "/" ? S + ns : ns, op); }; for (var k in io0) io1[k] = io0[k]; window.io = io1; }
  var LOCAL = /^\\/api\\/(corrida\\/logo|corrida\\/linha|corrida\\/drag\\/musicas|musicas)/, f0 = window.fetch.bind(window);
  window.fetch = function (u, op) { return f0(typeof u === "string" && u.indexOf("/api/") === 0 && !LOCAL.test(u) ? S + u : u, op); };
})();`;

module.exports = { attach, corsPC, PROTOCOLO };
