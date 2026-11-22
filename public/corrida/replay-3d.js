// Corrida da Galera — o replay 3D de um GP: a corrida gravada (corrida-gravacao.js) na pista do jogo, com os carros das equipes, as câmeras
// do jogo (cameras.js: cockpit, T-cam, bico, perseguição, aérea e TV) na visão de qualquer piloto, e o tempo para voltar, avançar e pausar.
// Roda na página do jogo aberta com `?replay=1` dentro de um quadro por cima da tela (replay-3d-abrir.js), como o editor de cenário: a página
// do jogo traz a pista, os carros e as câmeras; o socket dela não conecta (index.html), então nada daqui mexe na sala. Quem abriu manda o replay
// por mensagem: { replay: { passo, campos, mundo, ids, n, dados (base64) }, pista, ano, hora, voltas, pilotos: [{ id, nome, sigla, cor, eqId,
// numero, mods, stints }], j (a amostra de começo), sel (o piloto seguido) }.
// A amostra é de 250 ms; entre uma e outra, o carro anda numa curva de Hermite (a posição e a velocidade nas duas pontas), e não em linha reta:
// a 300 km/h ele anda ~100 u por amostra, e a reta cortava as curvas. Replay de antes de 2026-11-21 (6 bytes, sem a posição): o carro vai pela
// fração da volta, no meio da pista.
import { renderer, scene, cam, sun } from "./cena.js";
import { buildTrack, useTrack, groundH } from "./pista.js";
import { makeKart, poseKart, lodKart, dropKart, usarEscalaCarros, ocultarPiloto, CARS3, KS } from "./carros.js";
import { quadroCamera, ORDEM, NOMES, somDaCamera } from "./cameras.js";
import { Sound } from "./sons.js";
import { rotacao } from "./cambio.js";
import { nearest } from "./jogo.js";
import { desenhar, ajustarTela, definirEstacao } from "./pos.js";
import { ceuPronto, luzPendente } from "./ceu.js";
import { inclinacao as inclinacaoDoCarro } from "./inclinacao.js";
import { f1Pronto, modeloPronto, usarModelo } from "./f1.js";
import { propsPronto } from "./props.js";
import { animarVida } from "./vida.js";
import { quadroRecorte, carroVisivel, mostrarCarro } from "./recorte.js";

const FORA = 65535, KMH_POR_U = 0.75, VELS = [-8, -4, -2, -1, 0.25, 0.5, 1, 2, 4, 8, 16];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const giro = (d) => Math.atan2(Math.sin(d), Math.cos(d));
const corOk = (c) => (/^#[0-9a-f]{6}$/i.test(c || "") ? c : "#9aa1ad");
const rm = matchMedia("(prefers-reduced-motion: reduce)");
const fechar = () => parent !== window ? parent.postMessage({ tipo: "replay3d-fechar" }, location.origin) : history.back();

// ---------- a tela: só o 3D e os controles do replay ----------
// (2026-11-21, o Thiago: "apertei em replay 3d e ficou carregando infinito") a tela "preparando a corrida" (index.html, #preparoCorrida) só sai quando
// o jogo conecta, e aqui o socket não conecta: ela ficava por cima do replay pronto. Sai na hora, e o CSS abaixo a esconde se voltar
document.getElementById("preparoCorrida")?.remove();
for (const id of ["home", "lobby", "bar"]) document.getElementById(id)?.classList.add("hidden");
document.body.classList.add("modo-editor", "modo-replay"); // (menu.js não ouve as teclas no modo-editor: o Esc dele levava para a página inicial)
const css = document.createElement("style");
css.textContent = `body.modo-replay #home,body.modo-replay #lobby,body.modo-replay #bar,body.modo-replay #results,body.modo-replay #preparoCorrida,body.modo-replay .modal,body.modo-replay dialog{display:none!important}
body.modo-replay #race{display:block!important;visibility:visible!important}body.modo-replay #race>:not(canvas){display:none!important}body.modo-replay #screen{display:block!important}body.modo-replay #climaGotas{display:none!important}
#r3{position:fixed;inset:0;z-index:60;pointer-events:none;font:600 14px "Titillium Web",Barlow,system-ui,sans-serif;color:#eef1f6}
#r3 button{font:inherit;color:inherit;cursor:pointer;pointer-events:auto;border:1px solid #ffffff26;background:#0b0f16d9;border-radius:8px;transition:background .12s,border-color .12s,transform .12s}
#r3 button:hover{background:#1b2230ee;border-color:#ffffff66;transform:translateY(-1px)}#r3 button.on{background:var(--eq,#e10600);border-color:var(--eq,#e10600)}
#r3Topo{position:absolute;top:12px;left:50%;transform:translateX(-50%);display:flex;gap:10px;align-items:center;background:#0b0f16d9;border:1px solid #ffffff1f;border-radius:10px;padding:6px 14px}
#r3Topo b{font:800 18px "Barlow Condensed",sans-serif;letter-spacing:.04em}#r3Topo small{opacity:.75}
#r3Fechar{position:absolute;top:12px;right:12px;width:42px;height:42px;font-size:18px!important}
#r3Torre{position:absolute;top:12px;left:12px;width:178px;max-height:calc(100% - 140px);overflow:auto;pointer-events:auto;background:#0b0f16d9;border:1px solid #ffffff1f;border-radius:10px;padding:4px;margin:0;list-style:none}
#r3Torre li{display:flex;align-items:center;gap:8px;padding:3px 8px;border-radius:6px;cursor:pointer;border-left:3px solid var(--c)}#r3Torre li:hover{background:#ffffff14}
#r3Torre li.on{background:var(--c);color:#fff;text-shadow:0 1px 2px #0008}#r3Torre li.fora{opacity:.45}#r3Torre span{width:20px;text-align:right;opacity:.8;font-variant-numeric:tabular-nums}#r3Torre em{margin-left:auto;font-style:normal;font-size:11px;opacity:.85}
#r3Tele{position:absolute;right:12px;bottom:104px;min-width:200px;background:#0b0f16d9;border:1px solid #ffffff1f;border-left:4px solid var(--eq,#e10600);border-radius:10px;padding:8px 12px}
#r3Tele .nm{font:800 18px "Barlow Condensed",sans-serif;letter-spacing:.03em}#r3Tele .lin{display:flex;gap:14px;align-items:flex-end;margin-top:4px}#r3Tele strong{font:800 30px "Barlow Condensed",sans-serif;font-variant-numeric:tabular-nums}
#r3Tele .ped{display:flex;gap:4px;height:34px;align-items:flex-end}#r3Tele .ped i{width:9px;height:calc(var(--u)*100%);min-height:2px;border-radius:2px}#r3Tele .ped .g{background:#3ddc84}#r3Tele .ped .f{background:#ff4d4d}
#r3Barra{position:absolute;left:12px;right:12px;bottom:12px;pointer-events:auto;background:#0b0f16e6;border:1px solid #ffffff1f;border-radius:12px;padding:8px 12px;display:flex;flex-direction:column;gap:6px}
#r3Barra .bts{display:flex;gap:6px;align-items:center;flex-wrap:wrap}#r3Barra .bts button{min-width:40px;height:36px;padding:0 10px}
#r3Barra .vel{min-width:54px;text-align:center;font:800 16px "Barlow Condensed",sans-serif}#r3Barra .sep{flex:1}
#r3Tempo{width:100%;accent-color:var(--eq,#e10600)}#r3Ajuda{font-size:11px;opacity:.6}
#r3Carga{position:fixed;inset:0;z-index:70;display:grid;place-items:center;background:#080b11;color:#eef1f6;font:600 16px "Titillium Web",system-ui,sans-serif}`;
document.head.appendChild(css);
document.getElementById("race")?.classList.remove("hidden");
const carga = document.createElement("div"); carga.id = "r3Carga"; carga.textContent = "Carregando o replay…"; document.body.appendChild(carga);

// ---------- o replay: as amostras e o progresso de cada carro ----------
function ler(R) {
  const bin = atob(R.dados), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  const nc = R.ids.length, C = R.campos, M = R.mundo, comPos = C >= 12 && !!M, prog = R.ids.map(() => new Float32Array(R.n));
  R.ids.forEach((_, k) => { // voltas + fração, desenrolando a volta (como a miniatura, resultado-analise.js)
    let voltas = 0, ant = null;
    for (let j = 0; j < R.n; j++) {
      const o = (j * nc + k) * C, f16 = u8[o] | (u8[o + 1] << 8);
      if (f16 === FORA) { prog[k][j] = NaN; continue; }
      const f = f16 / (FORA - 1);
      if (ant == null) voltas = f > 0.5 ? -1 : 0; else if (ant - f > 0.5) voltas++; else if (f - ant > 0.5) voltas--;
      ant = f; prog[k][j] = voltas + f;
    }
  });
  const dv = new DataView(u8.buffer);
  const em = (j, k) => {
    if (j < 0 || j >= R.n) return null;
    const o = (j * nc + k) * C, f16 = u8[o] | (u8[o + 1] << 8); if (f16 === FORA) return null;
    const e = { f: f16 / (FORA - 1), kmh: u8[o + 2] * 2, gas: u8[o + 3] / 255, freio: u8[o + 4] / 255, marcha: u8[o + 5] & 127, box: !!(u8[o + 5] & 128), prog: prog[k][j], x: NaN, y: NaN, a: NaN };
    if (comPos) { const xs = dv.getUint16(o + 6, true), ys = dv.getUint16(o + 8, true); if (xs !== FORA && ys !== FORA) { e.x = M.x0 + xs * M.e; e.y = M.y0 + ys * M.e; e.a = (dv.getInt16(o + 10, true) / 32767) * Math.PI; } }
    return e;
  };
  return { ...R, prog, em, comPos, col: new Map(R.ids.map((id, k) => [id, k])), dur: ((R.n - 1) * R.passo) / 1000 };
}

// sem a posição gravada (o replay antigo): o ponto da pista na fração da volta, no meio dela
function pelaFracao(tr, e) {
  const s = e.f * tr.n, i = Math.floor(s) % tr.n, u = s - Math.floor(s), p = tr.pts[i], q = tr.pts[(i + 1) % tr.n];
  e.x = p.x + (q.x - p.x) * u; e.y = p.y + (q.y - p.y) * u; e.a = Math.atan2(p.ty, p.tx); return e;
}

// o carro no instante `s` (em amostras, com fração): Hermite entre as duas amostras vizinhas
function poseEm(D, tr, k, s) {
  const j = Math.floor(s), u = s - j;
  let a = D.em(j, k), b = D.em(j + 1, k);
  if (!a && !b) return null;
  if (!a) return u > 0.5 ? completar(tr, b) : null; // (entrando: aparece na metade)
  completar(tr, a); if (!b) return u < 0.5 ? a : null; completar(tr, b);
  const dt = D.passo / 1000, va = a.kmh / KMH_POR_U, vb = b.kmh / KMH_POR_U, dist = Math.hypot(b.x - a.x, b.y - a.y);
  const da = giro(b.a - a.a), r = da / dt;
  if (dist > Math.max(va, vb, 60) * dt * 2.5) return { ...(u < 0.5 ? a : b), v: u < 0.5 ? va : vb, r: 0 }; // um salto (o carro voltou para a pista): sem curva no meio
  const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u, h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2;
  const ma = va * dt, mb = vb * dt;
  return {
    x: h00 * a.x + h10 * ma * Math.cos(a.a) + h01 * b.x + h11 * mb * Math.cos(b.a),
    y: h00 * a.y + h10 * ma * Math.sin(a.a) + h01 * b.y + h11 * mb * Math.sin(b.a),
    a: a.a + da * u, v: va + (vb - va) * u, r, kmh: a.kmh + (b.kmh - a.kmh) * u, gas: a.gas + (b.gas - a.gas) * u, freio: a.freio + (b.freio - a.freio) * u,
    marcha: u < 0.5 ? a.marcha : b.marcha, box: a.box, prog: a.prog + (b.prog - a.prog) * u,
  };
}
const completar = (tr, e) => (Number.isFinite(e.x) ? e : pelaFracao(tr, e));

// ---------- a montagem ----------
let D = null, tr = null, info = new Map(), carros = new Map(), principal = null, quadro = null;
const st = { s: 0, vel: 1, tocando: false, sel: null, modo: "longe", ant: 0 };
const R = { cam: { pos: null, a: 0 }, kart: null, idx: 0, shake: 0, pitch: 0, dyChao: 0, naZebra: false, offroad: false };

addEventListener("message", (ev) => {
  if (ev.origin !== location.origin || !ev.data || ev.data.tipo !== "replay3d" || D) return;
  iniciar(ev.data).catch((e) => { console.warn("Corrida: replay 3D", e); carga.textContent = "O replay 3D não abriu: " + (e && e.message ? e.message : e); });
});
if (parent !== window) parent.postMessage({ tipo: "replay3d-pronto" }, location.origin);

async function iniciar(m) {
  D = ler(m.replay);
  const pista = m.pista || m.replay.pista;
  if (m.ano && window.F1Temporadas) { window.F1Temporadas.usarAno(m.ano); usarModelo(window.F1Temporadas.modeloDoAno(m.ano)); }
  { const real = window.Pistas.usarEscala(pista); usarEscalaCarros(real); window.Volante?.usarEscala?.(real); }
  tr = buildTrack(pista);
  const ceu = useTrack(tr, m.hora || "dia"); luzPendente();
  tr.mostrarBoxes = true; if (tr.boxesGP) { tr.boxesGP.userData.mostrar(true); tr.boxesGP.userData.colorir(window.F1Regras.EQUIPES_GARAGEM.map((id) => window.EQUIPES_F1?.[id]?.cor)); }
  if (tr.drsPlacas) tr.drsPlacas.visible = true; if (tr.gridGalera) tr.gridGalera.visible = false; if (tr.gridF1) tr.gridF1.visible = true;
  if (tr.portico) { tr.faixaGalera.visible = false; tr.portico.topF1.visible = tr.portico.grupo.visible = true; tr.luzes.set(0); }
  definirEstacao(tr.id);
  ceuPronto(tr.id, m.hora === "noite").catch(() => {});
  for (const p of m.pilotos || []) info.set(p.id, { ...p, cor: corOk(p.cor) });
  for (const id of D.ids) if (!info.has(id)) info.set(id, { id, nome: id, sigla: String(id).slice(0, 3).toUpperCase(), cor: "#9aa1ad" });
  await Promise.race([Promise.all([f1Pronto, modeloPronto(), propsPronto, ceu]).catch(() => {}), new Promise((ok) => setTimeout(ok, 12000))]);
  for (const id of D.ids) carros.set(id, { id, k: D.col.get(id), kart: montar(id, true), idx: 0, vira: 0, aAnt: null, zAnt: null, vz: 0 });
  st.voltas = m.voltas || 0;
  st.s = Math.max(0, Math.min(D.n - 1, +m.j || 0));
  st.modo = ORDEM.includes(m.camera) ? m.camera : "longe";
  seguir(D.col.has(m.sel) ? m.sel : D.ids[0]);
  montarHud();
  carga.remove();
  st.tocando = true; marcarPlay();
  addEventListener("resize", tamanho); tamanho();
  renderer.setAnimationLoop(laco);
}

function pinturaDe(p) {
  const eq = p.eqId && window.EQUIPES_F1?.[p.eqId];
  return { ...(p.mods || {}), ...(eq && eq.pintura && !(p.mods && p.mods.pintura) ? { pintura: eq.pintura } : {}) };
}
function montar(id, leve) {
  const p = info.get(id), eq = p.eqId && window.EQUIPES_F1?.[p.eqId];
  return makeKart(corOk(eq ? eq.cor : p.cor), "equilibrado", false, "", pinturaDe(p), undefined, leve, { numero: p.numero, sigla: leve ? p.sigla : null, volante: !leve });
}
// o carro seguido ganha o modelo completo (o cockpit e a T-cam precisam dele); o leve dele some
function seguir(id) {
  if (!carros.has(id)) return;
  if (principal) { dropKart(principal.kart); const c = carros.get(principal.id); if (c) c.kart.g.visible = true; }
  st.sel = id; principal = { id, kart: montar(id, false) }; R.kart = principal.kart; R.cam = { pos: null, a: R.cam.a || 0 };
  const cor = corOk(info.get(id).cor); document.documentElement.style.setProperty("--eq", cor);
  pintarHud(true);
}

function tamanho() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); ajustarTela(w, h); }

// a altura e a inclinação do carro (como os carros dos outros no jogo, jogo.js draw)
function porNoChao(c, e, kart, dt) {
  c.idx = nearest(tr, e.x, e.y, c.idx || 0);
  const W = CARS3.equilibrado, L = W.L * KS, Wd = W.W * KS, q = window.Sim.quadro(tr, e.x, e.y, c.idx), naPista = Math.abs(q.lat) <= (tr.W + Wd) / 2;
  const z = naPista ? q.h : groundH(tr, e.x, e.y, c.idx), gz = groundH(tr, e.x, e.y, c.idx);
  c.vz = ((z - (c.zAnt ?? z)) / Math.max(dt, 1e-3)) * 0.3 + c.vz * 0.7; c.zAnt = z;
  const inc = inclinacaoDoCarro(tr, e.x, e.y, e.a, c.idx, L, Wd, c.vz, false, e.v, true, window.Sim, groundH);
  const alvoVira = window.Pose?.volanteVisto ? window.Pose.volanteVisto(e.r || 0) : Math.max(-1, Math.min(1, (e.r || 0) / 2.4));
  c.vira += (alvoVira - c.vira) * Math.min(1, Math.abs(dt) * 12 || 0.2);
  poseKart(kart, e.x, e.y, z + (inc.dy || 0), e.a, e.v || 0, c.vira, gz, Math.abs(dt) || 1 / 60, inc.roll, inc.pitch, { f1: true, pneu: pneuDe(c.id, e.prog), drs: false });
  return { z, inc };
}
// o pneu de cada volta (os stints da análise do GP)
function pneuDe(id, prog) {
  const l = info.get(id)?.stints; if (!l || !l.length || !Number.isFinite(prog)) return null;
  const v = Math.floor(prog) + 1; for (const s of l) if (v >= s.de && v <= s.ate) return s.c; return l[l.length - 1].c;
}

let src = { x: 0, y: 0, z: 0, a: 0, v: 0 };
function laco(t) {
  const real = Math.min(0.25, (t - (st.ant || t)) / 1000); st.ant = t; const dt = Math.min(1 / 30, real);
  if (st.tocando) {
    st.s += (real * 1000 * st.vel) / D.passo;
    if (st.vel > 0 && st.s >= D.n - 1) { st.s = D.n - 1; st.tocando = false; marcarPlay(); }
    if (st.vel < 0 && st.s <= 0) { st.s = 0; st.tocando = false; marcarPlay(); } // (só tocando para trás: no primeiro quadro o tempo ainda é 0)
  }
  const dtv = dt * (st.tocando ? Math.sign(st.vel) * Math.min(4, Math.abs(st.vel)) : 0); // (as rodas e a suspensão andam com o replay)
  let alvo = null;
  for (const c of carros.values()) {
    const e = poseEm(D, tr, c.k, st.s);
    if (!e) { c.kart.g.visible = false; if (principal && principal.id === c.id) principal.kart.g.visible = false; continue; }
    if (principal && principal.id === c.id) { // o seguido: o modelo completo, sempre desenhado
      c.kart.g.visible = false; principal.kart.g.visible = true;
      // (2026-11-21, o Thiago: "as câmeras em primeira pessoa do replay estão quebradas") as de dentro do carro (cameras.js pov) inclinam a cabeça com
      // o volante (c.steer) e sobem com a inclinação (R.pitch, R.dyChao): sem eles a conta dava NaN e a câmera sumia
      const { z, inc } = porNoChao(c, e, principal.kart, dtv || dt * 0.001); alvo = { ...e, z, steer: c.vira, air: false }; R.idx = c.idx; R.pitch = inc.pitch || 0; R.dyChao = inc.dy || 0;
      continue;
    }
    const aparece = carroVisivel(tr, cam, e.x, e.y, c.idx); c.kart.g.visible = true; mostrarCarro(c.kart, aparece);
    if (!aparece) { c.kart.g.position.set(e.x, c.zAnt ?? 0, e.y); c.idx = nearest(tr, e.x, e.y, c.idx || 0); continue; }
    porNoChao(c, e, c.kart, dtv || dt * 0.001);
    lodKart(c.kart, Math.hypot(e.x - cam.position.x, e.y - cam.position.z));
  }
  if (alvo) src = alvo;
  // (2026-11-21, o Thiago: "o replay 3D não tem som") o motor do carro seguido, o mesmo som do jogo: a rotação sai da velocidade e da marcha gravadas;
  // pausado, procurando ou rápido demais (acima de 2×), fica mudo
  { const soa = !!alvo && st.tocando && Math.abs(st.vel) <= 2 && st.vel > 0, vU = Math.abs(src.v || 0), m = src.marcha || 1, vmax = (CARS3.equilibrado && CARS3.equilibrado.vmax) || 440;
    try { Sound.engine(soa ? vU : 0, soa, soa && (src.gas || 0) > 0.4, m, soa ? Math.max(0, Math.min(1.05, rotacao(vU, vmax, m))) : 0, { cam: somDaCamera(st.modo), lim: 0, ers: false, freio: (src.freio || 0) > 0.3, kmh: src.kmh || vU * 0.75 }); } catch (e) { /* sem som */ } }
  animarVida(tr, dt, src);
  const mode = quadroCamera(R, { dt, tr, c: src, src, nearest, rm: rm.matches, escolha: st.modo, assistindo: false, acabou: false, spec: CARS3.equilibrado, olharTras: false });
  if (principal) ocultarPiloto(principal.kart, mode === "cockpit");
  const sd = tr.sol; if (sd) sun.position.set(src.x + sd.x * 800, (src.z || 0) + sd.y * 800, src.y + sd.z * 800); else sun.position.set(src.x - 300, (src.z || 0) + 700, src.y + 260);
  sun.target.position.set(src.x, src.z || 0, src.y);
  if (tr.sky) tr.sky.position.set(cam.position.x, 0, cam.position.z);
  try { quadroRecorte(tr, cam, mode !== "cima" && mode !== "tv", nearest); } catch (e) { /* (o recorte é só para ganhar quadros) */ }
  scene.updateMatrixWorld(); scene.matrixWorldAutoUpdate = false;
  try { desenhar(mode === "cima" || mode === "tv" ? 0 : Math.min(1, Math.max(0, (Math.abs(src.v || 0) / 420 - 0.4) / 0.5)) * 0.6); }
  finally { scene.matrixWorldAutoUpdate = true; }
  pintarHud(false);
}

// ---------- os controles ----------
let el = null, ultHud = 0;
const ICO = { play: "▶", pausa: "❚❚" };
function montarHud() {
  el = document.createElement("div"); el.id = "r3";
  el.innerHTML = `<div id="r3Topo"><b data-volta>—</b><small data-hora>0:00</small><small data-aviso>${D.comPos ? "" : " · corrida gravada antes da posição: os carros vão no meio da pista"}</small></div>
    <button type="button" id="r3Fechar" aria-label="Fechar o replay" title="Fechar (Esc)">✕</button>
    <ol id="r3Torre" aria-label="Posições: clique para seguir o piloto"></ol>
    <div id="r3Tele"></div>
    <div id="r3Barra">
      <input type="range" id="r3Tempo" min="0" max="${D.n - 1}" step="0.01" value="0" aria-label="Momento do replay">
      <div class="bts">
        <button type="button" data-ac="-30" title="Voltar 30 s">−30s</button><button type="button" data-ac="-5" title="Voltar 5 s (←)">−5s</button>
        <button type="button" data-ac="tras" title="Mais rápido para trás">◀◀</button><button type="button" data-ac="play" title="Tocar / pausar (espaço)">▶</button><button type="button" data-ac="frente" title="Mais rápido para a frente">▶▶</button>
        <span class="vel" data-vel>1×</span>
        <button type="button" data-ac="5" title="Avançar 5 s (→)">+5s</button><button type="button" data-ac="30" title="Avançar 30 s">+30s</button>
        <span class="sep"></span>
        <button type="button" data-ac="ant" title="Piloto anterior (↑)">▲</button><button type="button" data-ac="prox" title="Próximo piloto (↓)">▼</button>
        <button type="button" data-ac="cam" title="Trocar a câmera (C)" data-cam>🎥 ${esc(NOMES[st.modo])}</button>
      </div>
      <small id="r3Ajuda">Espaço pausa · ← → 5 s · Shift + ← → 30 s · , . quadro a quadro · ↑ ↓ piloto · C câmera · clique na torre para seguir · Esc fecha</small>
    </div>`;
  document.body.appendChild(el);
  el.querySelector("#r3Fechar").onclick = fechar;
  el.querySelector("#r3Torre").onclick = (ev) => { const li = ev.target.closest("[data-id]"); if (li) seguir(li.dataset.id); };
  const barra = el.querySelector("#r3Tempo");
  barra.oninput = () => { st.s = +barra.value; };
  el.querySelector(".bts").onclick = (ev) => { const b = ev.target.closest("[data-ac]"); if (b) acao(b.dataset.ac); };
}
function acao(a) {
  const pula = (seg) => { st.s = Math.max(0, Math.min(D.n - 1, st.s + (seg * 1000) / D.passo)); };
  if (a === "play") { if (!st.tocando && st.vel > 0 && st.s >= D.n - 1) st.s = 0; if (!st.tocando && st.vel < 0 && st.s <= 0) st.s = D.n - 1; st.tocando = !st.tocando; }
  else if (a === "frente" || a === "tras") {
    let i = VELS.indexOf(st.vel); if (i < 0) i = VELS.indexOf(1);
    i = Math.max(0, Math.min(VELS.length - 1, i + (a === "frente" ? 1 : -1))); st.vel = VELS[i]; st.tocando = true;
  } else if (a === "ant" || a === "prox") {
    const l = ordem().filter((o) => !isNaN(o.pr)).map((o) => o.id), i = l.indexOf(st.sel);
    if (l.length) seguir(l[(i + (a === "prox" ? 1 : -1) + l.length) % l.length]);
  } else if (a === "cam") { st.modo = ORDEM[(ORDEM.indexOf(st.modo) + 1) % ORDEM.length]; el.querySelector("[data-cam]").textContent = "🎥 " + NOMES[st.modo]; }
  else if (a === "quadro+" || a === "quadro-") { st.tocando = false; st.s = Math.max(0, Math.min(D.n - 1, Math.round(st.s) + (a === "quadro+" ? 1 : -1))); }
  else if (Number.isFinite(+a)) pula(+a);
  marcarPlay();
}
function marcarPlay() {
  if (!el) return;
  const b = el.querySelector('[data-ac="play"]'); b.textContent = st.tocando ? ICO.pausa : ICO.play; b.setAttribute("aria-label", st.tocando ? "Pausar" : "Tocar");
  el.querySelector("[data-vel]").textContent = (st.vel < 0 ? "◀ " : "") + Math.abs(st.vel) + "×";
}
addEventListener("keydown", (e) => {
  if (!D || e.target && /input|select|textarea/i.test(e.target.tagName) && e.target.type !== "range") return;
  const k = e.key, m = { " ": "play", ArrowLeft: e.shiftKey ? "-30" : "-5", ArrowRight: e.shiftKey ? "30" : "5", ArrowUp: "ant", ArrowDown: "prox", c: "cam", C: "cam", ",": "quadro-", ".": "quadro+" }[k];
  if (k === "Escape") { e.preventDefault(); e.stopImmediatePropagation(); return fechar(); }
  if (m) { e.preventDefault(); e.stopImmediatePropagation(); acao(m); }
}, true);

const ordem = () => {
  const j = Math.max(0, Math.min(D.n - 1, Math.round(st.s)));
  return D.ids.map((id, k) => ({ id, k, pr: D.prog[k][j], e: D.em(j, k) })).sort((a, b) => (isNaN(b.pr) ? -1e9 : b.pr) - (isNaN(a.pr) ? -1e9 : a.pr));
};
const relogio = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
function pintarHud(forcar) {
  if (!el) return;
  const agora = performance.now(); if (!forcar && agora - ultHud < 120) return; ultHud = agora;
  const o = ordem(), lider = o[0] && !isNaN(o[0].pr) ? Math.max(1, Math.floor(o[0].pr) + 1) : 1;
  el.querySelector("[data-volta]").textContent = `VOLTA ${st.voltas ? Math.min(lider, st.voltas) : lider}${st.voltas ? "/" + st.voltas : ""}`;
  el.querySelector("[data-hora]").textContent = relogio((st.s * D.passo) / 1000) + " / " + relogio(D.dur);
  el.querySelector("#r3Torre").innerHTML = o.map((x, i) => { const p = info.get(x.id); return `<li data-id="${esc(x.id)}" class="${x.id === st.sel ? "on" : ""} ${x.e ? "" : "fora"}" style="--c:${p.cor}"><span>${x.e ? i + 1 : "—"}</span><b>${esc(p.sigla)}</b>${x.e && x.e.box ? "<em>BOX</em>" : ""}</li>`; }).join("");
  const barra = el.querySelector("#r3Tempo"); if (document.activeElement !== barra) barra.value = String(st.s);
  const p = info.get(st.sel), e = poseEm(D, tr, D.col.get(st.sel), st.s), pos = o.findIndex((x) => x.id === st.sel) + 1;
  el.querySelector("#r3Tele").innerHTML = `<div class="nm">${pos ? pos + "º · " : ""}${esc(p.nome || p.sigla)}</div>` + (e
    ? `<div class="lin"><span><strong>${Math.round(e.kmh)}</strong> km/h</span><span><small>marcha</small> <strong>${e.box ? "BOX" : e.marcha || "N"}</strong></span><span class="ped"><i class="g" style="--u:${e.gas.toFixed(2)}"></i><i class="f" style="--u:${e.freio.toFixed(2)}"></i></span></div>`
    : `<div class="lin"><small>fora da pista (abandonou ou já recebeu a bandeirada)</small></div>`);
}
