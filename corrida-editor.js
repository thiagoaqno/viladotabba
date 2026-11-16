// O editor de cenário das pistas (2026-11-16, o Thiago: "um editor de pistas bem visual... uma pastinha com assets e eu vou editando; talvez não o
// traçado, mas o cenário"). Só existe rodando o servidor no PC com CORRIDA_EDITOR=1 (editor-de-pistas.bat) e só atende quem está na própria
// máquina: grava direto na pasta do projeto, e o resultado vai para o site por um PR, como o resto.
//   assets-originais/          os .glb como vieram (pesados; fora do site: .gitignore)
//   public/corrida/assets/     os .glb convertidos no editor (low poly, texturas menores): o que o jogo carrega
//   public/corrida/cenario/    um <pista>.json por pista: o que foi colocado, onde, girado e em que escala
const fs = require("fs"), path = require("path"), express = require("express");
const RAIZ = __dirname, ORIG = path.join(RAIZ, "assets-originais"), LEVES = path.join(RAIZ, "public/corrida/assets"), CENARIO = path.join(RAIZ, "public/corrida/cenario");
const nomeOk = (s) => typeof s === "string" && /^[a-z0-9][a-z0-9_-]{0,60}$/i.test(s);
const local = (req) => ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.socket.remoteAddress);

function attach(app) {
  if (process.env.CORRIDA_EDITOR !== "1") return;
  for (const d of [ORIG, LEVES, CENARIO]) fs.mkdirSync(d, { recursive: true });
  app.use("/api/corrida/editor", (req, res, next) => (local(req) ? next() : res.status(403).json({ erro: "O editor só abre no próprio PC." })));
  const lista = (dir) => fs.readdirSync(dir).filter((f) => /\.glb$/i.test(f)).map((f) => ({ nome: f.replace(/\.glb$/i, ""), kb: Math.round(fs.statSync(path.join(dir, f)).size / 1024) }));
  app.get("/api/corrida/editor/assets", (req, res) => res.json({ originais: lista(ORIG), leves: lista(LEVES) }));
  app.get("/api/corrida/editor/original/:nome", (req, res) => { if (!nomeOk(req.params.nome)) return res.status(400).end(); res.sendFile(path.join(ORIG, req.params.nome + ".glb")); });
  // o .glb convertido no navegador (o corpo é o arquivo)
  app.post("/api/corrida/editor/asset/:nome", express.raw({ type: "*/*", limit: "60mb" }), (req, res) => {
    if (!nomeOk(req.params.nome) || !req.body?.length) return res.status(400).json({ erro: "nome ou arquivo inválido" });
    fs.writeFileSync(path.join(LEVES, req.params.nome + ".glb"), req.body); res.json({ ok: true, kb: Math.round(req.body.length / 1024) });
  });
  app.post("/api/corrida/editor/cenario/:pista", express.json({ limit: "4mb" }), (req, res) => {
    const c = req.body; if (!nomeOk(req.params.pista) || !c || !Array.isArray(c.itens)) return res.status(400).json({ erro: "cenário inválido" });
    fs.writeFileSync(path.join(CENARIO, req.params.pista + ".json"), JSON.stringify(c, null, 1) + "\n");
    // index.json: as pistas que têm cenário do editor (o jogo só pede o arquivo delas, sem um 404 em cada pista)
    const pistas = fs.readdirSync(CENARIO).filter((f) => f.endsWith(".json") && f !== "index.json").map((f) => f.slice(0, -5)).sort();
    fs.writeFileSync(path.join(CENARIO, "index.json"), JSON.stringify(pistas) + "\n");
    res.json({ ok: true, itens: c.itens.length });
  });
  console.log("Editor de pistas: aberto em http://localhost:" + (process.env.PORT || 3000) + "/corrida/?editor=interlagos");
}
module.exports = { attach };
