// A RÉGUA do editor (2026-11-17, o Thiago: "uma ferramenta de régua/medidas, como no Revit"). Ligada pelo botão Medir da barra (ou Shift+R):
// um clique marca o começo, o mouse mostra a medida ao vivo e o segundo clique a fixa. A cota fica na tela com a distância em metros
// (no plano e, se tiver, a diferença de altura); medidas novas se somam. Ctrl ao clicar trava em passos de 1 m. Esc desliga; "Limpar" apaga.
// As medidas não são salvas no cenário: são só para conferir.
import * as THREE from "three";

const M_PARA_U = 4.8;
const fmt = (u) => (u / M_PARA_U).toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 });

export function criarRegua({ scene, cam, renderer, raio, solidos, avisar }) {
  const grupo = new THREE.Group(); grupo.name = "regua"; scene.add(grupo);
  const corLinha = 0xffb000;
  let ativo = false, a = null, viva = null;
  function etiqueta(txt) {
    const c = document.createElement("canvas"), x = c.getContext("2d"); x.font = "bold 44px Barlow, Arial"; const w = Math.ceil(x.measureText(txt).width) + 36; c.width = w; c.height = 68;
    x.fillStyle = "rgba(18,21,27,.92)"; x.beginPath(); x.roundRect?.(0, 0, w, 68, 14) ?? x.rect(0, 0, w, 68); x.fill(); x.strokeStyle = "#ffb000"; x.lineWidth = 4; x.stroke(); x.font = "bold 44px Barlow, Arial"; x.fillStyle = "#fff"; x.textBaseline = "middle"; x.fillText(txt, 18, 36);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, sizeAttenuation: false })); s.scale.set((0.045 * w) / 68, 0.045, 1); s.renderOrder = 1001; return s;
  }
  function cota(p, q) {
    const g = new THREE.Group(), lin = new THREE.Line(new THREE.BufferGeometry().setFromPoints([p, q]), new THREE.LineBasicMaterial({ color: corLinha, depthTest: false })); lin.renderOrder = 1000; g.add(lin);
    for (const r of [p, q]) { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshBasicMaterial({ color: corLinha, depthTest: false })); m.position.copy(r); m.renderOrder = 1000; m.userData.ponta = true; g.add(m); }
    const dx = Math.hypot(q.x - p.x, q.z - p.z), dy = q.y - p.y, total = p.distanceTo(q);
    const txt = Math.abs(dy) > 0.5 * M_PARA_U ? `${fmt(total)} m  (plano ${fmt(dx)} · altura ${dy > 0 ? "+" : ""}${fmt(dy)})` : `${fmt(total)} m`;
    const e = etiqueta(txt); e.position.copy(p).add(q).multiplyScalar(0.5); e.position.y += 2; g.add(e); g.userData.medida = total;
    return g;
  }
  const pontoEm = (e) => { const v = new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); raio.setFromCamera(v, cam); const h = raio.intersectObjects(solidos(), false)[0]; return h ? h.point.clone() : raio.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), new THREE.Vector3()); };
  function travar(p, e) { if (!a || !e.ctrlKey) return p; const d = new THREE.Vector3(p.x - a.x, 0, p.z - a.z), l = d.length(); if (l < 1e-3) return p; const m = Math.max(1, Math.round(l / M_PARA_U)) * M_PARA_U; d.multiplyScalar(m / l); return new THREE.Vector3(a.x + d.x, p.y, a.z + d.z); }
  // o tamanho das bolinhas acompanha a distância da câmera (sempre visíveis)
  function ajustarPontas() { grupo.traverse((o) => { if (o.userData.ponta) o.scale.setScalar(Math.max(0.6, cam.position.distanceTo(o.position) * 0.006)); }); }
  const cv = renderer.domElement; let xy = null;
  cv.addEventListener("pointerdown", (e) => { if (ativo && e.button === 0) xy = [e.clientX, e.clientY]; });
  cv.addEventListener("pointermove", (e) => {
    if (!ativo || !a) return; const p = pontoEm(e); if (!p) return;
    if (viva) { grupo.remove(viva); viva.traverse((o) => { o.geometry?.dispose(); o.material?.map?.dispose(); o.material?.dispose(); }); }
    viva = cota(a, travar(p, e)); grupo.add(viva); ajustarPontas();
  });
  cv.addEventListener("pointerup", (e) => {
    if (!ativo || e.button !== 0 || !xy || Math.hypot(e.clientX - xy[0], e.clientY - xy[1]) > 4) return; // (arrastar continua girando a câmera)
    const p = pontoEm(e); if (!p) return;
    if (!a) { a = p; avisar("Régua: clique no segundo ponto (Ctrl trava em metros inteiros)."); return; }
    const q = travar(p, e); if (viva) { grupo.remove(viva); viva = null; }
    const c = cota(a, q); grupo.add(c); ajustarPontas(); avisar(`Medida: ${fmt(c.userData.medida)} m. Clique para medir outra (Esc sai).`); a = null;
  });
  function limpar() { a = null; viva = null; for (const c of [...grupo.children]) { grupo.remove(c); c.traverse((o) => { o.geometry?.dispose(); o.material?.map?.dispose(); o.material?.dispose(); }); } }
  return {
    ativo: () => ativo,
    alternar() { ativo = !ativo; a = null; if (viva) { grupo.remove(viva); viva = null; } if (ativo) avisar("Régua: clique no primeiro ponto. Shift+R ou Esc saem; Limpar apaga as medidas."); return ativo; },
    parar() { ativo = false; a = null; if (viva) { grupo.remove(viva); viva = null; } },
    limpar, quadro: ajustarPontas,
  };
}
