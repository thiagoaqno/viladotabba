// Editor de mapas do Tiro da Galera (2026-11-26): o editor roda no jogo (/tiro/?editor=1) e grava por aqui os mapas em
// ferramentas/tiro-mapas/editor/<id>.json, que o ferramentas/tiro-frontline.js põe no jogo na próxima montagem.
// Como o editor de cenário da Corrida: só existe com CORRIDA_EDITOR=1 ("Editor de mapas do Tiro.bat") e só atende o próprio PC.
//   GET  /api/tiro/editor/mapas      → { mapas: [{ id, nome }] }
//   GET  /api/tiro/editor/mapa/:id   → o .json
//   POST /api/tiro/editor/mapa/:id   { o .json } → { ok }
const fs = require("fs"), path = require("path"), express = require("express");
const PASTA = path.join(__dirname, "..", "..", "ferramentas", "tiro-mapas", "editor");
const idOk = (s) => typeof s === "string" && /^[a-z0-9][a-z0-9-]{0,40}$/.test(s);
const local = (req) => ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.socket.remoteAddress);

module.exports = function ligarEditorTiro(app) {
  if (process.env.CORRIDA_EDITOR !== "1") return;
  fs.mkdirSync(PASTA, { recursive: true });
  app.use("/api/tiro/editor", (req, res, next) => (local(req) ? next() : res.status(403).json({ erro: "O editor só grava no próprio PC." })));
  app.get("/api/tiro/editor/mapas", (req, res) => {
    const mapas = fs.readdirSync(PASTA).filter((f) => f.endsWith(".json")).map((f) => {
      try { const J = JSON.parse(fs.readFileSync(path.join(PASTA, f), "utf8")); return { id: J.id, nome: J.nome || J.id }; } catch { return null; }
    }).filter(Boolean);
    res.json({ mapas });
  });
  app.get("/api/tiro/editor/mapa/:id", (req, res) => {
    if (!idOk(req.params.id)) return res.status(400).json({ erro: "id inválido" });
    const f = path.join(PASTA, req.params.id + ".json");
    if (!fs.existsSync(f)) return res.status(404).json({ erro: "mapa não encontrado" });
    res.type("json").send(fs.readFileSync(f, "utf8"));
  });
  app.post("/api/tiro/editor/mapa/:id", express.json({ limit: "8mb" }), (req, res) => {
    const J = req.body;
    if (!idOk(req.params.id) || !J || J.id !== req.params.id || !Array.isArray(J.pecas)) return res.status(400).json({ erro: "mapa inválido" });
    fs.writeFileSync(path.join(PASTA, J.id + ".json"), JSON.stringify(J, null, 1) + "\n");
    res.json({ ok: true });
  });
};
