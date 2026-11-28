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

// ---------- vozes do rádio em português (ferramentas/tiro-vozes/, feitas por ferramentas/tiro-vozes.js) ----------
// Uma voz por tipo de arma principal da classe (tiro-vozes/vozes.json). A padrão entra no pacote voix_en (o idioma 'en' daqui é
// o português), no lugar do inglês; as outras viram pacotes próprios (sfx/voix_<grupo>.js), que o jogo só baixa quando o jogador
// usa uma classe com aquela arma (vozDaClasse, mais abaixo). Cada mp3 <id>_N vira "<prefixo><id>-N": o motor de som do jogo junta
// os "-N" do mesmo som e sorteia um a cada anúncio (no celular, só os dois primeiros).
const PREFIXO = { padrao: "v_", smg: "vs_", sniper: "vp_", shotgun: "ve_" };
const VOZ_GRUPOS = [];
let NOME_VOZ_PADRAO = "Narrador 1";
// a voz de começo do narrador (Opções > Áudio). 2026-11-25: a Narradora (shotgun), a única voz de mulher. O ajuste se chama
// "narrador" (antes "vozNarr", com o padrão no Narrador 1): o nome novo faz o padrão novo valer também para quem já tinha jogado.
// 2026-11-26: o padrão passou a ser "aleatorio" (um narrador sorteado a cada partida, sem repetir o da anterior), e o ajuste ganhou
// outro nome (narradorVoz) pelo mesmo motivo: o jogo grava os ajustes a cada partida, e só um nome novo faz o padrão novo valer para todos.
const NARRADOR_PADRAO = "aleatorio", CHAVE_NARRADOR = "narradorVoz";
{
  const VOZES = path.join(__dirname, "tiro-vozes");
  const ler = (f) => { const j = JSON.parse(fs.readFileSync(path.join(VOZES, f), "utf8")); delete j._; return j; };
  const falas = ler("falas.json"), grupos = ler("vozes.json");
  if (grupos.padrao && grupos.padrao.nome) NOME_VOZ_PADRAO = grupos.padrao.nome;
  // duração em amostras a 48 kHz, contada pelos quadros do mp3 (o jogo usa para saber quando a fala acaba)
  const amostras48 = (b) => {
    let i = 0;
    if (b.slice(0, 3).toString() === "ID3") i = 10 + ((b[6] & 127) << 21 | (b[7] & 127) << 14 | (b[8] & 127) << 7 | (b[9] & 127));
    // camada III: MPEG-1 (1152 amostras por quadro) e MPEG-2/2.5 (576)
    const BR1 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320], BR2 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160];
    const SR = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] };
    let seg = 0;
    while (i + 4 <= b.length) {
      const v = (b[i + 1] >> 3) & 3;
      if (b[i] !== 0xff || (b[i + 1] & 0xe0) !== 0xe0 || ((b[i + 1] >> 1) & 3) !== 1 || v === 1) { i++; continue; }
      const br = (v === 3 ? BR1 : BR2)[b[i + 2] >> 4], s = SR[v][(b[i + 2] >> 2) & 3];
      if (!br || !s) { i++; continue; }
      const spf = v === 3 ? 1152 : 576;
      seg += spf / s; i += Math.floor(spf / 8 * br * 1000 / s) + ((b[i + 2] >> 1) & 1);
    }
    return Math.round(seg * 48000);
  };
  for (const g of Object.keys(grupos)) {
    if (!PREFIXO[g]) { console.log(`vozes: grupo ${g} sem prefixo no script, pulei`); continue; }
    const pasta = g === "padrao" ? VOZES : path.join(VOZES, g);
    const faltam = Object.keys(falas).filter((id) => !fs.existsSync(path.join(pasta, id + ".mp3")));
    if (faltam.length) { console.log(`vozes ${g}: faltam ${faltam.length} de ${Object.keys(falas).length} anúncios${g === "padrao" ? ": fica a voz em inglês" : ": essa classe usa a voz padrão"}`); continue; }
    const s = {}; let n = 0;
    for (const [id, textos] of Object.entries(falas)) textos.forEach((_, k) => {
      const f = path.join(pasta, id + (k ? "_" + (k + 1) : "") + ".mp3"); if (!fs.existsSync(f)) return;
      const b = fs.readFileSync(f), am = amostras48(b);
      // [duração, crista, mp3]: a crista só serve para achar o atraso do codificador; com a duração cheia o jogo não corta nada
      s[PREFIXO[g] + id + (k ? "-" + (k + 1) : "")] = [am, Math.round(am / 3), b.toString("base64")]; n++;
    });
    const chave = g === "padrao" ? "voix_en" : "voix_" + g;
    const arq = g === "padrao" ? fs.readdirSync(path.join(OUT, "sfx")).find((f) => f.startsWith("voix_en.")) : `voix_${g}.js`;
    fs.writeFileSync(path.join(OUT, "sfx", arq), `sfxPack(${JSON.stringify(chave)},` + JSON.stringify({ rate: 44100, s }) + ");\n");
    if (g !== "padrao") VOZ_GRUPOS.push({ g, chave, arq, nome: grupos[g].nome || g });
    console.log(`vozes ${g}: ${n} falas (${grupos[g].armas})`);
  }
}

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
// voz do rádio pela arma principal da classe: o pacote dela entra na lista do jogo, é baixado quando o jogador nasce com essa
// classe (giveLoadout) e, enquanto não chega, o anúncio sai na voz padrão
if (VOZ_GRUPOS.length) {
  h = troca(h, /("voix_en":"sfx\/voix_en\.[0-9a-f]+\.js")/, (_, a) => a + VOZ_GRUPOS.map((v) => `,${JSON.stringify(v.chave)}:${JSON.stringify("sfx/" + v.arq)}`).join(""), { nome: "pacotes de voz por classe" });
  const pref = Object.fromEntries(VOZ_GRUPOS.map((v) => [v.g, [v.chave, PREFIXO[v.g]]]));
  h = troca(h, "const ANN={q:[],until:0,last:new Map()};", `const VOZ_CLASSE=${JSON.stringify(pref)};
const VOZ_SORTEIO={g:''};
function vozSortear(){const l=['padrao',...Object.keys(VOZ_CLASSE)].filter((g)=>g!==VOZ_SORTEIO.g);VOZ_SORTEIO.g=l[Math.random()*l.length|0];}
function vozPacote(){try{let s=Settings.${CHAVE_NARRADOR}||'${NARRADOR_PADRAO}';if(s==='aleatorio'){if(!VOZ_SORTEIO.g)vozSortear();s=VOZ_SORTEIO.g;}if(s==='padrao')return null;if(s!=='classe')return VOZ_CLASSE[s]||null;const c=CLASSES[PL.classIdx],w=c&&WEAPONS[c.primary];return VOZ_CLASSE[w&&w.cat]||null}catch(e){return null}}
function vozPreparar(){const v=vozPacote();if(v&&AU.ctx&&!sfxReady(v[0]))sfxLoad(v[0]);}
function vozDaClasse(l){const v=vozPacote();if(v){if(sfxReady(v[0])&&sfxHas(v[1]+l))return v[1]+l;vozPreparar();}return'v_'+l;}
const ANN={q:[],until:0,last:new Map()};`, { nome: "voz da classe" });
  h = troca(h, "sfxPlay('v_'+a.line,o,t+0.12,{gain:1.15})", "sfxPlay(vozDaClasse(a.line),o,t+0.12,{gain:1.15})", { nome: "anúncio na voz da classe" });
  h = troca(h, "function giveLoadout(){classFix();", "function giveLoadout(){classFix();setTimeout(vozPreparar,0);", { nome: "baixa a voz ao nascer" });
  h = troca(h, "function startMatch(opt={}){", "function startMatch(opt={}){try{vozSortear();}catch(e){}", { nome: "narrador sorteado a cada partida" });
}
// o volume só da voz do rádio (o "narrador": as falas e o chiado de abrir e fechar), separado do resto dos sons:
// Opções > Áudio, logo abaixo de "Anúncios de voz", de 0 a 150% (por cima do volume geral)
h = troca(h, "volume:0.8,music:0.5", `volume:0.8,music:0.5,vozVol:1,${CHAVE_NARRADOR}:'${NARRADOR_PADRAO}'`, { todas: false, nome: "volume da voz (padrão)" });
const OPCAO_NARRADOR = VOZ_GRUPOS.length ? `['select','${CHAVE_NARRADOR}','Voz do narrador',${JSON.stringify([["aleatorio", "Aleatória a cada partida"], ["padrao", NOME_VOZ_PADRAO], ...VOZ_GRUPOS.map((v) => [v.g, v.nome]), ["classe", "Pela classe da arma"]]).replace(/"/g, "'")},()=>{try{vozPreparar()}catch(e){}}],` : "";
h = troca(h, "['check','voice',_t('Annonces vocales (séries, objectifs)')]", `['check','voice',_t('Annonces vocales (séries, objectifs)')],${OPCAO_NARRADOR}['range','vozVol','Volume da voz do rádio',0,1.5,0.05,(v)=>Math.round(v*100)+PCT]`, { nome: "voz e volume do narrador (opções)" });
const VV = "(Settings.vozVol==null?1:Settings.vozVol)";
h = troca(h, /sfxPlay\((vozDaClasse\(a\.line\)|'v_'\+a\.line),o,t\+0\.12,\{gain:1\.15\}\)/, (_, v) => `sfxPlay(${v},o,t+0.12,{gain:1.15*${VV}})`, { nome: "volume da voz (fala)" });
h = troca(h, "sfxPlay('r_on',o,t,{gain:0.55})", `sfxPlay('r_on',o,t,{gain:0.55*${VV}})`, { nome: "volume da voz (chiado de abrir)" });
h = troca(h, "sfxPlay('r_off',o,end+0.04,{gain:0.5})", `sfxPlay('r_off',o,end+0.04,{gain:0.5*${VV}})`, { nome: "volume da voz (chiado de fechar)" });

// no salão: o botão de trocar de equipe à vista, logo abaixo de "Modificar a classe" (o jogo já deixava, mas escondido no
// menu do próprio nome na lista). Só em modo de equipe e enquanto o salão espera; o dono continua podendo mudar os outros.
{
  const ini = h.indexOf("lobby:()=>{const setup=NET.role==='host'"), ancora = "{k:'link',key:'class',label:_t('Modifier la classe'),open:()=>uiGo('classes')},";
  const i = ini < 0 ? -1 : h.indexOf(ancora, ini);
  if (i < 0 || i - ini > 1500) throw new Error("não achei: botão de equipe no salão");
  const botao = "...(NET.cfg.mode!=='ffa'&&NET.phase==='lobby'?[{k:'btn',key:'team',label:'Trocar de equipe',"
    + "sub:'Você está na '+TEAM_NAMES[(NET.players.get(NET.me)||{}).t|0]+'. Passa você para a '+TEAM_NAMES[1-((NET.players.get(NET.me)||{}).t|0)],"
    + "run:()=>{netTeamSwap(NET.me);sfxUi('click');},disabled:!NET.joined||NET.on||!!(NET.players.get(NET.me)||{}).ig}]:[]),";
  h = h.slice(0, i + ancora.length) + botao + h.slice(i + ancora.length);
  console.log("     1× botão de equipe no salão");
}

// sombras mais baratas: as duas faixas de longe (CSM, cascatas 1 e 2) já são redesenhadas em quadros alternados, mas o jogo
// forçava o redesenho delas sempre que a câmera girava 1,5° ou andava 0,3 m desde o último, ou seja, quase todo quadro de um FPS.
// Agora só a faixa de perto segue essa regra; as de longe só são forçadas num giro de 11° ou 2 m (fora isso, no máximo 2 quadros
// de atraso), e cada uma é redesenhada a cada 4 quadros em vez de 2 (ainda alternadas). Simulado: de 2 a 3 passadas de sombra por
// quadro para 1,5 (ferramentas: a regra do updateShadows). Medido no PC do Thiago (RTX 2060, Edge): com sombras, 402 chamadas de desenho e 13,4 ms de processador por quadro.
h = troca(h, "maxTurn:Math.cos(0.026/2),maxMove:0.3};", "maxTurn:Math.cos(0.026/2),maxMove:0.3,maxTurnFar:Math.cos(0.2/2),maxMoveFar:2};", { nome: "sombras de longe (limites)" });
h = troca(h, "due=(i===0?S.frame%k===0:(S.frame+i*k)%(2*k)===0)||moved", "due=(i===0?S.frame%k===0:(S.frame+i*k)%(4*k)===0)||moved", { nome: "sombras de longe a cada 4 quadros" });
h = troca(h, "const moved=Math.abs(S.q[i].dot(camera.quaternion))<S.maxTurn||S.p[i].distanceToSquared(camera.position)>S.maxMove*S.maxMove;",
  "const mt=i===0?S.maxTurn:S.maxTurnFar,mm=i===0?S.maxMove:S.maxMoveFar;const moved=Math.abs(S.q[i].dot(camera.quaternion))<mt||S.p[i].distanceToSquared(camera.position)>mm*mm;", { nome: "sombras de longe (regra)" });

// ---------- brilho e mira (pedido do Thiago, 2026-11-25) ----------
// Brilho: Opções > Vídeo > Imagem. Multiplica a exposição no shader final (FinalShader, que roda em toda qualidade), ANTES da curva
// de cor (ACES): clareia as sombras sem estourar o céu, como o brilho de um jogo, e não custa nada a mais.
h = troca(h, "uExposure:{value:1.0}", "uExposure:{value:1.0},uBrilho:{value:1.0}", { nome: "brilho (uniforme)" });
h = troca(h, "uFlash,uExposure,uAberr", "uFlash,uExposure,uBrilho,uAberr", { nome: "brilho (shader)" });
h = troca(h, "col *= uExposure;", "col *= uExposure * uBrilho;", { nome: "brilho (conta)" });
h = troca(h, "FinalShader.uniforms.uAberr.value=Math.max(", "brilhoAplicar();FinalShader.uniforms.uAberr.value=Math.max(", { nome: "brilho a cada quadro" });
h = troca(h, "['head',_t('Image')],", "['head',_t('Image')],['range','brilho','Brilho',0.6,1.8,0.05,(v)=>Math.round(v*100)+PCT,()=>brilhoAplicar()],", { nome: "brilho (opção)" });
// Mira: Opções > Jogo, seção "Desenho da mira", depois de Interface ("Mira" já é a seção da pontaria). A mira do jogo é feita de 5 pedaços de HTML (#xhair: cima, baixo, esquerda,
// direita e o ponto); o CSS abaixo troca os números fixos por variáveis, que miraAplicar() põe a partir dos ajustes. Os padrões
// (cruz branca, linhas de 11 px, 2 px de espessura, abrindo com o movimento) são a mira de antes.
const MIRA_PADRAO = "brilho:1,miraEstilo:'cruz',miraCor:'#ffffff',miraTam:11,miraEsp:2,miraVao:0,miraDin:true,miraCont:true,miraOpac:0.92,";
h = troca(h, "volume:0.8,music:0.5,", "volume:0.8,music:0.5," + MIRA_PADRAO, { todas: false, nome: "brilho e mira (padrões)" });
h = troca(h, /(\['check','fsGame',_t\('[^']*'\)\],)/, (_, fs0) => fs0
  + "['head','Desenho da mira'],"
  + "['select','miraEstilo','Estilo da mira',[['cruz','Cruz'],['cruzponto','Cruz com ponto'],['ponto','Só o ponto'],['circulo','Círculo']],()=>miraAplicar()],"
  + "['select','miraCor','Cor da mira',[['#ffffff','Branca'],['#3cff5a','Verde'],['#00e5ff','Ciano'],['#ffe23c','Amarela'],['#ff3cf0','Rosa'],['#ff3b3b','Vermelha']],()=>miraAplicar()],"
  + "['range','miraTam','Tamanho das linhas',3,24,1,(v)=>Math.round(v)+' px',()=>miraAplicar()],"
  + "['range','miraEsp','Espessura',1,5,1,(v)=>Math.round(v)+' px',()=>miraAplicar()],"
  + "['range','miraVao','Espaço no meio',0,20,1,(v)=>Math.round(v)+' px',()=>miraAplicar()],"
  + "['range','miraOpac','Opacidade',0.3,1,0.05,(v)=>Math.round(v*100)+PCT,()=>miraAplicar()],"
  + "['check','miraDin','Mira que abre com o movimento e o tiro',()=>miraAplicar()],"
  + "['check','miraCont','Contorno escuro',()=>miraAplicar()],", { todas: false, nome: "mira (opções)" });
const CSS_MIRA = `<style id="miraGalera">
#xhair i{background:var(--xc,rgba(255,255,255,.92));opacity:var(--xop,1);box-shadow:var(--xsh,0 0 2px rgba(0,0,0,.9))}
#xhair .t,#xhair .b{width:var(--xt,2px);height:var(--xl,11px);left:calc(var(--xt,2px) / -2)}
#xhair .l,#xhair .r{height:var(--xt,2px);width:var(--xl,11px);top:calc(var(--xt,2px) / -2)}
#xhair .t{top:calc(-1 * var(--xl,11px));transform:translateY(calc(-1 * (var(--gap) * var(--xdin,1) + var(--xg,0px))))}
#xhair .b{transform:translateY(calc(var(--gap) * var(--xdin,1) + var(--xg,0px)))}
#xhair .l{left:calc(-1 * var(--xl,11px));transform:translateX(calc(-1 * (var(--gap) * var(--xdin,1) + var(--xg,0px))))}
#xhair .r{transform:translateX(calc(var(--gap) * var(--xdin,1) + var(--xg,0px)))}
#xhair .c{width:var(--xp,2px);height:var(--xp,2px);left:calc(var(--xp,2px) / -2);top:calc(var(--xp,2px) / -2);opacity:var(--xpo,.7)}
#xhair.so-ponto .t,#xhair.so-ponto .b,#xhair.so-ponto .l,#xhair.so-ponto .r,#xhair.circulo .t,#xhair.circulo .b,#xhair.circulo .l,#xhair.circulo .r{display:none}
#xhair.circulo .c{--r:calc(var(--gap) * var(--xdin,1) + var(--xg,0px) + var(--xl,11px) / 2);background:none;border:var(--xt,2px) solid var(--xc,#fff);border-radius:50%;
  width:calc(var(--r) * 2);height:calc(var(--r) * 2);left:calc(-1 * var(--r) - var(--xt,2px));top:calc(-1 * var(--r) - var(--xt,2px));opacity:var(--xop,1)}
</style>
<script>
function miraAplicar(){const x=document.getElementById('xhair');if(!x||typeof Settings==='undefined')return;const S=Settings,v=(k,d)=>S[k]==null?d:S[k];
const est=v('miraEstilo','cruz'),esp=+v('miraEsp',2),cont=v('miraCont',true);
x.classList.toggle('so-ponto',est==='ponto');x.classList.toggle('circulo',est==='circulo');
x.style.setProperty('--xc',v('miraCor','#ffffff'));x.style.setProperty('--xop',String(v('miraOpac',0.92)));
x.style.setProperty('--xl',v('miraTam',11)+'px');x.style.setProperty('--xt',esp+'px');x.style.setProperty('--xg',v('miraVao',0)+'px');
x.style.setProperty('--xdin',v('miraDin',true)?'1':'0');
x.style.setProperty('--xp',(est==='ponto'||est==='cruzponto'?Math.max(2,esp+1):esp)+'px');x.style.setProperty('--xpo',est==='cruz'?'.7':'1');
x.style.setProperty('--xsh',cont?'0 0 0 1px rgba(0,0,0,.75),0 0 2px rgba(0,0,0,.9)':'none');}
function brilhoAplicar(){try{const u=FinalShader.uniforms.uBrilho;if(u)u.value=Settings.brilho==null?1:Settings.brilho;}catch(e){}}
addEventListener('load',()=>{miraAplicar();brilhoAplicar();});
</script>
`;
h = troca(h, "</body>", CSS_MIRA + "</body>", { todas: false, nome: "mira (CSS e funções)" });

// ---------- visibilidade no Tephra (2026-11-26) ----------
// Os amigos reclamaram que não enxergavam ninguém no Tephra. O mapa é uma noite de erupção (ATMO_TEPHRA, 02yh-tephra.js): sol a 0,5
// (o padrão é 2,9), luz ambiente a 0,15 (padrão 0,62) e névoa marrom-escura; um inimigo escuro some contra o chão e a névoa escuros a
// média distância. Os grãos no ar (motes) só aparecem entre 2,5 e 9 m e são fracos: não são o problema. Aqui sobem a luz ambiente
// (0,15 → 0,4, que é o que ilumina quem está na sombra), o sol (0,5 → 0,9), a luz rebatida (bounce) e a exposição (1,2 → 1,3, com
// os pretos um pouco erguidos: lift 0,08 em vez de 0,06), e a névoa fica mais rala (0,0062 → 0,0042: a 60 m esconde 6 % em vez de
// 13 %; a 100 m, 16 % em vez de 32 %) e um pouco mais clara, para a silhueta destacar dela. O céu de cinza, a cor vermelha da luz,
// a cinza depositada no cenário e os relâmpagos ficam como estão: o clima do vulcão continua.
h = troca(h, "sunI:0.5,vmSun:0xff4a20,fog:[0.12,0.05,0.04],fogD:0.0062,hemi:[0x2a1010,0x401008,0.15]",
  "sunI:0.9,vmSun:0xff4a20,fog:[0.16,0.07,0.05],fogD:0.0042,hemi:[0x2a1010,0x401008,0.4]", { todas: false, nome: "Tephra: luz e névoa" });
h = troca(h, "bounce:[0.25,0.08,0.04],dust:[0.3,0.29,0.28],motes:[2.2,0.75,0.25],grade:{lo:[1.0,0.92,0.95],hi:[1.1,0.92,0.8],exp:1.2}",
  "bounce:[0.45,0.15,0.08],dust:[0.3,0.29,0.28],motes:[2.2,0.75,0.25],grade:{lo:[1.0,0.92,0.95],hi:[1.1,0.92,0.8],exp:1.3,lift:0.08}", { todas: false, nome: "Tephra: exposição" });

// ---------- captura do mouse ----------
// (2026-11-26: um amigo do Thiago ficava com o mouse comum no meio da partida) O jogo desistia da captura depois de 2 recusas do
// navegador e passava ao mouse comum até o fim da partida. O Chrome recusa quando o pedido vem menos de ~1 s depois do mouse
// escapar, e clicar logo para voltar já contava como recusa. Agora:
// - o pedido feito cedo demais espera o navegador liberar (o clique continua valendo como gesto por alguns segundos);
// - depois da primeira recusa, o jogo pede a captura sem o "movimento bruto" (unadjustedMovement), que falha em alguns
//   mouses e drivers;
// - só desiste depois de 5 recusas, e não de 2.
h = troca(h, "if(++LOCK.fails<2){showLockPrompt(true);return;", "if(++LOCK.fails<5){showLockPrompt(true);return;", { nome: "captura do mouse: 5 recusas" });
h = troca(h, "if(!window.WebGLRenderingContext)", () => `{
  let solto = -1e9;
  document.addEventListener('pointerlockchange', () => { if (!document.pointerLockElement) solto = performance.now(); });
  const pedir = lockAsk;
  lockAsk = function () {
    if (LOCK.fails >= 1) LOCK.rawNo = true;
    const falta = 1150 - (performance.now() - solto);
    if (falta > 0) { setTimeout(() => { if (LOCK.pending && document.pointerLockElement !== canvas) pedir(); }, falta); return; }
    pedir();
  };
}
if(!window.WebGLRenderingContext)`, { todas: false, nome: "captura do mouse: espera o navegador" });

// ---------- equilíbrio das armas ----------
// M1014 (2026-11-26, o Thiago: "cadência muito alta, chega a ser roubado"): era 240 tiros por minuto (0,25 s entre tiros), com
// 8 chumbos de 22 de dano, o que derruba de perto num tiro só. Agora 150 (0,4 s), e a barra de cadência do menu acompanha.
h = troca(h, "model:'m1014',sound:'shotgun',auto:false,rpm:240,", "model:'m1014',sound:'shotgun',auto:false,rpm:150,", { nome: "M1014: cadência" });
h = troca(h, "stats:{dmg:0.95,acc:0.3,rng:0.22,rof:0.4,mob:0.74}", "stats:{dmg:0.95,acc:0.3,rng:0.22,rof:0.25,mob:0.74}", { nome: "M1014: barra de cadência" });

// ---------- mapas nossos (ferramentas/tiro-mapas/) ----------
// Iate Esmeralda (2026-11-26): o código do mapa entra no fim do script do jogo, logo antes do boot, e se registra sozinho
// (MAP_DEFS, MAPS, MAP_ART). A água do porto só tinha mar a oeste do cais: o iate traz a própria grade de água (iate.js) e aqui
// o campo de espuma passa a ficar centrado no navio quando o mapa é o iate.
// (2026-11-26: desativado a pedido do Thiago, que não gostou da rodada 3; os arquivos ficam em tiro-mapas/ e a rodada 3 no branch
// tiro-iate-rodada3. Para religar, IATE_ATIVO = true. Quem tinha o iate salvo como mapa cai no primeiro da lista: mapById)
const IATE_ATIVO = false;
if (IATE_ATIVO) {
  const MAPAS = path.join(__dirname, "tiro-mapas");
  h = troca(h, "F={x0:-144,z0:-128,ppm:2,w:256,h:512}", "F=(CURMAP.id==='iate'?{x0:-64,z0:-96,ppm:2,w:256,h:384}:{x0:-144,z0:-128,ppm:2,w:256,h:512})", { nome: "campo da água centrado no iate" });
  const iate = fs.readFileSync(path.join(MAPAS, "iate.js"), "utf8");
  h = troca(h, "if(!window.WebGLRenderingContext)", () => iate + "\nif(!window.WebGLRenderingContext)", { todas: false, nome: "mapa Iate Esmeralda" });
  fs.copyFileSync(path.join(MAPAS, "iate.svg"), path.join(OUT, "maps", "iate.svg"));
}

// camuflagens novas de arma (ferramentas/tiro-camos/camuflagens.js, 2026-11-26): oito motivos nossos entre o Diamante e o Holo,
// registrados em CAMOS, CAMO_DRAW e CAMO_BASE logo antes do boot, como o mapa do iate
{
  const camos = fs.readFileSync(path.join(__dirname, "tiro-camos", "camuflagens.js"), "utf8");
  h = troca(h, "if(!window.WebGLRenderingContext)", () => camos + "\nif(!window.WebGLRenderingContext)", { todas: false, nome: "camuflagens novas" });
  // (2026-11-26, o Thiago: o bloom do Holo ficou forte demais) o brilho próprio das camuflagens (Holo, Cromado, e a faca Holo)
  // entra com 30% da força: as faixas, o liseré e as paillettes continuam, sem estourar o bloom
  h = troca(h, "totalEmissiveRadiance += camoGlow;", "totalEmissiveRadiance += camoGlow * 0.3;", { nome: "brilho das camuflagens" });
  // (2026-11-26, o Thiago: "nerfar a faca") a facada de frente tira 50 (metade da vida) e pelas costas continua matando (200);
  // "costas" = o atacante está atrás do alvo (fora de um cone de ~110° na frente dele). E 0,35 s a mais entre uma facada e outra.
  h = troca(h, "const KNIFE_DUR=0.42,", "const KNIFE_CD=0.35;function knifeDano(e,T){const ax=e.pos.x-T.pos.x,az=e.pos.z-T.pos.z,d=Math.hypot(ax,az)||1;return (-Math.sin(T.yaw)*ax-Math.cos(T.yaw)*az)/d<-0.35?200:50;}const KNIFE_DUR=0.42,", { nome: "faca: dano pelas costas" });
  h = troca(h, "function knife(){if(PL.knifeT>0||", "function knife(){if(PL.knifeT>0||MATCH.time<(PL.knifeFim||-99)+KNIFE_CD||", { nome: "faca: tempo entre facadas" });
  h = troca(h, "PL.knifeT=KNIFE_DUR;", "PL.knifeT=KNIFE_DUR;PL.knifeFim=MATCH.time+KNIFE_DUR;", { nome: "faca: fim da facada" });
  h = troca(h, "applyDamage(T,200,e,_t('Couteau'),false,camFwd(new V3()));", "applyDamage(T,knifeDano(e,T),e,_t('Couteau'),false,camFwd(new V3()));", { nome: "faca: dano de frente" });
  // skins da faca (faca.js): usam as telas das camuflagens, entram depois delas
  const faca = fs.readFileSync(path.join(__dirname, "tiro-camos", "faca.js"), "utf8");
  h = troca(h, "if(!window.WebGLRenderingContext)", () => faca + "\nif(!window.WebGLRenderingContext)", { todas: false, nome: "skins da faca" });
}

// editor de mapas (2026-11-26): os mapas feitos no editor (ferramentas/tiro-mapas/editor/*.json) entram no jogo por
// ferramentas/tiro-editor/mapa-json.js, e o editor (/tiro/?editor=1) por ferramentas/tiro-editor/editor.js. Guia:
// docs/tiro-editor-de-mapas.md. O campo de espuma do mar fica centrado no mapa quando ele tem mar (o do porto só olha o oeste).
{
  const ED = path.join(__dirname, "tiro-editor"), PASTA = path.join(__dirname, "tiro-mapas", "editor");
  const mapas = fs.existsSync(PASTA) ? fs.readdirSync(PASTA).filter((f) => f.endsWith(".json")).sort().map((f) => JSON.parse(fs.readFileSync(path.join(PASTA, f), "utf8"))) : [];
  const codigo = fs.readFileSync(path.join(ED, "pecas.js"), "utf8") + "\n" + fs.readFileSync(path.join(ED, "texturas.js"), "utf8") + "\nconst TIRO_MAPAS_JSON = " + JSON.stringify(mapas) + ";\n" + fs.readFileSync(path.join(ED, "mapa-json.js"), "utf8") + "\n" + fs.readFileSync(path.join(ED, "editor.js"), "utf8");
  h = troca(h, "if(!window.WebGLRenderingContext)", () => codigo + "\nif(!window.WebGLRenderingContext)", { todas: false, nome: "editor de mapas" });
  // capas dos mapas do editor (ferramentas/tiro-mapas/editor/capas/*): vão para maps/ e o .json aponta com "capa": "maps/<arquivo>"
  const CAPAS = path.join(PASTA, "capas");
  if (fs.existsSync(CAPAS)) for (const f of fs.readdirSync(CAPAS)) fs.copyFileSync(path.join(CAPAS, f), path.join(OUT, "maps", f));
  h = troca(h, "F={x0:-144,z0:-128,ppm:2,w:256,h:512}", "F=(CURMAP.def&&CURMAP.def.mar?{x0:-64,z0:-96,ppm:2,w:256,h:384}:{x0:-144,z0:-128,ppm:2,w:256,h:512})", { nome: "espuma do mar dos mapas do editor" });
  // (2026-11-26) ponto de dominação em cima de um morro ou laje: o mapa do editor manda a altura do piso como 3º número
  // ([x, z, y]); sem ele, o jogo procurava o chão em y = 0 e o ponto afundava embaixo da terra
  // (2026-11-26, o Thiago: "ninguém nasce já dentro de uma área de domínio") no modo dominação, ninguém nasce a menos de 8 m do
  // centro de um ponto (a área tem 5,5 m de raio), nem dos pontos neutros: os pontos de campo perto deles saem da lista e o
  // lugar ganha nota muito baixa (só se usa se não houver outro)
  h = troca(h, "function spawnField(){return POI.filter((p)=>p[1]<gy0(p[0],p[2])+1&&!p[4]).map((p)=>[p[0],p[2]]);}",
    "function spawnField(){return POI.filter((p)=>p[1]<gy0(p[0],p[2])+1&&!p[4]&&!(MATCH.mode==='dom'&&DOM.pts.some((q)=>hyp(q.x-p[0],q.z-p[2])<DOM.rad+2.5))).map((p)=>[p[0],p[2]]);}", { nome: "nascer fora das áreas de domínio (pontos de campo)" });
  h = troca(h, "if(MATCH.mode==='dom'){let dOwn=1e9,dFront=1e9;for(const p of DOM.pts){const d=hyp(p.x-x,p.z-z);",
    "if(MATCH.mode==='dom'){let dOwn=1e9,dFront=1e9;for(const p of DOM.pts){const d=hyp(p.x-x,p.z-z);if(d<DOM.rad+2.5){safe=false;s-=100;}", { nome: "nascer fora das áreas de domínio (nota)" });
  // (2026-11-26, mapa Aeroporto) nascer num piso alto (terminal a 4,5 m, maciço por baixo): o jogo procurava o ponto de caminho
  // perto da altura 0, não achava e punha o soldado no chão, dentro do bloco (e a colisão empurrava para fora do mapa). Agora
  // procura (só quando não há ponto de caminho no chão) de cima para baixo o primeiro piso com 1,8 m livres em cima, abaixo de
  // 8 m (para não nascer no teto). Mapas com chão em y = 0 continuam iguais
  h = troca(h, "function spawnOpening(e){",
    "function spawnChao(x,z){let top=8;for(let i=0;i<10;i++){const y=groundHeight(x,z,top,0.1);let livre=true;for(const c of queryBoxes(x-0.3,z-0.3,x+0.3,z+0.3)){if(c.ray||c.noRay||c.x1<x-0.3||c.x0>x+0.3||c.z1<z-0.3||c.z0>z+0.3)continue;if(c.y0<y+1.8&&c.y1>y+0.05){livre=false;break;}}if(livre)return y;top=y-0.05;if(top<-5)break;}return gy0(x,z);}\nfunction spawnOpening(e){", { nome: "nascer no piso alto (busca do chão)" });
  h = troca(h, "const[x,z]=S[k],id=navNode(x,gy0(x,z),z),p=id>=0?new V3(NAV.nx[id],NAV.ny[id],NAV.nz[id]):new V3(x,gy0(x,z),z);",
    "const[x,z]=S[k];let id=navNode(x,gy0(x,z),z),y0=gy0(x,z);if(id<0){y0=spawnChao(x,z);id=navNode(x,y0,z);}const p=id>=0?new V3(NAV.nx[id],NAV.ny[id],NAV.nz[id]):new V3(x,y0,z);", { nome: "nascer no piso alto (largada)" });
  h = troca(h, "function spawnSpot(e,x,z,C){const id0=navNode(x,gy0(x,z),z);if(id0<0)return new V3(x,gy0(x,z),z);",
    "function spawnSpot(e,x,z,C){let id0=navNode(x,gy0(x,z),z);if(id0<0){const yc=spawnChao(x,z);id0=navNode(x,yc,z);if(id0<0)return new V3(x,yc,z);}", { nome: "nascer no piso alto (renascer)" });
  // (2026-11-26, tablet de 120 Hz) parado dava 120 fps e andando cravava em 60. Andando, as três camadas da sombra do sol se
  // redesenham todo quadro (parado, só a de perto); o quadro passa de 8,3 ms e a tela cai para a metade, 60. E a qualidade
  // automática mirava 60 fps (FRAME_BUDGET), então achava 60 ótimo e não baixava nada. Agora: nos aparelhos de toque com tela
  // rápida, a meta é a taxa da tela (a menor medida, para não esquecer depois de cair a 60); ela baixa a resolução até 70% do
  // degrau atual e, se nem assim chega, desiste e volta a mirar 60 (sem trocar o degrau de qualidade por isso). E, em tela rápida,
  // as duas camadas de longe se revezam quando a câmera mexe: no máximo duas sombras por quadro em vez de três
  h = troca(h, "function frameBudget(){return Math.max(FRAME_BUDGET,capMs());}",
    "const HR={off:false,ms:Infinity};function hrAlvo(){if(VSYNC.ms>=6&&VSYNC.ms<HR.ms)HR.ms=VSYNC.ms;return COARSE&&!HR.off&&!Settings.eco&&HR.ms<12?HR.ms:0;}\nfunction frameBudget(){const a=hrAlvo();return Math.max(a||FRAME_BUDGET,capMs());}", { nome: "fps da tela rápida (meta)" });
  h = troca(h, "function stepQuality(dir,step=0.05){",
    "function stepQuality(dir,step=0.05){if(dir<0&&hrAlvo()&&!capMs()){const fix=!!QUALITY[gfxSet('quality')],lo=Math.max(0.7,fix?RQ.q.scaleMin:GFX_SAFE?1:AUTO_LADDER[RQ.rung][1]);if(RQ.scale<=lo+1e-6){HR.off=true;gpuLog(`tela de ${Math.round(1000/HR.ms)} Hz: nem com a resolução em ${Math.round(RQ.scale*100)}% chegou, volta a mirar 60 fps`);return'wait';}}", { nome: "fps da tela rápida (desistir)" });
  h = troca(h, "const k=HF.k,due=(i===0?S.frame%k===0:(S.frame+i*k)%(4*k)===0)||moved;",
    "const k=HF.k,far=i>0&&COARSE,due=far?((S.frame+i*3)%6===0||S.p[i].distanceToSquared(camera.position)>64):((i===0?S.frame%k===0:(S.frame+i*k)%(4*k)===0)||(moved&&(i===0||!(VSYNC.ms>0&&VSYNC.ms<12)||(S.frame+i)%2===0)));", { nome: "sombras se revezam em tela rápida" });
  // (2026-11-27, iPad e Mi Pad) nos aparelhos de toque, as duas camadas de sombra de longe não se redesenham mais a cada passo:
  // cada uma a cada 6 quadros, revezando (e na hora, se a câmera pular mais de 8 m, ao renascer). O relatório do iPad mostrou a
  // placa de vídeo presa (20 ms por quadro com o processador em 5 ms, igual na qualidade mínima e com a resolução baixa) e
  // 1,3 milhão de triângulos por quadro, boa parte das 3 camadas de sombra se redesenhando enquanto anda. Andando, eram até 3
  // sombras por quadro; agora é a de perto e, em média, um terço de uma de longe
  // (2026-11-26) "os bots não sobem muito as escadas": ao ir atrás de um inimigo (vingança de quem o matou, aviso de um colega,
  // radar), o bot mirava o x/z do inimigo mas na altura DELE mesmo. Quem estava no chão e caçava alguém numa laje ganhava um
  // destino no chão, embaixo da laje, e nunca pegava a escada (e quem estava no alto nunca descia). Agora guarda e usa a altura
  // do inimigo
  h = troca(h, "v.grudge={x:a.pos.x,z:a.pos.z,t:now};", "v.grudge={x:a.pos.x,y:a.pos.y,z:a.pos.z,t:now};", { nome: "bots: altura do inimigo (vingança)" });
  h = troca(h, "SQ.intel[b.team]={x:foe.pos.x,z:foe.pos.z,t:now};", "SQ.intel[b.team]={x:foe.pos.x,y:foe.pos.y,z:foe.pos.z,t:now};", { nome: "bots: altura do inimigo (aviso)" });
  h = troca(h, "pts.push({o,x:o.pos.x,z:o.pos.z});", "pts.push({o,x:o.pos.x,y:o.pos.y,z:o.pos.z});", { nome: "bots: altura do inimigo (radar)" });
  h = troca(h, "_gpick.set(r.x,b.pos.y,r.z)", "_gpick.set(r.x,r.y!==undefined?r.y:b.pos.y,r.z)", { nome: "bots: destino na altura do inimigo (vingança)" });
  h = troca(h, "_gpick.set(I.x,b.pos.y,I.z)", "_gpick.set(I.x,I.y!==undefined?I.y:b.pos.y,I.z)", { nome: "bots: destino na altura do inimigo (aviso)" });
  h = troca(h, "_gpick.set(q.x,b.pos.y,q.z)", "_gpick.set(q.x,q.y!==undefined?q.y:b.pos.y,q.z)", { nome: "bots: destino na altura do inimigo (radar)" });
  // (2026-11-26) elo: no fim de uma partida online de time, manda o placar e quem jogou para o perfil-galera.js (window.tiroElo),
  // que fala com o servidor (servidor/jogos/tiro-elo.js). f: o desempenho no próprio time (1 = melhor do placar, 0 = pior)
  h = troca(h, "if(MATCH.online)netMatchEnded();arsLocalXp(o.result);acctMatchEnd(o.result,true);}",
    "if(MATCH.online)netMatchEnded();arsLocalXp(o.result);acctMatchEnd(o.result,true);if(MATCH.online&&MATCH.mode!=='ffa'&&window.tiroElo){try{const gente=[0,1].flatMap(boardList).filter((x)=>x.isPlayer||(x.isRemote&&!x.remoteBot)),nm=(x)=>netClean(x.isPlayer?NET.nick:x.name),meu=boardList(me.team),k=meu.indexOf(me);window.tiroElo.fim({sala:NET.code,modo:MATCH.mode,mapa:NET.cfg.map,placar:[MATCH.score[0],MATCH.score[1]],humanos:gente.map((x)=>({n:nm(x),t:x.team})),eu:{n:nm(me),t:me.team,f:meu.length>1?1-k/(meu.length-1):1,b:[0,1].flatMap(boardList).sort(boardCmp)[0]===me?2:k===0?1:0}});}catch(e){console.warn('elo',e);}}}", { nome: "elo: resultado no fim da partida" });
  // (2026-11-26) o selo do ranque do elo ao lado do nome, no placar da partida (Tab) e no do fim, só no online e só para gente
  // (os bots não têm). window.tiroElo.selo (perfil-galera.js) devolve o selo guardado e pede ao servidor os que faltam
  h = troca(h, "<td>${esc(boardName(x))}</td>", "<td>${esc(boardName(x))}${eloSelo(x)}</td>", { nome: "elo: selo no placar" });
  h = troca(h, "<td><span>${esc(boardName(x))}</span>", "<td><span>${esc(boardName(x))}</span>${eloSelo(x)}", { nome: "elo: selo no placar do fim" });
  h = troca(h, "const boardCmp=(a,b)=>", "const eloSelo=(x)=>{if(!MATCH.online||x.netBot||x.remoteBot||!window.tiroElo||!window.tiroElo.selo)return'';try{return window.tiroElo.selo(netClean(x.isPlayer?NET.nick:x.name),!!x.isPlayer);}catch(e){return'';}};const boardCmp=(a,b)=>", { nome: "elo: selo (função)" });
  // (2026-11-27, Mi Pad no Chrome) "fica 60 e depois 120": a meta de 120 fps já baixava a resolução até chegar, mas (1) cada
  // abertura do jogo começava da resolução cheia, a 60, até descer de novo, e (2) com 120 estável por 2 s ela tentava subir a
  // resolução, caía para 60 e descia outra vez. Agora a resolução que segurou os 120 fica guardada no aparelho (tiro_hr_escala)
  // e é usada na próxima abertura, e para tentar subir a resolução com a meta da tela rápida precisa de 24 janelas boas
  // seguidas (6 s a 120 fps; cada tentativa que falha dobra a espera, como antes, até 96)
  h = troca(h, "function hrAlvo(){if(VSYNC.ms>=6&&VSYNC.ms<HR.ms)HR.ms=VSYNC.ms;return COARSE&&!HR.off&&!Settings.eco&&HR.ms<12?HR.ms:0;}",
    "function hrAlvo(){if(VSYNC.ms>=6&&VSYNC.ms<HR.ms)HR.ms=VSYNC.ms;const a=COARSE&&!HR.off&&!Settings.eco&&HR.ms<12?HR.ms:0;if(a&&gfxSet('dynres')!==false){if(!HR.lido){HR.lido=true;let v=0;try{v=+localStorage.getItem('tiro_hr_escala')||0;}catch(e){}if(v>=0.7&&v<RQ.scale){RQ.scale=Math.round(v*100)/100;applyScale();}}else if(HR.salvo!==RQ.scale){HR.salvo=RQ.scale;try{localStorage.setItem('tiro_hr_escala',String(RQ.scale));}catch(e){}}}return a;}",
    { nome: "fps da tela rápida (lembrar a resolução)" });
  // se nem com a resolução no mínimo chegou nos 120, não guarda: na próxima abertura começa normal
  h = troca(h, "HR.off=true;gpuLog(", "HR.off=true;try{localStorage.removeItem('tiro_hr_escala');}catch(e){}gpuLog(", { nome: "fps da tela rápida (esquecer ao desistir)" });
  h = troca(h, "if(++DYN.good>=DYN.need){const r=stepQuality(1);",
    "if(++DYN.good>=(hrAlvo()?Math.max(DYN.need,24):DYN.need)){const r=stepQuality(1);", { nome: "fps da tela rápida (subir a resolução com calma)" });
  // (2026-11-27, Mi Pad no Chrome, "começa a 120 e depois fica em 60", mesmo na qualidade mínima) MODO TABLET. O relatório de
  // desempenho dele mostrou o PROCESSADOR passando dos 8,3 ms que os 120 fps pedem: o "render" (o Chrome entregando 140 a 230
  // desenhos por quadro) com 3,5 a 8 ms, os bots com 1 a 3 ms e o "prep" com até 2,7 ms. A resolução não ajuda nisso. Então, em
  // aparelho de toque com tela de 90 Hz ou mais (e enquanto ele ainda mira a taxa da tela, tabLeve):
  // - os bots pensam a cada dois quadros (HF.k = 2, o que o jogo já fazia acima de 175 fps): a 120 fps, 60 vezes por segundo;
  //   volta ao normal se cair abaixo de 70 fps, para os bots não andarem aos trancos;
  // - os detalhes do mapa somem mais perto (75% da distância; os espalhados, 70%) e a conta de quem aparece é a cada 4 quadros;
  // - os soldados longe passam para o modelo simples mais cedo (lodPx 1,4 vez), o que também tira o pano (clothUpdate) deles
  h = troca(h, "const HF={k:1};function hfUpdate(fps){HF.k=fps>(HF.k>=3?290:340)?3:fps>(HF.k>=2?150:175)?2:1;}",
    "const HF={k:1};function tabLeve(){if(VSYNC.ms>=6&&VSYNC.ms<HR.ms)HR.ms=VSYNC.ms;return COARSE&&!Settings.eco&&HR.ms<12;}function hfUpdate(fps){HF.k=fps>(HF.k>=3?290:340)?3:fps>(HF.k>=2?150:175)?2:1;if(HF.k<2&&tabLeve()&&fps>70)HF.k=2;}",
    { nome: "modo tablet (bots a cada dois quadros)" });
  // (2026-11-27) o modo tablet não ligava com a "Resolução dinâmica" desligada: a taxa da tela (HR.ms) só era medida no
  // hrAlvo, que só roda com ela ligada. O relatório do Mi Pad mostrou hf 1 o partida inteira. Agora o tabLeve mede sozinho
  // E não desliga mais quando a resolução dinâmica desiste dos 120 (HR.off): no Mi Pad ela baixou a resolução até 70%, o que
  // não ajuda quando o gargalo é o processador, desistiu aos 12 s e levou o modo tablet junto (hf voltou a 1, bots de 0,4 para 1,3 a 2,8 ms)
  h = troca(h, "function updateMapDetail(){const p=camera.position;for(const[list,d]of[[WORLD.fine,RQ.q.detail||60],[WORLD.scatter,RQ.q.scatter||30]]){",
    "function updateMapDetail(){const tl=tabLeve();if(tl&&frameN%4!==0)return;const p=camera.position;for(const[list,d]of[[WORLD.fine,(RQ.q.detail||60)*(tl?0.75:1)],[WORLD.scatter,(RQ.q.scatter||30)*(tl?0.7:1)]]){",
    { nome: "modo tablet (detalhes do mapa)" });
  h = troca(h, "function updateSoldierLods(){const k=1.8*VIEW.h/(2*Math.tan(camera.fov*Math.PI/360)),th=RQ.q.lodPx;",
    "function updateSoldierLods(){const k=1.8*VIEW.h/(2*Math.tan(camera.fov*Math.PI/360)),th=RQ.q.lodPx*(tabLeve()?1.4:1);",
    { nome: "modo tablet (soldados longe simples)" });
  // (2026-11-27, Mi Pad) modo tablet também no render: no Embruns, por passada de desenho, eram uns 44 desenhos do mapa, 29 dos
  // soldados (já no modelo simples), 22 dos barcos que boiam em volta (cada um em 4 a 5 partes), 19 dos objetos repetidos e 16
  // da arma na mão (medido no navegador). No tablet, os barcos e o que boia (floatAdd, "flotteur:") a mais de 60 m da câmera
  // somem (a névoa já quase os apagava), conferido junto com os detalhes do mapa, a cada 4 quadros
  h = troca(h, "g.name='flotteur:'+pf.name;", "g.name='flotteur:'+pf.name;FLOAT_GS.push(g);", { nome: "modo tablet (lista do que boia)" });
  h = troca(h, "function floatAdd(pf,x,z,ry,o={}){", "const FLOAT_GS=[];function floatAdd(pf,x,z,ry,o={}){", { nome: "modo tablet (lista do que boia, declaração)" });
  h = troca(h, "function updateMapDetail(){const tl=tabLeve();if(tl&&frameN%4!==0)return;const p=camera.position;",
    "function updateMapDetail(){const tl=tabLeve();if(tl&&frameN%4!==0)return;const p=camera.position;if(tl)for(let i=FLOAT_GS.length-1;i>=0;i--){const g=FLOAT_GS[i];if(!g.parent){FLOAT_GS.splice(i,1);continue;}const e=g.matrixWorld.elements,dx=e[12]-p.x,dz=e[14]-p.z;g.visible=dx*dx+dz*dz<3600;}",
    { nome: "modo tablet (barcos longe somem)" });
  h = troca(h, "DOM.pts=defs.map(([x,z],i)=>{const id=navNode(x,gy0(x,z),z)", "DOM.pts=defs.map(([x,z,yy],i)=>{const id=navNode(x,yy!==undefined?yy:gy0(x,z),z)", { nome: "altura dos pontos de dominação" });
}

// ---------- battle royale (ferramentas/tiro-br.js, 2026-11-27) ----------
// O modo entra como mais um de MODES ('br'); dentro da partida ele é um "cada um por si" com BR.on (o tiro-br.js troca as
// funções da partida). Aqui ficam só os pontos que o jogo testa por 'ffa' antes da partida (menu, salão, robôs do host), o
// tamanho do salão (12 no battle royale, NET_MAX segue 8 nos outros), os 11 robôs do solo, o fim e a classificação.
{
  const br = fs.readFileSync(path.join(__dirname, "tiro-br.js"), "utf8");
  h = troca(h, "NET.cfg.mode==='ffa'", "brSolo(NET.cfg.mode)", { min: 3, nome: "BR: salão como cada um por si" });
  h = troca(h, "NET.cfg.mode!=='ffa'", "!brSolo(NET.cfg.mode)", { min: 0, nome: "BR: sem trocar de equipe" });
  h = troca(h, "Settings.mode==='ffa'", "brSolo(Settings.mode)", { nome: "BR: solo como cada um por si" });
  h = troca(h, "o.mode==='ffa'", "brSolo(o.mode)", { min: 2, nome: "BR: menu como cada um por si" });
  h = troca(h, "st.o!=='ffa'", "!brSolo(st.o)", { min: 3, nome: "BR: lista de salões" });
  h = troca(h, /NET_MAX(?!=8)/g, "netMax()", { min: 6, nome: "BR: salão de 12" });
  h = troca(h, "bots.length-FFA_BOTS", "bots.length-(BR.on?BR_MAX-1:FFA_BOTS)", { nome: "BR: 11 robôs no solo" });
  // a tela do solo mostra também os robôs a mais quando o modo é battle royale (BR_NOMES)
  h = troca(h, "const all=[...BOT_NAMES[0],...BOT_NAMES[1]]", "const all=[...BOT_NAMES[0],...BOT_NAMES[1],...(brModo(Settings.mode)?BR_NOMES:[])]", { nome: "BR: nomes dos robôs a mais no solo" });
  // os robôs a mais do battle royale (até 20), criados no boot logo depois dos 11 do jogo
  h = troca(h, "for(let i=0;i<6;i++)makeBot(1,i);", "for(let i=0;i<6;i++)makeBot(1,i);if(window.brCriarExtras)window.brCriarExtras();", { nome: "BR: robôs a mais" });
  h = troca(h, "all.length-FFA_BOTS", "all.length-(brModo(Settings.mode)?BR_MAX-1:FFA_BOTS)", { nome: "BR: 11 robôs na tela do solo" });
  h = troca(h, "const teams=!o.online?MD.teams:", "const teams=brModo(o.mode)||!o.online?MD.teams:", { nome: "BR: texto de jogadores" });
  h = troca(h, "ffaList().some((e)=>e.kills>=MATCH.limit)", "ffaAcabou()", { min: 3, nome: "BR: último vivo vence" });
  h = troca(h, "const ffaCmp=(a,b)=>", "const ffaCmp=(a,b)=>(BR.on?brCmp(a,b):0)||", { nome: "BR: classificação" });
  h = troca(h, "if(MATCH.mode==='ffa'&&(HUD.rkT-=dt)<=0){HUD.rkT=0.25;hudText($('scLim'),", "if(MATCH.mode==='ffa'&&(HUD.rkT-=dt)<=0){HUD.rkT=0.25;hudText($('scLim'),BR.on?brLinha():", { nome: "BR: vivos e zona no placar" });
  // a barra de vida também aparece com a vida cheia quando há colete (a barra azul do colete fica dentro dela)
  h = troca(h, "hudStyle(hp,'opacity',e.alive&&hpv<100?'1':'0')", "hudStyle(hp,'opacity',e.alive&&(hpv<100||(BR.on&&e.brColete>0))?'1':'0')", { nome: "BR: barra do colete" });
  // (2026-11-27, o Thiago: "os bots caem primeiro que os players") na contagem o robô dá o passo (ctlMove, com gravidade) e sai
  // antes do ringCheck, onde a queda do Battle royale segura todo mundo no ar: ele já descia enquanto o jogador esperava lá em cima
  h = troca(h, "I.firePressed=false;I.ads=false;ctlMove(b,dt);animSoldier(b,dt);return;}", "I.firePressed=false;I.ads=false;ctlMove(b,dt);if(BR.on)brQuedaPasso(b,dt);animSoldier(b,dt);return;}", { nome: "BR: robôs parados no ar na contagem" });
  // (2026-11-28, o Thiago: "deve ficar um marcador sobre o jogador da minha equipe, mesmo quando ele está atrás das paredes")
  // os marcadores de aliado (09m-marqueurs.js) ficam desligados no cada um por si; no BR em dupla eles ligam (mesmo com o ajuste
  // desligado), vão até 600 m e, atrás de parede, ficam quase tão fortes quanto à vista (0,75 em vez de 0,42)
  h = troca(h, "if(!Settings.allyMarks||MATCH.mode==='ffa'||", "if((!Settings.allyMarks||MATCH.mode==='ffa')&&!(BR.on&&BR.duo)||", { nome: "BR: marcador do parceiro" });
  h = troca(h, "a=(o.markVis?0.9:0.42)", "a=(o.markVis?0.9:BR.on&&BR.duo?0.75:0.42)", { nome: "BR: parceiro atrás de parede" });
  h = troca(h, "d<AM.range&&", "d<(BR.on&&BR.duo?600:AM.range)&&", { nome: "BR: parceiro longe" });
  // ---------- faca (2026-11-28, os amigos do Thiago: "a faca funcionava só quando queria"; e "apertando 3, segurar a faca na mão") ----------
  // - F segurado mais de 0,3 s sacava a faca em vez de dar a facada: agora F é sempre facada, na hora; quem saca e guarda é o 3;
  // - o alvo era escolhido no aperto (cone estreito, até 4,2 m) e só levava o golpe se ainda estivesse a menos de 2,2 m: agora, na
  //   hora do golpe, vale também quem estiver na frente a até 2,5 m (facaAlvo, tiro-br.js)
  h = troca(h, "const hit=PL.knifeOut||!!knifePick();if(hit)knife();", "const hit=true;knife();", { nome: "faca: F é sempre facada" });
  h = troca(h, "const KNIFE_HOLD=0.3;", "const KNIFE_HOLD=1e9;", { nome: "faca: F não saca mais" });
  h = troca(h, "else if(c==='Digit2')switchWeapon(1);", "else if(c==='Digit2')switchWeapon(1);else if(c==='Digit3'){if(PL.knifeOut)switchWeapon(PL.cur);else knifeDraw();}", { nome: "faca: 3 saca e guarda" });
  h = troca(h, "const T=PL.knifeTarget;", "let T=PL.knifeTarget;", { nome: "faca: alvo de novo no golpe (1)" });
  h = troca(h, "if(!PL.knifeHit&&PL.knifeT<KNIFE_DUR*(1-KNIFE_HIT)){PL.knifeHit=true;if(T&&T.alive&&T.pos.distanceTo(e.pos)<2.2)", "if(!PL.knifeHit&&PL.knifeT<KNIFE_DUR*(1-KNIFE_HIT)){PL.knifeHit=true;T=facaAlvo(T,e);if(T&&T.alive&&T.pos.distanceTo(e.pos)<2.5)", { nome: "faca: alvo de novo no golpe (2)" });
  h = troca(h, "['w2','Digit2',", "['faca3','Digit3',_t('Faca na mão (sem atacar)')],['w2','Digit2',", { min: 0, nome: "faca: 3 na lista de teclas" });
  // por último: o tiro-br.js usa NET_MAX e 'ffa' de propósito, e não pode passar pelas trocas acima
  h = troca(h, "if(!window.WebGLRenderingContext)", () => br + "\nif(!window.WebGLRenderingContext)", { todas: false, nome: "battle royale" });
  // o modo em dupla (2026-11-27): por cima do battle royale, no mesmo script
  const dupla = fs.readFileSync(path.join(__dirname, "tiro-br-dupla.js"), "utf8");
  h = troca(h, "if(!window.WebGLRenderingContext)", () => dupla + "\nif(!window.WebGLRenderingContext)", { todas: false, nome: "battle royale em dupla" });
}

// o perfil da Vila (servidor/jogos/tiro-perfil.js): roda antes do jogo, para o progresso do servidor já estar no navegador
fs.copyFileSync(path.join(__dirname, "tiro-perfil-cliente.js"), path.join(OUT, "perfil-galera.js"));
h = troca(h, /<meta charset="utf-8">/i, (a) => a + '\n<script src="perfil-galera.js"></script>', { todas: false, nome: "perfil da Vila" });
// a medição de visitas do Vercel (o site deles): aqui não existe, e nada de visita vai para fora
h = troca(h, /<script>\s*window\.va = window\.va \|\| function[\s\S]*?<\/script>\s*<script defer src="\/_vercel\/insights\/script\.js"><\/script>\s*/, "", { nome: "estatísticas do Vercel" });
// o "Perfil" do menu do jogo (a tela de contas do site deles, que aqui diria "sem contas") abre o perfil da Vila, e o cartão
// do menu mostra o nome e o nível dele (window.tiroPerfil, no perfil-galera.js)
h = troca(h, "function uiGo(name,push=true,fresh=push){", "function uiGo(name,push=true,fresh=push){if(name==='profile'&&ACCT.state==='off'&&window.tiroPerfil){window.tiroPerfil.abrir();return;}", { nome: "Perfil abre o da Vila" });
h = troca(h, "acctAvatarFallback($('acctAv'),u,lv);$('acctName')", "acctAvatarFallback($('acctAv'),u,lv);if(ACCT.state==='off'&&window.tiroPerfil){const t=window.tiroPerfil.rotulo();chip.classList.toggle('out',!t.ok);$('acctName').textContent=t.nome;$('acctSub').textContent=t.sub;chip.setAttribute('aria-label',t.nome+', '+t.sub);return;}$('acctName')", { nome: "cartão do perfil" });
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
