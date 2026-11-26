/* ==========================================================================
   IATE ESMERALDA (mapa nosso do Tiro da Galera; entra no jogo montado por ferramentas/tiro-frontline.js, antes do boot).
   Iate de luxo parado em alto-mar, 106 x 20 m, comprido em z: proa em +z (Alpha nasce no heliponto), popa em -z (Bravo nasce
   no convés de popa). Traçado próprio:
   - Proa: heliponto redondo, duas lanchas de apoio nos berços, castelo de proa fechado (não se sobe).
   - Salão Panorâmico (z 11 a 25): envidraçado, bar e sofás; escada central desce às cabines; teto = Solário (escadas externas).
   - Convés da Piscina (z -11 a 11): piscina elevada, espreguiçadeiras, armários de convés; escada central desce às cabines.
   - Cassino (z -27 a -11): mesas e bar; em cima, a Ponte de comando (janelão para a proa) e o terraço (escadas externas).
   - Popa: convés aberto com sofás e bar; duas escadas descem à Garagem das lanchas, aberta para o mar.
   - Embaixo (y -3): corredor das cabines de ponta a ponta (z -35 a 23), seis camarotes de cada lado, garagem na popa.
   - Passadiços laterais (x ±7 a ±10): linha de tiro da proa à popa.
   Níveis: convés principal y = 0 (o chão implícito do jogo: as apariçoes e as rotas usam gy0 = 0), cabines y = -3, Solário e
   terraço da ponte y = 3, mar em y = -4,3. Sem chão fora do navio (VOID): quem cair no mar morre; bordas com borda falsa sólida
   e parede invisível até 4,5 m, ninguém cai no vão.
   ========================================================================== */
const IA = { L: 106, B: 20.4, WL: -4.3, LD: -3, MD: 0, UD: 3, zT: -53, zBow: 41 };
/* casco: [t (0 popa, 1 proa), meia-largura (fração), borda (m acima da linha d'água), fim do costado reto, quilha, arredondamento] */
const HULL_IATE = [
  [0.0, 0.93, 5.35, 0.9, -0.6, 6], [0.05, 0.98, 5.35, 0.5, -1.8, 4.6], [0.2, 1.0, 5.35, 0.3, -2.7, 3.6], [0.6, 1.0, 5.4, 0.3, -2.9, 3.3],
  [0.75, 0.95, 5.5, 0.4, -2.8, 2.9], [0.86, 0.78, 5.7, 0.7, -2.5, 2.4], [0.94, 0.47, 6.0, 1.3, -1.7, 1.9], [1.0, 0.03, 6.3, 2.4, 0.1, 1.4],
];
const IA_C = {
  white: [0.95, 0.95, 0.94], cream: [0.9, 0.87, 0.8], teak: [0.66, 0.46, 0.3], teakDark: [0.42, 0.3, 0.2], navy: [0.08, 0.16, 0.36],
  rail: [0.86, 0.87, 0.89], glass: [0.32, 0.42, 0.48], dark: [0.16, 0.17, 0.19], green: [0.12, 0.38, 0.3], tile: [0.75, 0.86, 0.9],
};
const iaT = (z) => (z - IA.zT) / IA.L;
const iaHW = (z) => hullAt(HULL_IATE, clamp(iaT(z), 0, 1), IA.B / 2).hw;
const iaIn = (z) => iaHW(z) - 0.14; // face de dentro da borda falsa

/* ---------- deck de teca (textura própria) ----------
   Tábuas de 12,5 cm ao longo do navio (z), calafeto preto entre elas, emendas de topo desencontradas, veio comprido e o desbotado
   prateado do sol. No topo de uma caixa, u = x e v = -z (projUV): as juntas correm em z. Um ladrilho = 3 m. */
Object.assign(TEXLAB, {
  iaTeca: [512, 131, 1.3, `
    float n = 24.0, pu = uv.x * n, pi = floor(pu), fu = fract(pu);
    float id = hs(vec2(pi, 5.0), 3.0), id2 = hs(vec2(pi, 9.0), 4.0);
    float fv = fract(uv.y + id);
    float seam = 1.0 - smoothstep(0.035, 0.075, min(fu, 1.0 - fu));
    float butt = 1.0 - smoothstep(0.0015, 0.0035, min(fv, 1.0 - fv));
    float caulk = max(seam, butt);
    float grain = gfbm(vec2(uv.x, uv.y + id * 3.0), vec2(96.0, 3.0), 5, 2.0 + id);
    float fine = gfbm(vec2(uv.x, uv.y + id2), vec2(192.0, 12.0), 3, 7.0);
    float sun = gfbm(uv, vec2(3.0), 4, 6.0);
    vec3 teak = mix(srgb(vec3(0.5, 0.31, 0.17)), srgb(vec3(0.7, 0.47, 0.27)), id * 0.55 + grain * 0.45);
    teak *= 0.9 + fine * 0.2;
    teak = mix(teak, srgb(vec3(0.68, 0.6, 0.5)), smoothstep(0.55, 0.9, sun) * 0.3);
    a = mix(teak, srgb(vec3(0.045, 0.04, 0.035)), caulk);
    h = (1.0 - caulk) * (0.7 + grain * 0.12 + fine * 0.05); r = 0.55 + caulk * 0.35 + grain * 0.12; x = h;`],
});
TEXSCALE.iaTeca = 3; OPT_TEX.add('iaTeca');
const IA_TECA = [1, 1, 1]; // a cor já vem da textura

/* ---------- coisas que quebram ----------
   Vidro das janelas (salão, cassino, ponte): um tiro estilhaça o painel e abre a janela (o tiro é avisado aos outros jogadores, como
   nos outros props). Até lá ele segura os soldados e para a bala. Vaso de cerâmica: alguns tiros e vira cacos. Garrafas: um tiro. */
PF.iaVidro = (w, h) => prefab('iaVidro' + w + 'x' + h, (M) => {
  M.local(1); M.color([0.78, 0.88, 0.92]); M.boxB('carglass', -w / 2, w / 2, 0, h, -0.015, 0.015);
  M.col(-w / 2, w / 2, 0, h, -0.05, 0.05, 'glass');
});
propType('iaVidro', (a) => { const w = a[0] || 1.4, h = a[1] || 1.3;
  return { pf: () => PF.iaVidro(w, h), shapes: [BOX(0, h / 2, 0, w / 2, h / 2, 0.02)], mass: 14, mu: 0.5, e: 0.1, resp: 0.6, blast: 2, hp: 1, mat: 'glass', snd: 'plastic', brk: 'glass' }; });
const IA_VASOS = [[0.32, 0.12, [0.95, 0.95, 0.93]], [0.55, 0.16, [0.1, 0.18, 0.38]], [0.9, 0.22, [0.93, 0.92, 0.88]]]; // [altura, raio, cor]
PF.iaVaso = (k) => prefab('iaVaso' + k, (M) => {
  const [h, r, c] = IA_VASOS[k]; M.local(1); M.color(c);
  M.lathe('plastic', [[0, 0], [r * 0.7, 0], [r, h * 0.35], [r * 0.85, h * 0.75], [r * 0.5, h * 0.92], [r * 0.6, h], [r * 0.5, h]], 16);
  M.color([0.2, 0.42, 0.18]); M.cls = 1; M.save().move(0, h * 0.95, 0); M.lathe('foliage', [[0, 0], [r * 1.3, h * 0.25], [r * 0.9, h * 0.55], [0, h * 0.65]], 8); M.restore();
});
propType('iaVaso', (a) => { const k = a[0] || 0, [h, r] = IA_VASOS[k];
  return { pf: () => PF.iaVaso(k), shapes: [CYL(0, h / 2, 0, r, h / 2)], mass: 2 + 8 * h, mu: 0.7, e: 0.2, resp: 2.6, blast: 7, hp: Math.round(6 + 14 * h), mat: 'dirt', snd: 'clay', brk: 'clay', debris: [['shard', 6]] }; });
const IA_BEB = [[0.1, 0.32, 0.14], [0.35, 0.12, 0.08], [0.85, 0.78, 0.55], [0.12, 0.2, 0.35], [0.9, 0.9, 0.88]];
// garrafas (quebram com um tiro) em fila sobre um tampo
function iaGarrafas(x, y, z, n, dx = 0.16, dz = 0, seed = 1) {
  const R = rngOf(seed);
  for (let i = 0; i < n; i++) DECOR.dyn('bottle', x + i * dx, y, z + i * dz, R() * TAU, { a: [R.pick([0.26, 0.3, 0.34])], tint: R.pick(IA_BEB) });
}
/* ---------- peças ---------- */
// laje entre z0 e z1 recortada pelos buracos [x0, x1, z0, z1] (as escadas), largura da borda de dentro do casco
function iaSlab(z0, z1, holes, y0, y1, key, tint, top, collide = true) {
  const br = new Set([z0, z1]);
  for (let z = Math.ceil(z0); z < z1; z++) br.add(z);
  for (const h of holes) { if (h[2] > z0 && h[2] < z1) br.add(h[2]); if (h[3] > z0 && h[3] < z1) br.add(h[3]); }
  const zs = [...br].sort((a, b) => a - b);
  for (let i = 0; i < zs.length - 1; i++) {
    const za = zs[i], zb = zs[i + 1], w = Math.min(iaIn(za), iaIn(zb), top || 99) - 0.01;
    let xs = [[-w, w]];
    for (const h of holes) {
      if (h[2] >= zb || h[3] <= za) continue;
      xs = xs.flatMap(([a, b]) => (h[1] <= a || h[0] >= b ? [[a, b]] : [[a, h[0]], [h[1], b]].filter(([p, q]) => q - p > 0.01)));
    }
    for (const [a, b] of xs) box(key, a, b, y0, y1, za, zb, { tint, collide });
  }
}
// escada (rampa praticável + degraus visíveis), ao longo de z; h0 em z0, h1 em z1; por baixo, maciça
function iaStairs(x0, x1, z0, z1, h0, h1) {
  RAMPS.push({ x0, x1, z0, z1, axis: 'z', h0, h1 });
  const n = Math.max(2, Math.round(Math.abs(h1 - h0) / 0.2)), lo = Math.min(h0, h1), dh = Math.abs(h1 - h0) / n;
  for (let i = 0; i < n; i++) {
    const t0 = i / n, t1 = (i + 1) / n, za = lerp(z0, z1, t0), zb = lerp(z0, z1, t1), top = lerp(h0, h1, (t0 + t1) / 2) + dh / 2;
    DECOR.col(x0, x1, lo, top, za, zb, 'wood', true);
    box('iaTeca', x0, x1, top - 0.05, top, za, zb, { collide: false, tint: IA_TECA });
    box('paint', x0, x1, lo, top - 0.05, za, zb, { collide: false, tint: IA_C.white });
  }
}
// guarda-corpo branco (o railingsSeal do jogo fecha com parede invisível onde não houver colisão)
const iaRail = (fix, y, a0, a1, axis, ys) => railing(fix, null, y, Math.min(a0, a1), Math.max(a0, a1), axis, ys, IA_C.rail);
// parede com portas e faixa de janelas. axis 'x': corre em x no z fixo (z0..z1 = espessura); 'z': corre em z no x fixo
// doors: [[a0, a1], ...] (até 2,2 m de altura); win: [y0, y1] da faixa de vidro (null: parede cheia)
function iaWall(axis, f0, f1, a0, a1, y0, y1, doors = [], win = null, tint = IA_C.white) {
  const put = (key, p0, p1, b0, b1, o) => (axis === 'x' ? box(key, p0, p1, b0, b1, f0, f1, o) : box(key, f0, f1, b0, b1, p0, p1, o));
  const ds = doors.slice().sort((a, b) => a[0] - b[0]);
  let a = a0;
  const run = (p0, p1) => {
    if (p1 - p0 < 0.02) return;
    if (!win) { put('paint', p0, p1, y0, y1, { tint }); return; }
    put('paint', p0, p1, y0, win[0], { tint });
    // vidros que quebram, entre montantes brancos (um painel a cada 1,5 m, mais ou menos)
    const n = Math.max(1, Math.round((p1 - p0) / 1.5)), w = (p1 - p0) / n, fm = (f0 + f1) / 2, wh = +(win[1] - win[0]).toFixed(2), pw = +(w - 0.08).toFixed(2);
    for (let i = 0; i <= n; i++) { const b = p0 + i * w; put('paint', Math.max(p0, b - 0.04), Math.min(p1, b + 0.04), win[0], win[1], { tint }); }
    for (let i = 0; i < n; i++) { const c = p0 + (i + 0.5) * w; DECOR.dyn('iaVidro', axis === 'x' ? c : fm, win[0], axis === 'x' ? fm : c, axis === 'x' ? 0 : Math.PI / 2, { a: [pw, wh] }); }
    put('paint', p0, p1, win[1], y1, { tint });
  };
  for (const [d0, d1] of ds) { run(a, d0); put('paint', d0, d1, y0 + 2.2, y1, { tint }); a = d1; }
  run(a, a1);
}
// lancha de apoio (casco do kit do porto, sem colisão) num berço, com a colisão do seu volume
PF.iaTender = (hull = [0.96, 0.96, 0.95]) => prefab('iaTender' + hull.join(','), (M) => {
  const H = hullBody(M, HULL_CANOT, { L: 5.6, B: 2.1, deck: 0.18, thick: 0.06, nv: 16, hull, boot: IA_C.navy, stripe: IA_C.navy, inner: [0.92, 0.92, 0.9], deckTint: IA_C.teak, noCol: true });
  const z = H.z; M.save().local(1);
  M.color(IA_C.white); M.boxB('paint', -0.4, 0.4, 0.18, 1.05, z(0.55) - 0.35, z(0.55) + 0.3, { bevel: 0.04 });
  M.color([0.1, 0.12, 0.14]); M.boxB('glass', -0.38, 0.38, 1.05, 1.38, z(0.55) + 0.15, z(0.55) + 0.2);
  M.color(IA_C.cream); M.boxB('canvas', -0.85, 0.85, 0.3, 0.55, z(0.2) - 0.4, z(0.2) + 0.4, { bevel: 0.05 });
  M.color([0.15, 0.15, 0.16]); M.boxB('paint', -0.24, 0.24, 0.25, 1.05, z(0) - 0.45, z(0) - 0.05, { bevel: 0.05 });
  M.restore();
});
function iaTenderAt(x, y, z) {
  const M = DECOR;
  M.save().color([0.3, 0.3, 0.32]).world(1);
  for (const dz of [-1.5, 1.5]) M.boxB('steel', x - 0.8, x + 0.8, y, y + 0.45, z + dz - 0.15, z + dz + 0.15);
  M.restore();
  M.place(PF.iaTender(), x, y + 0.45, z, 0);
  DECOR.col(x - 1.05, x + 1.05, y, y + 1.5, z - 2.8, z + 2.8, 'metal');
}
// espreguiçadeira (madeira e almofada), colisão baixa
function iaLounger(x, z, rot = 0, y = 0) {
  const M = DECOR; M.save().move(x, y, z).rotY(rot).local(1);
  M.color(IA_C.teak); M.boxB('wood', -0.35, 0.35, 0.18, 0.3, -0.95, 0.95, { bevel: 0.02 });
  M.color(IA_C.white); M.boxB('canvas', -0.32, 0.32, 0.3, 0.38, -0.9, 0.45, { bevel: 0.03 });
  M.save().move(0, 0.3, 0.45).rotX(-0.6); M.boxB('canvas', -0.32, 0.32, 0, 0.08, 0, 0.6, { bevel: 0.03 }); M.restore();
  for (const sx of [-0.3, 0.3]) for (const sz of [-0.85, 0.85]) M.boxB('steel', sx - 0.03, sx + 0.03, 0, 0.18, sz - 0.03, sz + 0.03);
  M.col(-0.36, 0.36, 0, 0.4, -0.96, 0.96, 'wood');
  M.restore();
}
// luminária de teto: o disco aceso e a luz cozida
function iaLamp(x, y, z, p = 1.4, r = 7) {
  const M = DECOR; M.save().move(x, y - 0.06, z).color([1, 1, 1]); M.cls = 1; M.cyl('lamp', 0.18, 0.06, 12); M.restore();
  if (y > 0.5) M.lamp(x, y - 0.15, z, [1.0, 0.85, 0.65], p, r, 0.6);
}

/* ---------- o navio ---------- */
function iateLevel() {
  const M = DECOR, { LD, MD, UD } = IA;
  // casco: o convés do casco fica no piso das cabines (y -3); a borda falsa sobe até 1,05 m acima do convés principal.
  // Na popa, a borda falsa abre entre x -6 e 6 (a garagem das lanchas e a popa olham o mar)
  M.save().move(0, IA.WL, 0);
  hullBody(M, HULL_IATE, { L: IA.L, B: IA.B, deck: LD - IA.WL - 0.04, thick: 0.14, nv: 40, hull: IA_C.white, boot: IA_C.navy, stripe: IA_C.navy,
    inner: IA_C.white, rail: [0.62, 0.45, 0.3], deckTint: [0.5, 0.5, 0.5], noCol: true, gaps: [[0, -6, 6]] });
  M.restore();
  // faixa azul alta no costado (o "vestido" do iate) e as escotilhas das cabines
  M.save().color(IA_C.navy);
  for (const sd of [-1, 1]) {
    const P = []; for (let i = 0; i <= 30; i++) { const z = lerp(-52, 47, i / 30); P.push([sd * (iaHW(z) + 0.03), -1.0 + 0.004 * (z + 52), z]); }
    M.tube('paint', 0.09, P, 6);
    M.color([0.1, 0.12, 0.15]);
    for (let z = -32; z <= 20; z += 4.25) { M.save().move(sd * (iaHW(z) + 0.02), -1.9, z).rotZ(Math.PI / 2); M.cyl('glass', 0.22, 0.05, 12); M.restore(); }
    M.color(IA_C.navy);
  }
  M.restore();

  // ----- convés principal (y 0): teca por cima, forro branco por baixo (teto das cabines) -----
  const HOLES = [[-0.9, 0.9, 17, 22.5], [-0.9, 0.9, -9.5, -4], [6.5, 8.3, -41, -35.5], [-8.3, -6.5, -41, -35.5]];
  iaSlab(IA.zT, IA.zBow, HOLES, MD - 0.3, MD, 'iaTeca', IA_TECA); // (uma laje só: a rota dos bots fica no topo dela)
  iaSlab(IA.zT, IA.zBow, HOLES, MD - 0.32, MD - 0.3, 'paint', IA_C.white, null, false);
  // borda falsa (sólida, para tiros também) e parede invisível por cima, até 4,5 m: ninguém pula no mar
  for (let z = IA.zT; z < 52; z++) {
    const w = Math.min(iaIn(z), iaIn(z + 1)), hw = Math.max(iaHW(z), iaHW(z + 1)) + 0.05;
    for (const sd of [-1, 1]) {
      const a = sd > 0 ? w : -hw, b = sd > 0 ? hw : -w;
      DECOR.col(a, b, MD, MD + 1.05, z, z + 1, 'metal'); glassWall(a, b, MD + 1.05, MD + 4.5, z, z + 1);
      if (z < -35) { DECOR.col(a, b, LD, MD, z, z + 1, 'metal'); } // costado da garagem
    }
  }
  // popa: grade na abertura do convés, parede invisível na garagem (aberta para o mar) e nos cantos
  iaRail(IA.zT + 0.08, MD, -6, 6, 'x');
  glassWall(-10.5, 10.5, LD, MD + 4.5, IA.zT - 0.2, IA.zT + 0.02);
  for (const sd of [-1, 1]) { const a = sd * 6, b = sd * 10.5; DECOR.col(Math.min(a, b), Math.max(a, b), MD, MD + 1.05, IA.zT, IA.zT + 0.14, 'metal'); }

  // ----- proa: heliponto, lanchas, castelo de proa -----
  M.save().move(0, MD, 33).color(IA_C.green); M.cls = 1; M.cyl('paint', 5.6, 0.012, 48, { caps: 't' });
  M.color(IA_C.white); M.save().move(0, 0.012, 0); M.cyl('paint', 5.3, 0.004, 48, { caps: 't' }); M.restore();
  M.color(IA_C.green); M.save().move(0, 0.016, 0); M.cyl('paint', 5.0, 0.004, 48, { caps: 't' }); M.restore();
  M.color(IA_C.white); M.local(1);
  M.boxB('paint', -1.6, -1.0, 0.02, 0.026, -2.2, 2.2); M.boxB('paint', 1.0, 1.6, 0.02, 0.026, -2.2, 2.2); M.boxB('paint', -1.0, 1.0, 0.02, 0.026, -0.3, 0.3);
  M.restore();
  for (const sd of [-1, 1]) iaTenderAt(sd * 6.3, MD, 31.5);
  // castelo de proa: bloco branco de 1 m, fechado por cima (parede invisível), guinchos de âncora e cabeços
  for (let z = IA.zBow; z < 52; z++) { const w = Math.min(iaIn(z), iaIn(z + 1)) - 0.01; if (w > 0.2) box('paint', -w, w, MD, MD + 1.0, z, z + 1, { tint: IA_C.white }); }
  glassWall(-9, 9, MD + 1.0, MD + 4.5, IA.zBow, 53);
  box('paint', -6.2, 6.2, MD + 1.0, MD + 1.06, IA.zBow, IA.zBow + 0.3, { tint: IA_C.navy, collide: false });
  M.save().color([0.25, 0.26, 0.28]);
  for (const sd of [-1, 1]) { M.save().move(sd * 2.2, MD + 1.0, 45).rotZ(Math.PI / 2); M.cyl('steel', 0.35, 1.0, 14); M.restore(); M.save().move(sd * 4.2, MD + 1.0, 43); M.cyl('steel', 0.16, 0.5, 10); M.restore(); }
  M.restore();
  iaRail(IA.zBow, MD, -2, 2, 'x'); // grade na frente do castelo (a parede invisível já segura)

  // ----- Salão Panorâmico (x -5,5 a 5,5, z 11 a 25) e Solário em cima -----
  const SX = 5.5, WIN = [1.0, 2.3];
  iaWall('x', 24.8, 25, -SX, SX, MD, MD + 2.7, [[-1.1, 1.1]], WIN);
  iaWall('x', 11, 11.2, -SX, SX, MD, MD + 2.7, [[-1.1, 1.1]], WIN);
  for (const sd of [-1, 1]) iaWall('z', sd > 0 ? SX - 0.2 : -SX, sd > 0 ? SX : -SX + 0.2, 11.2, 24.8, MD, MD + 2.7, [[21.5, 22.9]], WIN);
  box('paint', -SX, SX, MD + 2.7, UD, 11, 25, { tint: IA_C.white }); // teto = piso do Solário
  box('iaTeca', -SX, SX, UD - 0.04, UD, 11, 25, { tint: IA_TECA, collide: false });
  box('paint', -SX - 0.15, SX + 0.15, MD + 2.55, MD + 2.7, 24.9, 25.2, { tint: IA_C.navy, collide: false }); // friso azul
  // escada interna: desce às cabines (x -0,9 a 0,9, de z 22,5 a 17)
  iaStairs(-0.9, 0.9, 17, 22.5, LD, MD);
  iaRail(-0.95, MD, 17, 22.5, 'z'); iaRail(0.95, MD, 17, 22.5, 'z'); iaRail(17, MD, -0.95, 0.95, 'x');
  // bar, sofás, tapete
  box('wood', -SX + 0.2, -3.2, MD, MD + 1.1, 11.2, 12.6, { tint: IA_C.teakDark }); box('paint', -SX + 0.2, -3.1, MD + 1.1, MD + 1.16, 11.2, 12.7, { tint: IA_C.white });
  box('wood', 3.2, SX - 0.2, MD, MD + 1.1, 11.2, 12.6, { tint: IA_C.teakDark }); box('paint', 3.1, SX - 0.2, MD + 1.1, MD + 1.16, 11.2, 12.7, { tint: IA_C.white });
  for (const [x, z, r] of [[-3.6, 15.5, Math.PI / 2], [3.6, 15.5, -Math.PI / 2], [-3.6, 20.5, Math.PI / 2], [3.6, 20.5, -Math.PI / 2]]) M.place(PF.fdSofa([0.86, 0.82, 0.74]), x, MD, z, r);
  M.place(PF.rugFloor(), -2.6, MD + 0.005, 18, 0, { nocol: true }); M.place(PF.rugFloor(), 2.6, MD + 0.005, 18, 0, { nocol: true });
  for (const [x, z] of [[-2.8, 14], [2.8, 14], [-2.8, 22], [2.8, 22]]) iaLamp(x, MD + 2.7, z);
  // Solário: grades, patamar das escadas externas, espreguiçadeiras
  for (const sd of [-1, 1]) {
    box('paint', sd > 0 ? SX : -7, sd > 0 ? 7 : -SX, MD + 2.7, UD, 11, 14.5, { tint: IA_C.white });
    box('iaTeca', sd > 0 ? SX : -7, sd > 0 ? 7 : -SX, UD - 0.04, UD, 11, 14.5, { tint: IA_TECA, collide: false });
    iaStairs(sd > 0 ? 5.6 : -7, sd > 0 ? 7 : -5.6, 14.5, 20, UD, MD);
    iaRail(sd * 7, MD, 14.5, 20, 'z', [UD, MD]);
    iaRail(sd * 7, UD, 11, 14.5, 'z'); iaRail(sd * SX, UD, 14.5, 25, 'z');
    for (const z of [20.5, 23]) iaLounger(sd * 3.2, z, Math.PI, UD);
  }
  iaRail(25, UD, -SX, SX, 'x'); iaRail(11, UD, -7, 7, 'x');

  // ----- Convés da Piscina (z -11 a 11) -----
  for (const [x0, x1, z0, z1] of [[-3.2, 3.2, 1.5, 1.8], [-3.2, 3.2, 7.7, 8.0], [-3.2, -2.9, 1.8, 7.7], [2.9, 3.2, 1.8, 7.7]]) {
    box('tiles', x0, x1, MD, MD + 0.8, z0, z1, { tint: IA_C.white });
    box('paint', x0 - 0.03, x1 + 0.03, MD + 0.8, MD + 0.86, z0 - 0.03, z1 + 0.03, { tint: IA_C.teak, collide: false });
  }
  box('tiles', -2.9, 2.9, MD, MD + 0.03, 1.8, 7.7, { tint: IA_C.tile });
  pondAdd({ shape: 'rect', x: 0, y: MD + 0.68, z: 4.75, w: 5.8, d: 5.9, bed: 0.65, deep: [0.0, 0.08, 0.14], shallow: [0.03, 0.32, 0.4], scatter: [0.01, 0.1, 0.13], vis: 2.5, probe: false });
  // escada central: desce às cabines (de z -4 a -9,5)
  iaStairs(-0.9, 0.9, -9.5, -4, LD, MD);
  iaRail(-0.95, MD, -9.5, -4, 'z'); iaRail(0.95, MD, -9.5, -4, 'z'); iaRail(-9.5, MD, -0.95, 0.95, 'x');
  for (const sd of [-1, 1]) {
    for (const z of [2.2, 4.7, 7.2]) iaLounger(sd * 4.4, z, 0);
    M.place(PF.cyUmbrella(IA_C.white), sd * 4.4, MD, 9.3, 0, { nocol: true });
    // armários de convés (abrigo baixo) perto do ponto B e no meio dos passadiços
    box('paint', sd > 0 ? 3.6 : -5.0, sd > 0 ? 5.0 : -3.6, MD, MD + 1.05, -2.6, -0.4, { tint: IA_C.white });
    box('wood', sd > 0 ? 3.55 : -5.05, sd > 0 ? 5.05 : -3.55, MD + 1.05, MD + 1.1, -2.65, -0.35, { tint: IA_C.teak, collide: false });
    box('paint', sd > 0 ? 7.6 : -8.8, sd > 0 ? 8.8 : -7.6, MD, MD + 1.2, -8, -5.5, { tint: IA_C.white });
    box('paint', sd > 0 ? 7.6 : -8.8, sd > 0 ? 8.8 : -7.6, MD, MD + 1.2, 5.5, 8, { tint: IA_C.white });
    M.place(PF.lifeRingStand(), sd * 9.3, MD, 0, sd > 0 ? -Math.PI / 2 : Math.PI / 2, { nocol: true });
  }

  // ----- Cassino (x -5,5 a 5,5, z -27 a -11), Ponte de comando e terraço em cima -----
  iaWall('x', -11.2, -11, -SX, SX, MD, MD + 2.7, [[-1.1, 1.1]], WIN);
  iaWall('x', -27, -26.8, -SX, SX, MD, MD + 2.7, [[-1.1, 1.1]], WIN);
  for (const sd of [-1, 1]) iaWall('z', sd > 0 ? SX - 0.2 : -SX, sd > 0 ? SX : -SX + 0.2, -26.8, -11.2, MD, MD + 2.7, [[-15.5, -14.1]], WIN);
  box('paint', -SX, SX, MD + 2.7, UD, -27, -11, { tint: IA_C.white });
  box('iaTeca', -SX, SX, UD - 0.04, UD, -27, -11, { tint: IA_TECA, collide: false });
  box('paint', -SX - 0.15, SX + 0.15, MD + 2.55, MD + 2.7, -11.2, -10.9, { tint: IA_C.navy, collide: false });
  // mesas de jogo (feltro verde), bar no fundo
  for (const [x, z] of [[-2.8, -15], [2.8, -15], [-2.8, -21.5], [2.8, -21.5]]) {
    box('wood', x - 1.0, x + 1.0, MD, MD + 0.78, z - 0.7, z + 0.7, { tint: IA_C.teakDark });
    box('canvas', x - 0.92, x + 0.92, MD + 0.78, MD + 0.8, z - 0.62, z + 0.62, { tint: IA_C.green, collide: false });
    for (const [dx, dz] of [[-1.35, 0], [1.35, 0]]) M.dyn('chair', x + dx, MD, z + dz, dx < 0 ? Math.PI / 2 : -Math.PI / 2);
  }
  box('wood', -SX + 0.2, -1.6, MD, MD + 1.1, -26.6, -25.4, { tint: IA_C.teakDark }); box('wood', 1.6, SX - 0.2, MD, MD + 1.1, -26.6, -25.4, { tint: IA_C.teakDark });
  M.place(PF.rugFloor(), 0, MD + 0.005, -18.2, Math.PI / 2, { nocol: true });
  for (const [x, z] of [[-2.8, -15], [2.8, -15], [-2.8, -21.5], [2.8, -21.5]]) iaLamp(x, MD + 2.7, z, 1.6, 6);
  // Ponte de comando (x -4 a 4, z -26 a -20, piso y 3): janelão para a proa, portas dos lados
  const BX = 4, BY1 = UD + 2.7;
  iaWall('x', -20.2, -20, -BX, BX, UD, BY1, [], [UD + 0.95, UD + 2.35]);
  iaWall('x', -26, -25.8, -BX, BX, UD, BY1);
  for (const sd of [-1, 1]) iaWall('z', sd > 0 ? BX - 0.2 : -BX, sd > 0 ? BX : -BX + 0.2, -25.8, -20.2, UD, BY1, [[-24.2, -23.0]], [UD + 1.0, UD + 2.1]);
  box('paint', -BX - 0.4, BX + 0.4, BY1, BY1 + 0.25, -26.4, -19.6, { tint: IA_C.white }); glassWall(-BX - 0.4, BX + 0.4, BY1 + 0.25, BY1 + 4, -26.4, -19.6);
  box('paint', -BX - 0.45, BX + 0.45, BY1 - 0.1, BY1 + 0.05, -19.65, -19.5, { tint: IA_C.navy, collide: false });
  box('paint', -3.5, 3.5, UD, UD + 0.95, -21.0, -20.25, { tint: IA_C.dark }); // painel
  M.save().color([0.1, 0.55, 0.45]); M.cls = 1; for (let x = -3; x <= 3; x += 1.5) M.boxB('glass', x - 0.5, x + 0.5, UD + 0.95, UD + 0.97, -20.95, -20.35); M.restore();
  for (const x of [-1.2, 1.2]) { box('paint', x - 0.3, x + 0.3, UD, UD + 0.5, -22.3, -21.7, { tint: IA_C.dark }); box('canvas', x - 0.3, x + 0.3, UD + 0.5, UD + 1.2, -22.4, -22.25, { tint: IA_C.cream, collide: false }); }
  iaLamp(0, BY1, -23, 1.2, 6);
  // mastro e radar no teto da ponte (só visual, fora do alcance)
  M.save().color(IA_C.white).move(0, BY1 + 0.25, -24).local(1); M.cls = 0;
  M.cyl('paint', 0.18, 3.4, 10, { r1: 0.12 }); M.boxB('paint', -2.4, 2.4, 2.4, 2.55, -0.12, 0.12);
  M.color([0.85, 0.85, 0.85]); M.save().move(0, 3.4, 0); M.boxB('paint', -1.1, 1.1, 0, 0.14, -0.1, 0.1); M.restore();
  for (const x of [-1.8, 1.8]) { M.save().move(x, 2.55, 0); M.lathe('paint', [[0.32, 0], [0.34, 0.25], [0.2, 0.5], [0, 0.55]], 14); M.restore(); }
  M.restore();
  // terraço e escadas externas
  for (const sd of [-1, 1]) {
    box('paint', sd > 0 ? SX : -7, sd > 0 ? 7 : -SX, MD + 2.7, UD, -27, -22.5, { tint: IA_C.white });
    box('iaTeca', sd > 0 ? SX : -7, sd > 0 ? 7 : -SX, UD - 0.04, UD, -27, -22.5, { tint: IA_TECA, collide: false });
    iaStairs(sd > 0 ? 5.6 : -7, sd > 0 ? 7 : -5.6, -22.5, -17, UD, MD);
    iaRail(sd * 7, MD, -22.5, -17, 'z', [UD, MD]);
    iaRail(sd * 7, UD, -27, -22.5, 'z'); iaRail(sd * SX, UD, -22.5, -11, 'z');
    iaLounger(sd * 3.0, -13.5, Math.PI, UD); iaLounger(sd * 3.0, -16.5, Math.PI, UD);
  }
  iaRail(-11, UD, -SX, SX, 'x'); iaRail(-27, UD, -7, 7, 'x');

  // ----- Popa (z -53 a -27): sofás, bar, escadas para a garagem -----
  for (const sd of [-1, 1]) {
    const a = sd > 0 ? 6.5 : -8.3, b = sd > 0 ? 8.3 : -6.5;
    iaStairs(a, b, -41, -35.5, LD, MD);
    iaRail(a - 0.05, MD, -41, -35.5, 'z'); iaRail(b + 0.05, MD, -41, -35.5, 'z'); iaRail(-41, MD, a, b, 'x');
    box('wood', sd > 0 ? 5.5 : -7.5, sd > 0 ? 7.5 : -5.5, MD, MD + 1.1, -32, -29.2, { tint: IA_C.teakDark });
    box('paint', sd > 0 ? 5.45 : -7.55, sd > 0 ? 7.55 : -5.45, MD + 1.1, MD + 1.16, -32.05, -29.15, { tint: IA_C.white, collide: false });
    M.place(PF.fdSofa([0.88, 0.85, 0.78]), sd * 3.4, MD, -47.5, sd > 0 ? -Math.PI / 2 : Math.PI / 2);
  }
  M.place(PF.fdSofa([0.88, 0.85, 0.78]), 0, MD, -50.5, 0);
  box('wood', -1.2, 1.2, MD, MD + 0.45, -48.2, -46.8, { tint: IA_C.teakDark });
  for (const sd of [-1, 1]) M.place(PF.cyUmbrella(IA_C.white), sd * 4.5, MD, -44, 0, { nocol: true });

  // ----- embaixo (y -3): garagem das lanchas, corredor e cabines -----
  iaSlab(IA.zT, 23, [], LD - 0.3, LD, 'wood', [0.5, 0.36, 0.25], 9.6);
  for (const sd of [-1, 1]) box('paint', sd > 0 ? 9.4 : -9.9, sd > 0 ? 9.9 : -9.4, LD, MD - 0.3, IA.zT, 23, { tint: IA_C.cream }); // forro do costado
  box('paint', -9.4, 9.4, LD, MD - 0.3, 22.8, 23, { tint: IA_C.cream });
  // garagem (z -53 a -35): lanchas nos berços, luzes
  box('steel', -9.4, 9.4, LD, LD + 0.02, IA.zT, -35, { tint: [0.55, 0.56, 0.58], collide: false });
  for (const sd of [-1, 1]) iaTenderAt(sd * 3.4, LD, -47.2);
  for (const sd of [-1, 1]) box('paint', sd > 0 ? 2.6 : -9.4, sd > 0 ? 9.4 : -2.6, LD, MD - 0.3, -35.1, -34.9, { tint: IA_C.cream });
  for (const [x, z] of [[-4, -44], [4, -44], [0, -38]]) iaLamp(x, MD - 0.3, z, 1, 6);
  for (const [x, z, r] of [[-8.6, -51.8, 0.2], [8.4, -51.6, -0.3], [-8.7, -36.5, 0.5]]) M.dyn('jerrycan', x, LD, z, r, { tint: [0.75, 0.15, 0.1] });
  // corredor (x -2,4 a 2,4) e cabines: paredes transversais, portas para o corredor, uma passagem entre duas cabines de cada lado
  // porta de 1,5 m centrada numa casa da grade de rotas (x,5): com folga de 0,75 m dos dois lados, os bots passam
  const iaDoor = (a, b) => Math.floor((a + b) / 2) + 0.5;
  const CAB = [[7.5, 16], [-1, 7.5], [-9.5, -1], [-18, -9.5], [-26.5, -18], [-35, -26.5]];
  for (const sd of [-1, 1]) {
    const f0 = sd > 0 ? 2.4 : -2.6, f1 = sd > 0 ? 2.6 : -2.4;
    iaWall('z', f0, f1, -34.9, 22.8, LD, MD - 0.3, CAB.map(([a, b]) => [iaDoor(a, b) - 0.75, iaDoor(a, b) + 0.75]), null, IA_C.cream);
    for (const z of [16, 7.5, -1, -9.5, -18, -26.5]) {
      const d = z === -1 ? [[sd > 0 ? 6.8 : -8.0, sd > 0 ? 8.0 : -6.8]] : [];
      iaWall('x', z - 0.1, z + 0.1, sd > 0 ? 2.6 : -9.4, sd > 0 ? 9.4 : -2.6, LD, MD - 0.3, d.map(([p, q]) => [Math.min(p, q), Math.max(p, q)]), null, IA_C.cream);
    }
    for (const [a, b] of CAB) {
      const m = (a + b) / 2, xo = sd * 9.4, xi = sd * 6.9;
      box('wood', Math.min(xo, xi), Math.max(xo, xi), LD, LD + 0.45, m - 1.2, m + 1.2, { tint: IA_C.teakDark });
      box('canvas', Math.min(xo, xi) + 0.05, Math.max(xo, xi) - 0.05, LD + 0.45, LD + 0.62, m - 1.15, m + 1.15, { tint: IA_C.white });
      box('wood', sd > 0 ? 9.2 : -9.4, sd > 0 ? 9.4 : -9.2, LD + 0.45, LD + 1.4, m - 1.25, m + 1.25, { tint: IA_C.teak, collide: false });
      box('wood', sd > 0 ? 3.0 : -4.2, sd > 0 ? 4.2 : -3.0, LD, LD + 0.8, b - 1.0, b - 0.3, { tint: IA_C.teak });
      iaLamp(sd * 6, MD - 0.3, m, 1, 5);
    }
  }
  box('rug', -1.0, 1.0, LD, LD + 0.01, -34, 16.5, { tint: IA_C.navy, collide: false });
  for (let z = -32; z <= 21; z += 6) iaLamp((z > -10 && z < -3) || z > 15 ? 1.7 : 0, MD - 0.3, z, 1, 5);

  iaDecor();

  // mar: espuma em volta do casco (obstáculo), terra firme dentro dele (o mecha não pensa que o convés é água)
  const P = [];
  for (let i = 0; i <= 24; i++) { const z = lerp(IA.zT, 53, i / 24); P.push([iaHW(z) * 0.97, z]); }
  waterObstacle(P.concat(P.slice().reverse().map(([x, z]) => [-x, z])), 5.5, [0.95, 0.95, 0.94], 1);
  waterLand(-10.5, 10.5, IA.zT - 0.5, 53.5);
}
/* ---------- o cenário de cada área (o que dá vida e o que quebra) ---------- */
function iaDecor() {
  const M = DECOR, { LD, MD, UD } = IA;
  const vaso = (x, y, z, k, r = 0) => M.dyn('iaVaso', x, y, z, r, { a: [k] });
  const mesinha = (x, y, z, h = 0.5) => { M.save().move(x, y, z).color(IA_C.white).local(1); M.cyl('paint', 0.26, h, 16); M.restore(); DECOR.col(x - 0.26, x + 0.26, y, y + h, z - 0.26, z + 0.26, 'wood'); };
  // ----- proa -----
  for (const sd of [-1, 1]) {
    // espreguiçadeira dupla (solário de proa) encostada no salão
    const x0 = sd > 0 ? 2.0 : -3.8, x1 = x0 + 1.8;
    box('paint', x0, x1, MD, MD + 0.35, 25.3, 26.9, { tint: IA_C.white });
    box('canvas', x0 + 0.05, x1 - 0.05, MD + 0.35, MD + 0.5, 25.35, 26.85, { tint: IA_C.cream, collide: false });
    for (const xx of [x0 + 0.45, x1 - 0.45]) box('canvas', xx - 0.35, xx + 0.35, MD + 0.5, MD + 0.68, 25.4, 25.7, { tint: IA_C.navy, collide: false });
    M.dyn('ropeCoil', sd * 6.3, MD, 37.3, sd);
    M.place(PF.lifeRingStand(), sd * 8.9, MD, 26.2, sd > 0 ? -Math.PI / 2 : Math.PI / 2, { nocol: true });
    // corrente da âncora, do guincho até o escovém
    M.save().color([0.12, 0.12, 0.13]); M.cls = 1; M.tube('steel', 0.05, [[sd * 2.2, MD + 1.35, 45], [sd * 2.6, MD + 1.02, 47.5], [sd * 3.0, MD + 1.02, 49.5]], 6); M.restore();
  }
  // mastro da bandeira e farol de navegação na ponta
  M.save().color(IA_C.white).move(0, MD + 1.0, 50.5).local(1); M.cyl('paint', 0.06, 3.2, 8, { r1: 0.04 }); M.color([1, 1, 1]); M.save().move(0, 3.2, 0); M.cyl('lamp', 0.08, 0.12, 8); M.restore(); M.restore();

  // ----- salão -----
  // piano de cauda (preto brilhante), mesinhas de centro, vasos, garrafas no balcão, lustre
  box('carpaint', -3.6, -1.6, MD + 0.65, MD + 1.0, 23.0, 24.6, { tint: [0.03, 0.03, 0.035], collide: false });
  for (const [x, z] of [[-3.45, 23.15], [-1.75, 23.15], [-2.6, 24.45]]) box('carpaint', x - 0.07, x + 0.07, MD, MD + 0.65, z - 0.07, z + 0.07, { tint: [0.03, 0.03, 0.035], collide: false });
  DECOR.col(-3.6, -1.6, MD, MD + 1.0, 23.0, 24.6, 'wood');
  M.save().color([0.03, 0.03, 0.035]).move(-2.6, MD + 1.0, 24.55).rotX(-0.75).local(1); M.cls = 1; M.boxB('carpaint', -1.0, 1.0, 0, 0.03, -1.5, 0); M.restore();
  for (const sd of [-1, 1]) {
    mesinha(sd * 4.9, MD, 18, 0.55); vaso(sd * 4.9, MD + 0.55, 17.9, 0); iaGarrafas(sd * 4.9 - 0.08, MD + 0.55, 18.2, 2, 0.16, 0, 7 + sd);
    vaso(sd * 5.0, MD, 24.3, 2); vaso(sd * 5.0, MD, 13.3, 2, 1);
    iaGarrafas(sd > 0 ? 3.4 : -5.1, MD + 1.16, 11.9, 9, 0.18, 0, sd > 0 ? 11 : 12);
  }
  M.save().move(0, MD + 2.7, 18).local(1); M.color([0.9, 0.92, 0.95]); M.cls = 1;
  M.lathe('glass', [[0.05, 0], [0.7, -0.35], [0.55, -0.7], [0.1, -0.85]], 16); M.color([1, 1, 1]); M.save().move(0, -0.75, 0); M.cyl('lamp', 0.3, 0.12, 12); M.restore();
  M.restore(); M.lamp(0, MD + 1.9, 18, [1.0, 0.85, 0.6], 2.2, 8, 0);
  // arco do radar por cima do Solário (só a vista; as pernas param os soldados)
  M.save().color(IA_C.white); M.cls = 0;
  M.tube('paint', 0.16, [[-5.15, UD, 12.2], [-4.5, UD + 2.3, 12.5], [-2.4, UD + 3.3, 12.7], [0, UD + 3.5, 12.75], [2.4, UD + 3.3, 12.7], [4.5, UD + 2.3, 12.5], [5.15, UD, 12.2]], 10);
  for (const x of [-1.2, 1.2]) { M.save().move(x, UD + 3.45, 12.7); M.lathe('paint', [[0.38, 0], [0.4, 0.3], [0.25, 0.55], [0, 0.6]], 14); M.restore(); }
  M.restore();
  for (const sd of [-1, 1]) DECOR.col(sd * 5.15 - 0.2, sd * 5.15 + 0.2, UD, UD + 2, 12.0, 12.4, 'metal');

  // ----- piscina -----
  for (const sd of [-1, 1]) {
    for (const [i, z] of [[0, 2.2], [1, 4.7], [2, 7.2]]) box('canvas', sd * 4.4 - 0.28, sd * 4.4 + 0.28, MD + 0.39, MD + 0.41, z - 0.75, z + 0.2, { tint: [[0.1, 0.18, 0.38], [0.95, 0.95, 0.93], [0.15, 0.45, 0.42]][i], collide: false });
    for (const z of [3.45, 5.95]) { mesinha(sd * 4.4, MD, z, 0.45); iaGarrafas(sd * 4.4 - 0.08, MD + 0.45, z, 2, 0.16, 0, z * 13 + sd); }
    // floreira com palmeira nos cantos do convés
    for (const z of [9.7, -9.7]) {
      const x0 = sd > 0 ? 7.0 : -8.2;
      box('paint', x0, x0 + 1.2, MD, MD + 0.6, z - 0.6, z + 0.6, { tint: IA_C.white });
      box('paint', x0 + 0.05, x0 + 1.15, MD + 0.58, MD + 0.6, z - 0.55, z + 0.55, { tint: [0.25, 0.18, 0.12], collide: false });
      M.place(PF.palm(4.2, z > 0 ? 3 + sd : 7 + sd), x0 + 0.6, MD + 0.6, z, sd * 0.7, { nocol: true });
    }
  }
  // escada da piscina, boia de flamingo, garrafas nos armários do ponto B
  M.save().color([0.85, 0.86, 0.88]); M.cls = 1;
  for (const x of [1.9, 2.5]) M.tube('steel', 0.025, [[x, MD + 0.1, 7.5], [x, MD + 1.2, 7.55], [x, MD + 1.25, 7.85], [x, MD + 0.8, 8.05]], 6);
  M.restore();
  M.save().move(-0.8, MD + 0.66, 4.0).color([0.98, 0.45, 0.6]).local(1); M.cls = 1;
  M.lathe('plastic', [[0.35, 0], [0.55, 0.05], [0.62, 0.15], [0.55, 0.25], [0.35, 0.28], [0.28, 0.15], [0.35, 0]], 18);
  M.tube('plastic', 0.07, [[0.45, 0.2, 0], [0.55, 0.6, 0.05], [0.5, 0.85, 0.15], [0.4, 0.88, 0.3]], 6);
  M.restore();
  iaGarrafas(4.3, MD + 1.1, -2.2, 4, 0.0, 0.5, 21); iaGarrafas(-4.3, MD + 1.1, -2.2, 3, 0.0, 0.6, 22);

  // ----- cassino -----
  // mesa de roleta no meio (com a roda), caça-níqueis nos cantos, fichas nas mesas, garrafas no bar
  box('wood', -0.7, 0.7, MD, MD + 0.85, -19.4, -17.0, { tint: IA_C.teakDark });
  box('canvas', -0.62, 0.62, MD + 0.85, MD + 0.87, -19.3, -17.1, { tint: IA_C.green, collide: false });
  M.save().move(0, MD + 0.87, -18.8).local(1); M.color([0.35, 0.2, 0.1]); M.lathe('wood', [[0.45, 0], [0.45, 0.06], [0.38, 0.08], [0.1, 0.1], [0, 0.18]], 24);
  M.color([0.8, 0.65, 0.3]); M.save().move(0, 0.1, 0); M.cyl('steel', 0.03, 0.12, 6); M.restore(); M.restore();
  for (const sd of [-1, 1]) for (const z of [-11.9, -13.0]) {
    const x0 = sd > 0 ? 4.5 : -5.3;
    box('paint', x0, x0 + 0.8, MD, MD + 1.7, z - 0.4, z + 0.4, { tint: [0.55, 0.08, 0.1] });
    M.save().color([1, 1, 1]); M.cls = 1; M.boxB('lampCool', sd > 0 ? x0 - 0.01 : x0 + 0.8, sd > 0 ? x0 : x0 + 0.81, MD + 1.0, MD + 1.45, z - 0.3, z + 0.3); M.restore();
  }
  for (const [x, z] of [[-2.8, -15], [2.8, -15], [-2.8, -21.5], [2.8, -21.5]]) {
    M.save().local(1); M.cls = 1;
    for (const [dx, dz, c] of [[-0.4, 0.2, [0.8, 0.1, 0.1]], [-0.3, 0.25, [0.1, 0.2, 0.7]], [0.35, -0.2, [0.95, 0.95, 0.9]], [0.45, -0.25, [0.1, 0.1, 0.1]]]) { M.color(c); M.save().move(x + dx, MD + 0.8, z + dz); M.cyl('plastic', 0.02, 0.06 + Math.abs(dx) * 0.1, 10); M.restore(); }
    M.restore();
    vaso(x, MD + 0.8, z, 0);
  }
  iaGarrafas(-5.1, MD + 1.1, -26.0, 10, 0.34, 0, 31); iaGarrafas(1.8, MD + 1.1, -26.0, 10, 0.34, 0, 32);
  // ponte: roda do leme, mesa de cartas, telas, cúpulas no teto
  M.save().move(0, UD + 1.05, -20.7).rotX(Math.PI / 2).color([0.35, 0.22, 0.12]).local(1); M.cls = 1;
  M.lathe('wood', [[0.3, -0.03], [0.34, 0], [0.3, 0.03], [0.26, 0]], 18); M.restore();
  box('wood', -3.6, -1.8, UD, UD + 1.0, -25.7, -24.8, { tint: IA_C.teakDark });
  M.save().color([1, 1, 1]); M.cls = 1; for (const x of [-2.2, 2.2]) M.boxB('lampCool', x - 0.45, x + 0.45, UD + 1.0, UD + 1.35, -20.6, -20.56); M.restore();
  M.save().color(IA_C.white); for (const x of [-2.8, 2.8]) { M.save().move(x, UD + 2.95, -21.2); M.lathe('paint', [[0.4, 0], [0.42, 0.25], [0.28, 0.5], [0, 0.56]], 14); M.restore(); } M.restore();

  // ----- popa -----
  for (const sd of [-1, 1]) {
    M.dyn('fdBbq', sd * 6.4, MD, -27.9, sd);
    for (const z of [-29.8, -31.3]) M.dyn('chair', sd * 4.9, MD, z, sd > 0 ? -Math.PI / 2 : Math.PI / 2);
    iaGarrafas(sd > 0 ? 5.7 : -7.3, MD + 1.16, -30.6, 8, 0.2, 0, sd > 0 ? 41 : 42);
    mesinha(sd * 2.0, MD, -47.5, 0.45); vaso(sd * 2.0, MD + 0.45, -47.5, 0);
    // varas de pesca nos cantos da popa
    M.save().color([0.12, 0.12, 0.14]); M.cls = 1; for (const k of [0, 1]) M.tube('steel', 0.012, [[sd * (8.8 - k * 0.5), MD + 1.05, -52.6], [sd * (9.6 - k * 0.5), MD + 3.6, -54.6]], 4); M.restore();
  }
  // guindaste das lanchas e caixa térmica
  M.save().move(8.4, MD, -49.5).color(IA_C.white).local(1); M.cyl('paint', 0.18, 3.0, 10); M.save().move(0, 3.0, 0); M.tube('paint', 0.12, [[0, 0, 0], [-1.2, 0.6, -1.4], [-2.6, 0.5, -2.6]], 8); M.restore(); M.restore();
  DECOR.col(8.2, 8.6, MD, MD + 3, -49.7, -49.3, 'metal');
  box('paint', -7.6, -6.2, MD, MD + 0.6, -51.8, -50.6, { tint: [0.15, 0.4, 0.62] });

  // ----- garagem -----
  for (const sd of [-1, 1]) {
    // jet ski
    const x = sd * 7.6, z = -46.1;
    M.save().move(x, LD, z).local(1); M.cls = 0;
    M.color(sd > 0 ? [0.92, 0.92, 0.94] : [0.1, 0.2, 0.42]); M.boxB('carpaint', -0.45, 0.45, 0.15, 0.6, -1.4, 1.4, { bevel: 0.15 });
    M.color([0.1, 0.1, 0.11]); M.boxB('rubber', -0.28, 0.28, 0.6, 0.78, -0.9, 0.3, { bevel: 0.06 });
    M.color([0.3, 0.3, 0.32]); M.tube('steel', 0.025, [[-0.4, 0.95, 0.75], [0, 0.88, 0.65], [0.4, 0.95, 0.75]], 6);
    M.color([0.25, 0.25, 0.27]); M.boxB('steel', -0.5, 0.5, 0, 0.15, -1.2, 1.2);
    M.restore(); DECOR.col(x - 0.5, x + 0.5, LD, LD + 1.0, z - 1.45, z + 1.45, 'metal');
    for (let k = 0; k < 2; k++) M.dyn('barrel', sd * (8.85 - k * 0.65), LD, -52.3, k);
    for (let k = 0; k < 3; k++) M.dyn('gasBottle', sd * 9.0, LD, -38.2 - k * 0.4, k, { tint: [0.95, 0.75, 0.1] });
    for (const [dx, dz, y] of [[0, 0, 0], [0.62, 0.1, 0], [0.3, 0.05, 0.6]]) M.dyn('crate', sd * (8.4 - dx), LD + y, -43.0 + dz, 0.1 * dx, { a: [0.6] });
  }
  box('wood', -9.35, -8.5, LD, LD + 0.9, -50.4, -48.0, { tint: IA_C.teakDark }); iaGarrafas(-9.0, LD + 0.9, -49.8, 3, 0, 0.3, 51);
  M.dyn('ropeCoil', 1.2, LD, -38.5, 0.3); M.dyn('ropeCoil', -1.4, LD, -51.5, 1.3);

  // ----- cabines -----
  for (const sd of [-1, 1]) for (const b of [16, 7.5, -1, -9.5, -18, -26.5]) {
    vaso(sd * 3.35, LD + 0.8, b - 0.65, 0); M.dyn('bottle', sd * 3.95, LD + 0.8, b - 0.55, 0, { a: [0.3], tint: IA_BEB[Math.abs(Math.round(b)) % 5] });
    M.dyn('chair', sd * 3.6, LD, b - 1.55, sd > 0 ? Math.PI : 0);
  }

  // ----- no mar: veleiros ao longe e ilhas no horizonte -----
  for (const [x, z, r, sd] of [[-130, 70, 0.6, 2], [170, -110, 2.2, 3], [-220, -190, 1.2, 4], [90, 240, 2.8, 5]]) floatAdd(PF.sailboat(sd), x, z, r, { draft: 0.2, L: 9, B: 3 });
  M.save().color([0.3, 0.36, 0.24]); M.cls = 0;
  for (const [x, z, r, h] of [[-520, 380, 230, 70], [-300, 520, 120, 38]]) { M.save().move(x, IA.WL - 2, z).local(1); M.lathe('concrete', [[r, 0], [r * 0.75, h * 0.35], [r * 0.45, h * 0.8], [r * 0.15, h], [0, h * 1.02]], 28); M.restore(); }
  M.restore();
}

/* grade de água em volta do navio (a do porto só tem mar a oeste do cais) e campo de espuma centrado nele */
function iateWaterGeometry() {
  const W = WATER, side = (fine, n) => { const out = [0]; for (let v = 0, s = 0.8; v < 900;) { if (v > fine) s = Math.min(s * 1.07, 45); v = Math.min(900, v + s); out.push(v); } return out.slice(1).map((v) => -v).reverse().concat(out); };
  const xs = side(22, 0), zs = side(70, 0), nx = xs.length, nz = zs.length;
  const P = new Float32Array(nx * nz * 3), idx = new Uint32Array((nx - 1) * (nz - 1) * 6);
  for (let j = 0, o = 0; j < nz; j++) for (let i = 0; i < nx; i++, o += 3) { P[o] = xs[i]; P[o + 1] = W.y; P[o + 2] = zs[j]; }
  let k = 0;
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nx * nz * 3).fill(0), 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeBoundingSphere();
  return g;
}
{ const orig = waterGeometry; waterGeometry = function () { return CURMAP.id === 'iate' ? iateWaterGeometry() : orig(); }; }

/* ---------- definição ---------- */
const IA_POI = [
  // proa e heliponto
  [0, 0, 33, 'M'], [-4.5, 0, 37, 'M', 1], [4.5, 0, 37, 'M', 1], [-7.5, 0, 28, 'L'], [7.5, 0, 28, 'E'],
  // salão e Solário
  [-3, 0, 23.5, 'M', 1], [1.8, 0, 14.2, 'M', 1], [-3.8, 0, 13.5, 'M', 1], [0, 3, 19, 'M', 1], [-6.3, 3, 12.5, 'L', 1], [6.3, 3, 12.5, 'E', 1],
  // passadiços
  [-8.5, 0, 18, 'L'], [8.5, 0, 18, 'E'], [-8.5, 0, -19, 'L', 1], [8.5, 0, -19, 'E', 1], [-8.5, 0, -30, 'L'], [8.5, 0, -30, 'E'],
  // piscina (ponto B)
  [0, 0, -1, 'M'], [-6.5, 0, -1, 'L', 1], [6.5, 0, -1, 'E', 1], [-4.4, 0, 9.5, 'M', 1], [4.4, 0, 9.5, 'M', 1], [-8, 0, 3, 'L'], [8, 0, 3, 'E'],
  // cassino, ponte e terraço
  [0, 0, -16.3, 'M', 1], [-4.2, 0, -24, 'M', 1], [3.4, 0, -12.2, 'M', 1], [0, 3, -21.5, 'M', 1], [0, 3, -14, 'M', 1], [-6.3, 3, -25, 'L', 1], [6.3, 3, -25, 'E', 1],
  // popa e garagem
  [0, 0, -44, 'M'], [-4, 0, -34, 'M', 1], [4, 0, -34, 'M', 1], [-6.5, -3, -45, 'L'], [6.5, -3, -45, 'E'], [0, -3, -40, 'M', 1],
  // cabines
  [0, -3, 12, 'M'], [0, -3, -14, 'M'], [0, -3, -30, 'M'], [-6, -3, 3, 'L', 1], [6, -3, 3, 'E', 1], [-6, -3, -5, 'L', 1], [6, -3, -5, 'E', 1], [-6, -3, -22, 'L', 1], [6, -3, -22, 'E', 1],
];
const ATMO_IATE = Object.assign({}, ATMO_MELTEM, { fog: [0.66, 0.78, 0.9], fogD: 0.0016, grade: { lo: [0.95, 1.0, 1.05], hi: [1.05, 1.01, 0.95], exp: 0.86 } });
MAP_DEFS.iate = {
  type: 'mid', // corredores apertados e conveses compridos
  void: { kill: -5.5 }, // sem chão fora do navio: quem cai no mar morre
  bounds: { x0: -11, x1: 11, z0: -54, z1: 54 },
  textures: ['wood', 'steel', 'canvas', 'concrete', 'plaster', 'palmbark'],
  surfaces: ['ripple', 'iaTeca'],
  sound: { pack: 'amb_embruns', bed: 0.5, water: () => 0,
    loops: [[-11, -4, 30], [11, -4, 30], [-11, -4, -25], [11, -4, -25]].map((p) => ({ id: 'a_waves', p, gain: 0.4, ref: 6, roll: 1.3, max: 120 })),
    spots: [
      { id: 'a_gull', every: [8, 18], gain: 0.35, at: () => new V3(rand(-60, 60), rand(10, 24), rand(-70, 70)), ref: 10 },
      { id: 'a_creak', every: [14, 32], gain: 0.25, at: () => new V3(rand(-9, 9), rand(-3, 1), rand(-50, 40)), ref: 5 },
      { id: 'a_foghorn', every: [100, 220], gain: 0.35, at: () => new V3(-500, 5, rand(-300, 300)), ref: 80, roll: 0.5 },
    ] },
  materials: (M) => {
    M('hull', { tex: 'carpaint', metal: 0.35, ma: true, env: 1.3, dust: 0.08, macro: 0.08 });
    M('iaTeca', { tex: 'iaTeca', grime: 0.25, dust: 0.12, macro: 0.18, env: 0.5 });
  },
  art: { cam: [-24, 9, 46], look: [0, 1, 6], fov: 55 },
  splat: { x0: -64, z0: -64, w: 128, d: 128, ppm: 2 },
  far: 600,
  build() {
    waterSetup({ y: IA.WL, box: [-2000, 2000, -2000, 2000], open: [-260, -120], east: 900 });
    iateLevel();
  },
  after() { waterBuild({ deep: [0.0, 0.03, 0.1], shallow: [0.0, 0.08, 0.14], scatter: [0.01, 0.07, 0.11], foam: [0.85, 0.88, 0.88], refl: 1.0, caus: 0, foamK: 0.6 }); },
  ready() { waterReady({ from: [-40, IA.WL + 2.5, 0] }); },
  spawns: [[-4, 29], [-1.5, 29], [1.5, 29], [4, 29], [-3, 33], [0, 31.5], [3, 33], [-4.5, 36], [-1.5, 36.5], [1.5, 36.5], [4.5, 36], [-2.5, 39.5], [0, 39.5], [2.5, 39.5]],
  poi: IA_POI,
  // dominação: A no heliponto, B entre a piscina e a escada central, C no convés de popa
  dom: [[0, 34], [0, -1.5], [0, -34]],
  mecha: [[0, 34], [0, -1], [0, -45]],
  lane: (x) => (x < -4.5 ? 'L' : x > 4.5 ? 'E' : 'M'),
  sniper: [0, 3, -21.5], // a ponte de comando: o janelão olha a piscina, o Solário e a proa
  coverZ: 46,
  heli: [26, 62],
  cam: 58,
  surface: (p) => (p.y < -1 && p.z < -35 ? 'metal' : 'wood'),
  zones: [
    ['Heliponto', -11, 11, 25, 54], ['Garagem das lanchas', -11, 11, -54, -35], ['Popa', -11, 11, -35, -27],
    ['Passadiço bombordo', -11, -5.5, -27, 25], ['Passadiço estibordo', 5.5, 11, -27, 25],
    ['Salão Panorâmico', -5.5, 5.5, 11, 25], ['Cassino', -5.5, 5.5, -27, -11], ['Piscina', -5.5, 5.5, -11, 11],
  ],
  atmo: ATMO_IATE,
};
MAPS.push({ id: 'iate', name: 'Iate Esmeralda', tag: 'Iate de luxo em alto-mar', ok: true,
  desc: 'Um iate de luxo parado no meio do oceano. O dono saiu para mergulhar e deixou a piscina aquecida.' });
MAP_ART.iate = 'maps/iate.svg';
