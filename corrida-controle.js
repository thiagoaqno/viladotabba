// Corrida da Galera — o controle no celular (pedido do Thiago, 2026-11-21: volante pelo giroscópio, acelerador e freio, botões e o painel com a
// marcha, a velocidade e a volta, "sem depender da internet", e no iPhone, sem app).
// Como funciona, sem internet: o celular e o PC na mesma rede Wi-Fi (o roteador de casa, ou o PC ligado no hotspot do iPhone). O programa de PC
// abre, só quando alguém pede o controle (o botão "Controle no celular" do jogo), um segundo servidor em HTTPS na porta 31518, em todas as placas
// de rede. O celular abre https://<o IP do PC>:31518/c no Safari. Bluetooth e Wi-Fi Direct não dão: o Safari do iPhone não tem nenhum dos dois
// para páginas, e um app de iPhone precisaria da loja da Apple.
// Por que HTTPS: o iPhone só entrega o giroscópio (DeviceMotionEvent) a páginas seguras. O certificado é gerado aqui mesmo (RSA 2048, SHA-256,
// com os IPs do PC no nome alternativo e o uso "servidor TLS", que o iOS exige) e guardado ao lado do banco; o Safari avisa na primeira vez
// ("Esta conexão não é privada": Mostrar Detalhes, visitar o site) e depois lembra. Muda o IP do PC, o certificado é refeito (e o aviso volta).
// O jogo no PC (que roda em 127.0.0.1) fala com este módulo pelo canal /controle do servidor de sempre; o celular, pelo /controle do servidor
// HTTPS. Aqui só se repassa: a entrada do celular vai para o jogo, e o painel do jogo vai para o celular. Um jogo por vez (o último que abriu).
const fs = require("fs"), path = require("path"), os = require("os"), crypto = require("crypto");

const PORTA = +process.env.CONTROLE_PORTA || 31518;
let https = null, ioCel = null, abrindo = null, jogo = null;
const celulares = new Set();

// ---------- o certificado (DER à mão: o Node gera a chave, mas não o certificado) ----------
const tam = (n) => (n < 128 ? Buffer.from([n]) : (() => { const b = []; for (let x = n; x > 0; x >>= 8) b.unshift(x & 255); return Buffer.from([0x80 | b.length, ...b]); })());
const der = (tag, ...partes) => { const c = Buffer.concat(partes); return Buffer.concat([Buffer.from([tag]), tam(c.length), c]); };
const seq = (...p) => der(0x30, ...p), set = (...p) => der(0x31, ...p);
const inteiro = (b) => der(0x02, b[0] & 0x80 ? Buffer.concat([Buffer.from([0]), b]) : b);
function oid(s) {
  const n = s.split(".").map(Number), b = [40 * n[0] + n[1]];
  for (const v of n.slice(2)) { const t = []; let x = v; do { t.unshift(x & 127); x = Math.floor(x / 128); } while (x > 0); for (let i = 0; i < t.length - 1; i++) t[i] |= 128; b.push(...t); }
  return der(0x06, Buffer.from(b));
}
const utc = (d) => der(0x17, Buffer.from(d.toISOString().replace(/[-:T]/g, "").slice(2, 14) + "Z"));
const nome = (cn) => seq(set(seq(oid("2.5.4.3"), der(0x0c, Buffer.from(cn)))));

function gerarCertificado(ips) {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
  const alg = seq(oid("1.2.840.113549.1.1.11"), Buffer.from([0x05, 0x00])); // sha256WithRSAEncryption
  const agora = new Date(Date.now() - 86400000), fim = new Date(Date.now() + 800 * 86400000); // (o iOS recusa certificado de mais de 825 dias)
  const alternativos = seq(...ips.map((ip) => der(0x87, Buffer.from(ip.split(".").map(Number)))), der(0x82, Buffer.from("localhost")));
  const extensoes = der(0xa3, seq(
    seq(oid("2.5.29.17"), der(0x04, alternativos)), // os nomes alternativos: os IPs do PC
    seq(oid("2.5.29.37"), der(0x04, seq(oid("1.3.6.1.5.5.7.3.1")))), // uso: servidor TLS (o iOS 13 em diante exige)
    seq(oid("2.5.29.19"), der(0x04, seq())), // não é uma autoridade
  ));
  const tbs = seq(der(0xa0, inteiro(Buffer.from([2]))), inteiro(crypto.randomBytes(12)), alg, nome("Corrida da Galera (PC)"), seq(utc(agora), utc(fim)),
    nome("Corrida da Galera (PC)"), publicKey.export({ type: "spki", format: "der" }), extensoes);
  const assinatura = crypto.sign("sha256", tbs, privateKey);
  const cert = seq(tbs, alg, der(0x03, Buffer.concat([Buffer.from([0]), assinatura])));
  const pem = "-----BEGIN CERTIFICATE-----\n" + cert.toString("base64").match(/.{1,64}/g).join("\n") + "\n-----END CERTIFICATE-----\n";
  return { cert: pem, key: privateKey.export({ type: "pkcs8", format: "pem" }), ips };
}

// os IPv4 do PC na rede local (Wi-Fi e cabo); os virtuais (WSL, VirtualBox, VPN) vão por último
function ipsDaRede() {
  const l = [];
  for (const [nomePlaca, lista] of Object.entries(os.networkInterfaces())) for (const a of lista || []) {
    if (a.family !== "IPv4" && a.family !== 4) continue; if (a.internal) continue;
    const virtual = /vethernet|virtual|vmware|vbox|wsl|hyper-v|tailscale|zerotier|loopback/i.test(nomePlaca);
    l.push({ ip: a.address, virtual, privado: /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(a.address) });
  }
  return l.sort((a, b) => a.virtual - b.virtual || b.privado - a.privado).map((x) => x.ip);
}

function certificado() {
  const ips = ipsDaRede(), pasta = process.env.DB_PATH && process.env.DB_PATH !== ":memory:" ? path.dirname(process.env.DB_PATH) : path.join(__dirname, "dados");
  const arq = path.join(pasta, "controle-certificado.json");
  try { const c = JSON.parse(fs.readFileSync(arq, "utf8")); if (c.cert && c.key && ips.every((ip) => c.ips.includes(ip))) return c; } catch (e) { /* ainda não tem: gera */ }
  const c = gerarCertificado(ips);
  try { fs.mkdirSync(pasta, { recursive: true }); fs.writeFileSync(arq, JSON.stringify(c)); } catch (e) { console.warn("Controle no celular: o certificado não foi guardado:", e.message); }
  return c;
}

// ---------- o servidor HTTPS do celular (aberto na primeira vez que o jogo pede) ----------
function abrir(app) {
  if (https) return Promise.resolve(true);
  if (abrindo) return abrindo;
  abrindo = new Promise((ok) => {
    try {
      const c = certificado(), srv = require("https").createServer({ cert: c.cert, key: c.key }, app);
      const { Server } = require("socket.io");
      ioCel = new Server(srv, { perMessageDeflate: false });
      ioCel.of("/controle").on("connection", celular);
      srv.on("error", (e) => { console.warn("Controle no celular: a porta", PORTA, "não abriu:", e.message); https = null; abrindo = null; ok(false); });
      srv.listen(PORTA, "0.0.0.0", () => { https = srv; console.log(`Controle no celular: https://${ipsDaRede()[0] || "IP-do-PC"}:${PORTA}/c`); ok(true); });
    } catch (e) { console.warn("Controle no celular:", e.message); abrindo = null; ok(false); }
  });
  return abrindo;
}

const enderecos = () => ipsDaRede().map((ip) => `https://${ip}:${PORTA}/c`);
const estado = () => ({ ligado: !!https, enderecos: enderecos(), celulares: celulares.size });
const avisarJogo = () => { if (jogo) jogo.emit("estado", estado()); };

// o celular: manda a entrada (até 60 por segundo) e recebe o painel
function celular(s) {
  celulares.add(s); avisarJogo(); s.emit("jogo", { ligado: !!jogo });
  s.on("e", (d) => { if (jogo && d && typeof d === "object") jogo.volatile.emit("e", d); });
  s.on("acao", (a) => { if (jogo && typeof a === "string" && a.length < 20) jogo.emit("acao", a); });
  s.on("disconnect", () => { celulares.delete(s); avisarJogo(); });
}

// o jogo no PC: o canal /controle do servidor de sempre (o programa escuta só em 127.0.0.1: daqui só fala o próprio PC)
function attach(io, app) {
  // só no programa de PC (ele liga HOST=127.0.0.1 e o CORRIDA_SITE: corrida-pc.js) ou com CONTROLE=1 (teste): no site não abre porta nenhuma
  if (!(process.env.HOST === "127.0.0.1" || process.env.CORRIDA_SITE || process.env.CONTROLE === "1")) return;
  io.of("/controle").on("connection", (s) => {
    const ip = String(s.handshake.address || "");
    if (!/^(::1|127\.|::ffff:127\.)/.test(ip) && !process.env.CONTROLE_QUALQUER) { s.disconnect(true); return; } // (no site não tem controle: só no PC)
    s.on("jogo", (_, cb) => {
      jogo = s; for (const c of celulares) c.emit("jogo", { ligado: true });
      if (typeof cb === "function") cb(estado());
    });
    s.on("abrir", (_, cb) => { abrir(app).then((ok) => { if (typeof cb === "function") cb({ ok, ...estado() }); avisarJogo(); }); });
    s.on("painel", (p) => { if (s === jogo && p && typeof p === "object") for (const c of celulares) c.volatile.emit("painel", p); });
    s.on("disconnect", () => { if (jogo === s) { jogo = null; for (const c of celulares) c.emit("jogo", { ligado: false }); } });
  });
  // o endereço curto que se digita no celular
  app.get("/c", (req, res) => res.redirect("/corrida/controle.html"));
}

module.exports = { attach, gerarCertificado, ipsDaRede, PORTA };
