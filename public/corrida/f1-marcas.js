// Corrida da Galera — as marcas dos patrocinadores nas pinturas de F1 (f1-pintura.js), desenhadas no canvas, sem baixar imagem:
// a cor, a letra e o traço que fazem cada uma ser reconhecida. Cada função desenha centrada em (0, 0), com altura 1; quem chama já
// deixou o canvas na escala e na rotação certas. `op.tinta` é a cor da letra (cada carro usa a do fundo em que a marca fica) e
// `op.fundo`, a cor do que está atrás (as listras da IBM são "cortadas" com ela).
const ARIAL = "Arial, Helvetica, sans-serif", PESADA = "'Arial Black', Arial, Helvetica, sans-serif", SERIFA = "Georgia, 'Times New Roman', serif", ROTEIRO = "'Segoe Script', 'Brush Script MT', 'Lucida Handwriting', cursive";

// texto de altura `h` (o tamanho da fonte) em (x, y); desenhado a 100 px e encolhido, porque o canvas arredonda fonte pequena
function letra(c, str, { x = 0, y = 0, h = 1, cor = "#fff", peso = 800, fam = ARIAL, ital = false, esp = 0, align = "center" } = {}) {
  c.save(); c.translate(x, y); c.scale(h / 100, h / 100);
  c.font = `${ital ? "italic " : ""}${peso} 100px ${fam}`; c.textAlign = align; c.textBaseline = "middle"; c.fillStyle = cor;
  if ("letterSpacing" in c) c.letterSpacing = esp ? esp + "px" : "0px";
  c.fillText(str, 0, 0); c.restore();
}
const disco = (c, x, y, r, cor) => { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = cor; c.fill(); };

// a concha: amarela, contorno vermelho e os raios saindo da base
function concha(c, x = 0, y = 0, e = 1) {
  c.save(); c.translate(x, y); c.scale(e, e);
  c.beginPath(); c.moveTo(-0.46, 0.05); c.quadraticCurveTo(-0.47, -0.48, 0, -0.5); c.quadraticCurveTo(0.47, -0.48, 0.46, 0.05);
  c.lineTo(0.27, 0.34); c.lineTo(0.13, 0.32); c.lineTo(0.1, 0.46); c.lineTo(-0.1, 0.46); c.lineTo(-0.13, 0.32); c.lineTo(-0.27, 0.34); c.closePath();
  c.fillStyle = "#fbce07"; c.fill(); c.lineJoin = "round"; c.lineWidth = 0.075; c.strokeStyle = "#dd1d21"; c.stroke();
  c.strokeStyle = "#dd1d21"; c.lineWidth = 0.045; c.lineCap = "round";
  for (const [a, b] of [[-0.36, -0.1], [-0.22, -0.32], [-0.08, -0.42], [0.08, -0.42], [0.22, -0.32], [0.36, -0.1]]) { c.beginPath(); c.moveTo(a * 0.22, 0.3); c.lineTo(a, b); c.stroke(); }
  c.restore();
}

// (2026-11-18, as imagens do Thiago: as placas de Mônaco) a coroa de cinco pontas com as bolinhas
function coroa(c, x, y, e, cor) {
  c.save(); c.translate(x, y); c.scale(e, e); c.fillStyle = cor; c.strokeStyle = cor; c.lineCap = "round";
  c.beginPath(); c.moveTo(-0.42, 0.22); c.lineTo(0.42, 0.22); c.lineTo(0.38, 0.36); c.lineTo(-0.38, 0.36); c.closePath(); c.fill();
  c.lineWidth = 0.1; for (const [a, b] of [[-0.4, -0.18], [-0.2, -0.32], [0, -0.38], [0.2, -0.32], [0.4, -0.18]]) { c.beginPath(); c.moveTo(a * 0.55, 0.2); c.lineTo(a, b); c.stroke(); disco(c, a, b - 0.06, 0.07, cor); }
  c.restore();
}
export const MARCAS = {
  // a coroa dourada e o nome em letra de serifa, dourados (vai no fundo verde)
  rolex(c) { coroa(c, 0, -0.3, 0.75, "#d7b545"); letra(c, "ROLEX", { y: 0.32, h: 0.5, peso: 700, fam: SERIFA, cor: "#d7b545", esp: 6 }); },
  // a hashtag do GP: "#Monaco" em letra cheia e o "GP" inclinado
  monacogp(c, { tinta = "#fff" } = {}) { letra(c, "#Monaco", { x: -0.42, h: 0.9, peso: 800, cor: tinta }); letra(c, "GP", { x: 1.62, h: 0.9, peso: 900, ital: true, cor: tinta }); },
  // MONACO cheio e CIRCUIT vazado, em vermelho, e o "SINCE 1929" embaixo (vai no fundo branco)
  monacocircuit(c) { letra(c, "MONACO", { x: -1.05, y: -0.08, h: 0.72, peso: 900, cor: "#e2231a" }); c.save(); c.translate(1.25, -0.08); c.scale(0.0072, 0.0072); c.font = "400 100px " + ARIAL; c.textAlign = "center"; c.textBaseline = "middle"; c.strokeStyle = "#e2231a"; c.lineWidth = 5; c.strokeText("CIRCUIT", 0, 0); c.restore();
    letra(c, "SINCE 1929", { x: 1.45, y: 0.42, h: 0.18, peso: 700, cor: "#2a2a2a", esp: 4 }); },
  // o redondo azul com o "hp" inclinado
  hp(c) { disco(c, 0, 0, 0.5, "#ffffff"); disco(c, 0, 0, 0.46, "#0096d6"); letra(c, "hp", { h: 0.72, ital: true, peso: 700, cor: "#fff", y: 0.03 }); },
  shell(c) { concha(c); },
  unicredit(c, { tinta = "#fff" } = {}) { disco(c, -1.9, 0, 0.44, "#e2001a"); disco(c, -1.9, 0, 0.2, "#fff"); disco(c, -1.9, 0, 0.1, "#e2001a"); letra(c, "UniCredit", { x: 0.35, h: 0.92, peso: 800, cor: tinta }); },
  ceva(c, { tinta = "#fff" } = {}) { letra(c, "CEVA", { y: -0.12, h: 0.9, peso: 900, cor: tinta, esp: 5 }); letra(c, "LOGISTICS", { y: 0.42, h: 0.2, peso: 700, cor: tinta, esp: 12 }); },
  ibm(c, { tinta = "#101014", fundo = "#fff" } = {}) { letra(c, "IBM", { h: 1.15, peso: 900, fam: SERIFA, cor: tinta, esp: 4 }); c.fillStyle = fundo; for (let i = 0; i < 4; i++) c.fillRect(-1.6, -0.38 + i * 0.205, 3.2, 0.05); },
  zyn(c, { tinta = "#101014" } = {}) { letra(c, "ZYN", { h: 1.2, peso: 900, fam: PESADA, cor: tinta }); },
  richardmille(c, { tinta = "#fff" } = {}) { letra(c, "RICHARD MILLE", { h: 0.95, peso: 800, cor: tinta, esp: 3 }); },
  bitdefender(c, { tinta = "#fff" } = {}) { letra(c, "Bitdefender", { h: 1, peso: 800, cor: tinta }); },
  bingx(c, { tinta = "#fff" } = {}) { letra(c, "BingX", { h: 1, peso: 800, cor: tinta }); },
  whoop(c, { tinta = "#fff" } = {}) { letra(c, "WHOOP", { h: 0.95, peso: 900, cor: tinta, esp: 4 }); },
  pirelli(c, { tinta = "#fff" } = {}) { letra(c, "PIRELLI", { h: 1, peso: 900, ital: true, cor: tinta }); c.fillStyle = tinta; c.fillRect(-1.9, 0.36, 3.5, 0.08); },
  genesys(c, { tinta = "#fff" } = {}) { disco(c, -2.2, 0, 0.22, "#ff4f1f"); letra(c, "GENESYS", { x: 0.2, h: 0.92, peso: 800, cor: tinta }); },
  vpower(c, { tinta = "#fff" } = {}) { concha(c, -1.75, 0, 0.85); letra(c, "V-Power", { x: 0.35, h: 0.92, peso: 700, ital: true, cor: tinta }); },
  peroni(c, { tinta = "#fff" } = {}) { letra(c, "PERONI", { y: -0.1, h: 0.9, peso: 700, fam: SERIFA, cor: tinta, esp: 4 }); letra(c, "NASTRO AZZURRO", { y: 0.46, h: 0.26, peso: 700, cor: tinta, esp: 3 }); },
  rayban(c, { tinta = "#fff" } = {}) { letra(c, "Ray-Ban", { h: 1.25, peso: 700, ital: true, fam: ROTEIRO, cor: tinta }); },
  ambipar(c, { tinta = "#fff" } = {}) { letra(c, "ambipar", { h: 1, peso: 700, cor: tinta }); },
  dell(c, { tinta = "#fff" } = {}) { letra(c, "DELL", { h: 1.05, peso: 900, cor: tinta, esp: 3 }); },
};

// As que são só a letra, no jeito de cada uma: [texto, { peso, ital, fam, esp, h, tinta padrão }]
const SO_LETRA = {
  okx: ["OKX", { peso: 900, fam: PESADA, h: 1.05 }], velo: ["VELO", { peso: 900, ital: true, h: 1.05 }], dhl: ["DHL", { peso: 900, ital: true, fam: PESADA, h: 1.05, tinta: "#d40511" }],
  allwyn: ["allwyn", { peso: 700 }], dpworld: ["DP WORLD", { peso: 800, esp: 3 }], petronas: ["PETRONAS", { peso: 800, esp: 3, h: 1.05 }], solera: ["SOLERA", { peso: 800, esp: 4 }],
  teamviewer: ["TeamViewer", { peso: 700 }], snapdragon: ["Snapdragon", { peso: 700 }], crowdstrike: ["CROWDSTRIKE", { peso: 900 }], amg: ["AMG", { peso: 900, ital: true, h: 1.1 }], ineos: ["INEOS", { peso: 900, esp: 3 }],
  signify: ["Signify", { peso: 700 }], iwc: ["IWC", { peso: 400, fam: SERIFA, h: 1.1, esp: 4 }], oracle: ["ORACLE", { peso: 700, esp: 6, h: 1.05 }], redbull: ["Red Bull", { peso: 900, fam: PESADA, tinta: "#d3112f" }],
  mobil1: ["Mobil 1", { peso: 800 }], rokt: ["ROKT", { peso: 900, esp: 3 }], visa: ["VISA", { peso: 900, ital: true, fam: PESADA, h: 1.1 }], hugo: ["HUGO", { peso: 800, esp: 5 }],
  aramco: ["aramco", { peso: 800, ital: true, h: 1.1 }], astonmartin: ["ASTON MARTIN", { peso: 400, fam: SERIFA, esp: 4 }], maaden: ["MAADEN", { peso: 800, esp: 3 }], coinbase: ["coinbase", { peso: 700 }],
  boss: ["BOSS", { peso: 900, esp: 3 }], valvoline: ["Valvoline", { peso: 800, ital: true }], honda: ["HONDA", { peso: 900, ital: true }], cognizant: ["cognizant", { peso: 700 }], coreweave: ["CoreWeave", { peso: 700 }],
  atlassian: ["ATLASSIAN", { peso: 800, esp: 4, h: 1.05 }], komatsu: ["KOMATSU", { peso: 900, fam: PESADA, h: 1.05 }], barclays: ["BARCLAYS", { peso: 800, esp: 3 }], duracell: ["DURACELL", { peso: 900, esp: 2 }], keeper: ["KEEPER", { peso: 800, esp: 3 }],
  revolut: ["Revolut", { peso: 800, h: 1.1 }], nexo: ["NEXO", { peso: 900, esp: 4 }], ninjaone: ["ninjaOne", { peso: 700 }], visitqatar: ["visit QATAR", { peso: 800 }],
  bwt: ["BWT", { peso: 900, ital: true, fam: PESADA, h: 1.1, tinta: "#ff7ab8" }], msc: ["MSC", { peso: 800, fam: SERIFA, esp: 3 }], alpine: ["ALPINE", { peso: 800, esp: 5 }],
  toyota: ["TOYOTA", { peso: 900, esp: 4 }], haas: ["HAAS", { peso: 900, ital: true, fam: PESADA, h: 1.1, tinta: "#101114" }], zoomex: ["ZOOMEX", { peso: 800, esp: 2 }], twg: ["TWG", { peso: 800, fam: SERIFA, esp: 5, h: 1.1 }],
  ifs: ["IFS", { peso: 900, esp: 3, h: 1.05 }], claro: ["Claro", { peso: 800, tinta: "#2ee66b" }], cadillac: ["Cadillac", { peso: 400, ital: true, fam: SERIFA, h: 1.1 }],
};
for (const [id, [str, o]] of Object.entries(SO_LETRA)) MARCAS[id] = (c, { tinta } = {}) => letra(c, str, { ...o, cor: tinta || o.tinta || "#fff" });
// As da McLaren MCL40 (os prints de 2026-11-13)
Object.assign(MARCAS, {
  etihad(c, { tinta = "#e9e3d4" } = {}) { letra(c, "ETIHAD", { h: 1.05, peso: 400, fam: SERIFA, cor: tinta, esp: 8 }); },
  groq(c, { tinta = "#fff" } = {}) { letra(c, "groq", { h: 1.05, peso: 700, cor: tinta }); },
  hilton(c, { tinta = "#fff" } = {}) { c.strokeStyle = tinta; c.lineWidth = 0.07; c.strokeRect(-1.45, -0.42, 2.9, 0.84); letra(c, "Hilton", { h: 0.7, peso: 400, fam: SERIFA, cor: tinta }); },
  oneflight(c, { tinta = "#fff" } = {}) { letra(c, "ONE", { x: -1.25, h: 1, peso: 900, cor: tinta }); letra(c, "flight", { x: 0.85, h: 1, peso: 400, ital: true, cor: tinta }); },
});
// As da Audi R26 (o modelo do Sketchfab, 2026-11-14)
Object.assign(MARCAS, {
  castrol(c, { tinta = "#fff" } = {}) { disco(c, -1.85, 0, 0.42, "#009a44"); disco(c, -1.85, 0, 0.3, "#ffffff"); disco(c, -1.85, 0, 0.18, "#e4002b"); letra(c, "Castrol", { x: 0.35, h: 0.95, peso: 800, ital: true, cor: tinta }); },
  hyatt(c, { tinta = "#fff" } = {}) { letra(c, "WORLD OF HYATT", { h: 0.9, peso: 400, fam: SERIFA, cor: tinta, esp: 4 }); },
  // o girassol verde e amarelo e o "bp"
  bp(c) { for (let i = 0; i < 12; i++) { c.save(); c.rotate(i * Math.PI / 6); c.fillStyle = i % 2 ? "#99cc00" : "#009b3a"; c.beginPath(); c.moveTo(0, 0); c.lineTo(-0.1, -0.5); c.lineTo(0.1, -0.5); c.closePath(); c.fill(); c.restore(); }
    disco(c, 0, 0, 0.2, "#ffe600"); letra(c, "bp", { x: 1.05, h: 0.9, peso: 800, cor: "#009b3a" }); },
  // o R do Revolut
  revolutr(c, { tinta = "#fff" } = {}) { letra(c, "R", { h: 1.25, peso: 900, cor: tinta }); },
  // as três faixas inclinadas
  adidas(c, { tinta = "#fff" } = {}) { c.fillStyle = tinta; for (const [x, h] of [[-0.32, 0.4], [0, 0.65], [0.32, 0.9]]) { c.save(); c.translate(x, 0.45 - h / 2); c.rotate(-0.5); c.fillRect(-0.09, -h / 2, 0.18, h); c.restore(); } },
});
// As da Cadillac MAC-26 (o modelo do Sketchfab, 2026-11-14)
Object.assign(MARCAS, {
  // o triângulo do TWG AI
  twgai(c, { tinta = "#fff" } = {}) { c.strokeStyle = tinta; c.lineWidth = 0.09; c.lineJoin = "round"; c.beginPath(); c.moveTo(-0.5, -0.38); c.lineTo(0.5, -0.38); c.lineTo(0, 0.48); c.closePath(); c.stroke(); letra(c, "AI", { y: -0.08, h: 0.38, peso: 900, cor: tinta }); },
  jimbeam(c, { tinta = "#fff" } = {}) { letra(c, "JIM BEAM", { h: 0.9, peso: 700, fam: SERIFA, cor: tinta, esp: 3 }); },
  corescientific(c, { tinta = "#fff" } = {}) { c.strokeStyle = tinta; c.lineWidth = 0.12; c.beginPath(); c.arc(-3.3, 0, 0.36, 0.6, Math.PI * 2 - 0.6); c.stroke(); letra(c, "CORE SCIENTIFIC", { x: 0.2, h: 0.8, peso: 700, cor: tinta, esp: 3 }); },
  // o brasão da Cadillac: o escudo com a grade de quadros
  brasao(c, { tinta = "#fff" } = {}) { c.strokeStyle = tinta; c.lineWidth = 0.06; c.beginPath(); c.moveTo(-0.62, -0.42); c.lineTo(0.62, -0.42); c.lineTo(0.5, 0.2); c.lineTo(0, 0.46); c.lineTo(-0.5, 0.2); c.closePath(); c.stroke();
    c.fillStyle = tinta; for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) if ((i + j) % 2) c.fillRect(-0.5 + i * 0.25, -0.32 + j * 0.24, 0.22, 0.2); },
  // a bandeirinha da Tommy Hilfiger
  hilfiger(c) { c.fillStyle = "#ffffff"; c.fillRect(-0.62, -0.42, 1.24, 0.84); c.fillStyle = "#00205b"; c.fillRect(-0.58, -0.38, 0.58, 0.38); c.fillRect(0, 0, 0.58, 0.38); c.fillStyle = "#c8102e"; c.fillRect(-0.58, 0, 0.58, 0.38); },
});
// As da Aston Martin AMR26 (o modelo do Sketchfab, 2026-11-14)
Object.assign(MARCAS, {
  coherent(c, { tinta = "#fff" } = {}) { letra(c, "coherent", { h: 1, peso: 600, cor: tinta }); },
  proforce(c, { tinta = "#fff" } = {}) { letra(c, "PROFORCE+", { h: 0.95, peso: 800, ital: true, cor: tinta }); },
  pepperstone(c, { tinta = "#fff" } = {}) { disco(c, -2.6, 0, 0.36, tinta); letra(c, "pepperstone", { x: 0.3, h: 0.9, peso: 600, cor: tinta }); },
  glenfiddich(c, { tinta = "#fff" } = {}) { letra(c, "GLENFIDDICH", { h: 0.9, peso: 700, fam: SERIFA, cor: tinta, esp: 3 }); },
  netapp(c, { tinta = "#fff" } = {}) { letra(c, "NetApp", { h: 1, peso: 800, cor: tinta }); },
  xerox(c, { tinta = "#fff" } = {}) { letra(c, "xerox", { h: 1.05, peso: 600, cor: tinta }); },
  nexgen(c, { tinta = "#fff" } = {}) { letra(c, "NexGen", { h: 1, peso: 700, cor: tinta }); },
  hhonda(c, { tinta = "#fff" } = {}) { c.strokeStyle = tinta; c.lineWidth = 0.08; c.beginPath(); c.moveTo(-0.45, -0.42); c.lineTo(0.45, -0.42); c.lineTo(0.38, 0.42); c.lineTo(-0.38, 0.42); c.closePath(); c.stroke(); letra(c, "H", { h: 0.7, peso: 900, cor: tinta }); },
  cw(c, { tinta = "#fff" } = {}) { letra(c, "CW", { h: 1.05, peso: 900, cor: tinta }); },
});
// As da Williams (o modelo do FW47 no Sketchfab, 2026-11-14)
Object.assign(MARCAS, {
  stephens(c, { tinta = "#fff" } = {}) { letra(c, "Stephens", { h: 1.05, peso: 400, fam: SERIFA, cor: tinta }); },
  myprotein(c, { tinta = "#fff" } = {}) { c.fillStyle = "#e4002b"; c.beginPath(); c.moveTo(-3.4, 0.4); c.lineTo(-3.15, -0.4); c.lineTo(-2.95, 0.4); c.closePath(); c.fill(); letra(c, "MYPROTEIN", { x: 0.3, h: 0.95, peso: 800, cor: tinta, esp: 3 }); },
  // o polvo do Kraken (um arco com os tentáculos) e o nome
  kraken(c, { tinta = "#fff" } = {}) { c.fillStyle = tinta; c.beginPath(); c.arc(-1.75, 0.05, 0.42, Math.PI, 0); c.lineTo(0.42 - 1.75, 0.42); c.lineTo(-1.75 - 0.42, 0.42); c.closePath(); c.fill(); letra(c, "kraken", { x: 0.4, h: 1.05, peso: 600, cor: tinta }); },
  twilio(c, { tinta = "#fff" } = {}) { c.strokeStyle = "#f22f46"; c.lineWidth = 0.1; c.beginPath(); c.arc(-1.55, 0, 0.4, 0, Math.PI * 2); c.stroke(); for (const [x, y] of [[-0.15, -0.15], [0.15, -0.15], [-0.15, 0.15], [0.15, 0.15]]) disco(c, -1.55 + x, y, 0.08, "#f22f46"); letra(c, "twilio", { x: 0.35, h: 1, peso: 600, cor: tinta }); },
  vast(c, { tinta = "#fff" } = {}) { letra(c, "VAST", { h: 1, peso: 300, cor: tinta, esp: 8 }); },
  bwscores(c, { tinta = "#fff" } = {}) { letra(c, "bw", { y: -0.15, h: 0.85, peso: 900, cor: tinta }); letra(c, "SCORES", { y: 0.42, h: 0.28, peso: 700, cor: tinta, esp: 4 }); },
  williamsw(c, { tinta = "#fff" } = {}) { c.strokeStyle = tinta; c.lineWidth = 0.13; c.lineJoin = "round"; c.beginPath(); c.moveTo(-0.5, -0.35); c.lineTo(-0.25, 0.35); c.lineTo(0, -0.1); c.lineTo(0.25, 0.35); c.lineTo(0.5, -0.35); c.stroke(); },
  // o A do Atlassian (o triângulo cortado)
  atlassiana(c, { tinta = "#fff" } = {}) { c.fillStyle = tinta; c.beginPath(); c.moveTo(0, -0.48); c.lineTo(0.42, 0.42); c.lineTo(0.12, 0.42); c.lineTo(0, 0.12); c.lineTo(-0.12, 0.42); c.lineTo(-0.42, 0.42); c.closePath(); c.fill(); },
});
// A da RB VCARB 01 (o modelo do Sketchfab, 2026-11-14)
Object.assign(MARCAS, { tudor(c, { tinta = "#fff" } = {}) { letra(c, "TUDOR", { h: 1, peso: 700, fam: SERIFA, cor: tinta, esp: 6 }); } });
// As que têm um traço a mais
Object.assign(MARCAS, {
  gemini(c, { tinta = "#fff" } = {}) { c.save(); c.translate(-1.75, 0); c.beginPath(); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; c.lineTo(Math.cos(a) * 0.46, Math.sin(a) * 0.46); c.lineTo(Math.cos(a + Math.PI / 4) * 0.09, Math.sin(a + Math.PI / 4) * 0.09); } c.closePath(); c.fillStyle = "#6fb6ff"; c.fill(); c.restore(); letra(c, "Gemini", { x: 0.35, h: 1, peso: 500, cor: tinta }); },
  mastercard(c) { disco(c, -0.3, 0, 0.48, "#eb001b"); disco(c, 0.3, 0, 0.48, "#f79e1b"); c.globalAlpha = 0.9; c.beginPath(); c.ellipse(0, 0, 0.17, 0.4, 0, 0, Math.PI * 2); c.fillStyle = "#ff5f00"; c.fill(); c.globalAlpha = 1; },
  dropbox(c, { tinta = "#101114" } = {}) { c.fillStyle = "#0061ff"; for (const [x, y] of [[-2.2, -0.2], [-1.86, -0.2], [-2.2, 0.16], [-1.86, 0.16]]) { c.save(); c.translate(x, y); c.rotate(Math.PI / 4); c.fillRect(-0.12, -0.12, 0.24, 0.24); c.restore(); } letra(c, "Dropbox", { x: 0.1, h: 0.95, peso: 700, cor: tinta }); },
  microsoft(c, { tinta = "#fff" } = {}) { const q = [["#f35325", -2.75, -0.42], ["#81bc06", -2.3, -0.42], ["#05a6f0", -2.75, 0.03], ["#ffba08", -2.3, 0.03]]; for (const [cor, x, y] of q) { c.fillStyle = cor; c.fillRect(x, y, 0.41, 0.41); } letra(c, "Microsoft", { x: 0.2, h: 0.9, peso: 600, cor: tinta }); },
  cashapp(c, { tinta = "#fff" } = {}) { c.fillStyle = "#00d632"; c.beginPath(); c.roundRect(-2.45, -0.45, 0.9, 0.9, 0.2); c.fill(); letra(c, "$", { x: -2, h: 0.76, peso: 900, cor: "#fff" }); letra(c, "Cash App", { x: 0.35, h: 0.86, peso: 800, cor: tinta }); },
  ford(c) { c.beginPath(); c.ellipse(0, 0, 0.92, 0.48, 0, 0, Math.PI * 2); c.fillStyle = "#fff"; c.fill(); c.beginPath(); c.ellipse(0, 0, 0.86, 0.42, 0, 0, Math.PI * 2); c.fillStyle = "#133a7c"; c.fill(); letra(c, "Ford", { h: 0.62, peso: 700, ital: true, fam: ROTEIRO, cor: "#fff" }); },
  gulf(c) { disco(c, 0, 0, 0.5, "#ff6b00"); disco(c, 0, 0, 0.4, "#0a2f7c"); letra(c, "Gulf", { h: 0.42, peso: 900, cor: "#ff6b00" }); },
  aneis(c, { tinta = "#ff3d0a" } = {}) { c.strokeStyle = tinta; c.lineWidth = 0.1; for (const x of [-0.84, -0.28, 0.28, 0.84]) { c.beginPath(); c.arc(x, 0, 0.42, 0, Math.PI * 2); c.stroke(); } },
  eni(c, { tinta = "#fff" } = {}) { letra(c, "eni", { x: -0.45, h: 1.1, peso: 800, cor: tinta }); c.fillStyle = "#ffcb05"; c.fillRect(0.3, -0.4, 0.82, 0.8); letra(c, "6", { x: 0.71, h: 0.7, peso: 900, cor: "#111" }); },
  gr(c) { letra(c, "G", { x: -0.46, h: 1.28, peso: 900, ital: true, fam: PESADA, cor: "#101114" }); letra(c, "R", { x: 0.46, h: 1.28, peso: 900, ital: true, fam: PESADA, cor: "#e10a2b" }); },
});
// As das temporadas 2023 a 2025 (f1-pintura.js, "equipe@ano")
Object.assign(MARCAS, {
  // o círculo vermelho com a seta branca e o nome
  moneygram(c, { tinta = "#fff" } = {}) { disco(c, -2.25, 0, 0.5, "#da291c"); c.strokeStyle = "#fff"; c.lineWidth = 0.13; c.lineCap = "round"; c.beginPath(); c.arc(-2.25, 0, 0.27, 0.5, 5.2); c.stroke(); c.beginPath(); c.moveTo(-2.25, 0.02); c.lineTo(-1.98, 0.02); c.stroke(); letra(c, "MoneyGram", { x: 0.35, h: 0.9, peso: 800, cor: tinta }); },
  // a letra cursiva de pincel, com o traço que sai do S e sublinha o nome (o logo que o Thiago mandou)
  stake(c, { tinta = "#fff" } = {}) { letra(c, "Stake", { h: 1.25, peso: 700, fam: ROTEIRO, cor: tinta }); c.strokeStyle = tinta; c.lineCap = "round"; c.lineWidth = 0.13; c.beginPath(); c.moveTo(-1.35, 0.5); c.quadraticCurveTo(-0.2, 0.8, 1.25, 0.42); c.stroke(); },
  kick(c, { tinta = "#53fc18" } = {}) { letra(c, "KICK", { h: 1.1, peso: 900, fam: PESADA, cor: tinta, esp: 2 }); },
  // o bloco vermelho com o nome branco
  orlen(c) { c.fillStyle = "#e30613"; c.fillRect(-1.75, -0.5, 3.5, 1); letra(c, "ORLEN", { h: 0.72, peso: 900, cor: "#fff", esp: 4 }); },
  alphatauri(c, { tinta = "#fff" } = {}) { letra(c, "ALPHA", { x: -1.45, h: 1, peso: 300, cor: tinta, esp: 3 }); letra(c, "TAURI", { x: 1.35, h: 1, peso: 900, cor: tinta, esp: 3 }); },
  alfaromeo(c, { tinta = "#fff" } = {}) { letra(c, "Alfa Romeo", { h: 1, peso: 700, ital: true, fam: SERIFA, cor: tinta }); },
  // o quadrifoglio: o trevo verde de quatro folhas no triângulo branco
  trevo(c) { c.beginPath(); c.moveTo(0, -0.5); c.lineTo(0.5, 0.42); c.lineTo(-0.5, 0.42); c.closePath(); c.fillStyle = "#fff"; c.fill(); for (const [x, y] of [[0, -0.02], [0.13, 0.12], [0, 0.26], [-0.13, 0.12]]) disco(c, x, y, 0.1, "#1f8f3a"); },
  // a chama vermelha e o nome
  santander(c, { tinta = "#fff" } = {}) { disco(c, -2.15, 0.05, 0.36, "#ec0000"); c.fillStyle = "#fff"; c.fillRect(-2.21, -0.3, 0.12, 0.42); letra(c, "Santander", { x: 0.3, h: 0.9, peso: 700, cor: tinta }); },
  // o "Chrome" com o círculo de três cores no lugar do o
  chrome(c, { tinta = "#fff" } = {}) { letra(c, "Chr", { x: -0.95, h: 1, peso: 700, cor: tinta, align: "center" }); for (const [a0, a1, cor] of [[-1.6, 0.5, "#ea4335"], [0.5, 2.6, "#fbbc05"], [2.6, 4.7, "#34a853"]]) { c.beginPath(); c.moveTo(0.05, 0.05); c.arc(0.05, 0.05, 0.36, a0, a1); c.closePath(); c.fillStyle = cor; c.fill(); } disco(c, 0.05, 0.05, 0.16, "#4285f4"); letra(c, "me", { x: 0.85, h: 1, peso: 700, cor: tinta }); },
  palmangels(c, { tinta = "#fff" } = {}) { letra(c, "Palm Angels", { h: 0.95, peso: 700, fam: SERIFA, cor: tinta }); },
});
// As da Mercedes W17 (os prints de 2026-11-13)
Object.assign(MARCAS, {
  // a estrela de três pontas no anel
  estrela(c, { tinta = "#fff" } = {}) { c.strokeStyle = tinta; c.lineWidth = 0.07; c.beginPath(); c.arc(0, 0, 0.46, 0, Math.PI * 2); c.stroke(); c.fillStyle = tinta; c.beginPath(); for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + k * Math.PI / 3, q = k % 2 ? 0.08 : 0.43; c.lineTo(Math.cos(a) * q, Math.sin(a) * q); } c.closePath(); c.fill(); },
  // a gota verde-água da PETRONAS
  gota(c) { c.fillStyle = "#00d2be"; c.beginPath(); c.moveTo(0, -0.5); c.quadraticCurveTo(0.42, 0, 0.36, 0.2); c.arc(0, 0.2, 0.36, 0, Math.PI); c.quadraticCurveTo(-0.42, 0, 0, -0.5); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.ellipse(0, 0.16, 0.13, 0.2, 0, 0, Math.PI * 2); c.fill(); },
  syntium(c, { tinta = "#fff" } = {}) { letra(c, "PETRONAS", { y: -0.3, h: 0.36, peso: 800, cor: tinta, esp: 4 }); letra(c, "Syntium", { y: 0.2, h: 0.72, peso: 700, ital: true, cor: tinta }); },
});
// As da Red Bull RB22 (os prints de 2026-11-13)
Object.assign(MARCAS, {
  gate(c, { tinta = "#fff" } = {}) { letra(c, "Gate", { h: 1.15, peso: 900, cor: tinta }); },
  carlyle(c, { tinta = "#fff" } = {}) { letra(c, "CARLYLE", { h: 0.9, peso: 400, fam: SERIFA, cor: tinta, esp: 5 }); },
  att(c, { tinta = "#fff" } = {}) { letra(c, "AT&T", { h: 1, peso: 800, cor: tinta }); },
  // o escudo vermelho e verde com o nome
  tagheuer(c) { c.beginPath(); c.moveTo(-0.5, -0.5); c.lineTo(0.5, -0.5); c.lineTo(0.5, 0.25); c.lineTo(0, 0.5); c.lineTo(-0.5, 0.25); c.closePath(); c.fillStyle = "#fff"; c.fill();
    c.fillStyle = "#0b7a43"; c.fillRect(-0.42, -0.42, 0.84, 0.36); c.fillStyle = "#d4152b"; c.fillRect(-0.42, -0.02, 0.84, 0.3);
    letra(c, "TAG", { y: -0.24, h: 0.28, peso: 900, cor: "#fff" }); letra(c, "HEUER", { y: 0.13, h: 0.24, peso: 900, cor: "#fff" }); },
  // (2026-11-16, as imagens do Thiago) patrocinadores novos: as marcas de uma cor só usam a tinta do fundo; as que têm caixa ou símbolo, as cores delas
  aramco(c, { tinta = "#fff" } = {}) { letra(c, "aramco", { x: -0.45, h: 1, peso: 700, cor: tinta }); const g = c.createLinearGradient(1.75, 0.45, 2.55, -0.45); g.addColorStop(0, "#84bd3a"); g.addColorStop(0.5, "#00a651"); g.addColorStop(1, "#00a3e0"); c.fillStyle = g; c.fillRect(1.7, -0.42, 0.84, 0.84);
    c.strokeStyle = "#fff"; c.lineWidth = 0.035; c.lineCap = "round"; for (let k = 0; k < 9; k++) { const a = -2.6 + k * 0.62; c.beginPath(); c.moveTo(2.17, -0.08); c.lineTo(2.17 + Math.cos(a) * 0.36, -0.08 + Math.sin(a) * 0.36); c.stroke(); } },
  aws(c, { tinta = "#fff" } = {}) { letra(c, "aws", { y: -0.12, h: 0.85, peso: 700, cor: tinta }); c.strokeStyle = "#ff9900"; c.lineWidth = 0.09; c.lineCap = "round"; c.beginPath(); c.moveTo(-0.7, 0.32); c.quadraticCurveTo(0, 0.62, 0.62, 0.3); c.stroke(); c.beginPath(); c.moveTo(0.42, 0.24); c.lineTo(0.66, 0.26); c.lineTo(0.62, 0.48); c.stroke(); },
  dhl(c) { c.fillStyle = "#ffcc00"; c.fillRect(-2.3, -0.5, 4.6, 1); c.fillStyle = "#d40511"; for (const y of [0.08, 0.2, 0.32]) { c.fillRect(-2.3, y - 0.04, 0.6, 0.06); c.fillRect(1.7, y - 0.04, 0.6, 0.06); } letra(c, "DHL", { h: 0.85, peso: 900, ital: true, cor: "#d40511", esp: -2 }); },
  heineken(c, { tinta = "#fff" } = {}) { c.save(); c.translate(0, -0.34); c.fillStyle = "#e3000f"; c.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 0.1 : 0.24, a = -Math.PI / 2 + k * Math.PI / 5; c[k ? "lineTo" : "moveTo"](Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); c.restore();
    letra(c, "Heineken", { y: 0.22, h: 0.62, peso: 900, fam: SERIFA, cor: tinta === "#101114" ? "#008200" : tinta }); },
  lenovo(c) { c.fillStyle = "#e1251b"; c.fillRect(-1.6, -0.5, 3.2, 1); letra(c, "Lenovo", { h: 0.62, peso: 700, cor: "#fff" }); },
  lvmh(c, { tinta = "#fff" } = {}) { letra(c, "LVMH", { h: 1, peso: 400, fam: SERIFA, cor: tinta, esp: 4 }); },
  msc(c, { tinta = "#fff" } = {}) { c.save(); c.translate(-1.55, 0); c.fillStyle = tinta; c.beginPath(); for (let k = 0; k < 16; k++) { const r = k % 2 ? 0.22 : 0.48, a = -Math.PI / 2 + k * Math.PI / 8; c[k ? "lineTo" : "moveTo"](Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); c.restore();
    letra(c, "MSC", { x: 0.35, y: -0.1, h: 0.75, peso: 700, fam: SERIFA, cor: tinta }); letra(c, "CRUISES", { x: 0.35, y: 0.4, h: 0.22, peso: 700, fam: SERIFA, cor: tinta, esp: 12 }); },
  pirellicaixa(c) { c.fillStyle = "#ffdd00"; c.fillRect(-2.2, -0.5, 4.4, 1); letra(c, "PIRELLI", { h: 0.62, peso: 900, cor: "#e31e24" }); c.fillStyle = "#e31e24"; c.fillRect(-1.7, -0.36, 3.4, 0.08); },
  qatar(c, { tinta = "#fff" } = {}) { letra(c, "QATAR", { y: -0.18, h: 0.7, peso: 400, fam: SERIFA, cor: tinta }); letra(c, "AIRWAYS", { x: 0.2, y: 0.36, h: 0.36, peso: 400, fam: SERIFA, cor: tinta }); },
  salesforce(c) { c.fillStyle = "#00a1e0"; for (const [x, y, r] of [[-0.55, 0.08, 0.36], [-0.15, -0.14, 0.4], [0.35, -0.1, 0.36], [0.7, 0.1, 0.32], [0.1, 0.18, 0.34]]) disco(c, x, y, r, "#00a1e0"); letra(c, "salesforce", { y: 0.08, h: 0.32, peso: 700, cor: "#fff" }); },
  allwyn(c, { tinta = "#fff" } = {}) { disco(c, -1.55, 0, 0.48, "#57c5d0"); letra(c, "a", { x: -1.55, y: -0.04, h: 0.8, peso: 800, cor: "#004f5d" }); letra(c, "allwyn", { x: 0.4, h: 0.85, peso: 800, cor: tinta }); },
  amex(c) { c.fillStyle = "#016fd0"; c.fillRect(-0.5, -0.5, 1, 1); for (const [t, y] of [["AMERICAN", -0.13], ["EXPRESS", 0.12]]) { c.fillStyle = "#fff"; c.fillRect(-0.47, y - 0.1, 0.94, 0.2); letra(c, t, { y, h: 0.17, peso: 900, cor: "#016fd0" }); } },
  barilla(c) { c.save(); c.scale(1.7, 0.5); disco(c, 0, 0, 1, "#be1e2d"); c.restore(); letra(c, "Barilla", { y: 0.05, h: 0.5, peso: 800, ital: true, cor: "#fff" }); letra(c, "DAL 1877", { y: -0.3, h: 0.12, peso: 700, cor: "#fff", esp: 6 }); },
  cryptocom(c, { tinta = "#fff" } = {}) { c.save(); c.translate(-1.45, 0); c.fillStyle = "#103f8f"; c.beginPath(); for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + k * Math.PI / 3; c[k ? "lineTo" : "moveTo"](Math.cos(a) * 0.5, Math.sin(a) * 0.5); } c.closePath(); c.fill(); c.fillStyle = "#fff"; c.fillRect(-0.14, -0.28, 0.28, 0.14); c.fillRect(-0.07, -0.08, 0.14, 0.16); c.fillRect(-0.3, -0.04, 0.16, 0.26); c.fillRect(0.14, -0.04, 0.16, 0.26); c.restore();
    letra(c, "crypto.com", { x: 0.45, h: 0.6, peso: 600, cor: tinta }); },
  globant(c, { tinta = "#fff" } = {}) { letra(c, "Globant", { x: -0.3, h: 0.9, peso: 800, cor: tinta }); c.fillStyle = "#bfd730"; c.beginPath(); c.moveTo(1.55, -0.38); c.lineTo(2.05, 0); c.lineTo(1.55, 0.38); c.quadraticCurveTo(1.72, 0, 1.55, -0.38); c.fill(); },
  lasvegas(c, { tinta = "#fff" } = {}) { letra(c, "Vegas", { y: 0.1, h: 0.85, peso: 700, fam: ROTEIRO, cor: tinta }); c.fillStyle = tinta; c.fillRect(0.15, -0.55, 0.75, 0.3); letra(c, "LAS", { x: 0.52, y: -0.4, h: 0.24, peso: 900, cor: tinta === "#fff" || tinta === "#ffffff" ? "#101114" : "#fff" }); },
  liquimoly(c) { c.fillStyle = "#0056a8"; c.fillRect(-0.8, -0.5, 1.6, 0.5); c.fillStyle = "#e30613"; c.fillRect(-0.8, 0, 1.6, 0.5); letra(c, "LIQUI", { y: -0.24, h: 0.4, peso: 900, cor: "#fff" }); letra(c, "MOLY", { y: 0.26, h: 0.4, peso: 900, cor: "#fff" }); },
  louisvuitton(c, { tinta = "#fff" } = {}) { letra(c, "LOUIS VUITTON", { h: 0.8, peso: 500, cor: tinta, esp: 6 }); },
  marsh(c, { tinta = "#fff" } = {}) { letra(c, "MARSH", { h: 1, peso: 700, cor: tinta, esp: 4 }); },
  moethennessy(c, { tinta = "#fff" } = {}) { letra(c, "Moët Hennessy", { h: 0.85, peso: 400, fam: SERIFA, cor: tinta }); },
  // (2026-11-16, a segunda leva de imagens do Thiago)
  nestle(c, { tinta = "#fff" } = {}) { c.save(); c.translate(0, -0.3); c.strokeStyle = tinta; c.lineWidth = 0.05; c.beginPath(); c.ellipse(-0.08, 0.1, 0.28, 0.12, 0, 0, Math.PI); c.stroke(); c.beginPath(); c.moveTo(0.05, -0.2); c.quadraticCurveTo(0.35, -0.2, 0.32, 0.25); c.stroke(); disco(c, -0.15, -0.05, 0.06, tinta); disco(c, 0.06, -0.18, 0.07, tinta); c.restore();
    letra(c, "Nestlé", { y: 0.22, h: 0.55, peso: 800, cor: tinta }); },
  paramount(c) { c.save(); c.translate(0, -0.12); c.beginPath(); c.arc(0, 0, 0.38, Math.PI, 0); c.closePath(); c.fillStyle = "#0064ff"; c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.moveTo(-0.24, 0); c.lineTo(0, -0.24); c.lineTo(0.24, 0); c.lineTo(0.18, 0); c.lineTo(0, -0.17); c.lineTo(-0.18, 0); c.closePath(); c.fill();
    for (let k = 0; k < 9; k++) { const a = Math.PI + 0.25 + k * 0.33; disco(c, Math.cos(a) * 0.31, Math.sin(a) * 0.31, 0.025, "#fff"); } c.restore(); letra(c, "Paramount+", { y: 0.28, h: 0.4, peso: 700, ital: true, fam: SERIFA, cor: "#0064ff" }); },
  pepsico(c, { tinta = "#fff" } = {}) { disco(c, -1.75, -0.05, 0.4, "#e9a126"); disco(c, -1.45, -0.25, 0.14, "#77a9dc"); c.fillStyle = "#5f9142"; c.beginPath(); c.arc(-1.7, -0.05, 0.48, 0.3, Math.PI - 0.3); c.lineTo(-1.7, 0.1); c.closePath(); c.fill(); letra(c, "p", { x: -1.72, y: -0.08, h: 0.6, peso: 900, cor: "#fff" });
    letra(c, "pepsico", { x: 0.35, y: -0.1, h: 0.8, peso: 900, cor: tinta === "#101114" ? "#14385e" : tinta }); },
  pwc(c, { tinta = "#fff" } = {}) { c.fillStyle = "#fd5108"; c.fillRect(0.0, -0.62, 0.5, 0.14); c.fillRect(0.45, -0.76, 0.5, 0.14); letra(c, "pwc", { y: 0.05, h: 0.95, peso: 900, fam: SERIFA, cor: tinta }); },
  standardchartered(c, { tinta = "#fff" } = {}) { c.lineCap = "round"; c.lineWidth = 0.16; c.strokeStyle = "#0473ea"; c.beginPath(); c.moveTo(-1.55, -0.4); c.lineTo(-1.95, -0.15); c.lineTo(-1.45, 0.15); c.stroke(); c.strokeStyle = "#38d200"; c.beginPath(); c.moveTo(-1.95, -0.02); c.lineTo(-1.45, 0.38); c.stroke();
    letra(c, "standard", { x: 0.25, y: -0.2, h: 0.42, peso: 500, cor: tinta }); letra(c, "chartered", { x: 0.25, y: 0.24, h: 0.42, peso: 500, cor: tinta }); },
  mcdonalds(c) { c.strokeStyle = "#ffc72c"; c.lineWidth = 0.13; c.beginPath(); c.moveTo(-0.5, 0.5); c.bezierCurveTo(-0.48, -0.8, -0.02, -0.8, 0, 0.35); c.bezierCurveTo(0.02, -0.8, 0.48, -0.8, 0.5, 0.5); c.stroke(); },
  tmobile(c) { c.fillStyle = "#e20074"; c.fillRect(-2.2, -0.42, 0.6, 0.1); c.fillRect(-1.94, -0.42, 0.12, 0.84); c.fillRect(-2.2, -0.42, 0.08, 0.2); c.fillRect(-1.68, -0.42, 0.08, 0.2); c.fillRect(-2.2, -0.1, 0.14, 0.14); c.fillRect(-1.74, -0.1, 0.14, 0.14);
    letra(c, "Mobile", { x: 0.25, h: 0.85, peso: 700, fam: SERIFA, cor: "#e20074" }); },
  aggreko(c) { letra(c, "aggreko", { h: 1, peso: 800, cor: "#f58220" }); },
  fever(c, { tinta = "#fff" } = {}) { letra(c, "fever", { h: 1, peso: 800, cor: tinta }); },
  flexjet(c, { tinta = "#fff" } = {}) { letra(c, "FLEXJET", { y: -0.1, h: 0.6, peso: 500, cor: tinta, esp: 10 }); c.fillStyle = tinta; c.beginPath(); c.moveTo(-1.8, 0.36); c.lineTo(1.2, 0.33); c.quadraticCurveTo(1.6, 0.3, 2.0, -0.35); c.lineTo(1.85, -0.35); c.quadraticCurveTo(1.5, 0.22, 1.1, 0.28); c.lineTo(-1.8, 0.33); c.closePath(); c.fill(); },
  puma(c, { tinta = "#fff" } = {}) { c.fillStyle = tinta; c.beginPath(); c.moveTo(-0.6, -0.3); c.quadraticCurveTo(-0.5, -0.45, -0.3, -0.35); c.quadraticCurveTo(0.05, -0.3, 0.25, -0.05); c.quadraticCurveTo(0.4, 0.05, 0.5, -0.15); c.quadraticCurveTo(0.55, -0.45, 0.68, -0.48); c.quadraticCurveTo(0.62, -0.3, 0.55, -0.05); c.quadraticCurveTo(0.45, 0.15, 0.38, 0.12);
    c.quadraticCurveTo(0.5, 0.3, 0.42, 0.5); c.lineTo(0.35, 0.5); c.quadraticCurveTo(0.32, 0.3, 0.2, 0.15); c.quadraticCurveTo(0, 0.02, -0.25, 0.0); c.quadraticCurveTo(-0.4, -0.05, -0.5, -0.12); c.quadraticCurveTo(-0.65, -0.1, -0.62, -0.18); c.closePath(); c.fill(); },
  tata(c, { tinta = "#fff" } = {}) { letra(c, "TATA", { y: -0.24, h: 0.48, peso: 900, cor: tinta === "#101114" ? "#3f84c6" : tinta }); letra(c, "COMMUNICATIONS", { y: 0.24, h: 0.34, peso: 600, cor: tinta === "#101114" ? "#3f84c6" : tinta }); },
  fanatec(c, { tinta = "#fff" } = {}) { letra(c, "FANATEC", { h: 0.85, peso: 900, ital: true, cor: tinta, esp: 4 }); },
  betway(c) { c.fillStyle = "#262626"; c.beginPath(); c.moveTo(-1.5, -0.5); c.lineTo(1.25, -0.5); c.lineTo(1.6, 0.5); c.lineTo(-1.15, 0.5); c.closePath(); c.fill(); letra(c, "betway", { x: 0.05, h: 0.6, peso: 800, cor: "#fff" }); },
  fanduel(c) { c.fillStyle = "#0078ff"; c.fillRect(-1.6, -0.5, 3.2, 1); c.fillStyle = "#fff"; c.beginPath(); c.moveTo(-1.2, -0.25); c.quadraticCurveTo(-0.95, -0.35, -0.7, -0.25); c.quadraticCurveTo(-0.72, 0.15, -0.95, 0.28); c.quadraticCurveTo(-1.18, 0.15, -1.2, -0.25); c.fill(); letra(c, "FANDUEL", { x: 0.35, h: 0.42, peso: 800, cor: "#fff" }); },
});
export function desenharMarca(c, id, op) { MARCAS[id]?.(c, op); }
