// Catar (Lusail International Circuit) — as peças só desta pista (nada daqui é do kit compartilhado), ligadas por gps/catar.js. Por ora: o chão junto da pista com a base sólida (./kit/catar/chao.js)
// e o conserto do que o kit de ambiente deixa flutuando (`consertarAmbiente`); o resto do cenário continua sendo o do GP simples (kit/gp-simples.js) até o cenário fino do Catar.
import * as THREE from "three";
import { M } from "./cena.js";
import { beiradaSolida } from "./kit/catar/chao.js";

export function cenarioCatar(tr, ctx) {
  beiradaSolida(tr, ctx.add); // a base sólida da pista e a areia no nível do asfalto, dos dois lados (kit/catar/chao.js)
}

/**
 * O `kit/ambiente.js` desenha dois tipos de peça que, no cenário do Catar (sem cerca), ficam no ar (o kit não muda; aqui só se mexe nas instâncias já montadas, em `depois`, antes de `fundir`):
 * 1. o mastro da bandeira (`caixa(metal, x, h + 31, z, 1, 38, 1)`, 38 u de altura de h + 12 até h + 50): foi desenhado para ficar preso na cerca, que aqui não existe, então o pé ficava 12 u (2,5 m) acima do chão;
 *    o mastro passa a descer até o chão (h - 1, um pouco enterrado na areia). A bandeira, em h + 42,5 e h + 47, continua no mesmo lugar;
 * 2. a placa de 100 e 50 m (`o.h + 22 × escala`, 13 × 9 × 0,8 u vezes a escala), sem poste: ganha um poste de metal até o chão.
 */
export function consertarAmbiente(tr, add) {
  const E = tr.escala ?? 1, nome = `${tr.id}-ambiente-gp`, p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3(), m = new THREE.Matrix4(), d = new THREE.Object3D();
  const perto = (a, b) => Math.abs(a - b) < 0.02;
  const postes = [];
  let mastros = 0;
  tr.grp.traverse((o) => {
    if (!o.isInstancedMesh || o.name !== nome) return;
    for (let k = 0; k < o.count; k++) {
      o.getMatrixAt(k, m); m.decompose(p, q, s);
      if (perto(s.x, 1) && perto(s.y, 38) && perto(s.z, 1)) { // o mastro: de h + 12 a h + 50 passa a h - 1 a h + 50
        const h = p.y - 31;
        d.position.set(p.x, h + 24.5, p.z); d.quaternion.copy(q); d.scale.set(1, 51, 1); d.updateMatrix(); o.setMatrixAt(k, d.matrix); mastros++;
      } else if (perto(s.x, 13 * E) && perto(s.y, 9 * E) && perto(s.z, 0.8)) { // a placa de distância
        const h = p.y - 22 * E, base = p.y - s.y / 2;
        if (base - h > 1) postes.push({ x: p.x, z: p.z, h, alto: base - h + 1.5, q: q.clone() });
      }
    }
    o.instanceMatrix.needsUpdate = true;
  });
  if (postes.length) {
    const im = add(new THREE.InstancedMesh(new THREE.BoxGeometry(0.8, 1, 0.8), M(0x697780), postes.length));
    postes.forEach((o, k) => { d.position.set(o.x, o.h - 1 + o.alto / 2, o.z); d.quaternion.copy(o.q); d.scale.set(1, o.alto, 1); d.updateMatrix(); im.setMatrixAt(k, d.matrix); });
    im.name = `${tr.id}-postes-placas`; im.receiveShadow = true;
  }
  tr.consertoCT = { mastros, postes: postes.length };
}

export function depoisCatar(tr, ctx) {
  consertarAmbiente(tr, ctx.add);
}
