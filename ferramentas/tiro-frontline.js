#!/usr/bin/env node
/* Monta o Tiro da Galera novo a partir do Riposte: Frontline (código MIT, github.com/BenDBSS/Riposte-Frontline-Source).
   Uso: node ferramentas/tiro-frontline.js <pasta dist/ do Riposte> [saída = public/tiro]
   O que NÃO é MIT no Riposte fica de fora ou é trocado aqui (NOTICE.md deles):
   - nome e logo → "Tiro da Galera" e um logo nosso; ícones, capa (key art), deck/ e manifest ficam de fora;
   - músicas do Suno (uso não comercial: a Vila é) e som de acerto (flashkit): ficam os deles;
   - animações Mixamo: ainda as deles (fase 3: refazer pela nossa conta, ferramentas/animacoes-mixamo.mjs).
   Também: contas desligadas (a API deles não existe aqui, e /api/ é da Vila), sem service worker e sem a CSP com hashes
   (os scripts mudaram). O online passa pelo relé do nosso servidor (servidor/jogos/tiro-rele.js), sem PeerJS. */
const fs = require("fs"), path = require("path");

const DIST = path.resolve(process.argv[2] || "");
const OUT = path.resolve(process.argv[3] || path.join(__dirname, "..", "public", "tiro"));
if (!fs.existsSync(path.join(DIST, "riposte-frontline.html"))) { console.error("Passe a pasta dist/ do Riposte."); process.exit(1); }

const NOME = "Tiro da Galera";
const FORA = new Set(["deck", "icons", "favicon.ico", "manifest.webmanifest", "sw.js", "robots.txt", "sitemap.xml", "version.json", "riposte-frontline.html"]);

function troca(txt, de, para, { min = 1, todas = true, nome = String(de) } = {}) {
  let n = 0;
  const r = txt.replace(de instanceof RegExp ? de : new RegExp(de.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), todas ? "g" : ""), (...a) => { n++; return typeof para === "function" ? para(...a) : para; });
  if (n < min) throw new Error(`não achei: ${nome}`);
  console.log(`  ${String(n).padStart(4)}× ${nome}`);
  return r;
}

// ---------- copia o resto da dist ----------
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(DIST)) if (!FORA.has(f)) fs.cpSync(path.join(DIST, f), path.join(OUT, f), { recursive: true });

// ---------- logo e fundo do menu ----------
const LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 230">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd25a"/><stop offset="1" stop-color="#f39c12"/></linearGradient></defs>
<g font-family="Impact,'Arial Black',sans-serif" font-weight="900" text-anchor="middle">
<text x="500" y="128" font-size="132" letter-spacing="10" fill="url(#g)" stroke="#2a1800" stroke-width="5" paint-order="stroke">TIRO</text>
<rect x="150" y="150" width="700" height="8" fill="#ffb020"/>
<text x="500" y="218" font-size="54" letter-spacing="22" fill="#f1f2f4">DA GALERA</text>
</g></svg>`;
const FUNDO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
<defs><radialGradient id="r" cx=".7" cy=".35" r=".9"><stop offset="0" stop-color="#4a3a1c"/><stop offset=".5" stop-color="#1a1710"/><stop offset="1" stop-color="#050505"/></radialGradient>
<pattern id="p" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#ffffff08"/></pattern></defs>
<rect width="1600" height="900" fill="url(#r)"/><rect width="1600" height="900" fill="url(#p)"/>
<g fill="none" stroke="#ffb02055" stroke-width="6"><circle cx="1120" cy="380" r="170"/><circle cx="1120" cy="380" r="90"/><path d="M1120 150v120M1120 490v120M890 380h120M1230 380h120"/></g></svg>`;
const svgUrl = (s) => `url(data:image/svg+xml;base64,${Buffer.from(s).toString("base64")})`;
const ui = fs.readdirSync(path.join(OUT, "tex")).find((f) => f.startsWith("socle-ui."));
fs.writeFileSync(path.join(OUT, "tex", ui), `(function(s){s.setProperty('--key-art',${JSON.stringify(svgUrl(FUNDO))});s.setProperty('--logo',${JSON.stringify(svgUrl(LOGO))})})(document.documentElement.style);\n`);
console.log("logo e fundo trocados");

// as músicas (Suno, só uso não comercial, como a Vila) e o som de acerto (flashkit) ficam os deles

// ---------- a página ----------
let h = fs.readFileSync(path.join(DIST, "riposte-frontline.html"), "utf8");
h = troca(h, /<meta http-equiv="Content-Security-Policy"[^>]*>\s*/, "", { nome: "CSP com hashes" });
h = troca(h, /<link rel="(?:canonical|icon|apple-touch-icon|manifest)"[^>]*>\s*/g, "", { nome: "links de ícone/manifest/canonical" });
h = troca(h, /<meta (?:property="og:|name="twitter:|name="google-site-verification)[^>]*>\s*/g, "", { nome: "metas de compartilhamento" });
h = troca(h, /<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g, "", { nome: "ld+json" });
h = troca(h, /<title>[^<]*<\/title>/, `<title>${NOME}</title>\n<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎯</text></svg>">`, { nome: "título" });
h = troca(h, /<meta name="description" content="[^"]*">/, `<meta name="description" content="${NOME}: FPS da Vila do Tabba, no navegador, contra bots ou com os amigos.">`, { min: 0, nome: "descrição" });
h = troca(h, "if(location.protocol==='file:')return{ok:false,status:0,data:null};", "return{ok:false,status:0,data:null};", { nome: "contas desligadas" });
h = troca(h, "location.protocol==='file:')break;", "true)break;", { nome: "sem esperar a API" });
h = troca(h, "if('serviceWorker'in navigator){", "if(false){", { nome: "sem service worker" });
h = troca(h, "fetch(new URL('/version.json?t='", "fetch(new URL('version.json?t='", { min: 0, nome: "version.json relativo" });
// online pelo nosso servidor (servidor/jogos/tiro-rele.js): sem o PeerJS, o jogo manda tudo pelo relé
h = troca(h, /<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/peerjs[^>]*><\/script>\s*/, "", { nome: "PeerJS" });
h = troca(h, /<meta name="cod-relay" content="[^"]*">/, `<meta name="cod-relay" content="">\n<script>window.NET_RELAY_URL=(location.protocol==='https:'?'wss://':'ws://')+location.host+'/tiro/rele';</script>`, { nome: "relé" });
// português (ferramentas/tiro-pt.json: texto francês do jogo → português). O jogo só conhece 'fr' e 'en': o 'en' vira o
// português (o dicionário dele é trocado pelo nosso), e é o padrão; o francês continua nas Opções
const PT = JSON.parse(fs.readFileSync(path.join(__dirname, "tiro-pt.json"), "utf8"));
h = troca(h, /const I18N_EN=(\{[\s\S]*?\});const I18N_MISS/, (_, d) => {
  const en = JSON.parse(d), sem = Object.keys(en).filter((k) => !(k in PT));
  if (sem.length) console.log(`  ${sem.length} textos sem português (ficam em francês), ex.: ${sem.slice(0, 3).join(" | ")}`);
  const dic = {}; for (const k of Object.keys(en)) dic[k] = k in PT ? PT[k] : k;
  return "const I18N_EN=" + JSON.stringify(dic) + ";const I18N_MISS";
}, { nome: "dicionário português" });
h = troca(h, "['en','English']", "['en','Português']", { nome: "opção Português" });
h = troca(h, "if(c==='fr'||c==='en')return c;", "if(c==='fr')return c;", { nome: "português por padrão" });
h = troca(h, "const LOCALE=LANG==='fr'?'fr-FR':'en-US';", "const LOCALE=LANG==='fr'?'fr-FR':'pt-BR';", { nome: "números em pt-BR" });
h = troca(h, "document.documentElement.lang=LANG;", "document.documentElement.lang=LANG==='en'?'pt-BR':LANG;", { nome: "lang da página" });
h = troca(h, "const ordinal=(n)=>(LANG==='en'?", "const ordinal=(n)=>(LANG==='en'?n+'º':LANG!=='fr'?", { nome: "ordinal 1º" });
h = troca(h, /Riposte: Frontline|Riposte Frontline/g, NOME, { nome: "nome" });
h = troca(h, /Installer Riposte/g, "Installer " + NOME, { min: 0, nome: "instalador" });
h = troca(h, /content="Riposte"/g, 'content="Tiro"', { min: 0, nome: "nome curto" });
const sobra = (h.match(/Riposte/g) || []).length;
console.log(`  "Riposte" que sobrou (crédito/código): ${sobra}`);
fs.writeFileSync(path.join(OUT, "index.html"), h);

// ---------- créditos (MIT pede a nota de copyright) ----------
fs.writeFileSync(path.join(OUT, "CREDITOS.txt"), `${NOME} é feito a partir do código de Riposte: Frontline, de BenDBSS,
https://github.com/BenDBSS/Riposte-Frontline-Source, sob a licença MIT abaixo. O nome e o logo originais não são usados aqui.
Músicas: BenDBSS com o Suno (uso não comercial). Som de acerto: flashkit.com. Texturas e céus: Poly Haven e ambientCG (CC0). three.js: MIT.
Sons em CC BY:
- Woodpecker by Benboncan (freesound.org/s/66955), CC BY 3.0
- Waterfall by Samuel Strågefors (straget, freesound.org/s/489073), CC BY
- "Grenade pin pull" by CGEffex (freesound.org/s/93837), CC BY 4.0
- Voz de referência inglesa: LibriTTS-R (Y. Koizumi et al., Google, 2023), LibriVox, CC BY 4.0
- Voz de referência francesa: Multilingual LibriSpeech (V. Pratap et al., Facebook AI, 2020), LibriVox, CC BY 4.0

MIT License

Copyright (c) 2026 BenDBSS

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`);
console.log("pronto:", OUT);
