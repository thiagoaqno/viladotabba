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

/* ---------- pacote 3: favela, casa em obra, casas de concreto e prédio velho ----------
   Casas de tijolo com laje e caixa d'água, sobrado com portão de enrolar, lanchonete, puxadinho, poste, muro com portão;
   inspiradas em modelos CC BY que o Thiago achou (casa em obra, casas de concreto do deserto, prédios velhos), mas feitas aqui.
   As casas térreas dão para entrar (porta de 1,6 m: os bots passam); a laje só se alcança com a Escada do editor. */
Object.assign(KC_COR, {
  tijolo: [0.86, 0.5, 0.36], laje: [0.66, 0.65, 0.62], chapisco: [0.64, 0.63, 0.6], areia: [0.88, 0.79, 0.62],
  azulCaixa: [0.13, 0.33, 0.66], fibro: [0.64, 0.64, 0.62], ferrugem: [0.56, 0.4, 0.3], pilar: [0.93, 0.72, 0.22],
  portao: [0.74, 0.17, 0.13], folha: [0.27, 0.48, 0.2], predio: [0.8, 0.75, 0.66], telha: [0.36, 0.37, 0.4],
});
// fotos que estas peças pedem num mapa do editor (o texturas.js carrega junto)
const KC_TEX_PECAS = {};
const kcTex = (nomes, packs) => { for (const n of nomes) KC_TEX_PECAS[n] = packs; };
kcTex(['kcCasaTijolo', 'kcCasaTelhado', 'kcSobrado', 'kcCasaObra', 'kcLanchonete', 'kcPortaoGaragem', 'kcMuroPortao'], ['brick', 'plaster2']);
kcTex(['kcCasaConcreto', 'kcCasaConcreto2'], ['plaster2']);
kcTex(['kcPredioVelho'], ['plaster2', 'rooftiles']);

// caixa num eixo: eixo 'x' = parede que corre em x (a = x, d = z); 'z' = parede que corre em z (a = z, d = x)
function kcB(M, mat, eixo, a0, a1, b0, b1, d0, d1) {
  const [p, q] = d0 < d1 ? [d0, d1] : [d1, d0];
  if (eixo === 'x') M.boxB(mat, a0, a1, b0, b1, p, q); else M.boxB(mat, p, q, b0, b1, a0, a1);
}
// parede com buracos [a0, a1, b0, b1] (portas e janelas), com colisão em cada pedaço
function kcParede(M, mat, eixo, d0, d1, a0, a1, y0, y1, buracos = [], kind = 'concrete') {
  const put = (p0, p1, b0, b1) => {
    if (p1 - p0 < 0.01 || b1 - b0 < 0.01) return;
    kcB(M, mat, eixo, p0, p1, b0, b1, d0, d1);
    if (eixo === 'x') M.col(p0, p1, b0, b1, d0, d1, kind); else M.col(d0, d1, b0, b1, p0, p1, kind);
  };
  let a = a0;
  for (const [h0, h1, b0, b1] of buracos.slice().sort((p, q) => p[0] - q[0])) { put(a, h0, y0, y1); put(h0, h1, y0, b0); put(h0, h1, b1, y1); a = h1; }
  put(a, a1, y0, y1);
}
// grade de ferro numa janela aberta (a bala passa, a gente não)
function kcGrade(M, eixo, d, a0, a1, b0, b1) {
  M.save().color(KC_COR.ferro); const c = M.cls; M.cls = 1;
  const n = Math.max(2, Math.round((a1 - a0) / 0.13));
  for (let i = 1; i < n; i++) { const a = a0 + (i / n) * (a1 - a0); kcB(M, 'steel', eixo, a - 0.012, a + 0.012, b0, b1, d - 0.012, d + 0.012); }
  kcB(M, 'steel', eixo, a0, a1, (b0 + b1) / 2 - 0.012, (b0 + b1) / 2 + 0.012, d - 0.015, d + 0.015);
  M.cls = c; M.restore();
  if (eixo === 'x') M.col(a0, a1, b0, b1, d - 0.03, d + 0.03, 'steel'); else M.col(d - 0.03, d + 0.03, b0, b1, a0, a1, 'steel');
}
// janela de fachada fechada (prédio sem miolo): peitoril, moldura, vidro escuro, cruzeta e venezianas abertas. s: para onde a fachada olha
function kcJanela(M, eixo, d, s, a0, a1, b0, b1, cor = [0.32, 0.42, 0.3]) {
  const c = M.cls; M.cls = 1; M.save();
  const w = a1 - a0, am = (a0 + a1) / 2, bm = (b0 + b1) / 2;
  M.color([0.08, 0.1, 0.12]); kcB(M, 'glass', eixo, a0, a1, b0, b1, d, d + s * 0.01);
  M.color(KC_COR.branco);
  for (const [p, q, r, t] of [[a0 - 0.06, a0, b0, b1], [a1, a1 + 0.06, b0, b1], [a0 - 0.06, a1 + 0.06, b1, b1 + 0.06], [am - 0.025, am + 0.025, b0, b1], [a0, a1, bm - 0.025, bm + 0.025]])
    kcB(M, 'paint', eixo, p, q, r, t, d, d + s * 0.05);
  M.color(KC_COR.laje); kcB(M, 'concrete', eixo, a0 - 0.1, a1 + 0.1, b0 - 0.08, b0, d, d + s * 0.1);
  M.color(cor);
  for (const sd of [-1, 1]) { const p = sd < 0 ? a0 - 0.06 - w / 2 : a1 + 0.06; kcB(M, 'paintwood', eixo, p, p + w / 2, b0, b1, d + s * 0.01, d + s * 0.04); }
  M.restore(); M.cls = c;
}
// caixa d'água azul de 1000 litros
function kcCaixaAgua(M, x, y, z) {
  M.save().move(x, y, z).color(KC_COR.azulCaixa);
  M.lathe('plastic', [[0, 0], [0.5, 0], [0.54, 0.05], [0.66, 0.76], [0.69, 0.8]], 20);
  M.save().move(0, 0.79, 0); M.lathe('plastic', [[0.73, 0], [0.71, 0.06], [0.3, 0.18], [0.12, 0.22], [0, 0.23]], 20); M.restore();
  M.restore();
  M.col(x - 0.66, x + 0.66, y, y + 1.0, z - 0.66, z + 0.66, 'steel');
}
// ferros de espera saindo da laje (ninguém termina a obra)
function kcFerros(M, x, y, z, h = 0.7) {
  M.save().color([0.38, 0.24, 0.17]); const c = M.cls; M.cls = 1;
  for (let i = 0; i < 4; i++) { const dx = ((i & 1) - 0.5) * 0.14, dz = ((i >> 1) - 0.5) * 0.14; M.save().move(x + dx, y, z + dz).rotZ(dx * 0.5).rotX(dz * 0.4); M.cyl('steel', 0.008, h + (i % 3) * 0.1, 5); M.restore(); }
  M.cls = c; M.restore();
}
// ar-condicionado de janela: costas em z = 0, frente para +z
function kcAr(M, x, y, z, rot = 0) {
  M.save().move(x, y, z).rotY(rot).local(1); const c = M.cls; M.cls = 1;
  M.color(KC_COR.branco); M.boxB('paint', -0.4, 0.4, 0, 0.5, 0, 0.3, { bevel: 0.02 });
  M.color([0.2, 0.21, 0.22]); for (let i = 0; i < 6; i++) M.boxB('dark', -0.36, 0.36, 0.06 + i * 0.065, 0.09 + i * 0.065, 0.3, 0.305);
  M.color(KC_COR.ferro); for (const sx of [-0.3, 0.3]) M.boxB('steel', sx - 0.02, sx + 0.02, -0.05, 0, 0, 0.34);
  M.color([0.25, 0.25, 0.26]); M.tube('rubber', 0.012, [[0.38, 0.05, 0.15], [0.42, -0.1, 0.15], [0.42, -0.5, 0.1]], 5);
  M.cls = c; M.restore();
}
// antena parabólica num suporte, virada para +z
function kcAntenaF(M, x, y, z, rot = 0) {
  M.save().move(x, y, z).rotY(rot).local(1); const c = M.cls; M.cls = 1;
  M.color(KC_COR.ferro); M.cyl('steel', 0.02, 0.5, 6); M.boxB('steel', -0.03, 0.03, 0.3, 0.34, -0.2, 0);
  M.color([0.88, 0.88, 0.86]); M.save().move(0, 0.5, 0.05).rotX(1.1); M.lathe('paint', [[0, 0], [0.18, 0.02], [0.3, 0.07], [0.31, 0.08]], 16); M.lathe('paint', [[0.31, 0.075], [0.3, 0.065], [0.18, 0.015], [0, -0.005]], 16); M.restore();
  M.color(KC_COR.ferro); M.tube('steel', 0.01, [[0, 0.42, 0.1], [0, 0.62, 0.38]], 4); M.save().move(0, 0.6, 0.38); M.cyl('plastic', 0.035, 0.08, 8); M.restore();
  M.cls = c; M.restore();
}

// casa de tijolo térrea, 5 x 5 m: porta de 1,6 m na frente (+z), janelas com grade; laje com caixa d'água ou telhado de fibrocimento
function kcCasa(M, telhado) {
  const X = 2.5, Z = 2.5, H = 2.8, t = 0.15, J0 = 1.0, J1 = 2.0;
  M.local(1); M.color(KC_COR.tijolo);
  kcParede(M, 'brick', 'x', Z - t, Z, -X, X, 0, H, [[-0.2, 1.4, 0, 2.15], [-2.0, -0.9, J0, J1]]);
  kcParede(M, 'brick', 'x', -Z, -Z + t, -X, X, 0, H, [[-0.6, 0.6, J0, J1]]);
  kcParede(M, 'brick', 'z', -X, -X + t, -Z + t, Z - t, 0, H, [[-0.6, 0.6, J0, J1]]);
  kcParede(M, 'brick', 'z', X - t, X, -Z + t, Z - t, 0, H, [[0.6, 1.6, J0, J1]]);
  kcGrade(M, 'x', Z - t / 2, -2.0, -0.9, J0, J1); kcGrade(M, 'x', -Z + t / 2, -0.6, 0.6, J0, J1);
  kcGrade(M, 'z', -X + t / 2, -0.6, 0.6, J0, J1); kcGrade(M, 'z', X - t / 2, 0.6, 1.6, J0, J1);
  M.cls = 1;
  // reboco começado (chapisco cinza embaixo, na frente) e vergas de concreto
  M.color(KC_COR.chapisco); M.boxB('plaster2', -X - 0.01, -0.2, 0, 0.9, Z, Z + 0.015); M.boxB('plaster2', 1.4, X + 0.01, 0, 0.9, Z, Z + 0.015);
  M.color(KC_COR.laje); M.boxB('concrete', -0.35, 1.55, 2.15, 2.3, Z, Z + 0.02); M.boxB('concrete', -2.1, -0.8, J1, J1 + 0.12, Z, Z + 0.02);
  // porta de ferro aberta para dentro, encostada na parede
  M.color([0.3, 0.34, 0.36]); M.boxB('paint', 1.4, 1.45, 0, 2.1, Z - t - 1.55, Z - t);
  // chão de cimento e o relógio de luz
  M.color(KC_COR.laje); M.boxB('concrete', -X + t, X - t, 0, 0.02, -Z + t, Z - t);
  M.color([0.85, 0.85, 0.82]); M.boxB('plastic', 1.7, 2.1, 1.4, 1.85, Z, Z + 0.12);
  M.cls = 0;
  kcAr(M, X, 2.0, -1.3, Math.PI / 2);
  if (!telhado) {
    M.color(KC_COR.laje); M.boxB('concrete', -X - 0.1, X + 0.1, H, H + 0.15, -Z - 0.1, Z + 0.1);
    M.col(-X - 0.1, X + 0.1, H, H + 0.15, -Z - 0.1, Z + 0.1, 'concrete');
    for (const [x, z] of [[-X + 0.12, -Z + 0.12], [X - 0.12, -Z + 0.12], [X - 0.12, Z - 0.12], [-X + 0.12, Z - 0.12]]) kcFerros(M, x, H + 0.15, z);
    kcCaixaAgua(M, -1.5, H + 0.15, -1.5);
    kcAntenaF(M, 1.8, H + 0.15, -2.2, 0.4);
    return;
  }
  // telhado de fibrocimento caindo para trás, em caibros de madeira; tijolos soltos segurando as telhas
  const yf = H + 0.32, yb = H + 0.06, L = 2 * Z + 0.6, a = Math.atan2(yf - yb, L);
  M.color(KC_COR.tijolo); M.boxB('brick', -X, X, H, H + 0.28, Z - t, Z); M.col(-X, X, H, H + 0.28, Z - t, Z, 'concrete');
  M.color([0.45, 0.32, 0.22]); for (const x of [-2.3, 0, 2.3]) { M.save().move(x, (yf + yb) / 2 - 0.08, 0).rotX(-a); M.boxB('wood', -0.04, 0.04, 0, 0.08, -L / 2, L / 2); M.restore(); }
  M.color(KC_COR.fibro); M.save().move(0, (yf + yb) / 2, 0).rotX(-a); M.boxB('corrugated', -X - 0.25, X + 0.25, 0, 0.03, -L / 2, L / 2); M.restore();
  M.color(KC_COR.tijolo); M.cls = 1;
  for (const [x, z] of [[-1.6, 1.8], [-1.5, 1.8], [0.9, -0.4], [2.2, 2.4], [-2.3, -2.1]]) M.boxB('brick', x - 0.1, x + 0.1, yb + (z + Z) / L * (yf - yb) + 0.02, yb + (z + Z) / L * (yf - yb) + 0.11, z - 0.05, z + 0.05);
  M.cls = 0;
  M.col(-X - 0.25, X + 0.25, H, yf + 0.05, -Z - 0.3, Z + 0.3, 'steel');
}
PF.kcCasaTijolo = () => prefab('kcCasaTijolo', (M) => kcCasa(M, false));
PF.kcCasaTelhado = () => prefab('kcCasaTelhado', (M) => kcCasa(M, true));

// sobrado de tijolo fechado, 6 x 5 m: dois portões de enrolar vermelhos embaixo, janelas em cima, laje com mureta e caixa d'água
PF.kcSobrado = () => prefab('kcSobrado', (M) => {
  const X = 3, Z = 2.5, H1 = 2.9, H2 = 5.6;
  M.local(1); M.color(KC_COR.tijolo);
  M.boxB('brick', -X, X, 0, H2, -Z, Z); M.col(-X, X, 0, H2, -Z, Z, 'concrete');
  M.color(KC_COR.laje); M.boxB('concrete', -X - 0.03, X + 0.03, H1, H1 + 0.18, -Z - 0.03, Z + 0.03);
  M.boxB('concrete', -X - 0.1, X + 0.1, H2, H2 + 0.15, -Z - 0.1, Z + 0.1); M.col(-X - 0.1, X + 0.1, H2, H2 + 0.15, -Z - 0.1, Z + 0.1, 'concrete');
  M.cls = 1;
  // térreo: pilares pintados de amarelo, dois portões de enrolar e a caixa do rolo
  M.color(KC_COR.pilar); for (const [a, b] of [[-X - 0.01, -2.72], [-0.16, 0.16], [2.72, X + 0.01]]) M.boxB('paint', a, b, 0, H1, Z, Z + 0.03);
  M.color(KC_COR.portao); for (const [a, b] of [[-2.7, -0.18], [0.18, 2.7]]) M.boxB('rollshutter', a, b, 0, 2.45, Z, Z + 0.04);
  M.color([0.4, 0.4, 0.42]); for (const [a, b] of [[-2.7, -0.18], [0.18, 2.7]]) M.boxB('steel', a, b, 2.45, 2.7, Z, Z + 0.14);
  M.color(KC_COR.chapisco); M.boxB('plaster2', -X - 0.01, X + 0.01, 0, 0.5, -Z - 0.015, -Z);
  M.cls = 0;
  // andar de cima: janelas, ar-condicionado, antena, cano de água pela quina
  for (const [a, b] of [[-2.2, -0.9], [0.9, 2.2]]) kcJanela(M, 'x', Z, 1, a, b, 3.9, 5.0);
  kcJanela(M, 'x', -Z, -1, -0.6, 0.6, 3.9, 5.0);
  for (const sd of [-1, 1]) kcJanela(M, 'z', sd * X, sd, -0.6, 0.6, 3.9, 5.0);
  kcAr(M, 0, 4.0, Z, 0);
  M.color([0.85, 0.85, 0.83]); M.cls = 1; M.tube('plastic', 0.05, [[X + 0.08, H2, Z - 0.3], [X + 0.08, 0.1, Z - 0.3], [X + 0.25, 0.05, Z - 0.3]], 8); M.cls = 0;
  // laje: mureta de tijolo, ferros de espera, caixa d'água, antena
  M.color(KC_COR.tijolo); const y = H2 + 0.15, m = 0.5, t = 0.12;
  for (const [x0, x1, z0, z1] of [[-X, X, Z - t, Z], [-X, X, -Z, -Z + t], [-X, -X + t, -Z + t, Z - t], [X - t, X, -Z + t, Z - t]]) { M.boxB('brick', x0, x1, y, y + m, z0, z1); M.col(x0, x1, y, y + m, z0, z1, 'concrete'); }
  for (const x of [-X + 0.06, X - 0.06]) for (const z of [-Z + 0.06, Z - 0.06]) kcFerros(M, x, y + m, z, 0.6);
  kcCaixaAgua(M, 1.8, y, -1.4);
  kcAntenaF(M, -2.4, y, 1.6, 0.5);
});

// casa em obra, 6 x 5,6 m: pilares e vigas de concreto, térreo de tijolo com vãos sem acabamento, laje do primeiro andar e as paredes de cima pela metade
PF.kcCasaObra = () => prefab('kcCasaObra', (M) => {
  const X = 3, Z = 2.8, H = 2.8, t = 0.14, P = 0.13;
  M.local(1);
  // térreo
  M.color(KC_COR.tijolo);
  kcParede(M, 'brick', 'x', Z - t, Z, -X, X, 0, H, [[-2.4, -0.8, 0, 2.2], [0.6, 2.2, 0.9, 2.0]]);
  kcParede(M, 'brick', 'x', -Z, -Z + t, -X, X, 0, H, [[-1.6, -0.4, 1.0, 2.0], [1.0, 2.6, 0, 2.2]]);
  kcParede(M, 'brick', 'z', -X, -X + t, -Z + t, Z - t, 0, H, [[-1.2, 0.2, 0.9, 2.0]]);
  kcParede(M, 'brick', 'z', X - t, X, -Z + t, Z - t, 0, H, [[-0.5, 0.9, 0.9, 2.0]]);
  // pilares, vigas e laje
  M.color(KC_COR.laje);
  const pil = [[-X, -Z], [0, -Z], [X, -Z], [-X, Z], [0, Z], [X, Z]];
  for (const [x, z] of pil) { const x0 = Math.max(-X, x - P), x1 = Math.min(X, x + P), z0 = Math.max(-Z, z - P), z1 = Math.min(Z, z + P); M.boxB('concrete', x0 - 0.01, x1 + 0.01, 0, H, z0 - 0.01, z1 + 0.01); }
  M.boxB('concrete', -X - 0.02, X + 0.02, H - 0.25, H, Z - t - 0.02, Z + 0.02); M.boxB('concrete', -X - 0.02, X + 0.02, H - 0.25, H, -Z - 0.02, -Z + t + 0.02);
  M.boxB('concrete', -X - 0.15, X + 0.15, H, H + 0.14, -Z - 0.15, Z + 0.15); M.col(-X - 0.15, X + 0.15, H, H + 0.14, -Z - 0.15, Z + 0.15, 'concrete');
  // em cima: pilares mais altos com ferros, paredes começadas (a última fiada torta)
  const y = H + 0.14, R = rngOf(33);
  for (const [x, z] of pil) {
    const x0 = Math.max(-X, x - P), x1 = Math.min(X, x + P), z0 = Math.max(-Z, z - P), z1 = Math.min(Z, z + P), h = R.range(1.4, 2.6);
    M.color(KC_COR.laje); M.boxB('concrete', x0, x1, y, y + h, z0, z1); M.col(x0, x1, y, y + h, z0, z1, 'concrete');
    kcFerros(M, (x0 + x1) / 2, y + h, (z0 + z1) / 2, 0.8);
  }
  M.color(KC_COR.tijolo);
  const meia = (eixo, d0, d1, a0, a1) => {
    const n = Math.round((a1 - a0) / 0.4);
    for (let i = 0; i < n; i++) { const p = a0 + (i / n) * (a1 - a0), q = a0 + ((i + 1) / n) * (a1 - a0), h = 0.6 + Math.floor(R.range(0, 5)) * 0.2;
      kcB(M, 'brick', eixo, p, q, y, y + h, d0, d1); if (eixo === 'x') M.col(p, q, y, y + h, d0, d1, 'concrete'); else M.col(d0, d1, y, y + h, p, q, 'concrete'); }
  };
  meia('x', -Z, -Z + t, -X + P, -P); meia('x', -Z, -Z + t, P, X - P); meia('z', -X, -X + t, -Z + P, Z - P);
  // tijolos empilhados e monte de areia no chão de dentro, carrinho de mão
  M.color(KC_COR.tijolo); M.boxB('brick', -2.4, -1.5, 0, 0.6, -2.3, -1.6); M.col(-2.4, -1.5, 0, 0.6, -2.3, -1.6, 'concrete');
  M.color(KC_COR.areia); M.cls = 1; M.save().move(1.6, 0, -1.4); M.lathe('dirt', [[0.9, 0], [0.6, 0.25], [0.2, 0.42], [0, 0.45]], 14); M.restore();
  M.color([0.3, 0.45, 0.55]); M.save().move(-1.8, 0, 1.4).rotY(0.5); M.boxB('steel', -0.3, 0.3, 0.25, 0.55, -0.4, 0.35, { bevel: 0.05 }); M.color([0.1, 0.1, 0.1]); M.save().move(0, 0.18, 0.5).rotZ(Math.PI / 2); M.cyl('rubber', 0.18, 0.08, 12); M.restore(); M.restore();
  M.cls = 0;
});

// casa de concreto (reboco cor de areia), 5,5 x 5 m: porta de 1,5 m, janelinhas com verga de madeira, laje com platibanda e vigas de madeira para fora
function kcCasaAreia(M, alta) {
  const X = 2.75, Z = 2.5, H = 3.0, t = 0.2;
  M.local(1); M.color(KC_COR.areia);
  kcParede(M, 'plaster2', 'x', Z - t, Z, -X, X, 0, H, [[-0.75, 0.75, 0, 2.2]]);
  kcParede(M, 'plaster2', 'x', -Z, -Z + t, -X, X, 0, H, [[-1.6, -0.9, 1.4, 2.1], [0.9, 1.6, 1.4, 2.1]]);
  kcParede(M, 'plaster2', 'z', -X, -X + t, -Z + t, Z - t, 0, H, [[-0.35, 0.35, 1.4, 2.1]]);
  kcParede(M, 'plaster2', 'z', X - t, X, -Z + t, Z - t, 0, H, [[-0.35, 0.35, 1.4, 2.1]]);
  M.boxB('plaster2', -X, X, H, H + 0.2, -Z, Z); M.col(-X, X, H, H + 0.2, -Z, Z, 'concrete');
  const y = H + 0.2;
  for (const [x0, x1, z0, z1] of [[-X, X, Z - t, Z], [-X, X, -Z, -Z + t], [-X, -X + t, -Z + t, Z - t], [X - t, X, -Z + t, Z - t]]) { M.boxB('plaster2', x0, x1, y, y + 0.5, z0, z1); M.col(x0, x1, y, y + 0.5, z0, z1, 'concrete'); }
  M.cls = 1; M.color([0.42, 0.3, 0.2]);
  // vergas de madeira por cima das aberturas, vigas do teto saindo da parede, porta de madeira aberta
  M.boxB('wood', -0.95, 0.95, 2.2, 2.34, Z, Z + 0.06);
  for (const [a, b] of [[-1.7, -0.8], [0.8, 1.7]]) M.boxB('wood', a, b, 2.1, 2.22, -Z - 0.06, -Z);
  for (const s of [-1, 1]) M.boxB('wood', s * X - 0.06 * (s > 0 ? 0 : 1), s * X + 0.06 * (s > 0 ? 1 : 0), 2.1, 2.22, -0.45, 0.45);
  for (let i = 0; i < 6; i++) { const x = -2.2 + i * 0.88; M.save().move(x, H - 0.12, Z - 0.1).rotX(Math.PI / 2); M.cyl('wood', 0.07, 0.45, 8); M.restore(); }
  M.color([0.36, 0.25, 0.16]); M.boxB('wood', -0.8, -0.75, 0, 2.15, Z - t - 1.45, Z - t);
  // gárgula (cano de água) e mancha de escorrido
  M.color([0.55, 0.5, 0.42]); M.save().move(X - 0.6, y + 0.1, Z).rotX(Math.PI / 2); M.cyl('concrete', 0.06, 0.4, 8); M.restore();
  M.color([0.6, 0.53, 0.42]); M.boxB('plaster2', X - 0.75, X - 0.45, 0.3, y, Z, Z + 0.008);
  M.cls = 0;
  if (alta) {
    // segundo volume fechado no fundo, com janela e porta para o terraço
    const x0 = -X, x1 = 0.3, z0 = -Z, z1 = -0.2, y1 = y + 2.7;
    M.color(KC_COR.areia); M.boxB('plaster2', x0, x1, y, y1, z0, z1); M.col(x0, x1, y, y1, z0, z1, 'concrete');
    M.boxB('plaster2', x0 - 0.05, x1 + 0.05, y1, y1 + 0.35, z0 - 0.05, z1 + 0.05); M.col(x0 - 0.05, x1 + 0.05, y1, y1 + 0.35, z0 - 0.05, z1 + 0.05, 'concrete');
    M.cls = 1; M.color([0.36, 0.25, 0.16]); M.boxB('wood', -1.1, -0.2, y, y + 2.0, z1, z1 + 0.04); M.cls = 0;
    kcJanela(M, 'x', z1, 1, -2.3, -1.6, y + 1.0, y + 1.8, [0.5, 0.38, 0.24]);
    kcAr(M, x1, y + 1.2, -1.3, Math.PI / 2);
  }
  kcCaixaAgua(M, alta ? 1.6 : -1.6, y, alta ? -1.4 : -1.4);
}
PF.kcCasaConcreto = () => prefab('kcCasaConcreto', (M) => kcCasaAreia(M, false));
PF.kcCasaConcreto2 = () => prefab('kcCasaConcreto2', (M) => kcCasaAreia(M, true));

// prédio velho de três andares, 8 x 7 m, fechado: loja com porta de enrolar e porta de ferro no térreo, janelas com veneziana,
// sacada no meio, cornijas, telhado de telha escura
PF.kcPredioVelho = () => prefab('kcPredioVelho', (M) => {
  const X = 4, Z = 3.5, H = 9.3;
  M.local(1); M.color(KC_COR.predio);
  M.boxB('plaster2', -X, X, 3.0, H, -Z, Z); M.col(-X, X, 0, H, -Z, Z, 'concrete');
  M.color([0.6, 0.6, 0.58]); M.boxB('concrete', -X, X, 0, 3.0, -Z, Z);
  for (const yc of [3.0, 6.15, H]) M.boxB('concrete', -X - 0.12, X + 0.12, yc - 0.15, yc + 0.08, -Z - 0.12, Z + 0.12);
  M.cls = 1;
  M.color([0.55, 0.57, 0.58]); M.boxB('rollshutter', -3.5, -0.6, 0, 2.6, Z, Z + 0.04);
  M.color([0.3, 0.32, 0.3]); M.boxB('steel', -3.6, -0.5, 2.6, 2.85, Z, Z + 0.15);
  M.color([0.42, 0.46, 0.48]); M.boxB('paint', 0.6, 1.6, 0, 2.2, Z, Z + 0.04); M.color(KC_COR.ferro); M.boxB('steel', 1.45, 1.5, 1.0, 1.15, Z + 0.04, Z + 0.08);
  M.color([0.82, 0.2, 0.15]); M.boxB('paint', -3.4, -0.7, 2.88, 2.98, Z + 0.12, Z + 0.14);
  M.cls = 0;
  kcJanela(M, 'x', Z, 1, 2.3, 3.4, 1.0, 2.3);
  for (const y0 of [3.6, 6.8]) {
    for (const a of [-2.8, 0, 2.8]) kcJanela(M, 'x', Z, 1, a - 0.5, a + 0.5, y0, y0 + 1.6);
    for (const a of [-2.2, 2.2]) kcJanela(M, 'x', -Z, -1, a - 0.5, a + 0.5, y0, y0 + 1.6);
    for (const s of [-1, 1]) for (const a of [-1.6, 1.6]) kcJanela(M, 'z', s * X, s, a - 0.5, a + 0.5, y0, y0 + 1.6);
  }
  // sacada do primeiro andar
  M.color(KC_COR.laje); M.boxB('concrete', -0.9, 0.9, 3.42, 3.55, Z, Z + 0.7); M.col(-0.9, 0.9, 3.42, 3.55, Z, Z + 0.7, 'concrete');
  M.color(KC_COR.ferro); M.cls = 1;
  M.boxB('steel', -0.9, 0.9, 4.45, 4.5, Z + 0.66, Z + 0.7); for (const s of [-1, 1]) M.boxB('steel', s * 0.9 - 0.025, s * 0.9 + 0.025, 4.45, 4.5, Z, Z + 0.7);
  for (let i = 0; i <= 12; i++) { const x = -0.9 + i * 0.15; M.boxB('steel', x - 0.01, x + 0.01, 3.55, 4.45, Z + 0.67, Z + 0.69); }
  for (const s of [-1, 1]) for (let i = 1; i < 5; i++) M.boxB('steel', s * 0.9 - 0.01, s * 0.9 + 0.01, 3.55, 4.45, Z + i * 0.14 - 0.01, Z + i * 0.14 + 0.01);
  M.cls = 0;
  kcAr(M, 2.8, 5.4, Z, 0); kcAr(M, -2.2, 8.5, -Z, Math.PI);
  // telhado: duas águas de telha escura, empena de reboco dos lados
  const yr = H + 0.08, hr = 2.0, a = Math.atan2(hr, Z), L = Math.hypot(Z, hr) + 0.35;
  M.color(KC_COR.predio); M.save().move(0, yr, 0).rotY(Math.PI / 2).move(0, 0, -X); M.extrude('plaster2', [[-Z, 0], [Z, 0], [0, hr]], 2 * X); M.restore();
  M.color(KC_COR.telha);
  M.save().move(0, yr + hr, 0).rotX(a); M.boxB('rooftiles', -X - 0.3, X + 0.3, 0, 0.08, 0, L); M.restore();
  M.save().move(0, yr + hr, 0).rotX(-a); M.boxB('rooftiles', -X - 0.3, X + 0.3, 0, 0.08, -L, 0); M.restore();
  M.color([0.25, 0.25, 0.27]); M.save().move(-X - 0.3, yr + hr + 0.02, 0).rotZ(-Math.PI / 2); M.cyl('steel', 0.07, 2 * X + 0.6, 8); M.restore();
  M.col(-X - 0.3, X + 0.3, yr, yr + hr, -Z - 0.3, Z + 0.3, 'concrete');
  M.color([0.55, 0.32, 0.25]); M.boxB('brick', 1.6, 2.3, yr + 0.6, yr + 2.6, -1.0, -0.4); // chaminé
});

// lanchonete de esquina, 4,4 x 3,6 m: balcão aberto na frente, placa amarela, toldo listrado, porta do lado
PF.kcLanchonete = () => prefab('kcLanchonete', (M) => {
  const X = 2.2, Z = 1.8, H = 2.8, t = 0.15;
  M.local(1); M.color(KC_COR.tijolo);
  kcParede(M, 'brick', 'x', -Z, -Z + t, -X, X, 0, H);
  kcParede(M, 'brick', 'z', -X, -X + t, -Z + t, Z, 0, H, [[-0.75, 0.75, 0, 2.15]]);
  kcParede(M, 'brick', 'z', X - t, X, -Z + t, Z, 0, H);
  M.color(KC_COR.pilar); kcParede(M, 'plaster2', 'x', Z - t, Z, -X + t, X - t, 0, H, [[-X + t + 0.1, X - t - 0.1, 1.05, 2.3]]);
  M.color([0.75, 0.76, 0.78]); M.boxB('steel', -X + t, X - t, 1.05, 1.09, Z - 0.35, Z + 0.12); M.col(-X + t, X - t, 1.05, 1.09, Z - 0.35, Z + 0.12, 'steel');
  M.color(KC_COR.laje); M.boxB('concrete', -X - 0.1, X + 0.1, H, H + 0.15, -Z - 0.1, Z + 0.1); M.col(-X - 0.1, X + 0.1, H, H + 0.15, -Z - 0.1, Z + 0.1, 'concrete');
  // placa: fundo amarelo, faixa vermelha, um lanche desenhado de blocos
  M.cls = 1;
  M.color([0.97, 0.82, 0.12]); M.boxB('paint', -X - 0.1, X + 0.1, 2.3, 3.3, Z + 0.02, Z + 0.08);
  M.color([0.82, 0.12, 0.1]); M.boxB('paint', -X + 0.1, X - 0.1, 2.85, 3.15, Z + 0.08, Z + 0.09);
  M.color(KC_COR.branco); for (let i = 0; i < 9; i++) M.boxB('paint', -1.9 + i * 0.42, -1.65 + i * 0.42, 2.92, 3.08, Z + 0.09, Z + 0.095);
  M.color([0.85, 0.55, 0.22]); M.boxB('paint', -0.6, 0.6, 2.42, 2.52, Z + 0.08, Z + 0.09); M.color([0.75, 0.15, 0.1]); M.boxB('paint', -0.55, 0.55, 2.52, 2.57, Z + 0.08, Z + 0.09);
  M.color([0.85, 0.55, 0.22]); M.boxB('paint', -0.6, 0.6, 2.57, 2.72, Z + 0.08, Z + 0.09);
  // toldo listrado vermelho e branco
  const a = 0.35, L = 0.9;
  for (let i = 0; i < 11; i++) { const x0 = -X + i * (2 * X / 11); M.color(i % 2 ? KC_COR.branco : [0.8, 0.12, 0.1]);
    M.save().move(0, 2.28, Z + 0.08).rotX(a); M.boxB('canvas', x0, x0 + 2 * X / 11, -0.02, 0, 0, L); M.restore(); }
  // dentro: prateleira com garrafas, geladeira, chapa
  M.color([0.5, 0.36, 0.24]); M.boxB('wood', -1.8, 0.6, 1.5, 1.54, -Z + t, -Z + t + 0.3); M.boxB('wood', -1.8, 0.6, 1.95, 1.99, -Z + t, -Z + t + 0.3);
  const R = rngOf(5); for (let i = 0; i < 14; i++) { M.color(R.pick([[0.1, 0.32, 0.14], [0.35, 0.12, 0.08], [0.85, 0.78, 0.55], [0.9, 0.9, 0.88]])); M.save().move(-1.7 + (i % 7) * 0.33, i < 7 ? 1.54 : 1.99, -Z + t + 0.15); M.cyl('glass', 0.035, 0.28, 8); M.restore(); }
  M.color([0.25, 0.26, 0.28]); M.boxB('steel', 0.8, 1.9, 0.9, 0.95, -Z + t, -Z + t + 0.6);
  M.cls = 0;
  M.color([0.92, 0.92, 0.9]); M.boxB('paint', 1.25, 1.95, 0, 1.9, -0.3, 0.4, { bevel: 0.03 }); M.col(1.25, 1.95, 0, 1.9, -0.3, 0.4, 'steel');
  M.color([0.8, 0.15, 0.12]); M.cls = 1; M.boxB('paint', 1.24, 1.26, 1.2, 1.7, -0.2, 0.3); M.cls = 0;
  kcCaixaAgua(M, -1.3, H + 0.15, -0.8);
});

// parede de garagem, 3,4 m: portão de enrolar vermelho, pilares amarelos
PF.kcPortaoGaragem = () => prefab('kcPortaoGaragem', (M) => {
  M.local(1); M.color(KC_COR.tijolo); M.boxB('brick', -1.7, 1.7, 0, 2.9, -0.2, 0); M.col(-1.7, 1.7, 0, 2.9, -0.2, 0.05, 'concrete');
  M.cls = 1;
  M.color(KC_COR.pilar); for (const [a, b] of [[-1.7, -1.4], [1.4, 1.7]]) M.boxB('paint', a, b, 0, 2.9, 0, 0.03);
  M.color(KC_COR.portao); M.boxB('rollshutter', -1.38, 1.38, 0, 2.45, 0, 0.04);
  M.color([0.4, 0.4, 0.42]); M.boxB('steel', -1.4, 1.4, 2.45, 2.72, 0, 0.16);
  M.color(KC_COR.ferro); M.boxB('steel', -0.15, 0.15, 0.08, 0.14, 0.04, 0.07);
  M.cls = 0;
});

// muro chapiscado de 6 m com portão de ferro aberto (vão de 1,6 m), pilares e tijolos aparecendo
PF.kcMuroPortao = () => prefab('kcMuroPortao', (M) => {
  M.local(1); M.color(KC_COR.chapisco);
  kcParede(M, 'plaster2', 'x', -0.075, 0.075, -3, 3, 0, 2.2, [[0.6, 2.2, 0, 2.2]]);
  M.color(KC_COR.laje); for (const x of [-3, 0.6, 2.2, 3]) { const a = Math.max(-3, x - 0.15), b = Math.min(3, x + 0.15); M.boxB('concrete', a - 0.02, b + 0.02, 0, 2.35, -0.15, 0.15); M.col(a, b, 0, 2.35, -0.15, 0.15, 'concrete'); }
  M.cls = 1;
  M.color(KC_COR.tijolo); for (const [a, b, y0, y1] of [[-2.4, -1.5, 0.6, 1.2], [-0.6, 0.2, 1.4, 2.0], [2.4, 2.8, 0.3, 0.9]]) M.boxB('brick', a, b, y0, y1, 0.075, 0.08);
  M.color([0.25, 0.26, 0.27]); M.boxB('dark', -2.9, 0.45, 0, 0.25, 0.075, 0.078);
  // portão de grade aberto para dentro (-z)
  M.color([0.2, 0.36, 0.3]); M.save().move(2.05, 0, -0.15);
  M.boxB('steel', -0.03, 0.03, 0.05, 2.0, -1.55, 0); M.boxB('steel', -0.03, 0.03, 0.05, 0.1, -1.55, 0); M.boxB('steel', -0.03, 0.03, 1.95, 2.0, -1.55, 0);
  for (let i = 0; i <= 10; i++) M.boxB('steel', -0.01, 0.01, 0.1, 1.95, -0.05 - i * 0.145, -0.03 - i * 0.145);
  M.restore();
  M.cls = 0;
  M.col(1.98, 2.12, 0, 2.0, -1.72, -0.15, 'steel');
});

// puxadinho: telhado de zinco enferrujado em quatro esteios, 3,4 x 2,6 m
PF.kcPuxadinho = () => prefab('kcPuxadinho', (M) => {
  M.local(1); M.color([0.5, 0.36, 0.24]);
  const yf = 2.35, yb = 2.7;
  for (const x of [-1.6, 1.6]) for (const [z, h] of [[-1.2, yb], [1.2, yf]]) { M.boxB('wood', x - 0.06, x + 0.06, 0, h, z - 0.06, z + 0.06); M.col(x - 0.06, x + 0.06, 0, h, z - 0.06, z + 0.06, 'wood'); }
  const L = 2.8, a = Math.atan2(yb - yf, 2.4);
  M.save().move(0, (yf + yb) / 2, 0).rotX(a); M.boxB('wood', -1.75, 1.75, 0, 0.08, -1.3, -1.2); M.boxB('wood', -1.75, 1.75, 0, 0.08, 1.2, 1.3);
  M.color(KC_COR.ferrugem); M.boxB('corrugated', -1.85, 1.85, 0.08, 0.1, -L / 2, L / 2); M.restore();
  M.color(KC_COR.tijolo); M.cls = 1; for (const [x, z] of [[-1.0, 0.4], [0.7, -0.6], [1.5, 1.1]]) M.boxB('brick', x - 0.1, x + 0.1, (yf + yb) / 2 - z * Math.tan(a) + 0.1, (yf + yb) / 2 - z * Math.tan(a) + 0.19, z - 0.05, z + 0.05); M.cls = 0;
  M.col(-1.85, 1.85, yf, yb + 0.15, -L / 2, L / 2, 'steel');
});

PF.kcCaixaDagua = () => prefab('kcCaixaDagua', (M) => { M.local(1); kcCaixaAgua(M, 0, 0, 0); });

// poste de concreto de 9 m: cruzeta com isoladores, transformador, luminária, rolo de fio
PF.kcPoste = () => prefab('kcPoste', (M) => {
  M.local(1); M.color(KC_COR.concreto);
  M.save().rotY(Math.PI / 4); M.cyl('concrete', 0.2, 9, 4, { r1: 0.11 }); M.restore();
  M.color([0.42, 0.3, 0.2]); M.boxB('wood', -1.0, 1.0, 8.3, 8.42, -0.06, 0.06);
  M.cls = 1;
  M.color([0.82, 0.82, 0.78]); for (const x of [-0.85, -0.3, 0.3, 0.85]) { M.save().move(x, 8.42, 0); M.cyl('plastic', 0.04, 0.12, 8); M.restore(); }
  M.color([0.55, 0.58, 0.6]); M.save().move(0, 6.5, -0.42); M.cyl('steel', 0.28, 0.9, 14); M.restore(); M.boxB('steel', -0.04, 0.04, 6.85, 6.95, -0.42, -0.1);
  M.color([0.62, 0.62, 0.64]); M.tube('steel', 0.035, [[0, 7.3, 0.1], [0, 7.75, 0.8], [0, 7.8, 1.6]], 6); M.boxB('steel', -0.12, 0.12, 7.7, 7.84, 1.45, 1.9);
  M.color([1, 0.95, 0.8]); M.boxB('lamp', -0.09, 0.09, 7.68, 7.7, 1.5, 1.85);
  M.color([0.08, 0.08, 0.08]); M.save().move(0, 5.0, 0); M.lathe('rubber', [[0.2, 0], [0.26, 0.05], [0.27, 0.2], [0.26, 0.35], [0.2, 0.4]], 12); M.restore();
  for (const s of [-1, 1]) M.tube('rubber', 0.012, [[s * 0.85, 8.5, 0], [s * 0.6, 7.0, 0.02], [s * 0.22, 5.4, 0]], 4);
  M.color([0.95, 0.8, 0.1]); M.boxB('paint', -0.12, 0.12, 2.0, 2.3, 0.13, 0.14);
  M.cls = 0;
  M.col(-0.2, 0.2, 0, 9, -0.2, 0.2, 'concrete');
});

// ar-condicionado sozinho: encoste as costas numa parede (a frente olha +z) e suba com PgUp
PF.kcArCondicionado = () => prefab('kcArCondicionado', (M) => { M.local(1); kcAr(M, 0, 0, 0, 0); M.col(-0.4, 0.4, 0, 0.5, 0, 0.3, 'steel'); });
// antena parabólica sozinha (para pôr na laje ou na mureta)
PF.kcAntena = () => prefab('kcAntena', (M) => { M.local(1); kcAntenaF(M, 0, 0, 0, 0); });

// guarda-sol amarelo e branco com mesa de plástico e duas cadeiras vermelhas
PF.kcGuardaSol = () => prefab('kcGuardaSol', (M) => {
  M.local(1); M.color(KC_COR.branco); M.cyl('steel', 0.025, 2.4, 6);
  for (let i = 0; i < 8; i++) {
    const a0 = (i / 8) * TAU, a1 = ((i + 1) / 8) * TAU; M.color(i % 2 ? KC_COR.branco : [0.98, 0.8, 0.12]);
    M.lathe('canvas', [[0, 2.45], [1.2, 2.1], [1.2, 1.98]], 3, { a0, a1 }); M.lathe('canvas', [[1.19, 1.98], [1.19, 2.09], [0, 2.43]], 3, { a0, a1 });
  }
  M.color(KC_COR.branco); M.save().move(0, 0.7, 0); M.cyl('plastic', 0.45, 0.04, 18); M.restore(); M.cyl('plastic', 0.05, 0.7, 8); M.cyl('plastic', 0.3, 0.03, 12);
  M.col(-0.45, 0.45, 0, 0.74, -0.45, 0.45, 'wood');
  M.color([0.82, 0.12, 0.1]);
  for (const s of [-1, 1]) {
    M.save().move(s * 0.85, 0, 0).rotY(s > 0 ? -Math.PI / 2 : Math.PI / 2);
    M.boxB('plastic', -0.22, 0.22, 0.42, 0.46, -0.22, 0.22); M.boxB('plastic', -0.22, 0.22, 0.46, 0.85, -0.24, -0.2);
    for (const x of [-0.19, 0.19]) for (const z of [-0.19, 0.19]) M.boxB('plastic', x - 0.02, x + 0.02, 0, 0.42, z - 0.02, z + 0.02);
    M.restore();
    M.col(s * 0.85 - 0.24, s * 0.85 + 0.24, 0, 0.5, -0.24, 0.24, 'wood');
  }
});

// bananeira: tronco verde e folhas largas caídas
PF.kcBananeira = () => prefab('kcBananeira', (M) => {
  const R = rngOf(77); M.local(1);
  M.color([0.38, 0.44, 0.24]); M.cyl('wood', 0.13, 1.8, 10, { r1: 0.09 });
  M.cls = 1;
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU + R.range(-0.25, 0.25), inc = R.range(0.45, 1.0), y = 1.65 + R.range(-0.15, 0.15);
    M.color(R() < 0.25 ? [0.5, 0.48, 0.22] : KC_COR.folha);
    M.save().move(0, y, 0).rotY(a).rotX(inc);
    M.boxB('canvas', -0.2, 0.2, 0, 0.8, -0.008, 0.008);
    M.save().move(0, 0.8, 0).rotX(0.5); M.boxB('canvas', -0.18, 0.18, 0, 0.7, -0.008, 0.008); M.restore();
    M.color([0.6, 0.66, 0.35]); M.boxB('canvas', -0.015, 0.015, 0, 0.8, -0.012, 0.012);
    M.restore();
  }
  M.cls = 0;
  M.col(-0.15, 0.15, 0, 1.8, -0.15, 0.15, 'wood');
});

// barraca de feira: mesa de madeira com caixotes de fruta e lona em quatro varas, 2,6 x 2,4 x 1,6 m
function kcBarracaF(M, lona) {
  const R = rngOf(lona[0] * 100 | 0); M.local(1);
  M.color([0.6, 0.45, 0.3]);
  for (const x of [-1.25, 1.25]) for (const z of [-0.75, 0.75]) M.boxB('wood', x - 0.04, x + 0.04, 0, z < 0 ? 2.4 : 2.15, z - 0.04, z + 0.04);
  M.boxB('wood', -1.2, 1.2, 0.8, 0.86, -0.65, 0.65); M.boxB('wood', -1.15, 1.15, 0, 0.8, -0.6, -0.55);
  M.col(-1.2, 1.2, 0, 0.86, -0.65, 0.65, 'wood');
  M.cls = 1;
  const frutas = [[0.95, 0.55, 0.1], [0.85, 0.12, 0.1], [0.95, 0.85, 0.2], [0.35, 0.6, 0.2], [0.5, 0.2, 0.45]];
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
    const x = -0.9 + i * 0.6, z = -0.28 + j * 0.56;
    M.color([0.72, 0.6, 0.42]); M.boxB('crate', x - 0.27, x + 0.27, 0.86, 1.04, z - 0.25, z + 0.25);
    M.color(R.pick(frutas)); M.boxB('plastic', x - 0.24, x + 0.24, 1.0, 1.08, z - 0.22, z + 0.22, { bevel: 0.04 });
  }
  M.color(lona); const a = Math.atan2(0.25, 1.6);
  M.save().move(0, 2.3, 0).rotX(-a); M.boxB('canvas', -1.45, 1.45, 0, 0.02, -0.95, 0.95); M.restore();
  M.color([0.72, 0.6, 0.42]); for (const [x, z] of [[1.6, 0.3], [1.6, -0.3], [1.65, 0]]) M.boxB('crate', x - 0.25, x + 0.25, z === 0 ? 0.36 : 0, z === 0 ? 0.72 : 0.36, z - 0.27, z + 0.27);
  M.cls = 0;
  M.col(1.35, 1.9, 0, 0.72, -0.6, 0.6, 'wood');
}
PF.kcBarraca = () => prefab('kcBarraca', (M) => kcBarracaF(M, [0.95, 0.78, 0.25]));
PF.kcBarracaAzul = () => prefab('kcBarracaAzul', (M) => kcBarracaF(M, [0.22, 0.42, 0.72]));

// árvore num canteiro octogonal de concreto (o canteiro cobre agachado), 4,8 x 6 x 4,8 m
PF.kcArvoreCanteiro = () => prefab('kcArvoreCanteiro', (M) => {
  const R = rngOf(19); M.local(1);
  M.color(KC_COR.laje); M.save().rotY(Math.PI / 8); M.lathe('concrete', [[2.4, 0], [2.4, 0.6], [2.1, 0.6], [2.1, 0.45]], 8, { sharp: 1 }); M.restore();
  M.color([0.32, 0.24, 0.17]); M.save().rotY(Math.PI / 8); M.cyl('concrete', 2.12, 0.46, 8); M.restore();
  M.color([0.36, 0.28, 0.2]);
  M.tube('wood', 0.22, [[0, 0.4, 0], [0.1, 1.6, 0.05], [0.05, 2.8, -0.1]], 10);
  const pontas = [];
  for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + R.range(-0.3, 0.3), r = R.range(1.0, 1.6), p = [Math.cos(a) * r, R.range(3.6, 4.4), Math.sin(a) * r];
    M.tube('wood', 0.09, [[0.05, 2.6, -0.1], [p[0] * 0.5, 3.3, p[2] * 0.5], p], 6); pontas.push(p); }
  M.cls = 1;
  for (const p of pontas.concat([[0, 4.8, 0]])) for (let k = 0; k < 2; k++) {
    M.color(R() < 0.5 ? [0.22, 0.42, 0.16] : [0.28, 0.5, 0.2]); const r = R.range(0.9, 1.4);
    M.save().move(p[0] + R.range(-0.4, 0.4), p[1] - r * 0.5 + k * 0.4, p[2] + R.range(-0.4, 0.4));
    M.lathe('canvas', [[0, 0], [r * 0.7, r * 0.15], [r, r * 0.5], [r * 0.8, r * 0.85], [0, r]], 9); M.restore();
  }
  M.cls = 0;
  M.col(-2.4, 2.4, 0, 0.6, -2.4, 2.4, 'concrete'); M.col(-0.25, 0.25, 0.6, 3, -0.25, 0.25, 'wood');
});
