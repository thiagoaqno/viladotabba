// As fotos das notícias da carreira (temporada/stories.js): a foto principal do artigo da Wikipédia (em inglês) de cada piloto do grid de 2026 e
// do carro de cada equipe, só as de licença livre (Wikimedia Commons), com o autor e a licença para o crédito.
//
//   node ferramentas/fotos-noticias.js
//
// Escreve public/corrida/temporada/fotos-noticias.js (window.FotosNoticias). As fotos não entram no repositório: o navegador carrega a miniatura
// de upload.wikimedia.org na hora; se não carregar, a notícia usa a reserva local (a foto do GP, de gp-fotos/). Imprime o artigo e o arquivo
// escolhidos de cada um, para conferir; o que estiver errado se corrige em FIXOS (o título do artigo) e roda de novo.
"use strict";
const fs = require("fs");
const path = require("path");
require("../public/corrida/f1-pilotos-2026.js");
const P = globalThis.F1Pilotos || require("../public/corrida/f1-pilotos-2026.js");

const UA = { "User-Agent": "corrida-galera-ferramenta/1.0 (fotos das notícias do jogo)" };
// o artigo de cada um, quando a busca não acha o certo sozinha
const FIXOS = {
  hamilton: "Lewis Hamilton", verstappen: "Max Verstappen", sainz: "Carlos Sainz Jr.", russell: "George Russell (racing driver)", antonelli: "Andrea Kimi Antonelli", camara: "Rafael Câmara", lindblad: "Arvid Lindblad", hulkenberg: "Nico Hülkenberg", perez: "Sergio Pérez",
  // os carros (o artigo do carro de 2025, que tem foto livre; o de 2026 pode ainda não ter)
  "eq:mclaren": "McLaren MCL39", "eq:ferrari": "Ferrari SF-25", "eq:mercedes": "Mercedes W16", "eq:red-bull": "Red Bull RB21", "eq:racing-bulls": "Racing Bulls VCARB 02",
  "eq:aston-martin": "Aston Martin AMR25", "eq:williams": "Williams FW47", "eq:audi": "Kick Sauber C45", "eq:alpine": "Alpine A525", "eq:haas": "Haas VF-25", "eq:cadillac": "Cadillac Formula One Team",
};
// (a API pede calma: com 429, espera e tenta de novo, até 5 vezes)
const api = async (base, params) => {
  for (let k = 0; k < 5; k++) {
    let r = null; try { r = await fetch(`${base}?${new URLSearchParams({ format: "json", formatversion: "2", origin: "*", ...params })}`, { headers: UA, signal: AbortSignal.timeout(30000) }); } catch (e) { r = null; } // (a rede caiu: tenta de novo)
    if (r && r.ok) return r.json();
    if (r && r.status !== 429 && r.status < 500) throw new Error(`${base}: ${r.status}`);
    await new Promise((v) => setTimeout(v, 5000 * (k + 1)));
  }
  throw new Error(`${base}: sem resposta`);
};
const WP = "https://en.wikipedia.org/w/api.php", COMMONS = "https://commons.wikimedia.org/w/api.php";
const limpar = (html) => String(html || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

async function fotoDe(titulo, busca) {
  let t = titulo;
  if (!t) { const s = await api(WP, { action: "query", list: "search", srsearch: busca, srlimit: "1" }); t = s.query.search[0]?.title; }
  if (!t) return null;
  const q = await api(WP, { action: "query", titles: t, prop: "pageimages", piprop: "name", pilicense: "free", redirects: "1" });
  const pg = q.query.pages[0], arquivo = pg && pg.pageimage; if (!arquivo) return { pagina: pg?.title || t, arquivo: null };
  const c = await api(COMMONS, { action: "query", titles: `File:${arquivo}`, prop: "imageinfo", iiprop: "url|extmetadata", iiurlwidth: "900" });
  const ii = c.query.pages[0]?.imageinfo?.[0]; if (!ii) return { pagina: pg.title, arquivo, url: null };
  const m = ii.extmetadata || {};
  return { pagina: pg.title, arquivo, url: ii.thumburl || ii.url, autor: limpar(m.Artist?.value).slice(0, 80) || "Wikimedia Commons", licenca: limpar(m.LicenseShortName?.value) || "licença livre", fonte: ii.descriptionurl };
}

async function principal() {
  const saida = { pilotos: {}, equipes: {} };
  for (const p of P.PILOTOS) {
    const f = await fotoDe(FIXOS[p.id], `${p.nome} racing driver`);
    console.log(`${p.id.padEnd(12)} ${f ? `${f.pagina} → ${f.arquivo || "(sem foto livre)"}` : "(nada)"}`);
    if (f && f.url) saida.pilotos[p.id] = f;
    await new Promise((v) => setTimeout(v, 2000));
  }
  for (const id of Object.keys(P.EQUIPES)) {
    const f = await fotoDe(FIXOS[`eq:${id}`], `${P.EQUIPES[id].nome} Formula One car`);
    console.log(`eq:${id.padEnd(13)} ${f ? `${f.pagina} → ${f.arquivo || "(sem foto livre)"}` : "(nada)"}`);
    if (f && f.url) saida.equipes[id] = f;
    await new Promise((v) => setTimeout(v, 2000));
  }
  const arq = path.join(__dirname, "..", "public", "corrida", "temporada", "fotos-noticias.js");
  fs.writeFileSync(arq, `// Gerado por ferramentas/fotos-noticias.js: a foto de cada piloto e do carro de cada equipe para as notícias da carreira (Wikimedia Commons,
// licenças livres; o crédito vai na notícia). As imagens não ficam no jogo: o navegador carrega de upload.wikimedia.org e, sem elas, usa a reserva local.
window.FotosNoticias = ${JSON.stringify(saida)};\n`);
  console.log(`\n${Object.keys(saida.pilotos).length} pilotos e ${Object.keys(saida.equipes).length} equipes com foto → ${path.relative(process.cwd(), arq)}`);
}
principal().catch((e) => { console.error(String(e.message || e)); process.exit(1); });
