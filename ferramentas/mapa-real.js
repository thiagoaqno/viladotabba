// O mapa real em volta de cada pista, para o fundo da miniatura 3D (gp-miniatura.js: o replay, os momentos, o mapa da corrida, o guia do GP):
// os prédios (com a altura), as ruas, a água e as áreas verdes do OpenStreetMap, já nas unidades do traçado do jogo.
//
//   node ferramentas/mapa-real.js monza --cache C:/Users/thiag/Downloads/lts/cache-pista-real
//   node ferramentas/mapa-real.js --todas --cache ...
//
// Escreve public/corrida/mapas/<pista>.json. Como:
// - a linha central real (bacinger/f1-circuits, MIT) é encaixada na do jogo (rotação, escala e espelho: ferramentas/pista-real.js);
// - uma consulta à Overpass API (© colaboradores do OpenStreetMap, licença ODbL) traz o que fica num raio em volta do circuito;
// - cada contorno passa pela mesma transformação, é simplificado (Douglas-Peucker) e arredondado para unidades inteiras do jogo.
// A altura do prédio vem de `height` ou de `building:levels` × 3,2 m; sem as duas, 9 m (a conta fica marcada no arquivo: `semAltura`).
"use strict";
const fs = require("fs");
const path = require("path");
const P = require("../public/corrida/pistas.js");
const { comCache, baixarLinha, reamostrar, encaixar, lerOpcoes } = require("./pista-real.js");

// o circuito de cada pista na coleção bacinger/f1-circuits
const CIRCUITOS = {
  monaco: "mc-1929", interlagos: "br-1940", monza: "it-1922", barcelona: "es-1991", silverstone: "gb-1948", melbourne: "au-1953", xangai: "cn-2004",
  suzuka: "jp-1962", bahrein: "bh-2002", jeddah: "sa-2021", miami: "us-2022", montreal: "ca-1978", redbullring: "at-1969", spa: "be-1925",
  hungaroring: "hu-1986", zandvoort: "nl-1948", baku: "az-2016", singapura: "sg-2008", austin: "us-2012", mexico: "mx-1962", lasvegas: "us-2023",
  catar: "qa-2004", abudhabi: "ae-2009",
};
const MARGEM = 0.35; // além da caixa do circuito, 35% do maior lado em cada direção
const RUAS = "motorway|trunk|primary|secondary|tertiary|unclassified|residential|motorway_link|trunk_link|primary_link|secondary_link";

async function baixarOSM(bbox, tempo = 120) {
  const b = bbox.map((v) => v.toFixed(5)).join(",");
  const q = `[out:json][timeout:${tempo}];(
    way["building"](${b});
    way["highway"~"^(${RUAS})$"](${b});
    way["natural"="water"](${b});way["waterway"="riverbank"](${b});relation["natural"="water"](${b});
    way["leisure"~"^(park|golf_course|pitch)$"](${b});way["landuse"~"^(grass|forest|meadow|recreation_ground|village_green)$"](${b});way["natural"~"^(wood|scrub|grassland)$"](${b});
  );out tags geom qt;`;
  // a Overpass pública às vezes está ocupada (502/504/429): até 4 tentativas, alternando com o servidor de reserva, esperando cada vez mais
  const SERVIDORES = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
  let texto = null, ultimo = "";
  for (let k = 0; k < 4 && texto == null; k++) {
    if (k) await new Promise((v) => setTimeout(v, 15000 * k));
    try {
      const r = await fetch(SERVIDORES[k % 2], { method: "POST", headers: { "User-Agent": "corrida-galera-ferramenta/1.0", "Content-Type": "application/x-www-form-urlencoded" }, body: "data=" + encodeURIComponent(q), signal: AbortSignal.timeout((tempo + 60) * 1000) }); // (o tempo do servidor + 1 min por tentativa: sem limite, uma consulta pendurada parava tudo)
      if (r.ok) texto = await r.text(); else ultimo = `overpass: ${r.status}`;
    } catch (e) { ultimo = `overpass: ${e.message}`; }
  }
  if (texto == null) throw new Error(ultimo);
  console.log(`  baixado: ${(texto.length / 1024).toFixed(0)} KB do OpenStreetMap`);
  return JSON.parse(texto);
}

// Douglas-Peucker (tolerância em unidades do jogo)
function simplificar(pts, tol) {
  if (pts.length < 3) return pts;
  const manter = new Uint8Array(pts.length); manter[0] = manter[pts.length - 1] = 1;
  const pilha = [[0, pts.length - 1]];
  while (pilha.length) {
    const [a, b] = pilha.pop(); let dm = 0, im = -1;
    const [ax, ay] = pts[a], [bx, by] = pts[b], dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
    for (let i = a + 1; i < b; i++) { const u = Math.max(0, Math.min(1, ((pts[i][0] - ax) * dx + (pts[i][1] - ay) * dy) / l2)), d = Math.hypot(ax + dx * u - pts[i][0], ay + dy * u - pts[i][1]); if (d > dm) { dm = d; im = i; } }
    if (dm > tol) { manter[im] = 1; pilha.push([a, im], [im, b]); }
  }
  return pts.filter((_, i) => manter[i]);
}
const achatar = (pts) => pts.flatMap(([x, y]) => [Math.round(x), Math.round(y)]);
const area = (pts) => { let a = 0; for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; a += x1 * y2 - x2 * y1; } return Math.abs(a) / 2; };

async function umaPista(id, o) {
  const t = P.PISTAS[id], circ = CIRCUITOS[id]; if (!t || !circ) throw new Error(`sem circuito real para ${id}`);
  console.log(`${id} (${circ})`);
  const pasta = o.cache && path.join(o.cache, id);
  const linha = await comCache(pasta, `${circ}-linha.json`, () => baixarLinha(circ));
  const { pontos, proj } = reamostrar(linha);
  const pts = P.pontos(t, 6), enc = encaixar(pontos.map(proj), pts);
  const para = (lon, lat) => enc.aplicar(proj([lon, lat])); // (lon, lat) → unidades do jogo
  console.log(`  encaixe: erro médio ${enc.erro.toFixed(0)} u (${(enc.erro / enc.s).toFixed(1)} m), ${enc.s.toFixed(3)} u por metro`);
  const lats = linha.map((c) => c[1]), lons = linha.map((c) => c[0]), dLat = Math.max(...lats) - Math.min(...lats), dLon = Math.max(...lons) - Math.min(...lons), m = Math.max(dLat, dLon) * MARGEM;
  const bbox = [Math.min(...lats) - m, Math.min(...lons) - m, Math.max(...lats) + m, Math.max(...lons) + m];
  const osm = await comCache(pasta, `${circ}-mapa-osm.json`, () => baixarOSM(bbox, Number(o.tempo) || 120)); // (--tempo 300: as cidades densas, como Baku, passam dos 120 s do servidor)
  const tol = 1.5 * enc.s; // 1,5 m
  const predios = [], ruas = {}, agua = [], verde = []; let semAltura = 0;
  for (const e of osm.elements || []) {
    const tg = e.tags || {};
    const aneis = e.type === "way" && e.geometry ? [e.geometry] : e.type === "relation" ? (e.members || []).filter((mb) => mb.role === "outer" && mb.geometry).map((mb) => mb.geometry) : [];
    for (const g of aneis) {
      const p = simplificar(g.map((n) => para(n.lon, n.lat)), tol);
      if (tg.highway) { if (p.length >= 2) (ruas[tg.highway.replace("_link", "")] ||= []).push(achatar(p)); continue; }
      if (p.length < 4) continue;
      const anel = p.slice(0, -1); // (o contorno fechado repete o primeiro ponto)
      if (tg.building) {
        if (area(anel) < 30 * enc.s * enc.s) continue; // menos de 30 m² (guaritas, quiosques): some na miniatura
        let alt = parseFloat(tg.height); if (!(alt > 0)) { const n = parseFloat(tg["building:levels"]); alt = n > 0 ? n * 3.2 : NaN; }
        if (!(alt > 0)) { alt = 9; semAltura++; }
        predios.push([Math.round(Math.min(alt, 250)), ...achatar(anel)]);
      } else if (tg.natural === "water" || tg.waterway) agua.push(achatar(anel));
      else verde.push(achatar(anel));
    }
  }
  // `geo`: a conta do traçado do jogo de volta para o mundo (gp-satelite.js põe a imagem de satélite no lugar com ela). Do jogo (x, y):
  // u = (x - mb0) / s, v = (y - mb1) / s; mx = c·u + d·v + ma0; my = −d·u + c·v + ma1 (com espelho, my troca de sinal); lon = mx / (R cos lat0), lat = my / R
  const r6 = (v) => Math.round(v * 1e6) / 1e6, lat0 = linha[0][1];
  const geo = { lat0: r6(lat0), ma: enc.ma.map((v) => Math.round(v * 100) / 100), mb: enc.mb.map((v) => Math.round(v * 100) / 100), s: r6(enc.s), c: r6(enc.c), d: r6(enc.d), espelho: !!enc.espelho };
  const saida = { v: 2, pista: id, fonte: "© colaboradores do OpenStreetMap (ODbL), pela Overpass API; encaixe na linha de bacinger/f1-circuits (MIT)", uPorMetro: Math.round(enc.s * 1000) / 1000, geo, semAltura, predios, ruas, agua, verde };
  const arq = path.join(__dirname, "..", "public", "corrida", "mapas", `${id}.json`), texto = JSON.stringify(saida);
  fs.mkdirSync(path.dirname(arq), { recursive: true }); fs.writeFileSync(arq, texto);
  const nr = Object.values(ruas).reduce((s, l) => s + l.length, 0);
  console.log(`  ${predios.length} prédios (${semAltura} sem altura no OSM: 9 m), ${nr} ruas, ${agua.length} águas, ${verde.length} verdes → ${(texto.length / 1024).toFixed(0)} KB em ${path.relative(process.cwd(), arq)}`);
}

async function principal() {
  const o = lerOpcoes(process.argv.slice(2));
  // --faltam: só as pistas que ainda não têm public/corrida/mapas/<pista>.json
  const ids = o._.length ? o._ : Object.keys(CIRCUITOS).filter((id) => o.faltam === undefined || !fs.existsSync(path.join(__dirname, "..", "public", "corrida", "mapas", `${id}.json`)));
  if (!o._.length && o.todas === undefined && o.faltam === undefined) throw new Error("uso: node ferramentas/mapa-real.js <pista>... | --todas x | --faltam x [--cache pasta]");
  const falhas = [];
  for (const id of ids) { try { await umaPista(id, o); } catch (e) { falhas.push(`${id}: ${e.message}`); console.log(`  FALHOU: ${e.message}`); } await new Promise((v) => setTimeout(v, 3000)); } // (a Overpass pública pede calma entre consultas)
  if (falhas.length) { console.log(`
faltaram ${falhas.length}: ${falhas.join(" · ")}`); process.exitCode = 1; }
}
if (require.main === module) principal().catch((e) => { console.error(String(e.message || e)); process.exit(1); });
