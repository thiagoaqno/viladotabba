// O TERRENO do editor (2026-11-17, o Thiago, o documento do TRACKSCAPE): pincéis que mexem no chão da pista. Subir, Baixar, Suavizar,
// Nivelar, Platô e Ruído, com raio, força e queda. O que o pincel muda é uma grade de diferenças de altura (cenario-pista.js: relevo.d),
// salva no cenario/<pista>.json e somada ao chão pelo pista.js no jogo. Aqui no editor, só os vértices do chão perto do pincel são
// mexidos (as malhas "<pista>-terreno", sem refazer a pista), e cada pincelada entra no Ctrl+Z com o antes e o depois das células dela.
// A câmera continua a do editor: com o pincel ligado, arrastar com o botão esquerdo pinta; Shift + WASD, o direito e a roda seguem navegando.
import * as THREE from "three";
import { relevoDeDados, dadosDoRelevo } from "../cenario-pista.js";

const PINCEIS = { subir: "Subir", baixar: "Baixar", suavizar: "Suavizar", nivelar: "Nivelar", plato: "Platô", ruido: "Ruído" };

export function criarTerreno({ scene, cam, renderer, raio, orbita, tr, pista, painel, registrar, avisar, comShift }) {
  const salvo = dadosDoRelevo(pista), cel = +salvo?.cel || 12, d = new Map(Object.entries(salvo?.d || {}).map(([k, v]) => [k, +v]));
  const dh = (x, z) => { const fx = x / cel, fz = z / cel, i = Math.floor(fx), j = Math.floor(fz), u = fx - i, w = fz - j, v = (a, b) => d.get(a + "," + b) || 0;
    return (v(i, j) * (1 - u) + v(i + 1, j) * u) * (1 - w) + (v(i, j + 1) * (1 - u) + v(i + 1, j + 1) * u) * w; };
  const inicial = relevoDeDados(salvo); // (o que já veio somado no chão quando a pista foi montada)
  let ativo = false, pincel = "subir", raioP = 80, forca = 30, queda = 0.6;

  // as malhas do chão, com a altura de base de cada vértice (a do chão sem o relevo do editor)
  const malhas = [];
  tr.grp.traverse((o) => { if (o.isMesh && /-terreno$/.test(o.name)) malhas.push(o); });
  function base(m) {
    if (m.userData.base) return m.userData.base;
    const p = m.geometry.attributes.position, b = new Float32Array(p.count);
    for (let k = 0; k < p.count; k++) b[k] = p.getY(k) - (inicial ? inicial(p.getX(k) + m.position.x, p.getZ(k) + m.position.z) : 0);
    m.geometry.computeBoundingBox(); return (m.userData.base = b);
  }
  // refaz a altura dos vértices dentro do círculo (cx, cz, r)
  function atualizar(cx, cz, r) {
    for (const m of malhas) {
      const bb = m.geometry.boundingBox || (m.geometry.computeBoundingBox(), m.geometry.boundingBox), ox = m.position.x, oz = m.position.z;
      if (cx + r < bb.min.x + ox || cx - r > bb.max.x + ox || cz + r < bb.min.z + oz || cz - r > bb.max.z + oz) continue;
      const p = m.geometry.attributes.position, b = base(m); let mexeu = false;
      for (let k = 0; k < p.count; k++) { const x = p.getX(k) + ox, z = p.getZ(k) + oz; if ((x - cx) ** 2 + (z - cz) ** 2 > r * r) continue; p.setY(k, b[k] + dh(x, z)); mexeu = true; }
      if (mexeu) { p.needsUpdate = true; m.geometry.computeVertexNormals(); m.geometry.computeBoundingBox(); m.geometry.computeBoundingSphere(); }
    }
  }
  // a altura do chão num ponto (para nivelar e suavizar): um raio de cima só nas malhas do chão
  const r0 = new THREE.Raycaster(), baixo = new THREE.Vector3(0, -1, 0);
  const alturaEm = (x, z) => { r0.set(new THREE.Vector3(x, 5000, z), baixo); const h = r0.intersectObjects(malhas, false)[0]; return h ? h.point.y : 0; };

  // o anel do pincel
  const anel = new THREE.Mesh(new THREE.RingGeometry(0.94, 1, 64), new THREE.MeshBasicMaterial({ color: 0x3d7bff, transparent: true, opacity: 0.9, depthTest: false, side: THREE.DoubleSide }));
  anel.rotation.x = -Math.PI / 2; anel.renderOrder = 1000; anel.visible = false; scene.add(anel);
  const miolo = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshBasicMaterial({ color: 0x3d7bff, transparent: true, opacity: 0.12, depthTest: false })); miolo.renderOrder = 999; anel.add(miolo);
  let mouse = null, pintando = false, alvoNivel = 0, antes = null, ultimo = 0;
  const ondeOMouse = (e) => { const p = new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); raio.setFromCamera(p, cam); return raio.intersectObjects(malhas, false)[0]?.point || null; };

  // uma passada do pincel no ponto (cx, cz)
  function pincelar(cx, cz, dt) {
    const r = raioP, f = (forca / 100) * dt, ci = Math.floor((cx - r) / cel), cf = Math.ceil((cx + r) / cel), ji = Math.floor((cz - r) / cel), jf = Math.ceil((cz + r) / cel);
    const peso = (x, z) => { const t = Math.hypot(x - cx, z - cz) / r; if (t >= 1) return 0; const dentro = 1 - queda; return t <= dentro ? 1 : 0.5 + 0.5 * Math.cos(((t - dentro) / Math.max(0.001, queda)) * Math.PI); };
    const novos = [];
    for (let i = ci; i <= cf; i++) for (let j = ji; j <= jf; j++) {
      const x = i * cel, z = j * cel, w = peso(x, z); if (!w) continue; const k = i + "," + j, v = d.get(k) || 0;
      if (antes && !antes.has(k)) antes.set(k, v);
      let n = v;
      if (pincel === "subir") n = v + 60 * f * w;
      else if (pincel === "baixar") n = v - 60 * f * w;
      else if (pincel === "ruido") n = v + (Math.sin(i * 12.9898 + j * 78.233) * 43758.5453 % 1) * 40 * f * w;
      else if (pincel === "suavizar") { let s = 0; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) s += d.get(i + a + "," + (j + b)) || 0; n = v + (s / 4 - v) * Math.min(1, 6 * f * w); }
      else { const hAqui = alturaEm(x, z), alvo = v + (alvoNivel - hAqui); n = pincel === "plato" ? (w > 0.5 ? alvo : v) : v + (alvo - v) * Math.min(1, 6 * f * w); }
      novos.push([k, Math.round(n * 100) / 100]);
    }
    for (const [k, n] of novos) { if (Math.abs(n) < 0.01) d.delete(k); else d.set(k, n); }
    atualizar(cx, cz, r + cel * 1.5);
  }
  // com o pincel ligado: o botão esquerdo pinta (no capture, antes da órbita: ela não gira enquanto pinta)
  const cv = renderer.domElement;
  cv.addEventListener("pointerdown", (e) => {
    if (!ativo || e.button !== 0 || comShift()) return; const p = ondeOMouse(e); if (!p) return;
    e.stopImmediatePropagation(); orbita.enabled = false; pintando = true; antes = new Map(); alvoNivel = p.y; ultimo = performance.now(); pincelar(p.x, p.z, 0.05); cv.setPointerCapture?.(e.pointerId);
  }, true);
  cv.addEventListener("pointermove", (e) => {
    if (!ativo) return; const p = ondeOMouse(e); mouse = p;
    if (p) { anel.visible = true; anel.position.set(p.x, p.y + 1, p.z); anel.scale.setScalar(raioP); } else anel.visible = false;
    if (pintando && p) { const agora = performance.now(), dt = Math.min(0.1, (agora - ultimo) / 1000); ultimo = agora; pincelar(p.x, p.z, dt); }
  });
  const soltar = () => {
    if (!pintando) return; pintando = false; orbita.enabled = true;
    const a = antes; antes = null; if (!a || !a.size) return;
    const depois = new Map([...a.keys()].map((k) => [k, d.get(k) || 0]));
    const aplicar = (m) => { for (const [k, v] of m) { if (Math.abs(v) < 0.01) d.delete(k); else d.set(k, v); } refazerTudo([...m.keys()]); };
    registrar({ tipo: "terreno", o: { name: "terreno", userData: {} }, desfazer: (voltar) => aplicar(voltar ? a : depois) });
    avisar(`Terreno: ${PINCEIS[pincel]} (${a.size} pontos)`);
  };
  cv.addEventListener("pointerup", soltar, true); cv.addEventListener("pointercancel", soltar, true);
  function refazerTudo(chaves) { // (desfazer e refazer: refaz em volta das células trocadas)
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity; for (const k of chaves) { const [i, j] = k.split(",").map(Number); x0 = Math.min(x0, i * cel); x1 = Math.max(x1, i * cel); z0 = Math.min(z0, j * cel); z1 = Math.max(z1, j * cel); }
    if (x0 === Infinity) return; atualizar((x0 + x1) / 2, (z0 + z1) / 2, Math.hypot(x1 - x0, z1 - z0) / 2 + cel * 2);
  }
  // [ e ] mudam o raio
  addEventListener("keydown", (e) => { if (!ativo || e.target.closest?.("input,select")) return; if (e.key === "[" || e.key === "]") { raioP = Math.max(10, Math.min(800, raioP * (e.key === "]" ? 1.2 : 1 / 1.2))); desenhar(); anel.scale.setScalar(raioP); } });

  // ---------- o painel ----------
  const h3 = document.createElement("h3"); h3.textContent = "Terreno"; const el = document.createElement("div"); el.id = "edTerreno"; painel.append(h3, el);
  function desenhar() {
    el.innerHTML = `<div class="lin"><button id="edTeBt" class="ferr ${ativo ? "on" : ""}">${ativo ? "Pincel ligado: arraste no chão (Esc sai)" : "⛰ Ligar o pincel de terreno"}</button></div>
      <div class="edBibG">${Object.entries(PINCEIS).map(([k, n]) => `<button type="button" data-pi="${k}" class="${k === pincel ? "on" : ""}"><span style="font-size:13px">${n}</span></button>`).join("")}</div>
      <div class="lin"><label style="flex:1">Raio <input type="range" id="edTeR" min="10" max="800" value="${Math.round(raioP)}" style="flex:1"></label><small>${Math.round(raioP)}</small></div>
      <div class="lin"><label style="flex:1">Força <input type="range" id="edTeF" min="1" max="100" value="${forca}" style="flex:1"></label><small>${forca}</small></div>
      <div class="lin"><label style="flex:1">Queda <input type="range" id="edTeQ" min="0" max="100" value="${Math.round(queda * 100)}" style="flex:1"></label><small>${Math.round(queda * 100)}%</small></div>
      <div class="lin"><button id="edTeZerar">Zerar o relevo do editor</button></div>
      <small>Nivelar e Platô usam a altura de onde você começou a arrastar. [ e ] mudam o raio. Shift + WASD continua andando. O relevo é salvo junto com o cenário e aparece no jogo.</small>`;
    el.querySelector("#edTeBt").onclick = () => ligar(!ativo);
    for (const b of el.querySelectorAll("[data-pi]")) b.onclick = () => { pincel = b.dataset.pi; desenhar(); };
    el.querySelector("#edTeR").oninput = (e) => { raioP = +e.target.value; e.target.parentElement.nextElementSibling.textContent = raioP; };
    el.querySelector("#edTeF").oninput = (e) => { forca = +e.target.value; e.target.parentElement.nextElementSibling.textContent = forca; };
    el.querySelector("#edTeQ").oninput = (e) => { queda = +e.target.value / 100; e.target.parentElement.nextElementSibling.textContent = e.target.value + "%"; };
    el.querySelector("#edTeZerar").onclick = () => { if (!d.size || !confirm("Tirar todo o relevo pintado no editor desta pista?")) return; const a = new Map(d), chaves = [...d.keys()]; d.clear(); refazerTudo(chaves);
      registrar({ tipo: "terreno", o: { name: "terreno", userData: {} }, desfazer: (voltar) => { if (voltar) for (const [k, v] of a) d.set(k, v); else d.clear(); refazerTudo(chaves); } }); avisar("Relevo do editor zerado."); };
  }
  function ligar(on) { ativo = on; anel.visible = on && !!mouse; if (!on && pintando) soltar(); desenhar(); }
  desenhar();
  if (!malhas.length) avisar("Terreno: esta pista não tem malha de chão para o pincel.", true);
  return {
    ativo: () => ativo, parar: () => ligar(false),
    dados: () => (d.size ? { cel, d: Object.fromEntries([...d].map(([k, v]) => [k, Math.round(v * 100) / 100])) } : undefined),
  };
}
