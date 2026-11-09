// Madri (GP da Espanha em Madri, o Madring, em volta do IFEMA e de Valdebebas) — as peças próprias da pista, em ./kit/madri/. O GP continua com o resto do cenário do GP simples
// (kit/gp-simples.js: boxes, tribuna, painéis, passarela, bandeira); aqui está só o que só Madri tem (fase 1 da escala real): o chão junto da pista com a base sólida (kit/madri/chao.js) e os
// painéis, mastros e placas de frenagem de pé no chão (kit/madri/ambiente.js), mais os postes das placas de DRS. Configuração em gps/madri.js.
import * as THREE from "three";
import { M } from "./cena.js";
import { beiradaSolida } from "./kit/madri/chao.js";
import { ambienteMadri } from "./kit/madri/ambiente.js";

export function cenarioMadri(tr, ctx, ambiente) {
  tr.reservado ||= [];
  beiradaSolida(tr, ctx.add); // a base sólida da pista e a grama no nível do asfalto, dos dois lados (kit/madri/chao.js)
  ambienteMadri(tr, ctx.add, ambiente); // painéis na barreira, mastros e placas de frenagem no chão, postos dos fiscais
}

// as placas de DRS de pista.js (um sprite a 18 × a escala acima do ponto da pista, sem nada embaixo) ganham o poste até o chão; ele entra no mesmo grupo (tr.drsPlacas) e some e aparece junto
export function depoisMadri(tr) {
  if (!tr.drsPlacas) return;
  const { W, pts, n } = tr, E = tr.escala ?? 1, metal = M(0x697780), geo = new THREE.BoxGeometry(0.8, 1, 0.8);
  for (const [deteccao, abre] of tr.t.drs || []) for (const f of [deteccao, abre]) {
    const p = pts[Math.floor(f * n) % n], lado = W / 2 + 28, x = p.x + p.nx * lado, z = p.y + p.ny * lado, h = tr.chao(x, z), baixo = p.h + 18 * E - 6.5 * E; // a borda de baixo da placa
    const poste = new THREE.Mesh(geo, metal); poste.scale.y = baixo - h + 0.5 + 0.3; poste.position.set(x, h - 0.5 + poste.scale.y / 2, z); poste.castShadow = true; tr.drsPlacas.add(poste);
  }
}
