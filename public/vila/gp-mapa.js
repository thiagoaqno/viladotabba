"use strict";
// O mapa do Autódromo da Galera (a Vila): onde fica cada coisa, o traçado da pista e o chão casa por casa.
// Script comum (sem módulo), carregado por public/index.html depois da lista GAMES; o desenho fica em gp-desenho.js e
// tudo o que se mexe (carros, gente, o F1 de quem joga) em gp-vida.js. O servidor (vila.js) repete MW, MH, OX, OY e SPAWN.
//
// O circuito fecha em volta do paddock. Dentro dele: a rua de serviço, o Ginásio com a grama alta, o Centro de Mídia, o
// heliponto, os dois pavilhões (Carreira e Leilão) com a torre de controle no meio, a praça e os dez boxes de frente para
// o pit lane e a reta principal. Fora: a Fan Zone ao norte, os hangares a leste e, ao sul da reta, a tribuna principal
// (a Corrida), o pódio, a torre dos recordes, o estacionamento e a rodovia. A pé se cruza a pista pelas passarelas; de
// F1 se entra nela pelo pit lane ou pelo portão de serviço do leste.
const TS = 16, VW = 200, VH = 150, OX = 3, OY = 3, MW = VW + OX * 2, MH = VH + OY * 2;
const SPAWN = [OX + 102, OY + 72]; // na praça do paddock, de frente para o logo
const BAIRROS = [
  { id: "cartas", nome: "Fan Zone", placa: [4, 12] },
  { id: "esportes", nome: "Quadras", placa: [6, 21] },
  { id: "praca", nome: "Paddock", placa: [57, 66] },
  { id: "ginasios", nome: "Boxes · Desafios", placa: [69, 94] },
  { id: "autodromo", nome: "Velocidade", placa: [90, 120] },
];
// Onde fica cada jogo, em casas da vila: [x, y, largura, altura, estilo do prédio, grupo do menu]. A porta fica sempre na
// parede de baixo (o capacho na casa logo abaixo).
const LUGARES = {
  // a Fan Zone: as tendas dos jogos de mesa na fileira de cima, as quadras na de baixo
  banco: [6, 6, 8, 5, "tenda", "cartas"], uno: [16, 6, 7, 5, "tenda", "cartas"], truco: [25, 6, 8, 5, "tenda", "cartas"],
  sinuca: [35, 6, 7, 5, "tenda", "cartas"], domino: [44, 6, 7, 5, "tenda", "cartas"], rumi: [53, 6, 7, 5, "tenda", "cartas"],
  proibida: [62, 6, 7, 5, "tenda", "cartas"], bloqueio: [86, 6, 6, 5, "tenda", "cartas"], ludo: [94, 6, 6, 5, "tenda", "cartas"],
  botao: [102, 6, 6, 5, "tenda", "cartas"], naruto: [110, 6, 6, 5, "tenda", "cartas"], cozinha: [119, 6, 11, 5, "tenda", "cartas"],
  pelada: [8, 15, 10, 5, "quadra", "esportes"], tenis: [22, 15, 10, 5, "quadra", "esportes"],
  futevolei: [36, 15, 10, 5, "quadra", "esportes"], haxball: [50, 15, 10, 5, "quadra", "esportes"],
  // o paddock
  ginasio: [60, 43, 10, 6, "pavilhao", "praca"], digita: [80, 43, 14, 6, "pavilhao", "praca"],
  carreira: [70, 55, 26, 10, "pavilhao", "praca"], leilao: [108, 55, 26, 10, "pavilhao", "praca"],
  // ao sul da reta: a tribuna principal é a Corrida; a leste da pista, os hangares
  corrida: [92, 111, 36, 8, "autodromo", "autodromo"],
  drag: [187, 40, 10, 6, "hangar", "autodromo"], rocket: [187, 50, 10, 6, "hangar", "autodromo"],
  batalha: [187, 66, 10, 6, "hangar", "autodromo"], tiro: [187, 78, 10, 6, "hangar", "autodromo"],
};
const LOGOS = { carreira: "CARREIRA", leilao: "LEILÃO", ginasio: "GINÁSIO", corrida: "GRANDE PRÊMIO DA GALERA", digita: "MÍDIA" }; // o nome pintado no telhado
const portas = (x, w) => (w >= 8 ? [x + (w >> 1) - 1, x + (w >> 1)] : [x + (w >> 1)]);
for (const g of GAMES) {
  const L = LUGARES[g.id];
  if (L) { const [x, y, w, h, estilo, bairro] = L; Object.assign(g, { x, y, w, h, estilo, bairro, doors: portas(x, w), logo: LOGOS[g.id] || g.sign }); }
}
// Os dez boxes, lado a lado, de frente para o pit lane: os quatro líderes e os seis treinadores, cada um na cor do tipo
const BOXES = { x: 72, y: 90, w: 6, h: 5 };
const escurece = (hex, f = 0.72) => "#" + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * f).toString(16).padStart(2, "0")).join("");
[...Lideres.GINASIOS, ...Lideres.TREINADORES].forEach((l, i) => {
  const lider = i < Lideres.GINASIOS.length, x = BOXES.x + i * BOXES.w;
  GAMES.push({ id: "lider-" + l.id, url: "/ginasio/?lider=" + l.id, icon: lider ? "🏅" : "⚔️", sign: l.tipo.toUpperCase(), name: lider ? "Ginásio " + l.tipo : "Ginásio de " + l.nome,
    verbo: lider ? "desafiar o líder" : "desafiar", textoBotao: "Desafiar",
    desc: lider ? l.nome + ": “" + l.frase + "” Vença no Ginásio em tempo real para ganhar a insígnia." : "“" + l.frase + "” Time de " + l.tipo + ", no Ginásio em tempo real.",
    meta: lider ? "Ginásio de " + l.tipo + " · desafio de líder" : "Treinador · " + l.tipo,
    x, y: BOXES.y, w: BOXES.w, h: BOXES.h, doors: portas(x, BOXES.w), bairro: "ginasios", estilo: "box", numero: i + 1, roof: l.cor, roof2: escurece(l.cor), lider: l, treinador: lider ? undefined : l });
});

// ---------- a pista: a linha do meio, em casas da vila (sentido horário na tela: a reta principal vai para a direita) ----------
const TRACADO = [[56, 105], [80, 105], [110, 105], [140, 105], [156, 105], [168, 103], [176, 96], [179, 85], [178, 72], [180, 60], [179, 48],
  [176, 39], [169, 33], [158, 31], [135, 30], [105, 31], [78, 32], [55, 34], [38, 37], [27, 44], [21, 54], [22, 64], [30, 71], [41, 75], [48, 82],
  [46, 91], [37, 96], [26, 99], [18, 106], [18, 116], [26, 122], [38, 121], [46, 113]];
const RETA_Y = 105; // a linha do meio da reta principal
const ASFALTO = 2.6, ZEBRA = 0.6, MURO = 4.0, FAIXA_PISTA = 4.2, LIMITE_CARRO = 3.7; // meias larguras, em casas
const DS = 0.25; // a pista é amostrada a cada 1/4 de casa
const LARGADA = 120; // a coluna da linha de chegada
const PISTA = (() => {
  const P = TRACADO.map(([x, y]) => [x + OX, y + OY]), n = P.length, bruto = [];
  for (let i = 0; i < n; i++) { // Catmull-Rom fechada pelos pontos do traçado
    const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
    const passos = Math.max(4, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 0.1));
    for (let k = 0; k < passos; k++) {
      const t = k / passos, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      bruto.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  const pts = []; let acum = 0, alvo = 0; // reamostra com o passo fixo DS
  for (let i = 0; i < bruto.length; i++) {
    const a = bruto[i], b = bruto[(i + 1) % bruto.length], seg = Math.hypot(b[0] - a[0], b[1] - a[1]);
    while (alvo < acum + seg) { const q = (alvo - acum) / seg; pts.push([a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q]); alvo += DS; }
    acum += seg;
  }
  const N = pts.length, total = N * DS, ang = [], curva = [], ritmo = [];
  for (let i = 0; i < N; i++) { const a = pts[(i - 1 + N) % N], b = pts[(i + 1) % N]; ang.push(Math.atan2(b[1] - a[1], b[0] - a[0])); }
  const giro = (a, b) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
  const lado = []; // para que lado a pista vira ali: +1 direita (na tela), -1 esquerda
  for (let i = 0; i < N; i++) { const g = giro(ang[(i - 6 + N) % N], ang[(i + 6) % N]); curva.push(Math.abs(g) / (12 * DS)); lado.push(Math.sign(g)); }
  const lento = curva.map((k) => Math.max(0.42, Math.min(1, 1.15 - k * 5)));
  for (let i = 0; i < N; i++) { let m = 1; for (let j = 0; j < 48; j++) m = Math.min(m, lento[(i + j) % N] + j * 0.012); ritmo.push(m); } // freia antes da curva
  // os trechos de curva (zebra e brita): amostras seguidas com curvatura acima de 0,04 rad por casa
  const curvas = []; let ini = -1;
  const emCurva = (i) => curva[i % N] > 0.04;
  let comeco = 0; while (emCurva(comeco) && comeco < N) comeco++; // começa num trecho reto, para não partir uma curva no meio
  for (let k = 0; k <= N; k++) { const i = comeco + k; if (emCurva(i) && ini < 0) ini = i; else if (!emCurva(i) && ini >= 0) { curvas.push([ini - 4, i + 4, lado[Math.floor((ini + i) / 2) % N]]); ini = -1; } }
  return { pts, N, total, ang, curva, ritmo, curvas, lado };
})();
// a amostra da pista mais perto de um ponto (em casas) e a distância até ela
function pertoDaPista(x, y) {
  let m = 1e9, k = 0;
  for (let i = 0; i < PISTA.N; i += 2) { const p = PISTA.pts[i], d = (p[0] - x) * (p[0] - x) + (p[1] - y) * (p[1] - y); if (d < m) { m = d; k = i; } }
  return [k, Math.sqrt(m)];
}

// ---------- os enfeites (em casas da vila; deslocados para o mapa mais abaixo) ----------
const PASSARELAS = [[88, 22, 3, 18], [140, 22, 3, 18], [96, 100, 3, 10], [171, 59, 16, 3]]; // [x, y, w, h]: só as casas de pista viram passarela
// as arquibancadas: `lado` diz de que lado fica a pista (a cobertura fica do outro)
const ARQUIBANCADAS = [{ x: 58, y: 111, w: 30, h: 6, lado: "n" }, { x: 132, y: 111, w: 30, h: 6, lado: "n" }, { x: 84, y: 15, w: 30, h: 6, lado: "s" }, { x: 118, y: 15, w: 30, h: 6, lado: "s" },
  { x: 25, y: 107, w: 9, h: 5, lado: "s" }, { x: 5, y: 52, w: 9, h: 5, lado: "s" }];
const RODA = { x: 68, y: 19, w: 7, h: 2 }; // a roda-gigante da Fan Zone: o retângulo é a base; a roda gira em gp-vida.js
const HELI = { x: 150, y: 42, w: 12, h: 8 }; // o heliponto
const PREDIOS = [ // prédios de enfeite, sem porta
  { x: 100, y: 43, w: 9, h: 5, logo: "+", estilo: "pavilhao", roof: "#e10600", cruz: true },
  { x: 99, y: 55, w: 6, h: 9, estilo: "torre", roof: "#e10600" },
];
// tendas de enfeite (hospitality e lojinhas): [x, y, w, h, cor]
const TENDAS = [[114, 43, 5, 4, "#e10600"], [121, 43, 5, 4, "#1e5bc6"], [128, 43, 5, 4, "#ffb000"], [135, 43, 5, 4, "#00a19c"],
  [58, 68, 5, 4, "#e10600"], [64, 68, 5, 4, "#1e5bc6"], [136, 77, 5, 4, "#00a19c"], [143, 77, 5, 4, "#ff8000"], [150, 77, 5, 4, "#7a3cff"],
  [60, 122, 5, 4, "#e10600"], [66, 122, 5, 4, "#ffb000"], [72, 122, 5, 4, "#1e5bc6"], [156, 122, 5, 4, "#00a19c"], [162, 122, 5, 4, "#e10600"],
  [134, 6, 5, 4, "#ff5fa2"], [141, 6, 5, 4, "#2e9e4f"]];
const CAMINHOES = [[72, 84, "#1b2f6b"], [84, 84, "#dc0000"], [96, 84, "#ff8000"], [108, 84, "#00a19c"], [120, 84, "#0090ff"], [136, 84, "#e8e8e8"], [148, 84, "#006f62"]]; // 8 x 2 casas, atrás dos boxes
const FOODTRUCKS = [[152, 15, "#e8445a", "HOT DOG"], [157, 15, "#43a047", "TAPIOCA"], [152, 19, "#8e5ad8", "CALDO"], [78, 125, "#ff8a00", "PASTEL"], [83, 125, "#1e88e5", "AÇAÍ"], [170, 118, "#e8445a", "ESPETO"]];
const TELAO = { x: 60, y: 64, w: 6 }; // o telão da estante da Carreira, ao lado da Sede
const TORRE = { x: 86, y: 123, w: 2 }; // a torre de cronometragem (os recordes de volta da Corrida)
const PODIO = { x: 138, y: 120, w: 12, h: 4 }; // o pódio da F1 com os amigos (GET /api/corrida/estante)
const PAINEL = { x: 68, y: 22, w: 12 }; // o painel de LED da Fan Zone
const LAMPS = [[57, 50], [97, 50], [139, 50], [57, 66], [97, 66], [139, 75], [57, 87], [167, 87], [70, 109], [135, 109], [56, 131], [165, 131], [3, 12], [80, 12], [148, 12], [186, 36], [186, 62], [186, 88], [186, 112]];
const LAGOS = [{ x: 10, y: 84, rx: 5.2, ry: 7.2 }, { x: 154, y: 68, rx: 6.2, ry: 3.6 }];
// a praça do paddock: o logo pintado no chão (dá para andar em cima), os canteiros e os vasos
const LOGO_CHAO = { x: 102.5, y: 76.5, r: 5.2 }; // centro e raio, em casas
const CANTEIROS = [[70, 66, 8], [88, 66, 8], [108, 66, 8], [126, 66, 8], [90, 81, 6], [110, 81, 6], [58, 76, 6], [134, 130, 20], [100, 130, 20], [66, 130, 20], [133, 126, 3], [152, 126, 3]]; // [x, y, largura]: sebes de 1 casa de altura
const VASOS = [[81, 65], [84, 65], [119, 65], [122, 65], [96, 71], [109, 71], [96, 82], [109, 82], [137, 124], [150, 124], [90, 119], [129, 119], [61, 49], [68, 49], [84, 49], [89, 49]];
// miudezas de autódromo, uma casa cada: [x, y, tipo]. Só "cone" e "pombos" deixam passar.
const COISAS = [[70, 89, "pneus"], [71, 89, "pneus"], [132, 89, "pneus"], [133, 89, "pneus"], [66, 91, "barris"], [134, 92, "caixas"], [135, 92, "caixas"], [60, 99, "cone"], [61, 98, "cone"], [151, 98, "cone"], [152, 99, "cone"],
  [62, 73, "banco"], [66, 73, "banco"], [130, 73, "banco"], [134, 73, "banco"], [144, 63, "banco"], [163, 63, "banco"], [76, 128, "banco"], [92, 128, "banco"], [124, 128, "banco"], [160, 128, "banco"],
  [56, 80, "lixeira"], [112, 87, "lixeira"], [100, 120, "lixeira"], [30, 12, "lixeira"], [80, 21, "lixeira"], [145, 21, "caixas"],
  [136, 119, "som"], [151, 119, "som"], [117, 77, "som"], [20, 12, "banco"], [40, 12, "banco"], [60, 12, "banco"], [100, 12, "banco"], [116, 12, "banco"],
  [188, 60, "pneus"], [189, 60, "pneus"], [195, 74, "barris"], [188, 88, "caixas"], [106, 126, "banco"], [116, 126, "banco"]];
// os mastros com bandeira: [x, y, cor]
const BANDEIRAS = [[90, 109, "#e10600"], [100, 109, "#ffd23f"], [110, 109, "#1e5bc6"], [120, 109, "#f4f4f0"], [130, 109, "#2e9e4f"], [94, 70, "#e10600"], [111, 70, "#1e5bc6"], [136, 126, "#ffd23f"], [151, 126, "#e10600"], [3, 21, "#ffd23f"], [83, 22, "#e10600"], [149, 22, "#1e5bc6"]];
// onde tem um F1 parado para pilotar: [x, y] é a casa da traseira (o carro ocupa 2 x 1, com o bico para a direita)
const VAGAS_F1 = [[64, 92], [84, 73], [108, 123], [148, 20], [190, 93]];
const PORTAO_LESTE = { x: 182, y: 74, w: 4, h: 3 }; // o portão de serviço: por ele o F1 sai dos hangares para a pista
const RODOVIA = { y0: 142, y1: 146 }; // a rodovia do lado de fora, ao sul (só o trânsito passa)
const TERRENOS = []; // lotes vazios para jogos novos (chão "l", tapume e placa "EM BREVE"): jogo novo entra em LUGARES
const AUTODROMO = GAMES.find((g) => g.id === "corrida");
// aplica a margem do bosque à vila
const noMapa = (lista) => lista.splice(0, lista.length, ...lista.map(([x, y, ...r]) => [x + OX, y + OY, ...r]));
const desloca = (o) => { o.x += OX; o.y += OY; };
BAIRROS.forEach((b) => { b.placa = [b.placa[0] + OX, b.placa[1] + OY]; });
GAMES.forEach((g) => { g.x += OX; g.y += OY; g.doors = g.doors.map((d) => d + OX); g.doorY = g.y + g.h - 1; g.mats = g.doors.map((x) => [x, g.doorY + 1]); });
[...ARQUIBANCADAS, ...PREDIOS, RODA, HELI, TELAO, TORRE, PODIO, PAINEL, ...LAGOS, LOGO_CHAO, PORTAO_LESTE, ...TERRENOS].forEach(desloca);
[LAMPS, TENDAS, CAMINHOES, FOODTRUCKS, PASSARELAS, CANTEIROS, VASOS, COISAS, BANDEIRAS, VAGAS_F1].forEach(noMapa);

// ---------- o chão ----------
// g gramado, t árvore, c piso claro do paddock, a asfalto de serviço, q pit lane, W muro do pit, P pista (com a área de
// escape e o guard-rail; sólida a pé), k ligação do pit lane e do portão com a pista (só de carro), n passarela, e
// estacionamento, r rodovia, w água, f flores, h grama alta, m capacho da porta e l terreno.
const hash = (x, y, i = 0) => { let n = (x * 374761393 + y * 668265263 + i * 1274126177) | 0; n = (n ^ (n >>> 13)) * 1274126177; return ((n ^ (n >>> 16)) >>> 0); };
const ground = Array.from({ length: MH }, () => Array(MW).fill("t"));
const solid = Array.from({ length: MH }, () => Array(MW).fill(true));
const set = (x, y, t, s) => { if (x >= 0 && y >= 0 && x < MW && y < MH) { ground[y][x] = t; if (s != null) solid[y][x] = s; } };
const faixa = (x0, x1, y0, y1, t, s) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, t, s); };
const vfaixa = (x0, x1, y0, y1, t, s) => faixa(x0 + OX, x1 + OX, y0 + OY, y1 + OY, t, s); // em casas da vila
const solido = (x, y, w, h) => { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (xx >= 0 && yy >= 0 && xx < MW && yy < MH) solid[yy][xx] = true; };
for (let y = 0; y < VH; y++) for (let x = 0; x < VW; x++) { const cerca = x < 2 || y < 2 || x >= VW - 2 || y >= VH - 2; set(x + OX, y + OY, cerca ? "t" : "g", cerca); }
// a Fan Zone
vfaixa(3, 196, 11, 13, "c"); vfaixa(3, 160, 20, 22, "c");
vfaixa(160, 196, 14, 22, "e");                   // o estacionamento do norte
// o paddock
vfaixa(60, 168, 40, 41, "a");                    // a rua de serviço do norte
vfaixa(56, 168, 49, 51, "c");                    // o passeio do Ginásio e do Centro de Mídia
vfaixa(96, 107, 52, 64, "c");                    // o pátio da torre de controle
vfaixa(134, 173, 59, 61, "c");                   // a ligação com a passarela do leste
vfaixa(55, 168, 65, 87, "c");                    // a praça
vfaixa(142, 166, 63, 73, "g");                   // o jardim do lago
vfaixa(56, 168, 88, 89, "a");                    // a rua atrás dos boxes
vfaixa(56, 71, 90, 94, "c"); vfaixa(132, 168, 90, 94, "c");
vfaixa(60, 152, 95, 99, "q");                    // o pit lane
vfaixa(68, 144, 100, 100, "W", true);            // o muro do pit
// os hangares, a leste da pista
vfaixa(185, 197, 23, 131, "a");
// ao sul da reta: o passeio da cerca, a esplanada e o estacionamento
vfaixa(52, 197, 109, 110, "c");
vfaixa(52, 184, 117, 131, "c");
vfaixa(56, 150, 133, 139, "e");
vfaixa(2, VW - 3, RODOVIA.y0, RODOVIA.y1, "r", true);
for (const L of LAGOS) for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const dx = (x + 0.5 - L.x) / L.rx, dy = (y + 0.5 - L.y) / L.ry; if (dx * dx + dy * dy < 1) set(x, y, "w", true); }
// a pista: toda casa a menos de FAIXA_PISTA casas da linha do meio é sólida
const distPista = Array.from({ length: MH }, () => new Float32Array(MW).fill(99));
for (const [px_, py_] of PISTA.pts) for (let ty = Math.floor(py_ - 5); ty <= Math.ceil(py_ + 5); ty++) for (let tx = Math.floor(px_ - 5); tx <= Math.ceil(px_ + 5); tx++) {
  if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) continue;
  const d = Math.hypot(tx + 0.5 - px_, ty + 0.5 - py_); if (d < distPista[ty][tx]) distPista[ty][tx] = d;
}
for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (distPista[y][x] <= FAIXA_PISTA) set(x, y, "P", true);
// as passarelas: as casas de pista (e do muro do pit) no retângulo viram caminho; o tabuleiro é desenhado por cima dos carros
const PONTES = PASSARELAS.map(([x0, y0, w, h]) => {
  let a = Infinity, b = Infinity, c = -1, d = -1;
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if ("PW".includes(ground[y][x])) { set(x, y, "n", false); a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); }
  return { x: a, y: b, w: c - a + 1, h: d - b + 1, deitada: w > h };
}).filter((p) => p.w > 0);
// a entrada e a saída do pit lane e o portão do leste: sem guard-rail, só o F1 passa
const LIGACOES = [{ x: 62 + OX, y: 100 + OY, w: 6, h: 2 }, { x: 145 + OX, y: 100 + OY, w: 6, h: 2 }, PORTAO_LESTE];
for (const L of LIGACOES) for (let y = L.y; y < L.y + L.h; y++) for (let x = L.x; x < L.x + L.w; x++) if (distPista[y][x] > LIMITE_CARRO - 0.6 && "PgW".includes(ground[y][x])) set(x, y, "k", true);
for (const t of TERRENOS) { faixa(t.x, t.x + t.w - 1, t.y, t.y + t.h - 1, "l", true); t.placa = [t.x + (t.w >> 1), t.y + t.h]; }
for (const g of GAMES) { solido(g.x, g.y, g.w, g.h); for (const [mx, my] of g.mats) set(mx, my, "m", false); }
// os carros nos estacionamentos: [x, y, cor], cada um em 1 x 2 casas
const CORES_CARRO = ["#d8d8dc", "#2b2f37", "#c0392b", "#2c6fd6", "#f2f2ee", "#7a7f88", "#1e7a4c", "#e0a21b"];
const ESTACIONADOS = [];
for (const fila of [133, 137]) for (let x = 58; x <= 148; x++) if (hash(x, fila, 31) % 5 && x % 12 !== 0) ESTACIONADOS.push([x + OX, fila + OY, CORES_CARRO[hash(x, fila, 32) % CORES_CARRO.length]]);
for (const fila of [14, 18]) for (let x = 164; x <= 194; x++) if (hash(x, fila, 31) % 5 && x % 12 !== 0) ESTACIONADOS.push([x + OX, fila + OY, CORES_CARRO[hash(x, fila, 32) % CORES_CARRO.length]]);
for (const a of [...ARQUIBANCADAS, ...PREDIOS, RODA, HELI, PODIO]) solido(a.x, a.y, a.w, a.h);
for (const [x, y, w] of CANTEIROS) solido(x, y, w, 1);
for (const [x, y] of VASOS) solid[y][x] = true;
for (const [x, y, w, h] of TENDAS) solido(x, y, w, h);
for (const [x, y] of CAMINHOES) solido(x, y, 8, 2);
for (const [x, y] of FOODTRUCKS) solido(x, y, 3, 2);
for (const [x, y] of ESTACIONADOS) solido(x, y, 1, 2);
for (const [x, y] of VAGAS_F1) solido(x, y, 2, 1);
for (const o of [TELAO, TORRE, PAINEL]) solido(o.x, o.y, o.w, 1);
for (const [x, y, tipo] of COISAS) if (tipo !== "cone" && tipo !== "pombos") solid[y][x] = true;
for (const [x, y] of [...LAMPS, ...BANDEIRAS, ...BAIRROS.map((b) => b.placa)]) solid[y][x] = true;
// as árvores: o bosque em volta do autódromo e algumas no gramado (nunca em cima do caminho nem na porta de um prédio)
const pertoDePredio = (x, y) => GAMES.some((g) => x >= g.x - 1 && x <= g.x + g.w && y >= g.y - 1 && y <= g.y + g.h || g.mats.some(([mx, my]) => Math.abs(mx - x) + Math.abs(my - y) < 3));
const bosque = (x0, x1, y0, y1, dens) => { for (let y = y0 + OY; y <= y1 + OY; y++) for (let x = x0 + OX; x <= x1 + OX; x++) if (ground[y][x] === "g" && !solid[y][x] && hash(x, y, 77) % 100 < dens && !pertoDePredio(x, y)) set(x, y, "t", true); };
bosque(2, VW - 3, 2, 4, 85);        // atrás das tendas
bosque(148, 196, 5, 9, 60);
bosque(2, 16, 24, 141, 55);         // a oeste, em volta do lago
bosque(17, 50, 124, 141, 70);
bosque(151, 197, 132, 141, 70);
bosque(2, VW - 3, 140, 141, 90);    // a fileira antes da rodovia
bosque(2, VW - 3, 147, VH - 3, 90);
bosque(198, VW - 3, 2, VH - 3, 90);
bosque(24, 42, 46, 66, 22);         // o miolo do S
bosque(24, 40, 80, 92, 30);
bosque(27, 38, 113, 117, 40);       // a ilha do grampo
bosque(72, 79, 43, 47, 35); bosque(96, 99, 43, 47, 40); bosque(110, 113, 43, 47, 30);
bosque(142, 166, 52, 57, 30); bosque(142, 166, 63, 73, 16); bosque(160, 170, 44, 48, 35);
bosque(136, 141, 53, 57, 30);
// as flores do jardim e da frente dos pavilhões
for (const [x0, x1, y0, y1] of [[144, 164, 64, 72], [77, 79, 52, 56], [136, 140, 62, 64]]) for (let y = y0 + OY; y <= y1 + OY; y++) for (let x = x0 + OX; x <= x1 + OX; x++) if (ground[y][x] === "g" && !solid[y][x] && hash(x, y, 5) % 4 === 0) set(x, y, "f");
// a grama alta, em frente ao Ginásio (public/vila/mato.js): h, dá para andar
vfaixa(MatoAlto.GRAMA.x, MatoAlto.GRAMA.x + MatoAlto.GRAMA.w - 1, MatoAlto.GRAMA.y, MatoAlto.GRAMA.y + MatoAlto.GRAMA.h - 1, "h", false);

const matAt = (x, y) => GAMES.find((g) => g.mats.some(([mx, my]) => mx === x && my === y));
const buildingAt = (x, y) => GAMES.find((g) => x >= g.x && x < g.x + g.w && y >= g.y && y < g.y + g.h);
const walkable = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH && !solid[y][x];
// o F1 anda na pista (até o guard-rail, e por baixo das passarelas), nas ligações e em todo chão livre
function carroPassa(x, y) {
  const tx = Math.floor(x), ty = Math.floor(y);
  if (tx < 1 || ty < 1 || tx >= MW - 1 || ty >= MH - 1) return false;
  const t = ground[ty][tx];
  if (t === "k") return true;
  if (t === "P" || t === "n") return pertoDaPista(x, y)[1] <= LIMITE_CARRO;
  return !solid[ty][tx];
}
