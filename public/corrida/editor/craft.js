// O CRAFT do editor de cenário (2026-11-16, o Thiago: "um craft para eu poder gerar coisas legais com as texturas e cores que já temos"):
// monta uma OBRA com peças simples (caixa, cilindro, cone, cúpula, esfera, placa, escada) e os materiais do jogo (as cores dos marcos de
// Mônaco, kit/monaco/marcos.js, e texturas desenhadas como as da pista: fachada com janelas, tijolo, telha, madeira, asfalto, grama, brita,
// rocha), e grava a obra como um asset leve (public/corrida/assets/<nome>.glb), pronto para colocar em qualquer pista.
// A obra é montada em unidades do jogo e gravada em metros (÷ 4,8), como os assets convertidos: colocada, volta ao mesmo tamanho.
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { canvasTex } from "../cena.js";

const h = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
// ---------- as texturas (período: quantas unidades do jogo cada repetição cobre) ----------
const ruido = (x, w, hh, rr, n, a, b) => { for (let i = 0; i < n; i++) { x.fillStyle = rr() < 0.5 ? a : b; x.fillRect(rr() * w, rr() * hh, 2, 2); } };
const TEX = {
  fachada: { periodo: 16, t: () => canvasTex(64, 64, (x, w, hh) => { x.fillStyle = "#f4f1ea"; x.fillRect(0, 0, w, hh); x.fillStyle = "#2b3440"; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) x.fillRect(i * 16 + 4, j * 16 + 3, 8, 10); x.fillStyle = "#ffffff55"; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) x.fillRect(i * 16 + 4, j * 16 + 3, 8, 2); }) },
  tijolo: { periodo: 12, t: () => canvasTex(64, 64, (x, w, hh, rr) => { x.fillStyle = "#c9c1b5"; x.fillRect(0, 0, w, hh); for (let j = 0; j < 8; j++) for (let i = -1; i < 4; i++) { x.fillStyle = ["#a24a35", "#b0563e", "#94412f"][(i + j + 3) % 3]; x.fillRect(i * 16 + (j % 2) * 8 + 1, j * 8 + 1, 14, 6); } }) },
  telha: { periodo: 10, t: () => canvasTex(64, 64, (x, w, hh) => { x.fillStyle = "#9c4a33"; x.fillRect(0, 0, w, hh); for (let j = 0; j < 8; j++) { x.fillStyle = j % 2 ? "#b5583c" : "#a94f36"; x.fillRect(0, j * 8, w, 6); } }) },
  madeira: { periodo: 14, t: () => canvasTex(64, 64, (x, w, hh, rr) => { x.fillStyle = "#8a5a35"; x.fillRect(0, 0, w, hh); for (let j = 0; j < 8; j++) { x.fillStyle = "#6e4628"; x.fillRect(0, j * 8, w, 1); } ruido(x, w, hh, rr, 300, "#7a4e2d", "#9a6a42"); }) },
  asfalto: { periodo: 24, t: () => canvasTex(64, 64, (x, w, hh, rr) => { x.fillStyle = "#3a3d42"; x.fillRect(0, 0, w, hh); ruido(x, w, hh, rr, 900, "#00000030", "#ffffff18"); }) },
  grama: { periodo: 24, t: () => canvasTex(64, 64, (x, w, hh, rr) => { x.fillStyle = "#5f8a3c"; x.fillRect(0, 0, w, hh); ruido(x, w, hh, rr, 900, "#4e7631", "#74a04a"); }) },
  brita: { periodo: 16, t: () => canvasTex(64, 64, (x, w, hh, rr) => { x.fillStyle = "#8e8c88"; x.fillRect(0, 0, w, hh); ruido(x, w, hh, rr, 1200, "#6e6c69", "#b2b0ab"); }) },
  rocha: { periodo: 30, t: () => canvasTex(64, 64, (x, w, hh, rr) => { x.fillStyle = "#6d6b68"; x.fillRect(0, 0, w, hh); for (let i = 0; i < 400; i++) { x.fillStyle = rr() < 0.5 ? "#55524f" : "#8a8784"; const s = 1 + rr() * 4; x.fillRect(rr() * w, rr() * hh, s, s); } }) },
  listras: { periodo: 12, t: () => canvasTex(64, 64, (x, w, hh) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? "#f4f4f4" : "#d62828"; x.fillRect(i * 8, 0, 8, hh); } }) },
};
const texturas = new Map(); const texDe = (k) => { if (!texturas.has(k)) texturas.set(k, TEX[k].t()); return texturas.get(k); };
// ---------- a paleta: cor, textura e acabamento de cada material ----------
export const PALETA = {
  creme: { nome: "Creme", cor: "#f0e4c8", r: 0.85 }, pedra: { nome: "Pedra", cor: "#eadfc6", r: 0.85 }, branco: { nome: "Branco", cor: "#f6f1e4", r: 0.8 },
  cobre: { nome: "Cobre", cor: "#5d9d88", r: 0.55, m: 0.25 }, ardosia: { nome: "Ardósia", cor: "#4b5563", r: 0.7 }, ferro: { nome: "Ferro", cor: "#2c3036", r: 0.6, m: 0.3 },
  ouro: { nome: "Ouro", cor: "#d9b24a", r: 0.4, m: 0.5 }, vermelho: { nome: "Vermelho (toldo)", cor: "#b3262f", r: 0.8 }, vidro: { nome: "Vidro", cor: "#9fc4d4", r: 0.15, m: 0.3, op: 0.55 },
  fachada: { nome: "Fachada com janelas", cor: "#e9c9a8", r: 0.85, tex: "fachada" }, tijolo: { nome: "Tijolo", cor: "#ffffff", r: 0.9, tex: "tijolo" }, telha: { nome: "Telha", cor: "#ffffff", r: 0.85, tex: "telha" },
  madeira: { nome: "Madeira", cor: "#ffffff", r: 0.8, tex: "madeira" }, asfalto: { nome: "Asfalto", cor: "#ffffff", r: 0.95, tex: "asfalto" }, grama: { nome: "Grama", cor: "#ffffff", r: 1, tex: "grama" },
  brita: { nome: "Brita", cor: "#ffffff", r: 1, tex: "brita" }, rocha: { nome: "Rocha", cor: "#ffffff", r: 1, tex: "rocha" }, listras: { nome: "Listras (zebra/toldo)", cor: "#ffffff", r: 0.8, tex: "listras" },
};
export const ACABAMENTO = { padrao: "Do material", fosco: "Fosco", acetinado: "Acetinado", brilho: "Brilhante", metal: "Metálico" };
const ACAB = { fosco: [0.95, 0], acetinado: [0.55, 0.05], brilho: [0.2, 0.05], metal: [0.3, 0.85] };
// o material de uma peça: o da paleta, com a cor (multiplica a textura, ou é a cor quando não tem), o acabamento e a textura repetida pelo tamanho
function material(p) {
  const P = PALETA[p.mat] || PALETA.creme, [r, m] = ACAB[p.acab] || [P.r, P.m || 0];
  const mat = new THREE.MeshStandardMaterial({ color: p.cor || P.cor, roughness: r, metalness: m, transparent: !!P.op, opacity: P.op || 1, side: p.forma === "placa" ? THREE.DoubleSide : THREE.FrontSide });
  if (P.tex) { const t = texDe(P.tex).clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; const per = TEX[P.tex].periodo; t.repeat.set(Math.max(1, Math.round((p.sx * 10) / per)), Math.max(1, Math.round((p.sy * 10) / per))); mat.map = t; }
  mat.name = `craft-${p.mat}`; return mat;
}
// ---------- as formas (todas de 10 × 10 × 10 unidades na escala 1, apoiadas em y = 0) ----------
export const FORMAS = { caixa: "Caixa", cilindro: "Cilindro", cone: "Cone", cupula: "Cúpula", esfera: "Esfera", placa: "Placa", escada: "Escada", prisma: "Telhado (prisma)" };
function geometria(forma) {
  switch (forma) {
    case "cilindro": return new THREE.CylinderGeometry(5, 5, 10, 16).translate(0, 5, 0);
    case "cone": return new THREE.ConeGeometry(5, 10, 16).translate(0, 5, 0);
    case "cupula": return new THREE.SphereGeometry(5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 2, 1);
    case "esfera": return new THREE.SphereGeometry(5, 16, 12).translate(0, 5, 0);
    case "placa": return new THREE.PlaneGeometry(10, 10).translate(0, 5, 0);
    case "prisma": { const s = new THREE.Shape([new THREE.Vector2(-5, 0), new THREE.Vector2(5, 0), new THREE.Vector2(0, 10)]); return new THREE.ExtrudeGeometry(s, { depth: 10, bevelEnabled: false }).translate(0, 0, -5); }
    case "escada": { const gs = []; for (let k = 0; k < 5; k++) gs.push(new THREE.BoxGeometry(10, 2 * (k + 1), 2).translate(0, k + 1, -4 + k * 2)); const g = new THREE.BufferGeometry(); return mergeSimples(gs); }
    default: return new THREE.BoxGeometry(10, 10, 10).translate(0, 5, 0);
  }
}
function mergeSimples(gs) { // (BufferGeometryUtils sem importar: as caixas da escada têm os mesmos atributos)
  const pos = [], nor = [], uv = [], idx = []; let base = 0;
  for (const g of gs) { const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv; for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); uv.push(u.getX(i), u.getY(i)); } for (const i of g.index.array) idx.push(i + base); base += p.count; }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g;
}
// uma peça: a malha com os dados dela em userData.peca ({ forma, mat, cor, acab, sx, sy, sz }); a escala de cada eixo é a da malha
function montarPeca(p) {
  const m = new THREE.Mesh(geometria(p.forma), material(p)); m.castShadow = m.receiveShadow = true;
  m.scale.set(p.sx, p.sy, p.sz); m.userData.peca = { ...p }; m.name = `craft-${p.forma}`; return m;
}
const refazerMaterial = (m) => { m.material.map?.dispose(); m.material.dispose(); m.material = material(m.userData.peca); };

// ---------- o modo Craft ----------
export function criarCraft(ed) {
  const { scene, cam, gizmo, orbita, raio, api, avisar, recarregarAssets, M_PARA_U, chaoEm } = ed;
  let ativo = false, obra = null, sel = null;
  const painel = document.createElement("div"); painel.id = "edCraft"; painel.hidden = true; ed.painel.appendChild(painel);
  const $ = (s) => painel.querySelector(s);
  function novaObra() {
    if (obra) scene.remove(obra);
    obra = new THREE.Group(); obra.name = "craft-obra";
    const alvo = orbita.target; obra.position.set(alvo.x, chaoEm(alvo.x, alvo.z), alvo.z); scene.add(obra); escolher(null);
  }
  function escolher(m) { sel = m; if (m) gizmo.attach(m); else gizmo.detach(); desenhar(); }
  function adicionar(forma) { const m = montarPeca({ forma, mat: "creme", acab: "padrao", cor: null, sx: 1, sy: 1, sz: 1 }); if (sel) m.position.copy(sel.position).add(new THREE.Vector3(12, 0, 0)); obra.add(m); escolher(m); }
  function desenhar() {
    painel.innerHTML = `<h3>Craft · a obra</h3>
      <div class="lin">${Object.entries(FORMAS).map(([k, n]) => `<button data-f="${k}">${h(n)}</button>`).join("")}</div>
      <div class="lin"><small>${obra ? obra.children.length : 0} peças · clique numa peça para escolher; W/E/R mudam o gizmo; a escala estica cada eixo</small></div>
      ${sel ? pecaHTML(sel) : "<small>Adicione uma forma ou clique numa peça.</small>"}
      <div class="lin" style="margin-top:8px"><label>Nome <input id="crNome" value="${h(obra?.userData.nome || "minha-obra")}"></label><button id="crSalvar">Salvar como asset</button></div>
      <div class="lin"><button id="crNova">Nova obra (limpa)</button><button id="crAqui">Trazer a obra até a câmera</button></div>`;
    for (const b of painel.querySelectorAll("[data-f]")) b.onclick = () => adicionar(b.dataset.f);
    $("#crNome").onchange = (e) => { obra.userData.nome = e.target.value; };
    $("#crSalvar").onclick = salvar;
    $("#crNova").onclick = () => { if (!obra.children.length || confirm("Limpar a obra?")) novaObra(); };
    $("#crAqui").onclick = () => { const a = orbita.target; obra.position.set(a.x, chaoEm(a.x, a.z), a.z); };
    if (sel) ligarPeca();
  }
  function pecaHTML(m) {
    const p = m.userData.peca, n = (k, v, passo) => `<label>${k} <input type="number" step="${passo}" data-n="${k}" value="${(+v).toFixed(passo < 1 ? 2 : 0)}"></label>`;
    return `<div class="lin"><b>${h(FORMAS[p.forma])}</b></div>
      <div class="lin"><label>Material <select data-s="mat">${Object.entries(PALETA).map(([k, P]) => `<option value="${k}" ${p.mat === k ? "selected" : ""}>${h(P.nome)}</option>`).join("")}</select></label></div>
      <div class="lin"><label>Acabamento <select data-s="acab">${Object.entries(ACABAMENTO).map(([k, nm]) => `<option value="${k}" ${p.acab === k ? "selected" : ""}>${h(nm)}</option>`).join("")}</select></label></div>
      <div class="lin"><label>Cor <input type="color" data-cor value="${p.cor || PALETA[p.mat].cor}"></label><button data-b="semcor">Cor do material</button></div>
      <div class="lin">${n("largura", m.scale.x * 10, 1)}${n("altura", m.scale.y * 10, 1)}${n("fundo", m.scale.z * 10, 1)}</div>
      <div class="lin">${n("x", m.position.x, 1)}${n("y", m.position.y, 1)}${n("z", m.position.z, 1)}${n("giro", (m.rotation.y * 180) / Math.PI, 5)}</div>
      <div class="lin"><button data-b="dup">Duplicar</button><button data-b="esp">Espelhar (x)</button><button data-b="chao">No chão</button><button data-b="del">Apagar</button></div>`;
  }
  function ligarPeca() {
    const m = sel, p = m.userData.peca;
    for (const s of painel.querySelectorAll("[data-s]")) s.onchange = () => { p[s.dataset.s] = s.value; if (s.dataset.s === "mat") p.cor = null; refazerMaterial(m); desenhar(); };
    painel.querySelector("[data-cor]").onchange = (e) => { p.cor = e.target.value; refazerMaterial(m); };
    for (const i of painel.querySelectorAll("[data-n]")) i.onchange = () => {
      const v = +i.value; if (!Number.isFinite(v)) return; const k = i.dataset.n;
      if (k === "largura" || k === "altura" || k === "fundo") { const eixo = { largura: "x", altura: "y", fundo: "z" }[k]; m.scale[eixo] = Math.max(0.01, v / 10); medir(m); }
      else if (k === "giro") m.rotation.y = (v * Math.PI) / 180; else m.position[k] = v;
    };
    for (const b of painel.querySelectorAll("[data-b]")) b.onclick = () => {
      const a = b.dataset.b;
      if (a === "semcor") { p.cor = null; refazerMaterial(m); desenhar(); }
      else if (a === "dup") { const c = montarPeca({ ...p, sx: m.scale.x, sy: m.scale.y, sz: m.scale.z }); c.position.copy(m.position).add(new THREE.Vector3(m.scale.x * 10 + 2, 0, 0)); c.rotation.copy(m.rotation); obra.add(c); escolher(c); }
      else if (a === "esp") { const c = montarPeca({ ...p, sx: m.scale.x, sy: m.scale.y, sz: m.scale.z }); c.position.set(-m.position.x, m.position.y, m.position.z); c.rotation.set(m.rotation.x, -m.rotation.y, -m.rotation.z); obra.add(c); escolher(c); }
      else if (a === "chao") { m.position.y = 0; }
      else if (a === "del") { obra.remove(m); escolher(null); }
    };
  }
  // a escala mudou: a textura acompanha o tamanho (as janelas não esticam)
  function medir(m) { const p = m.userData.peca; p.sx = m.scale.x; p.sy = m.scale.y; p.sz = m.scale.z; refazerMaterial(m); }
  async function salvar() {
    const nome = ($("#crNome").value || "").toLowerCase().replace(/[^a-z0-9_-]/g, "-"); if (!nome || !obra.children.length) return avisar("Dê um nome e ponha ao menos uma peça.", true);
    const copia = obra.clone(true); copia.position.set(0, 0, 0); copia.rotation.set(0, 0, 0); copia.scale.setScalar(1 / M_PARA_U); copia.updateMatrixWorld(true);
    try {
      const bin = await new GLTFExporter().parseAsync(copia, { binary: true });
      const r = await api("asset/" + encodeURIComponent(nome), { method: "POST", headers: { "content-type": "application/octet-stream" }, body: bin });
      avisar(`Obra salva: assets/${nome}.glb (${r.kb} KB). Já dá para colocar na lista de assets.`); recarregarAssets();
    } catch (e) { avisar("Não salvou: " + e.message, true); }
  }
  return {
    ativo: () => ativo,
    alternar() { ativo = !ativo; painel.hidden = !ativo; if (ativo) { if (!obra) novaObra(); else scene.add(obra); desenhar(); } else { gizmo.detach(); sel = null; } return ativo; },
    // o clique na tela com o Craft ligado: escolhe uma peça da obra (ou solta)
    clique() { const hit = obra && raio.intersectObjects(obra.children, false)[0]; escolher(hit ? hit.object : null); return true; },
    apagar() { if (sel) { obra.remove(sel); escolher(null); } },
    mudou() { if (sel) { medir(sel); desenhar(); } }, // (o gizmo terminou de arrastar: a textura acompanha a escala nova)
  };
}
