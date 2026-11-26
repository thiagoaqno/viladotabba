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

// ---------- mapas nossos (ferramentas/tiro-mapas/) ----------
// Iate Esmeralda (2026-11-26): o código do mapa entra no fim do script do jogo, logo antes do boot, e se registra sozinho
// (MAP_DEFS, MAPS, MAP_ART). A água do porto só tinha mar a oeste do cais: o iate traz a própria grade de água (iate.js) e aqui
// o campo de espuma passa a ficar centrado no navio quando o mapa é o iate.
{
  const MAPAS = path.join(__dirname, "tiro-mapas");
  h = troca(h, "F={x0:-144,z0:-128,ppm:2,w:256,h:512}", "F=(CURMAP.id==='iate'?{x0:-64,z0:-96,ppm:2,w:256,h:384}:{x0:-144,z0:-128,ppm:2,w:256,h:512})", { nome: "campo da água centrado no iate" });
  const iate = fs.readFileSync(path.join(MAPAS, "iate.js"), "utf8");
  h = troca(h, "if(!window.WebGLRenderingContext)", () => iate + "\nif(!window.WebGLRenderingContext)", { todas: false, nome: "mapa Iate Esmeralda" });
  fs.copyFileSync(path.join(MAPAS, "iate.svg"), path.join(OUT, "maps", "iate.svg"));
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
