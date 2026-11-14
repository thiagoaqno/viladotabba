// Corrida da Galera — a "vista" do carro de F1 de 2026 da equipe (como o modo de olhar o carro dos jogos de corrida): o carro girando num palco escuro,
// que se gira com o mouse e se aproxima com a roda, com pontos clicáveis em cada parte (asa dianteira, pneus, halo, laterais, ERS, motor, assoalho
// e asa traseira). Clicar num ponto leva a câmera até a peça e abre o cartão dela; ◀ ▶ (ou as setas) passam para a próxima; Esc fecha.
// O carro é o mesmo do jogo (f1.js, montarF1, com as cores da equipe). Onde fica cada ponto sai da caixa do modelo (a frente é −z), não de
// coordenadas soltas. O texto é o regulamento de 2026; o que é "no jogo" sai das próprias regras do jogo (f1-regras.js).
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { montarF1, coresDa, f1Pronto, soltarF1 } from "/corrida/f1.js";

const reduz = () => !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
const h = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const vidaPneus = () => { const P = window.F1Regras && window.F1Regras.PNEUS; return P ? ["macio", "medio", "duro"].filter((k) => P[k]).map((k) => `${P[k].nome.toLowerCase()} ${String(P[k].vida).replace(".", ",")}`).join(", ") : ""; };

// cada ponto: onde fica na caixa do carro (x de −1 a 1 na largura, y de 0 a 1 na altura, z de 0 = frente a 1 = traseira) e de onde a câmera olha
const PONTOS = [
  { id: "asa", nome: "Asa dianteira", p: [0, 0.12, 0.03], olhar: [0.9, 0.35, -1],
    txt: () => "Em 2026 a aerodinâmica ficou ativa: nas retas, os flaps da asa da frente e os da traseira abrem juntos para cortar o arrasto, e fecham na freada para devolver a pressão nas curvas. A asa ficou mais estreita que a de 2025, junto com o carro inteiro." },
  { id: "pneu", nome: "Pneus", p: [0.86, 0.36, 0.17], olhar: [1, 0.25, -0.35],
    txt: () => `Continuam com aro de 18 polegadas, mas mais estreitos: 25 mm a menos na frente e 30 mm atrás em relação a 2025.${vidaPneus() ? ` No jogo, a vida de cada composto até o penhasco, em voltas: ${vidaPneus()}.` : ""}` },
  { id: "halo", nome: "Halo", p: [0, 0.93, 0.42], olhar: [0.55, 0.9, -0.45],
    txt: () => "A barra de titânio sobre o cockpit, obrigatória desde 2018. Ela aguenta o peso de um ônibus de dois andares e salvou Romain Grosjean no Bahrein em 2020 e Zhou Guanyu em Silverstone em 2022." },
  { id: "lateral", nome: "Laterais e radiadores", p: [0.62, 0.48, 0.55], olhar: [1, 0.45, 0.15],
    txt: () => "As entradas laterais levam ar aos radiadores do motor e da parte elétrica. O desenho delas guia o ar por cima do assoalho até a traseira." },
  { id: "ers", nome: "ERS (a parte elétrica)", p: [-0.55, 0.52, 0.5], olhar: [-1, 0.5, 0.05],
    txt: () => "Em 2026 a força elétrica quase triplica: o MGU-K passa de 120 kW para 350 kW, perto de metade da potência do carro. O MGU-H, que tirava energia do turbo, saiu. Quem chega a menos de um segundo de outro carro ganha energia extra para atacar, o modo de ultrapassagem que substitui o DRS. No jogo, o modo do ERS se escolhe no volante." },
  { id: "motor", nome: "Unidade de potência", p: [0, 0.78, 0.66], olhar: [0.35, 0.95, 0.45],
    txt: () => "Continua um V6 turbo de 1,6 litro, agora com combustível 100% sustentável. Com o MGU-K mais forte, a potência fica dividida quase meio a meio entre o motor a combustão e o elétrico." },
  { id: "assoalho", nome: "Assoalho e difusor", p: [0, 0.07, 0.9], olhar: [0.45, 0.12, 1],
    txt: () => "O assoalho de efeito solo, o dos túneis de 2022, ficou mais plano e gera menos pressão por baixo. O carro também diminuiu: o entre-eixos máximo caiu de 3,6 m para 3,4 m, a largura de 2 m para 1,9 m, e o peso mínimo baixou 30 kg." },
  { id: "asatras", nome: "Asa traseira", p: [0, 0.97, 0.97], olhar: [0.5, 0.55, 1],
    txt: () => "Sem DRS em 2026: o flap de trás abre junto com o da frente em toda reta liberada, não só para quem ataca. No jogo, as zonas de DRS de cada pista continuam valendo." },
];

let aberta = null;
export function fecharVista() { if (aberta) aberta(); }

// abre a vista do carro da equipe `equipe` por cima da página; `aoFechar` é chamado quando ela fecha
export function abrirVista(equipe, aoFechar) {
  fecharVista();
  const FP = window.F1Pilotos, eq = (FP && FP.EQUIPES[equipe]) || {}, c1 = eq.cor || "#e10600", cores = coresDa(eq.pintura, c1);
  const raiz = document.createElement("div"); raiz.className = "vc"; raiz.setAttribute("role", "dialog"); raiz.setAttribute("aria-modal", "true"); raiz.setAttribute("aria-label", `O carro de 2026 da ${eq.nome || "equipe"}`);
  raiz.style.setProperty("--vc", c1);
  raiz.innerHTML = `<div class="vc-palco"></div><div class="vc-pontos"></div>
    <header class="vc-topo"><div><small>Vista do carro · 2026</small><h2>${h(eq.nome || "Seu carro")}</h2></div><button type="button" class="vc-x" aria-label="Fechar (Esc)">✕</button></header>
    <aside class="vc-cartao" hidden aria-live="polite"><div class="vc-c-topo"><small data-vc-n></small><h3 data-vc-t></h3></div><p data-vc-txt></p>
      <div class="vc-c-nav"><button type="button" data-vc-ant aria-label="Peça anterior">◀</button><button type="button" data-vc-geral>Visão geral</button><button type="button" data-vc-prox aria-label="Próxima peça">▶</button></div></aside>
    <p class="vc-ajuda">Arraste para girar · roda para aproximar · clique nos pontos</p><p class="vc-carga">Carregando o carro…</p>`;
  document.body.appendChild(raiz); document.body.classList.add("vc-on");
  const palco = raiz.querySelector(".vc-palco"), camada = raiz.querySelector(".vc-pontos"), cartao = raiz.querySelector(".vc-cartao");
  const foco0 = document.activeElement;

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true }); } catch (e) { renderer = null; }
  if (!renderer || !renderer.getContext()) { raiz.querySelector(".vc-carga").textContent = "Esta tela precisa de WebGL."; }
  const fechar = () => {
    if (aberta !== fechar) return; aberta = null; vivo = false; cancelAnimationFrame(raf);
    removeEventListener("keydown", tecla, true); if (ro) ro.disconnect();
    if (renderer) { if (carro) soltarF1(carro); cena && cena.traverse((o) => { if (o.geometry && !(carro && o.isMesh && carro.g.getObjectById(o.id))) o.geometry.dispose(); }); if (amb) amb.dispose(); renderer.dispose(); try { renderer.forceContextLoss(); } catch (e) { /* já foi */ } }
    if (ctl) ctl.dispose();
    raiz.remove(); document.body.classList.remove("vc-on");
    if (foco0 && foco0.isConnected) foco0.focus({ preventScroll: true });
    if (aoFechar) aoFechar();
  };
  aberta = fechar;
  raiz.querySelector(".vc-x").onclick = fechar;
  let vivo = true, raf = 0, ro = null, ctl = null, cena = null, amb = null, carro = null;
  let posPontos = null, atual = null, voo = null, girando = !reduz(), parado = 0;
  const tecla = (ev) => {
    if (ev.key === "Escape") { ev.preventDefault(); ev.stopPropagation(); fechar(); }
    else if (ev.key === "ArrowRight" && atual != null) { ev.preventDefault(); ir((atual + 1) % PONTOS.length); }
    else if (ev.key === "ArrowLeft" && atual != null) { ev.preventDefault(); ir((atual - 1 + PONTOS.length) % PONTOS.length); }
  };
  addEventListener("keydown", tecla, true);
  raiz.querySelector(".vc-x").focus({ preventScroll: true });
  if (!renderer) return;

  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.domElement.className = "vc-canvas"; palco.appendChild(renderer.domElement);
  cena = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer); amb = pm.fromScene(new RoomEnvironment(), 0.04); cena.environment = amb.texture; cena.environmentIntensity = 0.55; pm.dispose();
  cena.add(new THREE.HemisphereLight(0xcbd6ff, 0x101014, 0.35));
  const luz = (cor, i, x, y, z) => { const l = new THREE.DirectionalLight(cor, i); l.position.set(x, y, z); cena.add(l); return l; };
  luz(0xffffff, 1.6, -1, 8, 2.5); luz(0xfff4ea, 0.8, 5, 3, 7); luz(new THREE.Color(c1).lerp(new THREE.Color(0xffffff), 0.25), 2.4, -7, 2.6, -6); luz(0xffffff, 1.2, 8, 2, -5);
  // o palco: um disco escuro com o anel na cor da equipe e uma sombra macia embaixo do carro
  const disco = new THREE.Mesh(new THREE.CircleGeometry(4.2, 72), new THREE.MeshStandardMaterial({ color: 0x0c0f15, roughness: 0.38, metalness: 0.2 })); disco.rotation.x = -Math.PI / 2; cena.add(disco);
  const anel = new THREE.Mesh(new THREE.RingGeometry(4.05, 4.2, 96), new THREE.MeshBasicMaterial({ color: new THREE.Color(c1), toneMapped: false })); anel.rotation.x = -Math.PI / 2; anel.position.y = 0.004; cena.add(anel);
  const sombra = (() => { const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d"), gr = g.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, "rgba(0,0,0,.85)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
  const somb = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 6.2), new THREE.MeshBasicMaterial({ map: sombra, transparent: true, depthWrite: false })); somb.rotation.x = -Math.PI / 2; somb.position.y = 0.006; cena.add(somb);
  const mesa = new THREE.Group(); cena.add(mesa); // o carro gira na mesa

  const cam = new THREE.PerspectiveCamera(32, 1, 0.05, 80);
  ctl = new OrbitControls(cam, renderer.domElement);
  ctl.enableDamping = true; ctl.dampingFactor = 0.07; ctl.enablePan = false; ctl.minDistance = 2.2; ctl.maxDistance = 12; ctl.maxPolarAngle = 1.52; ctl.autoRotate = !reduz(); ctl.autoRotateSpeed = 0.9;
  const GERAL = { pos: new THREE.Vector3(-5.6, 2.3, -5.2), alvo: new THREE.Vector3(0, 0.45, 0) };
  cam.position.copy(GERAL.pos); ctl.target.copy(GERAL.alvo); ctl.update();

  const ajustar = () => { const w = Math.max(2, palco.clientWidth), hh = Math.max(2, palco.clientHeight); renderer.setSize(w, hh, false); cam.aspect = w / hh; cam.updateProjectionMatrix(); };
  ro = new ResizeObserver(ajustar); ro.observe(palco); ajustar();

  // os pontos (botões HTML projetados a cada quadro); onde ficam só se sabe depois que o carro chegou
  const botoes = PONTOS.map((p, i) => { const b = document.createElement("button"); b.type = "button"; b.className = "vc-ponto"; b.innerHTML = `<i></i><span>${h(p.nome)}</span>`; b.setAttribute("aria-label", p.nome); b.onclick = () => ir(i); b.hidden = true; camada.appendChild(b); return b; });
  const ray = new THREE.Raycaster(), tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(); let ultimaOclusao = 0, vez = 0; const tapado = new Array(PONTOS.length).fill(false);

  f1Pronto.catch(() => {}).then(() => {
    if (!vivo) return;
    try { carro = montarF1({ cor: cores[0], cor2: cores[1], equipe }); mesa.add(carro.g); } catch (e) { console.warn("vista do carro", e); raiz.querySelector(".vc-carga").textContent = "O carro não carregou."; return; }
    // espera um quadro para o modelo estar no lugar e mede a caixa (no espaço da mesa, antes de girar)
    requestAnimationFrame(() => {
      if (!vivo) return;
      const giro = mesa.rotation.y; mesa.rotation.y = 0; mesa.updateMatrixWorld(true); // a caixa sem o giro da mesa
      const caixa = new THREE.Box3().setFromObject(carro.g); mesa.rotation.y = giro; mesa.updateMatrixWorld(true);
      const tam = caixa.getSize(new THREE.Vector3()), min = caixa.min;
      posPontos = PONTOS.map((p) => new THREE.Vector3(p.p[0] * tam.x / 2 + (caixa.min.x + caixa.max.x) / 2, min.y + p.p[1] * tam.y, min.z + p.p[2] * tam.z));
      GERAL.alvo.set(0, tam.y * 0.42, (caixa.min.z + caixa.max.z) / 2); ctl.target.copy(GERAL.alvo);
      botoes.forEach((b) => { b.hidden = false; }); raiz.querySelector(".vc-carga").remove(); raiz.classList.add("pronto");
    });
  });

  // vai até uma peça: a mesa para de girar, a câmera voa e o cartão abre
  function ir(i) {
    if (!posPontos) return;
    atual = i; const P = PONTOS[i], alvo = posPontos[i].clone().applyMatrix4(mesa.matrixWorld), dir = new THREE.Vector3(...P.olhar).normalize().applyQuaternion(mesa.quaternion);
    voar(alvo, alvo.clone().add(dir.multiplyScalar(2.6)));
    cartao.hidden = false; cartao.querySelector("[data-vc-n]").textContent = `${i + 1} de ${PONTOS.length}`; cartao.querySelector("[data-vc-t]").textContent = P.nome; cartao.querySelector("[data-vc-txt]").textContent = P.txt();
    botoes.forEach((b, k) => b.classList.toggle("on", k === i));
  }
  function geral() { atual = null; cartao.hidden = true; botoes.forEach((b) => b.classList.remove("on")); voar(GERAL.alvo.clone(), GERAL.pos.clone()); }
  function voar(alvo, pos) { voo = { de: ctl.target.clone(), para: alvo, cde: cam.position.clone(), cpara: pos, t0: performance.now(), dur: reduz() ? 1 : 1100 }; ctl.autoRotate = false; girando = false; }
  cartao.querySelector("[data-vc-ant]").onclick = () => ir(((atual ?? 0) - 1 + PONTOS.length) % PONTOS.length);
  cartao.querySelector("[data-vc-prox]").onclick = () => ir(((atual ?? -1) + 1) % PONTOS.length);
  cartao.querySelector("[data-vc-geral]").onclick = geral;
  renderer.domElement.addEventListener("pointerdown", () => { ctl.autoRotate = false; girando = false; parado = performance.now(); });

  let ant = performance.now();
  function quadro(agora) {
    if (!vivo) return;
    raf = requestAnimationFrame(quadro);
    const dt = Math.min(0.1, (agora - ant) / 1000); ant = agora;
    if (girando && atual == null) mesa.rotation.y += dt * 0.25; // a mesa gira devagar enquanto ninguém mexe
    if (!girando && atual == null && !voo && !reduz() && agora - parado > 8000) girando = true;
    if (voo) { const u = Math.min(1, (agora - voo.t0) / voo.dur), e = u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2; ctl.target.lerpVectors(voo.de, voo.para, e); cam.position.lerpVectors(voo.cde, voo.cpara, e); if (u >= 1) { voo = null; parado = agora; } }
    ctl.update();
    if (posPontos && carro) {
      // se o ponto está atrás do carro (fica apagado): um ponto por vez, a cada 90 ms, para o raio no modelo não pesar
      const w = palco.clientWidth, hh = palco.clientHeight, checar = agora - ultimaOclusao > 90 ? (vez = (vez + 1) % PONTOS.length) : -1; if (checar >= 0) ultimaOclusao = agora;
      posPontos.forEach((p, i) => {
        tmp.copy(p).applyMatrix4(mesa.matrixWorld);
        if (i === checar) { const d = tmp.distanceTo(cam.position); ray.set(cam.position, tmp2.copy(tmp).sub(cam.position).normalize()); ray.far = d - 0.12; tapado[i] = ray.intersectObject(carro.g, true).length > 0; }
        tmp.project(cam); const b = botoes[i];
        b.style.transform = `translate(${((tmp.x + 1) / 2) * w}px, ${((1 - tmp.y) / 2) * hh}px)`; b.classList.toggle("atras", tapado[i] && i !== atual); b.style.visibility = tmp.z > 1 ? "hidden" : "";
      });
    }
    renderer.render(cena, cam);
  }
  raf = requestAnimationFrame(quadro);
}
