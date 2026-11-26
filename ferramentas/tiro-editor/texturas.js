/* ==========================================================================
   SUPERFÍCIES DO EDITOR DE MAPAS (Tiro da Galera). As caixas e escadas do editor escolhem a superfície numa galeria com miniaturas
   e ganham "Tamanho da textura" (campo tx do .json: 1 = normal, 2 = o dobro do tamanho).
   - Fotos do jogo (tex/*.js) que os mapas não usavam viram matérias novas (rust, lawn, slate...).
   - Quatro texturas nossas, desenhadas por shader: chapa xadrez, faixa de perigo, azulejo e piso xadrez.
   - Cada mapa do editor carrega só as fotos que usa.
   ========================================================================== */
Object.assign(TEXLAB, {
  edChapa: [512, 41, 1.4, `
    vec2 g = uv * 10.0; vec2 c = floor(g); vec2 f = fract(g) - 0.5;
    float lado = mod(c.x + c.y, 2.0);
    vec2 q = lado > 0.5 ? vec2(f.x + f.y, f.x - f.y) : vec2(f.x - f.y, f.x + f.y);
    float d = length(vec2(q.x * 0.33, q.y * 1.7));
    float bump = 1.0 - smoothstep(0.1, 0.15, d);
    float risco = gfbm(uv, vec2(48.0, 4.0), 3, 5.0), sujo = gfbm(uv, vec2(4.0), 4, 2.0);
    vec3 base = mix(srgb(vec3(0.42, 0.43, 0.45)), srgb(vec3(0.6, 0.61, 0.63)), risco * 0.5 + bump * 0.35);
    a = mix(base, base * 0.7, smoothstep(0.55, 0.85, sujo) * 0.6);
    h = bump * 0.8 + risco * 0.05; r = 0.42 - bump * 0.12 + sujo * 0.2; x = h;`],
  edListras: [512, 43, 0.6, `
    float s = fract((uv.x + uv.y) * 5.0);
    float faixa = smoothstep(0.48, 0.52, s) * (1.0 - smoothstep(0.98, 1.0, s)) + (1.0 - smoothstep(0.0, 0.02, s));
    vec3 c = mix(srgb(vec3(0.95, 0.72, 0.08)), srgb(vec3(0.06, 0.06, 0.06)), clamp(faixa, 0.0, 1.0));
    float gasto = smoothstep(0.58, 0.82, gfbm(uv, vec2(6.0), 5, 3.0)), fino = gfbm(uv, vec2(64.0), 3, 8.0);
    a = mix(c, srgb(vec3(0.42, 0.42, 0.42)) * (0.8 + fino * 0.4), gasto * 0.75) * (0.92 + fino * 0.12);
    h = 0.5 - gasto * 0.2; r = 0.6 + gasto * 0.25; x = h;`],
  edAzulejo: [512, 45, 0.9, `
    vec2 g = uv * 8.0, f = fract(g); float id = hs(floor(g), 2.0);
    float e = min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y));
    float rejunte = 1.0 - smoothstep(0.025, 0.045, e);
    float mancha = gfbm(uv, vec2(5.0), 4, 6.0);
    vec3 azul = srgb(vec3(0.9, 0.93, 0.95)) * (0.94 + id * 0.08);
    a = mix(azul, srgb(vec3(0.58, 0.57, 0.54)) * (0.8 + mancha * 0.3), rejunte);
    h = (1.0 - rejunte) * 0.9; r = 0.18 + rejunte * 0.7 + mancha * 0.08; x = h;`],
  edXadrez: [512, 47, 0.7, `
    vec2 g = uv * 8.0, f = fract(g); float cel = mod(floor(g.x) + floor(g.y), 2.0);
    float e = min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y)), junta = 1.0 - smoothstep(0.01, 0.025, e);
    float risco = gfbm(uv, vec2(32.0), 4, 9.0), sujo = gfbm(uv, vec2(3.0), 4, 4.0);
    a = mix(srgb(vec3(0.1, 0.1, 0.11)), srgb(vec3(0.86, 0.85, 0.82)), cel) * (0.93 + risco * 0.12);
    a = mix(a, a * 0.75, junta + smoothstep(0.6, 0.9, sujo) * 0.3);
    h = 1.0 - junta * 0.6; r = 0.3 + risco * 0.15 + junta * 0.4; x = h;`],
});
// (2026-11-26, Aeroporto) cinco superfícies de aeroporto, desenhadas por shader: porcelanato polido do terminal (placas de 1,2 m),
// placas de concreto do pátio (5 m, com junta, óleo e marca de pneu), painel de alumínio da fachada, forro de placas (0,6 m) e carpete
Object.assign(TEXLAB, {
  edPorcelanato: [1024, 51, 0.5, `
    vec4 t = tiles(uv, vec2(4.0), 0.0);
    float junta = 1.0 - smoothstep(0.004, 0.008, t.w);
    float veio = gfbm(uv, vec2(6.0), 5, 3.0), fino = vn(uv * 512.0, vec2(512.0), 2.0), nuvem = gfbm(uv, vec2(2.0), 4, 8.0);
    vec3 c = mix(srgb(vec3(0.8, 0.79, 0.76)), srgb(vec3(0.9, 0.89, 0.86)), veio) * (0.95 + t.z * 0.07) * (0.97 + fino * 0.05);
    c *= 0.94 + nuvem * 0.1;
    a = mix(c, srgb(vec3(0.45, 0.44, 0.42)), junta);
    h = 1.0 - junta * 0.7; r = 0.14 + junta * 0.6 + smoothstep(0.55, 0.85, nuvem) * 0.14; x = h;`],
  edPatio: [1024, 53, 1.2, `
    vec4 t = tiles(uv, vec2(2.0), 0.0);
    float junta = 1.0 - smoothstep(0.003, 0.007, t.w);
    float big = gfbm(uv, vec2(3.0), 5, 1.0), mid = gfbm(uv, vec2(16.0), 4, 2.0), gr = vn(uv * 512.0, vec2(512.0), 3.0);
    float oleo = smoothstep(0.62, 0.8, gfbm(uv + 0.17, vec2(5.0), 4, 6.0));
    float rodas = sin((uv.x * 3.0 + gfbm(uv, vec2(2.0), 3, 7.0) * 0.6) * 25.132741) * 0.5 + 0.5;
    float pneu = smoothstep(0.75, 1.0, rodas) * smoothstep(0.4, 0.7, gfbm(uv, vec2(3.0, 1.0), 3, 9.0));
    vec3 c = mix(srgb(vec3(0.62, 0.62, 0.6)), srgb(vec3(0.74, 0.74, 0.72)), big) * (0.9 + mid * 0.16 + gr * 0.1) * (0.94 + t.z * 0.1);
    c = mix(c, c * 0.55, oleo * 0.55); c = mix(c, srgb(vec3(0.16, 0.16, 0.17)), pneu * 0.35);
    a = mix(c, srgb(vec3(0.12, 0.12, 0.12)), junta * 0.85);
    h = big * 0.25 + mid * 0.2 + gr * 0.15 - junta * 0.6; r = 0.88 - oleo * 0.35 - pneu * 0.1; x = h;`],
  edAluminio: [512, 55, 0.8, `
    vec4 t = tiles(uv, vec2(2.0, 4.0), 0.0);
    float junta = 1.0 - smoothstep(0.012, 0.022, t.w);
    float escovado = gfbm(uv, vec2(1.0, 24.0), 3, 4.0), fino = vn(uv * 512.0, vec2(512.0), 2.0), sujo = gfbm(uv, vec2(3.0), 4, 5.0);
    vec3 c = srgb(vec3(0.82, 0.83, 0.84)) * (0.95 + t.z * 0.08 + escovado * 0.05 + fino * 0.03);
    c = mix(c, c * 0.8, smoothstep(0.6, 0.9, sujo) * 0.4 * (1.0 - t.y));
    a = mix(c, srgb(vec3(0.08, 0.08, 0.09)), junta);
    h = 1.0 - junta; r = 0.35 + junta * 0.5 + sujo * 0.1; x = h;`],
  edForro: [512, 57, 0.6, `
    vec4 t = tiles(uv, vec2(4.0), 0.0);
    float perfil = 1.0 - smoothstep(0.02, 0.035, t.w);
    float furo = step(0.82, vn(uv * 256.0, vec2(256.0), 4.0)) * 0.5 + vn(uv * 128.0, vec2(128.0), 5.0) * 0.2;
    vec3 c = srgb(vec3(0.9, 0.9, 0.88)) * (0.96 + t.z * 0.04) * (1.0 - furo * 0.25);
    a = mix(c, srgb(vec3(0.75, 0.76, 0.78)), perfil);
    h = (1.0 - perfil) * 0.6 - furo * 0.15; r = mix(0.95, 0.4, perfil); x = h;`],
  edCarpete: [512, 59, 0.5, `
    float fibra = vn(uv * 512.0, vec2(512.0), 1.0), fibra2 = vn(uv * 256.0, vec2(256.0), 2.0);
    vec2 g = fract(uv * 8.0) - 0.5; float losango = 1.0 - smoothstep(0.18, 0.22, abs(g.x) + abs(g.y));
    float faixa = step(0.94, fract(uv.y * 4.0)), gasto = gfbm(uv, vec2(3.0), 4, 6.0);
    vec3 c = mix(srgb(vec3(0.22, 0.26, 0.36)), srgb(vec3(0.34, 0.4, 0.52)), losango * 0.6);
    c = mix(c, srgb(vec3(0.62, 0.5, 0.28)), faixa * 0.7);
    a = c * (0.82 + fibra * 0.25 + fibra2 * 0.1) * (0.92 + gasto * 0.12);
    h = fibra * 0.5 + fibra2 * 0.3; r = 0.98; x = h;`],
});
const ED_TEX_NOSSAS = ['edChapa', 'edListras', 'edAzulejo', 'edXadrez'];
// as de aeroporto só se desenham nos mapas que usam (edTexUsadas)
const ED_TEX_AERO = ['edPorcelanato', 'edPatio', 'edAluminio', 'edForro', 'edCarpete'];
Object.assign(TEXSCALE, { edChapa: 1.2, edListras: 1.5, edAzulejo: 1.6, edXadrez: 3.2 });
Object.assign(TEXSCALE, { edPorcelanato: 4.8, edPatio: 10, edAluminio: 3, edForro: 2.4, edCarpete: 2 });
for (const k of [...ED_TEX_NOSSAS, ...ED_TEX_AERO]) OPT_TEX.add(k);
// fotos do jogo que viram matéria nova nos mapas do editor: [chave, tamanho do ladrilho em m, opções da matéria]
const ED_FOTOS_NOVAS = {
  adobe: [2.4, { grime: 0.6, dust: 0.5, macro: 0.3, pom: 0.03 }], ash: [3, { macro: 0.35 }], bark: [1.5, { macro: 0.2 }],
  boards: [2, { grime: 0.5, dust: 0.3, macro: 0.2 }], drystone: [2.4, { dust: 0.5, macro: 0.3, pom: 0.04 }], flagstone: [2.4, { dust: 0.4, macro: 0.3, pom: 0.035 }],
  galets: [2, { macro: 0.3, pom: 0.03 }], humus: [3, { macro: 0.35 }], lawn: [3, { macro: 0.4 }], pathgravel: [2.5, { macro: 0.3, dust: 0.2 }],
  pise: [2.6, { grime: 0.5, dust: 0.5, macro: 0.3 }], rock: [3.5, { macro: 0.35, pom: 0.04 }], rust: [2, { metal: 0.4, ma: true, env: 0.6, macro: 0.25 }],
  slate: [2.2, { macro: 0.25, env: 0.4 }], snow: [4, { macro: 0.3, env: 0.5 }], snowpack: [3.5, { macro: 0.3, env: 0.5 }], strata: [3.5, { macro: 0.35, pom: 0.04 }],
};
for (const [k, [esc]] of Object.entries(ED_FOTOS_NOVAS)) if (!TEXSCALE[k]) TEXSCALE[k] = esc;
const ED_MAT_NOSSAS = {
  edChapa: { metal: 0.65, ma: true, env: 0.8, macro: 0.12, dust: 0.2, rough: 1 }, edListras: { macro: 0.2, dust: 0.3, grime: 0.4 },
  edAzulejo: { env: 0.7, macro: 0.15, dust: 0.15 }, edXadrez: { env: 0.6, macro: 0.2, dust: 0.2 },
  edPorcelanato: { env: 1, macro: 0.12, dust: 0.1 }, edPatio: { macro: 0.35, dust: 0.3, grime: 0.4 }, edAluminio: { metal: 0.55, ma: true, env: 0.9, macro: 0.1, rough: 1 },
  edForro: { macro: 0.08, env: 0.3 }, edCarpete: { macro: 0.15, env: 0.1 },
};
// a galeria do editor: [chave da matéria, nome, grupo]
const ED_SUPERF = [
  ['plaster', 'Reboco', 'Parede'], ['plaster2', 'Reboco gasto', 'Parede'], ['brick', 'Tijolo', 'Parede'], ['ashlar', 'Pedra talhada', 'Parede'],
  ['stone', 'Pedra', 'Parede'], ['drystone', 'Pedra seca', 'Parede'], ['adobe', 'Adobe', 'Parede'], ['pise', 'Taipa', 'Parede'],
  ['concrete', 'Concreto', 'Parede'], ['edAluminio', 'Painel de alumínio', 'Parede'], ['edForro', 'Forro de placas', 'Parede'], ['slate', 'Ardósia', 'Parede'], ['rock', 'Rocha', 'Parede'], ['strata', 'Rocha em camadas', 'Parede'],
  ['asphalt', 'Asfalto', 'Chão'], ['pavers', 'Lajota', 'Chão'], ['cobble', 'Paralelepípedo', 'Chão'], ['flagstone', 'Laje de pedra', 'Chão'],
  ['tiles', 'Ladrilho', 'Chão'], ['edPorcelanato', 'Porcelanato polido', 'Chão'], ['edPatio', 'Concreto do pátio', 'Chão'], ['edCarpete', 'Carpete', 'Chão'], ['edAzulejo', 'Azulejo', 'Chão'], ['edXadrez', 'Piso xadrez', 'Chão'], ['boards', 'Tábuas', 'Chão'], ['rug', 'Tapete', 'Chão'],
  ['galets', 'Seixos', 'Chão'], ['pathgravel', 'Cascalho', 'Chão'], ['sand', 'Areia', 'Chão'], ['dirt', 'Terra', 'Chão'], ['humus', 'Terra escura', 'Chão'],
  ['lawn', 'Grama', 'Chão'], ['snow', 'Neve', 'Chão'], ['snowpack', 'Neve batida', 'Chão'], ['ash', 'Cinza', 'Chão'],
  ['wood', 'Madeira', 'Madeira'], ['timber', 'Viga', 'Madeira'], ['paintwood', 'Madeira pintada', 'Madeira'], ['crate', 'Caixote', 'Madeira'],
  ['shutter', 'Veneziana', 'Madeira'], ['bark', 'Casca de árvore', 'Madeira'],
  ['steel', 'Aço', 'Metal'], ['rust', 'Ferrugem', 'Metal'], ['edChapa', 'Chapa xadrez', 'Metal'], ['edListras', 'Faixa de perigo', 'Metal'],
  ['rollshutter', 'Porta de enrolar', 'Metal'], ['corrugated', 'Chapa ondulada', 'Metal'], ['paint', 'Pintura', 'Metal'], ['carpaint', 'Pintura brilhante', 'Metal'],
  ['rooftiles', 'Telhas', 'Outros'], ['canvas', 'Lona', 'Outros'], ['burlap', 'Juta', 'Outros'], ['cardboard', 'Papelão', 'Outros'],
  ['plastic', 'Plástico', 'Outros'], ['rubber', 'Borracha', 'Outros'], ['glass', 'Vidro', 'Outros'], ['dark', 'Escuro', 'Outros'],
];
// as fotos que um mapa do editor precisa carregar (as de sempre + as que as caixas e escadas usam)
function edTexUsadas(J) {
  const s = new Set();
  for (const P of J.pecas || []) if ((P.t === 'caixa' || P.t === 'escada') && ED_TEX_AERO.includes(P.m)) s.add(P.m);
  return [...s];
}
function edTexturasDoMapa(J) {
  const s = new Set(TIRO_TEX);
  for (const P of J.pecas || []) {
    if ((P.t === 'caixa' || P.t === 'escada') && P.m && TEX_PACKS[P.m]) s.add(P.m);
    if (P.t === 'prefab' && KC_TEX_PECAS[P.nome]) for (const k of KC_TEX_PECAS[P.nome]) if (TEX_PACKS[k]) s.add(k);
  }
  return [...s];
}
// matérias novas: só nos mapas do editor (nos outros mapas nada muda)
const _edMakeMaterials = makeMaterials;
makeMaterials = function () {
  _edMakeMaterials.apply(this, arguments);
  if (!(CURMAP.def && CURMAP.def.editor)) return;
  for (const [k, [, o]] of Object.entries(ED_FOTOS_NOVAS)) MAT[k] = TEX[k] ? worldMat(Object.assign({ tex: k }, o)) : MAT.concrete;
  for (const [k, o] of Object.entries(ED_MAT_NOSSAS)) MAT[k] = TEX[k] ? worldMat(Object.assign({ tex: k }, o)) : MAT.paint;
};
// tamanho da textura de uma caixa/escada do editor (o box() do jogo divide o uv por uv / TEXSCALE)
const edUv = (P) => (P.tx && P.tx !== 1 && TEXSCALE[P.m] ? TEXSCALE[P.m] * P.tx : undefined);
