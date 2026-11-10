#!/usr/bin/env node
// Gera os sons da pista (public/corrida/sons/<id>-<n>.mp3 e o índice sons/indice.json) com os efeitos sonoros da ElevenLabs. Cada
// som tem várias versões (o jogo sorteia uma a cada vez, sons.js) e as batidas têm três forças (leve, média, forte).
// As descrições NÃO falam de carro, corrida nem motor: só do material do som, isolado. Citar o carro faz a ElevenLabs pôr um
// motor junto (foi o que deu errado na primeira leva).
// Uso: ELEVENLABS_API_KEY=... node ferramentas/sons-pista.js [--refazer] [--so zebra,pistola]   (ou rode GERAR-SONS-PISTA.bat)
// A chave só é lida do ambiente: nunca é gravada nem impressa. Node 18+.
const fs = require("fs");
const path = require("path");

const PASTA = path.join(__dirname, "..", "public", "corrida", "sons");
const LIMPO = "isolated single sound effect, clean close recording, silent background, nothing else audible, no music, no voices";
// `texto`: a descrição em inglês (a ElevenLabs entende melhor); `seg`: a duração; `n`: quantas versões; `laco`: repete sem emenda
const SONS = [
  { id: "zebra", n: 3, seg: 2, laco: true, texto: `Fast rhythmic deep thumping of a rubber tyre rolling over raised ridged concrete rumble strips, low frequency drumming vibration, ${LIMPO}` },
  { id: "torcida", n: 2, seg: 12, laco: true, texto: "Large outdoor stadium crowd ambience from a distance, constant excited murmur with scattered cheers and whistles, wide open air, no music, no announcer, no clear words" },
  { id: "pistola", n: 3, seg: 1, texto: `Single short burst of a pneumatic impact wrench spinning a wheel nut, brrrt, sharp metallic rattle then stop, ${LIMPO}` },
  { id: "macaco", n: 2, seg: 1, texto: `Heavy steel lifting jack quickly released, metal clunk and thud dropping onto concrete, ${LIMPO}` },
  { id: "chiado", n: 2, seg: 3, laco: true, texto: `Continuous high pitched screech of a rubber tyre sliding and skidding on dry asphalt, steady squeal, ${LIMPO}` },
  { id: "drs", n: 2, seg: 0.6, texto: `Short mechanical snap of a small carbon flap opening, quick hydraulic actuator click and clack, ${LIMPO}` },
  { id: "batida-muro-leve", n: 3, seg: 1, texto: `Light scrape and small knock of hard carbon fibre bodywork brushing against a concrete wall, ${LIMPO}` },
  { id: "batida-muro-media", n: 3, seg: 1.5, texto: `Solid impact of carbon fibre bodywork hitting a concrete barrier, crack and short scrape with small debris, ${LIMPO}` },
  { id: "batida-muro-forte", n: 3, seg: 2.5, texto: `Violent heavy crash of carbon fibre bodywork smashing into a concrete wall, loud crunch, parts breaking and debris scattering, ${LIMPO}` },
  { id: "batida-carro-leve", n: 3, seg: 0.8, texto: `Two hard plastic and carbon panels lightly tapping and rubbing together, small knock, ${LIMPO}` },
  { id: "batida-carro-media", n: 3, seg: 1.2, texto: `Two carbon fibre bodywork panels colliding, sharp crack and rubber scrub, ${LIMPO}` },
  { id: "batida-carro-forte", n: 3, seg: 2, texto: `Hard collision of two carbon fibre bodies, loud crunch, splintering pieces and rubber tyres scrubbing, ${LIMPO}` },
  { id: "chegada", n: 2, seg: 5, texto: "Huge outdoor stadium crowd erupting into cheers and applause with a few air horns, celebration, no music, no announcer, no fireworks" },
  // o ERS ligando (sons.js, ersLiga) e a abertura do rádio da equipe antes da voz (radio.js, abertura): sem falar de carro, motor nem corrida
  { id: "ers-liga", n: 2, seg: 0.8, texto: `Short futuristic electric power surge activation, rising high voltage whine with a crisp electric crackle and a bright digital confirmation chime at the end, energy boost, ${LIMPO}` },
  { id: "radio-bip", n: 2, seg: 0.6, texto: `Short two-tone electronic radio transmission chirp, quick digital beep beep with a soft static squelch click, push-to-talk walkie-talkie opening a channel, ${LIMPO}` },
  { id: "chuva", n: 1, seg: 12, laco: true, texto: "Steady medium rain falling on wet asphalt and puddles outdoors, soft continuous hiss and patter, no thunder, no wind, no traffic, no music" },
];

const argv = process.argv.slice(2), refazer = argv.includes("--refazer"), iso = argv.indexOf("--so");
const so = iso >= 0 ? String(argv[iso + 1] || "").split(",").map((s) => s.trim()).filter(Boolean) : null;
const arquivo = (id, k) => path.join(PASTA, `${id}-${k}.mp3`);

async function pedir(chave, s, comLaco) {
  const corpo = { text: s.texto, duration_seconds: Math.max(0.5, s.seg), prompt_influence: 0.9 };
  if (comLaco) corpo.loop = true;
  return fetch("https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128", {
    method: "POST", headers: { "xi-api-key": chave, "Content-Type": "application/json", Accept: "audio/mpeg" }, body: JSON.stringify(corpo),
  });
}
async function gerar(chave, s, k) {
  let r = await pedir(chave, s, s.laco);
  if (!r.ok && s.laco && (r.status === 400 || r.status === 422)) r = await pedir(chave, s, false); // (conta sem o laço: gera normal)
  if (!r.ok) {
    const erro = new Error(r.status === 401 ? "chave da ElevenLabs recusada (401): confira se copiou a chave certa" : r.status === 429 ? "limite da ElevenLabs atingido (429): espere um pouco ou veja o seu plano" : `a ElevenLabs respondeu ${r.status}: ${(await r.text()).slice(0, 200)}`);
    erro.status = r.status; throw erro;
  }
  fs.writeFileSync(arquivo(s.id, k), Buffer.from(await r.arrayBuffer()));
}
// o índice que o jogo lê: { id: quantas versões existem }
function gravarIndice() {
  const ind = {};
  for (const s of SONS) { let k = 1; while (fs.existsSync(arquivo(s.id, k))) k++; if (k > 1) ind[s.id] = k - 1; }
  fs.writeFileSync(path.join(PASTA, "indice.json"), JSON.stringify(ind, null, 1) + "\n");
  return ind;
}

async function main() {
  const chave = (process.env.ELEVENLABS_API_KEY || "").trim();
  if (!chave) { console.error("Falta a chave: defina ELEVENLABS_API_KEY (ou use o GERAR-SONS-PISTA.bat)."); process.exit(1); }
  fs.mkdirSync(PASTA, { recursive: true });
  let feitos = 0, pulados = 0, falhas = 0, parar = false;
  for (const s of SONS) {
    if (parar) break;
    if (so && !so.includes(s.id)) continue;
    for (let k = 1; k <= s.n; k++) {
      const nome = `${s.id}-${k}`;
      if (!refazer && !so && fs.existsSync(arquivo(s.id, k))) { pulados++; console.log(`${nome}: já existe, pulei`); continue; }
      try { await gerar(chave, s, k); feitos++; console.log(`${nome}: ok`); }
      catch (e) { falhas++; console.error(`${nome}: ${e.message}`); if (e.status === 401 || e.status === 429) { parar = true; break; } }
    }
  }
  const ind = gravarIndice();
  console.log(`\nGerados: ${feitos} · pulados: ${pulados} · com erro: ${falhas} · sons no índice: ${Object.keys(ind).length} · pasta: public\\corrida\\sons`);
  process.exit(falhas ? 1 : 0);
}
main();
