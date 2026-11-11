// Corrida da Galera — a ATUALIZAÇÃO do programa de PC, baixando só os arquivos que mudaram, e SÓ quando quem joga deixa (corrida-pc.js liga isto).
//  - No site: GET /api/corrida/pc/manifesto devolve { arquivos: { "caminho/do/arquivo": [sha1, bytes] } } de tudo o que vai no programa (as
//    mesmas pastas que o workflow programa-pc.yml copia: sem node_modules, testes, docs...), e GET /api/corrida/pc/arquivo?f=<caminho> entrega
//    um arquivo da lista (nenhum outro). A conta das assinaturas é feita uma vez, no primeiro pedido, e guardada (o deploy reinicia o servidor).
//  - No programa: ao abrir (com internet), `conferir` compara a lista do site com os arquivos do PC, SEM baixar nada; o jogo pergunta
//    ("Tem atualização: N arquivos, X MB. Baixar agora?") e só com o sim `baixar` traz os diferentes, por cima. As assinaturas dos arquivos
//    do PC ficam guardadas (arquivos-pc.json, ao lado do banco) por tamanho e data, para não reler 200 MB a cada abertura.
//  - Se mudaram as bibliotecas do servidor (o package-lock.json), não dá para atualizar arquivo por arquivo: o jogo pede o instalador novo.
const fs = require("fs"), fsp = fs.promises, path = require("path"), crypto = require("crypto");
const RAIZ = __dirname;
// o que NÃO vai no programa (só na raiz do projeto; o mesmo de programa-pc.yml)
const FORA = new Set(["node_modules", ".git", ".github", ".claude", "dados", "tests", "docs", "planos", "dist", "saida", "desktop", "ferramentas-prints", "test-results", "playwright-report", "fly.toml"]);
const foraDoPrograma = (rel) => { const topo = rel.split("/")[0]; return FORA.has(topo) || topo.startsWith(".") || (!rel.includes("/") && /\.md$/i.test(rel)); };
const LINK = "https://github.com/thiagoaqno/viladotabba/releases/download/programa-pc/CorridaDaGalera-Setup.exe";

async function listar(dir = RAIZ, base = "") {
  const out = [];
  for (const e of await fsp.readdir(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${e.name}` : e.name;
    if (foraDoPrograma(rel)) continue;
    if (e.isDirectory()) out.push(...await listar(path.join(dir, e.name), rel));
    else if (e.isFile()) out.push(rel);
  }
  return out;
}
// as NOTAS da atualização (o que mudou, em palavras): public/corrida/novidades.json, [{ id, data, itens: ["..."] }], a mais nova primeiro
async function lerNotas() { try { const n = JSON.parse(await fsp.readFile(path.join(RAIZ, "public", "corrida", "novidades.json"), "utf8")); return Array.isArray(n) ? n : []; } catch { return []; } }
const sha1 = async (arquivo) => crypto.createHash("sha1").update(await fsp.readFile(arquivo)).digest("hex");

// ---------- no site ----------
let manifesto = null;
function rotasDoSite(app) {
  const montar = () => (manifesto ||= (async () => {
    const arquivos = {};
    for (const rel of await listar()) { const f = path.join(RAIZ, rel); arquivos[rel] = [await sha1(f), (await fsp.stat(f)).size]; }
    return { arquivos, notas: await lerNotas() };
  })().catch((e) => { manifesto = null; throw e; }));
  app.get("/api/corrida/pc/manifesto", async (req, res) => {
    try { res.set("Cache-Control", "no-store").json(await montar()); } catch { res.status(500).json({ erro: "A lista de arquivos não abriu." }); }
  });
  app.get("/api/corrida/pc/arquivo", async (req, res) => {
    try {
      const m = await montar(), f = String(req.query.f || "");
      if (!Object.hasOwn(m.arquivos, f)) return res.sendStatus(404);
      res.set("Cache-Control", "no-store").sendFile(path.join(RAIZ, f));
    } catch { res.sendStatus(500); }
  });
}

// ---------- no programa ----------
const cacheArq = () => path.join(process.env.DB_PATH && process.env.DB_PATH !== ":memory:" ? path.dirname(process.env.DB_PATH) : RAIZ, "arquivos-pc.json");
async function lerCache() { try { return JSON.parse(await fsp.readFile(cacheArq(), "utf8")); } catch { return {}; } }
async function hashLocal(cache, rel) {
  try {
    const st = await fsp.stat(path.join(RAIZ, rel)), c = cache[rel];
    if (c && c[0] === st.size && c[1] === st.mtimeMs) return c[2];
    const h = await sha1(path.join(RAIZ, rel)); cache[rel] = [st.size, st.mtimeMs, h]; return h;
  } catch { return null; }
}
// O que falta, sem baixar nada: null (sem internet ou nada novo), { grande, link } (bibliotecas novas: instalador) ou
// { arquivos: [...], bytes, servidor } (servidor: mudou algo fora de public/, que só vale ao reabrir o programa).
async function conferir(site) {
  let lista;
  try { lista = await (await fetch(site + "/api/corrida/pc/manifesto", { signal: AbortSignal.timeout(20000) })).json(); } catch { return null; }
  if (!lista?.arquivos) return null;
  const daqui = new Set((await lerNotas()).map((n) => n.id)), notas = (lista.notas || []).filter((n) => n && !daqui.has(n.id)).slice(0, 5); // (as que este PC ainda não tem)
  const cache = await lerCache(), assinatura = (rel) => [].concat(lista.arquivos[rel])[0];
  if (lista.arquivos["package-lock.json"] && (await hashLocal(cache, "package-lock.json")) !== assinatura("package-lock.json")) return { grande: true, link: LINK, notas };
  const faltam = [];
  for (const rel of Object.keys(lista.arquivos)) {
    const destino = path.resolve(RAIZ, rel);
    if (rel.includes("..") || foraDoPrograma(rel) || !destino.startsWith(RAIZ + path.sep)) continue; // (só dentro da pasta do jogo)
    if ((await hashLocal(cache, rel)) !== assinatura(rel)) faltam.push(rel);
  }
  try { await fsp.writeFile(cacheArq(), JSON.stringify(cache)); } catch { /* fica para a próxima */ }
  if (!faltam.length) return null;
  return { notas, arquivos: faltam, assinaturas: Object.fromEntries(faltam.map((r) => [r, assinatura(r)])), bytes: faltam.reduce((s, r) => s + ([].concat(lista.arquivos[r])[1] || 0), 0), servidor: faltam.some((r) => !r.startsWith("public/")) };
}
// Baixa o que `conferir` achou (só com o sim de quem joga). Devolve quantos vieram.
async function baixar(site, pendente) {
  const cache = await lerCache();
  let feitos = 0;
  const um = async (rel) => {
    const r = await fetch(site + "/api/corrida/pc/arquivo?f=" + encodeURIComponent(rel), { signal: AbortSignal.timeout(60000) });
    if (!r.ok) throw Error(`${rel}: ${r.status}`);
    const dados = Buffer.from(await r.arrayBuffer()), h = crypto.createHash("sha1").update(dados).digest("hex");
    if (h !== pendente.assinaturas[rel]) throw Error(`${rel}: veio diferente`);
    const destino = path.join(RAIZ, rel), tmp = destino + ".novo";
    await fsp.mkdir(path.dirname(destino), { recursive: true });
    await fsp.writeFile(tmp, dados); await fsp.rename(tmp, destino);
    const st = await fsp.stat(destino); cache[rel] = [st.size, st.mtimeMs, h]; feitos++;
  };
  const fila = pendente.arquivos.slice();
  await Promise.all(Array.from({ length: 4 }, async () => { while (fila.length) { const rel = fila.shift(); try { await um(rel); } catch (e) { console.warn("Atualização:", e.message); } } }));
  try { await fsp.writeFile(cacheArq(), JSON.stringify(cache)); } catch { /* fica para a próxima */ }
  console.log(`Atualização: ${feitos} de ${pendente.arquivos.length} arquivos baixados`);
  return feitos;
}

module.exports = { rotasDoSite, conferir, baixar };
