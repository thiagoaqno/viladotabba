// Mônaco — a base sólida da pista: a pista, a calçada e as áreas de escape não são uma folha solta no ar. Dos dois lados do asfalto sobe, rente à barreira, um paredão de pedra de cantaria que desce até muito abaixo do
// terreno (a pista tem espessura, e onde o chão em volta fica bem mais baixo, no cais do porto, no grampo e nos trechos empilhados, a borda mostra a pedra e não o vazio). É o que pista.js desenhava em cinza liso em
// `monaco-fundacao-pista` (desligado por `semFundacao` em gps/monaco.js). A textura é desenhada em canvas (sem arquivo baixado): fiadas de blocos de alturas diferentes, juntas escuras, manchas de umidade.
import * as THREE from "three";
import { canvasTex } from "../../cena.js";

export function baseDaPista(tr, add) {
  const { pts, n, W } = tr;
  const pedra = canvasTex(256, 256, (x, w, h, r) => {
    x.fillStyle = "#b4a98f"; x.fillRect(0, 0, w, h);
    for (let y = 0; y < h;) { // fiadas de 20 a 30 de altura, com blocos de 40 a 90 de comprimento, cada fiada deslocada da anterior
      const alto = 20 + ((r() * 10) | 0); let cx = -((r() * 60) | 0);
      while (cx < w) {
        const larg = 40 + ((r() * 50) | 0), c = 150 + ((r() * 40) | 0);
        x.fillStyle = `rgb(${c},${c - 8},${c - 26})`; x.fillRect(cx + 1, y + 1, larg - 2, alto - 2);
        x.fillStyle = "rgba(255,255,255,0.10)"; x.fillRect(cx + 1, y + 1, larg - 2, 3); x.fillStyle = "rgba(0,0,0,0.12)"; x.fillRect(cx + 1, y + alto - 4, larg - 2, 3);
        cx += larg;
      }
      x.fillStyle = "#5b5446"; x.fillRect(0, y, w, 2); y += alto;
    }
    for (let k = 0; k < 900; k++) { x.fillStyle = r() < 0.5 ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.08)"; x.fillRect(r() * w, r() * h, 3, 3); }
    x.fillStyle = "rgba(70,95,60,0.30)"; for (let k = 0; k < 24; k++) x.fillRect(r() * w, r() * h * 0.5, 4 + r() * 14, 10 + r() * 30); // manchas de musgo e umidade
  });
  const mat = new THREE.MeshStandardMaterial({ map: pedra, color: 0xffffff, roughness: 0.97, side: THREE.DoubleSide });
  const fundo = 60; // até onde o paredão desce abaixo do asfalto (o terreno em volta fica a poucas unidades; o mar, a ~12)
  const vs = [], uv = [], idx = []; let metros = 0;
  for (const lado of [-1, 1]) {
    let comprimento = 0;
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n], la = Math.max(W / 2, tr.latMuro(lado, i)) + 0.6, lb = Math.max(W / 2, tr.latMuro(lado, i + 1)) + 0.6;
      const ax = a.x + a.nx * la * lado, az = a.y + a.ny * la * lado, bx = b.x + b.nx * lb * lado, bz = b.y + b.ny * lb * lado, c = Math.hypot(bx - ax, bz - az);
      // onde outro trecho da pista passa colado (o grampo, o morro empilhado), a parede entraria nele: fica de fora, como fazia pista.js
      if (tr.distAt(ax, az) < W / 2 - 1 || tr.distAt(bx, bz) < W / 2 - 1 || tr.coberto?.(i)) { comprimento += c; continue; }
      const q = vs.length / 3, ua = comprimento / 48, ub = (comprimento + c) / 48, v = (fundo + 0.2) / 36;
      vs.push(ax, a.h + 0.2, az, ax, a.h - fundo, az, bx, b.h + 0.2, bz, bx, b.h - fundo, bz);
      uv.push(ua, 0, ua, v, ub, 0, ub, v);
      idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); comprimento += c; metros += c;
    }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(vs, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const m = add(new THREE.Mesh(g, mat)); m.name = "monaco-base-pista"; m.receiveShadow = true;
  tr.baseMonaco = { metros: Math.round(metros * 0.2083) };
  return m;
}
