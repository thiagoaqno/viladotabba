// O editor de cenário das pistas (2026-11-16, o Thiago: "um editor de pistas bem visual... uma pastinha com assets e eu vou editando; talvez não o
// traçado, mas o cenário"). Só existe rodando o servidor no PC com CORRIDA_EDITOR=1 (editor-de-pistas.bat) e só atende quem está na própria
// máquina: grava direto na pasta do projeto, e o resultado vai para o site por um PR, como o resto.
//   assets-originais/          os .glb como vieram (pesados; fora do site: .gitignore)
//   public/corrida/assets/     os .glb convertidos no editor (low poly, texturas menores): o que o jogo carrega
//   public/corrida/cenario/    um <pista>.json por pista: o que foi colocado, onde, girado e em que escala
const fs = require("fs"), path = require("path"), express = require("express");
const RAIZ = __dirname, ORIG = path.join(RAIZ, "assets-originais"), TEXS = path.join(RAIZ, "assets-originais", "texturas"), LEVES = path.join(RAIZ, "public/corrida/assets"), CENARIO = path.join(RAIZ, "public/corrida/cenario");
const nomeOk = (s) => typeof s === "string" && /^[a-z0-9][a-z0-9_-]{0,60}$/i.test(s);
const local = (req) => ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.socket.remoteAddress);

function attach(app) {
  if (process.env.CORRIDA_EDITOR !== "1") return;
  for (const d of [ORIG, TEXS, LEVES, CENARIO]) fs.mkdirSync(d, { recursive: true });
  app.use("/api/corrida/editor", (req, res, next) => (local(req) ? next() : res.status(403).json({ erro: "O editor só abre no próprio PC." })));
  app.get("/api/corrida/editor/eu", (req, res) => res.json({ login: "local", online: false })); // (no PC não há login)
  const lista = (dir) => fs.readdirSync(dir).filter((f) => /\.glb$/i.test(f)).map((f) => ({ nome: f.replace(/\.glb$/i, ""), kb: Math.round(fs.statSync(path.join(dir, f)).size / 1024) }));
  app.get("/api/corrida/editor/assets", (req, res) => res.json({ originais: lista(ORIG), leves: lista(LEVES), texturas: fs.readdirSync(TEXS).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)) }));
  // as texturas importadas no Craft (ficam no PC; dentro dos assets elas vão embutidas no .glb)
  app.get("/api/corrida/editor/textura/:arq", (req, res) => { if (!/^[a-z0-9_-]{1,60}\.(png|jpe?g|webp)$/i.test(req.params.arq)) return res.status(400).end(); res.sendFile(path.join(TEXS, req.params.arq)); });
  app.post("/api/corrida/editor/textura/:arq", express.raw({ type: "*/*", limit: "20mb" }), (req, res) => {
    if (!/^[a-z0-9_-]{1,60}\.(png|jpe?g|webp)$/i.test(req.params.arq) || !req.body?.length) return res.status(400).json({ erro: "nome ou imagem inválida" });
    fs.writeFileSync(path.join(TEXS, req.params.arq), req.body); res.json({ ok: true });
  });
  app.get("/api/corrida/editor/original/:nome", (req, res) => { if (!nomeOk(req.params.nome)) return res.status(400).end(); res.sendFile(path.join(ORIG, req.params.nome + ".glb")); });
  // o .glb convertido no navegador (o corpo é o arquivo)
  app.post("/api/corrida/editor/asset/:nome", express.raw({ type: "*/*", limit: "60mb" }), (req, res) => {
    if (!nomeOk(req.params.nome) || !req.body?.length) return res.status(400).json({ erro: "nome ou arquivo inválido" });
    fs.writeFileSync(path.join(LEVES, req.params.nome + ".glb"), req.body); res.json({ ok: true, kb: Math.round(req.body.length / 1024) });
  });
  // uma peça da pista exportada pelo editor (o Casino, um prédio...): vai para assets-originais/, para editar no Blender e converter de volta
  app.post("/api/corrida/editor/original/:nome", express.raw({ type: "*/*", limit: "60mb" }), (req, res) => {
    if (!nomeOk(req.params.nome) || !req.body?.length) return res.status(400).json({ erro: "nome ou arquivo inválido" });
    fs.writeFileSync(path.join(ORIG, req.params.nome + ".glb"), req.body); res.json({ ok: true, kb: Math.round(req.body.length / 1024) });
  });
  app.post("/api/corrida/editor/cenario/:pista", express.json({ limit: "4mb" }), (req, res) => {
    const c = req.body; if (!nomeOk(req.params.pista) || !c || !Array.isArray(c.itens)) return res.status(400).json({ erro: "cenário inválido" });
    fs.writeFileSync(path.join(CENARIO, req.params.pista + ".json"), JSON.stringify(c, null, 1) + "\n");
    // index.json: as pistas que têm cenário do editor (o jogo só pede o arquivo delas, sem um 404 em cada pista)
    const pistas = fs.readdirSync(CENARIO).filter((f) => f.endsWith(".json") && f !== "index.json").map((f) => f.slice(0, -5)).sort();
    fs.writeFileSync(path.join(CENARIO, "index.json"), JSON.stringify(pistas) + "\n");
    res.json({ ok: true, itens: c.itens.length });
  });
  // (2026-11-16, o Thiago: "quando ficar pronto local, vou precisar de você para o commit? precisamos de um jeito de fazer o commit pelo editor")
  // PUBLICAR: o cenário e os assets leves vão para o GitHub num PR, sem mexer na pasta em que se trabalha. Num worktree temporário, novo e
  // tirado da main do GitHub, entram só public/corrida/cenario/ e public/corrida/assets/ desta pasta; commit, push de um branch novo e o PR
  // aberto pelo `gh` (que já está logado no PC). O merge continua sendo do Thiago. `seco`: faz tudo menos o push e o PR (para testar).
  app.post("/api/corrida/editor/publicar", express.json({ limit: "16kb" }), async (req, res) => {
    const { execFile } = require("child_process"), os = require("os");
    const roda = (cmd, args, cwd = RAIZ) => new Promise((ok, falha) => execFile(cmd, args, { cwd, windowsHide: true, maxBuffer: 8 << 20 }, (e, out, err) => (e ? falha(Error((err || e.message).toString().trim().split("\n").slice(-3).join(" "))) : ok(out.toString().trim()))));
    const texto = String(req.body?.mensagem || "").replace(/[\r\n]+/g, " ").slice(0, 120) || "cenário das pistas pelo editor", seco = !!req.body?.seco;
    const quando = new Date(), carimbo = quando.toISOString().slice(0, 16).replace(/[-:T]/g, ""), branch = `cenario/editor-${carimbo}`;
    const tmp = path.join(os.tmpdir(), "corrida-publicar-" + carimbo + "-" + process.pid);
    try {
      await roda("git", ["fetch", "-q", "origin", "main"]);
      await roda("git", ["worktree", "add", "-q", "-B", branch, tmp, "origin/main"]);
      for (const rel of ["public/corrida/cenario", "public/corrida/assets"]) { const de = path.join(RAIZ, rel), para = path.join(tmp, rel); fs.mkdirSync(para, { recursive: true }); for (const f of fs.readdirSync(de)) if (fs.statSync(path.join(de, f)).isFile()) fs.copyFileSync(path.join(de, f), path.join(para, f)); }
      await roda("git", ["add", "-A", "public/corrida/cenario", "public/corrida/assets"], tmp);
      const mudou = await roda("git", ["status", "--porcelain"], tmp);
      if (!mudou) return res.json({ ok: true, nada: true });
      await roda("git", ["commit", "-q", "-m", `Cenário pelo editor: ${texto}`], tmp);
      const arquivos = mudou.split("\n").length;
      if (seco) return res.json({ ok: true, seco: true, branch, arquivos });
      await roda("git", ["push", "-q", "-u", "origin", branch], tmp);
      const url = await roda("gh", ["pr", "create", "--base", "main", "--head", branch, "--title", `Cenário pelo editor: ${texto}`, "--body", `Feito no editor de cenário das pistas (${arquivos} arquivos em public/corrida/cenario e public/corrida/assets).`], tmp);
      res.json({ ok: true, url, branch, arquivos });
    } catch (e) { res.status(500).json({ erro: e.message }); }
    finally { roda("git", ["worktree", "remove", "--force", tmp]).catch(() => {}).then(() => roda("git", ["branch", "-D", branch])).catch(() => {}); } // (o branch fica só no GitHub)
  });
  console.log("Editor de pistas: aberto em http://localhost:" + (process.env.PORT || 3000) + "/corrida/?editor=interlagos");
}
module.exports = { attach };
