/* ==========================================================================
   PEÇAS NOVAS DO EDITOR DE MAPAS (prefixo kc: "kit de cobertura").
   Coberturas para montar mapas de tiro: barreiras, sacos de areia, muro quebrado, guarita, tanque... Todas com a origem no centro
   de baixo, comprimento em x, sem parâmetros (o editor coloca direto) e com colisão que segura gente e bala.
   Entram no jogo montado por ferramentas/tiro-frontline.js, junto do editor; aparecem sozinhas na aba Prefabs.
   ========================================================================== */
const KC_COR = {
  concreto: [0.72, 0.71, 0.68], concretoEsc: [0.52, 0.51, 0.49], saco: [0.66, 0.58, 0.42], sacoEsc: [0.55, 0.48, 0.34],
  verde: [0.3, 0.36, 0.24], terra: [0.45, 0.36, 0.26], madeira: [0.74, 0.58, 0.4], ferro: [0.36, 0.36, 0.37], branco: [0.92, 0.92, 0.9],
  vermelho: [0.78, 0.14, 0.12], amarelo: [0.9, 0.72, 0.16], vidro: [0.12, 0.15, 0.18],
};

// barreira New Jersey de concreto, 3 m
PF.kcJersey = () => prefab('kcJersey', (M) => {
  M.local(1); M.color(KC_COR.concreto);
  M.save().rotY(Math.PI / 2).move(0, 0, -1.5);
  M.extrude('concrete', [[-0.3, 0], [0.3, 0], [0.3, 0.08], [0.13, 0.3], [0.1, 0.85], [-0.1, 0.85], [-0.13, 0.3], [-0.3, 0.08]], 3, { sharp: 0.5 });
  M.restore();
  M.color([0.08, 0.08, 0.08]); M.cls = 1;
  for (const x of [-0.9, 0.9]) M.boxB('dark', x - 0.15, x + 0.15, 0, 0.1, -0.31, 0.31); // vão da empilhadeira
  M.color(KC_COR.amarelo); M.boxB('paint', -1.49, 1.49, 0.62, 0.7, -0.115, 0.115);
  M.col(-1.5, 1.5, 0, 0.85, -0.3, 0.3, 'concrete');
});

// muro de sacos de areia, 2,4 m: alto (1,2 m, cobre de pé) ou baixo (0,6 m, cobre agachado)
function kcSacos(M, fileiras, seed) {
  const R = rngOf(seed); M.local(1);
  for (let f = 0; f < fileiras; f++) {
    const y = f * 0.2, off = f % 2 ? 0.3 : 0, n = f % 2 ? 4 : 5, w = 2.4 / 4, d = f < fileiras - 1 ? 0.6 : 0.5;
    for (let i = 0; i < n; i++) {
      const x = -1.2 + off + i * w - (f % 2 ? 0 : w / 2), a = Math.max(-1.2, x - w / 2 + 0.02), b = Math.min(1.2, x + w / 2 - 0.02);
      if (b - a < 0.1) continue;
      M.color(R() < 0.5 ? KC_COR.saco : KC_COR.sacoEsc);
      M.save().move(0, 0, R.range(-0.03, 0.03));
      M.boxB('canvas', a, b, y, y + 0.21, -d / 2, d / 2, { bevel: 0.07 });
      M.restore();
    }
  }
  M.col(-1.2, 1.2, 0, fileiras * 0.2, -0.3, 0.3, 'concrete');
}
PF.kcSacos = () => prefab('kcSacos', (M) => kcSacos(M, 6, 3));
PF.kcSacosBaixo = () => prefab('kcSacosBaixo', (M) => kcSacos(M, 3, 5));

// barreira de gabião (cesto de tela cheio de terra), dois cestos, 2,1 x 1,4 x 1,05 m
PF.kcGabiao = () => prefab('kcGabiao', (M) => {
  M.local(1);
  for (const cx of [-0.53, 0.53]) {
    M.color(KC_COR.saco); M.boxB('canvas', cx - 0.51, cx + 0.51, 0, 1.38, -0.51, 0.51);
    M.color(KC_COR.terra); M.boxB('concrete', cx - 0.47, cx + 0.47, 1.38, 1.42, -0.47, 0.47);
    M.color(KC_COR.ferro); M.cls = 1;
    for (let k = 0; k <= 4; k++) {
      const t = -0.52 + k * 0.26;
      for (const sz of [-1, 1]) M.boxB('steel', cx + t - 0.012, cx + t + 0.012, 0, 1.4, sz * 0.52 - 0.012, sz * 0.52 + 0.012);
      for (const sx of [-1, 1]) M.boxB('steel', cx + sx * 0.52 - 0.012, cx + sx * 0.52 + 0.012, 0, 1.4, t - 0.012, t + 0.012);
    }
    for (let k = 0; k <= 5; k++) { const y = k * 0.28; M.boxB('steel', cx - 0.525, cx + 0.525, y - 0.012, y + 0.012, -0.525, 0.525); }
    M.cls = 0;
  }
  M.col(-1.05, 1.05, 0, 1.42, -0.52, 0.52, 'concrete');
});

// muro de concreto quebrado, 4 m: topo recortado (altura de 1,3 a 2,6 m) e ferros para fora
PF.kcMuroQuebrado = () => prefab('kcMuroQuebrado', (M) => {
  const R = rngOf(11), alt = [2.6, 2.5, 2.2, 1.6, 1.3, 1.5, 2.1, 2.6]; M.local(1);
  for (let i = 0; i < 8; i++) {
    const a = -2 + i * 0.5, b = a + 0.5, h = alt[i];
    M.color(i % 3 ? KC_COR.concreto : KC_COR.concretoEsc);
    M.boxB('concrete', a, b, 0, h, -0.15, 0.15);
    M.save().move((a + b) / 2, h, R.range(-0.05, 0.05)).rotZ(R.range(-0.35, 0.35));
    M.boxB('concrete', -0.22, 0.22, -0.06, 0.06, -0.14, 0.14); M.restore();
    M.color(KC_COR.ferro); M.cls = 1;
    for (const z of [-0.08, 0.08]) { M.save().move(a + 0.25 + R.range(-0.1, 0.1), h, z).rotZ(R.range(-0.5, 0.5)); M.cyl('steel', 0.008, R.range(0.15, 0.4), 5); M.restore(); }
    M.cls = 0;
    M.col(a, b, 0, h, -0.15, 0.15, 'concrete');
  }
});

// pilar de concreto quebrado no alto, 0,8 x 3,2 m
PF.kcPilar = () => prefab('kcPilar', (M) => {
  const R = rngOf(7); M.local(1); M.color(KC_COR.concreto);
  M.boxB('concrete', -0.4, 0.4, 0, 2.9, -0.4, 0.4, { bevel: 0.02 });
  M.color(KC_COR.concretoEsc);
  M.save().move(0.1, 2.9, -0.05).rotZ(0.25).rotX(-0.15); M.boxB('concrete', -0.3, 0.3, -0.1, 0.25, -0.3, 0.3); M.restore();
  M.color(KC_COR.ferro); M.cls = 1;
  for (const [x, z] of [[-0.32, -0.32], [0.32, -0.32], [-0.32, 0.32], [0.32, 0.32]]) { M.save().move(x, 2.85, z).rotZ(R.range(-0.4, 0.4)).rotX(R.range(-0.4, 0.4)); M.cyl('steel', 0.012, R.range(0.3, 0.6), 5); M.restore(); }
  M.col(-0.4, 0.4, 0, 3.1, -0.4, 0.4, 'concrete');
});

// carretel de cabo grande, deitado, 1,9 m de diâmetro
PF.kcCarretel = () => prefab('kcCarretel', (M) => {
  M.local(1);
  for (const x of [-0.6, 0.6]) {
    M.color(KC_COR.madeira); M.save().move(x, 0.95, 0).rotZ(Math.PI / 2).move(0, -0.05, 0); M.cyl('crate', 0.95, 0.1, 28, { uR: 0.5 }); M.restore();
    M.color(KC_COR.ferro); M.save().move(x + Math.sign(x) * 0.05, 0.95, 0).rotZ(Math.PI / 2).move(0, -0.005, 0); M.cyl('steel', 0.18, 0.01, 16); M.restore();
  }
  M.color([0.1, 0.1, 0.11]); M.save().move(-0.55, 0.95, 0).rotZ(-Math.PI / 2); M.cyl('rubber', 0.7, 1.1, 24); M.restore();
  M.col(-0.65, 0.65, 0, 1.9, -0.8, 0.8, 'wood');
});

// guarita de concreto com janelas escuras e porta, 2,4 x 2,7 x 2,4 m (fechada)
PF.kcGuarita = () => prefab('kcGuarita', (M) => {
  M.local(1); M.color(KC_COR.branco);
  M.boxB('plaster', -1.2, 1.2, 0, 0.9, -1.2, 1.2);
  for (const [x0, x1] of [[-1.2, -1.05], [1.05, 1.2]]) M.boxB('plaster', x0, x1, 0.9, 2.4, -1.2, 1.2);
  for (const [z0, z1] of [[-1.2, -1.05], [1.05, 1.2]]) M.boxB('plaster', -1.05, 1.05, 0.9, 2.4, z0, z1);
  M.boxB('plaster', -1.2, 1.2, 2.4, 2.5, -1.2, 1.2);
  M.color(KC_COR.vidro); M.cls = 1;
  for (const s of [-1, 1]) { M.boxB('glass', -0.9, 0.9, 1.1, 2.1, s * 1.21 - 0.01, s * 1.21 + 0.01); M.boxB('glass', s * 1.21 - 0.01, s * 1.21 + 0.01, 1.1, 2.1, -0.9, 0.9); }
  M.color([0.25, 0.3, 0.34]); M.boxB('paint', 0.3, 1.0, 0, 2.1, 1.215, 1.23); // porta
  M.cls = 0;
  M.color(KC_COR.concretoEsc); M.boxB('concrete', -1.4, 1.4, 2.5, 2.7, -1.4, 1.4, { bevel: 0.03 });
  M.color(KC_COR.vermelho); M.boxB('paint', -1.21, 1.21, 0.85, 0.95, -1.21, 1.21);
  M.col(-1.2, 1.2, 0, 2.7, -1.2, 1.2, 'concrete');
});

// tanque de combustível deitado em dois berços, 2,2 m de diâmetro, 5 m de comprimento
PF.kcTanque = () => prefab('kcTanque', (M) => {
  M.local(1);
  M.color(KC_COR.concretoEsc); for (const x of [-1.6, 1.6]) M.boxB('concrete', x - 0.25, x + 0.25, 0, 0.55, -0.9, 0.9);
  M.color(KC_COR.branco); M.save().move(-2.5, 1.45, 0).rotZ(-Math.PI / 2); M.cyl('paint', 1.1, 5, 28); M.restore();
  for (const x of [-2.5, 2.5]) { M.save().move(x, 1.45, 0).rotZ(x < 0 ? Math.PI / 2 : -Math.PI / 2); M.cyl('paint', 1.1, 0.25, 28, { r1: 0.6 }); M.restore(); }
  M.color(KC_COR.vermelho); M.cls = 1; M.save().move(-0.6, 1.45, 0).rotZ(-Math.PI / 2); M.cyl('paint', 1.115, 1.2, 28, { caps: '' }); M.restore();
  M.color(KC_COR.ferro); M.save().move(0, 2.5, 0); M.cyl('steel', 0.3, 0.2, 16); M.restore();
  M.cls = 0;
  M.col(-2.75, 2.75, 0, 2.55, -1.1, 1.1, 'steel');
});

// chapa de tapume (aço ondulado entre postes), 3 x 2,2 m
PF.kcTapume = () => prefab('kcTapume', (M) => {
  M.local(1); M.color([0.62, 0.64, 0.66]);
  for (let i = 0; i < 30; i++) { const x = -1.5 + i * 0.1, z = i % 2 ? 0.02 : -0.02; M.boxB('steel', x, x + 0.1, 0.05, 2.2, z - 0.012, z + 0.012); }
  M.color(KC_COR.ferro); for (const x of [-1.5, 0, 1.5]) M.boxB('steel', x - 0.04, x + 0.04, 0, 2.3, -0.08, 0.04);
  M.col(-1.5, 1.5, 0, 2.2, -0.06, 0.06, 'steel');
});

// pilha de paletes com carga embrulhada em plástico, 1,2 x 1,6 x 1 m
PF.kcPaletes = () => prefab('kcPaletes', (M) => {
  M.local(1);
  for (const y of [0, 0.8]) {
    M.color(KC_COR.madeira);
    for (const z of [-0.45, 0, 0.45]) M.boxB('wood', -0.6, 0.6, y, y + 0.1, z - 0.05, z + 0.05);
    M.boxB('wood', -0.6, 0.6, y + 0.1, y + 0.13, -0.5, 0.5);
    M.color(y ? [0.55, 0.42, 0.3] : [0.35, 0.45, 0.55]); M.boxB('crate', -0.57, 0.57, y + 0.13, y + 0.78, -0.47, 0.47, { bevel: 0.02 });
    M.color([0.9, 0.92, 0.94]); M.cls = 1; M.boxB('plastic', -0.585, 0.585, y + 0.15, y + 0.72, -0.485, 0.485); M.cls = 0;
  }
  M.col(-0.6, 0.6, 0, 1.58, -0.5, 0.5, 'wood');
});

// barreira plástica de água (vermelha e branca), 2 x 0,8 m: cobre agachado
PF.kcBarreiraAgua = () => prefab('kcBarreiraAgua', (M) => {
  M.local(1);
  for (const [i, c] of [[0, KC_COR.vermelho], [1, KC_COR.branco]]) {
    const x0 = -1 + i;
    M.color(c); M.save().rotY(Math.PI / 2).move(0, 0, x0 + 0.02);
    M.extrude('plastic', [[-0.25, 0], [0.25, 0], [0.25, 0.1], [0.14, 0.3], [0.12, 0.78], [-0.12, 0.78], [-0.14, 0.3], [-0.25, 0.1]], 0.96, { sharp: 0.4 });
    M.restore();
  }
  M.col(-1, 1, 0, 0.8, -0.25, 0.25, 'plastic');
});

// contêiner aberto dos dois lados (dá para passar por dentro e atirar de lá), 6,1 x 2,6 x 2,5 m, comprido em x
PF.kcConteinerAberto = () => prefab('kcConteinerAberto', (M) => {
  M.local(1); const L = 3.05, W = 1.22, H = 2.59, c = [0.2, 0.42, 0.55];
  M.color(c);
  M.boxB('steel', -L, L, 0, 0.12, -W, W);
  M.boxB('steel', -L, L, H - 0.1, H, -W, W);
  for (const s of [-1, 1]) for (let i = 0; i < 24; i++) { const x = -L + i * (2 * L / 24), z = s * (W - 0.03) + (i % 2 ? 0.02 : -0.02); M.boxB('steel', x, x + 2 * L / 24, 0.12, H - 0.1, z - 0.02, z + 0.02); }
  M.color([0.16, 0.16, 0.17]); for (const x of [-L, L - 0.12]) for (const z of [-W, W - 0.12]) M.boxB('steel', x, x + 0.12, 0, H, z, z + 0.12);
  M.color([0.28, 0.24, 0.2]); M.boxB('wood', -L + 0.05, L - 0.05, 0.12, 0.14, -W + 0.06, W - 0.06);
  M.col(-L, L, 0, 0.14, -W, W, 'steel');
  M.col(-L, L, H - 0.1, H, -W, W, 'steel');
  for (const s of [-1, 1]) M.col(-L, L, 0.14, H - 0.1, s > 0 ? W - 0.08 : -W, s > 0 ? W : -W + 0.08, 'steel');
});

/* ---------- pacote 2: cidade e fábrica ---------- */
// ponto de ônibus: cobertura, vidro escuro atrás, banco; dá para entrar pela frente (colide o fundo, as laterais e o teto)
PF.kcPontoOnibus = () => prefab('kcPontoOnibus', (M) => {
  M.local(1); M.color(KC_COR.ferro);
  for (const x of [-1.6, 1.6]) for (const z of [-0.6, 0.55]) M.boxB('steel', x - 0.04, x + 0.04, 0, 2.5, z - 0.04, z + 0.04);
  M.color([0.25, 0.42, 0.62]); M.boxB('paint', -1.75, 1.75, 2.5, 2.62, -0.8, 0.75, { bevel: 0.02 });
  M.color(KC_COR.vidro); M.boxB('glass', -1.6, 1.6, 0.15, 2.4, -0.62, -0.58);
  for (const x of [-1.6, 1.6]) M.boxB('glass', x - 0.02, x + 0.02, 0.15, 2.4, -0.58, 0.5);
  M.color([0.9, 0.86, 0.7]); M.boxB('paint', -1.0, 1.0, 0.7, 2.1, -0.575, -0.56); // cartaz
  M.color(KC_COR.madeira); M.boxB('wood', -1.3, 1.3, 0.42, 0.48, -0.55, -0.15);
  M.col(-1.6, 1.6, 0, 2.4, -0.62, -0.56, 'glass');
  for (const x of [-1.6, 1.6]) M.col(x - 0.04, x + 0.04, 0, 2.4, -0.62, 0.55, 'glass');
  M.col(-1.75, 1.75, 2.5, 2.62, -0.8, 0.75, 'steel');
});

// banca de jornal fechada (porta de enrolar), 2,9 x 2,5 x 2,1 m
PF.kcBanca = () => prefab('kcBanca', (M) => {
  M.local(1); M.color([0.15, 0.38, 0.24]);
  M.boxB('paint', -1.3, 1.3, 0, 2.3, -0.9, 0.9, { bevel: 0.03 });
  M.color([0.12, 0.3, 0.2]); M.boxB('paint', -1.45, 1.45, 2.3, 2.5, -1.05, 1.05, { bevel: 0.03 });
  M.color([0.7, 0.72, 0.74]); M.boxB('rollshutter', -1.15, 1.15, 0.3, 2.1, 0.9, 0.93);
  M.color([0.95, 0.85, 0.2]); M.boxB('paint', -1.0, 1.0, 2.33, 2.47, 1.05, 1.07);
  M.col(-1.3, 1.3, 0, 2.5, -0.9, 0.93, 'steel');
});

// carro queimado (só a carcaça, preta e ferrugem), 1,9 x 1,25 x 4,4 m, comprido em z
PF.kcCarroQueimado = () => prefab('kcCarroQueimado', (M) => {
  M.local(1); M.color([0.16, 0.13, 0.11]);
  M.boxB('charred', -0.95, 0.95, 0.12, 0.75, -2.2, 2.2, { bevel: 0.12 });
  M.color([0.36, 0.2, 0.12]); M.boxB('charred', -0.8, 0.8, 0.75, 1.25, -1.0, 0.9, { bevel: 0.1 });
  M.color([0.05, 0.05, 0.05]); M.cls = 1;
  for (const s of [-1, 1]) M.boxB('dark', s * 0.81 - 0.01, s * 0.81 + 0.01, 0.82, 1.15, -0.85, 0.75); // janelas sem vidro
  M.boxB('dark', -0.7, 0.7, 0.82, 1.15, 0.89, 0.91);
  M.color([0.12, 0.1, 0.09]);
  for (const z of [-1.4, 1.4]) for (const x of [-0.82, 0.82]) { M.save().move(x, 0.3, z).rotZ(Math.PI / 2).move(0, -0.08, 0); M.cyl('steel', 0.24, 0.16, 12); M.restore(); }
  M.cls = 0;
  M.col(-0.95, 0.95, 0, 0.75, -2.2, 2.2, 'steel'); M.col(-0.8, 0.8, 0.75, 1.25, -1.0, 0.9, 'steel');
});

// cavalete de obra listrado, 2 x 1,1 m (só cobre agachado)
PF.kcCavalete = () => prefab('kcCavalete', (M) => {
  M.local(1);
  for (const x of [-0.9, 0.9]) { M.color(KC_COR.ferro); for (const s of [-1, 1]) { M.save().move(x, 0, s * 0.25).rotX(s * 0.22); M.boxB('steel', -0.03, 0.03, 0, 1.1, -0.03, 0.03); M.restore(); } }
  for (const y of [0.55, 0.9]) for (let i = 0; i < 8; i++) { M.color(i % 2 ? KC_COR.branco : KC_COR.vermelho); M.boxB('plastic', -1 + i * 0.25, -0.75 + i * 0.25, y, y + 0.2, -0.03, 0.03); }
  M.col(-1, 1, 0, 1.1, -0.1, 0.1, 'plastic');
});

// monte de entulho grande (concreto quebrado, tijolo, ferro), 3 x 1,3 x 2,4 m
PF.kcEntulho = () => prefab('kcEntulho', (M) => {
  const R = rngOf(23); M.local(1);
  M.color(KC_COR.concretoEsc); M.save().scl(1.5, 0.65, 1.2); M.lathe('concrete', [[0, 0], [1, 0], [0.85, 0.5], [0.5, 1.6], [0, 2]], 10); M.restore();
  for (let i = 0; i < 14; i++) {
    const a = R() * TAU, d = R.range(0.2, 1.1), x = Math.cos(a) * d * 1.2, z = Math.sin(a) * d, y = Math.max(0, 1.2 - d) * 0.9;
    M.color(R() < 0.3 ? [0.6, 0.32, 0.24] : R() < 0.5 ? KC_COR.concreto : KC_COR.concretoEsc);
    M.save().move(x, y, z).rotY(R() * TAU).rotZ(R.range(-0.5, 0.5)).rotX(R.range(-0.4, 0.4));
    const w = R.range(0.3, 0.8), h = R.range(0.1, 0.3); M.boxB('concrete', -w / 2, w / 2, -h / 2, h / 2, -w / 3, w / 3); M.restore();
  }
  M.color(KC_COR.ferro); M.cls = 1;
  for (let i = 0; i < 5; i++) { M.save().move(R.range(-0.8, 0.8), R.range(0.5, 1.0), R.range(-0.6, 0.6)).rotZ(R.range(-1.2, 1.2)).rotX(R.range(-0.8, 0.8)); M.cyl('steel', 0.012, R.range(0.6, 1.2), 5); M.restore(); }
  M.cls = 0;
  M.col(-1.1, 1.1, 0, 0.9, -0.85, 0.85, 'concrete'); M.col(-0.6, 0.6, 0.9, 1.3, -0.45, 0.45, 'concrete');
});

// manilhas de concreto empilhadas (3 tubos grandes deitados), 2,4 x 2,2 x 2,2 m
PF.kcManilhas = () => prefab('kcManilhas', (M) => {
  M.local(1);
  for (const [x, y] of [[-0.62, 0.6], [0.62, 0.6], [0, 1.6]]) {
    M.color(KC_COR.concreto); M.save().move(x, y, -1.1).rotX(Math.PI / 2); M.cyl('concrete', 0.6, 2.2, 20, { caps: '' }); M.restore();
    M.color([0.3, 0.3, 0.3]); M.save().move(x, y, -1.1).rotX(Math.PI / 2); M.cyl('dark', 0.48, 2.2, 20, { caps: '' }); M.restore();
    M.color(KC_COR.concreto);
    for (const z of [-1.1, 1.1]) { M.save().move(x, y, z).rotX(Math.PI / 2).move(0, -0.01, 0); M.lathe('concrete', [[0.48, 0], [0.6, 0], [0.6, 0.02], [0.48, 0.02]], 20); M.restore(); }
  }
  M.col(-1.22, 1.22, 0, 1.2, -1.1, 1.1, 'concrete'); M.col(-0.6, 0.6, 1.2, 2.2, -1.1, 1.1, 'concrete');
});

// prateleira de galpão com caixas, 3 x 3 x 1,2 m
PF.kcPrateleira = () => prefab('kcPrateleira', (M) => {
  const R = rngOf(31); M.local(1);
  M.color([0.2, 0.32, 0.58]); for (const x of [-1.5, 1.5]) for (const z of [-0.55, 0.55]) M.boxB('paint', x - 0.05, x + 0.05, 0, 3, z - 0.05, z + 0.05);
  M.color([0.9, 0.48, 0.12]);
  for (const y of [0.15, 1.1, 2.05]) for (const z of [-0.55, 0.55]) M.boxB('paint', -1.5, 1.5, y, y + 0.1, z - 0.05, z + 0.05);
  for (const y of [0.25, 1.2, 2.15]) for (let i = 0; i < 3; i++) {
    if (R() < 0.15) continue; const x = -1 + i, h = R.range(0.5, 0.8);
    M.color(R() < 0.5 ? [0.66, 0.5, 0.34] : [0.58, 0.44, 0.3]); M.boxB('cardboard', x - 0.42, x + 0.42, y, y + h, -0.45, 0.45);
  }
  M.col(-1.5, 1.5, 0, 3, -0.6, 0.6, 'wood');
});

// quatro tambores de óleo num palete, 1,2 x 1,05 x 1,2 m
PF.kcTambores = () => prefab('kcTambores', (M) => {
  const R = rngOf(37); M.local(1); M.color(KC_COR.madeira);
  for (const z of [-0.5, 0, 0.5]) M.boxB('wood', -0.6, 0.6, 0, 0.1, z - 0.05, z + 0.05);
  M.boxB('wood', -0.6, 0.6, 0.1, 0.14, -0.6, 0.6);
  for (const [x, z] of [[-0.29, -0.29], [0.29, -0.29], [-0.29, 0.29], [0.29, 0.29]]) {
    M.color(R.pick([[0.12, 0.3, 0.55], [0.6, 0.12, 0.1], [0.2, 0.42, 0.22], [0.82, 0.62, 0.12]]));
    M.save().move(x, 0.14, z); M.cyl('paint', 0.28, 0.9, 16); M.restore();
    M.color(KC_COR.ferro); M.cls = 1;
    for (const y of [0.42, 0.74]) { M.save().move(x, 0.14 + y - 0.015, z); M.cyl('steel', 0.29, 0.03, 16, { caps: '' }); M.restore(); }
    M.cls = 0;
  }
  M.col(-0.6, 0.6, 0, 1.04, -0.6, 0.6, 'steel');
});

// pilha de vigas de aço (perfil I), 4 x 0,9 x 1,2 m
PF.kcVigas = () => prefab('kcVigas', (M) => {
  M.local(1); M.color([0.5, 0.28, 0.16]);
  for (const x of [-1.4, 1.4]) M.boxB('wood', x - 0.08, x + 0.08, 0, 0.1, -0.6, 0.6);
  for (let f = 0; f < 3; f++) for (let i = 0; i < 4 - (f ? 1 : 0); i++) {
    const z = -0.45 + i * 0.3 + (f % 2) * 0.15, y = 0.1 + f * 0.27;
    M.color(f % 2 ? [0.44, 0.3, 0.22] : [0.38, 0.36, 0.35]);
    M.boxB('steel', -2, 2, y, y + 0.02, z - 0.12, z + 0.12); M.boxB('steel', -2, 2, y + 0.23, y + 0.25, z - 0.12, z + 0.12); M.boxB('steel', -2, 2, y + 0.02, y + 0.23, z - 0.012, z + 0.012);
  }
  M.col(-2, 2, 0, 0.9, -0.6, 0.6, 'steel');
});

// cerca de tela de arame (alambrado), 3 x 2,2 m: segura gente e bala, mas dá para ver através
PF.kcAlambrado = () => prefab('kcAlambrado', (M) => {
  M.local(1); M.color(KC_COR.ferro);
  for (const x of [-1.5, 1.5]) { M.save().move(x, 0, 0); M.cyl('steel', 0.035, 2.25, 8); M.restore(); }
  M.save().move(-1.5, 2.2, 0).rotZ(-Math.PI / 2); M.cyl('steel', 0.022, 3, 6); M.restore();
  M.color([0.62, 0.64, 0.66]); M.cls = 1;
  for (let i = 0; i <= 30; i++) {
    const x = -1.5 + i * 0.1;
    M.save().move(x, 0.05, 0).rotZ(0.045); M.boxB('steel', -0.004, 0.004, 0, 2.15, -0.004, 0.004); M.restore();
    M.save().move(x, 0.05, 0.006).rotZ(-0.045); M.boxB('steel', -0.004, 0.004, 0, 2.15, -0.004, 0.004); M.restore();
  }
  M.cls = 0;
  M.col(-1.5, 1.5, 0, 2.2, -0.04, 0.04, 'steel');
});

// armário elétrico de rua, 1,6 x 1,6 x 0,8 m
PF.kcArmarioEletrico = () => prefab('kcArmarioEletrico', (M) => {
  M.local(1); M.color([0.62, 0.66, 0.62]);
  M.boxB('paint', -0.7, 0.7, 0.1, 1.6, -0.3, 0.3, { bevel: 0.02 });
  M.color(KC_COR.concretoEsc); M.boxB('concrete', -0.78, 0.78, 0, 0.1, -0.38, 0.38);
  M.color([0.5, 0.54, 0.5]); M.cls = 1; for (const x of [-0.35, 0.35]) M.boxB('paint', x - 0.32, x + 0.32, 0.2, 1.5, 0.3, 0.31);
  M.color(KC_COR.amarelo); M.boxB('paint', -0.12, 0.12, 1.2, 1.4, 0.31, 0.315);
  M.cls = 0;
  M.col(-0.78, 0.78, 0, 1.6, -0.38, 0.38, 'steel');
});
