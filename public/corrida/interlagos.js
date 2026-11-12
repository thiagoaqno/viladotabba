// Interlagos: o que só o autódromo tem. O resto (zebras, escape, painéis, postos, placas, passarelas, serra, som e vida) é
// do kit, na configuração de gps/interlagos.js. A pista é a de verdade (br-1940, 4.309 m, anti-horária), em escala real: o lago, a
// caixa-d'água e o prédio dos boxes ficam onde o OpenStreetMap os mapeia (© colaboradores do OpenStreetMap, ODbL), no mesmo
// mundo da pista. Adaptada à escala antiga (scale 2,539 em vez de 3,9): as coordenadas reais foram multiplicadas por 0,651.
import * as THREE from "three";
import { canvasTex, M } from "./cena.js";
import { marcaTex } from "./kit/marcas.js";
import { livre, sorteio } from "./kit/comum.js";

// o lago a nordeste da Junção (OSM, natural=water, simplificado de 263 para 38 pontos): [x, z] no mundo do jogo
const LAGO = [[2657, 1080], [2674, 1092], [2753, 1089], [2777, 1042], [2842, 1016], [2855, 958], [2883, 919], [2884, 875], [2945, 803], [3040, 594], [3036, 566], [3070, 545], [3149, 361], [3155, 342], [3139, 311], [3156, 285], [3124, 238], [3067, 242], [3051, 222], [3019, 208], [2956, 213], [2877, 237], [2828, 281], [2785, 355], [2738, 477], [2736, 523], [2710, 598], [2646, 692], [2578, 863], [2581, 976], [2557, 1061], [2573, 1064], [2596, 1040], [2614, 1045], [2613, 1065], [2579, 1085], [2590, 1098], [2637, 1057]];
const CAIXA_DAGUA = [822, 639]; // a torre de água da Sabesp, a noroeste da subida dos boxes
const dentroDoLago = (x, z, folga = 0) => { // o ponto dentro do polígono do lago (com uma folga em volta)
  let dentro = false;
  for (let i = 0, j = LAGO.length - 1; i < LAGO.length; j = i++) {
    const [xi, zi] = LAGO[i], [xj, zj] = LAGO[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) dentro = !dentro;
  }
  return dentro || LAGO.some(([a, b]) => Math.hypot(a - x, b - z) < folga);
};

// o antes: o lago, a caixa-d'água e São Paulo em volta (prédios para as fachadas do kit)
export function cenarioInterlagos(tr, { add, hAt, blds, aguaTex }) {
  tr.arquibancadas ||= [];
  // o lago, do tamanho e no lugar do real: a água fica no nível do ponto mais baixo da margem, então o terreno mais alto a esconde (sem água boiando)
  const nivel = Math.min(...LAGO.map(([x, z]) => hAt(x, z))) + 0.6;
  const forma = new THREE.Shape(LAGO.map(([x, z]) => new THREE.Vector2(x, -z)));
  const geo = new THREE.ShapeGeometry(forma), uv = geo.attributes.uv, pos = geo.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / 700, pos.getY(i) / 700); // a textura da água a cada 700 unidades
  const mat = new THREE.MeshStandardMaterial({ map: aguaTex("#2f7f9a"), roughness: 0.15, metalness: 0.25, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }); tr.agua.push(mat);
  const lago = add(new THREE.Mesh(geo, mat)); lago.rotation.x = -Math.PI / 2; lago.position.y = nivel; lago.name = "interlagos-lago";
  const cx = LAGO.reduce((s, p) => s + p[0], 0) / LAGO.length, cz = LAGO.reduce((s, p) => s + p[1], 0) / LAGO.length;
  tr.reservado.push([cx, cz, 340]); tr.lagoInterlagos = { x: cx, y: cz };
  // a torre de água: o pilar e o tanque (uns 24 m de altura)
  const [tx, tz] = CAIXA_DAGUA;
  if (livre(tr, tx, tz, 90)) {
    const gr = new THREE.Group(), concreto = M(0xdcd9d0, { roughness: 0.85 }), tanque = M(0x2f6fb0, { roughness: 0.6 }), faixa = M(0xffffff, { roughness: 0.6 });
    const pilar = new THREE.Mesh(new THREE.CylinderGeometry(9, 12, 70, 14), concreto); pilar.position.y = 35; pilar.castShadow = true; gr.add(pilar);
    const corpo = new THREE.Mesh(new THREE.CylinderGeometry(34, 26, 34, 18), tanque); corpo.position.y = 85; corpo.castShadow = true; gr.add(corpo);
    const aro = new THREE.Mesh(new THREE.CylinderGeometry(34.5, 34.5, 5, 18), faixa); aro.position.y = 97; gr.add(aro);
    gr.position.set(tx, hAt(tx, tz), tz); add(gr); tr.reservado.push([tx, tz, 90]);
  }
  // São Paulo em volta: casas e prédios, mais altos quanto mais longe do autódromo, fora do lago e a mais de uns 60 m da pista
  const r = sorteio(7731), mundo = tr.t.world;
  for (let k = 0; k < 260; k++) {
    const x = -1300 + r() * (mundo + 2600), y = -1300 + r() * (mundo + 2600);
    if (!livre(tr, x, y, 700) || dentroDoLago(x, y, 170)) continue;
    const longe = Math.min(1, Math.hypot(x - mundo / 2, y - mundo / 2) / (mundo * 0.75)), andares = 8 + Math.floor(r() * 12 * (0.4 + longe));
    blds.push({ x, y, h: hAt(x, y), s: 1, sx: 80 + r() * 70, sy: andares * 30, sz: 80 + r() * 70, dy: 0.5, r: r() * 3 });
  }
}

// o depois, por cima dos enfeites: o prédio dos boxes com a torre de controle, do lado de dentro da reta (o oposto das arquibancadas),
// atrás das garagens do corredor dos boxes (que ficam em volta da linha de chegada)
export function depoisInterlagos(tr, { add, hAt }) {
  const { pts, n, W } = tr, i = Math.floor(n * 0.0097), p = pts[i], d = W / 2 + 115, x = p.x - p.nx * d, z = p.y - p.ny * d; // (lado -1: para dentro da pista)
  const COMP = 585, FUNDO = 46;
  if (!livre(tr, x, z, 70)) return;
  const g = new THREE.Group(); g.position.set(x, hAt(x, z), z); g.rotation.y = Math.atan2(-p.ty, p.tx); add(g); // x do grupo = ao longo da reta (para a frente), z = para a pista
  const branco = M(0xe9e8e2, { roughness: 0.85 }), verde = M(0x0b7a43), amarelo = M(0xffcf32), vidro = M(0x2a3a48, { roughness: 0.2, metalness: 0.4 });
  const portas = canvasTex(1024, 64, (c, w, h) => { c.fillStyle = "#e9e8e2"; c.fillRect(0, 0, w, h); for (let k = 0; k < 32; k++) { c.fillStyle = "#4a5560"; c.fillRect(8 + k * 31, 10, 24, 44); c.fillStyle = "#ffffff30"; c.fillRect(8 + k * 31, 10, 24, 6); } });
  const fachada = new THREE.MeshStandardMaterial({ map: portas, roughness: 0.8 });
  const bloco = new THREE.Mesh(new THREE.BoxGeometry(COMP, 34, FUNDO), [branco, branco, branco, branco, fachada, branco]); bloco.position.y = 17; bloco.castShadow = true; g.add(bloco);
  const camarotes = new THREE.Mesh(new THREE.BoxGeometry(COMP - 20, 30, FUNDO - 6), [branco, branco, branco, branco, vidro, branco]); camarotes.position.set(0, 49, -2); camarotes.castShadow = true; g.add(camarotes);
  const faixaV = new THREE.Mesh(new THREE.BoxGeometry(COMP - 16, 5, FUNDO - 4), verde); faixaV.position.set(0, 66, -2); g.add(faixaV);
  const faixaA = new THREE.Mesh(new THREE.BoxGeometry(COMP - 16, 3, FUNDO - 4), amarelo); faixaA.position.set(0, 70, -2); g.add(faixaA);
  const marca = new THREE.Mesh(new THREE.PlaneGeometry(256, 20), new THREE.MeshBasicMaterial({ map: marcaTex("gpsp", 1024, 80) })); marca.position.set(0, 82, FUNDO / 2 - 2 + 0.6); g.add(marca);
  const torre = new THREE.Mesh(new THREE.BoxGeometry(34, 120, 34), branco); torre.position.set(-200, 60, -2); torre.castShadow = true; g.add(torre);
  const cabine = new THREE.Mesh(new THREE.BoxGeometry(46, 22, 46), vidro); cabine.position.set(-200, 130, -2); g.add(cabine);
  const topo = new THREE.Mesh(new THREE.BoxGeometry(50, 3, 50), verde); topo.position.set(-200, 143, -2); g.add(topo);
  tr.reservado.push([x, z, 150]); tr.boxesInterlagos = { x, y: z };
}
