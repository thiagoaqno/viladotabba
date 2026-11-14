// Corrida da Galera — o capacete da PISTA nos bonecos com esqueleto (os mecânicos do box, mecanicos.js, e os pilotos da festa do pódio,
// podio-pilotos.js): pedido do Thiago, 2026-11-13, "a equipe dos boxes e os bonecos que comemoram usarem o mesmo capacete que o piloto". O
// boneco (f1/podio/piloto.glb) vinha com um capacete próprio (`casco`, `vedacao` e `viseira`); aqui ele some e entra o de f1-piloto.js (a mesma
// forma, a mesma pintura de f1-capacetes.js e a mesma viseira), preso no osso da cabeça: segue a cabeça em toda pose e comemoração.
// A posição e o tamanho saem do capacete original do boneco, medido no repouso: o novo ocupa o mesmo lugar, com a mesma altura.
import * as THREE from "three";
import * as Piloto from "./f1-piloto.js";
const { geometriasDoCapacete, materialDaViseira, materialDoCapacete } = Piloto;

const m4 = new THREE.Matrix4(), m5 = new THREE.Matrix4(), caixa = new THREE.Box3(), centro = new THREE.Vector3(), tam = new THREE.Vector3(), q = new THREE.Quaternion();
// g: o boneco clonado, ainda no repouso (antes de qualquer pose). cap: { c1, c2, numero, robo (o capacete do piloto robô: capacetePorSigla), proprio
// (mods.capacete de quem joga) }. Devolve o grupo do capacete (ou null se o boneco não tem cabeça ou capacete para medir).
export function vestirCapacete(g, cap = {}) {
  let casco = null, cabeca = null;
  g.traverse((o) => { if (o.isSkinnedMesh && o.name === "casco") casco = o; if (o.isBone && o.name === "Head") cabeca = o; });
  if (!casco || !cabeca) return null;
  g.updateMatrixWorld(true);
  const inv = m4.copy(g.matrixWorld).invert();
  // o capacete original, no espaço do boneco
  casco.geometry.computeBoundingBox(); caixa.copy(casco.geometry.boundingBox).applyMatrix4(m5.multiplyMatrices(inv, casco.matrixWorld));
  caixa.getCenter(centro); caixa.getSize(tam);
  // o da pista: centrado na origem, a frente em −z; o boneco olha para +z, então gira meia volta
  const G = geometriasDoCapacete(); G.capacete.computeBoundingBox(); const gb = G.capacete.boundingBox, gc = gb.getCenter(new THREE.Vector3()), gt = gb.getSize(new THREE.Vector3());
  const s = tam.y / Math.max(1e-6, gt.y);
  const grupo = new THREE.Group(); grupo.name = "capacete-pista";
  const mat = materialDoCapacete(cap.c1 || "#e10600", cap.c2 || "#ffffff", cap.numero ?? null, cap.robo || null, cap.proprio || null);
  const casca = new THREE.Mesh(G.capacete, mat), vis = new THREE.Mesh(G.viseira, materialDaViseira(cap.proprio && cap.proprio.viseira));
  const pecas = [casca, vis];
  if (G.moldura && Piloto.materialDaMoldura) pecas.push(new THREE.Mesh(G.moldura, Piloto.materialDaMoldura())); // a borda e as dobradiças da viseira (quando o f1-piloto.js já tem)
  for (const m of pecas) { m.castShadow = false; m.receiveShadow = false; m.position.copy(gc).negate(); grupo.add(m); }
  // a pose do grupo no espaço do boneco e, dali, no espaço do osso da cabeça (que é quem carrega o capacete daqui em diante)
  const noBoneco = new THREE.Matrix4().compose(centro, q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI), new THREE.Vector3(s, s, s));
  const cabecaNoBoneco = new THREE.Matrix4().multiplyMatrices(inv, cabeca.matrixWorld);
  new THREE.Matrix4().copy(cabecaNoBoneco).invert().multiply(noBoneco).decompose(grupo.position, grupo.quaternion, grupo.scale);
  cabeca.add(grupo);
  g.traverse((o) => { if (o.isSkinnedMesh && (o.name === "casco" || o.name === "vedacao" || o.name === "viseira")) o.visible = false; }); // (o capacete antigo do boneco sai)
  return grupo;
}
