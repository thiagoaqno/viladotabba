// Abu Dhabi (Yas Marina Circuit) — as peças só desta pista (nada daqui é do kit compartilhado), ligadas por gps/abudhabi.js. Do GP simples (kit/gp-simples.js) fica só a base
// técnica (asfalto, zebras, brita, grid, o corredor e as garagens dos boxes, a tribuna da reta e os painéis da barreira); o cenário é o de Yas, pelas fotos e pela posição real
// de cada coisa (passada da latitude e longitude para o mundo do jogo pelo encaixe da linha real, ferramentas/pista-real.js): o hotel W com a casca de LEDs por cima da pista
// (./kit/abudhabi/hotel.js), a marina com os iates (marina.js), o prédio dos boxes com o terraço de toldos (boxes.js) e o teto vermelho do Ferrari World ao longe (ferrari.js).
// Mais o chão junto da pista com a base sólida (./kit/abudhabi/chao.js) e o conserto do que o kit de ambiente deixa flutuando (`consertarAmbiente`).
// Adaptado de catar.js (o mesmo problema: sem cerca, o mastro das bandeiras e as placas ficam no ar). Aqui há mais um: com `muros` o kit põe painéis, bandeiras e placas junto da barreira de cada ponto,
// a até 290 u da borda, mas na altura da PISTA (`p.h`) e não na do chão, que a essa distância já desceu: o conserto baixa cada peça até o chão do lugar dela.
import * as THREE from "three";
import { M } from "../cena.js";
import { beiradaSolida } from "./kit/abudhabi/chao.js";
import { hotelW } from "./kit/abudhabi/hotel.js";
import { marinaYas } from "./kit/abudhabi/marina.js";
import { predioDosBoxes } from "./kit/abudhabi/boxes.js";
import { ferrariWorld } from "./kit/abudhabi/ferrari.js";
import { ligarNoite } from "./kit/bahrein/base.js";

export const BANDEIRA = [0x00732f, 0xef3340]; // verde em cima, vermelho embaixo (as bandeiras do kit/ambiente.js: de cima h + 47, de baixo h + 42,5)

export function cenarioAbuDhabi(tr, ctx) {
  beiradaSolida(tr, ctx.add); // a base sólida da pista e a areia no nível do asfalto, dos dois lados (kit/abudhabi/chao.js)
  tr.hotelAD = hotelW(tr, ctx.add);
  marinaYas(tr, ctx.add);
  predioDosBoxes(tr, ctx.add);
  ferrariWorld(tr, ctx.add);
}

/**
 * O `kit/ambiente.js` põe, a cada ponto, peças na altura da pista (`h = p.h`), no lugar da barreira (`tr.latMuro`). Aqui (o kit não muda; só se mexe nas instâncias já montadas, em `depois`, antes de `fundir`):
 * 1. o mastro da bandeira (`caixa(metal, x, h + 31, z, 1, 38, 1)`, de h + 12 a h + 50) foi desenhado para ficar preso na cerca, que aqui não existe (`escapeLivre`): passa a descer até o chão;
 * 2. as bandeiras (h + 47 e h + 42,5) e os painéis (`h + 7 × escala`) descem junto com o chão do lugar (`tr.chao`), sem mudar de tamanho: a barreira mapeada passa de 73 u da borda em boa parte da volta, e ali o chão já está
 *    abaixo da altura da pista (até uns 4 u, 0,9 m); a base do painel fica 0,2 u dentro da areia da fita (que está 0,7 u acima do chão analítico);
 * 3. a placa de 100 e 50 m (`h + 22 × escala`, 13 × 9 × 0,8 u vezes a escala), sem poste: desce e ganha um poste de metal até o chão.
 */
export function consertarAmbiente(tr, add) {
  const E = tr.escala ?? 1, nome = `${tr.id}-ambiente-gp`, p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3(), m = new THREE.Matrix4(), d = new THREE.Object3D();
  const perto = (a, b) => Math.abs(a - b) < 0.02, AREIA = 0.7; // AREIA: a altura da fita de areia sobre o chão analítico (kit/abudhabi/chao.js)
  const postes = [], r = { mastros: 0, bandeiras: 0, paineis: 0, placas: 0, desceMax: 0 };
  tr.grp.traverse((o) => {
    if (!o.isInstancedMesh || o.name !== nome) return;
    const cima = o.material?.color?.getHex?.() === BANDEIRA[0];
    for (let k = 0; k < o.count; k++) {
      o.getMatrixAt(k, m); m.decompose(p, q, s);
      const g = tr.chao(p.x, p.z), poe = (y, sy) => { d.position.set(p.x, y, p.z); d.quaternion.copy(q); d.scale.set(s.x, sy, s.z); d.updateMatrix(); o.setMatrixAt(k, d.matrix); };
      if (perto(s.x, 1) && perto(s.y, 38) && perto(s.z, 1)) { // o mastro: de h + 12 a h + 50 passa a ir de g - 1 (um pouco enterrado na areia) a g + 50 (o topo desce com o resto: h - g)
        poe(g + 24.5, 51); r.mastros++; r.desceMax = Math.max(r.desceMax, p.y - 31 - g);
      } else if (perto(s.x, 15) && perto(s.y, 4.5) && perto(s.z, 0.5)) { // as duas faixas da bandeira
        const h = p.y - (cima ? 47 : 42.5); poe(p.y - (h - g), s.y); r.bandeiras++;
      } else if (perto(s.x, 30 * E) && perto(s.y, 9 * E) && perto(s.z, 0.6)) { // o painel de patrocinador (a base em h + 2,5 × escala)
        poe(g + AREIA - 0.2 + s.y / 2, s.y); r.paineis++;
      } else if (perto(s.x, 13 * E) && perto(s.y, 9 * E) && perto(s.z, 0.8)) { // a placa de distância
        const h = p.y - 22 * E, y = p.y - (h - g), base = y - s.y / 2;
        poe(y, s.y); r.placas++;
        if (base - g > 1) postes.push({ x: p.x, z: p.z, h: g, alto: base - g + 1.5, q: q.clone() });
      }
    }
    o.instanceMatrix.needsUpdate = true;
  });
  if (postes.length) {
    const im = add(new THREE.InstancedMesh(new THREE.BoxGeometry(0.8, 1, 0.8), M(0x697780), postes.length));
    postes.forEach((o, k) => { d.position.set(o.x, o.h - 1 + o.alto / 2, o.z); d.quaternion.copy(o.q); d.scale.set(1, o.alto, 1); d.updateMatrix(); im.setMatrixAt(k, d.matrix); });
    im.name = `${tr.id}-postes-placas`; im.receiveShadow = true;
  }
  tr.consertoAD = { ...r, postes: postes.length };
}

export function depoisAbuDhabi(tr, ctx) {
  consertarAmbiente(tr, ctx.add);
  ligarNoite(tr); // por último: depois de vidaGP, que define tr.animarPista (os LEDs da casca do hotel acendem e trocam de cor de noite)
}
