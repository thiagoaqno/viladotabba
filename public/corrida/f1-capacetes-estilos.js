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
