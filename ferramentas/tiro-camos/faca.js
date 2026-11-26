/* Skins da faca do Tiro da Galera (2026-11-26). A faca (buildKnifeModel, 06c-models.js) só aparece na vista em primeira pessoa
   e não tem nível como as armas: as skins se liberam por abates com a faca (o golpe e a faca de arremesso), contados neste
   aparelho (localStorage 'tiro_faca'), e se escolhem em Opções > Jogo > Interface > "Skins da faca".
   A faca montada tem uma malha por matéria (bakeRig de um grupo rígido): lâmina (knifeSteel), guarda e pomo (metal), cabo
   (poly e dark). Cada skin troca essas matérias; os motivos usam as telas das camuflagens (camoTexture) em projeção triplanar
   no espaço da faca, e o Holo usa o próprio shader do Holo (camoPatch). */
const FACA_KEY = 'tiro_faca';
const FACA = (() => { try { const o = JSON.parse(localStorage.getItem(FACA_KEY) || '{}'); return { k: o.k | 0, s: typeof o.s === 'string' ? o.s : 'padrao' }; } catch (e) { return { k: 0, s: 'padrao' }; } })();
const facaSalvar = () => { try { localStorage.setItem(FACA_KEY, JSON.stringify(FACA)); } catch (e) { /* sem espaço */ } };
/* lamina, guarda, cabo: { c: cor, r: aspereza, m: metal, tex: motivo (id de camuflagem ou 'damasco'), k: tamanho do motivo (m) } */
const FACA_SKINS = {
  padrao: { name: 'Padrão', kills: 0 },
  tatica: { name: 'Tática', kills: 1, lamina: { c: 0x1d1e20, r: 0.55, m: 0.6 }, guarda: { c: 0x151617, r: 0.6, m: 0.5 }, cabo: { c: 0x3f4430, r: 0.8, m: 0.02 } },
  damasco: { name: 'Damasco', kills: 5, lamina: { tex: 'damasco', r: 0.3, m: 0.6, k: 0.18 }, guarda: { c: 0xb08a3e, r: 0.3, m: 1 }, cabo: { c: 0x4a2a18, r: 0.55, m: 0.02 } },
  onca: { name: 'Onça', kills: 10, lamina: { tex: 'onca', r: 0.4, m: 0.35, k: 0.07 }, guarda: { c: 0x1a1a1a, r: 0.45, m: 0.7 }, cabo: { c: 0x1d140c, r: 0.7, m: 0.02 } },
  carbono: { name: 'Carbono', kills: 15, lamina: { tex: 'carbono', r: 0.3, m: 0.2, k: 0.035 }, guarda: { c: 0x101112, r: 0.35, m: 0.8 }, cabo: { tex: 'carbono', r: 0.35, m: 0.2, k: 0.035 } },
  ouro: { name: 'Ouro', kills: 25, lamina: { c: 0xf0c45a, r: 0.25, m: 0.7 }, guarda: { c: 0xc99a2e, r: 0.25, m: 1 }, cabo: { c: 0x111111, r: 0.6, m: 0.05 } },
  rubi: { name: 'Rubi', kills: 40, lamina: { tex: 'rubi', r: 0.2, m: 0.6, k: 0.08 }, guarda: { c: 0xd4af4a, r: 0.22, m: 1 }, cabo: { c: 0x3a0710, r: 0.5, m: 0.05 } },
  galaxia: { name: 'Galáxia', kills: 60, lamina: { tex: 'galaxia', r: 0.35, m: 0.25, k: 0.1 }, guarda: { c: 0xc9ccd6, r: 0.2, m: 1 }, cabo: { c: 0x120c26, r: 0.6, m: 0.05 } },
  holo: { name: 'Holo', kills: 100, lamina: { tex: 'holo', r: 0.1, m: 1, k: 0.06 }, guarda: { c: 0xe8ecf2, r: 0.12, m: 1 }, cabo: { c: 0xf2f2f4, r: 0.4, m: 0.1 } },
};
for (const id in FACA_SKINS) FACA_SKINS[id].id = id;
const facaPresa = (S) => S.kills > FACA.k && !CAMOS_TODAS; // (modo de teste: camuflagens.js)
if (!FACA_SKINS[FACA.s] || facaPresa(FACA_SKINS[FACA.s])) FACA.s = 'padrao';

/* Aço de Damasco: camadas onduladas claras e escuras (ondas de frequência inteira: emenda nas bordas) */
let FACA_DAMASCO = null;
function facaDamascoCanvas() {
  if (FACA_DAMASCO) return FACA_DAMASCO;
  const N = 256, cv = document.createElement('canvas'); cv.width = cv.height = N;
  const g = cv.getContext('2d'), img = g.createImageData(N, N), T = Math.PI * 2;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = x / N * T, v = y / N * T;
    const w = 10 * v + 2.2 * Math.sin(2 * u + 0.7) + 1.4 * Math.sin(3 * u + 2 * v + 1.9) + 0.8 * Math.sin(5 * u - v + 0.3);
    const s = Math.sin(w * 2.4), c = Math.round(100 + 95 * Math.sign(s) * Math.pow(Math.abs(s), 0.45)), k = (y * N + x) * 4;
    img.data[k] = c; img.data[k + 1] = c + 3; img.data[k + 2] = c + 7; img.data[k + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return (FACA_DAMASCO = cv);
}
const FACA_TEX = {};
function facaTextura(id) {
  if (id !== 'damasco') return camoTexture(id);
  if (!FACA_TEX[id]) { const t = new THREE.CanvasTexture(facaDamascoCanvas()); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; FACA_TEX[id] = t; }
  return FACA_TEX[id];
}
/* Motivo em projeção triplanar no espaço da faca (como camoTri, sem UV) */
function facaTri(m, tex, k) {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uFacaT = { value: tex }; sh.uniforms.uFacaK = { value: 1 / k };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vFacaP;\nvarying vec3 vFacaN;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvFacaP = position; vFacaN = normal;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D uFacaT; uniform float uFacaK; varying vec3 vFacaP; varying vec3 vFacaN;').replace('#include <map_fragment>', `#include <map_fragment>
  {
    vec3 w = pow(abs(normalize(vFacaN)), vec3(5.0)); w /= (w.x + w.y + w.z);
    vec3 p = vFacaP * uFacaK;
    vec3 cc = texture2D(uFacaT, p.zy).rgb * w.x + texture2D(uFacaT, p.xz).rgb * w.y + texture2D(uFacaT, p.xy).rgb * w.z;
    diffuseColor.rgb = pow(cc, vec3(2.2)) * 0.85;
  }`);
  };
  m.customProgramCacheKey = () => 'faca-tri';
  return m;
}
const FACA_MATS = {};
function facaMaterial(sid, parte) {
  const key = sid + ':' + parte;
  if (FACA_MATS[key]) return FACA_MATS[key];
  const P = FACA_SKINS[sid][parte];
  const m = new THREE.MeshStandardMaterial({ color: P.tex ? 0xffffff : P.c, roughness: P.r, metalness: P.m, envMapIntensity: 1.3 });
  if (P.tex === 'holo') {
    camoPatch(m, 'holo');
    const ob = m.onBeforeCompile; m.onBeforeCompile = (sh, r) => { ob(sh, r); sh.uniforms.uCamoK.value = 1 / P.k; };
  } else if (P.tex) facaTri(m, facaTextura(P.tex), P.k);
  return (FACA_MATS[key] = m);
}
/* Aplica a skin escolhida na faca montada: cada malha lembra a matéria original (a da faca padrão) */
function facaAplicar(g = typeof VM !== 'undefined' && VM.knife) {
  if (!g) return;
  const M = gunMaterials(), S = FACA_SKINS[FACA.s] || FACA_SKINS.padrao;
  g.traverse((o) => {
    if (!o.isMesh) return;
    const orig = o.userData.facaOrig || (o.userData.facaOrig = o.material);
    const parte = orig === M.knifeSteel ? 'lamina' : orig === M.metal ? 'guarda' : orig === M.poly ? 'cabo' : null;
    o.material = parte && S[parte] ? facaMaterial(S.id, parte) : orig;
  });
}
{ const ob = buildKnifeModel; buildKnifeModel = function (M) { const g = ob(M); facaAplicar(g); return g; }; }

/* Abates com a faca: o golpe e a faca de arremesso (defisKill só é chamado para os abates do jogador, 09-game.js) */
{
  const ob = defisKill;
  defisKill = function (a, v, weapon, head) {
    if (a && a.isPlayer && (weapon === NET_WSPECIAL.knife || weapon === NET_WSPECIAL.tknife)) {
      const antes = FACA.k; FACA.k++; facaSalvar();
      for (const id in FACA_SKINS) { const s = FACA_SKINS[id]; if (s.kills > antes && s.kills <= FACA.k) setTimeout(() => { hudMsg(`Skin da faca liberada: ${s.name}`, 'neutral', 3); sfxUi('notify'); }, 900); }
    }
    return ob.apply(this, arguments);
  };
}

/* Tela de escolha: um quadro por skin, com a amostra, o nome e quantos abates faltam */
function facaAmostra(S) {
  const L = S.lamina;
  if (!L) return 'linear-gradient(135deg,#d2d7da,#8e9396 55%,#27282a 56%)';
  if (L.tex) return `url(${L.tex === 'damasco' ? facaDamascoCanvas().toDataURL() : camoSwatch(L.tex)}) center / cover`;
  const hex = (c) => '#' + c.toString(16).padStart(6, '0');
  return `linear-gradient(135deg,${hex(L.c)},${hex(L.c)} 55%,${hex(S.cabo.c)} 56%)`;
}
function facaAbrir() {
  let box = document.getElementById('facaSkins');
  if (!box) {
    const st = document.createElement('style');
    st.textContent = `#facaSkins{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.6);font-family:inherit}
#facaSkins .fs-p{background:#15171a;border:1px solid #3a3d42;border-radius:10px;padding:16px 18px;max-width:560px;width:92vw;color:#e8e6e1}
#facaSkins h3{margin:0 0 4px;font-size:18px;display:flex;justify-content:space-between;align-items:center}
#facaSkins h3 button{background:none;border:0;color:#aaa;font-size:22px;cursor:pointer}
#facaSkins .fs-k{margin:0 0 12px;color:#a9a8a2;font-size:13px}
#facaSkins .fs-g{display:flex;flex-wrap:wrap;gap:8px}
#facaSkins .fs-i{position:relative;width:118px;height:78px;border:2px solid #34373c;border-radius:6px;cursor:pointer;display:flex;flex-direction:column;justify-content:flex-end;padding:0;overflow:hidden;color:#fff}
#facaSkins .fs-i span{background:rgba(0,0,0,.6);padding:3px 6px;font-size:13px;text-align:left}
#facaSkins .fs-i small{display:block;font-size:11px;color:#f0c674}
#facaSkins .fs-i.on{border-color:#f5b82e;box-shadow:0 0 0 2px rgba(245,184,46,.35)}
#facaSkins .fs-i.lock{filter:grayscale(.85) brightness(.6);cursor:not-allowed}
#facaSkins .fs-i:hover:not(.lock){border-color:#8a8d92}`;
    document.head.appendChild(st);
    box = document.createElement('div'); box.id = 'facaSkins'; document.body.appendChild(box);
    box.addEventListener('click', (e) => {
      if (e.target === box || e.target.closest('[data-fechar]')) { box.remove(); sfxUi('click'); return; }
      const b = e.target.closest('[data-faca]'); if (!b) return;
      const S = FACA_SKINS[b.dataset.faca];
      if (facaPresa(S)) { sfxUi('locked'); return; }
      FACA.s = S.id; facaSalvar(); facaAplicar(); sfxUi('camo'); facaAbrir();
    });
    box.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); box.remove(); } }, true);
  }
  box.innerHTML = `<div class="fs-p" role="dialog" aria-label="Skins da faca"><h3>Skins da faca<button type="button" data-fechar="1" aria-label="Fechar">×</button></h3>
<p class="fs-k">Abates com a faca: <b>${FACA.k}</b>. Cada skin se libera com mais abates (o golpe e a faca de arremesso contam).</p>
<div class="fs-g">${Object.values(FACA_SKINS).map((S) => {
    const lock = facaPresa(S);
    return `<button type="button" class="fs-i${FACA.s === S.id ? ' on' : ''}${lock ? ' lock' : ''}" data-faca="${S.id}" style="background:${facaAmostra(S)}"><span>${S.name}${lock ? `<small>${S.kills} abates com a faca</small>` : ''}</span></button>`;
  }).join('')}</div></div>`;
  const on = box.querySelector('.fs-i.on'); if (on) on.focus({ preventScroll: true });
}
/* Botão em Opções > Jogo, no grupo Interface */
{
  const rows = OPT_TABS[0][1], i = rows.findIndex((r) => r[0] === 'head' && r[1] === _t('Interface'));
  rows.splice(i < 0 ? rows.length : i + 1, 0, ['button', 'Skins da faca', () => facaAbrir()]);
}
