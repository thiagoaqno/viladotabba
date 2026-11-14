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

export const MARCAS = {
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
});
export function desenharMarca(c, id, op) { MARCAS[id]?.(c, op); }
