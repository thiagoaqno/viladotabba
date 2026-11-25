// Os 16 estilos de capacete da imagem do Thiago (2026-11-16: "eles não ficam todos com a mesma cor, já têm cores predefinidas que podem ser
// alteradas; e o mesmo desenho"). Cada estilo tem o seu desenho e as suas cores de fábrica (o editor as põe ao escolher o estilo; depois o
// jogador troca à vontade). Mesma folha de f1-capacetes.js: 512x256 em volta da cabeça, a frente em x = 384, as costas em 128, os lados em
// 0/512 e 256, y da coroa (0) ao queixo (256); a viseira ocupa y 98 a 127 em x = 384 ± 94.
// `cores`: [casco, segunda cor, terceira cor].

// sorteio fixo por estilo: o mesmo desenho sempre (e igual no servidor e em todo navegador)
const sorteio = (s) => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
const LADOS = [0, 256, 512];
// uma fita que nasce no queixo, sobe pelo lado e morre na nuca (cx = 0/512 ou 256; d aponta para as costas)
function fita(x, cx, cor, topo = 70, larg = 50, sobe = 0) {
  const d = cx === 256 ? -1 : 1, X = (v) => cx + d * v;
  x.fillStyle = cor; x.beginPath();
  x.moveTo(X(-128), 236 - sobe); x.bezierCurveTo(X(-60), 210 - sobe, X(40), 160 - sobe, X(132), topo);
  x.bezierCurveTo(X(136), topo + larg, X(70), topo + larg + 60, X(-10), 210 + larg * 0.4 - sobe); x.bezierCurveTo(X(-70), 236 - sobe, X(-110), 250 - sobe, X(-128), 236 - sobe); x.closePath(); x.fill();
}
function linhaLado(x, cx, cor, lw, topo = 70, sobe = 0) {
  const d = cx === 256 ? -1 : 1, X = (v) => cx + d * v;
  x.strokeStyle = cor; x.lineWidth = lw; x.lineCap = "round"; x.beginPath(); x.moveTo(X(-128), 236 - sobe); x.bezierCurveTo(X(-60), 210 - sobe, X(40), 160 - sobe, X(132), topo); x.stroke();
}
// um estilhaço: um paralelogramo inclinado (os cortes do Moderno, do Split e do Tech)
function caco(x, cor, cx, cy, w, h, incl) { x.fillStyle = cor; x.beginPath(); x.moveTo(cx - w / 2 + incl, cy - h / 2); x.lineTo(cx + w / 2 + incl, cy - h / 2); x.lineTo(cx + w / 2 - incl, cy + h / 2); x.lineTo(cx - w / 2 - incl, cy + h / 2); x.closePath(); x.fill(); }
const faixaH = (x, cor, y, h) => { x.fillStyle = cor; x.fillRect(0, y, 512, h); };

export const ESTILOS = {
  // Moderno: roxo, a coroa preta e cortes pontudos rosa, roxo e preto pelos lados
  e_moderno: { nome: "Moderno", cores: ["#5b2bd8", "#ff2fa6", "#101114"], viseira: "#090b10", pintar(x, [c1, c2, c3]) {
    faixaH(x, c3, 0, 58); const r = sorteio(11);
    for (let i = 0; i < 26; i++) caco(x, i % 3 === 0 ? c3 : i % 3 === 1 ? c2 : "#8f4dff", r() * 512, 60 + r() * 190, 22 + r() * 46, 14 + r() * 40, 10 + r() * 16);
    caco(x, c2, 384, 60, 200, 10, 0);
  } },
  // Clássico: branco com o vermelho em gotas pelos lados e filetes pretos
  e_classico: { nome: "Clássico", cores: ["#f4f4f4", "#d8142c", "#101114"], viseira: "#090b10", pintar(x, [c1, c2, c3]) {
    for (const cx of LADOS) { fita(x, cx, c2, 66, 40); linhaLado(x, cx, c3, 4, 62, -14); linhaLado(x, cx, c2, 3, 58, -26); }
    faixaH(x, c2, 232, 24);
  } },
  // Monocromático: preto inteiro, uma faixa grafite sutil no alto
  e_mono: { nome: "Monocromático", cores: ["#141518", "#2b2d33", "#3c3f46"], viseira: "#090b10", pintar(x, [c1, c2, c3]) {
    faixaH(x, c2, 40, 14); faixaH(x, c3, 54, 3);
    for (const cx of LADOS) linhaLado(x, cx, c2, 6, 70);
  } },
  // Racing Stripes: branco, duas faixas do bico à nuca por cima, o azul embaixo e o vermelho entre os dois
  e_racing: { nome: "Racing Stripes", cores: ["#f4f4f4", "#1d3fa8", "#d8142c"], viseira: "#090b10", pintar(x, [c1, c2, c3]) {
    faixaH(x, c2, 170, 86); faixaH(x, c3, 154, 14);
    for (const [cx, ate] of [[384, 96], [128, 170]]) for (const dx of [-26, 14]) { x.fillStyle = c2; x.fillRect(cx + dx, 0, 12, ate); x.fillStyle = c3; x.fillRect(cx + dx + 12, 0, 5, ate); }
    for (const cx of LADOS) fita(x, cx, c3, 90, 18, -20);
  } },
  // Geométrico: preto com linhas neon em zigue-zague por todo o casco
  e_geometrico: { nome: "Geométrico", cores: ["#101114", "#c6ff1a", "#5f7400"], viseira: "#090b10", pintar(x, [c1, c2, c3]) {
    const r = sorteio(23); x.lineJoin = "miter";
    for (let k = 0; k < 14; k++) {
      x.strokeStyle = k % 3 ? c2 : c3; x.lineWidth = k % 3 ? 5 : 9; x.beginPath(); let px = r() * 512, py = r() * 256; x.moveTo(px, py);
      for (let s = 0; s < 5; s++) { px += (r() - 0.5) * 150; py += (r() - 0.5) * 110; x.lineTo(px, py); } x.stroke();
    }
  } },
  // Galáxia: azul-marinho com nuvens azuis e roxas, estrelas e um risco branco
  e_galaxia: { nome: "Galáxia", cores: ["#0a1238", "#3a5bd9", "#ffffff"], viseira: "#1e6fd9", pintar(x, [c1, c2, c3]) {
    const r = sorteio(37);
    for (let i = 0; i < 14; i++) { const cx = r() * 512, cy = r() * 256, rad = 30 + r() * 70, g = x.createRadialGradient(cx, cy, 0, cx, cy, rad); g.addColorStop(0, i % 3 ? c2 + "aa" : "#8a3ad9aa"); g.addColorStop(1, c2 + "00"); x.fillStyle = g; x.fillRect(cx - rad, cy - rad, rad * 2, rad * 2); }
    x.fillStyle = c3; for (let i = 0; i < 260; i++) { const s = r() < 0.9 ? 1 : 2.4; x.globalAlpha = 0.4 + r() * 0.6; x.fillRect(r() * 512, r() * 256, s, s); } x.globalAlpha = 1;
    for (const cx of LADOS) linhaLado(x, cx, c3, 3, 74, 6);
  } },
  // Neon: preto com rastros rosa e verde-água subindo pelos lados
  e_neon: { nome: "Neon", cores: ["#101114", "#ff2f7d", "#19d3c5"], viseira: "#090b10", pintar(x, [c1, c2, c3]) {
    for (const cx of LADOS) { fita(x, cx, c2, 62, 30, 6); fita(x, cx, c3, 96, 16, -22); linhaLado(x, cx, c2, 3, 50, 30); linhaLado(x, cx, c3, 2, 44, 44); }
  } },
  // Vintage: creme, o vermelho embaixo, filete preto e o círculo do número nos lados
  e_vintage: { nome: "Vintage", cores: ["#efe6d2", "#c8202a", "#101114"], viseira: "#c9ccd2", pintar(x, [c1, c2, c3]) {
    faixaH(x, c2, 176, 80); faixaH(x, c3, 170, 5); faixaH(x, c2, 150, 8);
    for (const cx of [256, 0, 512]) { x.fillStyle = "#fbfaf6"; x.beginPath(); x.arc(cx, 140, 34, 0, Math.PI * 2); x.fill(); x.strokeStyle = c3; x.lineWidth = 4; x.stroke(); }
  } },
  // Camuflado: cinzas em manchas
  e_camuflado: { nome: "Camuflado", cores: ["#3b3d40", "#7a7d82", "#c3c6cb"], viseira: "#090b10", pintar(x, [c1, c2, c3]) {
    const r = sorteio(53);
    for (let i = 0; i < 70; i++) {
      x.fillStyle = i % 3 === 0 ? c3 : i % 3 === 1 ? c2 : "#1c1d20"; x.beginPath(); const cx = r() * 512, cy = r() * 256, n = 7;
      for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2, rad = 10 + r() * 22; x[k ? "lineTo" : "moveTo"](cx + Math.cos(a) * rad * 1.5, cy + Math.sin(a) * rad); } x.closePath(); x.fill();
    }
  } },
  // Flame: preto com as chamas vermelhas e amarelas subindo do queixo
  e_flame: { nome: "Flame", cores: ["#101114", "#e3261b", "#ffb000"], viseira: "#090b10", pintar(x, [c1, c2, c3]) {
    const r = sorteio(71);
    for (const [cor, alt, esp] of [[c2, 150, 0], [c3, 95, 8]]) {
      x.fillStyle = cor; x.beginPath(); x.moveTo(0, 256);
      for (let px = 0; px <= 512; px += 32) { const topo = 256 - alt * (0.55 + r() * 0.45); x.quadraticCurveTo(px + 6 + esp, 256 - alt * 0.3, px + 16, topo); x.quadraticCurveTo(px + 20, 256 - alt * 0.35, px + 32, 256 - alt * 0.15); }
      x.lineTo(512, 256); x.closePath(); x.fill();
    }
  } },
  // Gradiente: o azul do alto vira verde-água embaixo, com um risco branco
  e_gradiente: { nome: "Gradiente", cores: ["#1440c9", "#19d3c5", "#ffffff"], viseira: "#090b10", pintar(x, [c1, c2, c3]) {
    const g = x.createLinearGradient(0, 30, 0, 230); g.addColorStop(0, c1); g.addColorStop(1, c2); x.fillStyle = g; x.fillRect(0, 0, 512, 256);
    for (const cx of LADOS) linhaLado(x, cx, c3, 5, 70);
  } },
  // Minimalista: branco com dois riscos pretos finos
  e_minimalista: { nome: "Minimalista", cores: ["#f4f4f4", "#101114", "#9aa0a8"], viseira: "#090b10", pintar(x, [c1, c2, c3]) {
    for (const cx of LADOS) { linhaLado(x, cx, c2, 5, 70); linhaLado(x, cx, c3, 3, 66, -16); }
  } },
  // Retrô: branco, faixas azuis largas em volta e o vermelho entre elas
  e_retro: { nome: "Retrô", cores: ["#f4f4f4", "#1d63d8", "#d8142c"], viseira: "#090b10", pintar(x, [c1, c2, c3]) {
    faixaH(x, c2, 0, 44); faixaH(x, c3, 44, 10); faixaH(x, c2, 196, 60); faixaH(x, c3, 186, 10);
    for (const cx of LADOS) fita(x, cx, c2, 80, 24, -10);
  } },
  // Carbono: a trama da fibra à mostra (desenhada aqui) e filetes vermelhos
  e_carbono: { nome: "Carbono", cores: ["#1a1b1e", "#2e3034", "#c8202a"], viseira: "#090b10", pintar(x, [c1, c2, c3]) {
    for (let yy = 0; yy < 256; yy += 8) for (let xx = 0; xx < 512; xx += 8) { x.fillStyle = ((xx + yy) / 8) % 2 ? c2 : c1; x.fillRect(xx, yy, 8, 4); x.fillStyle = ((xx + yy) / 8) % 2 ? c1 : c2; x.fillRect(xx, yy + 4, 8, 4); }
    for (const cx of LADOS) { linhaLado(x, cx, c3, 3, 70); linhaLado(x, cx, c3, 2, 60, -18); }
  } },
  // Split: metade branca e metade roxa num corte diagonal, com o preto na emenda
  e_split: { nome: "Split", cores: ["#f4f4f4", "#6a2fd6", "#101114"], viseira: "#090b10", pintar(x, [c1, c2, c3]) {
    x.fillStyle = c2; x.beginPath(); x.moveTo(0, 256); x.lineTo(0, 150); x.lineTo(128, 60); x.lineTo(256, 150); x.lineTo(384, 210); x.lineTo(512, 150); x.lineTo(512, 256); x.closePath(); x.fill();
    x.strokeStyle = c3; x.lineWidth = 10; x.beginPath(); x.moveTo(0, 150); x.lineTo(128, 60); x.lineTo(256, 150); x.lineTo(384, 210); x.lineTo(512, 150); x.stroke();
    const r = sorteio(91); for (let i = 0; i < 8; i++) caco(x, i % 2 ? c3 : c2, r() * 512, 40 + r() * 100, 30, 12, 10);
  } },
  // Tech: preto com blocos angulosos verde-neon nos lados e filetes brancos
  e_tech: { nome: "Tech", cores: ["#101114", "#c6ff1a", "#f4f4f4"], viseira: "#090b10", pintar(x, [c1, c2, c3]) {
    for (const cx of LADOS) { fita(x, cx, c2, 64, 46); linhaLado(x, cx, c3, 3, 54, 26); }
    const r = sorteio(97); for (let i = 0; i < 10; i++) caco(x, c2, r() * 512, 160 + r() * 90, 26, 10, 8);
    faixaH(x, c2, 0, 10);
  } },
};

// ---------- os capacetes dos 22 pilotos do grid (2026-11-25, o Thiago: "caprichar nos capacetes novos: alguns têm logo da equipe e livery
// únicos; tem que ficar praticamente igual"). Pela folha de pixel art que ele mandou (public/corrida/pilotos-pixel/capacete/): as cores e o jeito
// de cada um, por família de equipe, e `marcas` (os logos fixos): `logo` (o logo da equipe, imagem; na testa), `nome` (o texto da faixa acima do
// visor) e `patrocinios` (marcas de MARCAS_CAPACETE por lugar). pintarFolha (f1-capacetes.js) aplica as marcas quando o capacete não traz as
// suas: assim os robôs na pista e o padrão do editor saem iguais. ----------
const frenteV = (x, cor, w, ate = 98) => { x.fillStyle = cor; x.fillRect(384 - w / 2, 0, w, ate); };
// as famílias: cada uma desenha o jeito da equipe com as 3 cores do piloto (e `v`, a variação do companheiro)
const FAMILIAS = {
  // McLaren: o casco na cor (papaia ou neon), a coroa escura com cortes, a fita escura pelos lados e um fio na cor 3
  mclaren(x, [c1, c2, c3], v) {
    faixaH(x, c2, 0, 30); const r = sorteio(31 + v);
    for (let i = 0; i < 14; i++) caco(x, c2, r() * 512, 30 + r() * 26, 40 + r() * 40, 10, 12);
    for (const cx of LADOS) { fita(x, cx, c2, 70, 40); linhaLado(x, cx, c3, 3, 62, 20); }
    faixaH(x, c2, 200, 56);
  },
  // Ferrari (Leclerc): vermelho com os blocos brancos na coroa e uma faixa preta fina; (Hamilton): o vermelho com cortes no vermelho escuro
  ferrari(x, [c1, c2, c3], v) {
    if (v === 0) { for (let i = 0; i < 8; i++) { x.fillStyle = c2; x.fillRect(16 + i * 64, 18 + (i % 2) * 14, 34, 22); } frenteV(x, c2, 30, 60); faixaH(x, c3, 60, 4); for (const cx of LADOS) linhaLado(x, cx, c2, 6, 70, 16); }
    else { const r = sorteio(47); for (let i = 0; i < 22; i++) caco(x, i % 3 ? c2 : c3, r() * 512, 10 + r() * 230, 30 + r() * 50, 8 + r() * 18, 14); faixaH(x, c2, 0, 22); }
    faixaH(x, c3, 210, 4);
  },
  // Mercedes: a coroa na cor 2 descendo em ponta até a testa, o queixo na cor 2 e as linhas na cor 3
  mercedes(x, [c1, c2, c3], v) {
    faixaH(x, c2, 0, 44); x.fillStyle = c2; for (const cx of [384, 128]) { x.beginPath(); x.moveTo(cx - 70, 44); x.lineTo(cx + 70, 44); x.lineTo(cx, 80 + v * 8); x.closePath(); x.fill(); }
    faixaH(x, c2, 176, 80); for (const cx of LADOS) linhaLado(x, cx, c3, 4, 58, 26);
  },
  // Red Bull: a coroa na cor 2, o queixo na cor 3 e as faixas diagonais pelos lados
  redbull(x, [c1, c2, c3], v) {
    faixaH(x, c2, 0, 40 + v * 6); for (const cx of LADOS) { fita(x, cx, c2, 60, 34); fita(x, cx, c3, 92, 18, 10); }
    faixaH(x, c3, 196, 60); const r = sorteio(53 + v); for (let i = 0; i < 6; i++) caco(x, c3, r() * 512, 12 + r() * 24, 36, 8, 10);
  },
  // Aston Martin: o verde com a parte de baixo na cor 2 subindo pelos lados como uma onda, e um fio na cor 3
  aston(x, [c1, c2, c3], v) {
    for (const cx of LADOS) { fita(x, cx, c2, 120 + v * 10, 70, 0); linhaLado(x, cx, c3, 3, 110 + v * 10, 0); }
    faixaH(x, c2, 206, 50); faixaH(x, c3, 0, 6);
  },
  // Williams: o casco com o topo na cor 2 em ponta e as setas (chevrons) pelos lados
  williams(x, [c1, c2, c3], v) {
    faixaH(x, c2, 0, 36); x.fillStyle = c2; x.beginPath(); x.moveTo(300, 36); x.lineTo(468, 36); x.lineTo(384, 70); x.closePath(); x.fill();
    for (const cx of LADOS) for (let k = 0; k < 3; k++) { x.strokeStyle = k === 1 ? c3 : c2; x.lineWidth = 7; x.beginPath(); const d = cx === 256 ? -1 : 1; x.moveTo(cx + d * (-60 + k * 22), 130); x.lineTo(cx + d * (-20 + k * 22), 170); x.lineTo(cx + d * (-60 + k * 22), 210); x.stroke(); }
    faixaH(x, v ? c3 : c2, 214, 42);
  },
  // Sauber/Audi (o K verde da folha): o preto com as fitas verdes pelos lados e o queixo na cor 3
  kick(x, [c1, c2, c3], v) {
    for (const cx of LADOS) { fita(x, cx, c2, 64 + v * 6, 30); linhaLado(x, cx, c2, 4, 40, 40); }
    faixaH(x, c2, 0, 8); faixaH(x, c3, 198, 58);
  },
  // Alpine: o azul com os cortes na cor 2 (rosa ou azul-claro) e a coroa na cor 3
  alpine(x, [c1, c2, c3], v) {
    faixaH(x, c3, 0, 26); const r = sorteio(61 + v);
    for (let i = 0; i < 18; i++) caco(x, i % 2 ? c2 : c3, r() * 512, 40 + r() * 200, 40 + r() * 46, 8 + r() * 10, 18);
    for (const cx of LADOS) fita(x, cx, c2, 96, 24, 20);
  },
  // Haas: o branco com os cortes vermelhos pelos lados e na coroa, e o preto embaixo
  haas(x, [c1, c2, c3], v) {
    const r = sorteio(71 + v); for (let i = 0; i < 16; i++) caco(x, c2, r() * 512, 12 + r() * 60, 30 + r() * 40, 8, 16);
    for (const cx of LADOS) { fita(x, cx, c2, 80 + v * 10, 36); linhaLado(x, cx, c3, 3, 70, 30); }
    faixaH(x, c3, 220, 36);
  },
  // Cadillac: o casco com os cortes na cor 2 (dourado ou branco) e os fios na cor 3
  cadillac(x, [c1, c2, c3], v) {
    const r = sorteio(83 + v); for (let i = 0; i < 20; i++) caco(x, i % 4 ? c2 : c3, r() * 512, 8 + r() * 240, 24 + r() * 44, 6 + r() * 10, 12);
    for (const cx of LADOS) linhaLado(x, cx, c3, 3, 66, 24);
    faixaH(x, c2, 0, 14);
  },
};
const P = (nome, fam, v, cores, viseira, marcas) => ({ nome, cores, viseira, marcas, pintar: (x, c) => FAMILIAS[fam](x, c, v) });
export const ESTILOS_PILOTOS = {
  p_NOR: P("Norris", "mclaren", 0, ["#c4f31a", "#101114", "#ff8000"], "#0b0d12", { logo: "mclaren", nome: "McLaren", patrocinios: { lados: "gemini", nuca: "dropbox" } }),
  p_PIA: P("Piastri", "mclaren", 1, ["#ff8000", "#101114", "#f4f4f4"], "#0b0d12", { logo: "mclaren", nome: "McLaren", patrocinios: { lados: "gemini", nuca: "dropbox" } }),
  p_LEC: P("Leclerc", "ferrari", 0, ["#e10600", "#f4f4f4", "#101114"], "#0b0d12", { logo: "ferrari", patrocinios: { faixa: "hp", lados: "shell", nuca: "ibm" } }),
  p_HAM: P("Hamilton", "ferrari", 1, ["#c8102e", "#8a0a1a", "#f4d22c"], "#0b0d12", { logo: "ferrari", patrocinios: { faixa: "hp", lados: "shell", nuca: "unicredit" } }),
  p_RUS: P("Russell", "mercedes", 0, ["#6fc6f0", "#101114", "#f4f4f4"], "#0b0d12", { nome: "PETRONAS", patrocinios: { testa: "estrela", lados: "crowdstrike", nuca: "tmobile" } }),
  p_ANT: P("Antonelli", "mercedes", 1, ["#101114", "#00a19b", "#c8ccd2"], "#0b0d12", { nome: "PETRONAS", patrocinios: { testa: "estrela", lados: "crowdstrike", nuca: "tmobile" } }),
  p_VER: P("Verstappen", "redbull", 0, ["#1e2a5a", "#16204a", "#d3202a"], "#0b0d12", { nome: "Red Bull", patrocinios: { testa: "redbull", lados: "oracle", nuca: "mobil1" } }),
  p_HAD: P("Hadjar", "redbull", 1, ["#f4f4f4", "#1e3d96", "#d3202a"], "#0b0d12", { nome: "Red Bull", patrocinios: { testa: "redbull", lados: "oracle", nuca: "mobil1" } }),
  p_LAW: P("Lawson", "redbull", 2, ["#f4f4f4", "#1e3d96", "#d3202a"], "#0b0d12", { logo: "racing-bulls", patrocinios: { lados: "visa", nuca: "cashapp" } }),
  p_LIN: P("Lindblad", "redbull", 1, ["#1e2a5a", "#16204a", "#e6f01a"], "#0b0d12", { logo: "racing-bulls", patrocinios: { lados: "visa", nuca: "cashapp" } }),
  p_ALO: P("Alonso", "aston", 0, ["#0b4f45", "#e6f01a", "#101114"], "#0b0d12", { logo: "aston-martin", patrocinios: { faixa: "aramco", lados: "aramco", nuca: "valvoline" } }),
  p_STR: P("Stroll", "aston", 1, ["#0b5d4a", "#229971", "#f4f4f4"], "#0b0d12", { logo: "aston-martin", patrocinios: { faixa: "aramco", lados: "aramco", nuca: "valvoline" } }),
  p_ALB: P("Albon", "williams", 0, ["#f4f4f4", "#1868db", "#0a1b3d"], "#0b0d12", { nome: "WILLIAMS", patrocinios: { testa: "williamsw", lados: "atlassiana", nuca: "kraken" } }),
  p_SAI: P("Sainz", "williams", 1, ["#0a1b3d", "#1868db", "#d3202a"], "#0b0d12", { nome: "WILLIAMS", patrocinios: { testa: "williamsw", lados: "atlassiana", nuca: "santander" } }),
  p_HUL: P("Hülkenberg", "kick", 0, ["#101114", "#3cd23c", "#d3202a"], "#0b0d12", { patrocinios: { testa: "kick", lados: "revolutr", nuca: "stake" } }),
  p_BOR: P("Bortoleto", "kick", 1, ["#101114", "#7dff2e", "#d3202a"], "#0b0d12", { patrocinios: { testa: "kick", lados: "revolutr", nuca: "stake" } }),
  p_GAS: P("Gasly", "alpine", 0, ["#1f56d8", "#ff8fc2", "#0a1b3d"], "#0b0d12", { nome: "ALPINE", patrocinios: { testa: "alpine", lados: "castrol" } }),
  p_COL: P("Colapinto", "alpine", 1, ["#0a1b3d", "#5fb8f0", "#f4f4f4"], "#0b0d12", { nome: "ALPINE", patrocinios: { testa: "alpine", lados: "castrol" } }),
  p_CAM: P("Câmara", "haas", 0, ["#f4f4f4", "#d3202a", "#101114"], "#0b0d12", { nome: "HAAS", patrocinios: { testa: "haas", lados: "moneygram", nuca: "tmobile" } }),
  p_BEA: P("Bearman", "haas", 1, ["#f4f4f4", "#d3202a", "#101114"], "#0b0d12", { nome: "HAAS", patrocinios: { testa: "haas", lados: "moneygram", nuca: "tmobile" } }),
  p_PER: P("Pérez", "cadillac", 0, ["#101114", "#f4f4f4", "#c9a227"], "#0b0d12", { nome: "CADILLAC", patrocinios: { testa: "brasao", lados: "tmobile", nuca: "jimbeam" } }),
  p_BOT: P("Bottas", "cadillac", 1, ["#f4f4f4", "#c9a227", "#101114"], "#0b0d12", { nome: "CADILLAC", patrocinios: { testa: "brasao", lados: "tmobile", nuca: "jimbeam" } }),
};
