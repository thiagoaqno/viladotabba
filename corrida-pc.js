// Corrida da Galera — o PROGRAMA DE PC (desktop/: o instalador para Windows, feito pelo workflow programa-pc.yml). Atualização: corrida-pc-atualizar.js.
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

  // a carreira solo que o programa leva para o PC (trazerCarreiraDoSite): quem tem o token (o navegador do programa) recebe o save
  app.post("/api/corrida/pc/carreira", require("express").json({ limit: "4kb" }), (req, res) => {
    try {
      const l = bd().temporadaCorridaPorToken(req.body?.token);
      if (!l) return res.status(404).json({ ok: false });
      res.set("Cache-Control", "no-store").json({ ok: true, nome: l.nome, dados: l.dados });
    } catch { res.status(500).json({ ok: false }); }
  });

  // (2026-11-15) a carreira jogada no programa sobe para cá (enviarCarreiraAoSite): o mesmo código de recuperação passa a valer no navegador
  app.post("/api/corrida/pc/carreira-enviar", require("express").json({ limit: "8mb" }), (req, res) => {
    try {
      const b = req.body || {}, r = bd().receberTemporadaDoPC(b.token, b.recuperacaoHash, b.nome, b.dados);
      res.set("Cache-Control", "no-store").status(r ? 200 : 400).json({ ok: !!r, ...(r || {}) });
    } catch { res.status(500).json({ ok: false }); }
  });

  const Atualizar = require("./corrida-pc-atualizar.js");
  Atualizar.rotasDoSite(app); // a lista dos arquivos do programa e cada arquivo, para ele se atualizar (só com o sim de quem joga)

  // ---- daqui para baixo, só no programa de PC ----
  let online = false, ultimoAviso = "", pendente = null;
  // ao abrir, com internet: confere se o site tem arquivos novos, SEM baixar (corrida-pc-atualizar.js); o jogo pergunta antes
  const conferindo = SITE ? Atualizar.conferir(SITE).then((p) => { pendente = p; }).catch((e) => console.warn("Atualização:", e.message)) : Promise.resolve();
  app.get("/corrida/pc.js", async (req, res) => {
    await Promise.race([conferindo, new Promise((ok) => setTimeout(ok, 4000))]); // (a primeira página espera a conferência, até 4 s)
    const atualizacao = pendente && (pendente.grande ? { grande: true, link: pendente.link, notas: pendente.notas } : { n: pendente.arquivos.length, mb: Math.max(0.1, Math.round(pendente.bytes / 1e5) / 10), reabrir: pendente.servidor, notas: pendente.notas });
    res.set("Cache-Control", "no-store").type("application/javascript");
    res.send(`window.CORRIDA_PC = ${JSON.stringify({ pc: !!SITE, servidor: online ? SITE : "", aviso: ultimoAviso, atualizacao })};\n${PC_JS}`);
  });
  if (!SITE) return;
  let baixando = null;
  app.post("/corrida/pc/atualizar", async (req, res) => { // o "Baixar agora" da pergunta (só existe no programa, que escuta em 127.0.0.1)
    if (!pendente || pendente.grande) return res.json({ ok: false, erro: "Nada para baixar." });
    try {
      const p = pendente, feitos = await (baixando ||= Atualizar.baixar(SITE, p).finally(() => { baixando = null; }));
      if (feitos === p.arquivos.length) pendente = null;
      res.json({ ok: feitos === p.arquivos.length, feitos, total: p.arquivos.length, reabrir: p.servidor });
    } catch (e) { res.json({ ok: false, erro: e.message }); }
  });
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
  // (2026-11-16, o Thiago: "guarda tudo localmente e, quando a corrida acabar, aí ele manda") Ler todos os recordes do banco e mandar ao site roda no
  // mesmo processo que move os robôs: no meio da corrida (ou do qualify) a conferência espera e tenta de novo a cada 5 s, até a bandeirada.
  const emCorrida = () => { try { return !!require("./corrida.js").emCorrida?.(); } catch { return false; } };
  let esperando = null;
  const conferirFora = () => { if (!emCorrida()) { conferir(); return; } if (!esperando) esperando = setInterval(() => { if (!emCorrida()) { clearInterval(esperando); esperando = null; conferir(); } }, 5000).unref(); };
  conferirFora(); setInterval(conferirFora, 60000).unref();
  semEconomiaDeEnergia(); vigiarLaco();
}
// (2026-11-16, os carros travando e "teleportando" só no aplicativo, ~500 ms; no servidor do terminal, não) No aplicativo o servidor roda ESCONDIDO,
// sem janela, e o Windows pode pôr esse processo na economia de energia (power throttling/EcoQoS): os timers atrasam e o pedido de timer preciso é
// ignorado. O servidor sobe a própria prioridade e pede, uma vez, para sair dessa economia (SetProcessInformation, ProcessPowerThrottling, com o
// controle de velocidade e o de timer desligados). O lançador novo (desktop/Corrida.cs) faz o mesmo; isto cobre os programas já instalados.
function semEconomiaDeEnergia() {
  if (process.platform !== "win32") return;
  try { const os = require("os"); os.setPriority(0, os.constants.priority.PRIORITY_ABOVE_NORMAL); } catch (e) { console.warn("Corrida PC: prioridade não mudou:", e.message); }
  const ps = `Add-Type -TypeDefinition 'using System;using System.Runtime.InteropServices;public static class P{[StructLayout(LayoutKind.Sequential)]public struct S{public uint V;public uint C;public uint St;}[DllImport("kernel32.dll")]public static extern IntPtr OpenProcess(uint a,bool b,int p);[DllImport("kernel32.dll")]public static extern bool SetProcessInformation(IntPtr h,int c,ref S s,int n);}';$h=[P]::OpenProcess(0x0200,$false,${process.pid});$s=New-Object P+S;$s.V=1;$s.C=5;$s.St=0;$ok=[P]::SetProcessInformation($h,4,[ref]$s,12);if(-not $ok){$s.C=1;$ok=[P]::SetProcessInformation($h,4,[ref]$s,12);'so a velocidade (Windows 10): '+$ok}else{'velocidade e timer: '+$ok}`; // (a opção do timer só existe no Windows 11: sem ela, só a velocidade)
  try {
    const f = require("child_process").spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-WindowStyle", "Hidden", "-Command", ps], { windowsHide: true, stdio: ["ignore", "pipe", "ignore"] });
    let saida = ""; f.stdout.on("data", (d) => { saida += d; }); f.on("close", () => console.log("Corrida PC: fora da economia de energia do Windows:", saida.trim() || "sem resposta")); f.on("error", () => {});
  } catch (e) { console.warn("Corrida PC: economia de energia não mudou:", e.message); }
}
// o laço vigiado: um tique a cada 50 ms; atrasou mais de 150 ms, uma linha no servidor.log (%LOCALAPPDATA%\CorridaDaGalera), no máximo uma a cada 2 s
function vigiarLaco() {
  let ant = Date.now(), ultimoLog = 0, pior = 0, n = 0, piorMin = 0, ultimoMin = Date.now();
  setInterval(() => {
    const agora = Date.now(), atraso = agora - ant - 50; ant = agora; piorMin = Math.max(piorMin, atraso);
    // (2026-11-16, o Thiago: "corri até 11:55 e o log parou às 11:50") o silêncio não prova nada: uma linha por minuto com corrida rodando, mesmo sem travada
    if (agora - ultimoMin >= 60000) { const f = (() => { try { return require("./corrida.js").faseAgora?.(); } catch { return null; } })(); if (f) console.log(`${new Date().toLocaleTimeString("pt-BR")} Corrida PC: tudo certo no último minuto, o pior atraso foi ${Math.max(0, piorMin)} ms · ${f}`); ultimoMin = agora; piorMin = 0; }
    if (atraso > 150) { n++; pior = Math.max(pior, atraso); if (agora - ultimoLog > 2000) { ultimoLog = agora; console.log(`${new Date().toLocaleTimeString("pt-BR")} Corrida PC: o laço atrasou ${atraso} ms (${n} vezes, o pior ${pior} ms) · ${(() => { try { return require("./corrida.js").faseAgora?.() || "fora de corrida"; } catch { return "?"; } })()}`); } }
  }, 50).unref();
}

// A CARREIRA SOLO no programa roda no PC (sem ping nos GPs). Na primeira vez, o save que está no site vem para o banco do PC com o mesmo
// token (corrida-temporada.js, "abrir"); dali em diante a carreira é a do PC. Sem programa (o site) ou sem internet: null.
async function trazerCarreiraDoSite(token) {
  if (!SITE || typeof token !== "string") return null;
  try {
    const r = await fetch(SITE + "/api/corrida/pc/carreira", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token }), signal: AbortSignal.timeout(10000) });
    if (!r.ok) return null;
    const d = await r.json();
    return d?.ok ? require("./bd.js").importarTemporadaCorrida(token, d.nome, d.dados) : null;
  } catch { return null; }
}

// O caminho de volta: no programa, cada vez que a carreira solo muda (abrir, decidir, fechar um GP), o save sobe para o site com o hash do
// código de recuperação do PC (bd.js receberTemporadaDoPC). Assim o código que o programa mostra também abre a carreira no navegador.
// Sem internet não sobe (e tenta de novo na próxima mudança). Fora do programa (no site), não faz nada.
const enviando = new Map();
function enviarCarreiraAoSite(token, linha) {
  if (!SITE || typeof token !== "string" || !linha) return;
  clearTimeout(enviando.get(linha.id));
  enviando.set(linha.id, setTimeout(async () => {
    enviando.delete(linha.id);
    try {
      const B = require("./bd.js"), h = B.hashesDaTemporadaCorrida(linha.id), fresco = B.temporadaCorridaPorId(linha.id); if (!h || !fresco) return;
      await fetch(SITE + "/api/corrida/pc/carreira-enviar", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, recuperacaoHash: h.recuperacao_hash, nome: fresco.nome, dados: fresco.dados }), signal: AbortSignal.timeout(20000) });
    } catch { /* sem internet: sobe na próxima mudança */ }
  }, 1500));
}

// O que roda no navegador do programa (logo depois do /socket.io/socket.io.js, antes dos módulos): com o site no ar, os sockets e os
// /api/ de DADOS vão para o site; os arquivos e o que é calculado do próprio jogo (logos, traçado dos robôs, músicas) seguem no PC.
const PC_JS = `(function () {
  var C = window.CORRIDA_PC, S = C && C.servidor;
  // o jogo SOZINHO (corrida rápida direto, contrarrelógio, treino da carreira: menu.js, ?solo= e ?treino=) roda sempre no PC, mesmo com
  // internet: sem ping, o carro responde na hora. O site fica para as salas com os amigos, a carreira e os recordes (que sobem sozinhos).
  // O GP da carreira solo também (sede.js manda para /corrida/?sala=<código>&pc=1; rede.js mantém o pc=1 num F5): a carreira solo é a do PC.
  if (C && C.pc && /[?&](solo|treino|pc)=/.test(location.search)) { C.local = true; S = ""; }
  // no programa, um selo discreto no canto: online (salas do site), no PC (sozinho, ou sem internet) e o aviso de atualização quando houver
  if (C && C.pc) addEventListener("DOMContentLoaded", function () { var d = document.createElement("div"); d.textContent = C.aviso || (C.local ? "Sozinho, rodando no seu PC (sem ping)" : S ? "Online" : "Sem internet: jogando no seu PC"); d.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:99999;padding:4px 8px;font:600 12px system-ui,sans-serif;color:#fff;background:" + (C.aviso ? "#b8860bdd" : S ? "#1e7e34aa" : "#444a") + ";pointer-events:none;max-width:60vw"; document.body.appendChild(d); if (!C.aviso) setTimeout(function () { d.remove(); }, 6000); });
  // a pergunta da atualização, ao abrir o jogo (só no menu; "Agora não" vale até fechar o programa): baixa só o que mudou, e só com o sim
  var A = C && C.atualizacao, menu = location.pathname === "/corrida/" && !/[?&](sala|solo|treino)=/.test(location.search), adiado = false;
  try { adiado = sessionStorage.getItem("corrida:pc:adiar") === "1"; } catch (e) {}
  if (A && menu && !adiado) addEventListener("DOMContentLoaded", function () {
    var f = document.createElement("div"), bt = "padding:10px 16px;border:0;font:700 14px system-ui,sans-serif;cursor:pointer;margin:14px 8px 0 0";
    f.style.cssText = "position:fixed;inset:0;z-index:100000;display:grid;place-items:center;background:#000a;font:500 15px/1.4 system-ui,sans-serif;color:#fff";
    f.innerHTML = '<div role="dialog" aria-label="Atualização da Corrida" style="max-width:420px;margin:16px;padding:20px 22px;background:#11141c;border-top:4px solid #e10600;box-shadow:0 10px 40px #000a"><b style="font-size:19px">Tem atualização da Corrida</b><p data-t style="margin:8px 0 0;color:#cfd3dc"></p><div data-b></div></div>';
    var t = f.querySelector("[data-t]"), b = f.querySelector("[data-b]");
    // as notas: o que mudou (public/corrida/novidades.json do site, as entradas que este PC ainda não tem)
    if (A.notas && A.notas.length) { var ul = document.createElement("ul"); ul.style.cssText = "margin:10px 0 0;padding-left:18px;color:#fff;max-height:40vh;overflow:auto"; A.notas.forEach(function (n) { (n.itens || []).forEach(function (x) { var li = document.createElement("li"); li.textContent = x; li.style.margin = "3px 0"; ul.appendChild(li); }); }); t.parentNode.insertBefore(ul, b); }
    if (A.grande) { t.textContent = "Desta vez mudou o motor do jogo: precisa baixar o instalador de novo e instalar por cima (as suas configurações ficam)."; b.innerHTML = '<a href="' + A.link + '" target="_blank" style="display:inline-block;' + bt + ';background:#e10600;color:#fff;text-decoration:none">Baixar o instalador</a><button data-n style="' + bt + ';background:#ffffff22;color:#fff">Agora não</button>'; }
    else { t.textContent = A.n + (A.n === 1 ? " arquivo" : " arquivos") + ", " + String(A.mb).replace(".", ",") + " MB. Baixa só o que mudou."; b.innerHTML = '<button data-s style="' + bt + ';background:#e10600;color:#fff">Baixar agora</button><button data-n style="' + bt + ';background:#ffffff22;color:#fff">Agora não</button>'; }
    f.addEventListener("click", function (e) {
      if (e.target.hasAttribute("data-n")) { try { sessionStorage.setItem("corrida:pc:adiar", "1"); } catch (x) {} f.remove(); }
      if (e.target.hasAttribute("data-s")) {
        t.textContent = "Baixando..."; b.innerHTML = "";
        window.fetch("/corrida/pc/atualizar", { method: "POST" }).then(function (r) { return r.json(); }).then(function (r) {
          if (!r.ok) { t.textContent = "Não deu para baixar tudo agora (" + (r.feitos || 0) + " de " + (r.total || "?") + "). Tente de novo na próxima vez que abrir."; b.innerHTML = '<button data-n style="' + bt + ';background:#ffffff22;color:#fff">Fechar</button>'; return; }
          if (r.reabrir) { t.textContent = "Pronto! Feche e abra o jogo para usar a versão nova."; b.innerHTML = '<button data-n style="' + bt + ';background:#ffffff22;color:#fff">Fechar</button>'; }
          else location.reload();
        }).catch(function () { t.textContent = "Sem conexão agora. Tente de novo na próxima vez que abrir."; b.innerHTML = '<button data-n style="' + bt + ';background:#ffffff22;color:#fff">Fechar</button>'; });
      }
    });
    document.body.appendChild(f);
  });
  if (!S) return;
  // (a carreira SOLO, o canal /corrida-temporada, fica sempre no PC: sem ping nos GPs; a com os amigos, /corrida-temporada-grupo, é do site)
  if (window.io) { var io0 = window.io, io1 = function (ns, op) { return io0(typeof ns === "string" && ns.charAt(0) === "/" && ns !== "/corrida-temporada" ? S + ns : ns, op); }; for (var k in io0) io1[k] = io0[k]; window.io = io1; }
  var LOCAL = /^\\/api\\/(corrida\\/logo|corrida\\/linha|corrida\\/drag\\/musicas|musicas)/, f0 = window.fetch.bind(window);
  window.fetch = function (u, op) { return f0(typeof u === "string" && u.indexOf("/api/") === 0 && !LOCAL.test(u) ? S + u : u, op); };
})();`;

module.exports = { attach, corsPC, PROTOCOLO, trazerCarreiraDoSite, enviarCarreiraAoSite };
