// A LINHA DE COMANDO do editor de cenário (2026-11-16, o Thiago: "costumo usar o Enscape e o AutoCAD/Revit, estou acostumado com os atalhos de
// lá em inglês e com as funções de lá"). Digitar em qualquer lugar escreve o comando (como no AutoCAD); Enter ou Espaço executa, Enter vazio
// repete o último, Esc cancela. Os atalhos de duas letras do Revit rodam sozinhos (MV, RO, CO, MM, AR, AL, DI, HH, HI, HR, PN, UP, ZA, ZF...).
// Navegação do Enscape: segurando o botão DIREITO, o mouse olha e o WASD anda (Q/E descem e sobem; Shift mais rápido, Ctrl mais devagar);
// vírgula e ponto giram o sol; Ctrl+5…9 guarda uma vista e 5…9 volta a ela. F3 liga o OSNAP (encaixar no chão ao soltar), F8 o ORTHO (só um eixo),
// F9 o SNAP (passos de 10 u, 15° e 0,1 de escala).
import * as THREE from "three";
import { sun } from "../cena.js";

const AJUDA = [
  ["MV / M / MOVE", "mover (gizmo de mover)"], ["RO / ROTATE", "girar"], ["SC / SCALE", "escala"], ["CO / CP / COPY", "copiar (cópia ao lado; o item de cenário ou a peça do Craft)"],
  ["MM / MI / MIRROR", "espelhar (no eixo X da peça)"], ["AR / ARRAY", "matriz: N cópias com um passo, em X ou Z"], ["AL / ALIGN", "assentar no chão"], ["E / ERASE / DEL", "apagar (peça da pista: esconde)"],
  ["DI / DIST", "medir: dois cliques"], ["HH", "ocultar temporário"], ["HI", "isolar o escolhido"], ["HR", "mostrar tudo de novo"], ["PN / UP", "travar / destravar"],
  ["ZA / ZE", "zoom em tudo (a pista inteira)"], ["ZF / ZS", "zoom no escolhido"], ["TOP / FRONT / RIGHT / 3D", "vistas"], ["U / UNDO · REDO", "desfazer / refazer"],
  ["SNAP (F9) · ORTHO (F8) · OSNAP (F3)", "encaixes"], ["SUN", "sol: vírgula e ponto giram"], ["SA", "escolher todos iguais (mostra quantos)"], ["GP / GROUP · UG / UNGROUP", "agrupar (Ctrl+clique escolhe vários) / desagrupar"], ["? / HELP", "esta lista"],
];

export function criarComandos(ed) {
  const { cam, orbita, gizmo, renderer, raio, avisar } = ed;
  // ---------- a barra de baixo: o comando, o eco e os encaixes ----------
  const caixa = document.createElement("div"); caixa.id = "edCmd";
  caixa.innerHTML = `<div id="edCmdLog"></div><div class="edCmdLinha"><b>Command:</b><input id="edCmdIn" autocomplete="off" spellcheck="false" placeholder="digite um comando (? para a lista)"><span id="edCmdEst"></span></div>`;
  document.body.appendChild(caixa);
  const css = document.createElement("style");
  css.textContent = `#edCmd{position:fixed;left:364px;right:12px;bottom:12px;z-index:52;font:13px Consolas,'Cascadia Mono',monospace;color:#dfe6f0;pointer-events:none}
#edCmdLog{max-height:120px;overflow:auto;background:rgba(14,16,21,.82);border-radius:10px 10px 0 0;padding:6px 10px;white-space:pre-wrap;pointer-events:auto}#edCmdLog:empty{display:none}
.edCmdLinha{display:flex;gap:8px;align-items:center;background:rgba(18,21,27,.95);border:1px solid #2b313d;border-radius:10px;padding:6px 10px;pointer-events:auto}
.edCmdLinha b{color:#8fb4ff}#edCmdIn{flex:1;background:transparent;border:0;color:#fff;font:inherit;outline:none;text-transform:uppercase}
#edCmdEst{display:flex;gap:6px}#edCmdEst i{font-style:normal;font-size:11px;padding:2px 6px;border-radius:5px;background:#232833;color:#7f8aa0}#edCmdEst i.on{background:#2f63e0;color:#fff}
#edAjuda{display:none}`;
  document.head.appendChild(css);
  const entrada = caixa.querySelector("#edCmdIn"), log = caixa.querySelector("#edCmdLog"), est = caixa.querySelector("#edCmdEst");
  const eco = (t) => { log.textContent += (log.textContent ? "\n" : "") + t; log.scrollTop = 1e9; const l = log.textContent.split("\n"); if (l.length > 40) log.textContent = l.slice(-40).join("\n"); };
  const modos = { snap: false, ortho: false, osnap: true };
  function marcar() { est.innerHTML = [["SNAP", "snap", "F9"], ["ORTHO", "ortho", "F8"], ["OSNAP", "osnap", "F3"]].map(([n, k, f]) => `<i class="${modos[k] ? "on" : ""}" title="${f}">${n}</i>`).join(""); }
  function aplicarSnap() { gizmo.setTranslationSnap(modos.snap ? 10 : null); gizmo.setRotationSnap(modos.snap ? THREE.MathUtils.degToRad(15) : null); gizmo.setScaleSnap(modos.snap ? 0.1 : null); }
  function aplicarOrtho() { if (!modos.ortho) { gizmo.showX = gizmo.showY = gizmo.showZ = true; return; } } // (o ORTHO trava no eixo mais arrastado: ver o objectChange abaixo)
  marcar();

  // ---------- o escolhido ----------
  const escolhido = () => ed.escolhido();
  const precisa = () => { const o = escolhido(); if (!o) eco("  Selecione algo antes (clique numa peça)."); return o; };
  // ORTHO: no arrasto de mover, só o eixo que mais andou muda
  let inicioArrasto = null;
  gizmo.addEventListener("mouseDown", () => { inicioArrasto = gizmo.object ? gizmo.object.position.clone() : null; });
  gizmo.addEventListener("objectChange", () => {
    const o = gizmo.object; if (!o || !modos.ortho || !inicioArrasto || gizmo.mode !== "translate") return;
    const d = o.position.clone().sub(inicioArrasto), eixo = ["x", "y", "z"].reduce((a, b) => (Math.abs(d[b]) > Math.abs(d[a]) ? b : a), "x");
    for (const k of ["x", "y", "z"]) if (k !== eixo) o.position[k] = inicioArrasto[k];
  });
  // OSNAP: ao soltar o gizmo de mover, a peça assenta no chão
  // (2026-11-16, o Thiago: "se eu ponho no chão e desço a barrinha, ele devia entrar no chão") só assenta quando o arrasto foi de lado: quem
  // mexeu na altura (a seta verde) fica onde soltou, afundado ou no alto
  gizmo.addEventListener("mouseUp", () => { const o = gizmo.object; if (o && modos.osnap && gizmo.mode === "translate" && !o.userData.peca && ed.ehItem(o) && inicioArrasto && Math.abs(o.position.y - inicioArrasto.y) < 0.01) { ed.noChao(o); ed.guardar(o); } });

  // ---------- ocultar / isolar (só no editor, nada é salvo) ----------
  const ocultos = new Set();
  function ocultar(lista) { for (const o of lista) if (o.visible) { o.visible = false; ocultos.add(o); } }
  function mostrarTudo() { for (const o of ocultos) o.visible = true; ocultos.clear(); }
  function isolar(o) {
    const manter = new Set(); for (let p = o; p; p = p.parent) manter.add(p);
    const varrer = (g) => { for (const c of g.children) { if (manter.has(c)) { if (c !== o) varrer(c); } else if (c.visible && !c.isLight) { c.visible = false; ocultos.add(c); } } };
    varrer(ed.tr.grp); if (ed.obra()) varrer(ed.obra());
  }
  // ---------- medir ----------
  let medindo = null; const linhaMed = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0xffd23f, depthTest: false })); linhaMed.renderOrder = 999; linhaMed.visible = false; ed.scene.add(linhaMed);
  renderer.domElement.addEventListener("pointerup", (e) => {
    if (!medindo || e.button !== 0) return;
    const p = new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); raio.setFromCamera(p, cam);
    const hit = raio.intersectObjects([ed.tr.grp, ...(ed.obra() ? [ed.obra()] : [])], true).find((h) => h.object.visible); if (!hit) return;
    if (!medindo.a) { medindo.a = hit.point.clone(); eco(`  Primeiro ponto: ${fmt(medindo.a)}. Clique o segundo.`); return; }
    const a = medindo.a, b = hit.point, d = a.distanceTo(b), dh = Math.hypot(b.x - a.x, b.z - a.z);
    linhaMed.geometry.setFromPoints([a, b]); linhaMed.visible = true;
    eco(`  Distância: ${d.toFixed(1)} u (≈ ${(d / 4.8).toFixed(1)} m) · no chão ${dh.toFixed(1)} u · altura ${(b.y - a.y).toFixed(1)} u`); medindo = null;
  }, true);
  const fmt = (v) => `${v.x.toFixed(0)}, ${v.y.toFixed(0)}, ${v.z.toFixed(0)}`;

  // ---------- vistas salvas (Enscape: 5…9) e o sol (U/I) ----------
  const vistas = {}; try { Object.assign(vistas, JSON.parse(localStorage.getItem("editor:vistas:" + ed.pista) || "{}")); } catch {}
  function guardarVista(n) { vistas[n] = { p: cam.position.toArray(), t: orbita.target.toArray() }; try { localStorage.setItem("editor:vistas:" + ed.pista, JSON.stringify(vistas)); } catch {} eco(`  Vista ${n} guardada.`); }
  function voltarVista(n) { const v = vistas[n]; if (!v) return eco(`  A vista ${n} está vazia (Ctrl+${n} guarda).`); cam.position.fromArray(v.p); orbita.target.fromArray(v.t); orbita.update(); }
  let anguloSol = 0;
  function girarSol(graus) { anguloSol += graus; const alvo = sun.target.position, rel = sun.position.clone().sub(alvo), r = Math.hypot(rel.x, rel.z), a = Math.atan2(rel.z, rel.x) + THREE.MathUtils.degToRad(graus); sun.position.set(alvo.x + Math.cos(a) * r, sun.position.y, alvo.z + Math.sin(a) * r); eco(`  Sol girado ${anguloSol > 0 ? "+" : ""}${anguloSol}°`); }

  // ---------- os comandos ----------
  const C = {};
  const def = (nomes, fn) => { for (const n of nomes) C[n] = fn; };
  def(["MV", "M", "MOVE"], () => { gizmo.setMode("translate"); eco("  MOVE: arraste a seta (ORTHO trava num eixo, SNAP em passos de 10)."); });
  def(["RO", "ROTATE"], () => { gizmo.setMode("rotate"); eco("  ROTATE: arraste o anel."); });
  def(["SC", "SCALE"], () => { gizmo.setMode("scale"); eco("  SCALE: arraste o cubo."); });
  def(["CO", "CP", "COPY"], async () => { const o = precisa(); if (!o) return; const c = await ed.copiar(o, 30, 0); eco(c ? "  COPY: cópia ao lado (selecionada)." : "  COPY: só itens do cenário e peças do Craft."); });
  def(["MM", "MI", "MIRROR"], () => { const o = precisa(); if (!o) return; const a = ed.estado(o); o.scale.x *= -1; ed.guardar(o); ed.registrar({ tipo: "mexer", o, antes: a, depois: ed.estado(o) }); eco("  MIRROR: espelhado em X."); });
  def(["AR", "ARRAY"], async () => {
    const o = precisa(); if (!o) return;
    const n = Math.round(+prompt("ARRAY: quantas cópias?", "5")); if (!(n > 0)) return;
    const passo = +prompt("Distância entre elas (u)?", "30"); if (!Number.isFinite(passo)) return;
    const eixo = (prompt("Eixo (X ou Z)?", "X") || "X").toUpperCase() === "Z" ? "z" : "x";
    let feitas = 0; for (let k = 1; k <= n; k++) if (await ed.copiar(o, eixo === "x" ? passo * k : 0, eixo === "z" ? passo * k : 0, false)) feitas++;
    eco(`  ARRAY: ${feitas} cópias a cada ${passo} u em ${eixo.toUpperCase()}.`);
  });
  def(["AL", "ALIGN"], () => { const o = precisa(); if (!o) return; const a = ed.estado(o); if (o.userData.peca) o.position.y = 0; else ed.noChao(o); ed.guardar(o); ed.registrar({ tipo: "mexer", o, antes: a, depois: ed.estado(o) }); eco("  ALIGN: no chão."); });
  def(["E", "ERASE", "DEL", "DELETE"], () => { const o = precisa(); if (!o) return; ed.apagar(); eco("  ERASE."); });
  def(["DI", "DIST", "MEASURE"], () => { medindo = {}; linhaMed.visible = false; eco("  DIST: clique o primeiro ponto."); });
  def(["HH"], () => { const o = precisa(); if (!o) return; ocultar([o]); ed.selecionar(null); eco("  HIDE: oculto até o HR (não é salvo)."); });
  def(["HI"], () => { const o = precisa(); if (!o) return; isolar(o); eco("  ISOLATE: só o escolhido. HR mostra tudo."); });
  def(["HR"], () => { mostrarTudo(); eco("  RESET: tudo à mostra."); });
  def(["PN", "PIN"], () => { const o = precisa(); if (!o) return; o.userData.pino = true; gizmo.detach(); eco("  PIN: travado (UP destrava)."); });
  def(["UP", "UNPIN"], () => { const o = escolhido(); if (o) { o.userData.pino = false; gizmo.attach(o); eco("  UNPIN."); } });
  def(["ZA", "ZE", "ZOOMALL"], () => { const b = new THREE.Box3().setFromObject(ed.tr.grp), c = b.getCenter(new THREE.Vector3()), r = Math.min(9000, b.getSize(new THREE.Vector3()).length() * 0.45); cam.position.set(c.x + r * 0.5, c.y + r * 0.7, c.z + r * 0.5); orbita.target.copy(c); orbita.update(); eco("  ZOOM ALL."); });
  def(["ZF", "ZS", "ZOOMFIT"], () => ed.vista("focar"));
  def(["TOP", "PLAN"], () => ed.vista("cima")); def(["FRONT"], () => ed.vista("frente")); def(["RIGHT", "LEFT", "SIDE"], () => ed.vista("lado")); def(["3D", "PERSP"], () => ed.vista("v3d"));
  def(["U", "UNDO"], () => ed.desfazer()); def(["REDO"], () => ed.refazer());
  def(["SNAP"], () => { modos.snap = !modos.snap; aplicarSnap(); marcar(); eco(`  SNAP ${modos.snap ? "ON" : "OFF"}`); });
  def(["ORTHO"], () => { modos.ortho = !modos.ortho; aplicarOrtho(); marcar(); eco(`  ORTHO ${modos.ortho ? "ON" : "OFF"}`); });
  def(["OSNAP"], () => { modos.osnap = !modos.osnap; marcar(); eco(`  OSNAP ${modos.osnap ? "ON" : "OFF"} (assentar no chão ao soltar)`); });
  def(["SUN"], () => eco("  SUN: vírgula e ponto giram o sol (15° por toque)."));
  def(["SA"], () => { const o = precisa(); if (!o) return; const nome = o.userData.item?.asset || o.userData.item?.marca || o.name; let n = 0; ed.tr.grp.traverse((x) => { if ((x.userData.item?.asset || x.userData.item?.marca || x.name) === nome) n++; }); eco(`  SA: ${n} iguais a "${nome}".`); });
  def(["?", "HELP"], () => eco(AJUDA.map(([a, b]) => `  ${a.padEnd(36)} ${b}`).join("\n")));
  def(["CRAFT"], () => ed.craftAlternar());
  def(["GP", "GROUP"], () => { const n = ed.agrupar(); eco(n ? `  GROUP: ${n} itens num grupo (selecionado). UG desfaz.` : "  GROUP: escolha 2 ou mais itens com Ctrl+clique."); });
  def(["UG", "UNGROUP"], () => { const n = ed.desagrupar(); eco(n ? `  UNGROUP: ${n} itens soltos.` : "  UNGROUP: escolha um grupo."); });

  let ultimo = "";
  async function executar(txt) {
    const c = (txt || ultimo).trim().toUpperCase(); if (!c) return; ultimo = c;
    eco("Command: " + c);
    if (C[c]) { try { await C[c](); } catch (e) { eco("  erro: " + e.message); } } else eco(`  Comando desconhecido "${c}". Digite ? para a lista.`);
  }
  // os de duas letras do Revit rodam sozinhos quando nenhum outro começa igual
  const sozinho = (b) => b.length >= 2 && C[b] && !Object.keys(C).some((k) => k !== b && k.startsWith(b));
  entrada.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (e.key === "Enter" || (e.key === " " && entrada.value.trim())) { e.preventDefault(); const v = entrada.value; entrada.value = ""; executar(v); entrada.blur(); }
    else if (e.key === "Escape") { entrada.value = ""; medindo = null; entrada.blur(); eco("*Cancel*"); }
  });
  entrada.addEventListener("input", () => { const v = entrada.value.trim().toUpperCase(); if (sozinho(v)) { entrada.value = ""; executar(v); entrada.blur(); } });
  // digitar em qualquer lugar vai para a linha de comando (como no AutoCAD); as teclas soltas ficam com os atalhos
  addEventListener("keydown", (e) => {
    if (e.target.closest?.("input,select,textarea") || voando) return;
    if (e.key === "F9") { e.preventDefault(); return C.SNAP(); } if (e.key === "F8") { e.preventDefault(); return C.ORTHO(); } if (e.key === "F3") { e.preventDefault(); return C.OSNAP(); }
    if (e.ctrlKey && /^[5-9]$/.test(e.key)) { e.preventDefault(); return guardarVista(e.key); }
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (/^[5-9]$/.test(e.key)) return voltarVista(e.key);
    if (e.key === "Enter") { e.preventDefault(); return executar(""); } // (Enter vazio repete o último)
    if (e.key === "Escape") { medindo = null; return; }
    if ((e.key === "," || e.key === ".") && !entrada.value) { e.preventDefault(); e.stopPropagation(); return girarSol(e.key === "," ? -15 : 15); } // (o sol: vírgula e ponto)
    if (e.key === "?" || (e.key.length === 1 && /[a-z]/i.test(e.key) && !e.shiftKey)) {
      e.preventDefault(); e.stopPropagation(); entrada.focus(); entrada.value += e.key; entrada.dispatchEvent(new Event("input"));
    }
  }, true);

  // ---------- voar como no Enscape: botão direito segurado ----------
  let voando = false, olhar = null;
  renderer.domElement.addEventListener("contextmenu", (e) => e.preventDefault());
  renderer.domElement.addEventListener("pointerdown", (e) => { if (e.button !== 2) return; voando = true; orbita.enabled = false; olhar = { x: e.clientX, y: e.clientY }; renderer.domElement.setPointerCapture?.(e.pointerId); }, true);
  addEventListener("pointermove", (e) => {
    if (!voando || !olhar) return; const dx = e.clientX - olhar.x, dy = e.clientY - olhar.y; olhar = { x: e.clientX, y: e.clientY };
    const eul = new THREE.Euler().setFromQuaternion(cam.quaternion, "YXZ"); eul.y -= dx * 0.004; eul.x = Math.max(-1.5, Math.min(1.5, eul.x - dy * 0.004)); cam.quaternion.setFromEuler(eul);
  });
  addEventListener("pointerup", (e) => { if (e.button !== 2 || !voando) return; voando = false; olhar = null; const f = new THREE.Vector3(); cam.getWorldDirection(f); orbita.target.copy(cam.position).addScaledVector(f, Math.max(60, cam.position.distanceTo(orbita.target))); orbita.enabled = true; orbita.update(); });
  const teclas = new Set(); addEventListener("keydown", (e) => { if (voando) { teclas.add(e.code); e.preventDefault(); } }, true); addEventListener("keyup", (e) => teclas.delete(e.code)); addEventListener("blur", () => teclas.clear());
  function quadro(dt) {
    if (!voando) return;
    const f = new THREE.Vector3(); cam.getWorldDirection(f); const d = new THREE.Vector3().crossVectors(f, cam.up).normalize(), m = new THREE.Vector3();
    if (teclas.has("KeyW")) m.add(f); if (teclas.has("KeyS")) m.sub(f); if (teclas.has("KeyD")) m.add(d); if (teclas.has("KeyA")) m.sub(d); if (teclas.has("KeyE")) m.y += 1; if (teclas.has("KeyQ")) m.y -= 1;
    if (!m.lengthSq()) return;
    const v = Math.max(120, Math.abs(cam.position.y - orbita.target.y) * 0.8) * (teclas.has("ShiftLeft") || teclas.has("ShiftRight") ? 3 : teclas.has("ControlLeft") || teclas.has("ControlRight") ? 0.25 : 1);
    cam.position.addScaledVector(m.normalize(), v * dt);
  }
  eco("Editor pronto. Digite ? para os comandos (MV, RO, CO, AR, DI, HI…). Botão direito + WASD voa.");
  return { quadro, pinado: (o) => !!o?.userData.pino };
}
