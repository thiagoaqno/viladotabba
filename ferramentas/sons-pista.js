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
  // os efeitos novos (2026-11-10): o assoalho raspando (acerto do carro), a suspensão batendo no fundo, a brita e a grama ao sair da pista,
  // o vento no cockpit, o ERS acabando e o bipe do limitador do box. Nenhum fala: tocam pelo que acontece com o carro (sons.js)
  { id: "raspa", n: 2, seg: 2, laco: true, texto: `Continuous harsh grinding scrape of a hard wooden plank and titanium skid blocks dragging on rough asphalt at high speed, gritty friction rasp, ${LIMPO}` },
  { id: "fundo", n: 3, seg: 0.6, texto: `Single short heavy dull thud of a stiff suspension bottoming out, deep low thump with a small metallic knock, ${LIMPO}` },
  { id: "brita", n: 2, seg: 3, laco: true, texto: `Continuous crunching of rubber tyres rolling fast over loose gravel stones, pebbles spraying and rattling, ${LIMPO}` },
  { id: "grama", n: 2, seg: 3, laco: true, texto: `Continuous rough rumble of rubber tyres rolling fast over bumpy grass and dirt, soft thuds and swishing blades of grass, ${LIMPO}` },
  { id: "ers-fim", n: 2, seg: 0.7, texto: `Short electric power-down, a descending high voltage whine fading out with a soft low digital blip, energy depleted, ${LIMPO}` },
  { id: "limitador", n: 1, seg: 0.4, texto: `Single short soft electronic beep, a clean mid-pitched dashboard warning tone, ${LIMPO}` },
  // (2026-11-23, o Thiago: "aumenta bastante a variedade de sons de trovão, chuva, vento... quero uma GRANDE variedade") o clima com muitas versões, e
  // cada versão com uma DESCRIÇÃO diferente (`textos`: a versão k usa a k-ésima, em volta): a mesma frase dava sons parecidos demais
  { id: "trovao-perto", n: 8, seg: 6, textos: [
    "Very close lightning strike: an instant violent electric crack splitting the air, then a massive deep boom that shakes and rolls away, outdoors, no rain, no music, no voices",
    "Nearby thunderclap: a sharp ripping tearing crackle of lightning followed by a heavy explosive bang and a short rumble, outdoors, no music, no voices",
    "Close thunder: a sudden loud whip-like snap and a huge booming roar that echoes off hills and fades, outdoors, no music, no voices",
    "Lightning hits very near: a bright sizzling crack, a deafening thunder blast, then rumbling aftershocks dying out, outdoors, no music, no voices",
    "Thunder right overhead: a booming cannon-like crash with crackling branches of sound and a long deep tail, outdoors, no music, no voices",
    "Close storm thunder: a harsh splintering crack then a rolling heavy rumble that grows and slowly settles, outdoors, no music, no voices" ] },
  { id: "trovao-medio", n: 8, seg: 7, textos: [
    "Thunder a short distance away: a dull boom followed by a long grumbling rumble rolling across the sky, outdoors, no music, no voices",
    "Medium distance thunderstorm: a deep rolling growl that rises, rumbles in waves and fades, outdoors, no music, no voices",
    "Thunder over the valley: a soft crack then a broad booming roll echoing from side to side, outdoors, no music, no voices",
    "Storm thunder at medium range: several overlapping deep rumbles and low booms tumbling one after another, outdoors, no music, no voices",
    "Rolling thunder: a heavy low drum-like rumble with a few muffled cracks inside it, slowly dying away, outdoors, no music, no voices" ] },
  { id: "trovao-longe", n: 8, seg: 8, textos: [
    "Distant thunder: a long low rolling rumble far away on the horizon, soft and deep, growing and fading slowly, no rain, no music, no voices",
    "Very far thunder: a faint muffled grumble barely above silence, low and warm, drifting away, outdoors, no music, no voices",
    "Thunder far in the distance: a slow deep murmur rolling for several seconds, like furniture moving far away, outdoors, no music, no voices",
    "Faraway storm: a gentle low boom and a long soft rumbling tail across the horizon, outdoors, no music, no voices",
    "Distant thunder rolling behind hills: deep, muffled, uneven waves of low rumble, outdoors, no music, no voices" ] },
  { id: "chuva-fraca", n: 4, seg: 12, laco: true, textos: [
    "Light drizzle falling on asphalt outdoors, soft fine pattering and a gentle hiss, calm, no thunder, no wind, no traffic, no music",
    "Gentle light rain on a wet road and grass, sparse soft drops, quiet steady hush, no thunder, no music",
    "Fine misty drizzle outdoors, very soft continuous whisper of tiny drops on concrete, no thunder, no music",
    "Light rain beginning on a dry track, scattered drops tapping on asphalt and metal barriers, no thunder, no music" ] },
  { id: "chuva", n: 6, seg: 12, laco: true, textos: [
    "Steady medium rain falling on wet asphalt and puddles outdoors, soft continuous hiss and patter, no thunder, no wind, no traffic, no music",
    "Moderate rain on an open race circuit: drops on asphalt, grass and metal fences, steady wet hiss, no thunder, no music",
    "Medium rain with water running in gutters and dripping from a grandstand roof, continuous patter, no thunder, no music",
    "Constant rain on a wide open space, even shower on puddles and concrete walls, gentle splashes, no thunder, no music",
    "Rain shower outdoors with drops drumming on plastic signs and tarps over a steady hiss, no thunder, no music",
    "Medium rainfall on wet tarmac with small streams of water and puddle splashes, no thunder, no music" ] },
  { id: "chuva-forte", n: 5, seg: 12, laco: true, textos: [
    "Heavy downpour on asphalt outdoors, dense roaring rain, water splashing hard in deep puddles, no thunder, no music",
    "Torrential rain storm on an open circuit, thick wall of rain, gushing water and loud drumming on metal roofs, no thunder, no music",
    "Very heavy tropical rain, intense hissing roar, water pouring off grandstand roofs and streaming across the ground, no thunder, no music",
    "Strong rain with gusts of wind driving sheets of water across concrete, loud splattering, no thunder, no music",
    "Cloudburst: violent heavy rain hammering asphalt and puddles, overwhelming constant roar, no thunder, no music" ] },
  { id: "chuva-capacete", n: 4, seg: 8, laco: true, textos: [
    "Raindrops hitting a hard plastic helmet and a visor up close, rapid ticking and tapping over a soft muffled hiss, no music, no voices",
    "Rain pattering on a curved hard shell right next to the ear, crisp clicks of drops, muffled outside rain, no music",
    "Heavy rain drumming on a closed motorcycle helmet heard from inside, dense close tapping, no music, no voices",
    "Light rain ticking on a visor and a carbon fibre panel, sparse close drops and a faint hiss, no music" ] },
  { id: "vento", n: 6, seg: 6, laco: true, textos: [
    "Steady strong wind rushing past an open helmet at very high speed, constant airy roar and buffeting, no gusts stopping, no music, no voices",
    "High speed wind noise around a helmet, deep turbulent rumble with a bright airy hiss on top, constant, no music, no voices",
    "Fast airflow roaring over a small windscreen, steady whooshing with light fluttering turbulence, no music, no voices",
    "Strong wind blast at speed, thick broadband roar with low buffeting thumps, constant, no music, no voices",
    "Wind rushing past the ears in an open cockpit, smooth loud hiss rising and falling slightly, no music, no voices",
    "Heavy wind pressure at very high speed, dense rumbling air and whistling edges, constant, no music, no voices" ] },
  { id: "vento-rajada", n: 6, seg: 4, textos: [
    "Single strong gust of storm wind sweeping across an open field, rising whoosh and fading, outdoors, no music, no voices",
    "Wind gust howling past metal fences and flags, a short whistling surge then calm, outdoors, no music, no voices",
    "Stormy wind gust rattling tarps and banners, flapping fabric and a rushing swell, outdoors, no music, no voices",
    "A cold gust of wind with rain blowing sideways, brief roaring surge, outdoors, no music, no voices",
    "Low moaning wind gust through grandstands and scaffolding, eerie swell then quiet, outdoors, no music, no voices",
    "Quick sharp gust of wind snapping a big flag and whooshing past, outdoors, no music, no voices" ] },
  // (2026-11-23, o Thiago: "faz os sons: ambiente de cada pista: mar em Mônaco, pássaros em Spa, avião em Silverstone") um laço de ambiente por
  // pista (amb-<id da pista>), por baixo de tudo no barramento do ambiente (sons.js, ambientePista); duas versões de cada
  { id: "amb-monaco", n: 2, seg: 20, laco: true, texto: "Mediterranean harbour ambience: gentle sea waves lapping against a stone quay and yacht hulls, rigging clinking, distant seagulls, light breeze, no engines, no cars, no music, no voices" },
  { id: "amb-spa", n: 2, seg: 20, laco: true, texto: "Ardennes forest ambience: lots of birds singing in tall pine trees, wind rustling through the leaves, damp cool woodland, a distant stream, no engines, no cars, no music, no voices" },
  { id: "amb-silverstone", n: 2, seg: 20, laco: true, texto: "English countryside airfield ambience: a small propeller airplane flying overhead and fading, skylarks, wind across open flat fields, no engines, no cars, no music, no voices" },
  { id: "amb-monza", n: 2, seg: 20, laco: true, texto: "Old royal park ambience: birds in large old trees, leaves rustling, a gentle summer breeze, a distant church bell, no engines, no cars, no music, no voices" },
  { id: "amb-interlagos", n: 2, seg: 20, laco: true, texto: "Brazilian city edge ambience: tropical birds chirping, distant urban traffic hum, warm humid breeze, a far dog barking, no engines, no cars, no music, no voices" },
  { id: "amb-suzuka", n: 2, seg: 20, laco: true, texto: "Japanese countryside summer ambience: loud cicadas buzzing, a distant amusement park ferris wheel creaking, warm wind, no engines, no cars, no music, no voices" },
  { id: "amb-lasvegas", n: 2, seg: 20, laco: true, texto: "Las Vegas Strip at night ambience: city hum, distant casino crowd chatter, fountains splashing, faint electric buzz of neon signs, no engines, no cars, no music, no voices" },
  { id: "amb-singapura", n: 2, seg: 20, laco: true, texto: "Tropical city night ambience: insects and frogs chirping, humid air, distant city hum, water lapping at the bay, no engines, no cars, no music, no voices" },
  { id: "amb-baku", n: 2, seg: 20, laco: true, texto: "Caspian seaside city ambience: wind gusts off the sea, waves on a promenade, flags flapping, distant city hum, no engines, no cars, no music, no voices" },
  { id: "amb-bahrein", n: 2, seg: 20, laco: true, texto: "Desert night ambience: dry warm wind blowing sand across open ground, faint distant hum of floodlight generators, no engines, no cars, no music, no voices" },
  { id: "amb-jeddah", n: 2, seg: 20, laco: true, texto: "Red Sea corniche at night ambience: steady sea breeze, small waves on rocks, distant city hum, palm fronds rustling, no engines, no cars, no music, no voices" },
  { id: "amb-abudhabi", n: 2, seg: 20, laco: true, texto: "Marina at dusk ambience: calm water lapping against yachts, ropes creaking, warm breeze, distant city hum, no engines, no cars, no music, no voices" },
  { id: "amb-catar", n: 2, seg: 20, laco: true, texto: "Desert at night ambience: steady dry wind over sand, crickets, faint distant generator hum, no engines, no cars, no music, no voices" },
  { id: "amb-miami", n: 2, seg: 20, laco: true, texto: "Ocean breeze ambience: palm trees rustling, distant surf, tropical birds, warm wind, a distant boat horn, no engines, no cars, no music, no voices" },
  { id: "amb-mexico", n: 2, seg: 20, laco: true, texto: "Big city park ambience: Mexico City urban hum, birds in park trees, distant street vendors whistles and bustle, no engines, no cars, no music, no voices" },
  { id: "amb-austin", n: 2, seg: 20, laco: true, texto: "Texas hill country ambience: crickets and cicadas, dry grass rustling in warm wind, a distant cow, open land, no engines, no cars, no music, no voices" },
  { id: "amb-montreal", n: 2, seg: 20, laco: true, texto: "River island park ambience: the Saint Lawrence river flowing, geese and ducks, wind in trees, distant city, no engines, no cars, no music, no voices" },
  { id: "amb-melbourne", n: 2, seg: 20, laco: true, texto: "Albert Park lake ambience: water birds, kookaburra laughing, magpies warbling, wind through gum trees, no engines, no cars, no music, no voices" },
  { id: "amb-barcelona", n: 2, seg: 20, laco: true, texto: "Spanish countryside ambience: cicadas buzzing in the heat, dry wind through pine and olive trees, distant birds, no engines, no cars, no music, no voices" },
  { id: "amb-hungaroring", n: 2, seg: 20, laco: true, texto: "Hungarian hills in summer ambience: cicadas and crickets, warm wind over dry grass, distant birds, no engines, no cars, no music, no voices" },
  { id: "amb-redbullring", n: 2, seg: 20, laco: true, texto: "Alpine mountain meadow ambience: cowbells ringing in the distance, mountain wind, birds, a far stream, no engines, no cars, no music, no voices" },
  { id: "amb-zandvoort", n: 2, seg: 20, laco: true, texto: "North Sea dunes ambience: strong sea wind through dune grass, distant surf, seagulls crying, no engines, no cars, no music, no voices" },
  { id: "amb-xangai", n: 2, seg: 20, laco: true, texto: "Large Asian city ambience: dense distant urban hum, wind between tall buildings, faint horns far away, no engines, no cars, no music, no voices" },
  { id: "amb-madri", n: 2, seg: 20, laco: true, texto: "Spanish city ambience: urban hum, swifts screeching overhead, warm dry wind, distant traffic, no engines, no cars, no music, no voices" },
  // os fogos de artifício das pistas de noite (fogos.js, sons.js fogos/fogosSobe): o estouro perto, o longe, o crepitar e o assobio do foguete
  { id: "fogos-estouro", n: 6, seg: 3, textos: [
    "Single big firework shell exploding close by: a deep powerful boom followed by a crackling shower of sparks, outdoors at night, no music, no voices",
    "Large aerial firework burst nearby: sharp loud bang and a short echo off buildings, then soft fizzling sparks, outdoors, no music, no voices",
    "Firework mortar explosion overhead: thumping heavy boom with a bright sizzling crackle tail, outdoors, no music, no voices",
    "Close firework blast: a punchy explosive pop and a rolling echo, followed by glittering crackles, outdoors, no music, no voices" ] },
  { id: "fogos-longe", n: 5, seg: 3, textos: [
    "Distant fireworks: a muffled low boom far away with a soft echo, outdoors at night, no music, no voices",
    "Far away firework burst, dull thud and faint crackle across a city, outdoors, no music, no voices",
    "Several distant fireworks popping softly one after another over the horizon, outdoors, no music, no voices" ] },
  { id: "fogos-crepitar", n: 5, seg: 3, textos: [
    "Firework crackle: a dense rapid popping and sizzling like a shower of tiny firecrackers in the sky, outdoors, no music, no voices",
    "Crackling firework glitter: hundreds of tiny snapping pops fading out, outdoors, no music, no voices",
    "Strobe firework crackle: sharp fast snaps and fizz spreading across the sky, outdoors, no music, no voices" ] },
  { id: "fogos-assobio", n: 4, seg: 2, textos: [
    "Firework rocket launching: a short thump and a rising whistling whoosh going up into the sky, outdoors, no music, no voices",
    "Whistling firework rocket climbing fast with a rising shriek, outdoors, no music, no voices",
    "Firework mortar launch: a hollow thud and a hissing trail rising, outdoors, no music, no voices" ] },
];

const argv = process.argv.slice(2), refazer = argv.includes("--refazer"), iso = argv.indexOf("--so");
const so = iso >= 0 ? String(argv[iso + 1] || "").split(",").map((s) => s.trim()).filter(Boolean) : null;
const arquivo = (id, k) => path.join(PASTA, `${id}-${k}.mp3`);

async function pedir(chave, s, comLaco, k = 1) {
  const texto = s.textos ? s.textos[(k - 1) % s.textos.length] : s.texto; // (uma descrição diferente por versão, quando há várias)
  const corpo = { text: texto, duration_seconds: Math.max(0.5, s.seg), prompt_influence: 0.9 };
  if (comLaco) corpo.loop = true;
  return fetch("https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128", {
    method: "POST", headers: { "xi-api-key": chave, "Content-Type": "application/json", Accept: "audio/mpeg" }, body: JSON.stringify(corpo),
  });
}
async function gerar(chave, s, k) {
  let r = await pedir(chave, s, s.laco, k);
  if (!r.ok && s.laco && (r.status === 400 || r.status === 422)) r = await pedir(chave, s, false, k); // (conta sem o laço: gera normal)
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
