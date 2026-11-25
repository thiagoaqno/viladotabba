#!/usr/bin/env node
// Gera as falas do rádio do Tiro da Galera com a ElevenLabs, a partir de ferramentas/tiro-vozes/falas.json (os textos) e
// ferramentas/tiro-vozes/vozes.json (uma voz por tipo de arma da classe). Os mp3 vão para tiro-vozes/ (a voz padrão) e
// tiro-vozes/<grupo>/ (as outras). Só gera os que ainda não existem (--refazer: todos).
// Uso: ELEVENLABS_API_KEY=... node ferramentas/tiro-vozes.js [--estimar] [--refazer] [--grupo <padrao|smg|sniper|shotgun>]   (ou VOZES-TIRO.bat)
// A chave só é lida do ambiente: nunca é gravada nem impressa. Depois: node ferramentas/tiro-frontline.js <dist> monta os pacotes.
const fs = require("fs"), path = require("path");
const PASTA = path.join(__dirname, "tiro-vozes");
const argv = process.argv.slice(2), ig = argv.indexOf("--grupo"), SO = ig >= 0 ? String(argv[ig + 1] || "").trim() : "";
const refazer = argv.includes("--refazer"), estimar = argv.includes("--estimar");
const ler = (f) => { const j = JSON.parse(fs.readFileSync(path.join(PASTA, f), "utf8")); delete j._; return j; };
const TEXTOS = ler("falas.json"), VOZES = ler("vozes.json");
const pastaDo = (g) => (g === "padrao" ? PASTA : path.join(PASTA, g));

const FALAS = [];
for (const [g, v] of Object.entries(VOZES)) {
  if (SO && g !== SO) continue;
  for (const [id, textos] of Object.entries(TEXTOS)) textos.forEach((texto, i) => FALAS.push({ g, voz: v.voz, arq: path.join(pastaDo(g), id + (i ? "_" + (i + 1) : "") + ".mp3"), texto }));
}

async function gerar(chave, f) {
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${f.voz}?output_format=mp3_44100_64`, {
    method: "POST",
    headers: { "xi-api-key": chave, "Content-Type": "application/json", Accept: "audio/mpeg" },
    // rádio de combate: um pouco menos estável que o engenheiro da Corrida, para soar com mais urgência
    body: JSON.stringify({ text: f.texto, model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.55, similarity_boost: 0.75, style: 0.25, use_speaker_boost: true } }),
  });
  if (!r.ok) {
    const erro = new Error(r.status === 401 ? "chave da ElevenLabs recusada (401): confira se copiou a chave certa" : r.status === 429 ? "limite da ElevenLabs atingido (429): espere um pouco e rode de novo (as já feitas são puladas)" : r.status === 404 ? `a voz ${f.voz} não existe ou não está na sua biblioteca (404)` : `a ElevenLabs respondeu ${r.status}`);
    erro.status = r.status; throw erro;
  }
  fs.mkdirSync(path.dirname(f.arq), { recursive: true });
  fs.writeFileSync(f.arq, Buffer.from(await r.arrayBuffer()));
}

async function main() {
  const fazer = FALAS.filter((f) => refazer || !fs.existsSync(f.arq));
  if (estimar) {
    const chars = (l) => l.reduce((a, f) => a + f.texto.length, 0).toLocaleString("pt-BR");
    for (const [g, v] of Object.entries(VOZES)) {
      if (SO && g !== SO) continue;
      const l = fazer.filter((f) => f.g === g);
      console.log(`  ${g.padEnd(8)} ${v.armas}: ${l.length ? `${l.length} a gerar, ${chars(l)} caracteres` : "pronta"}`);
    }
    console.log(`Total a gerar: ${fazer.length} falas · ${chars(fazer)} caracteres no plano da ElevenLabs`);
    return;
  }
  const chave = (process.env.ELEVENLABS_API_KEY || "").trim();
  if (!chave) { console.error("Falta a chave: defina ELEVENLABS_API_KEY (ou use o VOZES-TIRO.bat)."); process.exit(1); }
  let feitas = 0, falhas = 0;
  for (const [i, f] of fazer.entries()) {
    const n = `[${i + 1}/${fazer.length}] ${f.g}/${path.basename(f.arq)}`;
    try { await gerar(chave, f); feitas++; console.log(`${n}: ok`); }
    catch (e) { falhas++; console.error(`${n}: ${e.message}`); if (e.status === 401 || e.status === 429) break; }
  }
  console.log(`\nGeradas: ${feitas} · com erro: ${falhas} · total: ${FALAS.length}`);
  process.exit(falhas ? 1 : 0);
}
main();
