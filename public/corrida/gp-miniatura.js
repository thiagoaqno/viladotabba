// Corrida da Galera — a miniatura 3D da pista (como o mapa 3D da transmissão da F1): o traçado em relevo, com a "parede" translúcida até a
// base mostrando a subida e a descida, a linha dos 3 setores, a largada e um carrinho de luz dando a volta. Responde ao mouse: arrastar gira,
// a roda aproxima, passar o mouse na pista diz onde ela está (a fração da volta) e os pinos (os momentos da corrida, as curvas) acendem e são
// clicáveis. Usada pela tela do resultado (os momentos, resultado-analise.js) e pela ficha do GP (o guia, gp-guia.js).
// Tudo desenhado em código a partir de window.Pistas.pontos (os mesmos dados da corrida): nenhum modelo baixado. Sem WebGL, devolve null.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const COR_SETOR = [new THREE.Color("#e10600"), new THREE.Color("#2aa8ff"), new THREE.Color("#ffd100")];
const reduz = () => !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
const LADO = 100; // o traçado cabe num quadrado de 100 unidades

// o traçado já pronto para a cena: os pontos em 3D, a fração de cada um e a escala do relevo (um "exagero" para a subida aparecer, como na TV)
function tracado(t) {
  const todos = window.Pistas.pontos(t, 6), passo = Math.max(1, Math.round(todos.length / 900)), pts = todos.filter((_, i) => i % passo === 0), n = pts.length;
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, h0 = Infinity, h1 = -Infinity;
  for (const p of pts) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); h0 = Math.min(h0, p.h); h1 = Math.max(h1, p.h); }
  const s = LADO / Math.max(x1 - x0, y1 - y0), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const relevo = (h1 - h0) * s, alto = relevo > 0.05 ? Math.min(12, Math.max(2.5, relevo * 3)) : 0, ex = relevo > 0.05 ? alto / relevo : 0;
  const base = 1.2; // a pista mais baixa fica um pouco acima da base, para a parede aparecer em toda a volta
  const v = pts.map((p) => new THREE.Vector3((p.x - cx) * s, base + (p.h - h0) * s * ex, (p.y - cy) * s));
  return { v, n, larg: (x1 - x0) * s, prof: (y1 - y0) * s, temRelevo: alto > 0 };
}
const lado = (v, i, n) => { const a = v[(i - 1 + n) % n], b = v[(i + 1) % n], dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1; return new THREE.Vector3(-dz / l, 0, dx / l); };
const setorDe = (i, n) => Math.min(2, Math.floor((i / n) * 3));

// uma faixa ao longo da volta (a pista, a linha dos setores): dois vértices por ponto, `w` de largura, `dy` acima do traçado
function faixa(v, n, w, dy, cores) {
  const pos = new Float32Array(n * 6), cor = cores ? new Float32Array(n * 6) : null, idx = [];
  for (let i = 0; i < n; i++) {
    const p = v[i], l = lado(v, i, n);
    pos.set([p.x + l.x * w, p.y + dy, p.z + l.z * w, p.x - l.x * w, p.y + dy, p.z - l.z * w], i * 6);
    if (cor) { const c = cores(i); cor.set([c.r, c.g, c.b, c.r, c.g, c.b], i * 6); }
    const j = (i + 1) % n; idx.push(i * 2, j * 2, i * 2 + 1, i * 2 + 1, j * 2, j * 2 + 1);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); if (cor) g.setAttribute("color", new THREE.BufferAttribute(cor, 3)); g.setIndex(idx);
  return g;
}
// a parede do relevo: do traçado até a base, translúcida e mais forte em cima (a cor vai sumindo para baixo)
function parede(v, n, cor) {
  const pos = new Float32Array(n * 6), alfa = new Float32Array(n * 2), idx = [];
  for (let i = 0; i < n; i++) { const p = v[i]; pos.set([p.x, p.y, p.z, p.x, 0, p.z], i * 6); alfa[i * 2] = 1; alfa[i * 2 + 1] = 0; const j = (i + 1) % n; idx.push(i * 2, j * 2, i * 2 + 1, i * 2 + 1, j * 2, j * 2 + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("alfa", new THREE.BufferAttribute(alfa, 1)); g.setIndex(idx);
  const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { cor: { value: new THREE.Color(cor) } },
    vertexShader: "attribute float alfa; varying float a; void main(){ a = alfa; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform vec3 cor; varying float a; void main(){ gl_FragColor = vec4(cor, 0.05 + a * a * 0.32); }" });
  return new THREE.Mesh(g, m);
}

// `op`: { tema ("claro" | "escuro": a base nas cores da Central da carreira), cor (a da equipe, para o carrinho e o realce), aoPassar({ f, x, y } | null), aoMarcador(id, "passa" | "clique" | null, { x, y }), aoCarro(id), corredor (true) }
export function criarMiniatura(caixa, pista, op = {}) {
  const t = window.Pistas && window.Pistas.PISTAS[pista]; if (!t || !caixa) return null;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" }); } catch (e) { return null; }
  if (!renderer.getContext()) return null;
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  const cv = renderer.domElement; cv.className = "mn3-canvas"; caixa.classList.add("mn3"); caixa.appendChild(cv);
  const camadaRot = document.createElement("div"); camadaRot.className = "mn3-rotulos"; caixa.appendChild(camadaRot);

  const cena = new THREE.Scene(), T = tracado(t), { v, n } = T, corEq = new THREE.Color(op.cor || "#5fe6ff");
  const cam = new THREE.PerspectiveCamera(34, 1, 0.5, 900);
  const ctl = new OrbitControls(cam, cv);
  ctl.enableDamping = true; ctl.dampingFactor = 0.08; ctl.enablePan = false; ctl.minDistance = 35; ctl.maxDistance = 230; ctl.maxPolarAngle = 1.38; ctl.rotateSpeed = 0.7;
  ctl.autoRotate = !reduz(); ctl.autoRotateSpeed = 0.55;
  const dist0 = 70 + Math.max(T.larg, T.prof) * 0.55;
  cam.position.set(0, dist0 * 0.62, dist0 * 0.82); ctl.target.set(0, 2, 0); ctl.update();

  // a base: um disco escuro com a grade fininha
  const raio = Math.hypot(T.larg, T.prof) / 2 + 12;
  // as cores da base: a escura de sempre (a tela do resultado, a ficha da sala) ou as da Central da carreira (`op.tema`: "claro" ou "escuro")
  const TEMAS = { padrao: { disco: 0x0b1118, g1: 0x1d2a38, g2: 0x141e29, asfalto: 0x313c4a, parede: "#7fe3ff" }, claro: { disco: 0xe4dfd8, g1: 0xc9c2b8, g2: 0xd6d0c7, asfalto: 0x3a4250, parede: "#1f86b0" }, escuro: { disco: 0x1b1c20, g1: 0x2c2e33, g2: 0x232529, asfalto: 0x454c58, parede: "#7fe3ff" } };
  const P = TEMAS[op.tema] || TEMAS.padrao;
  const disco = new THREE.Mesh(new THREE.CircleGeometry(raio, 72), new THREE.MeshBasicMaterial({ color: P.disco, transparent: true, opacity: 0.92 }));
  disco.rotation.x = -Math.PI / 2; cena.add(disco);
  const grade = new THREE.GridHelper(raio * 2, 24, P.g1, P.g2); grade.position.y = 0.02; grade.material.transparent = true; grade.material.opacity = 0.6; cena.add(grade);
  const borda = new THREE.Mesh(new THREE.RingGeometry(raio - 0.4, raio, 96), new THREE.MeshBasicMaterial({ color: corEq, transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
  borda.rotation.x = -Math.PI / 2; borda.position.y = 0.04; cena.add(borda);

  // a pista: o asfalto, a parede do relevo (com a sombra no chão) e a linha dos setores por cima
  const asfalto = new THREE.Mesh(faixa(v, n, 1.25, 0, null), new THREE.MeshBasicMaterial({ color: P.asfalto, side: THREE.DoubleSide }));
  cena.add(asfalto);
  const sombra = new THREE.Mesh(faixa(v.map((p) => new THREE.Vector3(p.x, 0.06, p.z)), n, 1.6, 0, null), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45, depthWrite: false }));
  cena.add(sombra);
  if (T.temRelevo) cena.add(parede(v, n, P.parede));
  const setores = new THREE.Mesh(faixa(v, n, 0.32, 0.05, (i) => COR_SETOR[setorDe(i, n)]), new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }));
  cena.add(setores);
  // a largada: uma barra quadriculada atravessando a pista
  const xadrez = (() => { const c = document.createElement("canvas"); c.width = 32; c.height = 8; const g = c.getContext("2d"); for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? "#111" : "#fff"; g.fillRect(i * 4, j * 4, 4, 4); } const tx = new THREE.CanvasTexture(c); tx.magFilter = THREE.NearestFilter; return tx; })();
  const linha = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.8), new THREE.MeshBasicMaterial({ map: xadrez, side: THREE.DoubleSide }));
  { const p = v[0], l = lado(v, 0, n); linha.position.set(p.x, p.y + 0.09, p.z); linha.rotation.x = -Math.PI / 2; linha.rotation.z = -Math.atan2(l.z, l.x); cena.add(linha); }

  // o carrinho de luz dando a volta (com um rastro curto na cor da equipe)
  const carro = new THREE.Mesh(new THREE.SphereGeometry(0.75, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: brilho(), color: corEq, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.scale.set(6, 6, 1); carro.add(halo); carro.visible = op.corredor !== false; cena.add(carro);
  const RASTRO = 26, rastroPos = new Float32Array(RASTRO * 3), rastroG = new THREE.BufferGeometry(); rastroG.setAttribute("position", new THREE.BufferAttribute(rastroPos, 3));
  const rastro = new THREE.Line(rastroG, new THREE.LineBasicMaterial({ color: corEq, transparent: true, opacity: 0.85 })); rastro.visible = carro.visible; rastro.frustumCulled = false; cena.add(rastro);

  // os pinos: { id, f, cor, alto } — uma haste, uma cabeça e um anel no chão da pista que pulsa
  const pinos = new Map(), grupoPinos = new THREE.Group(); cena.add(grupoPinos);
  const geoHaste = new THREE.CylinderGeometry(0.09, 0.09, 1, 6), geoCabeca = new THREE.SphereGeometry(0.85, 16, 12), geoAnel = new THREE.RingGeometry(0.9, 1.3, 28);
  const pontoDe = (f) => v[((Math.floor((((f % 1) + 1) % 1) * n)) % n + n) % n];
  function marcadores(lista) {
    for (const p of pinos.values()) { grupoPinos.remove(p.g); p.g.traverse((o) => o.material && o.material.dispose()); }
    pinos.clear();
    for (const m of lista || []) {
      if (m.f == null || !Number.isFinite(m.f)) continue;
      const pt = pontoDe(m.f), alto = m.alto || 4, cor = new THREE.Color(m.cor || "#ffffff"), g = new THREE.Group();
      const haste = new THREE.Mesh(geoHaste, new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.7 })); haste.scale.y = alto; haste.position.y = alto / 2;
      const cabeca = new THREE.Mesh(geoCabeca, new THREE.MeshBasicMaterial({ color: cor })); cabeca.position.y = alto; cabeca.userData.pino = m.id;
      const anel = new THREE.Mesh(geoAnel, new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false })); anel.rotation.x = -Math.PI / 2; anel.position.y = 0.12;
      g.add(haste, cabeca, anel); g.position.copy(pt); grupoPinos.add(g);
      pinos.set(m.id, { g, cabeca, anel, haste, fase: Math.random() * 6.28, m });
    }
  }
  let realce = null;
  function destacar(id) { realce = id != null && pinos.has(id) ? id : null; }

  // os rótulos HTML (os números das curvas): { n, f, nome } — projetados a cada quadro; ficam com data-n para a ficha do GP acender a curva
  let rotulos = [];
  function curvas(lista) {
    camadaRot.innerHTML = ""; rotulos = (lista || []).map((c) => {
      const el = document.createElement("span"); el.className = "mn3-curva"; el.dataset.n = c.n; el.textContent = c.n; if (c.nome) el.title = `Curva ${c.n}: ${c.nome}`;
      camadaRot.appendChild(el); const pt = pontoDe(c.f); return { el, p: new THREE.Vector3(pt.x, pt.y + 2.6, pt.z) };
    });
  }

  // os carros do replay: { id, cor, rotulo } — uma bolinha na cor da equipe e a sigla por cima (HTML), posta a cada quadro por `posicionar`
  const carros = new Map(), grupoCarros = new THREE.Group(); cena.add(grupoCarros);
  const geoCarro = new THREE.SphereGeometry(0.95, 14, 10);
  function definirCarros(lista) {
    for (const c of carros.values()) { grupoCarros.remove(c.m); c.m.material.dispose(); c.el.remove(); }
    carros.clear();
    for (const k of lista || []) {
      const m = new THREE.Mesh(geoCarro, new THREE.MeshBasicMaterial({ color: new THREE.Color(k.cor || "#ffffff") })); m.userData.carro = k.id; m.visible = false; grupoCarros.add(m);
      const el = document.createElement("span"); el.className = "mn3-carro"; el.textContent = k.rotulo || ""; el.style.setProperty("--c", k.cor || "#fff"); el.dataset.carro = k.id; camadaRot.appendChild(el);
      carros.set(k.id, { m, el, f: null, on: false });
    }
    carro.visible = rastro.visible = false; // no replay, o carrinho de luz sai de cena
  }
  // `f` = fração da volta (null: fora da pista); `on`: realçado (cresce, rótulo sempre visível)
  function posicionar(id, f, on) {
    const c = carros.get(id); if (!c) return;
    c.f = f; c.on = !!on; c.m.visible = f != null;
    if (f == null) return;
    const x = (((f % 1) + 1) % 1) * n, i = Math.floor(x), a = v[i % n], b = v[(i + 1) % n];
    c.m.position.lerpVectors(a, b, x - i); c.m.position.y += 1.1; c.m.scale.setScalar(on ? 1.7 : 1);
  }
  // a câmera acompanha um ponto (o carro escolhido no replay): o alvo anda junto, sem tirar o giro do mouse
  let seguindo = null;
  function seguir(f) { seguindo = f == null ? null : pontoDe(f).clone(); if (seguindo) ctl.autoRotate = false; }
  // pinta a linha dos setores por outra cor (o mapa de calor da velocidade): `cor(fração)` devolve uma cor (THREE.Color ou texto CSS) ou null (a cor do setor)
  function pintar(cor) {
    const at = setores.geometry.getAttribute("color");
    const cache = new Map(), deCss = (x) => { if (!cache.has(x)) cache.set(x, new THREE.Color(x)); return cache.get(x); }; // (a cor pode vir em texto CSS)
    for (let i = 0; i < n; i++) { const r0 = cor && cor(i / n), c = r0 ? (r0.isColor ? r0 : deCss(r0)) : COR_SETOR[setorDe(i, n)]; at.setXYZ(i * 2, c.r, c.g, c.b); at.setXYZ(i * 2 + 1, c.r, c.g, c.b); }
    at.needsUpdate = true;
  }

  // os botões + e −: a câmera chega mais perto (k < 1) ou se afasta (k > 1) do alvo, dentro dos limites do mouse
  function aproximar(k) {
    const dir = cam.position.clone().sub(ctl.target), d = Math.min(ctl.maxDistance, Math.max(ctl.minDistance, dir.length() * k));
    voo = { de: ctl.target.clone(), para: ctl.target.clone(), cde: cam.position.clone(), cpara: ctl.target.clone().add(dir.setLength(d)), t0: performance.now(), dur: reduz() ? 1 : 350 };
    ctl.autoRotate = false;
  }
  // a câmera voa até um ponto da volta (ou volta à vista inteira com `null`)
  let voo = null;
  function focar(f) {
    const alvo = f == null ? new THREE.Vector3(0, 2, 0) : pontoDe(f).clone();
    const dir = cam.position.clone().sub(ctl.target).normalize(), dist = f == null ? dist0 : 48;
    voo = { de: ctl.target.clone(), para: alvo, cde: cam.position.clone(), cpara: alvo.clone().add(dir.multiplyScalar(dist)), t0: performance.now(), dur: reduz() ? 1 : 900 };
    ctl.autoRotate = false;
  }

  // o mouse: arrastar gira (OrbitControls); parado em cima, a pista diz onde está e o pino acende; clique (sem arrastar) escolhe o pino
  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2(); let baixo = null, parouEm = 0, ultimoPassa = null;
  const lerMouse = (ev) => { const r = cv.getBoundingClientRect(); mouse.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1); return { x: ev.clientX - r.left, y: ev.clientY - r.top }; };
  function tocar(ev) {
    const xy = lerMouse(ev); ray.setFromCamera(mouse, cam);
    const cabecas = [...pinos.values()].map((p) => p.cabeca), hp = cabecas.length ? ray.intersectObjects(cabecas, false)[0] : null;
    if (hp) return { pino: hp.object.userData.pino, xy };
    const visiveis = [...carros.values()].filter((c) => c.m.visible).map((c) => c.m), hc = visiveis.length ? ray.intersectObjects(visiveis, false)[0] : null;
    if (hc) return { carro: hc.object.userData.carro, xy };
    const ha = ray.intersectObject(asfalto, false)[0];
    if (ha && ha.face) { const i = Math.floor(Math.min(ha.face.a, ha.face.b, ha.face.c) / 2); return { f: i / n, xy }; }
    return { xy };
  }
  const aoMover = (ev) => {
    if (baixo) return;
    const r = tocar(ev);
    if (r.pino != null) { cv.style.cursor = "pointer"; if (ultimoPassa !== r.pino) { ultimoPassa = r.pino; destacar(r.pino); } op.aoMarcador && op.aoMarcador(r.pino, "passa", r.xy); op.aoPassar && op.aoPassar(null); return; }
    if (ultimoPassa != null) { ultimoPassa = null; destacar(null); op.aoMarcador && op.aoMarcador(null, null, r.xy); }
    if (r.carro != null) { cv.style.cursor = "pointer"; op.aoPassar && op.aoPassar(null); return; }
    cv.style.cursor = r.f != null ? "crosshair" : "grab";
    op.aoPassar && op.aoPassar(r.f != null ? { f: r.f, ...r.xy } : null);
  };
  const aoDescer = (ev) => { baixo = { x: ev.clientX, y: ev.clientY }; ctl.autoRotate = false; parouEm = performance.now(); };
  const aoSubir = (ev) => {
    const b = baixo; baixo = null; parouEm = performance.now(); if (!b || Math.hypot(ev.clientX - b.x, ev.clientY - b.y) > 5) return;
    const r = tocar(ev); if (r.pino != null) op.aoMarcador && op.aoMarcador(r.pino, "clique", r.xy);
    else if (r.carro != null) op.aoCarro && op.aoCarro(r.carro);
  };
  const aoSair = () => { if (ultimoPassa != null) { ultimoPassa = null; destacar(null); op.aoMarcador && op.aoMarcador(null, null, null); } op.aoPassar && op.aoPassar(null); };
  cv.addEventListener("pointermove", aoMover); cv.addEventListener("pointerdown", aoDescer); window.addEventListener("pointerup", aoSubir); cv.addEventListener("pointerleave", aoSair);

  // o tamanho acompanha a caixa
  const ajustar = () => { const w = Math.max(1, caixa.clientWidth), h = Math.max(1, caixa.clientHeight); renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(ajustar) : null; if (ro) ro.observe(caixa); ajustar();

  // o laço: só desenha com a caixa na página; sozinho, o giro volta 6 s depois do último toque
  let vivo = true, raf = 0, ant = performance.now(), volta = 0;
  const tmp = new THREE.Vector3();
  function quadro(agora) {
    if (!vivo) return;
    if (!caixa.isConnected) { soltar(); return; }
    raf = requestAnimationFrame(quadro);
    const dt = Math.min(0.1, (agora - ant) / 1000); ant = agora;
    if (!baixo && !voo && !ctl.autoRotate && !reduz() && agora - parouEm > 6000 && realce == null) ctl.autoRotate = true;
    if (voo) { const u = Math.min(1, (agora - voo.t0) / voo.dur), e = u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2; ctl.target.lerpVectors(voo.de, voo.para, e); cam.position.lerpVectors(voo.cde, voo.cpara, e); if (u >= 1) { voo = null; parouEm = agora; } }
    if (seguindo && !voo) { const d = seguindo.clone().sub(ctl.target).multiplyScalar(Math.min(1, dt * 4)); ctl.target.add(d); cam.position.add(d); }
    ctl.update();
    // o carrinho: uma volta a cada 14 s, interpolado entre os pontos
    if (carro.visible && !reduz()) {
      volta = (volta + dt / 14) % 1; const x = volta * n, i = Math.floor(x), a = v[i % n], b = v[(i + 1) % n];
      carro.position.lerpVectors(a, b, x - i).y += 0.7;
      for (let k = 0; k < RASTRO; k++) { const q = v[((i - k * 2) % n + n) % n]; rastroPos.set([q.x, q.y + 0.7, q.z], k * 3); }
      rastroG.attributes.position.needsUpdate = true;
    } else if (carro.visible) { carro.position.copy(v[0]).y += 0.7; }
    // os pinos pulsam; o realçado cresce e os outros apagam
    const s = agora / 1000;
    for (const [id, p] of pinos) {
      const on = realce === id, apaga = realce != null && !on, u = ((s * 0.8 + p.fase) % 1);
      p.cabeca.scale.setScalar(on ? 1.6 : 1); p.cabeca.material.opacity = apaga ? 0.3 : 1; p.cabeca.material.transparent = apaga;
      p.haste.material.opacity = apaga ? 0.15 : 0.7;
      p.anel.scale.setScalar(1 + (reduz() ? 0.4 : u * (on ? 3.2 : 1.8))); p.anel.material.opacity = apaga ? 0.08 : (reduz() ? 0.5 : (1 - u) * 0.85);
    }
    // os números das curvas seguem a câmera (somem atrás dela)
    if (rotulos.length) {
      const w = caixa.clientWidth, h = caixa.clientHeight;
      for (const r of rotulos) { tmp.copy(r.p).project(cam); const fora = tmp.z > 1; r.el.style.transform = `translate(${((tmp.x + 1) / 2) * w}px, ${((1 - tmp.y) / 2) * h}px) translate(-50%, -50%)`; r.el.style.visibility = fora ? "hidden" : ""; }
    }
    if (carros.size) {
      const w = caixa.clientWidth, h = caixa.clientHeight;
      for (const c of carros.values()) {
        if (!c.m.visible) { c.el.style.visibility = "hidden"; continue; }
        tmp.copy(c.m.position); tmp.y += 1.8; tmp.project(cam);
        c.el.style.visibility = tmp.z > 1 ? "hidden" : ""; c.el.classList.toggle("on", c.on);
        c.el.style.transform = `translate(${((tmp.x + 1) / 2) * w}px, ${((1 - tmp.y) / 2) * h}px) translate(-50%, -100%)`;
      }
    }
    renderer.render(cena, cam);
  }
  raf = requestAnimationFrame(quadro);

  function soltar() {
    if (!vivo) return; vivo = false; cancelAnimationFrame(raf);
    cv.removeEventListener("pointermove", aoMover); cv.removeEventListener("pointerdown", aoDescer); window.removeEventListener("pointerup", aoSubir); cv.removeEventListener("pointerleave", aoSair);
    if (ro) ro.disconnect(); ctl.dispose();
    cena.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } });
    xadrez.dispose(); renderer.dispose(); try { renderer.forceContextLoss(); } catch (e) { /* já foi */ }
    cv.remove(); camadaRot.remove(); caixa.classList.remove("mn3");
  }
  return { marcadores, destacar, focar, aproximar, curvas, soltar, definirCarros, posicionar, seguir, pintar, temRelevo: T.temRelevo, get vivo() { return vivo; } };
}

// o brilho redondo do carrinho (uma textura só, feita uma vez)
let _brilho = null;
function brilho() {
  if (_brilho) return _brilho;
  const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.35, "rgba(255,255,255,.45)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return (_brilho = new THREE.CanvasTexture(c));
}
