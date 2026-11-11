// Catar (Lusail) — a corrida noturna: o circuito tem iluminação permanente da Musco desde 2007, na época o maior projeto de iluminação esportiva permanente do mundo (Wikipedia, "Lusail International Circuit"; Autosport, "Qatar ready for major night test":
// uma área iluminada como 70 campos de futebol), trocada por LED em 2021. As fontes divergem no número de estruturas (de mais de mil a mais de 3 600) e não dão a altura nem o desenho dos postes: o poste é o das fotos de transmissão, um mastro fino
// com um quadro de seis painéis de LED (três por duas fileiras) virado para a pista, bem junto da área de escape e dos dois lados; a altura de 27 m e o espaçamento de 50 m entre postes são ESTIMADOS das fotos.
// Mastros, cabeças, painéis e brilhos são 4 InstancedMesh para a pista inteira; cada torre só nasce onde `livre` e `ocupado` deixam, e a luz de verdade é a de kit/luz-postes.js (um cone macio no asfalto por torre).
import * as THREE from "three";
import { canvasTex, M } from "../../cena.js";
import { livre, ocupado } from "../comum.js";
import { soDeNoite } from "./base.js";
import { nivelDoChao } from "./chao.js";
import { registrarLuz, luzDaPista, raioDeCobertura } from "../luz-postes.js";

// O mastro (27 m = 130 u) e a cabeça (12,5 × 5,8 m) são estimados das fotos de transmissão. Cada torre fica a `recuo` da borda do asfalto (14,6 m) ou 2 m atrás da barreira mapeada (`tr.murosEscape`) quando ela está mais longe (nunca dentro da faixa de escape);
// o espaçamento é de 40 estações (240 u = 50 m). A base pousa no chão que se vê (chao.js) e a luz mira o eixo da pista, com o alcance de `raioDeCobertura` (que lê a largura W).
export function torresDeLuz(tr, add, { gap = 40, recuo = 70, alto = 130, de = 0, ate = 1 } = {}) {
  const { pts, n, W } = tr, lista = [], ultimo = { 1: -1e9, "-1": -1e9 };
  for (let i = Math.floor(de * n) + 6; i < Math.floor(ate * n); i += 6) for (const s of [1, -1]) {
    if (i - ultimo[s] < gap) continue;
    const p = pts[i % n], mu = tr.latMuro(s, i % n), lat = Math.max(W / 2 + recuo, Number.isFinite(mu) ? mu + 10 : 0), x = p.x + p.nx * s * lat, z = p.y + p.ny * s * lat;
    if (!livre(tr, x, z, lat - W / 2 - 10) || ocupado(tr, x, z, i % n)) continue;
    ultimo[s] = i; lista.push({ x, z, y: nivelDoChao(tr, x, z) - 0.5, s, nx: p.nx, ny: p.ny, ph: p.h, lat });
    tr.reservado ||= []; tr.reservado.push([x, z, 16]);
  }
  if (!lista.length) return 0;
  const lampadas = canvasTex(192, 96, (c, w, h) => {
    c.fillStyle = "#14171b"; c.fillRect(0, 0, w, h);
    for (let a = 0; a < 4; a++) for (let b = 0; b < 8; b++) { c.fillStyle = "#e9f2ff"; c.fillRect(2 + b * 23.5, 2 + a * 23.5, 19.5, 19.5); c.fillStyle = "#ffffff"; c.fillRect(6 + b * 23.5, 6 + a * 23.5, 11.5, 11.5); }
  }, false);
  const brilho = canvasTex(64, 64, (c, w, h) => { const g = c.createRadialGradient(32, 32, 2, 32, 32, 32); g.addColorStop(0, "rgba(255,244,214,0.95)"); g.addColorStop(0.35, "rgba(255,232,170,0.4)"); g.addColorStop(1, "rgba(255,220,150,0)"); c.fillStyle = g; c.fillRect(0, 0, w, h); }, false);
  const aditivo = (map, o = {}) => new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, ...o });
  const mastroGeo = new THREE.CylinderGeometry(1.3, 2.7, alto, 8); mastroGeo.translate(0, alto / 2, 0);
  const cabecaGeo = new THREE.BoxGeometry(60, 28, 2.4), painelGeo = new THREE.PlaneGeometry(18, 12), brilhoGeo = new THREE.PlaneGeometry(84, 52);
  const k = lista.length;
  const mastros = new THREE.InstancedMesh(mastroGeo, M(0xc9cdd1, { roughness: 0.5, metalness: 0.4 }), k);
  const cabecas = new THREE.InstancedMesh(cabecaGeo, M(0x2a2d33, { roughness: 0.5, metalness: 0.4 }), k);
  const paineis = new THREE.InstancedMesh(painelGeo, new THREE.MeshBasicMaterial({ map: lampadas, fog: false, userData: { bloom: 2.2 } }) /* userData.bloom: as lâmpadas brilham no pós (pos.js) */, k * 6);
  const brilhos = new THREE.InstancedMesh(brilhoGeo, aditivo(brilho, { fog: false }), k);
  const o = new THREE.Object3D(), cab = new THREE.Matrix4(), local = new THREE.Matrix4();
  o.rotation.order = "YXZ";
  lista.forEach((t, j) => {
    const { x, y, z, s, nx, ny, ph } = t; // (o alvo da luz: antes a `recuo + 70` da torre, a 10 u do eixo de uma pista de 120 u; agora o eixo mais 6 u)
    o.position.set(x, y, z); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1); o.updateMatrix(); mastros.setMatrixAt(j, o.matrix);
    o.position.set(x, y + alto + 6, z); o.rotation.set(0.3, Math.atan2(-nx * s, -ny * s), 0); o.updateMatrix(); cab.copy(o.matrix); cabecas.setMatrixAt(j, cab);
    [-1, 0, 1].forEach((d, e) => [-1, 1].forEach((f, g) => paineis.setMatrixAt(j * 6 + e * 2 + g, cab.clone().multiply(local.makeTranslation(d * 19.5, f * 6.8, 1.4)))));
    brilhos.setMatrixAt(j, cab.clone().multiply(local.makeTranslation(0, 0, 3.2)));
    // de onde a luz sai (a cabeça) e para onde ela aponta: o asfalto, a uns 45 do eixo da pista (para o lado de dentro)
    t.cabeca = [x, y + alto + 6, z]; t.alvo = [x - nx * s * (t.lat + 6), ph, z - ny * s * (t.lat + 6)];
  });
  mastros.castShadow = cabecas.castShadow = true; mastros.name = `${tr.id}-holofotes`;
  for (const m of [mastros, cabecas, paineis]) add(m);
  brilhos.frustumCulled = false; brilhos.renderOrder = 4; soDeNoite(tr, add(brilhos));
  // A luz de verdade: cada torre lança um cone macio no asfalto (kit/luz-postes.js), com o brilho do especular onde o asfalto brilha.
  luzDaPista(tr, { media: 15 });
  const cobrir = raioDeCobertura(gap * 6, W); // gap está em pontos da linha central (6 de distância cada)
  for (const t of lista) registrarLuz(tr, { x: t.cabeca[0], y: t.cabeca[1] - 4, z: t.cabeca[2], alvo: t.alvo, cobrir, cor: 0xf4f8ff });
  tr.holofotes = k;
  return k;
}
