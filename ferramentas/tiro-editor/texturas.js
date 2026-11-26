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
const ED_TEX_NOSSAS = ['edChapa', 'edListras', 'edAzulejo', 'edXadrez'];
Object.assign(TEXSCALE, { edChapa: 1.2, edListras: 1.5, edAzulejo: 1.6, edXadrez: 3.2 });
for (const k of ED_TEX_NOSSAS) OPT_TEX.add(k);
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
};
// a galeria do editor: [chave da matéria, nome, grupo]
const ED_SUPERF = [
  ['plaster', 'Reboco', 'Parede'], ['plaster2', 'Reboco gasto', 'Parede'], ['brick', 'Tijolo', 'Parede'], ['ashlar', 'Pedra talhada', 'Parede'],
  ['stone', 'Pedra', 'Parede'], ['drystone', 'Pedra seca', 'Parede'], ['adobe', 'Adobe', 'Parede'], ['pise', 'Taipa', 'Parede'],
  ['concrete', 'Concreto', 'Parede'], ['slate', 'Ardósia', 'Parede'], ['rock', 'Rocha', 'Parede'], ['strata', 'Rocha em camadas', 'Parede'],
  ['asphalt', 'Asfalto', 'Chão'], ['pavers', 'Lajota', 'Chão'], ['cobble', 'Paralelepípedo', 'Chão'], ['flagstone', 'Laje de pedra', 'Chão'],
  ['tiles', 'Ladrilho', 'Chão'], ['edAzulejo', 'Azulejo', 'Chão'], ['edXadrez', 'Piso xadrez', 'Chão'], ['boards', 'Tábuas', 'Chão'], ['rug', 'Tapete', 'Chão'],
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
function edTexturasDoMapa(J) {
  const s = new Set(TIRO_TEX);
  for (const P of J.pecas || []) if ((P.t === 'caixa' || P.t === 'escada') && P.m && TEX_PACKS[P.m]) s.add(P.m);
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
