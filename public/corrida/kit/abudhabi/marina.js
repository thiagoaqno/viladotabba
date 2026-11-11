// Abu Dhabi — a MARINA de Yas, colada na pista do lado de fora do trecho do sul (a "Marina" do nome do circuito): a água, o cais de pedra junto
// da barreira, os píeres de madeira e os iates atracados, de 15 a 45 m, cada um de um tamanho (as fotos: iates grandes brancos, de dois e três
// conveses, encostados no cais). Onde: o centro da marina (24,4652 N, 54,6080 E) passado pelo encaixe da linha real cai a 0,729 da volta,
// 315 u (65 m) do lado de fora; medido: do lado de fora, de 0,691 a 0,767, nenhum trecho da pista chega a menos de 900 u (só a própria pista).
// A água fica de I0 a I1, de L_CAIS a L_FIM da linha central; os píeres a cada 30 m (144 u).
import * as THREE from "three";
import { canvasTex } from "../../cena.js";

const KM = 4.8, F0 = 0.695, F1 = 0.765, L_CAIS = 110, L_FIM = 760, PIER = 30 * KM, LARG_PIER = 2.5 * KM;

function rng(s) { return () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// o casco visto de cima: popa reta, proa em bico (comprimento 1, largura 1 no meio), extrudado para cima (altura 1)
function geoCasco() {
  const s = new THREE.Shape(); s.moveTo(-0.5, -0.42); s.lineTo(0.18, -0.5); s.quadraticCurveTo(0.42, -0.4, 0.5, 0); s.quadraticCurveTo(0.42, 0.4, 0.18, 0.5); s.lineTo(-0.5, 0.42); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false }); g.rotateX(-Math.PI / 2); return g; // (x: comprimento, z: largura, y: altura de 0 a 1)
}

export function marinaYas(tr, add) {
  const { pts, n } = tr, i0 = Math.floor(F0 * n), i1 = Math.floor(F1 * n), r = rng(20091101), grupo = new THREE.Group(); grupo.name = "abudhabi-marina";
  const em = (i, l) => { const p = pts[((i % n) + n) % n]; return [p.x + p.nx * l, p.y + p.ny * l]; };
  const chao = (x, z) => tr.chao(x, z);
  // ---- a água e o cais: fitas ao longo da pista, cada vértice no chão do lugar ----
  const fita = (la, lb, dy0, dy1, mat, nome, vRep = 40) => {
    const vs = [], uv = [], idx = [];
    for (let i = i0, k = 0; i <= i1; i++, k++) {
      const t = (i - i0) / (i1 - i0), aperta = Math.min(1, Math.sin(Math.PI * t) * 3), lb2 = la + (lb - la) * aperta; // as pontas da água arredondam
      const [xa, za] = em(i, la), [xb, zb] = em(i, lb2);
      vs.push(xa, chao(xa, za) + dy0, za, xb, chao(xb, zb) + dy1, zb); uv.push(0, (k * 6) / vRep, (lb2 - la) / vRep, (k * 6) / vRep);
      if (i < i1) idx.push(k * 2, k * 2 + 2, k * 2 + 1, k * 2 + 1, k * 2 + 2, k * 2 + 3);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(vs, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat); m.name = nome; m.receiveShadow = true; grupo.add(m); return m;
  };
  const texAgua = canvasTex(256, 256, (x, w, h, rr) => { x.fillStyle = "#1c5d70"; x.fillRect(0, 0, w, h); for (let k = 0; k < 220; k++) { x.fillStyle = rr() < 0.5 ? "#ffffff14" : "#0a2f3d22"; x.fillRect(rr() * w, rr() * h, 10 + rr() * 30, 2); } });
  texAgua.wrapS = texAgua.wrapT = THREE.RepeatWrapping;
  const agua = new THREE.MeshStandardMaterial({ map: texAgua, color: 0xbfe3ea, roughness: 0.12, metalness: 0.35, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  fita(L_CAIS, L_FIM, 0.35, 0.35, agua, "abudhabi-marina-agua", 60);
  const pedra = new THREE.MeshStandardMaterial({ color: 0xd9cdb4, roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  fita(tr.W / 2 + 34, L_CAIS, 0.4, 0.4, pedra, "abudhabi-marina-calcadao"); // o calçadão de pedra clara entre a barreira e o cais
  // a borda do cais: a parede de concreto do calçadão até um pouco abaixo da água
  { const vs = [], idx = []; for (let i = i0, k = 0; i <= i1; i++, k++) { const [x, z] = em(i, L_CAIS); const c = chao(x, z); vs.push(x, c + 0.45, z, x, c - 2, z); if (i < i1) idx.push(k * 2, k * 2 + 2, k * 2 + 1, k * 2 + 1, k * 2 + 2, k * 2 + 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(vs, 3)); g.setIndex(idx); g.computeVertexNormals();
    grupo.add(Object.assign(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0xb8ad97, roughness: 0.9, side: THREE.DoubleSide })), { name: "abudhabi-marina-cais" })); }

  // ---- os píeres e os iates ----
  const comprimento = (i1 - i0) * 6, nPier = Math.floor(comprimento / PIER) - 1, piers = [], iates = [];
  for (let k = 1; k <= nPier; k++) {
    const i = i0 + Math.round((k * PIER) / 6), t = (i - i0) / (i1 - i0), cabe = (L_FIM - L_CAIS) * Math.min(1, Math.sin(Math.PI * t) * 3) - 60;
    if (cabe < 120) continue;
    const len = Math.min(cabe, 200 + r() * 180), p = pts[i % n];
    piers.push({ i, len });
    // os iates encostados dos dois lados do píer, um atrás do outro, cada um de um tamanho (15 a 45 m)
    for (const s of [-1, 1]) {
      let d = 14;
      while (true) {
        const L = (15 + Math.pow(r(), 1.6) * 30) * KM; if (d + L > len - 6) break;
        if (r() < 0.18) { d += L * 0.6; continue; } // (uma vaga vazia aqui e ali)
        const B = L * (0.2 + r() * 0.03), lc = L_CAIS + d + L / 2, desl = s * (LARG_PIER / 2 + B / 2 + 1.5);
        const x = p.x + p.nx * lc + p.tx * desl, z = p.y + p.ny * lc + p.ty * desl;
        iates.push({ x, z, a: Math.atan2(p.ny, p.nx), L, B, conveses: L > 30 * KM ? 3 : L > 20 * KM ? 2 : 1, y: chao(x, z) + 0.35 });
        d += L + 3 + r() * 6;
      }
    }
  }
  // os píeres: tábuas sobre a água, com estacas
  const madeira = new THREE.MeshStandardMaterial({ color: 0x9b7b58, roughness: 0.9 });
  const imP = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), madeira, piers.length), d0 = new THREE.Object3D();
  piers.forEach(({ i, len }, k) => { const p = pts[i % n], lc = L_CAIS + len / 2, x = p.x + p.nx * lc, z = p.y + p.ny * lc; d0.position.set(x, chao(x, z) + 0.9, z); d0.rotation.set(0, -Math.atan2(p.ny, p.nx), 0); d0.scale.set(len, 0.8, LARG_PIER); d0.updateMatrix(); imP.setMatrixAt(k, d0.matrix); });
  imP.name = "abudhabi-marina-pieres"; imP.receiveShadow = true; grupo.add(imP);
  // os iates: casco branco, a faixa escura das janelas, os conveses de cima (cada vez menores e mais para trás) e o vidro do passadiço
  const casco = geoCasco(), branco = new THREE.MeshStandardMaterial({ color: 0xf7f7f5, roughness: 0.3, metalness: 0.1 }), escuro = new THREE.MeshStandardMaterial({ color: 0x1a222b, roughness: 0.15, metalness: 0.6 });
  const cascoM = new THREE.InstancedMesh(casco, branco, iates.length), faixaM = new THREE.InstancedMesh(casco, escuro, iates.length);
  const caixa = new THREE.BoxGeometry(1, 1, 1), conv = []; for (const y of iates) for (let c = 0; c < y.conveses; c++) conv.push({ y, c });
  const convM = new THREE.InstancedMesh(caixa, branco, conv.length), vidroM = new THREE.InstancedMesh(caixa, escuro, conv.length);
  iates.forEach((y, k) => {
    const H = y.L * 0.07; // o costado acima da água
    d0.position.set(y.x, y.y - H * 0.3, y.z); d0.rotation.set(0, -y.a, 0); d0.scale.set(y.L, H, y.B); d0.updateMatrix(); cascoM.setMatrixAt(k, d0.matrix);
    d0.position.y = y.y + H * 0.42; d0.scale.set(y.L * 0.8, H * 0.14, y.B * 1.01); d0.updateMatrix(); faixaM.setMatrixAt(k, d0.matrix); // (a faixa escura das janelas do casco)
  });
  conv.forEach(({ y, c }, k) => {
    const H = y.L * 0.07, alto = 2.3 * KM, comp = y.L * (0.55 - c * 0.12), larg = y.B * (0.82 - c * 0.1), recua = -y.L * (0.06 + c * 0.05);
    const cx = y.x + Math.cos(y.a) * recua, cz = y.z + Math.sin(y.a) * recua, base = y.y + H * 0.7 + c * alto;
    d0.position.set(cx, base + alto / 2, cz); d0.rotation.set(0, -y.a, 0); d0.scale.set(comp, alto, larg); d0.updateMatrix(); convM.setMatrixAt(k, d0.matrix);
    d0.position.set(cx + Math.cos(y.a) * 0.6, base + alto * 0.55, cz + Math.sin(y.a) * 0.6); d0.scale.set(comp * 0.96, alto * 0.42, larg * 1.02); d0.updateMatrix(); vidroM.setMatrixAt(k, d0.matrix);
  });
  for (const [m, nome] of [[cascoM, "casco"], [faixaM, "faixa"], [convM, "convés"], [vidroM, "vidro"]]) { m.name = "abudhabi-iate-" + nome; m.castShadow = true; grupo.add(m); }
  add(grupo);
  tr.reservado ||= [];
  for (let i = i0; i <= i1; i += 20) { const [x, z] = em(i, (L_CAIS + L_FIM) / 2); tr.reservado.push([x, z, (L_FIM - L_CAIS) / 2 + 30]); }
  tr.marinaAD = { iates: iates.length, pieres: piers.length };
}
