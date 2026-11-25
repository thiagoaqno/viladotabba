// Relé do Tiro da Galera (o Riposte: Frontline em public/tiro/). O jogo já sabe jogar online por um relé WebSocket
// (src/09d-netrelay.js deles): o navegador de quem cria o salon é o "hôte" e roda a partida; os outros entram pelo código
// e o relé só repassa as mensagens. Com o relé, ninguém liga direto no navegador do outro (sem PeerJS, sem IP exposto).
//   ws  /tiro/rele/room/<CÓDIGO>?role=host|guest&id=<id>&key=<chave>
//   GET /tiro/rele/salons   → { salons: [{ c, n, m, o, j, x, p, v }], joueurs }
// Trames: as de controle começam com \x02 e separam os campos com \x01.
//   para o host: sync <ids>, join <id>, leave <id>, refuse <código>
//   do host:     pub <json|''>, kick <id>, ban <id>, e "<id,id,...>\x01<texto>" (texto para esses convidados)
//   para o convidado: host 1|0 ; do convidado: o texto puro, repassado ao host como "<id>\x01<texto>"
// Códigos de fechamento que o jogo entende: 4002 cheio, 4003 excluído, 4004 salão não existe, 4010/4011 conexão trocada.
const { WebSocketServer } = require("ws"); // vem com o socket.io (engine.io depende dele)

const CTL = "\x02", SEP = "\x01";
const BASE = "/tiro/rele";
const MAX_CONVIDADOS = 17; // o jogo deles vai até 18 jogadores por salão (NET_MAX)
const ESPERA_HOST_MS = 20000; // o jogo espera o host voltar 15 s (NETR.hostGrace); depois o salão some
const MAX_SALOES = 300;

module.exports = function ligarReleTiro(server, app) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: 256 * 1024, perMessageDeflate: { threshold: 256 } });
  const saloes = new Map(); // código → { host: { ws, key, id } | null, key, convidados: Map(id → { ws, key }), meta, banidos: Set(ip), fim }

  const ctl = (ws, ...a) => enviar(ws, CTL + a.join(SEP));
  function enviar(ws, txt) { if (ws && ws.readyState === 1 && ws.bufferedAmount < 1024 * 1024) { try { ws.send(txt); } catch { /* fechando */ } } }
  const fechar = (ws, codigo) => { try { ws.close(codigo); } catch { /* já fechada */ } };
  const ipDe = (req) => String(req.headers["cf-connecting-ip"] || (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket.remoteAddress || "");

  function apagar(codigo) {
    const s = saloes.get(codigo); if (!s) return;
    clearTimeout(s.fim); saloes.delete(codigo);
    for (const c of s.convidados.values()) fechar(c.ws, 4004);
  }

  function entrarHost(ws, codigo, id, key) {
    let s = saloes.get(codigo);
    if (s && s.key !== key) { ctl(ws, "refuse", "4011"); return fechar(ws, 4011); } // o código é de outro host
    if (!s) {
      if (saloes.size >= MAX_SALOES) return fechar(ws, 4013);
      s = { host: null, key, convidados: new Map(), meta: "", banidos: new Set(), fim: 0 };
      saloes.set(codigo, s);
    }
    if (s.host) { const velho = s.host.ws; s.host = null; fechar(velho, 4010); } // o mesmo host trocou de conexão
    clearTimeout(s.fim);
    s.host = { ws, key, id };
    ctl(ws, "sync", [...s.convidados.keys()].join(","));
    for (const c of s.convidados.values()) ctl(c.ws, "host", "1");

    ws.on("message", (dado, binario) => {
      if (binario || s.host?.ws !== ws) return;
      const d = dado.toString();
      if (d[0] === CTL) {
        const [cmd, a = ""] = d.slice(1).split(SEP);
        if (cmd === "pub") s.meta = a.length < 600 ? a : "";
        else if (cmd === "kick" || cmd === "ban") {
          const c = s.convidados.get(a); if (!c) return;
          if (cmd === "ban" && c.ip) s.banidos.add(c.ip);
          s.convidados.delete(a); fechar(c.ws, 4003);
        }
        return;
      }
      const corte = d.indexOf(SEP); if (corte < 1) return;
      const txt = d.slice(corte + 1);
      for (const cid of d.slice(0, corte).split(",")) { const c = s.convidados.get(cid); if (c) enviar(c.ws, txt); }
    });
    ws.on("close", () => {
      if (s.host?.ws !== ws) return; // já trocada por uma conexão nova
      s.host = null;
      for (const c of s.convidados.values()) ctl(c.ws, "host", "0");
      s.fim = setTimeout(() => apagar(codigo), ESPERA_HOST_MS);
    });
  }

  function entrarConvidado(ws, codigo, id, key, ip) {
    const s = saloes.get(codigo);
    if (!s) return fechar(ws, 4004);
    if (s.banidos.has(ip)) return fechar(ws, 4003);
    const antigo = s.convidados.get(id);
    if (antigo && antigo.key !== key) return fechar(ws, 4010);
    if (!antigo && s.convidados.size >= MAX_CONVIDADOS) return fechar(ws, 4002);
    if (antigo) { s.convidados.delete(id); fechar(antigo.ws, 4010); }
    const eu = { ws, key, ip };
    s.convidados.set(id, eu);
    if (s.host) ctl(s.host.ws, "join", id);
    ctl(ws, "host", s.host ? "1" : "0");

    ws.on("message", (dado, binario) => {
      if (binario || s.convidados.get(id) !== eu || !s.host) return;
      const d = dado.toString();
      if (d[0] === CTL) return;
      enviar(s.host.ws, id + SEP + d);
    });
    ws.on("close", () => {
      if (s.convidados.get(id) !== eu) return;
      s.convidados.delete(id);
      if (s.host) ctl(s.host.ws, "leave", id);
    });
  }

  server.on("upgrade", (req, socket, head) => {
    const u = new URL(req.url, "http://x");
    const m = u.pathname.match(/^\/tiro\/rele\/room\/([A-Z0-9]{5})$/);
    if (!m) return; // não é do relé: o socket.io cuida
    const role = u.searchParams.get("role"), id = String(u.searchParams.get("id") || ""), key = String(u.searchParams.get("key") || "");
    if (!/^(host|guest)$/.test(role) || !/^[\w-]{1,40}$/.test(id) || !/^[a-z0-9]{8,64}$/i.test(key)) { socket.destroy(); return; }
    wss.handleUpgrade(req, socket, head, (ws) => {
      ws.vivo = true; ws.on("pong", () => { ws.vivo = true; });
      ws.on("error", () => {});
      if (role === "host") entrarHost(ws, m[1], id, key); else entrarConvidado(ws, m[1], id, key, ipDe(req));
    });
  });

  // conexão que caiu sem avisar (celular que perdeu o sinal) some em até 60 s
  setInterval(() => {
    for (const ws of wss.clients) { if (!ws.vivo) { ws.terminate(); continue; } ws.vivo = false; try { ws.ping(); } catch { /* fechando */ } }
  }, 30000).unref();

  // salões públicos (o host manda "pub" com nome, mapa, modo, jogadores, máximo, fase e versão)
  app.get(BASE + "/salons", (req, res) => {
    const salons = [];
    for (const [c, s] of saloes) {
      if (!s.host || !s.meta) continue;
      try { const m = JSON.parse(s.meta); if (m && typeof m === "object") salons.push({ ...m, c }); } catch { /* ignorado */ }
    }
    res.set("Cache-Control", "no-store").json({ salons, joueurs: wss.clients.size });
  });
};
