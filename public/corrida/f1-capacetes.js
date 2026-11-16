// Corrida da Galera — o desenho do capacete de cada piloto de 2026 (os 22 de f1-pilotos-2026.js) e o desenho genérico (na cor da equipe) de quem não está
// no mapa: a galera, o carro de segurança. Só as cores principais e o jeito geral (onde ficam o topo, as faixas, as laterais e a faixa da viseira) INSPIRADOS
// nos capacetes de verdade; nada de logotipo, marca nem bandeira desenhada. Referências: planetf1.com/news/f1-driver-helmets-2026-season (cores e
// motivos de cada piloto) e, para Hamilton, Verstappen, Leclerc e Russell, as reportagens de lançamento dos capacetes de 2026 (redbull.com, simracingonline.co.uk,
// motorsport.com). As cores são lidas dessas descrições e ajustadas à mão; o jeito de cada desenho é uma das sete famílias abaixo.
//
// A folha é de 512x256 e envolve a cabeça: x em volta (a frente em 384, as costas em 128, os lados em 0/512 e 256), y da coroa (0) ao queixo (256). A viseira
// (f1-piloto.js) ocupa y de 98 a 127 e x = 384 ± 94, então esse pedaço fica só com o casco por baixo; a faixa do patrocínio entra logo acima.
// `cores`: [casco, segunda cor, terceira cor (filetes, detalhes)].
import { desenharMarca } from "./f1-marcas.js";
import { ESTILOS } from "./f1-capacetes-estilos.js";

export const CAPACETES = {
  norris: { cores: ["#c4f31a", "#101114", "#d9ae2e"], desenho: "faixa" },       // verde-neon e preto, uma estrelinha dourada
  piastri: { cores: ["#f2c10f", "#d62a2a", "#1d3f9a"], desenho: "bandas" },     // amarelo, vermelho e azul
  leclerc: { cores: ["#e6002b", "#f2f2f2", "#101114"], desenho: "blocos" },     // vermelho e branco em blocos
  hamilton: { cores: ["#f4d22c", "#d6001c", "#101114"], desenho: "faixa" },     // amarelo com detalhes vermelhos
  russell: { cores: ["#6fc6f0", "#101114", "#f2f2f2"], desenho: "faixa" },      // azul-celeste com detalhes pretos
  antonelli: { cores: ["#f2f2f2", "#e10600", "#4aa8e8"], desenho: "blocos" },   // branco, vermelho, azul-celeste, verde e preto em camadas
  verstappen: { cores: ["#1e3d96", "#d3202a", "#f2f2f2"], desenho: "cruz" },    // azul, vermelho e branco; cruz vermelha e faixa azul em volta
  hadjar: { cores: ["#f6d117", "#5b2a86", "#101114"], desenho: "topo" },        // amarelo, roxo e preto
  lawson: { cores: ["#f4f4f4", "#ff5fa8", "#b6bcc6"], desenho: "faixa" },       // branco e rosa, prata
  lindblad: { cores: ["#a8ff00", "#2b6ce6", "#e23030"], desenho: "triangulos" },// neon, azuis e vermelho
  alonso: { cores: ["#3aa6e0", "#d2192e", "#f6c90e"], desenho: "bandas" },      // azul-claro, vermelho e amarelo
  stroll: { cores: ["#17191d", "#4a4f57", "#229971"], desenho: "asas" },        // preto fosco, "asas" cinza ao lado da viseira
  albon: { cores: ["#e7ebef", "#1868db", "#aeb4bb"], desenho: "topo" },         // branco cromado, azul no topo, prata
  sainz: { cores: ["#d2192e", "#f6c90e", "#1c4fa3"], desenho: "bandas" },       // vermelho e amarelo com azul
  hulkenberg: { cores: ["#e8e4da", "#b3b7bd", "#ff7a1a"], desenho: "faixa" },   // cinza-claro no meio, laranja, off-white nos lados
  bortoleto: { cores: ["#1fa64a", "#ffd400", "#f4f4f4"], desenho: "asas" },     // verde e amarelo, "asas" douradas, faixa branca
  gasly: { cores: ["#1f56d8", "#f4f4f4", "#e0242f"], desenho: "faixa" },        // azul, uma faixa branca e vermelha
  colapinto: { cores: ["#74c0ec", "#f4f4f4", "#e0364a"], desenho: "triangulos" },// azul-claro e branco, triângulos no topo
  camara: { cores: ["#ffd400", "#009c3b", "#002776"], desenho: "faixa" },      // amarelo, verde e azul do Brasil
  bearman: { cores: ["#2a4fd6", "#c4f31a", "#f4f4f4"], desenho: "faixa" },      // azul, neon e branco
  perez: { cores: ["#a8ff00", "#17191d", "#d2192e"], desenho: "asas" },         // neon, preto e vermelho
  bottas: { cores: ["#15171b", "#2f6fdb", "#8a909a"], desenho: "blocos" },      // preto, azul e dois cinzas
};
// o capacete do robô pela sigla do piloto (NOR, PIA...): null = desenho genérico
export function capacetePorSigla(sigla) {
  const lista = (typeof window !== "undefined" && window.F1Pilotos?.PILOTOS) || [], p = sigla && lista.find((q) => q.sigla === sigla);
  return p ? CAPACETES[p.id] || null : null;
}

const LADOS = [0, 256, 512];
const poli = (x, pts, cor) => { x.fillStyle = cor; x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); x.fill(); };
// uma fita larga e curva em cada lado da cabeça: sobe do queixo (na frente) até a nuca, afinando nas pontas (cx: o centro do lado na folha; no lado direito, cx = 256, as costas ficam à esquerda; no esquerdo, à direita)
function fita(x, cx, cor, topo = 78, larg = 56) {
  const d = cx === 256 ? -1 : 1, X = (v) => cx + d * v; // d = para onde ficam as costas
  x.fillStyle = cor; x.beginPath();
  x.moveTo(X(-128), 236); x.bezierCurveTo(X(-60), 214, X(40), 168, X(132), topo); // a borda de cima: do queixo à nuca
  x.bezierCurveTo(X(136), topo + larg * 0.9, X(70), topo + larg + 66, X(-10), 214 + larg * 0.4); x.bezierCurveTo(X(-70), 240, X(-110), 252, X(-128), 236); x.closePath(); x.fill();
}
const filete = (x, cx, cor, topo = 78) => { const d = cx === 256 ? -1 : 1, X = (v) => cx + d * v; x.strokeStyle = cor; x.lineWidth = 6; x.lineCap = "round"; x.beginPath(); x.moveTo(X(-128), 228); x.bezierCurveTo(X(-60), 206, X(40), 160, X(132), topo - 6); x.stroke(); };
const calota = (x, cor, ate = 66, fil) => { x.fillStyle = cor; x.fillRect(0, 0, 512, ate); if (fil) { x.fillStyle = fil; x.fillRect(0, ate - 2, 512, 7); } }; // o topo: uma cor só em volta da coroa (sem faixas que se juntem no alto)

const DESENHOS = {
  // o genérico (a galera e quem não está no mapa): topo na cor 2 com filete, uma fita larga de cor 2 em cada lado e o queixo de cor 2
  generico(x, [c1, c2, c3]) {
    calota(x, c2, 66, c3);
    for (const cx of LADOS) { fita(x, cx, c2); filete(x, cx, c3); }
    x.fillStyle = c2; x.fillRect(0, 226, 512, 30);
  },
  // o topo e a fita larga de cor 2 e o filete de cor 3
  faixa(x, [c1, c2, c3]) {
    calota(x, c2, 62, c3);
    for (const cx of LADOS) { fita(x, cx, c2, 82, 64); filete(x, cx, c3, 82); }
    x.fillStyle = c2; x.fillRect(0, 230, 512, 26);
  },
  // o topo de outra cor com a borda recortada e uma fita fina de cor 3 nos lados
  topo(x, [c1, c2, c3]) {
    x.fillStyle = c2; x.beginPath(); x.moveTo(0, 0); x.lineTo(512, 0); x.lineTo(512, 70);
    for (let i = 16; i >= 0; i--) x.lineTo(i * 32, 70 + (i % 2 ? 0 : 20));
    x.closePath(); x.fill();
    for (const cx of LADOS) fita(x, cx, c3, 100, 34);
    x.fillStyle = c2; x.fillRect(0, 226, 512, 30);
  },
  // faixas horizontais em volta da cabeça (como uma bandeira): em cima e embaixo na cor 2, o meio é o casco, filetes de cor 3
  bandas(x, [c1, c2, c3]) {
    x.fillStyle = c2; x.fillRect(0, 0, 512, 70); x.fillRect(0, 170, 512, 86);
    x.fillStyle = c3; x.fillRect(0, 70, 512, 8); x.fillRect(0, 162, 512, 8);
  },
  // uma cruz: o topo de cor 2, uma tira em volta (cor 3) no meio do casco e uma fita de cor 2 nos lados
  cruz(x, [c1, c2, c3]) {
    calota(x, c2, 56);
    x.fillStyle = c3; x.fillRect(0, 150, 512, 22);
    for (const cx of LADOS) fita(x, cx, c2, 92, 40);
  },
  // dois blocos de cor: a parte de cima no casco, a de baixo na cor 2, com a divisão inclinada e um filete de cor 3, e o topo de cor 3
  // um bloco grande de cor 3 cortado em diagonal na lateral e a cor 2 embaixo, em blocos
  blocos(x, [c1, c2, c3]) {
    for (const cx of LADOS) {
      const d = cx === 256 ? -1 : 1, X = (v) => cx + d * v;
      poli(x, [[X(-128), 200], [X(-40), 120], [X(128), 70], [X(128), 150], [X(0), 200]], c3);
      poli(x, [[X(-128), 256], [X(-128), 214], [X(0), 214], [X(128), 160], [X(128), 256]], c2);
      poli(x, [[X(-90), 256], [X(-60), 228], [X(40), 228], [X(20), 256]], c1);
    }
  },
  // "asas" de cor 2 de cada lado da viseira, o topo de cor 2 e a faixa de cor 3 no queixo
  asas(x, [c1, c2, c3]) {
    calota(x, c2, 50);
    poli(x, [[214, 146], [290, 104], [320, 94], [304, 126], [236, 176]], c2); poli(x, [[554, 146], [478, 104], [448, 94], [464, 126], [532, 176]], c2);
    for (const cx of LADOS) fita(x, cx, c2, 96, 36);
    x.fillStyle = c3; x.fillRect(0, 232, 512, 24);
  },
  // o topo com recortes triangulares e fitas de pontas em triângulo nos lados (um desenho mais "quebrado")
  // triângulos grandes de cor 2 e 3 encaixados na parte de trás e de baixo
  triangulos(x, [c1, c2, c3]) {
    for (const cx of LADOS) {
      const d = cx === 256 ? -1 : 1, X = (v) => cx + d * v;
      poli(x, [[X(-60), 256], [X(128), 256], [X(128), 90]], c2);
      poli(x, [[X(10), 256], [X(90), 256], [X(128), 150], [X(70), 190]], c3);
      poli(x, [[X(-128), 256], [X(-60), 256], [X(-20), 200]], c2);
    }
  },
  // ---------- os desenhos novos (2026-11-14: "mais visuais de capacetes e mais bonitos") ----------
  // chamas de cor 2 subindo do queixo pelos lados, com a ponta de cor 3, e o topo limpo
  chamas(x, [c1, c2, c3]) {
    calota(x, c2, 40, c3);
    for (const cx of LADOS) for (let k = 0; k < 5; k++) {
      const b = cx - 120 + k * 52, alto = 92 + ((k * 37) % 50);
      x.fillStyle = c2; x.beginPath(); x.moveTo(b - 26, 256); x.bezierCurveTo(b - 30, 200, b - 4, alto + 50, b + 8, alto); x.bezierCurveTo(b + 14, alto + 40, b + 34, 200, b + 30, 256); x.closePath(); x.fill();
      x.fillStyle = c3; x.beginPath(); x.moveTo(b - 10, 256); x.bezierCurveTo(b - 10, 220, b + 4, alto + 80, b + 8, alto + 44); x.bezierCurveTo(b + 12, alto + 80, b + 22, 220, b + 18, 256); x.closePath(); x.fill();
    }
  },
  // duas ondas largas em volta da cabeça, uma de cor 2 e outra de cor 3 por cima
  onda(x, [c1, c2, c3]) {
    const onda = (y0, amp, cor, fase) => { x.fillStyle = cor; x.beginPath(); x.moveTo(0, 256); for (let px = 0; px <= 512; px += 8) x.lineTo(px, y0 + Math.sin((px / 512) * Math.PI * 4 + fase) * amp); x.lineTo(512, 256); x.closePath(); x.fill(); };
    onda(150, 22, c2, 0); onda(196, 14, c3, 1.4);
    calota(x, c2, 36);
  },
  // o casco em degradê da cor 1 para a cor 2 de cima para baixo, com uma linha fina de cor 3 em volta
  // (2026-11-16, a grade do Thiago) o casco na cor 1 em cima, descendo em degradê até a cor 2 no queixo
  degrade(x, [c1, c2]) {
    const g = x.createLinearGradient(0, 70, 0, 256); g.addColorStop(0, c1); g.addColorStop(1, c2);
    x.fillStyle = g; x.fillRect(0, 0, 512, 256); calota(x, c1, 70);
  },
  // um raio de cor 2 contornado de cor 3 em cada lado, do topo ao queixo
  raio(x, [c1, c2, c3]) {
    calota(x, c2, 44);
    for (const cx of LADOS) {
      const pts = [[cx - 30, 44], [cx + 34, 44], [cx + 6, 122], [cx + 46, 122], [cx - 34, 252], [cx - 8, 152], [cx - 46, 152]];
      x.strokeStyle = c3; x.lineWidth = 10; x.lineJoin = "round"; x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); x.stroke();
      poli(x, pts, c2);
    }
  },
  // uma faixa quadriculada (a bandeirada) em volta da cabeça, entre dois filetes de cor 3, e o topo de cor 2
  // a bandeira quadriculada de cor 2 subindo pela parte de trás, os quadrados crescendo para a nuca
  xadrez(x, [c1, c2]) {
    for (const cx of LADOS) {
      const d = cx === 256 ? -1 : 1, X = (v) => cx + d * v;
      for (let i = 0; i < 6; i++) for (let j = 0; j < 9; j++) {
        if ((i + j) % 2) continue;
        const q = 14 + i * 3, u = 10 + i * 22, y = 256 - (j + 1) * q - i * 10;
        if (y < 40) continue; x.fillStyle = c2; x.fillRect(Math.min(X(u), X(u + q)), y, q, q);
      }
    }
  },
  // estrelas de cor 3 espalhadas sobre o topo de cor 2 (que desce em arco pelos lados)
  estrelas(x, [c1, c2, c3]) {
    x.fillStyle = c2; x.beginPath(); x.moveTo(0, 0); x.lineTo(512, 0); x.lineTo(512, 90); for (let px = 512; px >= 0; px -= 16) x.lineTo(px, 90 + Math.cos((px / 512) * Math.PI * 4) * 26); x.closePath(); x.fill();
    const estrela = (cx, cy, r) => { x.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, q = i % 2 ? r * 0.42 : r; x.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q); } x.closePath(); x.fill(); };
    x.fillStyle = c3; let s = 7; for (let i = 0; i < 26; i++) { s = (s * 16807) % 2147483647; const px = (s % 512), py = 8 + ((s >> 9) % 70); estrela(px, py, 5 + ((s >> 4) % 6)); }
    x.fillStyle = c2; x.fillRect(0, 230, 512, 26);
  },
  // listras finas na diagonal (cor 2 e cor 3) cobrindo a parte de baixo, e o topo limpo
  listras(x, [c1, c2, c3]) {
    x.save(); x.beginPath(); x.rect(0, 120, 512, 136); x.clip();
    for (let k = -8; k < 40; k++) { x.fillStyle = k % 2 ? c2 : c3; x.beginPath(); x.moveTo(k * 22, 256); x.lineTo(k * 22 + 14, 256); x.lineTo(k * 22 + 14 + 136, 120); x.lineTo(k * 22 + 136, 120); x.closePath(); x.fill(); }
    x.restore();
    x.fillStyle = c2; x.fillRect(0, 114, 512, 6);
    calota(x, c3, 30);
  },
  // facetas geométricas (triângulos grandes de cor 2 e cor 3) nos lados, como um casco lapidado
  // um triângulo grande de cor 2 tomando a parte de baixo e de trás, com uma quina de cor 3
  geometrico(x, [c1, c2, c3]) {
    for (const cx of LADOS) {
      const d = cx === 256 ? -1 : 1, X = (v) => cx + d * v;
      poli(x, [[X(-80), 256], [X(128), 256], [X(128), 110], [X(40), 150]], c2);
      poli(x, [[X(-128), 256], [X(-80), 256], [X(-40), 210]], c3);
    }
  },
  // lâminas: cunhas compridas e afiadas de cor 2 e cor 3 saindo da frente para trás, como os capacetes da TV
  laminas(x, [c1, c2, c3]) {
    for (const cx of LADOS) {
      const d = cx === 256 ? -1 : 1, X = (v) => cx + d * v;
      poli(x, [[X(-120), 150], [X(150), 40], [X(160), 70], [X(-90), 178]], c2);
      poli(x, [[X(-110), 196], [X(170), 110], [X(170), 132], [X(-80), 214]], c3);
      poli(x, [[X(-60), 236], [X(150), 168], [X(150), 182], [X(-30), 246]], c2);
    }
    calota(x, c2, 34, c3);
  },
  // garras: três rasgos curvos de cor 2 em cada lado, com o contorno de cor 3
  garras(x, [c1, c2, c3]) {
    calota(x, c3, 30);
    for (const cx of LADOS) for (let k = 0; k < 3; k++) {
      const y = 96 + k * 44, d = cx === 256 ? -1 : 1;
      x.strokeStyle = c3; x.lineWidth = 22; x.lineCap = "round"; x.beginPath(); x.moveTo(cx - d * 110, y + 60); x.quadraticCurveTo(cx, y - 10, cx + d * 120, y - 40); x.stroke();
      x.strokeStyle = c2; x.lineWidth = 12; x.beginPath(); x.moveTo(cx - d * 110, y + 60); x.quadraticCurveTo(cx, y - 10, cx + d * 120, y - 40); x.stroke();
    }
  },
  // corte: o casco dividido na diagonal (a parte de baixo na cor 2) por uma faixa larga de cor 3
  corte(x, [c1, c2, c3]) {
    for (const cx of LADOS) { const d = cx === 256 ? -1 : 1, X = (v) => cx + d * v; poli(x, [[X(-140), 256], [X(-140), 190], [X(150), 60], [X(150), 256]], c2); poli(x, [[X(-140), 176], [X(150), 46], [X(150), 66], [X(-140), 196]], c3); }
    calota(x, c2, 28);
  },
  // velocidade: linhas finas que afinam da frente para trás, em cor 2 e cor 3, sobre a faixa do meio
  velocidade(x, [c1, c2, c3]) {
    for (const cx of LADOS) {
      const d = cx === 256 ? -1 : 1;
      for (let k = 0; k < 7; k++) { const y = 90 + k * 20, larg = 10 - k; poli(x, [[cx - d * 130, y], [cx + d * (90 + k * 8), y - 6], [cx + d * (90 + k * 8), y - 6 + larg * 0.4], [cx - d * 130, y + larg]], k % 2 ? c3 : c2); }
    }
    calota(x, c2, 40, c3);
  },
  // (2026-11-16, as propostas do Thiago) uma lâmina de cor 2 que corta a lateral do queixo até a nuca, com um traço fino de cor 3 junto
  stripe(x, [c1, c2, c3]) {
    for (const cx of LADOS) {
      const d = cx === 256 ? -1 : 1, X = (v) => cx + d * v;
      poli(x, [[X(-120), 250], [X(-70), 250], [X(110), 120], [X(80), 120]], c2);
      poli(x, [[X(-40), 250], [X(-24), 250], [X(124), 146], [X(116), 146]], c3);
    }
  },
  // o casco escuro com dois filetes finos e curvos de cor 2 e 3 correndo pela lateral
  linhas(x, [c1, c2, c3]) {
    for (const cx of LADOS) { filete(x, cx, c2, 70); filete(x, cx, c3, 96); }
    x.fillStyle = c2; x.fillRect(0, 244, 512, 4);
  },
  // curvas de nível em cor 2 sobre o casco (o mesmo desenho em todo capacete com essas cores)
  topografico(x, [c1, c2]) {
    x.strokeStyle = c2; x.lineWidth = 2; x.globalAlpha = 0.85;
    for (let k = 0; k < 22; k++) {
      x.beginPath();
      for (let i = 0; i <= 64; i++) { const u = i * 8, y = 20 + k * 11 + Math.sin(u / 37 + k * 0.7) * 7 + Math.sin(u / 13 + k * 1.9) * 3; i ? x.lineTo(u, y) : x.moveTo(u, y); }
      x.stroke();
    }
    x.globalAlpha = 1;
  },
  // quase tudo da cor do casco: um filete reto de cor 2 na lateral e o queixo de cor 3
  minimalista(x, [c1, c2, c3]) {
    for (const cx of LADOS) { const d = cx === 256 ? -1 : 1, X = (v) => cx + d * v; poli(x, [[X(-128), 214], [X(-128), 220], [X(130), 150], [X(130), 144]], c2); }
    x.fillStyle = c3; x.fillRect(0, 238, 512, 18);
  },
  // faixas largas paralelas de cor 2 e 3, inclinadas, cobrindo a metade de baixo
  faixas(x, [c1, c2, c3]) {
    for (const cx of LADOS) {
      const d = cx === 256 ? -1 : 1, X = (v) => cx + d * v;
      poli(x, [[X(-128), 256], [X(-40), 256], [X(128), 110], [X(128), 70]], c3);
      poli(x, [[X(-20), 256], [X(30), 256], [X(128), 170], [X(128), 128]], c2);
      poli(x, [[X(50), 256], [X(70), 256], [X(128), 206], [X(128), 190]], c2);
    }
  },
  // pinceladas soltas de cor 2 na parte de trás e de baixo (o mesmo desenho em todo capacete)
  pinceladas(x, [c1, c2]) {
    let s = 7; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    x.fillStyle = c2;
    for (let k = 0; k < 90; k++) {
      const u = r() * 512, y = 150 + r() * 106, w = 30 + r() * 70, h = 3 + r() * 9, a = -0.5 + r() * 0.25;
      x.save(); x.translate(u, y); x.rotate(a); x.globalAlpha = 0.6 + r() * 0.4; x.fillRect(-w / 2, -h / 2, w, h); x.restore();
    }
    x.globalAlpha = 1;
  },
  // (o "Audi" da grade do Thiago) um painel de cor 3 na lateral, recortado em diagonal, com a ponta de cor 2 embaixo
  audi(x, [c1, c2, c3]) {
    for (const cx of LADOS) {
      const d = cx === 256 ? -1 : 1, X = (v) => cx + d * v;
      poli(x, [[X(-20), 256], [X(128), 256], [X(128), 60], [X(60), 60], [X(10), 180]], c3);
      poli(x, [[X(-128), 256], [X(-20), 256], [X(10), 210], [X(-110), 230]], c2);
    }
  },
};

// ---------- o capacete de quem joga (mods.capacete; editor na Garagem da sala, menus.js) ----------
// { desenho, cores: [casco, segunda, detalhe], viseira, bandeira (sigla de gp-info.js BANDEIRAS), nome }; o servidor confere com `limparCapacete` (corrida.js, a mesma regra)
// (2026-11-16) as 12 da grade do Thiago, nesta ordem, no lugar das antigas. Os desenhos antigos continuam em DESENHOS (um capacete guardado
// com eles ainda pinta igual), mas não aparecem mais na escolha.
// (2026-11-16) os 16 estilos da imagem do Thiago vêm primeiro (f1-capacetes-estilos.js), cada um com as suas cores de fábrica (CORES_DO_ESTILO)
export const DESENHOS_CAPACETE = { ...Object.fromEntries(Object.entries(ESTILOS).map(([k, e]) => [k, e.nome])), degrade: "Degradê", stripe: "Stripe", audi: "Audi", linhas: "Linhas", blocos: "Blocos", topografico: "Topográfico",
  xadrez: "Checker", triangulos: "Triângulos", minimalista: "Minimalista", faixas: "Faixas", geometrico: "Geométrico", pinceladas: "Pinceladas" }; // (a lista do servidor: corrida.js, DESENHOS_CAPACETE)
// o "Padrão" (as 4 variações de cada desenho), o acabamento do casco e os patrocínios (selos inventados, sem marca de verdade); a lista do servidor
// é a mesma (corrida.js, limparCapacete)
export const CORES_DO_ESTILO = (id) => ESTILOS[id] ? { cores: ESTILOS[id].cores.slice(), viseira: ESTILOS[id].viseira } : null;
export const VARIANTES = ["Original", "Detalhe trocado", "Cores trocadas", "Espelhado"];
export const ACABAMENTOS = { brilho: "Brilhante", fosco: "Fosco", acetinado: "Acetinado", metal: "Metálico", perola: "Perolado", camaleao: "Camaleão",
  flocos: "Flocos de metal", carbono: "Fibra de carbono", cromo: "Cromado" }; // (2026-11-15: acetinado, perolado, camaleão, flocos e carbono)
export const PATROCINIOS = { "": "Nenhum", vila: "Vila do Tabba", galera: "Galera Racing", energia: "Tabba Energy", pneus: "Turbo Pneus" };
// (2026-11-15) as marcas das pinturas dos carros (f1-marcas.js, desenhadas no canvas) também podem ir no capacete, cada uma num lugar
export const MARCAS_CAPACETE = { hp: "HP", shell: "Shell", vpower: "V-Power", unicredit: "UniCredit", ceva: "CEVA", ibm: "IBM", zyn: "ZYN", richardmille: "Richard Mille",
  bitdefender: "Bitdefender", bingx: "BingX", whoop: "WHOOP", pirelli: "Pirelli", genesys: "Genesys", peroni: "Peroni", rayban: "Ray-Ban", ambipar: "Ambipar", dell: "Dell",
  etihad: "Etihad", groq: "Groq", hilton: "Hilton", oneflight: "ONEflight", castrol: "Castrol", hyatt: "World of Hyatt", bp: "bp", revolutr: "Revolut", adidas: "adidas",
  twgai: "TWG AI", jimbeam: "Jim Beam", corescientific: "Core Scientific", brasao: "Brasão Cadillac", hilfiger: "Tommy Hilfiger", coherent: "Coherent", proforce: "Proforce+",
  pepperstone: "Pepperstone", glenfiddich: "Glenfiddich", netapp: "NetApp", xerox: "Xerox", nexgen: "NexGen", hhonda: "Honda", cw: "CW", stephens: "Stephens",
  myprotein: "Myprotein", kraken: "Kraken", twilio: "Twilio", vast: "VAST", bwscores: "bw Scores", williamsw: "W da Williams", atlassiana: "Atlassian", gemini: "Gemini",
  mastercard: "Mastercard", dropbox: "Dropbox", microsoft: "Microsoft", cashapp: "Cash App", ford: "Ford", gulf: "Gulf", aneis: "Anéis da Audi", eni: "eni", gr: "GR",
  moneygram: "MoneyGram", stake: "Stake", kick: "KICK", orlen: "Orlen", alphatauri: "AlphaTauri", alfaromeo: "Alfa Romeo", trevo: "Quadrifoglio", santander: "Santander",
  chrome: "Chrome", palmangels: "Palm Angels", estrela: "Estrela da Mercedes", gota: "Gota da Petronas", syntium: "Petronas Syntium", gate: "Gate", carlyle: "Carlyle",
  att: "AT&T", tagheuer: "TAG Heuer", tudor: "Tudor" };
// os lugares do patrocínio na folha: [x, y, largura, altura] (largura e altura medidas no equador; mais perto do topo ou do queixo a folha
// encolhe na volta, e a marca é esticada em 1/sen(ângulo) para continuar com a mesma cara). Os lados são dois (256 e 0/512, a costura).
export const LUGARES_PATROCINIO = { testa: "Testa", faixa: "Faixa do visor", lados: "Lados", nuca: "Nuca", queixo: "Queixo" };
const LUGARES = { testa: [[384, 52, 120, 20]], faixa: [[384, 77, 150, 15]], lados: [[256, 82, 110, 26], [0, 82, 110, 26], [512, 82, 110, 26]], nuca: [[128, 58, 150, 24]], queixo: [[384, 172, 110, 22]] };
export const FUNDOS_PATROCINIO = { auto: "Direto no casco", escuro: "Placa escura", claro: "Placa clara", cor: "Placa na cor 3" };
// os patrocínios de um capacete, lugar por lugar ({ testa, faixa, lados, nuca, queixo }); o de antes (um só, `patrocinio`) ia na nuca e nos lados
export function patrociniosDe(cap) {
  if (cap && cap.patrocinios && typeof cap.patrocinios === "object") return { ...cap.patrocinios };
  return cap && cap.patrocinio ? { lados: cap.patrocinio, nuca: cap.patrocinio } : {};
}
// o que pintarFolha recebe de um capacete de quem joga
export const extraDoCapacete = (cap) => ({ bandeira: cap.bandeira, nome: cap.nome, variante: cap.variante | 0, patrocinios: patrociniosDe(cap), fundoPatrocinio: cap.fundoPatrocinio || "auto", acabamento: cap.acabamento || "brilho" });
// a caixa da marca desenhada com altura 1 (medida uma vez, pelos pixels: cada marca tem uma largura)
const CAIXAS = new Map();
function caixaDaMarca(id) {
  if (CAIXAS.has(id)) return CAIXAS.get(id);
  const W = 1400, H = 240, cv = document.createElement("canvas"); cv.width = W; cv.height = H; const c = cv.getContext("2d", { willReadFrequently: true });
  c.translate(W / 2, H / 2); c.scale(100, 100); desenharMarca(c, id, { tinta: "#fff", fundo: "#fff" });
  const d = c.getImageData(0, 0, W, H).data; let x0 = W, x1 = -1, y0 = H, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const b = x1 < 0 ? { x0: -1, x1: 1, y0: -0.5, y1: 0.5 } : { x0: (x0 - W / 2) / 100, x1: (x1 + 1 - W / 2) / 100, y0: (y0 - H / 2) / 100, y1: (y1 + 1 - H / 2) / 100 };
  CAIXAS.set(id, b); return b;
}
const claroDe = (h) => { const n = parseInt(String(h).slice(1), 16); return ((n >> 16) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11) > 140; };
// a cor média de um pedaço da folha (para a letra da marca contrastar com o que está embaixo)
function corEmbaixo(x, cx, cy, w, h) {
  const x0 = Math.max(0, Math.round(cx - w / 2)), x1 = Math.min(512, Math.round(cx + w / 2)), y0 = Math.max(0, Math.round(cy - h / 2)), y1 = Math.min(256, Math.round(cy + h / 2));
  if (x1 - x0 < 1 || y1 - y0 < 1) return "#808080";
  const d = x.getImageData(x0, y0, x1 - x0, y1 - y0).data; let r = 0, g = 0, b = 0;
  for (let k = 0; k < d.length; k += 4) { r += d[k]; g += d[k + 1]; b += d[k + 2]; }
  const n = d.length / 4, hex = (v) => Math.round(v / n).toString(16).padStart(2, "0"); return "#" + hex(r) + hex(g) + hex(b);
}
// uma marca (ou um selo da galera) num lugar: a placa (se tiver), a marca cabendo nela e esticada na volta da cabeça
// (2026-11-16, o Thiago: "o halo todo devia poder ter patrocinadores, os mesmos do capacete, e eu escolher a posição") os cinco lugares do halo,
// da perna esquerda à direita; a escolha fica neste navegador e vale só para o carro do jogador (f1-pintura.js texturaDoHalo). Lugar vazio
// mantém a marca da equipe; "tirar" deixa o lugar liso.
export const LUGARES_HALO = ["Halo · perna esquerda", "Halo · lado esquerdo", "Halo · topo", "Halo · lado direito", "Halo · perna direita"];
const CHAVE_HALO = "corrida:halo";
export function lerHalo() { try { const h = JSON.parse(localStorage.getItem(CHAVE_HALO)); return h && Array.isArray(h.lugares) ? h : { lugares: [], fundo: "escuro" }; } catch { return { lugares: [], fundo: "escuro" }; } }
export function gravarHalo(h) { try { localStorage.setItem(CHAVE_HALO, JSON.stringify(h)); } catch { /* sem armazenamento */ } }
// uma marca num lugar do halo (a folha do halo tem 256 de altura e o meio em y = 128, onde a conta de esticar dá 1)
export function patrocinioNoHalo(x, id, cx, w, h, fundo) { patrocinioNoLugar(x, id, [cx, 128, w, h], fundo === "auto" ? "escuro" : fundo, "#101114"); }
function patrocinioNoLugar(x, id, [cx, cy, w, h], fundo, c3) {
  const estica = Math.min(2, 1 / Math.max(0.3, Math.sin(Math.PI * cy / 256)));
  x.save(); x.translate(cx, cy); x.scale(estica, 1);
  if (SELOS[id]) { selo(x, id, 0, 0, w, h); x.restore(); return; }
  const b = caixaDaMarca(id), bw = b.x1 - b.x0, bh = b.y1 - b.y0, folga = h * 0.16, e = Math.min((w - folga * 2) / bw, (h - folga * 2) / bh);
  const placa = fundo === "escuro" ? "#101114" : fundo === "claro" ? "#f4f4f4" : fundo === "cor" ? c3 : null;
  if (placa) { const pw = bw * e + folga * 2.4; x.fillStyle = placa; x.beginPath(); x.roundRect ? x.roundRect(-pw / 2, -h / 2, pw, h, h / 4) : x.rect(-pw / 2, -h / 2, pw, h); x.fill(); }
  x.restore();
  const sob = placa || corEmbaixo(x, cx, cy, bw * e * estica, bh * e), tinta = claroDe(sob) ? "#101114" : "#ffffff";
  x.save(); x.translate(cx, cy); x.scale(estica, 1); x.scale(e, e); x.translate(-(b.x0 + b.x1) / 2, -(b.y0 + b.y1) / 2);
  desenharMarca(x, id, { tinta, fundo: sob }); x.restore();
}
// as propriedades do material do casco em cada acabamento (o verniz por cima, como o capacete de verdade)
// (MeshPhysicalMaterial: todas as chaves vêm sempre, para trocar de um acabamento para outro sem sobrar nada do anterior; `relevo` é a textura
// de relevo do casco: a trama do carbono ou os flocos, f1-piloto.js aplicarAcabamento)
// (2026-11-15 o casco saía acetinado em qualquer acabamento; desfeito em 2026-11-16, a pedido do Thiago)
export function acabamentoDoCasco(a) {
  // (2026-11-16, o Thiago: "coloca novamente o material original no capacete, metálico etc., e não só acetinado") cada acabamento volta a ter o seu
  // material; quem quer o casco sem reflexo escolhe o Acetinado ou o Fosco
  const base = { roughness: 0.28, metalness: 0.08, clearcoat: 1, clearcoatRoughness: 0.08, iridescence: 0, iridescenceIOR: 1.3, sheen: 0, relevo: null };
  return { ...base, ...({ fosco: { roughness: 0.72, metalness: 0.02, clearcoat: 0, clearcoatRoughness: 0.6 }, acetinado: { roughness: 0.48, metalness: 0.06, clearcoat: 0.45, clearcoatRoughness: 0.4 },
    metal: { roughness: 0.32, metalness: 0.55 }, perola: { roughness: 0.3, metalness: 0.12, clearcoatRoughness: 0.05, iridescence: 0.6, iridescenceIOR: 1.5, sheen: 0.4 },
    camaleao: { roughness: 0.24, metalness: 0.6, clearcoatRoughness: 0.04, iridescence: 1, iridescenceIOR: 2 },
    flocos: { roughness: 0.36, metalness: 0.62, clearcoatRoughness: 0.03, relevo: "flocos" }, carbono: { roughness: 0.34, metalness: 0.18, clearcoatRoughness: 0.04, relevo: "carbono" },
    cromo: { roughness: 0.12, metalness: 0.92, clearcoatRoughness: 0.03 } }[a] || {}) };
}
// as folhas 512x256 do relevo (feitas uma vez): o carbono é a sarja 2x2 (quadros de 4 px com a fibra deitada ou em pé, mais clara no meio do
// fio) e os flocos, um ruído de pontos. O carbono também é a cor do casco (pintarFolha), com um tanto da cor 1 por cima.
const RELEVOS = {};
export function folhaDeRelevo(tipo) {
  if (RELEVOS[tipo] || typeof document === "undefined") return RELEVOS[tipo] || null;
  const cv = document.createElement("canvas"); cv.width = 512; cv.height = 256; const x = cv.getContext("2d");
  if (tipo === "carbono") {
    const Q = 4;
    for (let i = 0; i < 512 / Q; i++) for (let j = 0; j < 256 / Q; j++) {
      const deitada = ((i + j) & 3) < 2, px = i * Q, py = j * Q;
      x.fillStyle = "#101114"; x.fillRect(px, py, Q, Q);
      x.fillStyle = "#1d1f24"; deitada ? x.fillRect(px, py + 1, Q, Q - 2) : x.fillRect(px + 1, py, Q - 2, Q);
      x.fillStyle = "#2b2e35"; deitada ? x.fillRect(px, py + 1.5, Q, 1) : x.fillRect(px + 1.5, py, 1, Q);
    }
  } else if (tipo === "flocos") {
    const d = x.createImageData(512, 256);
    for (let k = 0; k < d.data.length; k += 4) { const v = Math.random() < 0.35 ? 255 * Math.random() : 128; d.data[k] = d.data[k + 1] = d.data[k + 2] = v; d.data[k + 3] = 255; }
    x.putImageData(d, 0, 0);
  } else return null;
  return (RELEVOS[tipo] = cv);
}
// um selo de patrocínio: o texto em caixa alta num retângulo arredondado (as cores e o desenho mudam de um para outro)
const SELOS = { vila: ["VILA DO TABBA", "#101114", "#ffd23f"], galera: ["GALERA RACING", "#e10600", "#ffffff"], energia: ["TABBA ENERGY", "#18c46b", "#08100b"], pneus: ["TURBO PNEUS", "#ffffff", "#101114"] };
function selo(x, id, cx, cy, w, h) {
  const s = SELOS[id]; if (!s) return;
  x.fillStyle = s[1]; x.beginPath(); x.roundRect ? x.roundRect(cx - w / 2, cy - h / 2, w, h, h / 3) : x.rect(cx - w / 2, cy - h / 2, w, h); x.fill();
  x.fillStyle = s[2]; x.font = `900 ${Math.round(h * 0.62)}px Arial, sans-serif`; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(s[0], cx, cy + 1, w - 8);
}
export const VISEIRAS = { "#090b10": "Escura", "#c9ccd2": "Espelhada", "#d4a017": "Dourada", "#1e6fd9": "Azul", "#d8142c": "Vermelha", "#7a2fd0": "Roxa", "#1fa64a": "Verde", "#f07c1a": "Laranja" };
export const CAPACETE_PADRAO = { desenho: "stripe", cores: ["#f4f4f4", "#e10600", "#101114"], viseira: "#090b10", bandeira: "BR", nome: "" };
// as bandeiras (o SVG de gp-info.js) viram imagem uma vez; quem pinta antes de ela chegar é avisado para repintar
const BAND = new Map();
export function bandeiraImg(sigla, aoChegar) {
  const svg = sigla && typeof window !== "undefined" && window.GpInfo?.BANDEIRAS?.[sigla]; if (!svg) return null;
  let b = BAND.get(sigla);
  if (!b) { b = { img: new Image(), ok: false, espera: [] }; BAND.set(sigla, b); b.img.onload = () => { b.ok = true; for (const f of b.espera.splice(0)) f(); };
    b.img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16" width="96" height="64">${svg}</svg>`); }
  if (!b.ok && aoChegar) b.espera.push(aoChegar);
  return b.ok ? b.img : null;
}
// pinta a folha inteira: o casco, o desenho e o que todo capacete tem (a faixa do patrocínio acima da viseira, o filete embaixo e o número);
// `extra` (o capacete de quem joga): a bandeira atrás e nos lados e o nome na faixa acima da viseira e na nuca. `aoChegar`: a bandeira chegou depois, repinte
export function pintarFolha(x, cores, desenho, numero, extra = null, aoChegar = null) {
  const v = extra && extra.variante | 0, base = v === 1 ? [cores[0], cores[2], cores[1]] : v === 2 ? [cores[1], cores[0], cores[2]] : cores; // (o "Padrão": as cores trocadas)
  const [c1, c2, c3] = base;
  x.fillStyle = c1; x.fillRect(0, 0, 512, 256);
  const carbono = extra && extra.acabamento === "carbono" && folhaDeRelevo("carbono");
  if (carbono) { x.drawImage(carbono, 0, 0); x.globalAlpha = 0.2; x.fillStyle = c1; x.fillRect(0, 0, 512, 256); x.globalAlpha = 1; } // (o casco de carbono, puxado para a cor 1)
  x.save(); if (v === 3) { x.translate(512, 0); x.scale(-1, 1); } // (o "Padrão" espelhado: o desenho vira de lado)
  if (ESTILOS[desenho]) ESTILOS[desenho].pintar(x, base); else (DESENHOS[desenho] || DESENHOS.generico)(x, base);
  x.restore();
  x.fillStyle = c3; x.fillRect(282, 74, 204, 11); // a faixa estreita do patrocínio / nome acima da viseira (só cor; um pouco acima do lábio da viseira)
  // as duas entradas de ar do queixo, logo abaixo da viseira (2026-11-13, pela imagem do Thiago): fendas escuras inclinadas para fora
  x.fillStyle = "#0b0c10";
  for (const l of [-1, 1]) { x.save(); x.translate(384 + l * 34, 150); x.rotate(l * 0.18); x.beginPath(); x.roundRect ? x.roundRect(-17, -4, 34, 8, 4) : x.rect(-17, -4, 34, 8); x.fill(); x.restore(); }
  const patr = extra ? (extra.patrocinios || patrociniosDe(extra)) : {};
  for (const [lugar, id] of Object.entries(patr)) {
    if (!LUGARES[lugar] || !id || !(SELOS[id] || MARCAS_CAPACETE[id])) continue;
    if (lugar === "faixa") { x.fillStyle = c3; x.fillRect(278, 66, 212, 22); } // (a faixa acima do visor, como a do nome)
    for (const l of LUGARES[lugar]) patrocinioNoLugar(x, id, l, extra.fundoPatrocinio, c3);
  }
  if (extra) {
    const img = extra.bandeira ? bandeiraImg(extra.bandeira, aoChegar) : null;
    if (img) for (const [cx, cy, w] of [[128, 104, 84], [256, 120, 54], [0, 120, 54], [512, 120, 54]]) { x.fillStyle = "#0b0c10"; x.fillRect(cx - w / 2 - 2, cy - w / 3 - 2, w + 4, w * 2 / 3 + 4); x.drawImage(img, cx - w / 2, cy - w / 3, w, w * 2 / 3); }
    const nome = String(extra.nome || "").trim();
    if (nome) {
      if (!patr.faixa) { // na faixa acima da viseira (acima do lábio dela), se a faixa não tiver patrocínio
        x.fillStyle = c3; x.fillRect(278, 66, 212, 22); x.fillStyle = claroDe(c3) ? "#101114" : "#ffffff";
        x.font = "900 17px Arial, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(nome.toUpperCase(), 384, 78, 170);
      }
      x.font = "900 24px Arial, sans-serif"; x.lineWidth = 5; x.strokeStyle = "#0b0c10"; x.strokeText(nome.toUpperCase(), 128, 214, 180); x.fillStyle = "#ffffff"; x.fillText(nome.toUpperCase(), 128, 214, 180); // na nuca
    }
  }
  if (numero != null && numero !== "") {
    x.font = "900 54px 'Arial Black', Arial, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.lineJoin = "round"; x.lineWidth = 7;
    for (const [cx, cy] of [[128, 168], [256, 172], [0, 172], [512, 172]]) { x.strokeStyle = "#0b0c10"; x.strokeText(String(numero), cx, cy); x.fillStyle = "#ffffff"; x.fillText(String(numero), cx, cy); }
  }
}
// a miniatura de um patrocínio para o editor (dataURL, feita uma vez): a marca ou o selo num quadro escuro
const MINIS = new Map();
export function miniaturaDoPatrocinio(id, w = 150, h = 60) {
  if (MINIS.has(id)) return MINIS.get(id);
  if (typeof document === "undefined") return "";
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h; const x = cv.getContext("2d");
  x.fillStyle = "#1b1e25"; x.fillRect(0, 0, w, h);
  if (SELOS[id]) selo(x, id, w / 2, h / 2, w * 0.86, h * 0.42);
  else if (MARCAS_CAPACETE[id]) {
    const b = caixaDaMarca(id), e = Math.min((w * 0.8) / (b.x1 - b.x0), (h * 0.6) / (b.y1 - b.y0));
    x.translate(w / 2, h / 2); x.scale(e, e); x.translate(-(b.x0 + b.x1) / 2, -(b.y0 + b.y1) / 2); desenharMarca(x, id, { tinta: "#ffffff", fundo: "#1b1e25" });
  }
  const url = cv.toDataURL(); MINIS.set(id, url); return url;
}
