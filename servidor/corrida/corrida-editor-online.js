// O editor de cenário NO SITE, com login pelo GitHub (2026-11-16, o Thiago: "não tem como deixar o login pelo GitHub online também?").
// Liga quando o servidor tem EDITOR_GITHUB_CLIENT_ID e EDITOR_GITHUB_CLIENT_SECRET (o OAuth App do Thiago, em /etc/viladotabba.env na VPS) e
// só deixa entrar a conta EDITOR_GITHUB_USUARIO (thiagoaqno). As mesmas rotas do editor local (corrida-editor.js), mas sem disco:
//   - o que se salva (cenário, assets leves, originais, texturas) fica numa área de rascunho da sessão, na memória do servidor, e o jogo
//     aberto pelo Thiago já vê o rascunho (as rotas /corrida/cenario e /corrida/assets olham o rascunho antes do arquivo);
//   - PUBLICAR manda o cenário e os assets leves para o GitHub pela API, com o token do próprio login: blobs, árvore, commit, branch e PR.
//     O merge continua sendo do Thiago; com o merge, o deploy da VPS publica como sempre.
// O rascunho se perde se o servidor reiniciar (um deploy): publique quando terminar uma pista.
const crypto = require("crypto"), express = require("express"), fs = require("fs"), path = require("path");
const ID = process.env.EDITOR_GITHUB_CLIENT_ID, SEGREDO = process.env.EDITOR_GITHUB_CLIENT_SECRET;
const USUARIO = (process.env.EDITOR_GITHUB_USUARIO || "thiagoaqno").toLowerCase(), REPO = process.env.EDITOR_GITHUB_REPO || "thiagoaqno/viladotabba";
const RAIZ = path.join(__dirname, "..", ".."), CENARIO = path.join(RAIZ, "public/corrida/cenario"), LEVES = path.join(RAIZ, "public/corrida/assets");
const nomeOk = (s) => typeof s === "string" && /^[a-z0-9][a-z0-9_-]{0,60}$/i.test(s), texOk = (s) => /^[a-z0-9_-]{1,60}\.(png|jpe?g|webp)$/i.test(s);
const sessoes = new Map(); // id -> { token, login, ate, rascunho: { cenario: Map, leves: Map, originais: Map, texturas: Map } }
const estados = new Map(); // state do OAuth -> validade
const DIA = 24 * 3600 * 1000;

const cookie = (req, nome) => { const m = (req.headers.cookie || "").match(new RegExp("(?:^|;\\s*)" + nome + "=([^;]+)")); return m ? decodeURIComponent(m[1]) : null; };
function sessaoDe(req) { const s = sessoes.get(cookie(req, "editor_sessao") || ""); if (!s || s.ate < Date.now()) return null; return s; }
async function gh(token, metodo, url, corpo) {
  const r = await fetch("https://api.github.com" + url, { method: metodo, headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json", "user-agent": "viladotabba-editor", ...(corpo ? { "content-type": "application/json" } : {}) }, body: corpo ? JSON.stringify(corpo) : undefined });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw Error(`GitHub ${r.status}: ${j.message || r.statusText}`); return j;
}

function attach(app) {
  if (!ID || !SEGREDO || process.env.CORRIDA_EDITOR === "1") return false;
  // ---- o login ----
  app.get("/api/corrida/editor/github/entrar", (req, res) => {
    const state = crypto.randomBytes(16).toString("hex"); estados.set(state, Date.now() + 10 * 60 * 1000);
    const volta = `https://${req.headers.host}/api/corrida/editor/github/volta`, pista = nomeOk(req.query.pista) ? req.query.pista : "monaco";
    res.setHeader("Set-Cookie", `editor_pista=${pista}; Path=/; Max-Age=900; SameSite=Lax; Secure`);
    res.redirect(`https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(ID)}&redirect_uri=${encodeURIComponent(volta)}&scope=repo&state=${state}`);
  });
  app.get("/api/corrida/editor/github/volta", async (req, res) => {
    try {
      const st = String(req.query.state || ""); if (!(estados.get(st) > Date.now())) throw Error("o login expirou; tente de novo"); estados.delete(st);
      const r = await fetch("https://github.com/login/oauth/access_token", { method: "POST", headers: { accept: "application/json", "content-type": "application/json" }, body: JSON.stringify({ client_id: ID, client_secret: SEGREDO, code: String(req.query.code || "") }) });
      const tok = (await r.json()).access_token; if (!tok) throw Error("o GitHub não devolveu o acesso");
      const eu = await gh(tok, "GET", "/user");
      if (String(eu.login).toLowerCase() !== USUARIO) return res.status(403).send("Este editor é só do dono do site.");
      const id = crypto.randomBytes(24).toString("hex");
      sessoes.set(id, { token: tok, login: eu.login, ate: Date.now() + 7 * DIA, rascunho: { cenario: new Map(), leves: new Map(), originais: new Map(), texturas: new Map() } });
      res.setHeader("Set-Cookie", `editor_sessao=${id}; Path=/; Max-Age=${7 * 24 * 3600}; HttpOnly; Secure; SameSite=Lax`);
      res.redirect(`/corrida/?editor=${nomeOk(cookie(req, "editor_pista")) ? cookie(req, "editor_pista") : "monaco"}`);
    } catch (e) { res.status(500).send("Não deu para entrar: " + e.message); }
  });
  app.get("/api/corrida/editor/github/sair", (req, res) => { sessoes.delete(cookie(req, "editor_sessao") || ""); res.setHeader("Set-Cookie", "editor_sessao=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax"); res.redirect("/corrida/"); });
  app.get("/api/corrida/editor/eu", (req, res) => { const s = sessaoDe(req); s ? res.json({ login: s.login, online: true }) : res.status(401).json({ erro: "entre com o GitHub", entrar: "/api/corrida/editor/github/entrar" }); });
  // ---- daqui em diante, só com o login ----
  app.use("/api/corrida/editor", (req, res, next) => { const s = sessaoDe(req); if (!s) return res.status(401).json({ erro: "entre com o GitHub", entrar: "/api/corrida/editor/github/entrar" }); req.editor = s; next(); });
  // o rascunho por cima dos arquivos do site (o jogo do Thiago já vê o que ele salvou)
  app.get("/corrida/cenario/:arq", (req, res, next) => {
    const s = sessaoDe(req); if (!s) return next(); const R = s.rascunho.cenario;
    if (req.params.arq === "index.json" && R.size) { const base = (() => { try { return JSON.parse(fs.readFileSync(path.join(CENARIO, "index.json"), "utf8")); } catch { return []; } })(); return res.set("Cache-Control", "no-store").json([...new Set([...base, ...R.keys()])].sort()); }
    const id = req.params.arq.replace(/\.json$/, ""); if (R.has(id)) return res.set("Cache-Control", "no-store").json(R.get(id)); next();
  });
  app.get("/corrida/assets/:arq", (req, res, next) => { const s = sessaoDe(req); const b = s?.rascunho.leves.get(req.params.arq.replace(/\.glb$/, "")); if (!b) return next(); res.type("model/gltf-binary").send(b); });
  // ---- as mesmas rotas do editor local ----
  const lista = (dir) => { try { return fs.readdirSync(dir).filter((f) => /\.glb$/i.test(f)).map((f) => ({ nome: f.replace(/\.glb$/i, ""), kb: Math.round(fs.statSync(path.join(dir, f)).size / 1024) })); } catch { return []; } };
  const doMapa = (m) => [...m].map(([nome, b]) => ({ nome, kb: Math.round(b.length / 1024) }));
  app.get("/api/corrida/editor/assets", (req, res) => { const R = req.editor.rascunho, leves = lista(LEVES).filter((a) => !R.leves.has(a.nome)); res.json({ originais: doMapa(R.originais), leves: [...leves, ...doMapa(R.leves)], texturas: [...R.texturas.keys()], online: true }); });
  app.get("/api/corrida/editor/textura/:arq", (req, res) => { const b = req.editor.rascunho.texturas.get(req.params.arq); b ? res.type(path.extname(req.params.arq)).send(b) : res.status(404).end(); });
  app.post("/api/corrida/editor/textura/:arq", express.raw({ type: "*/*", limit: "20mb" }), (req, res) => { if (!texOk(req.params.arq) || !req.body?.length) return res.status(400).json({ erro: "nome ou imagem inválida" }); req.editor.rascunho.texturas.set(req.params.arq, req.body); res.json({ ok: true }); });
  app.get("/api/corrida/editor/original/:nome", (req, res) => { const b = req.editor.rascunho.originais.get(req.params.nome); b ? res.type("model/gltf-binary").send(b) : res.status(404).end(); });
  for (const [rota, mapa] of [["asset", "leves"], ["original", "originais"]]) app.post(`/api/corrida/editor/${rota}/:nome`, express.raw({ type: "*/*", limit: "60mb" }), (req, res) => {
    if (!nomeOk(req.params.nome) || !req.body?.length) return res.status(400).json({ erro: "nome ou arquivo inválido" });
    req.editor.rascunho[mapa].set(req.params.nome, Buffer.from(req.body)); res.json({ ok: true, kb: Math.round(req.body.length / 1024) });
  });
  app.post("/api/corrida/editor/cenario/:pista", express.json({ limit: "4mb" }), (req, res) => { const c = req.body; if (!nomeOk(req.params.pista) || !c || !Array.isArray(c.itens)) return res.status(400).json({ erro: "cenário inválido" }); req.editor.rascunho.cenario.set(req.params.pista, c); res.json({ ok: true, itens: c.itens.length }); });
  // ---- PUBLICAR pela API do GitHub ----
  app.post("/api/corrida/editor/publicar", express.json({ limit: "16kb" }), async (req, res) => {
    const s = req.editor, R = s.rascunho, texto = String(req.body?.mensagem || "").replace(/[\r\n]+/g, " ").slice(0, 120) || "cenário das pistas pelo editor";
    if (!R.cenario.size && !R.leves.size) return res.json({ ok: true, nada: true });
    try {
      const main = await gh(s.token, "GET", `/repos/${REPO}/git/ref/heads/main`), base = await gh(s.token, "GET", `/repos/${REPO}/git/commits/${main.object.sha}`);
      const arquivos = [];
      for (const [id, c] of R.cenario) arquivos.push([`public/corrida/cenario/${id}.json`, Buffer.from(JSON.stringify(c, null, 1) + "\n")]);
      if (R.cenario.size) { let idx = []; try { const atual = await gh(s.token, "GET", `/repos/${REPO}/contents/public/corrida/cenario/index.json?ref=main`); idx = JSON.parse(Buffer.from(atual.content, "base64").toString()); } catch {} arquivos.push(["public/corrida/cenario/index.json", Buffer.from(JSON.stringify([...new Set([...idx, ...R.cenario.keys()])].sort()) + "\n")]); }
      for (const [nome, b] of R.leves) arquivos.push([`public/corrida/assets/${nome}.glb`, b]);
      const arvore = [];
      for (const [p, b] of arquivos) { const blob = await gh(s.token, "POST", `/repos/${REPO}/git/blobs`, { content: b.toString("base64"), encoding: "base64" }); arvore.push({ path: p, mode: "100644", type: "blob", sha: blob.sha }); }
      const tree = await gh(s.token, "POST", `/repos/${REPO}/git/trees`, { base_tree: base.tree.sha, tree: arvore });
      const commit = await gh(s.token, "POST", `/repos/${REPO}/git/commits`, { message: `Cenário pelo editor: ${texto}`, tree: tree.sha, parents: [main.object.sha] });
      const branch = `cenario/editor-${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "")}`;
      await gh(s.token, "POST", `/repos/${REPO}/git/refs`, { ref: `refs/heads/${branch}`, sha: commit.sha });
      const pr = await gh(s.token, "POST", `/repos/${REPO}/pulls`, { title: `Cenário pelo editor: ${texto}`, head: branch, base: "main", body: `Feito no editor de cenário das pistas, no site (${arquivos.length} arquivos em public/corrida/cenario e public/corrida/assets).` });
      res.json({ ok: true, url: pr.html_url, branch, arquivos: arquivos.length });
    } catch (e) { res.status(500).json({ erro: e.message }); }
  });
  console.log("Editor de pistas: no site, com login pelo GitHub (" + USUARIO + ")");
  return true;
}
module.exports = { attach };
