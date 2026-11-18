// (2026-11-18, o Thiago, com a imagem do "Track Editor / Wall finishes": "uma variedade maior de texturas e eu possa atribuir diferentes
// texturas para as construções existentes e também materiais") os ACABAMENTOS: texturas feitas em código (canvas, sem baixar nada) com o
// material de cada uma (rugosidade, metal). Um item do cenário ou uma peça da pista guarda { acab: { id, cor?, rug?, met?, rep?, alvo? } }:
//   id = a textura (ACABAMENTOS), cor = tinge, rug/met = o material, rep = o tamanho do desenho (1 = o padrão, 2 = o dobro de repetições),
//   alvo = qual material da peça trocar (a ordem em materiaisDe; sem alvo, todos menos vidro e luz).
// As coordenadas da textura saem da posição (projeção pela face: x/z nas paredes, x/z em cima), em metros: não precisam do UV do modelo.
import * as THREE from "three";

const T = 512; // (o lado da textura)
const rnd0 = (s) => () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
function ruido(c, r, n, a, cores) { for (let i = 0; i < n; i++) { c.fillStyle = cores[(r() * cores.length) | 0]; c.globalAlpha = a * (0.4 + r() * 0.6); const s = 1 + r() * 3; c.fillRect(r() * T, r() * T, s, s); } c.globalAlpha = 1; }
function fundo(c, cor) { c.fillStyle = cor; c.fillRect(0, 0, T, T); }
function blocos(c, r, { lin, col, cores, junta, jc, desloc = 0.5, var: v = 0 }) {
  fundo(c, jc); const h = T / lin, w = T / col;
  for (let y = 0; y < lin; y++) for (let x = -1; x <= col; x++) {
    const ox = (y % 2) * desloc * w, ww = w * (1 + (r() - 0.5) * v);
    c.fillStyle = cores[(r() * cores.length) | 0]; c.fillRect(x * w + ox + junta / 2, y * h + junta / 2, ww - junta, h - junta);
  }
}
function listras(c, n, cores, vertical = true) { for (let i = 0; i < n; i++) { c.fillStyle = cores[i % cores.length]; if (vertical) c.fillRect((i * T) / n, 0, T / n + 1, T); else c.fillRect(0, (i * T) / n, T, T / n + 1); } }
// { nome, desc, m: o tamanho do desenho em metros, rug, met, gerar(c, r) }
export const ACABAMENTOS = {
  concreto: { nome: "Concreto liso", desc: "Muro de concreto aparente, o das barreiras de rua.", m: 3, rug: 0.85, gerar: (c, r) => { fundo(c, "#bdbab3"); ruido(c, r, 9000, 0.25, ["#a9a59d", "#cfccc5", "#9c988f"]); ruido(c, r, 300, 0.5, ["#7f7b74"]); } },
  concretoClaro: { nome: "Concreto claro", desc: "Concreto novo, quase branco.", m: 3, rug: 0.8, gerar: (c, r) => { fundo(c, "#dcdad5"); ruido(c, r, 7000, 0.2, ["#cfccc6", "#ebe9e4"]); } },
  concretoRugoso: { nome: "Concreto rugoso", desc: "Concreto chapiscado, áspero.", m: 2, rug: 0.95, gerar: (c, r) => { fundo(c, "#a9a6a0"); ruido(c, r, 26000, 0.45, ["#8d8a84", "#c3c0ba", "#77746e"]); } },
  concretoPlacas: { nome: "Concreto em placas", desc: "Painéis de concreto pré-moldado com juntas.", m: 4, rug: 0.85, gerar: (c, r) => { blocos(c, r, { lin: 2, col: 2, cores: ["#b7b4ad", "#aeaba4", "#c0bdb6"], junta: 4, jc: "#6f6c66", desloc: 0 }); ruido(c, r, 6000, 0.2, ["#9a968f", "#cbc8c1"]); } },
  concretoEscuro: { nome: "Concreto escuro", desc: "Concreto velho, manchado de chuva.", m: 3, rug: 0.95, gerar: (c, r) => { fundo(c, "#77756f"); ruido(c, r, 12000, 0.35, ["#5e5c57", "#8b8983"]); for (let i = 0; i < 25; i++) { c.fillStyle = "rgba(40,40,38,.12)"; c.fillRect(r() * T, 0, 4 + r() * 20, T * (0.3 + r() * 0.7)); } } },
  reboco: { nome: "Reboco branco", desc: "Parede rebocada e pintada.", m: 2, rug: 0.9, gerar: (c, r) => { fundo(c, "#efece6"); ruido(c, r, 15000, 0.12, ["#ddd9d2", "#ffffff"]); } },
  rebocoTerracota: { nome: "Reboco terracota", desc: "Reboco pintado em tom de barro, mediterrâneo.", m: 2, rug: 0.9, gerar: (c, r) => { fundo(c, "#c97c62"); ruido(c, r, 15000, 0.18, ["#b56c53", "#d98e74"]); } },
  rebocoAreia: { nome: "Reboco areia", desc: "Bege de prédio antigo do Mediterrâneo.", m: 2, rug: 0.9, gerar: (c, r) => { fundo(c, "#e6cfa6"); ruido(c, r, 15000, 0.15, ["#d6bd92", "#f0dcb6"]); } },
  pedra: { nome: "Pedra em blocos", desc: "Blocos de pedra calcária, cantaria.", m: 3, rug: 0.9, gerar: (c, r) => { blocos(c, r, { lin: 5, col: 3, cores: ["#d2bf9c", "#c4ae88", "#ddcbaa", "#b9a27c"], junta: 5, jc: "#8f8169", var: 0.3 }); ruido(c, r, 8000, 0.2, ["#a8956f", "#e6d7bb"]); } },
  pedraRustica: { nome: "Pedra rústica", desc: "Pedra irregular, muro antigo.", m: 2.5, rug: 0.95, gerar: (c, r) => { fundo(c, "#5e5143"); for (let i = 0; i < 70; i++) { c.fillStyle = ["#9b8467", "#8a7358", "#a89275", "#7d6a52"][(r() * 4) | 0]; c.beginPath(); const x = r() * T, y = r() * T, s = 30 + r() * 45; for (let j = 0; j < 7; j++) { const g = (j / 7) * Math.PI * 2; c.lineTo(x + Math.cos(g) * s * (0.7 + r() * 0.4), y + Math.sin(g) * s * 0.6 * (0.7 + r() * 0.4)); } c.fill(); } ruido(c, r, 8000, 0.25, ["#4e4337", "#b8a385"]); } },
  tijolo: { nome: "Tijolo vermelho", desc: "Tijolo aparente com rejunte claro.", m: 1.5, rug: 0.9, gerar: (c, r) => { blocos(c, r, { lin: 12, col: 4, cores: ["#9c4a32", "#a9553a", "#8c3f2a", "#b0603f"], junta: 5, jc: "#cfc6b8" }); ruido(c, r, 8000, 0.2, ["#6f2f1f", "#c27552"]); } },
  tijoloBranco: { nome: "Tijolo branco", desc: "Tijolo pintado de branco.", m: 1.5, rug: 0.85, gerar: (c, r) => { blocos(c, r, { lin: 12, col: 4, cores: ["#f1f0ec", "#e8e6e1", "#f7f6f2"], junta: 5, jc: "#b9b6af" }); ruido(c, r, 5000, 0.12, ["#d6d3cc"]); } },
  tijoloMarrom: { nome: "Tijolo marrom", desc: "Tijolinho escuro, galpão industrial.", m: 1.5, rug: 0.9, gerar: (c, r) => { blocos(c, r, { lin: 12, col: 4, cores: ["#6b4a33", "#5a3d2a", "#7a563b", "#4f3627"], junta: 4, jc: "#3a332c" }); ruido(c, r, 6000, 0.2, ["#8b6a4f"]); } },
  granito: { nome: "Granito", desc: "Granito cinza polido.", m: 1.5, rug: 0.35, gerar: (c, r) => { fundo(c, "#8c8c8c"); ruido(c, r, 30000, 0.6, ["#2b2b2b", "#d8d8d8", "#6a6a6a", "#b0a69c"]); } },
  marmore: { nome: "Mármore", desc: "Mármore branco com veios.", m: 2, rug: 0.25, gerar: (c, r) => { fundo(c, "#eeece8"); for (let i = 0; i < 14; i++) { c.strokeStyle = `rgba(120,118,115,${0.15 + r() * 0.3})`; c.lineWidth = 0.5 + r() * 2; c.beginPath(); let x = r() * T, y = 0; c.moveTo(x, y); while (y < T) { x += (r() - 0.5) * 40; y += 10 + r() * 20; c.lineTo(x, y); } c.stroke(); } } },
  ardosia: { nome: "Ardósia", desc: "Pedra escura em placas.", m: 2, rug: 0.7, gerar: (c, r) => { blocos(c, r, { lin: 4, col: 4, cores: ["#3d4044", "#45484d", "#363a3e", "#4c5055"], junta: 3, jc: "#1f2124", desloc: 0 }); ruido(c, r, 9000, 0.25, ["#2c2e31", "#5c6066"]); } },
  azulejo: { nome: "Azulejo branco", desc: "Azulejo quadrado, boxes e banheiros.", m: 1.2, rug: 0.2, gerar: (c, r) => { blocos(c, r, { lin: 8, col: 8, cores: ["#f4f5f6", "#eceeef"], junta: 3, jc: "#b8bcc0", desloc: 0 }); } },
  pastilha: { nome: "Pastilha azul", desc: "Pastilhas de vidro, piscinas e fachadas.", m: 0.8, rug: 0.25, gerar: (c, r) => { blocos(c, r, { lin: 16, col: 16, cores: ["#2d7fb8", "#3a8fc7", "#2470a6", "#4aa0d6"], junta: 3, jc: "#d9e2e8", desloc: 0 }); } },
  madeira: { nome: "Madeira", desc: "Tábuas de madeira na vertical.", m: 2, rug: 0.75, gerar: (c, r) => { listras(c, 8, ["#8a5a33", "#7a4f2c", "#94643b", "#6f4727"]); for (let i = 0; i < 400; i++) { c.strokeStyle = "rgba(60,35,18,.2)"; c.beginPath(); const x = r() * T; c.moveTo(x, r() * T); c.lineTo(x + (r() - 0.5) * 6, r() * T); c.stroke(); } for (let i = 1; i < 8; i++) { c.fillStyle = "#3a2414"; c.fillRect((i * T) / 8 - 1, 0, 2, T); } } },
  madeiraClara: { nome: "Madeira clara", desc: "Ripado claro, deck e varandas.", m: 2, rug: 0.7, gerar: (c, r) => { listras(c, 12, ["#c99d6b", "#d6ab79", "#bf9360"]); for (let i = 0; i < 300; i++) { c.strokeStyle = "rgba(120,80,40,.18)"; c.beginPath(); const x = r() * T; c.moveTo(x, r() * T); c.lineTo(x + (r() - 0.5) * 4, r() * T); c.stroke(); } for (let i = 1; i < 12; i++) { c.fillStyle = "#6e4b2a"; c.fillRect((i * T) / 12 - 1, 0, 2, T); } } },
  metal: { nome: "Metal escovado", desc: "Aço inox escovado.", m: 1.5, rug: 0.35, met: 0.9, gerar: (c, r) => { fundo(c, "#b9bcc0"); for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(${r() < 0.5 ? "255,255,255" : "70,70,75"},${0.05 + r() * 0.08})`; c.fillRect(0, r() * T, T, 1); } } },
  chapaOndulada: { nome: "Chapa ondulada", desc: "Telha/chapa metálica ondulada, galpões.", m: 2, rug: 0.45, met: 0.7, gerar: (c) => { const g = c.createLinearGradient(0, 0, T / 16, 0); g.addColorStop(0, "#8e959c"); g.addColorStop(0.5, "#d1d6db"); g.addColorStop(1, "#8e959c"); c.fillStyle = g; for (let i = 0; i < 16; i++) { c.save(); c.translate((i * T) / 16, 0); c.fillRect(0, 0, T / 16, T); c.restore(); } } },
  chapaPintada: { nome: "Chapa pintada", desc: "Painel metálico liso pintado (ACM), fachada moderna.", m: 3, rug: 0.4, met: 0.4, gerar: (c, r) => { blocos(c, r, { lin: 3, col: 2, cores: ["#e9ebee", "#e3e5e8"], junta: 4, jc: "#5c6168", desloc: 0 }); } },
  vidro: { nome: "Vidro espelhado", desc: "Pele de vidro azulada com caixilhos.", m: 3, rug: 0.08, met: 0.8, gerar: (c, r) => { const g = c.createLinearGradient(0, 0, T, T); g.addColorStop(0, "#5f86a8"); g.addColorStop(1, "#2d4a66"); c.fillStyle = g; c.fillRect(0, 0, T, T); c.fillStyle = "#1c232b"; for (let i = 0; i <= 3; i++) { c.fillRect((i * T) / 3 - 4, 0, 8, T); c.fillRect(0, (i * T) / 3 - 4, T, 8); } } },
  telha: { nome: "Telha cerâmica", desc: "Telhado de telha colonial.", m: 2, rug: 0.85, gerar: (c, r) => { for (let y = 0; y < 10; y++) for (let x = 0; x < 10; x++) { const g = c.createLinearGradient(x * 51.2, 0, x * 51.2 + 51.2, 0); const b = ["#b5552f", "#a84c29", "#c2623a"][(r() * 3) | 0]; g.addColorStop(0, "#6e2e17"); g.addColorStop(0.5, b); g.addColorStop(1, "#6e2e17"); c.fillStyle = g; c.fillRect(x * 51.2, y * 51.2, 51.2, 51.2); } } },
  asfalto: { nome: "Asfalto", desc: "Asfalto de rua.", m: 2, rug: 0.95, gerar: (c, r) => { fundo(c, "#3b3c3e"); ruido(c, r, 30000, 0.5, ["#2a2b2c", "#55575a", "#6b6c6e"]); } },
  grafite: { nome: "Pintura lisa", desc: "Só a cor, sem desenho (escolha a cor ao lado).", m: 2, rug: 0.6, gerar: (c) => fundo(c, "#ffffff") },
  listrado: { nome: "Listras vermelho e branco", desc: "Muro de pista listrado.", m: 2, rug: 0.7, gerar: (c) => listras(c, 4, ["#d22a24", "#f2f2f2"]) },
  grade: { nome: "Treliça", desc: "Grade de metal (estrutura de arquibancada).", m: 1, rug: 0.5, met: 0.7, gerar: (c) => { fundo(c, "#40444a"); c.strokeStyle = "#a9afb6"; c.lineWidth = 14; c.beginPath(); c.moveTo(0, 0); c.lineTo(T, T); c.moveTo(T, 0); c.lineTo(0, T); c.stroke(); c.lineWidth = 20; c.strokeRect(0, 0, T, T); } },
  hera: { nome: "Muro com hera", desc: "Parede coberta de folhagem.", m: 2, rug: 1, gerar: (c, r) => { fundo(c, "#2e4a22"); ruido(c, r, 20000, 0.8, ["#3d6a2c", "#4d7f36", "#27401c", "#5f9441", "#1e3316"]); } },
};
// as variações de cor da imagem de referência: quatro tons para tingir rápido
export const VARIANTES = ["#ffffff", "#c9c9c9", "#efe6d8", "#8a7a66"];

const texturas = new Map();
export function texturaDe(id) {
  if (!ACABAMENTOS[id]) return null;
  if (!texturas.has(id)) {
    const cv = document.createElement("canvas"); cv.width = cv.height = T; ACABAMENTOS[id].gerar(cv.getContext("2d"), rnd0(1 + id.length * 977));
    const tx = new THREE.CanvasTexture(cv); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8; texturas.set(id, tx);
  }
  return texturas.get(id);
}
const urls = new Map();
export function miniaturaDe(id) { if (!urls.has(id)) { const t = texturaDe(id); urls.set(id, t ? t.image.toDataURL("image/jpeg", 0.8) : ""); } return urls.get(id); }

// os materiais de uma peça, na ordem em que aparecem (o `alvo` aponta para um deles); vidro e luz ficam de fora do "todos"
export function materiaisDe(o) {
  const lista = []; o.traverse((m) => { if (m.isMesh) for (const mat of [].concat(m.userData.matOriginal || m.material)) if (!lista.includes(mat)) lista.push(mat); });
  return lista;
}
const pulavel = (mat) => mat.transparent || (mat.emissive && mat.emissive.getHex() && (mat.emissiveIntensity || 0) > 0.3);
const M_PARA_U = 4.8;
// as coordenadas de textura pela posição: cada triângulo usa o plano da face (a maior componente da normal), em metros vezes o tamanho do desenho
function uvProjetado(geo, escalaMundo, m) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone(), p = g.attributes.position, uv = new Float32Array(p.count * 2), a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
  const k = (sx) => sx / (M_PARA_U * m);
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2); n.subVectors(c, b).cross(a.clone().sub(b));
    const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z);
    for (let j = 0; j < 3; j++) {
      const v = [a, b, c][j];
      let u0, v0; if (ay >= ax && ay >= az) { u0 = v.x * k(escalaMundo.x); v0 = v.z * k(escalaMundo.z); } else if (ax >= az) { u0 = v.z * k(escalaMundo.z); v0 = v.y * k(escalaMundo.y); } else { u0 = v.x * k(escalaMundo.x); v0 = v.y * k(escalaMundo.y); }
      uv[(i + j) * 2] = u0; uv[(i + j) * 2 + 1] = v0;
    }
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); return g;
}
// põe (ou tira, com acab nulo) o acabamento numa peça ou item
export function aplicarAcabamento(o, acab) {
  if (!o) return;
  const mats = materiaisDe(o);
  o.updateMatrixWorld(true);
  o.traverse((m) => {
    if (!m.isMesh) return;
    if (m.userData.matOriginal) { m.material = m.userData.matOriginal; m.geometry = m.userData.geoOriginal; delete m.userData.matOriginal; delete m.userData.geoOriginal; }
    if (!acab || !ACABAMENTOS[acab.id]) return;
    const orig = m.material, lista = [].concat(orig);
    const troca = lista.map((mat) => (acab.alvo != null ? mats.indexOf(mat) === +acab.alvo : !pulavel(mat)));
    if (!troca.some(Boolean)) return;
    const A = ACABAMENTOS[acab.id], tx = texturaDe(acab.id).clone(); const rep = +acab.rep || 1; tx.repeat.set(rep, rep); tx.needsUpdate = true;
    const novo = new THREE.MeshStandardMaterial({ map: tx, color: acab.cor || "#ffffff", roughness: acab.rug ?? A.rug ?? 0.8, metalness: acab.met ?? A.met ?? 0, side: lista[0].side });
    const es = new THREE.Vector3(); m.getWorldScale(es); const esc = new THREE.Vector3(1, 1, 1).copy(es);
    m.userData.matOriginal = orig; m.userData.geoOriginal = m.geometry;
    m.geometry = uvProjetado(m.geometry, esc, A.m);
    m.material = Array.isArray(orig) ? lista.map((mat, i) => (troca[i] ? novo : mat)) : novo;
  });
}
