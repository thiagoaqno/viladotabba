// Corrida da Galera — os mecânicos do box (regras de F1): a equipe que espera o carro na frente da garagem e faz a troca dos pneus.
// O boneco é o mesmo dos pilotos do pódio (f1/podio/piloto.glb, podio-pilotos.js: macacão da equipe, luvas e capacete), mas aqui as poses
// são feitas por código, osso por osso (POSES: o giro de cada osso a partir do repouso), e a troca anda por fases pelo tempo da parada.
// Sem animação baixada: as poses copiam as fotos de referência de um pit stop (o pistoleiro ajoelhado em cada roda, quem tira o pneu velho,
// quem traz o novo, o macaco da frente e o de trás, e os que seguram o carro dos lados).
import * as THREE from "three";
import { clone as clonarEsqueleto } from "three/addons/utils/SkeletonUtils.js";
import { carregarPilotos, basePodio, materialDoCasco } from "./podio-pilotos.js";
import { uniformeDe, pintarTraje, pintarLuvas, TAM_FOLHA } from "./f1-uniformes.js";
import { pintarFolha } from "./f1-capacetes.js";

const R = Math.PI / 180;
// a altura do quadril sai sozinha (o pé ou o joelho mais baixo apoia no chão)
// [dobra, abre, gira] em graus, nos eixos do CORPO (não do osso): dobra gira em volta do eixo lateral (positivo leva para a frente um osso que
// aponta para baixo: coxa à frente; o joelho dobra com negativo; a coluna inclina para a frente com negativo; o braço vai à frente com positivo;
// o cotovelo dobra com positivo); abre gira em volta do eixo da frente; gira em volta do eixo vertical
export const POSES = {
  pronto: { Spine: [-15, 0, 0], LeftUpLeg: [30, 0, 0], RightUpLeg: [30, 0, 0], LeftLeg: [-50, 0, 0], RightLeg: [-50, 0, 0], LeftFoot: [20, 0, 0], RightFoot: [20, 0, 0], LeftArm: [40, 0, 0], RightArm: [40, 0, 0], LeftForeArm: [35, 0, 0], RightForeArm: [35, 0, 0] },
  ajoelhado: { Spine: [-25, 0, 0], LeftUpLeg: [85, 0, 0], LeftLeg: [-85, 0, 0], RightUpLeg: [0, 0, 0], RightLeg: [-95, 0, 0], RightFoot: [-20, 0, 0], LeftArm: [60, 0, 0], RightArm: [60, 0, 0], LeftForeArm: [20, 0, 0], RightForeArm: [20, 0, 0] },
  agachado: { Spine: [-35, 0, 0], LeftUpLeg: [110, 0, 0], RightUpLeg: [110, 0, 0], LeftLeg: [-125, 0, 0], RightLeg: [-125, 0, 0], LeftFoot: [20, 0, 0], RightFoot: [20, 0, 0], LeftArm: [65, 0, 0], RightArm: [65, 0, 0] },
  carregando: { Spine: [-8, 0, 0], LeftUpLeg: [15, 0, 0], RightUpLeg: [15, 0, 0], LeftLeg: [-25, 0, 0], RightLeg: [-25, 0, 0], LeftArm: [45, 0, 0], RightArm: [45, 0, 0], LeftForeArm: [60, 0, 0], RightForeArm: [60, 0, 0] },
  macaco: { Spine: [-30, 0, 0], LeftUpLeg: [50, 0, 0], LeftLeg: [-55, 0, 0], RightUpLeg: [-25, 0, 0], RightLeg: [-10, 0, 0], LeftArm: [75, 0, 0], RightArm: [75, 0, 0] },
  segurando: { Spine: [-45, 0, 0], LeftUpLeg: [35, 0, 0], RightUpLeg: [35, 0, 0], LeftLeg: [-35, 0, 0], RightLeg: [-35, 0, 0], LeftArm: [80, 0, 0], RightArm: [80, 0, 0] },
};

// os materiais de cada equipe (um conjunto para os 16 da equipe): traje, luvas e capacete
const MATS = new Map();
function materiaisDe(equipe, cor) {
  const chave = equipe + cor; if (MATS.has(chave)) return MATS.get(chave);
  const base = basePodio(), u = uniformeDe(equipe, cor);
  const tex = (canvas, flip) => { const t = new THREE.CanvasTexture(canvas); t.flipY = flip; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  const cT = document.createElement("canvas"); cT.width = cT.height = TAM_FOLHA; pintarTraje(cT, u, base.folhas, {});
  const cL = document.createElement("canvas"); cL.width = 256; cL.height = 128; pintarLuvas(cL, u, base.folhas);
  const cC = document.createElement("canvas"); cC.width = 512; cC.height = 256; pintarFolha(cC.getContext("2d"), [u.base, u.faixa, u.lado || "#ffffff"], "generico");
  const tC = tex(cC, true); tC.minFilter = THREE.LinearFilter; tC.generateMipmaps = false;
  let casco = null; base.cena.traverse((o) => { if (o.isSkinnedMesh && o.name === "casco") casco = materialDoCasco(o.geometry, tC); });
  const m = { traje: new THREE.MeshStandardMaterial({ map: tex(cT, false), roughness: 0.62 }), luvas: new THREE.MeshStandardMaterial({ map: tex(cL, false), roughness: 0.6 }), casco };
  MATS.set(chave, m); return m;
}

// um mecânico: { g, ossos, posar(a, b, t) } — mistura a pose `a` com a `b` (t de 0 a 1)
export function criarMecanico(equipe, cor) {
  const base = basePodio(), g = clonarEsqueleto(base.cena), m = materiaisDe(equipe, cor), ossos = {}, repouso = {};
  g.traverse((o) => {
    if (o.isBone) { ossos[o.name] = o; repouso[o.name] = { q: o.quaternion.clone(), p: o.position.clone() }; }
    if (!o.isSkinnedMesh) return;
    o.frustumCulled = false; o.castShadow = false; o.receiveShadow = false;
    if (o.name === "traje") o.material = m.traje; else if (o.name === "luvas") o.material = m.luvas;
    else if (o.name === "casco" || o.name === "vedacao") o.material = m.casco; else if (base.fixos[o.name]) o.material = base.fixos[o.name];
  });
  const inv = new THREE.Matrix4(), v = new THREE.Vector3(), w1 = new THREE.Vector3(), w2 = new THREE.Vector3();
  // os eixos do corpo, medidos no repouso: a frente é do tornozelo para a ponta do pé; o lateral sai da frente × cima. Cada osso guarda
  // esses eixos no espaço dele (no repouso), e o giro da pose é feito em volta deles: o mesmo sentido em todos os ossos
  g.updateMatrixWorld(true); const invG = new THREE.Matrix4().copy(g.matrixWorld).invert(), qG = new THREE.Quaternion(), tmp = new THREE.Vector3();
  const pt = (n) => new THREE.Vector3().setFromMatrixPosition(ossos[n].matrixWorld).applyMatrix4(invG);
  const frente = pt("LeftToeBase").sub(pt("LeftFoot")).setY(0).normalize(), cima = new THREE.Vector3(0, 1, 0), lateral = new THREE.Vector3().crossVectors(frente, cima).normalize();
  const eixos = {};
  for (const n in ossos) {
    ossos[n].matrixWorld.decompose(tmp, qG, tmp.clone()); const qRel = new THREE.Quaternion().setFromRotationMatrix(invG).multiply(qG).invert(); // (o repouso do osso no espaço do boneco, invertido)
    eixos[n] = [lateral.clone().applyQuaternion(qRel), frente.clone().applyQuaternion(qRel), cima.clone().applyQuaternion(qRel)];
  }
  const qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), q1 = new THREE.Quaternion();
  const giro = (pose, nome, q) => { q.identity(); const v = pose && pose[nome]; if (!v) return q; const ax = eixos[nome]; for (let k = 0; k < 3; k++) if (v[k]) q.multiply(q1.setFromAxisAngle(ax[k], v[k] * R)); return q; };
  const guinada = Math.atan2(frente.x, frente.z); // para virar o boneco para uma direção: rotation.y = atan2(dx, dz) − guinada
  return {
    g, ossos, guinada, frente,
    posar(a, b = a, t = 0) {
      const A = typeof a === "string" ? POSES[a] : a, B = typeof b === "string" ? POSES[b] : b;
      for (const nome in ossos) {
        giro(A, nome, qa); giro(B, nome, qb); qa.slerp(qb, t);
        ossos[nome].quaternion.copy(repouso[nome].q).multiply(qa);
      }
      // apoia no chão: o ponto mais baixo (pé, ponta do pé ou joelho) encosta no y = 0 do boneco
      const hips = ossos.Hips; hips.position.copy(repouso.Hips.p);
      g.updateMatrixWorld(true); inv.copy(g.matrixWorld).invert();
      let min = Infinity; for (const n of APOIO) { const o = ossos[n]; if (o) { v.setFromMatrixPosition(o.matrixWorld).applyMatrix4(inv); min = Math.min(min, v.y); } }
      if (Number.isFinite(min)) { // a descida (no y do boneco) vira o deslocamento do quadril no espaço do pai dele (o esqueleto pode vir girado e escalado)
        const d = FOLGA_CHAO - min; w1.set(0, 0, 0).applyMatrix4(g.matrixWorld); w2.set(0, d, 0).applyMatrix4(g.matrixWorld).sub(w1);
        v.setFromMatrixPosition(hips.matrixWorld).add(w2); hips.position.copy(hips.parent.worldToLocal(v));
      }
    },
  };
}
const APOIO = ["LeftFoot", "RightFoot", "LeftToeBase", "RightToeBase", "LeftLeg", "RightLeg"], FOLGA_CHAO = 0.06; // (o osso fica no meio da peça: a sola e o joelho ficam uns 6 cm abaixo dele)

export const carregarMecanicos = carregarPilotos;

// ---------- a equipe do box ----------
// Em metros, no quadro do carro (frente para −z): as rodas da frente em z −1,16 e as de trás em +1,57 (medidas no modelo de 2026).
const ESCALA_GENTE = 0.86; // (o carro do jogo tem 4,35 m, menor que um F1 de verdade: a gente acompanha, para não parecer gigante do lado dele)
const RODAS = [[-0.63, -1.16], [0.63, -1.16], [-0.59, 1.57], [0.59, 1.57]], RAIO = 0.36;
// a linha do tempo de cada função, de 0 (o carro parou) a 1 (a troca acabou): [t, pose]; entre dois pontos a pose se mistura
const PAPEIS = {
  pistola: [[0, "pronto"], [0.07, "ajoelhado"], [0.93, "ajoelhado"], [1, "pronto"]],
  tira: [[0, "pronto"], [0.1, "agachado"], [0.32, "agachado"], [0.48, "carregando"], [1, "carregando"]],
  poe: [[0, "carregando"], [0.42, "carregando"], [0.55, "agachado"], [0.8, "agachado"], [0.95, "pronto"], [1, "pronto"]],
  macaco: [[0, "pronto"], [0.05, "macaco"], [0.95, "macaco"], [1, "pronto"]],
  apoio: [[0, "pronto"], [0.06, "segurando"], [0.94, "segurando"], [1, "pronto"]],
};
const suave = (x) => x * x * (3 - 2 * x);
function poseNoTempo(linha, t) {
  if (t <= linha[0][0]) return [linha[0][1], linha[0][1], 0];
  for (let i = 1; i < linha.length; i++) if (t <= linha[i][0]) { const [t0, a] = linha[i - 1], [t1, b] = linha[i]; return [a, b, suave((t - t0) / Math.max(1e-6, t1 - t0))]; }
  const u = linha[linha.length - 1][1]; return [u, u, 0];
}
let pneuGeo = null, pneuMats = null, barraGeo = null, barraMat = null;
function pneu(composto) {
  if (!pneuGeo) {
    pneuGeo = new THREE.CylinderGeometry(RAIO, RAIO, 0.36, 20); pneuGeo.rotateZ(Math.PI / 2);
    pneuMats = {}; barraGeo = new THREE.CylinderGeometry(0.035, 0.035, 1.3, 8); barraGeo.rotateX(Math.PI / 2); barraMat = new THREE.MeshStandardMaterial({ color: 0xd8dade, roughness: 0.4, metalness: 0.6 });
  }
  const cor = { macio: 0xe8202a, medio: 0xf2d01a, duro: 0xf2f2f2, chuva: 0x2a7de1, intermediario: 0x2fb84a }[composto] || 0xf2d01a;
  const m = pneuMats[cor] || (pneuMats[cor] = [new THREE.MeshStandardMaterial({ color: 0x18191b, roughness: 0.9 }), new THREE.MeshStandardMaterial({ color: cor, roughness: 0.6 })]);
  const g = new THREE.Group(), borracha = new THREE.Mesh(pneuGeo, m[0]), faixa = new THREE.Mesh(new THREE.TorusGeometry(RAIO * 0.78, 0.018, 4, 24), m[1]);
  faixa.rotation.y = Math.PI / 2; faixa.position.x = 0.185; g.add(borracha, faixa); return g;
}
// a equipe inteira: { g (o grupo no quadro do carro, em metros), atualizar(estado), soltar() }
// estado: { fase: "espera" (o carro vem chegando) | "troca" (t de 0 a 1) | "fim" (a troca acabou; o carro sai), composto }
export function criarEquipeBox(equipe, cor) {
  const g = new THREE.Group(), gente = [];
  const por = (papel, x, z, olhaX, olhaZ, extra = {}) => { const m = criarMecanico(equipe, cor); m.g.scale.setScalar(ESCALA_GENTE); m.papel = papel; m.x = x; m.z = z; m.g.position.set(x, 0, z); m.g.rotation.y = Math.atan2(olhaX - x, olhaZ - z) - m.guinada; Object.assign(m, extra); g.add(m.g); gente.push(m); return m; };
  for (const [wx, wz] of RODAS) {
    const lado = Math.sign(wx), fora = wz < 0 ? -1 : 1; // (para fora do carro: o lado e, na frente ou atrás, a ponta)
    por("pistola", wx + lado * 0.62, wz, wx, wz);
    const tira = por("tira", wx + lado * 0.75, wz + fora * 0.55, wx, wz), poe = por("poe", wx + lado * 1.1, wz - fora * 0.55, wx, wz);
    tira.pneu = pneu(); tira.pneu.visible = false; tira.g.add(tira.pneu); tira.de = [tira.x, tira.z]; tira.para = [wx + lado * 1.15, wz + fora * 1.0]; // (sai para a ponta do carro, não para o lado: o lado de fora é a faixa por onde os outros passam)
    poe.pneu = pneu(); poe.g.add(poe.pneu); poe.de = [poe.x, poe.z]; poe.para = [wx + lado * 0.85, wz - fora * 0.15];
  }
  const frente = por("macaco", 0, -3.4, 0, -1), tras = por("macaco", 0, 3.1, 0, 2);
  for (const mac of [frente, tras]) { const b = new THREE.Mesh(barraGeo, barraMat); b.position.copy(mac.frente).multiplyScalar(0.8).setY(0.5); b.rotation.set(0, mac.guinada, 0); b.rotateX(-0.35); mac.g.add(b); }
  por("apoio", -1.05, 0.25, 0, 0.25); por("apoio", 1.05, 0.25, 0, 0.25);
  const segura = (m, pose) => { if (!m.pneu) return; const baixo = pose === "agachado"; m.pneu.position.copy(m.frente).multiplyScalar(baixo ? 0.5 : 0.42).setY(baixo ? 0.42 : 0.82); m.pneu.rotation.y = m.guinada; };
  let compostoAtual = null;
  return {
    g,
    atualizar({ fase, t = 0, composto }) {
      if (composto && composto !== compostoAtual) { compostoAtual = composto; for (const m of gente) if (m.papel === "poe") { m.g.remove(m.pneu); m.pneu = pneu(composto); m.g.add(m.pneu); } }
      for (const m of gente) {
        let a, b, k;
        if (fase === "troca") [a, b, k] = poseNoTempo(PAPEIS[m.papel], t);
        else if (fase === "fim") [a, b, k] = poseNoTempo(PAPEIS[m.papel], 1);
        else [a, b, k] = poseNoTempo(PAPEIS[m.papel], 0);
        m.posar(a, b, k); segura(m, k < 0.5 ? a : b);
        // quem leva o pneu anda: o que tira vai para fora com o velho, o que põe chega com o novo e some com ele no carro
        if (m.de) {
          const tt = fase === "troca" ? t : fase === "fim" ? 1 : 0;
          const anda = m.papel === "tira" ? suave(Math.min(1, Math.max(0, (tt - 0.32) / 0.2))) : suave(Math.min(1, Math.max(0, (tt - 0.38) / 0.17)));
          m.g.position.set(m.de[0] + (m.para[0] - m.de[0]) * anda, 0, m.de[1] + (m.para[1] - m.de[1]) * anda);
          if (m.papel === "tira") m.pneu.visible = tt > 0.18;
          else m.pneu.visible = tt < 0.78;
        }
      }
    },
    soltar() { g.removeFromParent(); },
  };
}

// ---------- na corrida ----------
// As equipes do box na pista (regras de F1): a equipe aparece na frente da sua garagem quando um carro dela entra no corredor e some
// quando os dois saíram. Só as MAX_EQUIPES mais perto da câmera, e só a menos de LONGE u dela (cada equipe são 16 bonecos com esqueleto).
const MAX_EQUIPES = 2, LONGE = 900, PECAS_FORA = ["hans", "metal", "vedacao"]; // (de longe essas peças não aparecem: menos chamadas de desenho)
export function criarBoxesDaCorrida(tr, cena, escala) {
  const cor = tr.corredor, F1 = window.F1Regras; if (!cor || !F1) return null;
  let pronto = false, falhou = false; carregarMecanicos().then(() => { pronto = true; }).catch(() => { falhou = true; });
  const equipes = new Map(), visto = new Map(); // equipe → { eq, ... }; id do carro → { dur, trocou }
  const ancora = (garagem) => {
    const u = garagem, i = cor.i0 + Math.floor(u), f = u - Math.floor(u), a = tr.pts[i % tr.n], b = tr.pts[(i + 1) % tr.n], lat = cor.garagemLat;
    const x = a.x + (b.x - a.x) * f, y = a.y + (b.y - a.y) * f, h = a.h + (b.h - a.h) * f;
    return { x: x + a.nx * lat, z: y + a.ny * lat, h, rot: Math.atan2(-a.tx, -a.ty) }; // (a frente do carro, −z do grupo, segue a pista)
  };
  return {
    // carros: [{ id, equipe, cor, grid, noBox, fase (Sim.faseDoBox), composto }]; camPos: a posição da câmera
    atualizar(carros, camPos) {
      if (!pronto || falhou) return;
      const ativos = new Map();
      for (const c of carros) {
        if (!c.noBox || !c.equipe) { visto.delete(c.id); continue; }
        const v = visto.get(c.id) || { dur: 0, trocou: false }; visto.set(c.id, v);
        let fase = "espera", t = 0;
        if (c.fase && c.fase.fase === "troca") { if (!v.dur || c.fase.resta > v.dur) v.dur = Math.max(0.5, c.fase.resta); t = Math.min(1, Math.max(0, 1 - c.fase.resta / v.dur)); fase = "troca"; if (t > 0.97) v.trocou = true; }
        else if (v.trocou) fase = "fim";
        const atual = ativos.get(c.equipe), prio = fase === "troca" ? 2 : fase === "espera" ? 1 : 0; // (os dois carros da equipe no corredor: vale o que está trocando)
        if (!atual || prio > atual.prio) ativos.set(c.equipe, { c, fase, t, prio });
      }
      // as mais perto da câmera
      const lista = [...ativos.values()].map((a) => { const p = ancora(F1.garagemDe(cor, a.c.grid, a.c.equipe)); return { ...a, p, d: Math.hypot(p.x - camPos.x, p.z - camPos.z) }; })
        .filter((a) => a.d < LONGE).sort((a, b) => a.d - b.d).slice(0, MAX_EQUIPES);
      const usadas = new Set(lista.map((a) => a.c.equipe));
      for (const [k, e] of equipes) if (!usadas.has(k)) e.eq.g.visible = false;
      for (const a of lista) {
        let e = equipes.get(a.c.equipe);
        if (!e) { e = { eq: nova(a.c.equipe, a.c.cor) }; equipes.set(a.c.equipe, e); }
        e.eq.g.visible = true; e.eq.g.position.set(a.p.x, a.p.h, a.p.z); e.eq.g.rotation.y = a.p.rot;
        e.eq.atualizar({ fase: a.fase, t: a.t, composto: a.c.composto });
      }
    },
    // as equipes [{ equipe, cor }] montadas ANTES da largada, bem abaixo do chão e visíveis, para o aquecimento da pista (jogo.js) compilar os
    // shaders delas (as malhas com esqueleto) e subir as texturas: montadas na primeira vez que um carro entrava no box, travavam o jogo.
    // Devolve os grupos (o aquecimento os esconde depois; `atualizar` mostra cada um quando a equipe estiver no box).
    preparar(lista) {
      return carregarMecanicos().then(() => { pronto = true; return lista.filter((x) => x.equipe).map(({ equipe, cor }) => {
        let e = equipes.get(equipe); if (!e) { e = { eq: nova(equipe, cor) }; equipes.set(equipe, e); }
        e.eq.g.visible = true; e.eq.g.position.set(0, -1e5, 0); e.eq.atualizar({ fase: "troca", t: 0.5 }); return e.eq.g;
      }); }, () => []);
    },
    soltar() { for (const e of equipes.values()) e.eq.soltar(); equipes.clear(); },
  };
  function nova(equipe, cor) {
    const eq = criarEquipeBox(equipe, cor || "#888888"); eq.g.scale.setScalar(escala);
    eq.g.traverse((o) => { if (o.isSkinnedMesh && PECAS_FORA.includes(o.name)) o.visible = false; });
    cena.add(eq.g); return eq;
  }
}
