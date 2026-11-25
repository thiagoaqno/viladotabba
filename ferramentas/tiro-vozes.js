#!/usr/bin/env node
// Gera as falas do rádio do Tiro da Galera com a ElevenLabs: ferramentas/tiro-vozes/<id>[_N].mp3, a partir de
// ferramentas/tiro-vozes/falas.json. Só gera as que ainda não têm mp3 (--refazer: todas).
// Uso: ELEVENLABS_API_KEY=... node ferramentas/tiro-vozes.js [--estimar] [--refazer] [--voz <id>]   (ou rode VOZES-TIRO.bat)
// A chave só é lida do ambiente: nunca é gravada nem impressa. Depois: node ferramentas/tiro-frontline.js <dist> monta o pacote.
const fs = require("fs"), path = require("path");
const PASTA = path.join(__dirname, "tiro-vozes");
const argv = process.argv.slice(2), iv = argv.indexOf("--voz");
const VOZ = (iv >= 0 ? String(argv[iv + 1] || "").trim() : "") || (process.env.ELEVENLABS_VOICE_ID || "").trim() || "oCWW6YTSEVFt26dBO8vU";
const refazer = argv.includes("--refazer"), estimar = argv.includes("--estimar");

const FALAS = [];
for (const [id, textos] of Object.entries(JSON.parse(fs.readFileSync(path.join(PASTA, "falas.json"), "utf8")))) {
  if (id === "_") continue;
  textos.forEach((texto, i) => FALAS.push({ arq: id + (i ? "_" + (i + 1) : "") + ".mp3", texto }));
}

async function gerar(chave, f) {
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOZ}?output_format=mp3_44100_64`, {
    method: "POST",
    headers: { "xi-api-key": chave, "Content-Type": "application/json", Accept: "audio/mpeg" },
    // rádio de combate: um pouco menos estável que o engenheiro da Corrida, para soar com mais urgência
    body: JSON.stringify({ text: f.texto, model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.55, similarity_boost: 0.75, style: 0.25, use_speaker_boost: true } }),
  });
  if (!r.ok) {
    const erro = new Error(r.status === 401 ? "chave da ElevenLabs recusada (401): confira se copiou a chave certa" : r.status === 429 ? "limite da ElevenLabs atingido (429): espere um pouco e rode de novo (as já feitas são puladas)" : `a ElevenLabs respondeu ${r.status}`);
    erro.status = r.status; throw erro;
  }
  fs.writeFileSync(path.join(PASTA, f.arq), Buffer.from(await r.arrayBuffer()));
}

async function main() {
  const fazer = FALAS.filter((f) => refazer || !fs.existsSync(path.join(PASTA, f.arq)));
  if (estimar) {
    const chars = (l) => l.reduce((a, f) => a + f.texto.length, 0);
    console.log(`Falas do Tiro: ${FALAS.length} · a gerar: ${fazer.length} · ${chars(fazer).toLocaleString("pt-BR")} caracteres no plano da ElevenLabs`);
    return;
  }
  const chave = (process.env.ELEVENLABS_API_KEY || "").trim();
  if (!chave) { console.error("Falta a chave: defina ELEVENLABS_API_KEY (ou use o VOZES-TIRO.bat)."); process.exit(1); }
  let feitas = 0, falhas = 0;
  for (const [i, f] of fazer.entries()) {
    const n = `[${i + 1}/${fazer.length}] ${f.arq}`;
    try { await gerar(chave, f); feitas++; console.log(`${n}: ok`); }
    catch (e) { falhas++; console.error(`${n}: ${e.message}`); if (e.status === 401 || e.status === 429) break; }
  }
  console.log(`\nGeradas: ${feitas} · com erro: ${falhas} · total: ${FALAS.length}`);
  process.exit(falhas ? 1 : 0);
}
main();
