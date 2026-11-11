// Corrida da Galera — o programa de PC se ATUALIZA SOZINHO, baixando só os arquivos que mudaram (corrida-pc.js liga isto).
//  - No site: GET /api/corrida/pc/manifesto devolve { arquivos: { "caminho/do/arquivo": sha1 } } de tudo o que vai no programa (as mesmas
//    pastas que o workflow programa-pc.yml copia: sem node_modules, testes, docs...), e GET /api/corrida/pc/arquivo?f=<caminho> entrega um
//    arquivo da lista (nenhum outro). A conta das assinaturas é feita uma vez, no primeiro pedido, e guardada (o deploy reinicia o servidor).
//  - No programa: ao abrir (com internet), compara a lista do site com os arquivos do PC e baixa só os diferentes, por cima, em segundo
//    plano: o jogo abre na hora com o que tem, e a versão nova vale na próxima vez que abrir (o aviso no canto diz isso). As assinaturas
//    dos arquivos do PC ficam guardadas (arquivos-pc.json, ao lado do banco) por tamanho e data, para não reler 200 MB a cada abertura.
//  - Se mudaram as bibliotecas do servidor (o package-lock.json), não dá para atualizar arquivo por arquivo: o aviso pede o instalador novo.
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
const sha1 = async (arquivo) => crypto.createHash("sha1").update(await fsp.readFile(arquivo)).digest("hex");

// ---------- no site ----------
let manifesto = null;
function rotasDoSite(app) {
  const montar = () => (manifesto ||= (async () => {
    const arquivos = {};
    for (const rel of await listar()) arquivos[rel] = await sha1(path.join(RAIZ, rel));
    return { arquivos };
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
async function atualizar(site, avisar) {
  let lista;
  try { lista = await (await fetch(site + "/api/corrida/pc/manifesto", { signal: AbortSignal.timeout(20000) })).json(); } catch { return; } // sem internet: fica como está
  if (!lista?.arquivos) return;
  const cacheArq = path.join(process.env.DB_PATH && process.env.DB_PATH !== ":memory:" ? path.dirname(process.env.DB_PATH) : RAIZ, "arquivos-pc.json");
  let cache = {}; try { cache = JSON.parse(await fsp.readFile(cacheArq, "utf8")); } catch { /* primeira vez */ }
  const local = async (rel) => {
    try {
      const st = await fsp.stat(path.join(RAIZ, rel)), c = cache[rel];
      if (c && c[0] === st.size && c[1] === st.mtimeMs) return c[2];
      const h = await sha1(path.join(RAIZ, rel)); cache[rel] = [st.size, st.mtimeMs, h]; return h;
    } catch { return null; }
  };
  if (lista.arquivos["package-lock.json"] && (await local("package-lock.json")) !== lista.arquivos["package-lock.json"]) {
    avisar(`Saiu uma atualização grande da Corrida: baixe e instale o programa de novo (${LINK}).`); return;
  }
  const baixar = [];
  for (const [rel, h] of Object.entries(lista.arquivos)) {
    const destino = path.resolve(RAIZ, rel);
    if (rel.includes("..") || foraDoPrograma(rel) || !destino.startsWith(RAIZ + path.sep)) continue; // (só dentro da pasta do jogo)
    if ((await local(rel)) !== h) baixar.push(rel);
  }
  let feitos = 0;
  const um = async (rel) => {
    const r = await fetch(site + "/api/corrida/pc/arquivo?f=" + encodeURIComponent(rel), { signal: AbortSignal.timeout(60000) });
    if (!r.ok) throw Error(`${rel}: ${r.status}`);
    const dados = Buffer.from(await r.arrayBuffer()), h = crypto.createHash("sha1").update(dados).digest("hex");
    if (h !== lista.arquivos[rel]) throw Error(`${rel}: veio diferente`);
    const destino = path.join(RAIZ, rel), tmp = destino + ".novo";
    await fsp.mkdir(path.dirname(destino), { recursive: true });
    await fsp.writeFile(tmp, dados); await fsp.rename(tmp, destino);
    const st = await fsp.stat(destino); cache[rel] = [st.size, st.mtimeMs, h]; feitos++;
  };
  const fila = baixar.slice();
  await Promise.all(Array.from({ length: 4 }, async () => { while (fila.length) { const rel = fila.shift(); try { await um(rel); } catch (e) { console.warn("Atualização:", e.message); } } }));
  try { await fsp.writeFile(cacheArq, JSON.stringify(cache)); } catch { /* fica para a próxima */ }
  if (feitos) { console.log(`Atualização: ${feitos} de ${baixar.length} arquivos baixados`); avisar(`Corrida atualizada (${feitos} ${feitos === 1 ? "arquivo" : "arquivos"}): feche e abra o jogo para usar a versão nova.`); }
}

module.exports = { rotasDoSite, atualizar };
