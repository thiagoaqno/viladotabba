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

/* ---------- pacote 4: passarelas e prédios de favela verticais ----------
   Passarelas: o topo do piso fica em y = 0 da peça, então o y que se põe no editor é a altura da laje que ela liga (3,15 nas lajes
   do mapa Favela). Comprimento em x, 2 m de largura (1,9 m entre os corrimãos: os bots passam), entra-se pelas pontas.
   Prédios: blocos fechados de três e quatro andares (2,95 m por andar), com lajes que avançam, terraços e caixas d'água. */
kcTex(['kcPredioFavela3', 'kcPredioFavela4', 'kcPredioFavelaEsquina'], ['brick', 'plaster2']);
Object.assign(KC_COR, { azulParede: [0.46, 0.62, 0.8], rosaParede: [0.88, 0.62, 0.6], verdeParede: [0.5, 0.72, 0.52], amareloPasso: [0.9, 0.72, 0.14] });

// bloco fechado (andar de prédio) com colisão
function kcBloco(M, mat, cor, x0, x1, y0, y1, z0, z1, kind = 'concrete') { M.color(cor); M.boxB(mat, x0, x1, y0, y1, z0, z1); M.col(x0, x1, y0, y1, z0, z1, kind); }
// laje de concreto (0,15 m) com colisão; a borda passa 0,1 m do bloco
function kcLajeB(M, x0, x1, y, z0, z1) { M.color(KC_COR.laje); M.boxB('concrete', x0 - 0.1, x1 + 0.1, y, y + 0.15, z0 - 0.1, z1 + 0.1); M.col(x0 - 0.1, x1 + 0.1, y, y + 0.15, z0 - 0.1, z1 + 0.1, 'concrete'); }
// mureta de tijolo em volta de um retângulo (lados: 'n' -z, 's' +z, 'o' -x, 'l' +x)
function kcMureta(M, x0, x1, y, z0, z1, h, lados = 'nsol', t = 0.12) {
  M.color(KC_COR.tijolo);
  const R = { s: [x0, x1, z1 - t, z1], n: [x0, x1, z0, z0 + t], o: [x0, x0 + t, z0, z1], l: [x1 - t, x1, z0, z1] };
  for (const k of lados) { const [a, b, c, d] = R[k]; M.boxB('brick', a, b, y, y + h, c, d); M.col(a, b, y, y + h, c, d, 'concrete'); }
}
// janela de grade numa fachada fechada: vão escuro, grade, peitoril. s: para onde a fachada olha
function kcJanelaGrade(M, eixo, d, s, a0, a1, b0, b1) {
  const c = M.cls; M.cls = 1; M.save();
  M.color([0.06, 0.06, 0.07]); kcB(M, 'dark', eixo, a0, a1, b0, b1, d, d + s * 0.005);
  M.color(KC_COR.ferro); const n = Math.max(2, Math.round((a1 - a0) / 0.14));
  for (let i = 1; i < n; i++) { const a = a0 + (i / n) * (a1 - a0); kcB(M, 'steel', eixo, a - 0.012, a + 0.012, b0, b1, d + s * 0.02, d + s * 0.04); }
  kcB(M, 'steel', eixo, a0, a1, (b0 + b1) / 2 - 0.012, (b0 + b1) / 2 + 0.012, d + s * 0.02, d + s * 0.04);
  M.color(KC_COR.laje); kcB(M, 'concrete', eixo, a0 - 0.08, a1 + 0.08, b0 - 0.07, b0, d, d + s * 0.08);
  M.restore(); M.cls = c;
}
// pintura numa fachada (reboco pintado só na frente, o resto no tijolo)
function kcPintura(M, eixo, d, s, a0, a1, b0, b1, cor) { const c = M.cls; M.cls = 1; M.color(cor); kcB(M, 'plaster2', eixo, a0, a1, b0, b1, d, d + s * 0.012); M.cls = c; }

// prédio de favela de três andares, 6,8 x 9,3 x 5,7 m: o primeiro andar avança sobre a rua, o segundo recua e deixa um terraço
PF.kcPredioFavela3 = () => prefab('kcPredioFavela3', (M) => {
  M.local(1);
  const T = KC_COR.tijolo;
  // térreo: portão de enrolar azul e janela de grade
  kcBloco(M, 'brick', T, -3, 3, 0, 2.8, -2.5, 2.5);
  M.cls = 1; M.color([0.25, 0.42, 0.62]); M.boxB('rollshutter', -2.6, -0.4, 0, 2.4, 2.5, 2.54); M.color([0.38, 0.38, 0.4]); M.boxB('steel', -2.65, -0.35, 2.4, 2.62, 2.5, 2.64);
  M.color(KC_COR.chapisco); M.boxB('plaster2', -3.01, 3.01, 0, 0.7, -2.51, 2.51); M.cls = 0;
  kcJanelaGrade(M, 'x', 2.5, 1, 0.8, 2.2, 1.0, 2.0); kcJanelaGrade(M, 'z', 3, 1, -1.2, 0, 1.0, 2.0);
  kcLajeB(M, -3, 3.6, 2.8, -2.5, 2.9);
  // primeiro andar: avança 0,6 m para +x e 0,4 m para a frente, fachada pintada de azul, mãos-francesas embaixo
  kcBloco(M, 'brick', T, -3, 3.6, 2.95, 5.75, -2.5, 2.9);
  kcPintura(M, 'x', 2.9, 1, -3, 3.6, 2.95, 5.75, KC_COR.azulParede);
  M.color(KC_COR.laje); M.cls = 1;
  for (const z of [-1.8, 1.8]) { M.save().move(3.0, 2.2, z).rotZ(-0.7); M.boxB('concrete', -0.07, 0.07, 0, 0.85, -0.07, 0.07); M.restore(); }
  M.cls = 0;
  for (const [a, b] of [[-2.3, -1.0], [0.6, 1.9]]) kcJanelaGrade(M, 'x', 2.9, 1, a, b, 3.9, 5.0);
  kcJanelaGrade(M, 'z', 3.6, 1, -0.8, 0.6, 3.9, 5.0); kcJanelaGrade(M, 'x', -2.5, -1, -1.0, 0.4, 3.9, 5.0);
  kcAr(M, -2.0, 3.6, 2.9, 0); kcAr(M, -3, 4.2, 0.8, -Math.PI / 2);
  kcLajeB(M, -3, 3.6, 5.75, -2.5, 2.9);
  // segundo andar recuado (tijolo sem reboco) e terraço de 2 m na laje do primeiro, com mureta
  kcBloco(M, 'brick', T, -3, 1.5, 5.9, 8.7, -2.5, 2.5);
  kcJanelaGrade(M, 'x', 2.5, 1, -2.2, -0.9, 6.8, 7.9); kcJanelaGrade(M, 'x', -2.5, -1, -1.6, -0.3, 6.8, 7.9);
  M.cls = 1; M.color([0.22, 0.2, 0.18]); M.boxB('dark', 1.5, 1.505, 5.9, 8.0, -0.4, 0.6); M.cls = 0; // porta do terraço
  kcMureta(M, 1.5, 3.7, 5.9, -2.6, 3.0, 0.9, 'nsl');
  kcCaixaAgua(M, 2.7, 5.9, -1.6);
  kcLajeB(M, -3, 1.5, 8.7, -2.5, 2.5);
  kcMureta(M, -3.1, 1.6, 8.85, -2.6, 2.6, 0.4);
  kcFerros(M, -3.0, 9.25, -2.5, 0.6); kcFerros(M, 1.5, 9.25, 2.5, 0.6);
  kcCaixaAgua(M, -1.9, 8.85, -1.4); kcAntenaF(M, 0.8, 8.85, 1.9, 0.6);
});

// prédio de favela estreito de quatro andares, 4,7 x 12,3 x 5,9 m: cada andar de uma cor, sacada no terceiro, o último pela metade
PF.kcPredioFavela4 = () => prefab('kcPredioFavela4', (M) => {
  M.local(1);
  const X = 2.25, Z = 2.5, P = 2.95;
  const pint = [KC_COR.chapisco, null, KC_COR.rosaParede];
  for (let i = 0; i < 3; i++) {
    const y = i * P; kcBloco(M, 'brick', KC_COR.tijolo, -X, X, y, y + 2.8, -Z, Z);
    if (pint[i]) { kcPintura(M, 'x', Z, 1, -X, X, y, y + 2.8, pint[i]); kcPintura(M, 'z', X, 1, -Z, Z, y, y + 2.8, pint[i]); }
    kcLajeB(M, -X, X, y + 2.8, -Z, Z);
    if (i > 0) { kcJanelaGrade(M, 'x', Z, 1, -1.6, -0.4, y + 0.95, y + 2.0); kcJanelaGrade(M, 'z', X, 1, -0.6, 0.6, y + 0.95, y + 2.0); kcJanelaGrade(M, 'x', -Z, -1, -0.5, 0.7, y + 0.95, y + 2.0); }
  }
  // térreo: porta de ferro e janela
  M.cls = 1; M.color([0.32, 0.36, 0.34]); M.boxB('paint', 0.4, 1.4, 0, 2.15, Z, Z + 0.04); M.color(KC_COR.ferro); M.boxB('steel', 1.25, 1.3, 1.0, 1.12, Z + 0.04, Z + 0.07); M.cls = 0;
  kcJanelaGrade(M, 'x', Z, 1, -1.8, -0.6, 1.0, 2.0);
  // sacada do terceiro andar (y 5,9)
  const yb = 2 * P;
  M.color(KC_COR.laje); M.boxB('concrete', 0.1, 2.0, yb - 0.15, yb, Z, Z + 0.8); M.col(0.1, 2.0, yb - 0.15, yb, Z, Z + 0.8, 'concrete');
  M.cls = 1; M.color([0.85, 0.85, 0.83]);
  M.boxB('steel', 0.1, 2.0, yb + 0.95, yb + 1.0, Z + 0.76, Z + 0.8);
  for (let i = 0; i <= 12; i++) { const x = 0.1 + i * (1.9 / 12); M.boxB('steel', x - 0.01, x + 0.01, yb, yb + 0.95, Z + 0.77, Z + 0.79); }
  M.color([0.25, 0.22, 0.2]); M.boxB('dark', 0.4, 1.4, yb, yb + 2.1, Z, Z + 0.01); M.cls = 0;
  // quarto andar pela metade: só o fundo fechado, a frente é laje aberta com mureta, pilares e ferros
  const y3 = 3 * P;
  kcBloco(M, 'brick', KC_COR.tijolo, -X, X, y3, y3 + 2.8, -Z, 0.3);
  kcJanelaGrade(M, 'z', X, 1, -1.6, -0.4, y3 + 0.95, y3 + 2.0);
  M.cls = 1; M.color([0.22, 0.2, 0.18]); M.boxB('dark', -0.5, 0.5, y3, y3 + 2.1, 0.3, 0.305); M.cls = 0;
  kcMureta(M, -X - 0.1, X + 0.1, y3, 0.3, Z + 0.1, 0.6, 'sol');
  for (const x of [-X + 0.1, X - 0.1]) { M.color(KC_COR.laje); M.boxB('concrete', x - 0.12, x + 0.12, y3 + 0.6, y3 + 1.9, Z - 0.14, Z + 0.1); M.col(x - 0.12, x + 0.12, y3, y3 + 1.9, Z - 0.14, Z + 0.1, 'concrete'); kcFerros(M, x, y3 + 1.9, Z - 0.02, 0.7); }
  kcLajeB(M, -X, X, y3 + 2.8, -Z, 0.3);
  kcCaixaAgua(M, -1.1, y3 + 2.95, -1.2); kcAntenaF(M, 1.4, y3 + 2.95, -0.4, 0.3);
  kcAr(M, X, 4.2, -1.4, Math.PI / 2); kcAr(M, -X, 7.1, 0.9, -Math.PI / 2);
  M.color([0.85, 0.85, 0.83]); M.cls = 1; M.tube('plastic', 0.05, [[-X - 0.08, y3 + 2.8, Z - 0.3], [-X - 0.08, 0.1, Z - 0.3], [-X - 0.25, 0.05, Z - 0.3]], 8); M.cls = 0;
});

// prédio de esquina em L, 6,2 x 9,3 x 6,2 m: o fundo tem três andares, a frente esquerda dois (com terraço por cima) e a frente
// direita fica aberta (um canto coberto pela laje, para se proteger)
PF.kcPredioFavelaEsquina = () => prefab('kcPredioFavelaEsquina', (M) => {
  M.local(1);
  const T = KC_COR.tijolo;
  // fundo (z -3 a 0), três andares
  for (let i = 0; i < 3; i++) {
    const y = i * 2.95; kcBloco(M, 'brick', T, -3, 3, y, y + 2.8, -3, 0); kcLajeB(M, -3, 3, y + 2.8, -3, 0);
    kcJanelaGrade(M, 'x', -3, -1, -1.5, -0.3, y + 1.0, y + 2.0); kcJanelaGrade(M, 'z', 3, 1, -2.2, -1.0, y + 1.0, y + 2.0);
    if (i > 0) kcJanelaGrade(M, 'x', 0, 1, 1.2, 2.4, y + 1.0, y + 2.0);
  }
  M.cls = 1; M.color([0.3, 0.32, 0.3]); M.boxB('paint', 1.0, 2.0, 0, 2.15, 0, 0.04); M.cls = 0; // porta no canto aberto
  // frente esquerda (x -3 a 0,5, z 0 a 3), dois andares: loja verde com portão de enrolar
  for (let i = 0; i < 2; i++) { const y = i * 2.95; kcBloco(M, 'brick', T, -3, 0.5, y, y + 2.8, 0, 3); kcLajeB(M, -3, 0.5, y + 2.8, 0, 3); }
  kcPintura(M, 'x', 3, 1, -3, 0.5, 0, 2.8, KC_COR.verdeParede); kcPintura(M, 'z', 0.5, 1, 0, 3, 0, 2.8, KC_COR.verdeParede);
  M.cls = 1; M.color([0.6, 0.62, 0.64]); M.boxB('rollshutter', -2.6, -0.2, 0, 2.4, 3, 3.04); M.color([0.38, 0.38, 0.4]); M.boxB('steel', -2.65, -0.15, 2.4, 2.62, 3, 3.14); M.cls = 0;
  kcJanelaGrade(M, 'x', 3, 1, -2.4, -1.1, 3.9, 5.0); kcJanelaGrade(M, 'z', -3, -1, 0.8, 2.2, 3.9, 5.0); kcJanelaGrade(M, 'z', 0.5, 1, 0.9, 2.1, 3.9, 5.0);
  // terraço na laje da frente (y 5,9), com mureta e porta para o fundo
  kcMureta(M, -3.1, 0.6, 5.9, 0, 3.1, 0.9, 'sol');
  M.cls = 1; M.color([0.22, 0.2, 0.18]); M.boxB('dark', -1.8, -0.8, 5.9, 8.0, 0, 0.005); M.cls = 0;
  kcCaixaAgua(M, -2.2, 5.9, 2.2);
  // canto aberto (x 0,5 a 3, z 0 a 3): laje do primeiro andar cobrindo, com pilar na quina
  M.color(KC_COR.laje); M.boxB('concrete', 2.7, 3.0, 0, 2.8, 2.7, 3.0); M.col(2.7, 3.0, 0, 2.8, 2.7, 3.0, 'concrete');
  kcLajeB(M, 0.5, 3, 2.8, 0, 3);
  kcMureta(M, 0.5, 3.1, 2.95, 0, 3.1, 0.9, 'sl');
  // topo do fundo
  kcMureta(M, -3.1, 3.1, 8.85, -3.1, 0.1, 0.4);
  kcCaixaAgua(M, 1.6, 8.85, -1.6); kcAntenaF(M, -2.2, 8.85, -0.6, 0.4); kcFerros(M, 3.0, 9.25, -3.0, 0.6);
  kcAr(M, 3, 4.3, -2.0, Math.PI / 2); kcAr(M, -1.0, 7.2, -3, Math.PI);
});

// passarela: piso de madeira (ou chapa de aço) com o topo em y = 0, corrimão dos dois lados
function kcPassarelaF(M, L, ferro, Y = 0) {
  M.local(1);
  const h = L / 2, W = 1.0, mat = ferro ? 'steel' : 'wood';
  if (ferro) { M.color([0.48, 0.5, 0.52]); M.boxB('steel', -h, h, Y + (-0.06), Y + (0), -W, W); }
  else { M.color(KC_COR.madeira); for (let i = 0; i < 11; i++) { const z = -W + i * (2 * W / 11); M.boxB('wood', -h, h, Y + (-0.06), Y + (0), z + 0.01, z + 2 * W / 11 - 0.01); } }
  M.col(-h, h, Y - 0.12, Y, -W, W, mat);
  // vigas por baixo e travessas
  M.color(ferro ? KC_COR.amareloPasso : [0.45, 0.32, 0.22]);
  for (const z of [-0.85, 0.85]) M.boxB(mat, -h, h, Y + (-0.3), Y + (-0.06), z - 0.07, z + 0.07);
  M.cls = 1;
  for (let x = -h + 0.5; x < h; x += 1) M.boxB(mat, x - 0.04, x + 0.04, Y + (-0.14), Y + (-0.06), -W, W);
  // corrimão: postes a cada metro, corrimão em cima e no meio
  M.color(ferro ? KC_COR.amareloPasso : [0.5, 0.36, 0.24]);
  const n = Math.max(1, Math.round(L)), r = ferro ? 0.025 : 0.04;
  for (const z of [-0.96, 0.96]) {
    for (let i = 0; i <= n; i++) { const x = -h + (i / n) * L; M.boxB(mat, x - r, x + r, Y + (0), Y + (1.05), z - r, z + r); }
    M.boxB(mat, -h, h, Y + (1.0), Y + (1.06), z - r, z + r); M.boxB(mat, -h, h, Y + (0.5), Y + (0.55), z - r * 0.7, z + r * 0.7);
  }
  M.cls = 0;
  for (const z of [-0.98, 0.98]) M.col(-h, h, Y, Y + 1.06, z - 0.03, z + 0.03, mat);
}
PF.kcPassarela4 = () => prefab('kcPassarela4', (M) => kcPassarelaF(M, 4, false));
PF.kcPassarela8 = () => prefab('kcPassarela8', (M) => kcPassarelaF(M, 8, false));
PF.kcPassarelaFerro4 = () => prefab('kcPassarelaFerro4', (M) => kcPassarelaF(M, 4, true));
PF.kcPassarelaFerro8 = () => prefab('kcPassarelaFerro8', (M) => kcPassarelaF(M, 8, true));
// passarela de 4 m em quatro esteios, piso a 3 m do chão (fica de pé sozinha; passa gente por baixo)
PF.kcPassarelaPostes = () => prefab('kcPassarelaPostes', (M) => {
  kcPassarelaF(M, 4, false, 3); M.color([0.45, 0.32, 0.22]);
  for (const x of [-1.9, 1.9]) for (const z of [-0.85, 0.85]) { M.boxB('wood', x - 0.07, x + 0.07, 0, 2.7, z - 0.07, z + 0.07); M.col(x - 0.07, x + 0.07, 0, 2.7, z - 0.07, z + 0.07, 'wood'); }
  M.cls = 1;
  for (const x of [-1.9, 1.9]) { M.save().move(x, 0.4, -0.85).rotX(Math.atan2(1.7, 2.2)); M.boxB('wood', -0.03, 0.03, 0, Math.hypot(1.7, 2.2), -0.03, 0.03); M.restore(); }
  M.cls = 0;
});

/* ---------- pacote 5: kit da favela (folha de assets do Thiago) ----------
   Casas pintadas (amarela com varanda, azul com alpendre, verde de dois andares), módulos de 3 x 3 m para empilhar,
   kit de laje (pilar de tijolo, tijolos, antena de TV, varal), coberturas (blocos, palete, tambores, contêiner de água, pneus),
   veículos de cenário (carro velho, van, moto), detalhes (caçamba, cone, engradados, saco de lixo, quadro de luz, cartazes),
   plantas em vaso, samambaia, bandeira, bandeirinhas, lona azul, placa de bar e parede de cobogó. */
kcTex(['kcCasaAmarela', 'kcCasaAzul', 'kcCasaVerde', 'kcModuloPorta', 'kcModuloGaragem', 'kcModuloAberto', 'kcModuloJanela', 'kcModuloPortaMadeira', 'kcPilarTijolo', 'kcTijolos'], ['brick', 'plaster2']);
Object.assign(KC_COR, { amareloParede: [0.92, 0.76, 0.3], base: [0.6, 0.6, 0.58], cinzaReboco: [0.7, 0.69, 0.66], madeiraPorta: [0.45, 0.3, 0.2] });

// porta fechada (enfeite numa fachada): folha, batente, maçaneta
function kcPorta(M, eixo, d, s, a0, a1, cor, mat = 'paint') {
  const c = M.cls; M.cls = 1;
  M.color(KC_COR.laje); kcB(M, 'concrete', eixo, a0 - 0.06, a1 + 0.06, 0, 2.2, d, d + s * 0.02);
  M.color(cor); kcB(M, mat, eixo, a0, a1, 0, 2.12, d, d + s * 0.04);
  M.color(KC_COR.ferro); kcB(M, 'steel', eixo, a1 - 0.14, a1 - 0.08, 1.0, 1.1, d, d + s * 0.07);
  M.cls = c;
}
// telhado de uma água (fibrocimento ou zinco) em cima de um retângulo, caindo para -z
function kcTelhado(M, x0, x1, z0, z1, yAlto, yBaixo, cor, beiral = 0.3) {
  const L = z1 - z0 + 2 * beiral, a = Math.atan2(yAlto - yBaixo, L);
  M.color(cor); M.save().move((x0 + x1) / 2, (yAlto + yBaixo) / 2, (z0 + z1) / 2).rotX(-a);
  M.boxB('corrugated', -(x1 - x0) / 2 - beiral, (x1 - x0) / 2 + beiral, 0, 0.03, -L / 2, L / 2); M.restore();
  M.col(x0 - beiral, x1 + beiral, Math.min(yAlto, yBaixo) - 0.05, Math.max(yAlto, yBaixo) + 0.05, z0 - beiral, z1 + beiral, 'steel');
}

// casa amarela de dois andares: térreo fechado, em cima uma varanda aberta com mureta, coberta de telha em esteios, 6,2 x 6,1 x 5,7 m
PF.kcCasaAmarela = () => prefab('kcCasaAmarela', (M) => {
  M.local(1); const X = 3, Z = 2.75;
  kcBloco(M, 'plaster2', KC_COR.amareloParede, -X, X, 0, 2.8, -Z, Z);
  kcPintura(M, 'x', Z, 1, -X, X, 0, 0.6, KC_COR.base); kcPintura(M, 'z', X, 1, -Z, Z, 0, 0.6, KC_COR.base); kcPintura(M, 'z', -X, -1, -Z, Z, 0, 0.6, KC_COR.base);
  kcPorta(M, 'x', Z, 1, -0.6, 0.4, [0.5, 0.42, 0.3], 'wood');
  kcJanelaGrade(M, 'x', Z, 1, 1.0, 2.4, 1.0, 2.0); kcJanelaGrade(M, 'x', Z, 1, -2.5, -1.4, 1.1, 1.9); kcJanelaGrade(M, 'z', X, 1, -1.0, 0.4, 1.0, 2.0);
  kcLajeB(M, -X, X, 2.8, -Z, Z);
  // em cima: parede do fundo com porta e janela, varanda com mureta, esteios e telhado de fibrocimento
  const y = 2.95;
  kcBloco(M, 'plaster2', KC_COR.amareloParede, -X, X, y, y + 2.5, -Z, -Z + 1.6);
  kcJanelaGrade(M, 'x', -Z + 1.6, 1, 0.6, 1.9, y + 0.9, y + 1.9);
  M.cls = 1; M.color([0.22, 0.2, 0.18]); M.boxB('dark', -1.8, -0.8, y, y + 2.1, -Z + 1.6, -Z + 1.605); M.cls = 0;
  kcMureta(M, -X - 0.1, X + 0.1, y + 0.15, -Z + 1.6, Z + 0.1, 0.9, 'sol');
  M.color([0.5, 0.36, 0.24]); for (const x of [-X + 0.05, X - 0.05]) { M.boxB('wood', x - 0.07, x + 0.07, y + 1.05, y + 2.55, Z - 0.05, Z + 0.09); M.col(x - 0.07, x + 0.07, y + 1.05, y + 2.55, Z - 0.05, Z + 0.09, 'wood'); }
  M.boxB('wood', -X - 0.1, X + 0.1, y + 2.45, y + 2.6, Z - 0.05, Z + 0.09);
  kcTelhado(M, -X, X, -Z, Z, y + 2.8, y + 2.55, [0.66, 0.66, 0.64]);
  kcCaixaAgua(M, -2.0, y + 2.85, -1.9);
});

// casa azul térrea com alpendre na frente (grade baixa, esteios, telhado de zinco enferrujado), 6,4 x 3,4 x 7 m
PF.kcCasaAzul = () => prefab('kcCasaAzul', (M) => {
  M.local(1); const X = 3, z0 = -3.2, z1 = 1.2;
  kcBloco(M, 'plaster2', KC_COR.azulParede, -X, X, 0, 2.8, z0, z1);
  kcPintura(M, 'x', z1, 1, -X, X, 0, 0.5, KC_COR.base);
  kcPorta(M, 'x', z1, 1, -0.5, 0.5, [0.3, 0.34, 0.36]);
  kcJanelaGrade(M, 'x', z1, 1, -2.5, -1.2, 1.0, 2.0); kcJanelaGrade(M, 'x', z1, 1, 1.2, 2.5, 1.0, 2.0); kcJanelaGrade(M, 'z', X, 1, -2.2, -0.8, 1.0, 2.0);
  // alpendre: piso de cimento, grade baixa com entrada de 1,6 m no meio, esteios
  M.color(KC_COR.laje); M.boxB('concrete', -X, X, 0, 0.05, z1, z1 + 2.2);
  M.color([0.85, 0.85, 0.83]); M.cls = 1;
  for (const [a, b] of [[-X, -0.85], [0.85, X]]) { M.boxB('steel', a, b, 0.9, 0.95, z1 + 2.1, z1 + 2.15); for (let x = a; x <= b + 0.01; x += 0.15) M.boxB('steel', x - 0.01, x + 0.01, 0.05, 0.9, z1 + 2.11, z1 + 2.14); M.col(a, b, 0, 0.95, z1 + 2.08, z1 + 2.17, 'steel'); }
  M.cls = 0;
  M.color([0.82, 0.82, 0.8]); for (const x of [-X + 0.08, -0.85, 0.85, X - 0.08]) { M.boxB('paint', x - 0.06, x + 0.06, 0, 2.55, z1 + 2.05, z1 + 2.17); M.col(x - 0.06, x + 0.06, 0, 2.55, z1 + 2.05, z1 + 2.17, 'concrete'); }
  kcTelhado(M, -X, X, z0, z1 + 2.2, 3.3, 2.95, KC_COR.ferrugem, 0.25);
  kcCaixaAgua(M, 2.0, 3.05, -2.2); kcAntenaF(M, -2.2, 3.0, -2.6, 0.3);
});

// casa verde de dois andares, base cinza, laje com caixa d'água, 6,2 x 6,9 x 5,2 m
PF.kcCasaVerde = () => prefab('kcCasaVerde', (M) => {
  M.local(1); const X = 3, Z = 2.5;
  for (let i = 0; i < 2; i++) {
    const y = i * 2.95; kcBloco(M, 'plaster2', KC_COR.verdeParede, -X, X, y, y + 2.8, -Z, Z); kcLajeB(M, -X, X, y + 2.8, -Z, Z);
    kcJanelaGrade(M, 'x', Z, 1, -2.4, -1.0, y + 1.0, y + 2.0); kcJanelaGrade(M, 'x', Z, 1, 1.2, 2.4, y + 1.0, y + 2.0); kcJanelaGrade(M, 'z', X, 1, -0.7, 0.7, y + 1.0, y + 2.0);
  }
  kcPintura(M, 'x', Z, 1, -X, X, 0, 0.9, KC_COR.base); kcPintura(M, 'z', X, 1, -Z, Z, 0, 0.9, KC_COR.base); kcPintura(M, 'z', -X, -1, -Z, Z, 0, 0.9, KC_COR.base);
  kcPorta(M, 'x', Z, 1, -0.5, 0.5, [0.32, 0.3, 0.28]);
  kcMureta(M, -X - 0.1, X + 0.1, 5.9, -Z - 0.1, Z + 0.1, 0.4);
  kcCaixaAgua(M, -1.6, 5.9, -1.2);
  kcAr(M, X, 4.1, 1.3, Math.PI / 2);
});

// módulos de 3 x 3 x 2,95 m: a laje de cima colide, então dá para empilhar (y = 2,95 no de cima)
function kcModulo(M, mat, cor, frente) {
  M.local(1); const H = 2.8;
  if (frente === 'aberto') {
    // sala aberta na frente (dá para entrar): três paredes, piso e laje
    M.color(cor);
    for (const [x0, x1, z0, z1] of [[-1.5, 1.5, -1.5, -1.35], [-1.5, -1.35, -1.35, 1.5], [1.35, 1.5, -1.35, 1.5]]) { M.boxB(mat, x0, x1, 0, H, z0, z1); M.col(x0, x1, 0, H, z0, z1, 'concrete'); }
    M.boxB(mat, -1.35, 1.35, H - 0.3, H, 1.35, 1.5); M.col(-1.35, 1.35, H - 0.3, H, 1.35, 1.5, 'concrete');
    M.color(KC_COR.laje); M.boxB('concrete', -1.35, 1.35, 0, 0.02, -1.35, 1.35);
  } else {
    kcBloco(M, mat, cor, -1.5, 1.5, 0, H, -1.5, 1.5);
    if (frente === 'porta') kcPorta(M, 'x', 1.5, 1, -0.45, 0.45, [0.42, 0.44, 0.46]);
    if (frente === 'madeira') { kcPorta(M, 'x', 1.5, 1, -0.6, 0.3, KC_COR.madeiraPorta, 'wood'); M.cls = 1; M.color([0.55, 0.56, 0.58]); M.boxB('steel', 0.7, 1.1, 1.3, 1.75, 1.5, 1.6); M.cls = 0; }
    if (frente === 'janela') kcJanelaGrade(M, 'x', 1.5, 1, -0.7, 0.7, 1.0, 2.0);
    if (frente === 'garagem') { M.cls = 1; M.color([0.5, 0.52, 0.54]); M.boxB('rollshutter', -1.25, 1.25, 0, 2.35, 1.5, 1.54); M.color([0.36, 0.36, 0.38]); M.boxB('steel', -1.3, 1.3, 2.35, 2.58, 1.5, 1.64); M.cls = 0; }
  }
  kcLajeB(M, -1.5, 1.5, H, -1.5, 1.5);
}
PF.kcModuloPorta = () => prefab('kcModuloPorta', (M) => kcModulo(M, 'brick', KC_COR.tijolo, 'porta'));
PF.kcModuloGaragem = () => prefab('kcModuloGaragem', (M) => kcModulo(M, 'plaster2', KC_COR.cinzaReboco, 'garagem'));
PF.kcModuloAberto = () => prefab('kcModuloAberto', (M) => kcModulo(M, 'plaster2', KC_COR.cinzaReboco, 'aberto'));
PF.kcModuloJanela = () => prefab('kcModuloJanela', (M) => kcModulo(M, 'plaster2', KC_COR.cinzaReboco, 'janela'));
PF.kcModuloPortaMadeira = () => prefab('kcModuloPortaMadeira', (M) => kcModulo(M, 'plaster2', [0.74, 0.72, 0.68], 'madeira'));

// ---------- kit de laje ----------
// pilar de tijolo com vão (caixa de passagem na laje), 0,8 x 1,2 x 0,6 m
PF.kcPilarTijolo = () => prefab('kcPilarTijolo', (M) => {
  M.local(1); M.color(KC_COR.tijolo);
  kcParede(M, 'brick', 'x', 0.15, 0.3, -0.4, 0.4, 0, 1.2, [[-0.18, 0.18, 0.45, 0.85]]);
  kcBloco(M, 'brick', KC_COR.tijolo, -0.4, 0.4, 0, 1.2, -0.3, 0.15);
  M.color(KC_COR.laje); M.boxB('concrete', -0.45, 0.45, 1.2, 1.26, -0.35, 0.35);
});
// pilha de tijolos de oito furos, 1,1 x 0,6 x 0,8 m
PF.kcTijolos = () => prefab('kcTijolos', (M) => {
  M.local(1); const R = rngOf(23);
  for (let f = 0; f < 3; f++) for (let i = 0; i < 4 - (f > 1 ? 1 : 0); i++) for (let j = 0; j < 2; j++) {
    const x = -0.42 + i * 0.28 + (f % 2) * 0.1, y = f * 0.19, z = -0.2 + j * 0.4;
    M.color(R() < 0.5 ? KC_COR.tijolo : [0.8, 0.45, 0.32]); M.boxB('brick', x - 0.13, x + 0.13, y, y + 0.185, z - 0.19, z + 0.19);
    M.cls = 1; M.color([0.3, 0.18, 0.12]); for (const dz of [-0.1, 0.1]) M.boxB('dark', x - 0.05, x + 0.05, y + 0.06, y + 0.13, z + dz - 0.04, z + dz + 0.04); M.cls = 0;
  }
  M.col(-0.55, 0.55, 0, 0.57, -0.4, 0.4, 'concrete');
});
// antena de TV (espinha de peixe) num mastro de 2,2 m
PF.kcAntenaTV = () => prefab('kcAntenaTV', (M) => {
  M.local(1); M.color(KC_COR.ferro); M.cls = 1;
  M.cyl('steel', 0.025, 2.2, 6);
  M.boxB('steel', -0.01, 0.01, 2.0, 2.02, -0.9, 0.9);
  for (let i = 0; i < 7; i++) { const z = -0.8 + i * 0.27, w = 0.55 - i * 0.05; M.boxB('steel', -w, w, 2.0, 2.015, z - 0.008, z + 0.008); }
  for (const s of [-1, 1]) M.tube('steel', 0.006, [[0, 2.0, 0], [s * 0.6, 1.0, s * 0.3], [s * 0.9, 0, s * 0.4]], 3);
  M.cls = 0;
  M.col(-0.04, 0.04, 0, 2.2, -0.04, 0.04, 'steel');
});
// varal de 3 m entre dois postes com roupa pendurada
PF.kcVaral = () => prefab('kcVaral', (M) => {
  const R = rngOf(41); M.local(1);
  M.color([0.45, 0.34, 0.24]); for (const x of [-1.5, 1.5]) { M.boxB('wood', x - 0.04, x + 0.04, 0, 1.9, -0.04, 0.04); M.col(x - 0.04, x + 0.04, 0, 1.9, -0.04, 0.04, 'wood'); }
  M.cls = 1; M.color([0.85, 0.85, 0.83]);
  M.tube('plastic', 0.006, [[-1.5, 1.85, 0], [-0.5, 1.75, 0], [0.5, 1.75, 0], [1.5, 1.85, 0]], 3);
  const cores = [[0.2, 0.5, 0.25], [0.35, 0.45, 0.6], [0.9, 0.9, 0.88], [0.8, 0.2, 0.18], [0.85, 0.7, 0.2], [0.3, 0.3, 0.35]];
  for (let x = -1.25; x < 1.3; x += R.range(0.42, 0.56)) {
    M.color(R.pick(cores)); const w = R.range(0.25, 0.4), h = R.range(0.35, 0.65), y = 1.76;
    M.save().move(x, y, 0).rotZ(R.range(-0.05, 0.05)); M.boxB('canvas', -w / 2, w / 2, -h, 0, -0.008, 0.008);
    if (R() < 0.5) { M.boxB('canvas', -w / 2 - 0.12, -w / 2, -0.25, 0, -0.008, 0.008); M.boxB('canvas', w / 2, w / 2 + 0.12, -0.25, 0, -0.008, 0.008); }
    M.restore();
  }
  M.cls = 0;
});

// ---------- coberturas ----------
// blocos de concreto empilhados, 1,2 x 1 x 0,8 m (cobre agachado)
PF.kcBlocos = () => prefab('kcBlocos', (M) => {
  M.local(1); const R = rngOf(31);
  for (let f = 0; f < 5; f++) for (let i = 0; i < 3 - (f > 3 ? 1 : 0); i++) for (let j = 0; j < 2; j++) {
    const x = -0.4 + i * 0.4 + (f > 3 ? 0.2 : 0), y = f * 0.19, z = -0.2 + j * 0.4;
    M.color(R() < 0.5 ? [0.62, 0.62, 0.6] : [0.56, 0.56, 0.55]); M.boxB('concrete', x - 0.195, x + 0.195, y, y + 0.188, z - 0.19, z + 0.19);
    if (f === 4 || (f === 3 && i === 2)) { M.cls = 1; M.color([0.22, 0.22, 0.22]); for (const dx of [-0.09, 0.09]) M.boxB('dark', x + dx - 0.06, x + dx + 0.06, y + 0.188, y + 0.19, z - 0.11, z + 0.11); M.cls = 0; }
  }
  M.col(-0.6, 0.6, 0, 0.75, -0.4, 0.4, 'concrete'); M.col(-0.4, 0.4, 0.75, 0.95, -0.4, 0.4, 'concrete');
});
// palete de madeira em pé, encostado (a frente olha +z)
PF.kcPaleteEmPe = () => prefab('kcPaleteEmPe', (M) => {
  M.local(1); M.color([0.66, 0.52, 0.36]);
  M.save().rotX(-0.2);
  for (let i = 0; i < 5; i++) { const y = 0.05 + i * 0.25; M.boxB('wood', -0.6, 0.6, y, y + 0.1, 0, 0.022); }
  for (const x of [-0.55, 0, 0.55]) M.boxB('wood', x - 0.05, x + 0.05, 0, 1.2, -0.1, 0);
  M.restore();
  M.col(-0.6, 0.6, 0, 1.15, -0.25, 0.05, 'wood');
});
// dois tambores azuis de plástico, 1,25 x 0,95 x 0,6 m
PF.kcTamboresAzuis = () => prefab('kcTamboresAzuis', (M) => {
  M.local(1);
  for (const x of [-0.32, 0.33]) {
    M.save().move(x, 0, 0); M.color([0.12, 0.3, 0.62]);
    M.lathe('plastic', [[0, 0], [0.27, 0], [0.29, 0.03], [0.29, 0.3], [0.3, 0.32], [0.29, 0.34], [0.29, 0.6], [0.3, 0.62], [0.29, 0.64], [0.29, 0.92], [0.26, 0.95], [0, 0.95]], 16);
    M.restore();
  }
  M.col(-0.62, 0.63, 0, 0.95, -0.3, 0.3, 'steel');
});
// contêiner de água de 1000 litros (tanque branco na gaiola de ferro sobre um palete), 1,2 x 1,15 x 1 m
PF.kcIBC = () => prefab('kcIBC', (M) => {
  M.local(1);
  M.color([0.35, 0.35, 0.37]); M.boxB('steel', -0.6, 0.6, 0, 0.14, -0.5, 0.5);
  M.color([0.92, 0.92, 0.9]); M.boxB('plastic', -0.55, 0.55, 0.15, 1.1, -0.45, 0.45, { bevel: 0.06 });
  M.color([0.72, 0.73, 0.74]); M.cls = 1;
  for (let i = 0; i <= 6; i++) { const x = -0.58 + i * (1.16 / 6); for (const z of [-0.48, 0.48]) M.boxB('steel', x - 0.012, x + 0.012, 0.14, 1.15, z - 0.012, z + 0.012); }
  for (let i = 0; i <= 5; i++) { const z = -0.48 + i * (0.96 / 5); for (const x of [-0.58, 0.58]) M.boxB('steel', x - 0.012, x + 0.012, 0.14, 1.15, z - 0.012, z + 0.012); }
  for (const y of [0.5, 0.85, 1.14]) { M.boxB('steel', -0.6, 0.6, y - 0.012, y + 0.012, -0.49, -0.47); M.boxB('steel', -0.6, 0.6, y - 0.012, y + 0.012, 0.47, 0.49); M.boxB('steel', -0.59, -0.57, y - 0.012, y + 0.012, -0.48, 0.48); M.boxB('steel', 0.57, 0.59, y - 0.012, y + 0.012, -0.48, 0.48); }
  M.color([0.25, 0.25, 0.26]); M.save().move(0, 1.1, 0); M.cyl('plastic', 0.15, 0.06, 12); M.restore();
  M.cls = 0;
  M.col(-0.6, 0.6, 0, 1.15, -0.5, 0.5, 'steel');
});
// pilha de pneus velhos, 0,7 x 1 x 0,7 m
PF.kcPneus = () => prefab('kcPneus', (M) => {
  M.local(1); const R = rngOf(9);
  for (let i = 0; i < 4; i++) {
    M.save().move(R.range(-0.04, 0.04), i * 0.24, R.range(-0.04, 0.04)); M.color([0.09, 0.09, 0.1]);
    M.lathe('rubber', [[0.2, 0], [0.31, 0.01], [0.34, 0.06], [0.34, 0.18], [0.31, 0.23], [0.2, 0.24], [0.21, 0.12], [0.2, 0]], 16);
    M.restore();
  }
  M.col(-0.35, 0.35, 0, 0.96, -0.35, 0.35, 'rubber');
});

// ---------- veículos (cenário, colidem e seguram bala) ----------
function kcRoda(M, x, y, z, r, w, lado) {
  M.save().move(x - (lado < 0 ? w : 0), y, z).rotZ(-Math.PI / 2); M.color([0.08, 0.08, 0.09]); M.cyl('rubber', r, w, 14);
  M.color([0.55, 0.55, 0.56]); M.save().move(0, lado < 0 ? -0.005 : w - 0.005, 0); M.cyl('steel', r * 0.55, 0.01, 10); M.restore(); M.restore();
}
// carro velho (hatch de quatro portas), 1,7 x 1,45 x 3,9 m, comprido em z
PF.kcCarroVelho = () => prefab('kcCarroVelho', (M) => {
  M.local(1); const C = [0.78, 0.78, 0.76];
  M.color(C); M.boxB('carpaint', -0.82, 0.82, 0.3, 0.85, -1.95, 1.95, { bevel: 0.1 });
  M.save().move(0, 0, -0.15); M.boxB('carpaint', -0.75, 0.75, 0.85, 1.42, -1.2, 1.05, { bevel: 0.12 }); M.restore();
  M.color([0.1, 0.12, 0.14]); M.cls = 1;
  M.boxB('glass', -0.7, 0.7, 0.92, 1.36, 0.88, 0.92); M.boxB('glass', -0.7, 0.7, 0.92, 1.36, -1.37, -1.33);
  for (const s of [-1, 1]) M.boxB('glass', s * 0.755 - 0.02, s * 0.755 + 0.02, 0.92, 1.34, -1.2, 0.82);
  M.color([0.2, 0.2, 0.21]); M.boxB('plastic', -0.84, 0.84, 0.28, 0.42, 1.88, 2.0); M.boxB('plastic', -0.84, 0.84, 0.28, 0.42, -2.0, -1.88);
  M.color([0.95, 0.92, 0.8]); for (const s of [-1, 1]) M.boxB('lamp', s * 0.6 - 0.15, s * 0.6 + 0.15, 0.6, 0.72, 1.94, 1.96);
  M.color([0.7, 0.1, 0.08]); for (const s of [-1, 1]) M.boxB('plastic', s * 0.62 - 0.12, s * 0.62 + 0.12, 0.62, 0.78, -1.96, -1.94);
  M.color([0.5, 0.36, 0.26]); M.boxB('charred', 0.3, 0.75, 0.86, 0.87, 0.1, 0.8); // ferrugem no teto
  M.cls = 0;
  for (const s of [-1, 1]) for (const z of [-1.25, 1.25]) kcRoda(M, s * 0.82, 0.3, z, 0.3, 0.2, s);
  M.col(-0.85, 0.85, 0, 0.9, -1.98, 1.98, 'steel'); M.col(-0.75, 0.75, 0.9, 1.42, -1.35, 0.9, 'steel');
});
// van velha de passageiros, 1,9 x 1,95 x 4,5 m, comprido em z
PF.kcVan = () => prefab('kcVan', (M) => {
  M.local(1); const C = [0.42, 0.47, 0.47];
  M.color(C); M.boxB('carpaint', -0.92, 0.92, 0.32, 1.95, -2.25, 2.1, { bevel: 0.16 });
  M.color([0.8, 0.8, 0.78]); M.boxB('carpaint', -0.92, 0.92, 0.32, 0.95, 2.05, 2.25, { bevel: 0.1 });
  M.color([0.1, 0.12, 0.14]); M.cls = 1;
  M.boxB('glass', -0.8, 0.8, 1.15, 1.8, 2.1, 2.14);
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const z = 1.4 - i * 0.95; M.boxB('glass', s * 0.925 - 0.015, s * 0.925 + 0.015, 1.2, 1.75, z - 0.38, z + 0.38); }
  M.boxB('glass', -0.75, 0.75, 1.2, 1.75, -2.27, -2.23);
  M.color([0.95, 0.92, 0.8]); for (const s of [-1, 1]) { M.save().move(s * 0.62, 0.8, 2.26).rotX(Math.PI / 2); M.cyl('lamp', 0.11, 0.02, 12); M.restore(); }
  M.color([0.2, 0.2, 0.21]); M.boxB('plastic', -0.94, 0.94, 0.3, 0.45, 2.2, 2.32); M.boxB('plastic', -0.94, 0.94, 0.3, 0.45, -2.32, -2.2);
  M.color([0.48, 0.32, 0.22]); M.boxB('charred', -0.9, -0.4, 1.95, 1.96, -1.6, -0.6);
  M.cls = 0;
  for (const s of [-1, 1]) for (const z of [-1.5, 1.45]) kcRoda(M, s * 0.9, 0.32, z, 0.32, 0.2, s);
  M.col(-0.95, 0.95, 0, 1.95, -2.3, 2.3, 'steel');
});
// moto de rua, 0,7 x 1,1 x 2 m, comprida em z
PF.kcMoto = () => prefab('kcMoto', (M) => {
  M.local(1);
  for (const z of [-0.68, 0.7]) { M.save().move(-0.06, 0.32, z).rotZ(-Math.PI / 2); M.color([0.08, 0.08, 0.09]); M.lathe('rubber', [[0.2, 0], [0.31, 0.01], [0.32, 0.06], [0.31, 0.11], [0.2, 0.12]], 16); M.restore(); }
  M.color([0.12, 0.12, 0.13]); M.tube('steel', 0.03, [[0, 0.32, -0.68], [0, 0.55, -0.2], [0, 0.6, 0.35], [0, 0.95, 0.55], [0, 0.32, 0.7]], 6);
  M.color([0.55, 0.08, 0.08]); M.boxB('carpaint', -0.14, 0.14, 0.7, 0.92, 0.0, 0.45, { bevel: 0.08 });
  M.color([0.08, 0.08, 0.08]); M.boxB('rubber', -0.13, 0.13, 0.72, 0.82, -0.6, 0.02, { bevel: 0.04 });
  M.color([0.5, 0.5, 0.52]); M.boxB('steel', -0.13, 0.13, 0.3, 0.6, -0.1, 0.25, { bevel: 0.04 });
  M.tube('steel', 0.04, [[0.1, 0.4, -0.05], [0.14, 0.38, -0.5], [0.14, 0.45, -0.75]], 6);
  M.color([0.12, 0.12, 0.13]); M.tube('steel', 0.015, [[-0.38, 1.05, 0.5], [0, 1.0, 0.55], [0.38, 1.05, 0.5]], 4);
  M.color([0.95, 0.92, 0.8]); M.save().move(0, 0.92, 0.66).rotX(Math.PI / 2); M.cyl('lamp', 0.07, 0.05, 10); M.restore();
  M.col(-0.3, 0.3, 0, 1.0, -1.0, 1.0, 'steel');
});

// ---------- detalhes urbanos ----------
// caçamba de lixo verde de quatro rodas, 1,4 x 1,35 x 1,1 m
PF.kcCacamba = () => prefab('kcCacamba', (M) => {
  M.local(1); M.color([0.18, 0.38, 0.22]);
  M.save().move(0, 0.15, -0.55); M.extrude('plastic', [[-0.55, 0], [0.55, 0], [0.62, 1.05], [-0.62, 1.05]], 1.1, { sharp: 1 }); M.restore();
  M.color([0.14, 0.3, 0.17]); M.save().move(0, 1.2, -0.62).rotX(-0.08); M.boxB('plastic', -0.66, 0.66, 0, 0.06, 0, 1.25); M.restore();
  M.color([0.85, 0.85, 0.82]); M.cls = 1; M.boxB('paint', -0.35, 0.1, 0.7, 0.85, 0.555, 0.565); M.boxB('paint', 0.15, 0.4, 0.55, 0.9, 0.555, 0.565); M.cls = 0;
  M.color([0.1, 0.1, 0.1]); for (const x of [-0.45, 0.45]) for (const z of [-0.4, 0.4]) { M.save().move(x - 0.03, 0.08, z).rotZ(-Math.PI / 2); M.cyl('rubber', 0.08, 0.06, 10); M.restore(); }
  M.col(-0.62, 0.62, 0, 1.3, -0.55, 0.55, 'steel');
});
// cone de trânsito
PF.kcCone = () => prefab('kcCone', (M) => {
  M.local(1); M.color([0.9, 0.35, 0.08]); M.boxB('plastic', -0.2, 0.2, 0, 0.04, -0.2, 0.2);
  M.lathe('plastic', [[0.15, 0.04], [0.03, 0.72], [0, 0.73]], 14);
  M.color([0.95, 0.95, 0.93]); M.cls = 1; for (const [y0, y1] of [[0.3, 0.4], [0.5, 0.58]]) { const r0 = 0.15 - (y0 - 0.04) * 0.176 + 0.004, r1 = 0.15 - (y1 - 0.04) * 0.176 + 0.004; M.lathe('plastic', [[r0, y0], [r1, y1]], 14); } M.cls = 0;
  M.col(-0.15, 0.15, 0, 0.72, -0.15, 0.15, 'rubber');
});
// engradados de plástico (vermelho e amarelo), 0,9 x 0,6 x 0,7 m
PF.kcEngradados = () => prefab('kcEngradados', (M) => {
  M.local(1);
  const eng = (x, y, z, cor) => {
    M.color(cor); M.boxB('plastic', x - 0.21, x + 0.21, y, y + 0.03, z - 0.17, z + 0.17);
    for (const s of [-1, 1]) { M.boxB('plastic', x - 0.21, x + 0.21, y, y + 0.28, z + s * 0.17 - 0.015, z + s * 0.17 + 0.015); M.boxB('plastic', x + s * 0.21 - 0.015, x + s * 0.21 + 0.015, y, y + 0.28, z - 0.17, z + 0.17); }
    M.cls = 1; M.color(cor.map((c) => c * 0.6)); for (const s of [-1, 1]) M.boxB('dark', x - 0.08, x + 0.08, y + 0.2, y + 0.25, z + s * 0.186, z + s * 0.19); M.cls = 0;
  };
  eng(-0.22, 0, 0, [0.82, 0.15, 0.12]); eng(0.22, 0, 0.05, [0.95, 0.78, 0.12]); eng(-0.2, 0.28, 0.02, [0.95, 0.78, 0.12]);
  M.col(-0.45, 0.45, 0, 0.56, -0.2, 0.25, 'wood');
});
// saco de lixo preto amarrado
PF.kcSacoLixo = () => prefab('kcSacoLixo', (M) => {
  M.local(1); M.color([0.06, 0.06, 0.07]);
  M.lathe('plastic', [[0, 0], [0.28, 0.02], [0.32, 0.2], [0.24, 0.42], [0.08, 0.5], [0.05, 0.58], [0.09, 0.64], [0, 0.65]], 12);
});
// quadro de luz na parede: três relógios e os fios descendo (as costas em z = 0, suba com PgUp)
PF.kcQuadroLuz = () => prefab('kcQuadroLuz', (M) => {
  M.local(1); M.cls = 1;
  M.color([0.62, 0.64, 0.64]); M.boxB('steel', -0.5, 0.5, 0, 0.65, 0, 0.18);
  M.color([0.86, 0.86, 0.84]); for (const x of [-0.3, 0, 0.3]) { M.boxB('plastic', x - 0.11, x + 0.11, 0.18, 0.52, 0.18, 0.2); M.color([0.1, 0.12, 0.14]); M.boxB('glass', x - 0.07, x + 0.07, 0.32, 0.46, 0.2, 0.205); M.color([0.86, 0.86, 0.84]); }
  M.color([0.08, 0.08, 0.08]); for (const x of [-0.35, -0.05, 0.25]) M.tube('rubber', 0.012, [[x, 0.65, 0.1], [x + 0.05, 1.3, 0.12], [x - 0.1, 2.0, 0.15]], 4);
  M.cls = 0;
});
// cartazes colados num muro (a frente olha +z), 1,4 x 1 m
PF.kcCartazes = () => prefab('kcCartazes', (M) => {
  M.local(1); M.cls = 1; const R = rngOf(57);
  const c = [[0.85, 0.2, 0.15], [0.95, 0.8, 0.2], [0.2, 0.45, 0.75], [0.92, 0.9, 0.85], [0.15, 0.55, 0.3]];
  for (const [x, y, w, h] of [[-0.45, 1.3, 0.42, 0.6], [0.05, 1.45, 0.38, 0.55], [0.5, 1.2, 0.4, 0.58], [-0.1, 0.95, 0.34, 0.45]]) {
    M.save().move(x, y, 0).rotZ(R.range(-0.08, 0.08)); M.color(R.pick(c)); M.boxB('paint', -w / 2, w / 2, -h / 2, h / 2, 0, 0.004);
    M.color(R.pick(c)); M.boxB('paint', -w / 2 + 0.04, w / 2 - 0.04, h / 2 - 0.18, h / 2 - 0.05, 0.004, 0.006);
    M.color([0.1, 0.1, 0.1]); M.boxB('paint', -w / 2 + 0.05, w / 2 - 0.08, -h / 2 + 0.08, -h / 2 + 0.12, 0.004, 0.006);
    M.restore();
  }
  M.cls = 0;
});

// ---------- vegetação ----------
function kcFolhas(M, n, alt, comp, larg, seed, cor) {
  const R = rngOf(seed);
  for (let i = 0; i < n; i++) {
    M.color(R() < 0.3 ? cor.map((v) => v * 0.8) : cor);
    M.save().move(0, alt, 0).rotY((i / n) * TAU + R.range(-0.3, 0.3)).rotX(R.range(0.4, 1.1));
    M.boxB('canvas', -larg / 2, larg / 2, 0, comp * 0.6, -0.006, 0.006);
    M.save().move(0, comp * 0.6, 0).rotX(0.6); M.boxB('canvas', -larg * 0.4, larg * 0.4, 0, comp * 0.4, -0.006, 0.006); M.restore();
    M.restore();
  }
}
// planta num vaso de barro, 0,6 x 0,9 x 0,6 m
PF.kcVasoPlanta = () => prefab('kcVasoPlanta', (M) => {
  M.local(1); M.color([0.7, 0.4, 0.26]);
  M.lathe('concrete', [[0, 0], [0.16, 0], [0.22, 0.32], [0.24, 0.35], [0.24, 0.38], [0.2, 0.38], [0.2, 0.34]], 14);
  M.color([0.28, 0.2, 0.14]); M.save().move(0, 0.33, 0); M.cyl('canvas', 0.2, 0.02, 12); M.restore();
  M.cls = 1; kcFolhas(M, 9, 0.34, 0.55, 0.1, 61, [0.26, 0.5, 0.2]); M.cls = 0;
  M.col(-0.22, 0.22, 0, 0.38, -0.22, 0.22, 'wood');
});
// samambaia/arbusto no chão, 1,4 x 0,8 x 1,4 m (não colide)
PF.kcArbusto = () => prefab('kcArbusto', (M) => {
  M.local(1); M.cls = 1; kcFolhas(M, 16, 0.05, 0.9, 0.16, 71, [0.22, 0.46, 0.18]); kcFolhas(M, 8, 0.15, 0.6, 0.14, 72, [0.3, 0.55, 0.22]); M.cls = 0;
});

// ---------- ambiência ----------
// bandeira do Brasil pendurada num muro (a frente olha +z), 1,5 x 1,05 m
PF.kcBandeira = () => prefab('kcBandeira', (M) => {
  M.local(1); M.cls = 1;
  M.color([0.0, 0.55, 0.25]); M.boxB('canvas', -0.75, 0.75, 1.0, 2.05, 0, 0.01);
  M.color([0.98, 0.84, 0.05]); M.save().move(0, 1.525, 0.012).scl(1.3, 0.92, 1).rotZ(Math.PI / 4); M.boxB('canvas', -0.38, 0.38, -0.38, 0.38, 0, 0.005); M.restore();
  M.color([0.06, 0.15, 0.5]); M.save().move(0, 1.525, 0.02).rotX(Math.PI / 2); M.cyl('canvas', 0.24, 0.006, 20); M.restore();
  M.color([0.95, 0.95, 0.93]); M.save().move(0, 1.525, 0.03).rotZ(-0.2); M.boxB('canvas', -0.23, 0.23, -0.02, 0.02, 0, 0.003); M.restore();
  M.color(KC_COR.ferro); for (const x of [-0.7, 0.7]) M.boxB('steel', x - 0.02, x + 0.02, 2.03, 2.07, -0.02, 0.03);
  M.cls = 0;
});
// bandeirinhas de festa junina num cordão de 6 m, preso a 3,4 m de altura nas pontas
PF.kcBandeirinhas = () => prefab('kcBandeirinhas', (M) => {
  M.local(1); M.cls = 1;
  const yAt = (x) => 3.4 - 0.5 * (1 - (x / 3) * (x / 3));
  M.color([0.85, 0.85, 0.8]); const P = []; for (let i = 0; i <= 12; i++) { const x = -3 + i * 0.5; P.push([x, yAt(x), 0]); } M.tube('plastic', 0.006, P, 3);
  const cores = [[0.9, 0.2, 0.15], [0.95, 0.8, 0.15], [0.2, 0.55, 0.3], [0.2, 0.45, 0.85], [0.95, 0.5, 0.15], [0.7, 0.3, 0.7]];
  let k = 0;
  for (let x = -2.8; x <= 2.81; x += 0.35, k++) { M.color(cores[k % cores.length]); M.save().move(x, yAt(x), 0); M.extrude('canvas', [[-0.11, 0], [0.11, 0], [0, -0.26]], 0.004); M.restore(); }
  M.cls = 0;
});
// lona azul esticada em quatro esteios, 3,4 x 2,4 x 2,6 m (sombra; passa gente por baixo)
PF.kcLonaAzul = () => prefab('kcLonaAzul', (M) => {
  M.local(1); M.color([0.36, 0.36, 0.38]);
  for (const x of [-1.6, 1.6]) for (const z of [-1.2, 1.2]) { M.save().move(x, 0, z); M.cyl('steel', 0.03, 2.3, 6); M.restore(); M.col(x - 0.04, x + 0.04, 0, 2.3, z - 0.04, z + 0.04, 'steel'); }
  M.color([0.18, 0.4, 0.75]); M.cls = 1;
  for (const s of [-1, 1]) { M.save().move(0, 2.3, s * 1.25).rotX(s * 0.12); M.boxB('canvas', -1.7, 1.7, -0.01, 0.01, s > 0 ? -1.27 : 0, s > 0 ? 0 : 1.27); M.restore(); }
  M.cls = 0;
});
// placa vertical de bar (vermelha, letras brancas), presa na parede por um braço (as costas em z = 0, suba com PgUp)
PF.kcPlacaBar = () => prefab('kcPlacaBar', (M) => {
  M.local(1); M.cls = 1;
  M.color(KC_COR.ferro); M.boxB('steel', -0.03, 0.03, 1.55, 1.6, 0, 0.75); M.boxB('steel', -0.03, 0.03, 0.15, 0.2, 0, 0.75);
  M.color([0.95, 0.95, 0.93]); M.boxB('paint', -0.05, 0.05, 0, 1.75, 0.75, 1.35);
  M.color([0.78, 0.12, 0.1]); M.boxB('paint', -0.06, 0.06, 0.05, 1.7, 0.8, 1.3);
  const L = { B: ['110', '101', '110', '101', '110'], A: ['010', '101', '111', '101', '101'], R: ['110', '101', '110', '101', '101'] }, c = 0.085;
  M.color([0.97, 0.97, 0.95]); // as letras dos dois lados (de um lado, espelhadas, para ler certo)
  ['B', 'A', 'R'].forEach((ch, k) => {
    const y0 = 1.55 - k * 0.52;
    L[ch].forEach((row, r) => { for (let col = 0; col < 3; col++) if (row[col] === '1') for (const s of [-1, 1]) { const z = 0.92 + (s > 0 ? 2 - col : col) * c, y = y0 - r * c; M.boxB('paint', Math.min(s * 0.06, s * 0.07), Math.max(s * 0.06, s * 0.07), y - c, y, z, z + c); } });
  });
  M.cls = 0;
});
// parede de cobogó (bloco vazado de concreto), 2 x 2 m: vê através, segura gente e bala
PF.kcCobogo = () => prefab('kcCobogo', (M) => {
  M.local(1); M.color([0.85, 0.82, 0.76]);
  const n = 5, t = 0.4;
  for (let i = 0; i <= n; i++) { const p = -1 + i * t; M.boxB('concrete', p - 0.03, p + 0.03, 0, 2, -0.07, 0.07); M.boxB('concrete', -1, 1, i * t - 0.03 + (i === 0 ? 0.03 : 0), i * t + 0.03, -0.07, 0.07); }
  M.cls = 1;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const x = -1 + (i + 0.5) * t, y = (j + 0.5) * t; M.save().move(x, y, 0).rotZ(Math.PI / 4); M.boxB('concrete', -0.12, 0.12, -0.02, 0.02, -0.07, 0.07); M.boxB('concrete', -0.02, 0.02, -0.12, 0.12, -0.07, 0.07); M.restore(); }
  M.cls = 0;
  M.col(-1, 1, 0, 2, -0.07, 0.07, 'concrete');
});

/* ---------- pacote 6: mais cinco prédios de favela (três com escada de verdade) ----------
   As escadas destes prédios ficam em KC_ESCADAS[nome] (coordenadas da peça) e o mapa-json.js transforma em rampa do jogo:
   o jogador e os bots sobem. Elas sobem no máximo 0,59 m por metro, têm 1,8 m de largura e são maciças por baixo.
   Prédio com escada só gira de 90 em 90 graus. */
const KC_ESCADAS = {};
kcTex(['kcFavelaTorre', 'kcFavelaComercio', 'kcFavelaEscadaLado', 'kcFavelaEscadaTelhado', 'kcFavelaEscadaFundos'], ['brick', 'plaster2']);
// escada maciça de concreto (degraus até o chão) e a rampa dela; axis 'z' ou 'x'; h0 na ponta x0/z0, h1 na ponta x1/z1
function kcEscadaF(M, nome, x0, x1, z0, z1, axis, h0, h1, corrimao) {
  KC_ESCADAS[nome].push({ x0, x1, z0, z1, axis, h0, h1 });
  const n = Math.max(2, Math.round(Math.abs(h1 - h0) / 0.2)), dh = Math.abs(h1 - h0) / n;
  M.color(KC_COR.laje);
  for (let i = 0; i < n; i++) {
    const t0 = i / n, t1 = (i + 1) / n, top = lerp(h0, h1, (t0 + t1) / 2) + dh / 2;
    if (axis === 'z') M.boxB('concrete', x0, x1, 0, top, lerp(z0, z1, t0), lerp(z0, z1, t1));
    else M.boxB('concrete', lerp(x0, x1, t0), lerp(x0, x1, t1), 0, top, z0, z1);
  }
  if (corrimao) { // corrimão de cano no lado de fora: [x, z] de cada ponta (na altura de cada ponta + 0,95)
    const [[ax, az], [bx, bz]] = corrimao; M.color(KC_COR.ferro); const c = M.cls; M.cls = 1;
    M.tube('steel', 0.025, [[ax, h0 + 0.95, az], [bx, h1 + 0.95, bz]], 6);
    for (let i = 0; i <= 4; i++) { const t = i / 4, x = lerp(ax, bx, t), z = lerp(az, bz, t), y = lerp(h0, h1, t); M.boxB('steel', x - 0.02, x + 0.02, y, y + 0.95, z - 0.02, z + 0.02); }
    M.cls = c;
  }
}
// patamar maciço (do chão até h), com piso de cimento
function kcPatamar(M, x0, x1, z0, z1, h) { kcBloco(M, 'concrete', KC_COR.laje, x0, x1, 0, h, z0, z1); }
// guarda-corpo de cano entre dois pontos, na altura y. Não colide (26/nov, pedido do Thiago: corrimão nenhum segura, e os bots
// não enroscam nele)
function kcGuarda(M, x0, z0, x1, z1, y) {
  M.color(KC_COR.ferro); const c = M.cls; M.cls = 1;
  const a = Math.min(x0, x1), b = Math.max(x0, x1), p = Math.min(z0, z1), q = Math.max(z0, z1);
  M.boxB('steel', a - 0.025, b + 0.025, y + 0.95, y + 1.0, p - 0.025, q + 0.025);
  const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 1.0));
  for (let i = 0; i <= n; i++) { const t = i / n, x = lerp(x0, x1, t), z = lerp(z0, z1, t); M.boxB('steel', x - 0.025, x + 0.025, y, y + 0.95, z - 0.025, z + 0.025); }
  M.cls = c;
}

// torre de cinco andares, estreita (4,5 x 15,3 x 4,7 m): cada andar de uma cor, o terceiro e o quarto avançam, sacadinhas
PF.kcFavelaTorre = () => prefab('kcFavelaTorre', (M) => {
  M.local(1); const Z = 2.25, P = 2.95;
  const andares = [[-2, 2, KC_COR.chapisco], [-2, 2, null], [-2, 2.5, KC_COR.azulParede], [-2, 2.5, null], [-2, 2, KC_COR.amareloParede]];
  andares.forEach(([x0, x1, cor], i) => {
    const y = i * P; kcBloco(M, 'brick', KC_COR.tijolo, x0, x1, y, y + 2.8, -Z, Z);
    if (cor) { kcPintura(M, 'x', Z, 1, x0, x1, y, y + 2.8, cor); kcPintura(M, 'z', x1, 1, -Z, Z, y, y + 2.8, cor); }
    kcLajeB(M, x0, x1, y + 2.8, -Z, Z);
    if (i > 0) { kcJanelaGrade(M, 'x', Z, 1, x0 + 0.5, x0 + 1.6, y + 0.95, y + 2.0); kcJanelaGrade(M, 'z', x1, 1, -0.7, 0.5, y + 0.95, y + 2.0); kcJanelaGrade(M, 'x', -Z, -1, -0.6, 0.6, y + 0.95, y + 2.0); kcJanelaGrade(M, 'z', x0, -1, -0.4, 0.8, y + 0.95, y + 2.0); }
    if (i === 2 || i === 4) { // sacadinha na frente
      const yb = y; M.color(KC_COR.laje); M.boxB('concrete', 0.3, 1.8, yb - 0.15, yb, Z, Z + 0.7); M.col(0.3, 1.8, yb - 0.15, yb, Z, Z + 0.7, 'concrete');
      M.cls = 1; M.color([0.85, 0.85, 0.83]); M.boxB('steel', 0.3, 1.8, yb + 0.95, yb + 1.0, Z + 0.66, Z + 0.7); for (let k = 0; k <= 10; k++) { const x = 0.3 + k * 0.15; M.boxB('steel', x - 0.01, x + 0.01, yb, yb + 0.95, Z + 0.67, Z + 0.69); }
      M.color([0.22, 0.2, 0.18]); M.boxB('dark', 0.55, 1.55, yb, yb + 2.1, Z, Z + 0.006); M.cls = 0;
    }
  });
  kcPorta(M, 'x', Z, 1, 0.4, 1.4, [0.35, 0.36, 0.38]); kcJanelaGrade(M, 'x', Z, 1, -1.6, -0.5, 1.0, 2.0);
  const yt = 5 * P;
  kcMureta(M, -2.1, 2.1, yt, -Z - 0.1, Z + 0.1, 0.4);
  kcCaixaAgua(M, -0.9, yt, -1.0); kcCaixaAgua(M, 0.9, yt, 0.9); kcAntenaF(M, 1.4, yt, -1.6, 0.4); kcFerros(M, -2.0, yt + 0.4, Z, 0.6);
  kcAr(M, 2.5, 6.9, 1.2, Math.PI / 2); kcAr(M, -2, 10.0, -1.0, -Math.PI / 2); kcAr(M, 2.0, 12.8, 0.6, Math.PI / 2);
  M.color([0.85, 0.85, 0.83]); M.cls = 1; M.tube('plastic', 0.05, [[-2.08, yt, -Z + 0.3], [-2.08, 0.1, -Z + 0.3], [-2.25, 0.05, -Z + 0.3]], 8); M.cls = 0;
});

// comércio largo de dois andares (9,2 x 6,5 x 5,2 m): três portas de enrolar de cores diferentes embaixo, fachada rosa em cima
PF.kcFavelaComercio = () => prefab('kcFavelaComercio', (M) => {
  M.local(1); const X = 4.5, Z = 2.5;
  kcBloco(M, 'brick', KC_COR.tijolo, -X, X, 0, 2.8, -Z, Z); kcLajeB(M, -X, X, 2.8, -Z, Z);
  M.cls = 1;
  M.color(KC_COR.pilar); for (const x of [-X, -1.55, 1.55, X]) M.boxB('paint', Math.max(-X - 0.01, x - 0.16), Math.min(X + 0.01, x + 0.16), 0, 2.8, Z, Z + 0.03);
  const portas = [[-4.3, -1.75, [0.2, 0.5, 0.3]], [-1.35, 1.35, [0.74, 0.17, 0.13]], [1.75, 4.3, [0.55, 0.57, 0.6]]];
  for (const [a, b, cor] of portas) { M.color(cor); M.boxB('rollshutter', a, b, 0, 2.4, Z, Z + 0.04); M.color([0.36, 0.36, 0.38]); M.boxB('steel', a - 0.04, b + 0.04, 2.4, 2.62, Z, Z + 0.15); }
  M.cls = 0;
  kcBloco(M, 'brick', KC_COR.tijolo, -X, X, 2.95, 5.75, -Z, Z); kcLajeB(M, -X, X, 5.75, -Z, Z);
  kcPintura(M, 'x', Z, 1, -X, X, 2.95, 5.75, KC_COR.rosaParede);
  for (const a of [-3.6, -1.4, 0.8, 3.0]) kcJanelaGrade(M, 'x', Z, 1, a - 0.15, a + 0.95, 3.9, 4.95);
  for (const a of [-3.0, 0.4]) kcJanelaGrade(M, 'x', -Z, -1, a, a + 1.2, 3.9, 4.95);
  for (const s of [-1, 1]) kcJanelaGrade(M, 'z', s * X, s, -0.6, 0.6, 3.9, 4.95);
  kcAr(M, -2.5, 3.5, Z, 0); kcAr(M, 2.0, 3.5, Z, 0); kcAr(M, X, 4.0, -1.2, Math.PI / 2);
  kcMureta(M, -X - 0.1, X + 0.1, 5.9, -Z - 0.1, Z + 0.1, 0.5);
  kcCaixaAgua(M, -3.2, 5.9, -1.3); kcCaixaAgua(M, 3.2, 5.9, -1.3); kcAntenaF(M, 0, 5.9, -1.8, 0.2);
  for (const x of [-X + 0.06, 0, X - 0.06]) kcFerros(M, x, 6.4, Z, 0.6);
});

// prédio com escada pelo lado (8,6 x 6,9 x 7,7 m): térreo fechado, em cima um quarto no fundo e um terraço grande a 2,95 m;
// a escada (2,4 m de largura) sobe pelo lado +x, da frente para o fundo, até um patamar que dá no terraço
PF.kcFavelaEscadaLado = () => prefab('kcFavelaEscadaLado', (M) => {
  KC_ESCADAS.kcFavelaEscadaLado = []; M.local(1);
  kcBloco(M, 'brick', KC_COR.tijolo, -3, 3, 0, 2.8, -5, 2.5); kcLajeB(M, -3, 3, 2.8, -5, 2.5);
  kcPintura(M, 'x', 2.5, 1, -3, 3, 0, 1.2, KC_COR.verdeParede);
  kcPorta(M, 'x', 2.5, 1, -1.8, -0.8, [0.3, 0.34, 0.36]); kcJanelaGrade(M, 'x', 2.5, 1, 0.4, 1.8, 1.0, 2.0);
  kcJanelaGrade(M, 'z', -3, -1, -2.0, -0.6, 1.0, 2.0); kcJanelaGrade(M, 'x', -5, -1, -1.0, 0.4, 1.0, 2.0);
  // quarto de cima, no fundo
  kcBloco(M, 'brick', KC_COR.tijolo, -3, 0.5, 2.95, 5.75, -5, -2); kcLajeB(M, -3, 0.5, 5.75, -5, -2);
  kcJanelaGrade(M, 'x', -2, 1, -2.4, -1.2, 3.9, 4.9); M.cls = 1; M.color([0.22, 0.2, 0.18]); M.boxB('dark', 0.5, 0.505, 2.95, 5.05, -4.2, -3.2); M.cls = 0;
  kcCaixaAgua(M, -1.3, 5.9, -3.5);
  // terraço: mureta na frente, no lado -x, no lado +x até o patamar e no fundo ao lado do quarto
  kcMureta(M, -3.1, 3.1, 2.95, -2, 2.6, 1.0, 'so'); kcMureta(M, 2.98, 3.1, 2.95, -2.5, 2.6, 1.0, 'l'); kcMureta(M, 0.5, 3.1, 2.95, -5.1, -2, 1.0, 'n');
  // escada (x 3,1 a 5,5) sobe da frente (z 2,5, chão) para o fundo (z -2,5, 2,95 m) e patamar no fundo (z -5 a -2,5)
  kcEscadaF(M, 'kcFavelaEscadaLado', 3.1, 5.5, -2.5, 2.5, 'z', 2.95, 0, [[5.45, -2.5], [5.45, 2.5]]);
  kcPatamar(M, 3.1, 5.5, -5, -2.5, 2.95);
  kcGuarda(M, 5.48, -5, 5.48, -2.5, 2.95); kcGuarda(M, 3.1, -4.98, 5.5, -4.98, 2.95);
  kcAr(M, -3, 4.2, -3.5, -Math.PI / 2);
});

// prédio com escada até a laje do telhado (9,5 x 6,4 x 10 m): dois andares fechados; um lance sobe pela frente até um
// patamar a 2,95 m e o outro sobe pelo lado +x até a laje do telhado (5,9 m), com mureta e vista do alto
PF.kcFavelaEscadaTelhado = () => prefab('kcFavelaEscadaTelhado', (M) => {
  KC_ESCADAS.kcFavelaEscadaTelhado = []; M.local(1);
  for (let i = 0; i < 2; i++) { const y = i * 2.95; kcBloco(M, 'brick', KC_COR.tijolo, -3.5, 3.5, y, y + 2.8, -5, 2.5); kcLajeB(M, -3.5, 3.5, y + 2.8, -5, 2.5); }
  kcPintura(M, 'z', -3.5, -1, -5, 2.5, 0, 2.8, KC_COR.amareloParede); kcPintura(M, 'x', -5, -1, -3.5, 3.5, 0, 2.8, KC_COR.amareloParede);
  kcPorta(M, 'z', -3.5, -1, -1.0, 0.0, [0.42, 0.3, 0.2], 'wood'); kcJanelaGrade(M, 'z', -3.5, -1, 0.6, 1.8, 1.0, 2.0); kcJanelaGrade(M, 'x', -5, -1, -2.0, -0.6, 1.0, 2.0);
  for (const a of [-2.6, 0.2]) kcJanelaGrade(M, 'x', 2.5, 1, a, a + 1.2, 3.9, 4.9);
  kcJanelaGrade(M, 'z', -3.5, -1, -3.0, -1.7, 3.9, 4.9); kcJanelaGrade(M, 'x', -5, -1, 0.5, 1.8, 3.9, 4.9);
  // laje do telhado: mureta em volta, aberta no lado +x onde chega a escada (z -5 a -2,5)
  kcMureta(M, -3.6, 3.6, 5.9, -5.1, 2.6, 0.9, 'sno'); kcMureta(M, 3.48, 3.6, 5.9, -2.5, 2.6, 0.9, 'l');
  // primeiro lance: na frente (z 2,6 a 5), sobe de x -3,5 (chão) a x 1,5 (2,95 m); patamar de x 1,5 a 6
  kcEscadaF(M, 'kcFavelaEscadaTelhado', -3.5, 1.5, 2.6, 5.0, 'x', 0, 2.95, [[-3.5, 4.95], [1.5, 4.95]]);
  kcPatamar(M, 1.5, 6.0, 2.6, 5.0, 2.95);
  kcGuarda(M, 1.5, 4.98, 6.0, 4.98, 2.95); kcGuarda(M, 5.98, 2.6, 5.98, 5.0, 2.95);
  // segundo lance: no lado +x (x 3,6 a 6), sobe de z 2,6 (2,95 m) a z -2,5 (5,9 m); patamar no fundo até a laje
  kcEscadaF(M, 'kcFavelaEscadaTelhado', 3.6, 6.0, -2.5, 2.6, 'z', 5.9, 2.95, [[5.95, -2.5], [5.95, 2.6]]);
  kcPatamar(M, 3.6, 6.0, -5, -2.5, 5.9);
  kcGuarda(M, 5.98, -5, 5.98, -2.5, 5.9); kcGuarda(M, 3.6, -4.98, 6.0, -4.98, 5.9);
  kcCaixaAgua(M, -2.4, 5.9, -3.6); kcAntenaF(M, -2.9, 5.9, 1.9, 0.5); kcFerros(M, -3.5, 6.8, 2.5, 0.6);
  kcAr(M, -3.5, 4.0, 1.4, -Math.PI / 2);
});

// sobrado pequeno com escada nos fundos (7,5 x 6,4 x 7,6 m): em cima, o quarto fica na frente e o terraço no fundo;
// a escada (2,4 m) sobe atrás, de +x para -x, até um patamar no lado -x que dá no terraço
PF.kcFavelaEscadaFundos = () => prefab('kcFavelaEscadaFundos', (M) => {
  KC_ESCADAS.kcFavelaEscadaFundos = []; M.local(1);
  kcBloco(M, 'brick', KC_COR.tijolo, -2.5, 2.5, 0, 2.8, -2.5, 2.5); kcLajeB(M, -2.5, 2.5, 2.8, -2.5, 2.5);
  kcPintura(M, 'x', 2.5, 1, -2.5, 2.5, 0, 2.8, KC_COR.azulParede); kcPintura(M, 'z', 2.5, 1, -2.5, 2.5, 0, 2.8, KC_COR.azulParede);
  kcPorta(M, 'x', 2.5, 1, -0.5, 0.5, [0.32, 0.3, 0.28]); kcJanelaGrade(M, 'x', 2.5, 1, 1.0, 2.1, 1.0, 2.0); kcJanelaGrade(M, 'z', 2.5, 1, -1.5, -0.3, 1.0, 2.0);
  // quarto de cima, na frente
  kcBloco(M, 'brick', KC_COR.tijolo, -2.5, 2.5, 2.95, 5.75, 0, 2.5); kcLajeB(M, -2.5, 2.5, 5.75, 0, 2.5);
  kcJanelaGrade(M, 'x', 2.5, 1, -1.9, -0.7, 3.9, 4.9); kcJanelaGrade(M, 'z', 2.5, 1, 0.6, 1.8, 3.9, 4.9);
  M.cls = 1; M.color([0.22, 0.2, 0.18]); M.boxB('dark', -0.5, 0.5, 2.95, 5.05, -0.005, 0); M.cls = 0;
  kcCaixaAgua(M, 1.2, 5.9, 1.2); kcAntenaF(M, -1.8, 5.9, 1.6, 0.4);
  // terraço do fundo: mureta atrás e no lado +x (o lado -x fica aberto para o patamar)
  kcMureta(M, -2.6, 2.6, 2.95, -2.6, 0, 1.0, 'nl');
  // escada atrás do prédio (z -5 a -2,6), sobe de x 2,5 (chão) para x -2,5 (2,95 m); patamar no lado -x
  kcEscadaF(M, 'kcFavelaEscadaFundos', -2.5, 2.5, -5.0, -2.6, 'x', 2.95, 0, [[-2.5, -4.95], [2.5, -4.95]]);
  kcPatamar(M, -5.0, -2.5, -5.0, 0, 2.95);
  kcGuarda(M, -4.98, -5.0, -4.98, 0, 2.95); kcGuarda(M, -5.0, -4.98, -2.5, -4.98, 2.95); kcGuarda(M, -5.0, -0.02, -2.6, -0.02, 2.95);
  kcAr(M, -2.5, 4.2, 1.2, -Math.PI / 2);
});

/* ---------- Campo de várzea e mobiliário de rua ---------- */
// Praças pequenas: cada prefab inclui piso e mobiliário. Frente para +z; caminhos abertos nas bordas.
function kcPracaPiso(M, cor) {
  kcBloco(M, 'concrete', cor, -5, 5, 0, 0.08, -4, 4);
  M.cls = 1; M.color([0.6, 0.58, 0.54]);
  for (let x = -4; x <= 4; x += 2) M.boxB('paint', x - 0.015, x + 0.015, 0.081, 0.085, -4, 4);
  for (let z = -3; z <= 3; z += 2) M.boxB('paint', -5, 5, 0.081, 0.085, z - 0.015, z + 0.015);
  M.cls = 0;
}
function kcPracaBanco(M, x, z) {
  kcBloco(M, 'wood', KC_COR.madeira, x - 0.9, x + 0.9, 0.48, 0.56, z - 0.22, z + 0.22, 'wood');
  kcBloco(M, 'wood', KC_COR.madeira, x - 0.9, x + 0.9, 0.56, 0.95, z - 0.27, z - 0.19, 'wood');
  for (const dx of [-0.7, 0.7]) kcBloco(M, 'steel', KC_COR.ferro, x + dx - 0.05, x + dx + 0.05, 0.08, 0.48, z - 0.18, z + 0.18, 'steel');
}
function kcPracaArvore(M, x, z) {
  kcBloco(M, 'concrete', KC_COR.laje, x - 0.9, x + 0.9, 0.08, 0.35, z - 0.9, z + 0.9);
  M.cls = 1; M.color(KC_COR.terra); M.boxB('paint', x - 0.8, x + 0.8, 0.35, 0.36, z - 0.8, z + 0.8); M.cls = 0;
  M.color([0.34, 0.25, 0.17]); M.tube('wood', 0.18, [[x, 0.35, z], [x + 0.05, 2.7, z]], 10);
  M.col(x - 0.2, x + 0.2, 0.35, 2.7, z - 0.2, z + 0.2, 'wood');
  M.cls = 1;
  for (const [dx, dz] of [[-0.7, 0], [0.7, 0], [0, -0.6], [0, 0.6], [0, 0]]) {
    M.color(dx ? [0.24, 0.43, 0.19] : [0.3, 0.5, 0.23]); M.save().move(x + dx, 2.6, z + dz);
    M.lathe('canvas', [[0, 0], [0.8, 0.2], [1, 0.8], [0.8, 1.35], [0, 1.6]], 9); M.restore();
  }
  M.cls = 0;
}
function kcPracaLuz(M, x, z) {
  kcBloco(M, 'steel', KC_COR.ferro, x - 0.06, x + 0.06, 0.08, 3.3, z - 0.06, z + 0.06, 'steel');
  kcBloco(M, 'steel', KC_COR.ferro, x - 0.2, x + 0.2, 3.2, 3.35, z - 0.2, z + 0.2, 'steel');
  M.cls = 1; M.color([1, 0.93, 0.72]); M.boxB('lamp', x - 0.16, x + 0.16, 3.18, 3.2, z - 0.16, z + 0.16); M.cls = 0;
}
function kcPracaBordas(M) {
  kcPracaBanco(M, -3.6, -3); kcPracaBanco(M, 3.6, -3);
  kcPracaLuz(M, -4.6, 3.5); kcPracaLuz(M, 4.6, 3.5);
}
PF.kcPracaArvore = () => prefab('kcPracaArvore', (M) => {
  M.local(1); kcPracaPiso(M, [0.7, 0.68, 0.63]); kcPracaBordas(M); kcPracaArvore(M, 0, 0);
  for (const x of [-3.6, 3.6]) kcBloco(M, 'concrete', KC_COR.laje, x - 0.8, x + 0.8, 0.08, 0.4, 1.8, 3.2);
  M.cls = 1; M.color([0.25, 0.46, 0.2]); for (const x of [-3.6, 3.6]) M.boxB('canvas', x - 0.7, x + 0.7, 0.4, 0.48, 1.9, 3.1); M.cls = 0;
});
PF.kcPracaFonte = () => prefab('kcPracaFonte', (M) => {
  M.local(1); kcPracaPiso(M, [0.73, 0.71, 0.67]); kcPracaBordas(M);
  kcBloco(M, 'concrete', KC_COR.laje, -1.2, 1.2, 0.08, 0.65, -1.2, 1.2);
  M.cls = 1; M.color([0.28, 0.54, 0.64]); M.boxB('glass', -1.08, 1.08, 0.65, 0.67, -1.08, 1.08); M.cls = 0;
  kcBloco(M, 'concrete', KC_COR.concreto, -0.25, 0.25, 0.65, 1.25, -0.25, 0.25);
  M.cls = 1; M.color([0.66, 0.82, 0.88]); M.tube('glass', 0.04, [[0, 1.25, 0], [0, 1.7, 0], [0.3, 1.15, 0]], 6); M.cls = 0;
  kcPracaArvore(M, -3.5, 2.4); kcPracaArvore(M, 3.5, 2.4);
});
PF.kcPracaConvivio = () => prefab('kcPracaConvivio', (M) => {
  M.local(1); kcPracaPiso(M, [0.66, 0.65, 0.61]); kcPracaBordas(M);
  kcPracaArvore(M, -3.5, 2.4); kcPracaArvore(M, 3.5, 2.4);
  kcBloco(M, 'concrete', KC_COR.laje, -0.65, 0.65, 0.77, 0.85, -0.65, 0.65);
  kcBloco(M, 'concrete', KC_COR.concreto, -0.15, 0.15, 0.08, 0.77, -0.15, 0.15);
  for (const z of [-1.35, 1.35]) {
    kcBloco(M, 'wood', KC_COR.madeira, -0.7, 0.7, 0.48, 0.56, z - 0.2, z + 0.2, 'wood');
    for (const x of [-0.5, 0.5]) kcBloco(M, 'steel', KC_COR.ferro, x - 0.05, x + 0.05, 0.08, 0.48, z - 0.15, z + 0.15, 'steel');
  }
  M.cls = 1; M.color(KC_COR.branco); for (const x of [-0.25, 0, 0.25]) M.boxB('plastic', x - 0.07, x + 0.07, 0.85, 0.87, -0.035, 0.035); M.cls = 0;
});
PF.kcPracaParquinho = () => prefab('kcPracaParquinho', (M) => {
  M.local(1); kcPracaPiso(M, [0.69, 0.67, 0.62]); kcPracaBordas(M);
  kcPracaArvore(M, -3.5, 2.4); kcPracaArvore(M, 3.5, 2.4);
  // Estrutura aberta de balanço; correntes são visuais, assento e postes colidem.
  for (const x of [-1.6, 1.6]) kcBloco(M, 'steel', [0.2, 0.4, 0.7], x - 0.06, x + 0.06, 0.08, 2.3, -0.06, 0.06, 'steel');
  kcBloco(M, 'steel', KC_COR.vermelho, -1.66, 1.66, 2.2, 2.32, -0.07, 0.07, 'steel');
  M.cls = 1; M.color(KC_COR.ferro); for (const x of [-0.4, 0.4]) M.tube('steel', 0.015, [[x, 2.2, 0], [x, 0.65, 0]], 5);
  M.color(KC_COR.amarelo); M.boxB('plastic', -0.45, 0.45, 0.6, 0.67, -0.18, 0.18); M.cls = 0;
  M.col(-0.45, 0.45, 0.6, 0.67, -0.18, 0.18, 'wood');
});

PF.kcCampoFutebol = () => prefab('kcCampoFutebol', (M) => {
  M.local(1);
  // O terreno termina no nível zero; as linhas e as redes são apenas visuais.
  kcBloco(M, 'concrete', KC_COR.terra, -20, 20, -0.12, 0, -11, 11);
  M.color(KC_COR.branco); M.cls = 1;
  const linha = (x0, x1, z0, z1) => M.boxB('paint', x0, x1, 0.005, 0.012, z0, z1);
  for (const z of [-8.5, 8.5]) linha(-17.5, 17.5, z - 0.04, z + 0.04);
  for (const x of [-17.5, 0, 17.5]) linha(x - 0.04, x + 0.04, -8.5, 8.5);
  for (const s of [-1, 1]) {
    const a = Math.min(s * 17.5, s * 12.5), b = Math.max(s * 17.5, s * 12.5);
    for (const z of [-5, 5]) linha(a, b, z - 0.04, z + 0.04);
    linha(s * 12.5 - 0.04, s * 12.5 + 0.04, -5, 5);
    M.save().move(s * 14.5, 0.013, 0); M.cyl('paint', 0.1, 0.01, 12); M.restore();
  }
  const circulo = []; for (let i = 0; i <= 48; i++) { const a = i * Math.PI * 2 / 48; circulo.push([3 * Math.cos(a), 0.025, 3 * Math.sin(a)]); }
  M.tube('paint', 0.035, circulo, 4); M.cls = 0;
  // Traves: postes e travessão colidem; as malhas e os suportes de rede não.
  for (const s of [-1, 1]) {
    const x = s * 17.5, fundo = s * 19;
    M.color(KC_COR.branco);
    for (const z of [-2.5, 2.5]) kcBloco(M, 'steel', KC_COR.branco, x - 0.06, x + 0.06, 0, 2.15, z - 0.06, z + 0.06, 'steel');
    kcBloco(M, 'steel', KC_COR.branco, x - 0.06, x + 0.06, 2.03, 2.15, -2.56, 2.56, 'steel');
    M.cls = 1; M.color([0.78, 0.78, 0.74]);
    for (let z = -2.5; z <= 2.501; z += 0.25) M.tube('steel', 0.008, [[x, 2.08, z], [fundo, 1.8, z], [fundo, 0.05, z]], 4);
    for (let y = 0.1; y <= 1.81; y += 0.25) M.tube('steel', 0.008, [[x, y, -2.5], [fundo, y, -2.5], [fundo, y, 2.5], [x, y, 2.5]], 4);
    M.cls = 0;
  }
  // Alambrado com duas aberturas de 2,4 m, uma em cada lateral longa.
  const cerca = (x0, x1, z0, z1) => {
    M.color(KC_COR.ferro); M.boxB('steel', x0, x1, 2.44, 2.5, z0, z1);
    M.col(x0, x1, 0, 2.5, z0, z1, 'steel');
    M.cls = 1; M.color([0.58, 0.6, 0.59]);
    const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.3);
    for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t; M.tube('steel', 0.008, [[x, 0.05, z], [x, 2.45, z]], 4); }
    for (let y = 0.25; y < 2.5; y += 0.3) M.tube('steel', 0.008, [[x0, y, z0], [x1, y, z1]], 4);
    M.cls = 0;
  };
  for (const z of [-11, 11]) { cerca(-20, -1.2, z - 0.04, z + 0.04); cerca(1.2, 20, z - 0.04, z + 0.04); }
  for (const x of [-20, 20]) cerca(x - 0.04, x + 0.04, -11, 11);
  for (const x of [-20, -1.24, 1.24, 20]) for (const z of [-11, 11]) kcBloco(M, 'steel', KC_COR.ferro, x - 0.04, x + 0.04, 0, 2.5, z - 0.04, z + 0.04, 'steel');
  // Refletores e bancos de reservas, fora da área de jogo e afastados dos portões.
  for (const x of [-19, 19]) for (const z of [-10, 10]) {
    kcBloco(M, 'steel', KC_COR.ferro, x - 0.09, x + 0.09, 0, 7, z - 0.09, z + 0.09, 'steel');
    kcBloco(M, 'steel', KC_COR.ferro, x - 0.4, x + 0.4, 6.7, 7, z - 0.12, z + 0.12, 'steel');
    M.cls = 1; M.color([1, 0.94, 0.75]); M.boxB('lamp', x - 0.34, x + 0.34, 6.72, 6.94, z - 0.13, z + 0.13); M.cls = 0;
  }
  for (const s of [-1, 1]) {
    const z0 = s > 0 ? 11.3 : -13, z1 = s > 0 ? 13 : -11.3;
    for (const x of [5.5, 9.5]) for (const z of [z0, z1]) kcBloco(M, 'steel', KC_COR.ferro, x - 0.04, x + 0.04, 0, 2.2, z - 0.04, z + 0.04, 'steel');
    kcBloco(M, 'corrugated', [0.52, 0.55, 0.57], 5.3, 9.7, 2.15, 2.25, z0 - 0.1, z1 + 0.1, 'steel');
    kcBloco(M, 'wood', KC_COR.madeira, 5.6, 9.4, 0.4, 0.48, z0 + 0.55, z1 - 0.55, 'wood');
    for (const x of [5.8, 9.2]) kcBloco(M, 'steel', KC_COR.ferro, x - 0.04, x + 0.04, 0, 0.4, z0 + 0.65, z1 - 0.65, 'steel');
  }
});

// Com escada: girar somente de 90 em 90 graus. A escada e o patamar têm 2,4 m de largura.
PF.kcArquibancadaConcreto = () => prefab('kcArquibancadaConcreto', (M) => {
  KC_ESCADAS.kcArquibancadaConcreto = []; M.local(1);
  for (let i = 0; i < 3; i++) kcBloco(M, 'concrete', KC_COR.laje, -5.2, 2.8, 0, (i + 1) * 0.4, -3 + i * 1.2, -1.8 + i * 1.2);
  kcEscadaF(M, 'kcArquibancadaConcreto', 2.8, 5.2, -3, 0.6, 'z', 0, 1.2);
  kcPatamar(M, -5.2, 5.2, 0.6, 3, 1.2);
});

// Bancadas abertas: os balcões e postes são sólidos, deixando a frente acessível.
function kcQuiosqueRua(M, cor, faixa) {
  kcBloco(M, 'wood', cor, -1.5, 1.5, 0, 1.05, -0.45, 0.1, 'wood');
  for (const x of [-1.4, 1.4]) for (const z of [-0.7, 0.7]) kcBloco(M, 'steel', KC_COR.ferro, x - 0.04, x + 0.04, 0, 2.35, z - 0.04, z + 0.04, 'steel');
  kcBloco(M, 'canvas', faixa, -1.6, 1.6, 2.25, 2.35, -0.85, 0.85, 'wood');
  M.cls = 1; M.color(KC_COR.branco); M.boxB('paint', -1.25, 1.25, 1.88, 2.18, 0.7, 0.72); M.cls = 0;
}
PF.kcQuiosqueAcai = () => prefab('kcQuiosqueAcai', (M) => {
  M.local(1); kcQuiosqueRua(M, [0.37, 0.12, 0.43], [0.48, 0.19, 0.55]);
  M.cls = 1; M.color([0.64, 0.3, 0.7]); for (const x of [-0.9, -0.6, -0.3]) { M.save().move(x, 1.05, 0); M.cyl('plastic', 0.1, 0.18, 10); M.restore(); } M.cls = 0;
});
PF.kcChurrasquinho = () => prefab('kcChurrasquinho', (M) => {
  M.local(1); kcQuiosqueRua(M, [0.56, 0.2, 0.12], [0.8, 0.22, 0.12]);
  kcBloco(M, 'steel', KC_COR.ferro, -0.8, 0.8, 1.05, 1.18, -0.38, 0.02, 'steel');
  M.cls = 1; M.color([0.85, 0.77, 0.56]); for (let x = -0.7; x <= 0.7; x += 0.2) M.tube('wood', 0.012, [[x, 1.2, -0.45], [x, 1.2, 0.12]], 4); M.cls = 0;
});
PF.kcMototaxi = () => prefab('kcMototaxi', (M) => {
  M.local(1);
  for (const x of [-1.5, 1.5]) for (const z of [-0.7, 0.7]) kcBloco(M, 'steel', KC_COR.ferro, x - 0.04, x + 0.04, 0, 2.35, z - 0.04, z + 0.04, 'steel');
  kcBloco(M, 'canvas', KC_COR.amarelo, -1.65, 1.65, 2.25, 2.35, -0.85, 0.85, 'wood');
  kcBloco(M, 'wood', KC_COR.madeira, -1.2, 1.2, 0.42, 0.5, -0.65, -0.3, 'wood');
  for (const x of [-1, 1]) kcBloco(M, 'steel', KC_COR.ferro, x - 0.04, x + 0.04, 0, 0.42, -0.6, -0.35, 'steel');
  M.cls = 1; M.color([0.12, 0.12, 0.12]); M.boxB('paint', -1, 1, 1.9, 2.16, 0.7, 0.72); M.cls = 0;
});
PF.kcOrelhao = () => prefab('kcOrelhao', (M) => {
  M.local(1); kcBloco(M, 'steel', KC_COR.ferro, -0.09, 0.09, 0, 1.5, -0.09, 0.09, 'steel');
  kcBloco(M, 'plastic', [0.12, 0.46, 0.65], -0.45, 0.45, 1.25, 2.15, -0.35, -0.18, 'steel');
  kcBloco(M, 'plastic', [0.12, 0.46, 0.65], -0.45, -0.35, 1.25, 2.15, -0.35, 0.22, 'steel');
  kcBloco(M, 'plastic', [0.12, 0.46, 0.65], 0.35, 0.45, 1.25, 2.15, -0.35, 0.22, 'steel');
  kcBloco(M, 'plastic', [0.12, 0.46, 0.65], -0.45, 0.45, 2.05, 2.15, -0.35, 0.22, 'steel');
  kcBloco(M, 'plastic', [0.15, 0.15, 0.17], -0.18, 0.18, 1.35, 1.78, -0.18, -0.04, 'steel');
});
PF.kcLixeiraRua = () => prefab('kcLixeiraRua', (M) => {
  M.local(1); kcBloco(M, 'steel', KC_COR.ferro, -0.05, 0.05, 0, 1.25, -0.05, 0.05, 'steel');
  kcBloco(M, 'plastic', [0.18, 0.46, 0.24], -0.35, 0.35, 0.55, 1.2, -0.3, 0.3, 'steel');
  M.cls = 1; M.color(KC_COR.concretoEsc); M.boxB('dark', -0.28, 0.28, 1.2, 1.21, -0.23, 0.23); M.cls = 0;
});
PF.kcBancoPraca = () => prefab('kcBancoPraca', (M) => {
  M.local(1); kcBloco(M, 'wood', KC_COR.madeira, -1, 1, 0.42, 0.5, -0.25, 0.25, 'wood');
  kcBloco(M, 'wood', KC_COR.madeira, -1, 1, 0.5, 0.9, -0.28, -0.2, 'wood');
  for (const x of [-0.8, 0.8]) kcBloco(M, 'steel', KC_COR.ferro, x - 0.05, x + 0.05, 0, 0.42, -0.2, 0.2, 'steel');
});
PF.kcPosteGato = () => prefab('kcPosteGato', (M) => {
  M.local(1); kcBloco(M, 'concrete', KC_COR.concreto, -0.16, 0.16, 0, 7, -0.16, 0.16);
  kcBloco(M, 'wood', KC_COR.madeira, -0.9, 0.9, 6.5, 6.62, -0.07, 0.07, 'wood');
  M.cls = 1; M.color([0.08, 0.08, 0.08]);
  for (let i = 0; i < 9; i++) { const x = -0.8 + i * 0.2; M.tube('rubber', 0.015, [[x, 6.6, 0], [x * 0.5, 5.1 + (i % 3) * 0.2, 0.3], [-x * 0.3, 4.2, -0.18], [x, 3.6, 0.16]], 5); }
  M.cls = 0;
});
PF.kcMesaDomino = () => prefab('kcMesaDomino', (M) => {
  M.local(1); kcBloco(M, 'wood', KC_COR.madeira, -0.6, 0.6, 0.72, 0.8, -0.6, 0.6, 'wood');
  for (const x of [-0.48, 0.48]) for (const z of [-0.48, 0.48]) kcBloco(M, 'wood', KC_COR.madeira, x - 0.04, x + 0.04, 0, 0.72, z - 0.04, z + 0.04, 'wood');
  for (const z of [-1, 1]) { kcBloco(M, 'wood', KC_COR.madeira, -0.7, 0.7, 0.4, 0.48, z - 0.2, z + 0.2, 'wood'); for (const x of [-0.55, 0.55]) kcBloco(M, 'wood', KC_COR.madeira, x - 0.04, x + 0.04, 0, 0.4, z - 0.14, z + 0.14, 'wood'); }
  M.cls = 1; M.color(KC_COR.branco); for (const [x, z] of [[-0.2, 0], [0, 0.1], [0.2, -0.1]]) M.boxB('plastic', x - 0.07, x + 0.07, 0.8, 0.82, z - 0.035, z + 0.035); M.cls = 0;
});
PF.kcCarrinhoPipoca = () => prefab('kcCarrinhoPipoca', (M) => {
  M.local(1); kcBloco(M, 'paint', KC_COR.vermelho, -0.7, 0.7, 0.25, 1.1, -0.4, 0.4, 'steel');
  kcBloco(M, 'glass', [0.6, 0.75, 0.8], -0.55, 0.55, 1.1, 1.8, -0.3, 0.3, 'steel');
  kcBloco(M, 'paint', KC_COR.vermelho, -0.7, 0.7, 1.8, 1.9, -0.4, 0.4, 'steel');
  for (const x of [-0.55, 0.55]) for (const z of [-0.42, 0.42]) { M.save().move(x, 0.22, z).rotX(Math.PI / 2); M.color(KC_COR.ferro); M.cyl('rubber', 0.22, 0.08, 12); M.restore(); M.col(x - 0.22, x + 0.22, 0, 0.44, z - 0.08, z + 0.08, 'steel'); }
});
PF.kcFliperamaBar = () => prefab('kcFliperamaBar', (M) => {
  M.local(1); kcBloco(M, 'wood', [0.36, 0.23, 0.16], -1.8, 0.6, 0, 1.05, -0.45, 0.35, 'wood');
  kcBloco(M, 'wood', [0.2, 0.18, 0.25], 0.8, 1.6, 0, 1.8, -0.5, 0.35, 'wood');
  M.cls = 1; M.color([0.14, 0.48, 0.62]); M.boxB('glass', 0.9, 1.5, 1.05, 1.55, 0.35, 0.36);
  M.color(KC_COR.amarelo); M.boxB('paint', 0.9, 1.5, 1.62, 1.75, 0.35, 0.36); M.color(KC_COR.vermelho); M.boxB('plastic', 1.05, 1.12, 0.98, 1.04, 0.35, 0.4); M.cls = 0;
});

// quadra de futsal de cimento pintado, 30 x 18 m (jogo de 28 x 16): linhas brancas, duas traves com rede (os postes colidem)
PF.kcQuadra = () => prefab('kcQuadra', (M) => {
  M.local(1); const X = 14, Z = 8, l = 0.08;
  M.color([0.3, 0.42, 0.5]); M.boxB('concrete', -X - 1, X + 1, 0, 0.02, -Z - 1, Z + 1);
  M.color([0.32, 0.52, 0.4]); M.boxB('concrete', -X, X, 0.02, 0.025, -Z, Z);
  M.cls = 1; M.color([0.95, 0.95, 0.93]);
  const linha = (x0, x1, z0, z1) => M.boxB('paint', x0, x1, 0.025, 0.03, z0, z1);
  linha(-X, X, -Z, -Z + l); linha(-X, X, Z - l, Z); linha(-X, -X + l, -Z, Z); linha(X - l, X, -Z, Z); linha(-l / 2, l / 2, -Z, Z);
  M.save().move(0, 0.025, 0); M.lathe('paint', [[2.9, 0], [3.0, 0], [3.0, 0.005], [2.9, 0.005]], 32); M.restore();
  for (const s of [-1, 1]) {
    const xg = s * X;
    linha(Math.min(xg, xg - s * 6), Math.max(xg, xg - s * 6), -3, -3 + l); linha(Math.min(xg, xg - s * 6), Math.max(xg, xg - s * 6), 3 - l, 3); linha(xg - s * 6 - l / 2, xg - s * 6 + l / 2, -3, 3);
    M.boxB('paint', xg - s * 6 - 0.1, xg - s * 6 + 0.1, 0.025, 0.031, -0.1, 0.1);
  }
  M.cls = 0;
  // traves (3 x 2 m) com rede
  for (const s of [-1, 1]) {
    const xg = s * X, fundo = xg + s * 1.0;
    M.color([0.95, 0.95, 0.93]);
    for (const z of [-1.5, 1.5]) { M.boxB('steel', xg - 0.04, xg + 0.04, 0, 2.0, z - 0.04, z + 0.04); M.col(xg - 0.05, xg + 0.05, 0, 2.0, z - 0.05, z + 0.05, 'steel'); }
    M.boxB('steel', xg - 0.04, xg + 0.04, 1.96, 2.04, -1.54, 1.54); M.col(xg - 0.05, xg + 0.05, 1.95, 2.05, -1.55, 1.55, 'steel');
    M.cls = 1; M.color([0.85, 0.85, 0.85]);
    for (let i = 0; i <= 15; i++) { const z = -1.5 + i * 0.2; M.tube('steel', 0.006, [[xg, 2.0, z], [fundo, 1.2, z], [fundo, 0, z]], 3); }
    for (let k = 0; k <= 5; k++) { const y = k * 0.4; M.boxB('steel', Math.min(xg, fundo), Math.max(xg, fundo), y - 0.005, y + 0.005, -1.5, -1.49); M.boxB('steel', Math.min(xg, fundo), Math.max(xg, fundo), y - 0.005, y + 0.005, 1.49, 1.5); }
    M.cls = 0;
  }
});

/* ---------- pacote 7: o navio (base do mapa Navio) ----------
   kcNavio: casco de iate de 106 x 20,4 m (proa em +z, popa em -z), convés principal andável em y = 0, borda falsa sólida de
   1,05 m e parede invisível por cima até 4,5 m (ninguém pula no mar). A linha d'água fica em y = -4,3 (o "mar" do mapa).
   Paredes invisíveis de prefab: KC_INVIS[nome] (coordenadas da peça), montadas pelo mapa-json.js como as escadas. */
const KC_INVIS = {};
const KC_CASCO = [ // [t (0 popa, 1 proa), meia-largura (fração), borda (m acima da linha d'água), fim do costado reto, quilha, arredondamento]
  [0.0, 0.93, 5.35, 0.9, -0.6, 6], [0.05, 0.98, 5.35, 0.5, -1.8, 4.6], [0.2, 1.0, 5.35, 0.3, -2.7, 3.6], [0.6, 1.0, 5.4, 0.3, -2.9, 3.3],
  [0.75, 0.95, 5.5, 0.4, -2.8, 2.9], [0.86, 0.78, 5.7, 0.7, -2.5, 2.4], [0.94, 0.47, 6.0, 1.3, -1.7, 1.9], [1.0, 0.03, 6.3, 2.4, 0.1, 1.4],
];
const KC_NAVIO = { L: 106, B: 20.4, WL: -4.3, z0: -53 };
const kcNavioHW = (z) => hullAt(KC_CASCO, clamp((z - KC_NAVIO.z0) / KC_NAVIO.L, 0, 1), KC_NAVIO.B / 2).hw;
function kcNavioF(M, nome, abertura) {
  KC_INVIS[nome] = []; M.local(1);
  const N = KC_NAVIO, branco = [0.95, 0.95, 0.94], azul = [0.08, 0.16, 0.36];
  M.save().move(0, N.WL, 0);
  hullBody(M, KC_CASCO, { L: N.L, B: N.B, deck: -N.WL - (abertura ? 3.15 : 0.34), thick: 0.14, nv: 40, hull: branco, boot: azul, stripe: azul, inner: branco, rail: [0.62, 0.45, 0.3], deckTint: [0.5, 0.5, 0.5], gaps: abertura ? [[0, -5, 5]] : [], noCol: true });
  M.restore();
  // convés de madeira (faixas de 1 m), borda falsa sólida e parede invisível por cima
  for (let z = N.z0; z < N.z0 + N.L; z++) {
    const hw = Math.max(kcNavioHW(z), kcNavioHW(z + 1)) + 0.05, w = Math.min(kcNavioHW(z), kcNavioHW(z + 1)) - 0.14;
    if (w > 0.25) { M.color([0.66, 0.47, 0.3]);
      const faixas = abertura && z >= -3 && z < 3 ? [[-w, -1.3], [1.3, w]] : [[-w, w]];
      for (const [x0, x1] of faixas) { M.boxB('wood', x0, x1, -0.3, 0, z, z + 1); M.col(x0, x1, -0.3, 0, z, z + 1, 'wood'); }
    }
    const wi = Math.max(0, w);
    for (const sd of [-1, 1]) {
      const a = sd > 0 ? wi : -hw, b = sd > 0 ? hw : -wi;
      M.col(a, b, 0, 1.05, z, z + 1, 'metal');
      KC_INVIS[nome].push([a, b, 1.05, 4.5, z, z + 1]);
    }
  }
  // popa fechada (borda e parede invisível) e ponta da proa
  const hp = kcNavioHW(N.z0) + 0.05;
  M.col(-hp, hp, 0, 1.05, N.z0 - 0.15, N.z0 + 0.02, 'metal'); KC_INVIS[nome].push([-hp, hp, 0, 4.5, N.z0 - 0.2, N.z0 + 0.02]);
  M.color(branco); M.boxB('paint', -hp, hp, -0.3, 1.05, N.z0 - 0.15, N.z0 + 0.02);
  KC_INVIS[nome].push([-1.5, 1.5, 0, 4.5, N.z0 + N.L - 0.5, N.z0 + N.L + 0.2]);
}
PF.kcNavio = () => prefab('kcNavio', (M) => kcNavioF(M, 'kcNavio', false));
// Casco com abertura central: parede invisível e escada exigem giro de 90 em 90 graus.
PF.kcNavioComAbertura = () => prefab('kcNavioComAbertura', (M) => kcNavioF(M, 'kcNavioComAbertura', true));

/* ---------- módulos de arquitetura do iate ---------- */
const KC_NW = [0.95, 0.95, 0.94], KC_NT = [0.66, 0.46, 0.3], KC_NI = [0.86, 0.87, 0.89], KC_NA = [0.08, 0.16, 0.36];
function kcNArqB(M, mat, cor, x0, x1, y0, y1, z0, z1, tipo = 'metal') {
  M.color(cor); M.boxB(mat, x0, x1, y0, y1, z0, z1); M.col(x0, x1, y0, y1, z0, z1, tipo);
}
function kcNPiso(M, x0, x1, z0, z1, y = 0) { kcNArqB(M, 'wood', KC_NT, x0, x1, y - 0.15, y, z0, z1, 'wood'); }
function kcNGuardArq(M, x0, x1, z0, z1, y = 0) { // guarda-corpo do navio: sem colisão, como todos os corrimãos
  M.color(KC_NI); M.boxB('steel', x0, x1, y, y + 1.05, z0, z1);
}
// Uma faixa de janelas com peitoril, montantes e painéis iaVidro destrutíveis.
function kcNFaixa(M, nome, eixo, fixo, a0, a1) {
  const B = (a, b, y0, y1) => eixo === 'x' ? kcNArqB(M, 'paint', KC_NW, a, b, y0, y1, fixo - 0.1, fixo + 0.1) : kcNArqB(M, 'paint', KC_NW, fixo - 0.1, fixo + 0.1, y0, y1, a, b);
  B(a0, a1, 0, 0.7); B(a0, a1, 2.5, 2.85);
  const n = Math.ceil((a1 - a0) / 1.8), w = (a1 - a0) / n;
  for (let i = 0; i <= n; i++) { const a = a0 + i * w; B(Math.max(a0, a - 0.05), Math.min(a1, a + 0.05), 0.7, 2.5); }
  for (let i = 0; i < n; i++) { const a = a0 + (i + 0.5) * w; KC_VIDROS[nome].push(eixo === 'x' ? [a, 0.7, fixo, w - 0.1, 1.8, 0] : [fixo, 0.7, a, w - 0.1, 1.8, Math.PI / 2]); }
}
function kcNModulo(M, nome, X, Z, vidro) {
  kcNPiso(M, -X, X, -Z, Z); kcNArqB(M, 'paint', KC_NW, -X, X, 2.85, 3, -Z, Z);
  for (const x of [-X + 0.1, X - 0.1]) {
    if (vidro) kcNFaixa(M, nome, 'z', x, -Z, Z);
    else kcNArqB(M, 'paint', KC_NW, x - 0.1, x + 0.1, 0, 2.85, -Z, Z);
  }
  for (const z of [-Z + 0.1, Z - 0.1]) {
    if (vidro) { kcNFaixa(M, nome, 'x', z, -X, -1.2); kcNFaixa(M, nome, 'x', z, 1.2, X); }
    else { kcNArqB(M, 'paint', KC_NW, -X, -1.2, 0, 2.85, z - 0.1, z + 0.1); kcNArqB(M, 'paint', KC_NW, 1.2, X, 0, 2.85, z - 0.1, z + 0.1); }
    kcNArqB(M, 'paint', KC_NW, -1.2, 1.2, 2.3, 2.85, z - 0.1, z + 0.1);
  }
}
PF.kcNModuloSala6x8 = () => prefab('kcNModuloSala6x8', (M) => { KC_VIDROS.kcNModuloSala6x8 = []; M.local(1); kcNModulo(M, 'kcNModuloSala6x8', 3, 4, true); });
PF.kcNModuloSala8x12 = () => prefab('kcNModuloSala8x12', (M) => { KC_VIDROS.kcNModuloSala8x12 = []; M.local(1); kcNModulo(M, 'kcNModuloSala8x12', 4, 6, true); });
PF.kcNModuloFechado6x6 = () => prefab('kcNModuloFechado6x6', (M) => { M.local(1); kcNModulo(M, '', 3, 3, false); });
PF.kcNModuloCanto = () => prefab('kcNModuloCanto', (M) => {
  KC_VIDROS.kcNModuloCanto = []; M.local(1);
  // Semicírculo em +z, construído em faixas; a abertura de 2,4 m fica na face reta.
  for (let i = 0; i < 16; i++) { const z0 = -2 + i * 0.25, z1 = z0 + 0.25, z = z1 + 2, w = Math.sqrt(Math.max(0, 16 - z * z));
    if (w > 0.05) { kcNPiso(M, -w, w, z0, z1); kcNArqB(M, 'paint', KC_NW, -w, w, 2.85, 3, z0, z1); }
  }
  for (const x of [-1, 1]) for (let i = 0; i < 8; i++) { const a = i * Math.PI / 16, b = (i + 1) * Math.PI / 16, mid = (a + b) / 2;
    const x0 = x * 3.9 * Math.cos(a), z0 = -2 + 3.9 * Math.sin(a), x1 = x * 3.9 * Math.cos(b), z1 = -2 + 3.9 * Math.sin(b);
    const ax = Math.min(x0, x1), bx = Math.max(x0, x1), az = Math.min(z0, z1), bz = Math.max(z0, z1);
    kcNArqB(M, 'paint', KC_NW, ax - 0.05, bx + 0.05, 0, 0.7, az - 0.05, bz + 0.05);
    kcNArqB(M, 'paint', KC_NW, x0 - 0.06, x0 + 0.06, 0.7, 2.85, z0 - 0.06, z0 + 0.06);
    KC_VIDROS.kcNModuloCanto.push([x * 3.9 * Math.cos(mid), 0.7, -2 + 3.9 * Math.sin(mid), 3.9 * (b - a) - 0.08, 1.8, -x * mid - Math.PI / 2]);
  }
  for (const [a, b] of [[-4, -1.2], [1.2, 4]]) kcNArqB(M, 'paint', KC_NW, a, b, 0, 2.85, -2, -1.8);
  kcNArqB(M, 'paint', KC_NW, -1.2, 1.2, 2.3, 2.85, -2, -1.8);
});
function kcNVaranda(M, L) {
  kcNPiso(M, -L / 2, L / 2, -1.25, 1.25); kcNGuardArq(M, -L / 2, L / 2, 1.19, 1.25);
  for (const x of [-L / 2, L / 2 - 0.06]) kcNGuardArq(M, x, x + 0.06, -1.25, 1.25);
}
PF.kcNVaranda6 = () => prefab('kcNVaranda6', (M) => { M.local(1); kcNVaranda(M, 6); });
PF.kcNVaranda10 = () => prefab('kcNVaranda10', (M) => { M.local(1); kcNVaranda(M, 10); });
PF.kcNDequeSolario = () => prefab('kcNDequeSolario', (M) => {
  M.local(1); kcNPiso(M, -5, 5, -6, 6); kcNGuardArq(M, -5, 5, -6, -5.94); kcNGuardArq(M, -5, 5, 5.94, 6);
  for (const x of [-5, 4.94]) { kcNGuardArq(M, x, x + 0.06, -6, -1.2); kcNGuardArq(M, x, x + 0.06, 1.2, 6); }
  for (const x of [-3.2, 3.2]) kcNArqB(M, 'canvas', KC_NW, x - 0.4, x + 0.4, 0, 0.45, -1, 1, 'wood');
});
// Com escada: giro apenas de 90 em 90 graus. Colocar em y=-1,2; patamar superior em y=0.
PF.kcNDequePopa = () => prefab('kcNDequePopa', (M) => {
  KC_ESCADAS.kcNDequePopa = []; KC_INVIS.kcNDequePopa = []; M.local(1);
  kcNPiso(M, -5, 5, -3, -1.5); kcEscadaF(M, 'kcNDequePopa', -1.2, 1.2, -1.5, 0.6, 'z', 0, 1.2);
  for (const [x0, x1] of [[-5, -1.2], [1.2, 5]]) { kcNArqB(M, 'paint', KC_NW, x0, x1, 0, 0.4, -1.5, -0.45); kcNArqB(M, 'paint', KC_NW, x0, x1, 0, 0.8, -0.45, 0.6); }
  kcNArqB(M, 'paint', KC_NW, -5, 5, 0, 1.2, 0.6, 3); kcNGuardArq(M, -5, -4.94, -3, 3, 1.2); kcNGuardArq(M, 4.94, 5, -3, 3, 1.2);
  KC_INVIS.kcNDequePopa.push([-5, 5, 0, 4.5, -3, -2.95], [-5, -4.94, 0, 1.2, -3, 3], [4.94, 5, 0, 1.2, -3, 3]);
});

// Escada de poço: y=-3, em x=0 e z=0 do casco com abertura; patamar avança para +z. Giro de 90 em 90 graus.
PF.kcNEscadaInterna = () => prefab('kcNEscadaInterna', (M) => {
  KC_ESCADAS.kcNEscadaInterna = []; M.local(1);
  kcEscadaF(M, 'kcNEscadaInterna', -1.2, 1.2, -3, 2.1, 'z', 0, 3);
  kcPatamar(M, -1.2, 1.2, 2.1, 4.5, 3);
  for (const x of [-1.4, 1.2]) kcNArqB(M, 'paint', KC_NW, x, x + 0.2, 0, 3, -3, 2.1);
});
// Escada externa: colocar em y=0 ou y=3 e encostar o patamar na laje; giro de 90 em 90 graus.
PF.kcNEscadaExterna = () => prefab('kcNEscadaExterna', (M) => {
  KC_ESCADAS.kcNEscadaExterna = []; M.local(1);
  kcEscadaF(M, 'kcNEscadaExterna', -1.2, 1.2, -3.75, 1.35, 'z', 0, 3);
  kcPatamar(M, -1.2, 1.2, 1.35, 3.75, 3);
  kcNArqB(M, 'steel', KC_NI, -1.26, -1.2, 3, 4.05, 1.35, 3.75);
});
PF.kcNEscadaCaracol = () => prefab('kcNEscadaCaracol', (M) => {
  M.local(1); M.color(KC_NI); M.cyl('steel', 0.12, 3, 12);
  M.cls = 1; for (let i = 0; i < 12; i++) { M.save().rotY(i * Math.PI / 6); M.color(i % 2 ? KC_NW : KC_NT); M.boxB('wood', 0.12, 1.05, i * 0.23, i * 0.23 + 0.08, -0.18, 0.18); M.restore(); } M.cls = 0;
  // Bloqueio integral impede que a escada decorativa pareça uma rota utilizável.
  M.col(-1.05, 1.05, 0, 3, -1.05, 1.05, 'metal');
});
PF.kcNCorredor = () => prefab('kcNCorredor', (M) => {
  M.local(1); kcNPiso(M, -1.3, 1.3, -3, 3); kcNArqB(M, 'paint', KC_NW, -1.3, 1.3, 2.85, 3, -3, 3);
  for (const x of [-1.5, 1.3]) kcNArqB(M, 'paint', KC_NW, x, x + 0.2, 0, 2.85, -3, 3);
});
PF.kcNCabine = () => prefab('kcNCabine', (M) => {
  M.local(1); kcNPiso(M, -2, 2, -3, 3); kcNArqB(M, 'paint', KC_NW, -2, 2, 2.85, 3, -3, 3);
  for (const x of [-2, 1.8]) kcNArqB(M, 'paint', KC_NW, x, x + 0.2, 0, 2.85, -3, 3);
  kcNArqB(M, 'paint', KC_NW, -2, 2, 0, 2.85, -3, -2.8);
  for (const [x0, x1] of [[-2, -1.2], [1.2, 2]]) kcNArqB(M, 'paint', KC_NW, x0, x1, 0, 2.85, 2.8, 3);
  kcNArqB(M, 'paint', KC_NW, -1.2, 1.2, 2.3, 2.85, 2.8, 3);
  kcNArqB(M, 'wood', KC_NT, -1.8, 0, 0, 0.5, -2.7, -0.7, 'wood');
  kcNArqB(M, 'paint', KC_NW, 0.8, 1.8, 0, 2.2, -2.8, -2.15);
});
// A abertura da garagem tem parede invisível: girar de 90 em 90 graus.
PF.kcNGaragemLanchas = () => prefab('kcNGaragemLanchas', (M) => {
  KC_INVIS.kcNGaragemLanchas = []; M.local(1); kcNPiso(M, -5, 5, -6, 6); kcNArqB(M, 'paint', KC_NW, -5, 5, 2.85, 3, -6, 6);
  for (const x of [-5, 4.8]) kcNArqB(M, 'paint', KC_NW, x, x + 0.2, 0, 2.85, -6, 6);
  for (const [x0, x1] of [[-5, -1.2], [1.2, 5]]) kcNArqB(M, 'paint', KC_NW, x0, x1, 0, 2.85, 5.8, 6);
  kcNArqB(M, 'paint', KC_NW, -1.2, 1.2, 2.3, 2.85, 5.8, 6);
  for (const x of [-3.5, 3.5]) for (const z of [-3, 0, 3]) kcNArqB(M, 'steel', KC_NI, x - 0.9, x + 0.9, 0, 0.35, z - 0.15, z + 0.15);
  KC_INVIS.kcNGaragemLanchas.push([-5, 5, 0, 4.5, -6, -5.95]);
});
PF.kcNSalaMaquinas = () => prefab('kcNSalaMaquinas', (M) => {
  M.local(1); kcNModulo(M, '', 4, 4, false);
  for (const x of [-2.4, 2.4]) { kcNArqB(M, 'steel', [0.45, 0.48, 0.5], x - 0.7, x + 0.7, 0, 1.3, -1.5, 1.5);
    kcNArqB(M, 'paint', KC_NA, x - 0.55, x + 0.55, 1.3, 1.6, -1.1, 1.1); }
});
// Tampo recortado: colocá-lo sobre um casco que já possua abertura, pois não recorta outros prefabs.
PF.kcNConvesBuraco = () => prefab('kcNConvesBuraco', (M) => {
  M.local(1); kcNPiso(M, -3, -1.3, -3, 3); kcNPiso(M, 1.3, 3, -3, 3);
});
PF.kcNBordaVidro = () => prefab('kcNBordaVidro', (M) => {
  M.local(1); kcNArqB(M, 'glass', [0.32, 0.42, 0.48], -2, 2, 0, 1, -0.05, 0.05, 'glass');
  kcNArqB(M, 'steel', KC_NI, -2, 2, 1, 1.05, -0.07, 0.07);
});
PF.kcNPortaCorrer = () => prefab('kcNPortaCorrer', (M) => {
  M.local(1); for (const x of [-2, 1.8]) kcNArqB(M, 'paint', KC_NW, x, x + 0.2, 0, 2.8, -0.1, 0.1);
  kcNArqB(M, 'paint', KC_NW, -2, 2, 2.6, 2.8, -0.1, 0.1);
  for (const [x0, x1] of [[-1.8, -1.2], [1.2, 1.8]]) kcNArqB(M, 'glass', [0.32, 0.42, 0.48], x0, x1, 0, 2.6, -0.05, 0.05, 'glass');
});
PF.kcNParedeJanela4 = () => prefab('kcNParedeJanela4', (M) => {
  KC_VIDROS.kcNParedeJanela4 = []; M.local(1); kcNFaixa(M, 'kcNParedeJanela4', 'x', 0, -2, 2);
});
PF.kcNParedeLisa4 = () => prefab('kcNParedeLisa4', (M) => {
  M.local(1); kcNArqB(M, 'paint', KC_NW, -2, 2, 0, 2.85, -0.1, 0.1);
});

/* ---------- kit de iate: peças independentes para o convés ---------- */
const KC_VIDROS = {}; // [x, y, z, largura, altura, giro], painéis dinâmicos montados pelo mapa-json.js
const KC_NBRANCO = [0.93, 0.94, 0.92], KC_NAZUL = [0.12, 0.23, 0.38], KC_NTECA = [0.65, 0.46, 0.29];
function kcNB(M, mat, cor, x0, x1, y0, y1, z0, z1, tipo = 'metal') {
  M.color(cor); M.boxB(mat, x0, x1, y0, y1, z0, z1); M.col(x0, x1, y0, y1, z0, z1, tipo);
}
// Faixa envidraçada: cada painel é um iaVidro destrutível, entre montantes sólidos.
function kcNJanela(M, nome, eixo, fixo, a0, a1) {
  const B = (a, b, y0, y1) => eixo === 'x' ? kcNB(M, 'paint', KC_NBRANCO, a, b, y0, y1, fixo - 0.08, fixo + 0.08) : kcNB(M, 'paint', KC_NBRANCO, fixo - 0.08, fixo + 0.08, y0, y1, a, b);
  B(a0, a1, 0, 0.75); B(a0, a1, 2.5, 2.8);
  const n = Math.ceil((a1 - a0) / 1.8), w = (a1 - a0) / n;
  for (let i = 0; i <= n; i++) { const a = a0 + i * w; B(Math.max(a0, a - 0.06), Math.min(a1, a + 0.06), 0.75, 2.5); }
  for (let i = 0; i < n; i++) { const a = a0 + (i + 0.5) * w; KC_VIDROS[nome].push(eixo === 'x' ? [a, 0.75, fixo, w - 0.12, 1.75, 0] : [fixo, 0.75, a, w - 0.12, 1.75, Math.PI / 2]); }
}
function kcNPredio(M, nome, X, Z, vidro) {
  kcNB(M, 'paint', KC_NBRANCO, -X, X, 2.8, 2.95, -Z, Z);
  for (const x of [-X + 0.08, X - 0.08]) {
    if (vidro) kcNJanela(M, nome, 'z', x, -Z, Z);
    else kcNB(M, 'paint', KC_NBRANCO, x - 0.08, x + 0.08, 0, 2.8, -Z, Z);
  }
  for (const z of [-Z + 0.08, Z - 0.08]) {
    if (vidro) { kcNJanela(M, nome, 'x', z, -X, -1.2); kcNJanela(M, nome, 'x', z, 1.2, X); }
    else { kcNB(M, 'paint', KC_NBRANCO, -X, -1.2, 0, 2.8, z - 0.08, z + 0.08); kcNB(M, 'paint', KC_NBRANCO, 1.2, X, 0, 2.8, z - 0.08, z + 0.08); }
    kcNB(M, 'paint', KC_NBRANCO, -1.2, 1.2, 2.2, 2.8, z - 0.08, z + 0.08);
  }
}
PF.kcNSalao = () => prefab('kcNSalao', (M) => { KC_VIDROS.kcNSalao = []; M.local(1); kcNPredio(M, 'kcNSalao', 5.5, 7, true); });
PF.kcNPonte = () => prefab('kcNPonte', (M) => {
  KC_VIDROS.kcNPonte = []; M.local(1); kcNPredio(M, 'kcNPonte', 4, 3, true);
  kcNB(M, 'paint', KC_NAZUL, -2.4, 2.4, 0, 1, 1.55, 2.15);
  M.cls = 1; M.color([0.18, 0.55, 0.66]); for (const x of [-1.5, 0, 1.5]) M.boxB('glass', x - 0.45, x + 0.45, 1.01, 1.03, 1.62, 2.05);
  M.color(KC_COR.ferro); M.tube('steel', 0.035, [[0, 1.05, 1.5], [0, 1.3, 1.25]], 8); M.save().move(0, 1.3, 1.25).rotX(Math.PI / 2); M.lathe('steel', [[0.28, 0], [0.32, 0], [0.32, 0.04], [0.28, 0.04]], 16); M.restore(); M.cls = 0;
});
PF.kcNCassino = () => prefab('kcNCassino', (M) => {
  M.local(1); kcNPredio(M, 'kcNCassino', 5.5, 8, false);
  for (const z of [-3.5, 3.5]) {
    kcNB(M, 'wood', KC_NTECA, -1.2, 1.2, 0.7, 0.82, z - 0.7, z + 0.7, 'wood');
    for (const x of [-0.9, 0.9]) kcNB(M, 'wood', KC_NTECA, x - 0.08, x + 0.08, 0, 0.7, z - 0.08, z + 0.08, 'wood');
    M.cls = 1; M.color([0.12, 0.42, 0.25]); M.boxB('canvas', -1.1, 1.1, 0.82, 0.84, z - 0.6, z + 0.6); M.cls = 0;
  }
});
// Escada externa até y=2,95; gire somente de 90 em 90 graus. O patamar deve encostar na laje do prédio.
PF.kcNEscada = () => prefab('kcNEscada', (M) => {
  KC_ESCADAS.kcNEscada = []; M.local(1);
  kcEscadaF(M, 'kcNEscada', -1.2, 1.2, -3.75, 1.35, 'z', 0, 2.95);
  kcPatamar(M, -1.2, 1.2, 1.35, 3.75, 2.95);
  kcNB(M, 'steel', KC_COR.ferro, -1.26, -1.2, 2.95, 3.95, 1.35, 3.75);
});

PF.kcNPiscina = () => prefab('kcNPiscina', (M) => {
  M.local(1); kcNB(M, 'paint', KC_NBRANCO, -3, 3, 0, 0.2, -2, 2);
  for (const x of [-2.85, 2.85]) kcNB(M, 'paint', KC_NBRANCO, x - 0.15, x + 0.15, 0.2, 0.85, -2, 2);
  for (const z of [-1.85, 1.85]) kcNB(M, 'paint', KC_NBRANCO, -2.7, 2.7, 0.2, 0.85, z - 0.15, z + 0.15);
  M.cls = 1; M.color([0.17, 0.59, 0.7]); M.boxB('glass', -2.7, 2.7, 0.55, 0.57, -1.7, 1.7); M.cls = 0;
});
PF.kcNEspreguicadeira = () => prefab('kcNEspreguicadeira', (M) => {
  M.local(1); kcNB(M, 'wood', KC_NTECA, -0.4, 0.4, 0.25, 0.38, -1, 1, 'wood');
  kcNB(M, 'canvas', KC_NBRANCO, -0.36, 0.36, 0.38, 0.48, -0.95, 0.9, 'wood');
  kcNB(M, 'canvas', KC_NBRANCO, -0.36, 0.36, 0.48, 0.85, -1, -0.72, 'wood');
});
PF.kcNGuardaSol = () => prefab('kcNGuardaSol', (M) => {
  M.local(1); kcNB(M, 'steel', KC_COR.ferro, -0.05, 0.05, 0, 2.35, -0.05, 0.05);
  M.color(KC_NBRANCO); M.lathe('canvas', [[0, 2.5], [1.3, 2.1], [1.3, 2.02]], 16); M.col(-1.3, 1.3, 2.02, 2.5, -1.3, 1.3, 'wood');
});
PF.kcNBar = () => prefab('kcNBar', (M) => {
  M.local(1); kcNB(M, 'paint', KC_NBRANCO, -1.8, 1.8, 0, 1.05, -0.5, 0.5);
  kcNB(M, 'wood', KC_NTECA, -1.9, 1.9, 1.05, 1.14, -0.6, 0.6, 'wood');
  M.cls = 1; M.color(KC_NAZUL); for (const x of [-1, -0.5, 0, 0.5, 1]) M.boxB('glass', x - 0.06, x + 0.06, 1.14, 1.42, -0.1, 0.1); M.cls = 0;
});
PF.kcNSofa = () => prefab('kcNSofa', (M) => {
  M.local(1); kcNB(M, 'paint', KC_NBRANCO, -1.3, 1.3, 0, 0.45, -0.45, 0.45);
  kcNB(M, 'canvas', [0.83, 0.85, 0.82], -1.25, 1.25, 0.45, 0.58, -0.42, 0.42, 'wood');
  kcNB(M, 'canvas', KC_NBRANCO, -1.3, 1.3, 0.58, 0.95, -0.45, -0.25, 'wood');
});
PF.kcNMesaCadeiras = () => prefab('kcNMesaCadeiras', (M) => {
  M.local(1); kcNB(M, 'wood', KC_NTECA, -0.65, 0.65, 0.72, 0.8, -0.65, 0.65, 'wood');
  kcNB(M, 'steel', KC_COR.ferro, -0.08, 0.08, 0, 0.72, -0.08, 0.08);
  for (const x of [-1.3, 1.3]) { kcNB(M, 'paint', KC_NBRANCO, x - 0.3, x + 0.3, 0.4, 0.5, -0.3, 0.3); kcNB(M, 'paint', KC_NBRANCO, x - 0.28, x + 0.28, 0, 0.4, -0.25, 0.25); }
});
PF.kcNBoia = () => prefab('kcNBoia', (M) => {
  M.local(1); M.color(KC_NBRANCO); M.save().move(0, 0.5, 0).rotX(Math.PI / 2); M.lathe('plastic', [[0.3, 0], [0.48, 0], [0.5, 0.1], [0.3, 0.1]], 20); M.restore(); M.col(-0.5, 0.5, 0, 1, -0.1, 0.1, 'wood');
  M.cls = 1; M.color(KC_COR.vermelho); for (const x of [-0.38, 0.38]) M.boxB('paint', x - 0.07, x + 0.07, 0.4, 0.6, 0.01, 0.07); M.cls = 0;
});
PF.kcNArmario = () => prefab('kcNArmario', (M) => {
  M.local(1); kcNB(M, 'paint', KC_NBRANCO, -1, 1, 0, 1.1, -0.55, 0.55);
  kcNB(M, 'wood', KC_NTECA, -1.04, 1.04, 1.1, 1.18, -0.59, 0.59, 'wood');
  M.cls = 1; M.color(KC_COR.ferro); M.boxB('steel', -0.03, 0.03, 0.1, 0.95, 0.55, 0.56); M.cls = 0;
});
PF.kcNHeliponto = () => prefab('kcNHeliponto', (M) => {
  M.local(1); M.color([0.25, 0.32, 0.33]); M.boxB('paint', -6, 6, 0, 0.015, -6, 6); M.cls = 1; M.color(KC_NBRANCO);
  M.save().move(0, 0.017, 0); M.lathe('paint', [[4.8, 0], [4.95, 0], [4.95, 0.005], [4.8, 0.005]], 48); M.restore();
  for (const x of [-1.2, 1.2]) M.boxB('paint', x - 0.15, x + 0.15, 0.017, 0.025, -1.5, 1.5);
  M.boxB('paint', -1.2, 1.2, 0.017, 0.025, -0.15, 0.15); M.cls = 0;
});

function kcNBarco(M, pequeno) {
  const L = pequeno ? 2.2 : 3, W = pequeno ? 0.85 : 1.05;
  for (const x of [-L + 0.35, L - 0.35]) kcNB(M, 'steel', KC_COR.ferro, x - 0.12, x + 0.12, 0, 0.55, -W - 0.1, W + 0.1);
  kcNB(M, 'paint', KC_NBRANCO, -L, L, 0.55, 1.25, -W, W);
  kcNB(M, 'paint', pequeno ? [0.95, 0.48, 0.13] : KC_NAZUL, -L + 0.08, L - 0.08, 1.25, 1.48, -W + 0.05, W - 0.05);
  kcNB(M, 'paint', KC_NBRANCO, -L + 0.5, L - 0.5, 1.48, 1.65, -W + 0.18, W - 0.18);
  if (!pequeno) kcNB(M, 'glass', [0.45, 0.67, 0.75], -0.4, 0.5, 1.65, 2.15, -0.7, 0.7, 'glass');
}
PF.kcNLancha = () => prefab('kcNLancha', (M) => { M.local(1); kcNBarco(M, false); });
PF.kcNBoteSalvaVidas = () => prefab('kcNBoteSalvaVidas', (M) => { M.local(1); kcNBarco(M, true); });
PF.kcNGuindaste = () => prefab('kcNGuindaste', (M) => {
  M.local(1); kcNB(M, 'steel', KC_COR.ferro, -0.35, 0.35, 0, 0.3, -0.35, 0.35);
  kcNB(M, 'paint', KC_NBRANCO, -0.18, 0.18, 0.3, 3.8, -0.18, 0.18);
  kcNB(M, 'paint', KC_NBRANCO, -0.18, 3, 3.55, 3.8, -0.18, 0.18);
  M.cls = 1; M.color(KC_COR.ferro); M.tube('steel', 0.025, [[2.7, 3.55, 0], [2.7, 1.2, 0]], 6); M.cls = 0;
});
PF.kcNCaixaEquipamento = () => prefab('kcNCaixaEquipamento', (M) => {
  M.local(1); kcNB(M, 'paint', KC_NBRANCO, -1, 1, 0, 1.15, -0.6, 0.6);
  M.cls = 1; M.color(KC_COR.ferro); M.boxB('steel', -0.95, 0.95, 1.02, 1.04, 0.6, 0.61); M.cls = 0;
});
PF.kcNRoloCabo = () => prefab('kcNRoloCabo', (M) => {
  M.local(1); kcNB(M, 'steel', KC_COR.ferro, -0.6, 0.6, 0, 0.25, -0.5, 0.5);
  M.color(KC_NTECA); M.save().move(-0.5, 0.75, 0).rotZ(-Math.PI / 2); M.cyl('wood', 0.5, 1, 16); M.restore();
  M.col(-0.5, 0.5, 0.25, 1.25, -0.5, 0.5, 'wood');
  M.cls = 1; M.color([0.25, 0.22, 0.18]); for (let x = -0.35; x <= 0.35; x += 0.14) { M.save().move(x, 0.75, 0).rotZ(-Math.PI / 2); M.lathe('rubber', [[0.49, 0], [0.52, 0], [0.52, 0.03], [0.49, 0.03]], 16); M.restore(); } M.cls = 0;
});
PF.kcNCabeco = () => prefab('kcNCabeco', (M) => {
  M.local(1); kcNB(M, 'steel', KC_COR.ferro, -0.45, 0.45, 0, 0.15, -0.3, 0.3);
  for (const x of [-0.25, 0.25]) kcNB(M, 'steel', KC_COR.ferro, x - 0.09, x + 0.09, 0.15, 0.65, -0.1, 0.1);
  kcNB(M, 'steel', KC_COR.ferro, -0.45, 0.45, 0.58, 0.72, -0.12, 0.12);
});
PF.kcNMangueira = () => prefab('kcNMangueira', (M) => {
  M.local(1); kcNB(M, 'paint', KC_COR.vermelho, -0.55, 0.55, 0, 1.05, -0.25, 0.25);
  M.cls = 1; M.color([0.87, 0.83, 0.7]); M.save().move(0, 0.52, 0.26).rotX(Math.PI / 2); M.lathe('canvas', [[0.18, 0], [0.42, 0], [0.42, 0.03], [0.18, 0.03]], 16); M.restore(); M.cls = 0;
});
PF.kcNConteiner = () => prefab('kcNConteiner', (M) => {
  M.local(1); kcNB(M, 'corrugated', [0.72, 0.76, 0.76], -2, 2, 0, 2, -1, 1);
  M.cls = 1; M.color(KC_NAZUL); for (const x of [-1.3, 0, 1.3]) M.boxB('steel', x - 0.03, x + 0.03, 0.15, 1.85, 1, 1.02); M.cls = 0;
});
PF.kcNMastroRadar = () => prefab('kcNMastroRadar', (M) => {
  M.local(1); kcNB(M, 'paint', KC_NBRANCO, -0.2, 0.2, 0, 4.5, -0.2, 0.2);
  kcNB(M, 'paint', KC_NBRANCO, -1.1, 1.1, 4.35, 4.55, -0.18, 0.18);
  kcNB(M, 'paint', KC_NBRANCO, -0.9, 0.9, 4.8, 5.05, -0.12, 0.12);
  kcNB(M, 'steel', KC_COR.ferro, -0.05, 0.05, 4.55, 4.8, -0.05, 0.05);
});
PF.kcNSatelite = () => prefab('kcNSatelite', (M) => {
  M.local(1); kcNB(M, 'paint', KC_NBRANCO, -0.35, 0.35, 0, 0.3, -0.35, 0.35);
  M.color(KC_NBRANCO); M.save().move(0, 0.3, 0); M.lathe('plastic', [[0.55, 0], [0.6, 0.2], [0.55, 0.65], [0.35, 0.95], [0, 1.05]], 18); M.restore(); M.col(-0.6, 0.6, 0.3, 1.35, -0.6, 0.6, 'metal');
});
PF.kcNFarol = () => prefab('kcNFarol', (M) => {
  M.local(1); kcNB(M, 'steel', KC_COR.ferro, -0.08, 0.08, 0, 1.6, -0.08, 0.08);
  kcNB(M, 'paint', KC_NBRANCO, -0.22, 0.22, 1.6, 1.95, -0.16, 0.16);
  M.cls = 1; M.color(KC_COR.vermelho); M.boxB('lamp', -0.18, 0, 1.66, 1.88, 0.16, 0.17); M.color([0.15, 0.9, 0.3]); M.boxB('lamp', 0, 0.18, 1.66, 1.88, 0.16, 0.17); M.cls = 0;
});
PF.kcNEscotilha = () => prefab('kcNEscotilha', (M) => {
  M.local(1); kcNB(M, 'paint', KC_NBRANCO, -0.8, 0.8, 0, 0.18, -0.8, 0.8);
  M.cls = 1; M.color(KC_COR.ferro); M.boxB('steel', -0.6, 0.6, 0.18, 0.2, -0.6, 0.6); M.color(KC_NAZUL); M.boxB('glass', -0.46, 0.46, 0.2, 0.21, -0.46, 0.46); M.cls = 0;
});
// Corrimão (não colide, como todos desde 26/nov): girar somente de 90 em 90 graus.
PF.kcNCorrimao = () => prefab('kcNCorrimao', (M) => {
  KC_INVIS.kcNCorrimao = []; M.local(1); M.color(KC_COR.ferro);
  for (const x of [-2, 0, 2]) M.boxB('steel', x - 0.035, x + 0.035, 0, 1.05, -0.035, 0.035);
  M.boxB('steel', -2.04, 2.04, 1, 1.08, -0.04, 0.04);
});
PF.kcNExtintor = () => prefab('kcNExtintor', (M) => {
  M.local(1); M.color(KC_COR.vermelho); M.cyl('paint', 0.13, 0.55, 12); M.col(-0.13, 0.13, 0, 0.55, -0.13, 0.13, 'metal');
  kcNB(M, 'steel', KC_COR.ferro, -0.04, 0.04, 0.55, 0.7, -0.04, 0.04);
  M.cls = 1; M.color([0.15, 0.15, 0.15]); M.tube('rubber', 0.015, [[0.06, 0.65, 0], [0.2, 0.55, 0], [0.16, 0.28, 0]], 5); M.cls = 0;
});
PF.kcNPlacaSaida = () => prefab('kcNPlacaSaida', (M) => {
  M.local(1); kcNB(M, 'plastic', [0.12, 0.52, 0.27], -0.5, 0.5, 0, 0.3, -0.04, 0.04);
  M.cls = 1; M.color(KC_NBRANCO); M.boxB('paint', -0.3, 0.18, 0.13, 0.17, 0.041, 0.045);
  M.tube('paint', 0.025, [[0.02, 0.07, 0.045], [0.18, 0.15, 0.045], [0.02, 0.23, 0.045]], 4); M.cls = 0;
});

/* ---------- peças de convés de iate: volumes brancos, teca e estofados ---------- */
const KC_IATE_BRANCO = [0.93, 0.94, 0.92], KC_IATE_TECA = [0.61, 0.42, 0.28], KC_IATE_INOX = [0.74, 0.77, 0.79], KC_IATE_VIDRO = [0.16, 0.25, 0.31], KC_IATE_AREIA = [0.84, 0.8, 0.66];
function kcIateB(M, mat, cor, x0, x1, y0, y1, z0, z1, col = 'metal') {
  M.color(cor); M.boxB(mat, x0, x1, y0, y1, z0, z1); M.col(x0, x1, y0, y1, z0, z1, col);
}
// Salão/ponte de 10 x 8 m, com passagens de 2,4 m na frente e atrás e laje a 3 m.
PF.kcNPontePanoramica = () => prefab('kcNPontePanoramica', (M) => {
  M.local(1); kcIateB(M, 'paint', KC_IATE_BRANCO, -5, 5, 2.85, 3, -4, 4);
  for (const x of [-5, 4.8]) {
    kcIateB(M, 'paint', KC_IATE_BRANCO, x, x + 0.2, 0, 0.65, -4, 4);
    kcIateB(M, 'glass', KC_IATE_VIDRO, x, x + 0.2, 0.65, 2.45, -4, 4, 'glass');
    kcIateB(M, 'paint', KC_IATE_BRANCO, x, x + 0.2, 2.45, 2.85, -4, 4);
  }
  for (const z of [-4, 3.8]) {
    for (const [a, b] of [[-5, -1.2], [1.2, 5]]) {
      kcIateB(M, 'paint', KC_IATE_BRANCO, a, b, 0, 0.65, z, z + 0.2);
      kcIateB(M, 'glass', KC_IATE_VIDRO, a, b, 0.65, 2.45, z, z + 0.2, 'glass');
      kcIateB(M, 'paint', KC_IATE_BRANCO, a, b, 2.45, 2.85, z, z + 0.2);
    }
    kcIateB(M, 'paint', KC_IATE_BRANCO, -1.2, 1.2, 2.3, 2.85, z, z + 0.2);
  }
  M.cls = 1; M.color(KC_IATE_INOX);
  for (const x of [-4.8, -2.7, 2.7, 4.8]) for (const z of [-4.01, 4]) M.boxB('steel', x - 0.025, x + 0.025, 0.65, 2.45, z, z + 0.015);
  M.color([0.15, 0.32, 0.43]); for (const z of [-4.01, 4]) M.boxB('paint', -5, 5, 2.68, 2.73, z, z + 0.015); M.cls = 0;
});

// Cabana aberta: cobertura, coluna com ripas, ducha e dois bancos; o vão central tem 3 m.
PF.kcNCabanaConves = () => prefab('kcNCabanaConves', (M) => {
  M.local(1);
  for (const x of [-2.9, 2.7]) for (const z of [-1.9, 1.7]) kcIateB(M, 'wood', KC_IATE_TECA, x, x + 0.2, 0, 2.65, z, z + 0.2, 'wood');
  kcIateB(M, 'paint', KC_IATE_BRANCO, -3, 3, 2.65, 2.8, -2, 2);
  for (const [x0, x1] of [[-2.9, -1.5], [1.5, 2.9]]) {
    kcIateB(M, 'paint', KC_IATE_BRANCO, x0, x1, 0, 0.42, -1.8, -0.3);
    kcIateB(M, 'canvas', KC_IATE_AREIA, x0 + 0.04, x1 - 0.04, 0.42, 0.55, -1.75, -0.35, 'wood');
    kcIateB(M, 'canvas', KC_IATE_AREIA, x0 + 0.04, x1 - 0.04, 0.55, 0.9, -1.8, -1.6, 'wood');
  }
  kcIateB(M, 'wood', KC_IATE_TECA, -0.45, 0.45, 0, 2.65, -1.9, -1.7, 'wood');
  M.cls = 1; M.color([0.36, 0.23, 0.16]); for (let x = -0.4; x <= 0.4; x += 0.12) M.boxB('wood', x, x + 0.025, 0.08, 2.55, -1.69, -1.68);
  M.color(KC_IATE_INOX); M.tube('steel', 0.025, [[0, 0.8, -1.67], [0, 2.35, -1.67], [0, 2.35, -1.35]], 6); M.boxB('steel', -0.17, 0.17, 2.3, 2.35, -1.5, -1.2); M.cls = 0;
});

// Banheira elevada: base e borda colidem, água e reflexos são visuais.
PF.kcNHidroConves = () => prefab('kcNHidroConves', (M) => {
  M.local(1); M.color(KC_IATE_BRANCO); M.cyl('paint', 2.5, 0.35, 24); M.col(-2.4, 2.4, 0, 0.35, -2.4, 2.4, 'metal');
  M.save().move(0, 0.35, 0); M.lathe('paint', [[2.48, 0], [2.48, 0.6], [2.1, 0.6], [2.1, 0]], 24); M.restore();
  for (const s of [-1, 1]) { kcIateB(M, 'paint', KC_IATE_BRANCO, s < 0 ? -2.5 : 2.1, s < 0 ? -2.1 : 2.5, 0.35, 0.95, -1.6, 1.6); kcIateB(M, 'paint', KC_IATE_BRANCO, -1.6, 1.6, 0.35, 0.95, s < 0 ? -2.5 : 2.1, s < 0 ? -2.1 : 2.5); }
  M.cls = 1; M.color([0.23, 0.56, 0.65]); M.save().move(0, 0.63, 0); M.cyl('glass', 2.08, 0.02, 24); M.restore();
  M.color([0.55, 0.79, 0.83]); M.save().move(0, 0.655, 0); M.lathe('paint', [[0.8, 0], [0.83, 0], [0.83, 0.005], [0.8, 0.005]], 24); M.restore(); M.cls = 0;
});

// Balcão de cobertura baixa, com frente arredondada sugerida por três trechos.
PF.kcNBarConves = () => prefab('kcNBarConves', (M) => {
  M.local(1);
  for (const [x0, x1, z0, z1] of [[-1.2, 1.2, -0.35, 0.65], [-2.4, -1.2, -0.6, 0.45], [1.2, 2.4, -0.6, 0.45]]) {
    kcIateB(M, 'paint', KC_IATE_BRANCO, x0, x1, 0, 0.95, z0, z1);
    kcIateB(M, 'wood', KC_IATE_TECA, x0, x1, 0.95, 1.05, z0, z1, 'wood');
  }
  M.cls = 1; M.color(KC_IATE_INOX); for (const x of [-1.75, 0, 1.75]) { M.save().move(x, 0.36, 0.66).rotX(Math.PI / 2); M.cyl('steel', 0.085, 0.02, 10); M.restore(); } M.cls = 0;
});
PF.kcNBancoConves = () => prefab('kcNBancoConves', (M) => {
  M.local(1); kcIateB(M, 'paint', KC_IATE_BRANCO, -1.3, 1.3, 0, 0.42, -0.48, 0.48);
  kcIateB(M, 'canvas', KC_IATE_AREIA, -1.25, 1.25, 0.42, 0.58, -0.43, 0.43, 'wood');
  kcIateB(M, 'canvas', KC_IATE_AREIA, -1.25, 1.25, 0.58, 0.94, -0.48, -0.3, 'wood');
  M.cls = 1; M.color([0.78, 0.63, 0.22]); for (const x of [-0.75, 0, 0.75]) M.boxB('canvas', x - 0.1, x + 0.1, 0.58, 0.86, -0.29, -0.28); M.cls = 0;
});
PF.kcNClaraboiaConves = () => prefab('kcNClaraboiaConves', (M) => {
  M.local(1); M.color(KC_IATE_BRANCO); M.lathe('paint', [[1.35, 0], [1.5, 0], [1.5, 0.12], [1.35, 0.12]], 24);
  kcIateB(M, 'glass', KC_IATE_VIDRO, -1.05, 1.05, 0, 0.1, -1.05, 1.05, 'glass');
  M.col(-1.5, 1.5, 0, 0.12, -1.5, 1.5, 'metal');
  M.cls = 1; M.color(KC_IATE_INOX); M.boxB('steel', -1.35, 1.35, 0.12, 0.14, -0.025, 0.025); M.boxB('steel', -0.025, 0.025, 0.12, 0.14, -1.35, 1.35); M.cls = 0;
});
PF.kcNArmarioLateral = () => prefab('kcNArmarioLateral', (M) => {
  M.local(1); kcIateB(M, 'paint', KC_IATE_BRANCO, -2.5, 2.5, 0, 1.1, -0.6, 0.6);
  M.cls = 1; M.color(KC_IATE_INOX); for (const x of [-1.6, 0, 1.6]) { M.boxB('steel', x - 0.65, x + 0.65, 0.2, 0.22, 0.6, 0.61); M.boxB('steel', x - 0.65, x + 0.65, 0.9, 0.92, 0.6, 0.61); }
  M.color(KC_IATE_TECA); M.boxB('wood', -2.48, 2.48, 1.1, 1.12, -0.58, 0.58); M.cls = 0;
});
PF.kcNPostoComando = () => prefab('kcNPostoComando', (M) => {
  M.local(1); kcIateB(M, 'paint', KC_IATE_BRANCO, -1.7, 1.7, 0, 1, -0.55, 0.55);
  kcIateB(M, 'paint', KC_IATE_BRANCO, -0.85, 0.85, 1, 1.55, -0.45, 0.35);
  M.cls = 1; M.color(KC_IATE_VIDRO); M.boxB('glass', -0.7, 0.7, 1.12, 1.45, 0.35, 0.36);
  M.color(KC_IATE_INOX); for (const x of [-1.3, 1.3]) M.boxB('steel', x - 0.1, x + 0.1, 1, 1.02, -0.1, 0.1); M.cls = 0;
});

// Escada larga de convés: sobe 1,2 m em 2,1 m e termina num patamar de 2,4 m; giro somente de 90 em 90 graus.
PF.kcNEscadaConves = () => prefab('kcNEscadaConves', (M) => {
  KC_ESCADAS.kcNEscadaConves = []; M.local(1);
  kcEscadaF(M, 'kcNEscadaConves', -1.2, 1.2, -2.25, -0.15, 'z', 0, 1.2);
  kcPatamar(M, -1.2, 1.2, -0.15, 2.25, 1.2);
  kcIateB(M, 'steel', KC_IATE_INOX, -1.26, -1.2, 1.2, 2.25, -0.15, 2.25);
});
PF.kcNCorrimaoConves = () => prefab('kcNCorrimaoConves', (M) => {
  // sem colisão, como todos os corrimãos
  M.local(1); M.color(KC_IATE_INOX); for (const x of [-2, 0, 2]) M.boxB('steel', x - 0.04, x + 0.04, 0, 1.05, -0.04, 0.04);
  M.boxB('steel', -2.04, 2.04, 1, 1.08, -0.04, 0.04);
  M.color([0.46, 0.56, 0.59]); M.boxB('glass', -2, 2, 0.08, 0.98, -0.025, 0.025);
});
// Arco superior independente: a abertura no centro permite passagem larga.
PF.kcNArcoSuperior = () => prefab('kcNArcoSuperior', (M) => {
  M.local(1); for (const x of [-4, 3.6]) kcIateB(M, 'paint', KC_IATE_BRANCO, x, x + 0.4, 0, 3.5, -0.3, 0.3);
  kcIateB(M, 'paint', KC_IATE_BRANCO, -4, 4, 3.5, 3.9, -0.3, 0.3);
  kcIateB(M, 'paint', KC_IATE_BRANCO, -0.07, 0.07, 3.9, 4.45, -0.07, 0.07);
  M.cls = 1; M.color(KC_IATE_INOX); M.tube('steel', 0.025, [[-3.5, 3.48, 0.31], [3.5, 3.48, 0.31]], 6); M.cls = 0;
});
PF.kcNCaixaBordo = () => prefab('kcNCaixaBordo', (M) => {
  M.local(1); kcIateB(M, 'paint', [0.77, 0.61, 0.16], -0.65, 0.65, 0, 0.55, -0.4, 0.4);
  M.cls = 1; M.color(KC_IATE_INOX); for (const x of [-0.45, 0.45]) { M.boxB('steel', x - 0.025, x + 0.025, 0, 0.56, 0.4, 0.41); M.boxB('steel', x - 0.025, x + 0.025, 0.55, 0.56, -0.4, 0.4); } M.cls = 0;
});

/* ---------- pacote 8: aeroporto (prefixo kcA, grupo "Aeroporto" no editor) ----------
   kcAAviao: avião de passageiros com a cabine andável. O piso da cabine fica no y da peça (no mapa Aeroporto, y = 4,5: o trem
   de pouso desce 4,5 m até o chão). Comprido em z, nariz em +z. Duas portas de 3 m: a da direita (+x) perto do nariz
   (z 12 a 15 da peça, para a ponte de embarque) e a da esquerda (-x) atrás da asa (z -13 a -10, para a escada do avião).
   Corredor de 2,6 m entre as poltronas. O resto: balcão de check-in, cadeiras de espera, raio-x, pórtico, carrinho de bagagem,
   painel de voos e esteira de bagagem. */
const KC_AV = { R: 2.6, cy: 1.6, z0: -18, z1: 18, portaD: [12, 15], portaE: [-13, -10] };
PF.kcAAviao = () => prefab('kcAAviao', (M) => {
  KC_INVIS.kcAAviao = []; M.local(1);
  const { R, cy, z0, z1, portaD, portaE } = KC_AV, branco = [0.95, 0.95, 0.96], azul = [0.12, 0.28, 0.62];
  // ângulos (em volta do eixo do avião) de cada porta: do piso (0) até 2,2 m
  const sMin = (cy - 2.2) / R, sMax = cy / R, aD = [Math.asin(sMin), Math.asin(Math.min(1, sMax))], aE = [Math.PI - aD[1], Math.PI - aD[0]];
  const casca = (za, zb, a0, a1) => {
    M.save().move(0, cy, 0).rotX(Math.PI / 2);
    M.color(branco); M.lathe('carpaint', [[R, za], [R, zb]], 20, { a0, a1 });
    M.color([0.9, 0.9, 0.88]); M.lathe('plastic', [[R - 0.06, zb], [R - 0.06, za]], 20, { a0, a1 });
    M.restore();
  };
  const cortes = [z0, portaE[0], portaE[1], portaD[0], portaD[1], z1];
  for (let i = 0; i < cortes.length - 1; i++) {
    const za = cortes[i], zb = cortes[i + 1], meio = (za + zb) / 2;
    const temD = meio > portaD[0] && meio < portaD[1], temE = meio > portaE[0] && meio < portaE[1];
    if (temD) casca(za, zb, aD[1], aD[0] + Math.PI * 2);
    else if (temE) casca(za, zb, aE[1], aE[0] + Math.PI * 2);
    else casca(za, zb, 0, Math.PI * 2);
  }
  // nariz e cauda (cones)
  // nariz com a janela da cabine dos pilotos: uma faixa aberta em volta, de 1,1 m a 2,0 m acima do piso (cabeça e parte de cima
  // do tronco de quem está lá dentro); o nariz é feito em fatias, cada uma sem a faixa
  const nR = (t) => (t <= 1.6 ? R * (1 - 0.15 * t / 1.6) : t <= 3.0 ? R * (0.85 - 0.35 * (t - 1.6) / 1.4) : R * 0.5 * (1 - (t - 3.0) / 0.8));
  const jB = 1.1 - cy, jC = 2.0 - cy; // a faixa, em altura relativa ao eixo
  for (let t = 0; t < 3.8 - 1e-6; t += 0.2) {
    const ra = nR(t), rb = nR(Math.min(3.8, t + 0.2)), r = (ra + rb) / 2, pecas = [];
    if (r > -jB) pecas.push([Math.asin(-jB / r), Math.PI - Math.asin(-jB / r)]); else pecas.push([0, Math.PI * 2]);
    if (r > jC) pecas.push([Math.PI + Math.asin(jC / r), Math.PI * 2 - Math.asin(jC / r)]);
    if (r <= -jB) pecas.length = 1;
    for (const [a0, a1] of pecas) {
      M.save().move(0, cy, z1).rotX(Math.PI / 2);
      M.color(branco); M.lathe('carpaint', [[ra, t], [rb, t + 0.2]], 20, { a0, a1 }); M.color([0.85, 0.85, 0.84]); M.lathe('plastic', [[rb * 0.98, t + 0.2], [ra * 0.98, t]], 20, { a0, a1 });
      M.restore();
    }
  }
  M.save().move(0, cy + 0.4, z0).rotX(-Math.PI / 2); M.lathe('carpaint', [[R, 0], [R * 0.75, 2.2], [R * 0.35, 4.2], [0, 5.0]], 20); M.restore();
  M.color([0.08, 0.1, 0.14]); M.cls = 1;
  for (const x of [-0.9, 0, 0.9]) M.boxB('steel', x - 0.04, x + 0.04, 1.1, 2.0, z1 + 1.45 - Math.abs(x) * 0.3, z1 + 1.55 - Math.abs(x) * 0.3); // montantes da janela
  // janelas e faixa azul
  for (const s of [-1, 1]) for (let z = -16; z <= 16.5; z += 0.95) {
    if ((z > portaD[0] - 0.4 && z < portaD[1] + 0.4) || (z > portaE[0] - 0.4 && z < portaE[1] + 0.4)) continue;
    M.color([0.08, 0.1, 0.14]); M.boxB('glass', s > 0 ? R - 0.03 : -R, s > 0 ? R : -R + 0.03, cy + 0.25, cy + 0.6, z - 0.16, z + 0.16);
  }
  M.color(azul); for (const s of [-1, 1]) M.boxB('paint', s > 0 ? R - 0.1 : -R - 0.005, s > 0 ? R + 0.005 : -R + 0.1, cy - 0.5, cy - 0.3, z0 + 0.5, z1 - 0.2);
  // batentes das portas
  M.color([0.55, 0.57, 0.6]);
  for (const [s, [za, zb]] of [[1, portaD], [-1, portaE]]) { const x = s * (R - 0.02); for (const z of [za, zb]) M.boxB('steel', x - 0.05, x + 0.05, 0, 2.25, z - 0.05, z + 0.05); M.boxB('steel', x - 0.05, x + 0.05, 2.2, 2.3, za, zb); }
  M.cls = 0;
  // piso, teto e paredes de dentro (colisão), com as portas abertas
  const hw = Math.sqrt(R * R - cy * cy);
  M.color([0.32, 0.34, 0.4]); M.boxB('rug', -hw, hw, -0.15, 0, z0, z1); M.col(-hw, hw, -0.3, 0, z0, z1, 'metal');
  M.col(-hw, hw, 2.6, 2.9, z0, z1, 'metal');
  for (const s of [-1, 1]) {
    const [pa, pb] = s > 0 ? portaD : portaE, x0 = s > 0 ? hw - 0.05 : -hw - 0.25, x1 = s > 0 ? hw + 0.25 : -hw + 0.05;
    M.col(x0, x1, 0, 2.6, z0, pa, 'metal'); M.col(x0, x1, 0, 2.6, pb, z1, 'metal'); M.col(x0, x1, 2.2, 2.6, pa, pb, 'metal');
  }
  M.col(-hw, hw, 0, 2.6, z0 - 0.3, z0, 'metal');
  // cabine dos pilotos (z1 a z1 + 1,6): piso, teto, paredes até 1,1 m e acima de 2,0 m; na faixa da janela, parede invisível
  // (a bala passa, ninguém pula do nariz)
  const zc = z1 + 1.6;
  M.color([0.32, 0.34, 0.4]); M.boxB('rug', -1.25, 1.25, -0.15, 0, z1, zc); M.col(-1.25, 1.25, -0.3, 0, z1, zc, 'metal'); M.col(-1.6, 1.6, 2.6, 2.9, z1, zc, 'metal');
  for (const [x0, x1, za, zb] of [[-1.6, -1.25, z1, zc], [1.25, 1.6, z1, zc], [-1.6, 1.6, zc - 0.2, zc]]) {
    M.col(x0, x1, 0, 1.1, za, zb, 'metal'); M.col(x0, x1, 2.0, 2.6, za, zb, 'metal'); KC_INVIS.kcAAviao.push([x0, x1, 1.1, 2.0, za, zb]);
  }
  M.color([0.12, 0.13, 0.15]); M.boxB('steel', -1.2, 1.2, 0, 1.05, zc - 0.55, zc - 0.2); M.col(-1.2, 1.2, 0, 1.05, zc - 0.55, zc - 0.2, 'metal'); // painel
  M.cls = 1; M.color([0.2, 0.6, 0.4]); for (const x of [-0.6, 0.6]) M.boxB('lamp', x - 0.3, x + 0.3, 0.8, 1.0, zc - 0.56, zc - 0.55); M.cls = 0;
  M.color([0.25, 0.27, 0.32]); for (const x of [-0.6, 0.6]) { M.boxB('canvas', x - 0.28, x + 0.28, 0.35, 0.55, z1 + 0.15, z1 + 0.7, { bevel: 0.04 }); M.boxB('canvas', x - 0.28, x + 0.28, 0.55, 1.25, z1 + 0.1, z1 + 0.22, { bevel: 0.04 }); M.col(x - 0.28, x + 0.28, 0, 1.25, z1 + 0.1, z1 + 0.7, 'wood'); }
  // poltronas (uma de cada lado por fileira; corredor de 2,6 m)
  for (let z = -16.5; z <= 10.5; z += 1.1) {
    if ((z > portaE[0] - 0.8 && z < portaE[1] + 0.3) || (z > portaD[0] - 0.8)) continue;
    for (const s of [-1, 1]) {
      const a = s > 0 ? 1.3 : -hw + 0.05, b = s > 0 ? hw - 0.05 : -1.3;
      M.color([0.15, 0.25, 0.55]); M.boxB('canvas', a, b, 0.35, 0.55, z - 0.35, z + 0.25, { bevel: 0.04 }); M.boxB('canvas', a, b, 0.55, 1.15, z - 0.38, z - 0.25, { bevel: 0.03 });
      M.color([0.25, 0.25, 0.27]); M.cls = 1; M.boxB('steel', a + 0.1, b - 0.1, 0, 0.35, z - 0.2, z + 0.1); M.cls = 0;
      M.col(a, b, 0, 1.15, z - 0.38, z + 0.25, 'wood');
    }
  }
  // asas, motores, estabilizadores e deriva
  M.color(branco);
  for (const s of [-1, 1]) {
    M.save().move(0, cy - 2.1, 0).rotX(-Math.PI / 2);
    M.extrude('carpaint', s > 0 ? [[1.5, -5], [1.5, 5], [17, 10.5], [17, 8]] : [[-1.5, 5], [-1.5, -5], [-17, 8], [-17, 10.5]], 0.35);
    M.restore();
    M.color([0.85, 0.86, 0.88]); M.save().move(s * 7, cy - 3.1, -1.5).rotX(Math.PI / 2); M.lathe('steel', [[0.95, 0], [1.0, 0.6], [0.9, 3.4], [0.6, 4.0]], 18); M.restore();
    M.color([0.1, 0.1, 0.12]); M.cls = 1; M.save().move(s * 7, cy - 3.1, -1.48).rotX(Math.PI / 2); M.cyl('dark', 0.85, 0.02, 16); M.restore(); M.cls = 0;
    M.color(branco); M.boxB('carpaint', s * 7 - 0.12, s * 7 + 0.12, cy - 2.2, cy - 1.9, -1.0, 1.5);
    M.save().move(0, cy + 0.6, z0 - 1.5).rotX(-Math.PI / 2); M.extrude('carpaint', s > 0 ? [[0.5, 0], [0.5, 3], [6.5, 5.5], [6.5, 4]] : [[-0.5, 3], [-0.5, 0], [-6.5, 4], [-6.5, 5.5]], 0.25); M.restore();
  }
  M.color(azul); M.save().move(-0.15, 0, 0).rotY(Math.PI / 2); M.extrude('carpaint', [[-z0, cy + 1.5], [-z0 + 4.5, cy + 1.5], [-z0 + 6.5, cy + 7.5], [-z0 + 4.2, cy + 7.5]], 0.3); M.restore();
  // trem de pouso (o chão fica 4,5 m abaixo do piso da cabine)
  M.color([0.3, 0.31, 0.33]);
  for (const [x, z] of [[0, 15.5], [-2.6, -2.5], [2.6, -2.5]]) {
    M.boxB('steel', x - 0.12, x + 0.12, -4.0, cy - R + 0.1, z - 0.12, z + 0.12); M.col(x - 0.15, x + 0.15, -4.5, cy - R, z - 0.15, z + 0.15, 'metal');
    M.color([0.08, 0.08, 0.09]); for (const dx of [-0.35, 0.35]) { M.save().move(x + dx - 0.15, -4.0, z).rotZ(-Math.PI / 2); M.cyl('rubber', 0.5, 0.3, 14); M.restore(); }
    M.color([0.3, 0.31, 0.33]);
  }
});

// balcão de check-in: balcão com balança e painel da companhia atrás, 2,6 x 2,4 x 1,5 m (o atendente fica em -z)
PF.kcABalcao = () => prefab('kcABalcao', (M) => {
  M.local(1);
  M.color([0.92, 0.92, 0.9]); M.boxB('paint', -1.3, 1.3, 0, 1.05, -0.4, 0.4, { bevel: 0.03 }); M.col(-1.3, 1.3, 0, 1.1, -0.4, 0.4, 'wood');
  M.color([0.15, 0.3, 0.6]); M.boxB('paint', -1.32, 1.32, 1.05, 1.1, -0.42, 0.42);
  M.color([0.2, 0.2, 0.22]); M.boxB('steel', 0.4, 1.2, 0, 0.25, 0.42, 1.1); M.col(0.4, 1.2, 0, 0.25, 0.42, 1.1, 'metal'); // balança/esteira
  M.color([0.15, 0.3, 0.6]); M.boxB('paint', -1.3, 1.3, 1.3, 2.4, -0.62, -0.55); M.col(-1.3, 1.3, 0, 2.4, -0.65, -0.52, 'wood');
  M.cls = 1; M.color([0.97, 0.97, 0.95]); for (let i = 0; i < 5; i++) M.boxB('paint', -0.9 + i * 0.4, -0.65 + i * 0.4, 1.95, 2.15, -0.55, -0.54);
  M.color([0.08, 0.1, 0.12]); M.boxB('glass', -0.9, -0.3, 1.1, 1.5, -0.2, -0.17); M.cls = 0;
});
// fileira de cinco cadeiras de espera (assento preto, estrutura de aço), 3 x 0,9 x 0,7 m: cobre agachado
PF.kcACadeiras = () => prefab('kcACadeiras', (M) => {
  M.local(1);
  M.color([0.55, 0.57, 0.6]); M.boxB('steel', -1.5, 1.5, 0.36, 0.42, -0.05, 0.05); for (const x of [-1.3, 1.3]) M.boxB('steel', x - 0.05, x + 0.05, 0, 0.4, -0.3, 0.3);
  M.color([0.1, 0.1, 0.12]);
  for (let i = 0; i < 5; i++) { const x = -1.2 + i * 0.6; M.boxB('rubber', x - 0.27, x + 0.27, 0.42, 0.5, -0.28, 0.25, { bevel: 0.03 }); M.save().move(x, 0.5, -0.28).rotX(-0.2); M.boxB('rubber', -0.27, 0.27, 0, 0.45, -0.04, 0.03, { bevel: 0.03 }); M.restore(); }
  M.col(-1.5, 1.5, 0, 0.9, -0.35, 0.3, 'metal');
});
// raio-x de bagagem: túnel com esteiras de entrada e saída, 4,4 x 1,5 x 1,1 m (comprido em x)
PF.kcARaioX = () => prefab('kcARaioX', (M) => {
  M.local(1);
  M.color([0.85, 0.86, 0.88]); M.boxB('paint', -1.2, 1.2, 0, 1.5, -0.55, 0.55, { bevel: 0.05 }); M.col(-1.2, 1.2, 0, 1.5, -0.55, 0.55, 'metal');
  M.cls = 1; M.color([0.05, 0.05, 0.06]); for (const s of [-1, 1]) M.boxB('dark', s * 1.2 - 0.01, s * 1.2 + 0.01, 0.75, 1.3, -0.4, 0.4);
  M.color([0.2, 0.6, 0.3]); M.boxB('lamp', -0.3, 0.3, 1.5, 1.53, -0.1, 0.1); M.cls = 0;
  M.color([0.25, 0.25, 0.27]); for (const s of [-1, 1]) { M.boxB('rubber', s > 0 ? 1.2 : -2.2, s > 0 ? 2.2 : -1.2, 0.72, 0.8, -0.4, 0.4); M.boxB('steel', s > 0 ? 1.25 : -2.15, s > 0 ? 2.15 : -1.25, 0, 0.72, -0.35, 0.35); M.col(s > 0 ? 1.2 : -2.2, s > 0 ? 2.2 : -1.2, 0, 0.8, -0.4, 0.4, 'metal'); }
  M.color([0.25, 0.3, 0.45]); M.cls = 1; M.boxB('plastic', 1.5, 1.9, 0.8, 0.95, -0.25, 0.2, { bevel: 0.03 }); M.cls = 0;
});
// pórtico detector de metal (só os postes colidem), 1,3 x 2,3 x 0,6 m
PF.kcAPortico = () => prefab('kcAPortico', (M) => {
  M.local(1); M.color([0.8, 0.81, 0.83]);
  for (const s of [-1, 1]) { M.boxB('plastic', s * 0.65 - 0.12, s * 0.65 + 0.12, 0, 2.2, -0.3, 0.3, { bevel: 0.04 }); M.col(s * 0.65 - 0.12, s * 0.65 + 0.12, 0, 2.2, -0.3, 0.3, 'metal'); }
  M.boxB('plastic', -0.77, 0.77, 2.1, 2.3, -0.3, 0.3, { bevel: 0.04 });
  M.cls = 1; M.color([0.9, 0.2, 0.15]); M.boxB('lamp', -0.1, 0.1, 2.3, 2.34, -0.05, 0.05); M.cls = 0;
});
// carrinho de bagagem: trator e duas carretas com malas, 9 x 1,6 x 1,6 m (comprido em x)
PF.kcACarrinhoBagagem = () => prefab('kcACarrinhoBagagem', (M) => {
  M.local(1); const R = rngOf(81);
  const roda = (x, z) => { M.color([0.08, 0.08, 0.09]); M.save().move(x - 0.1, 0.25, z).rotZ(-Math.PI / 2); M.cyl('rubber', 0.25, 0.2, 10); M.restore(); };
  // trator
  M.color([0.95, 0.75, 0.1]); M.boxB('carpaint', 3.0, 4.5, 0.3, 1.1, -0.75, 0.75, { bevel: 0.08 }); M.color([0.1, 0.1, 0.12]); M.boxB('rubber', 3.1, 3.7, 1.1, 1.3, -0.4, 0.4, { bevel: 0.05 });
  M.color([0.3, 0.3, 0.32]); M.boxB('steel', 3.2, 3.25, 1.1, 1.9, -0.7, 0.7); M.boxB('steel', 3.2, 3.9, 1.85, 1.95, -0.75, 0.75);
  for (const x of [3.3, 4.2]) for (const z of [-0.8, 0.8]) roda(x, z);
  M.col(3.0, 4.5, 0, 1.95, -0.8, 0.8, 'metal');
  // duas carretas
  const cores = [[0.2, 0.2, 0.22], [0.5, 0.15, 0.15], [0.15, 0.3, 0.55], [0.55, 0.45, 0.3], [0.3, 0.45, 0.3]];
  for (const xc of [-3.2, 0.3]) {
    M.color([0.55, 0.57, 0.6]); M.boxB('steel', xc - 1.4, xc + 1.4, 0.45, 0.55, -0.8, 0.8); M.boxB('steel', xc + 1.4, xc + 2.4, 0.45, 0.5, -0.05, 0.05);
    for (const x of [xc - 1.1, xc + 1.1]) for (const z of [-0.75, 0.75]) roda(x, z);
    for (let i = 0; i < 6; i++) { const x = xc - 1.0 + (i % 3) * 0.7, z = i < 3 ? -0.35 : 0.35, h = R.range(0.4, 0.7); M.color(R.pick(cores)); M.boxB('canvas', x - 0.3, x + 0.3, 0.55, 0.55 + h, z - 0.3, z + 0.25, { bevel: 0.05 }); }
    M.col(xc - 1.4, xc + 1.4, 0, 1.3, -0.8, 0.8, 'metal');
  }
});
// painel de voos num pé: tela escura com linhas coloridas, 3 x 3,4 x 0,5 m (a tela olha +z; só os pés colidem)
PF.kcAPainelVoos = () => prefab('kcAPainelVoos', (M) => {
  M.local(1); const R = rngOf(13);
  M.color([0.3, 0.31, 0.33]); for (const x of [-1.2, 1.2]) { M.boxB('steel', x - 0.06, x + 0.06, 0, 2.2, -0.06, 0.06); M.col(x - 0.08, x + 0.08, 0, 2.2, -0.08, 0.08, 'metal'); }
  M.color([0.1, 0.1, 0.12]); M.boxB('steel', -1.5, 1.5, 2.2, 3.4, -0.12, 0.12, { bevel: 0.03 });
  M.cls = 1; M.color([0.02, 0.03, 0.06]); M.boxB('glass', -1.42, 1.42, 2.28, 3.32, 0.12, 0.13);
  for (let r = 0; r < 7; r++) {
    const y = 3.2 - r * 0.14;
    M.color([0.98, 0.82, 0.2]); M.boxB('lamp', -1.35, -0.6, y - 0.05, y + 0.02, 0.13, 0.135);
    M.color([0.9, 0.9, 0.9]); M.boxB('lamp', -0.5, 0.5, y - 0.05, y + 0.02, 0.13, 0.135);
    M.color(R() < 0.3 ? [0.9, 0.2, 0.15] : [0.3, 0.85, 0.35]); M.boxB('lamp', 0.65, 1.35, y - 0.05, y + 0.02, 0.13, 0.135);
  }
  M.cls = 0;
});
// esteira de bagagem oval com malas, 7 x 0,9 x 3,2 m (cobre agachado)
PF.kcAEsteira = () => prefab('kcAEsteira', (M) => {
  M.local(1); const R = rngOf(57);
  M.color([0.6, 0.62, 0.65]); M.boxB('steel', -2.5, 2.5, 0, 0.55, -1.6, 1.6); for (const s of [-1, 1]) { M.save().move(s * 2.5, 0, 0); M.cyl('steel', 1.6, 0.55, 20); M.restore(); }
  M.color([0.12, 0.12, 0.13]); M.boxB('rubber', -2.5, 2.5, 0.55, 0.62, -1.6, 1.6); for (const s of [-1, 1]) { M.save().move(s * 2.5, 0.55, 0); M.cyl('rubber', 1.6, 0.07, 20); M.restore(); }
  M.color([0.7, 0.72, 0.75]); M.boxB('steel', -2.5, 2.5, 0.55, 0.9, -0.7, 0.7); for (const s of [-1, 1]) { M.save().move(s * 2.5, 0.55, 0); M.cyl('steel', 0.7, 0.35, 16); M.restore(); }
  const cores = [[0.2, 0.2, 0.22], [0.5, 0.15, 0.15], [0.15, 0.3, 0.55], [0.55, 0.45, 0.3], [0.85, 0.75, 0.2]];
  M.cls = 1; for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU, x = Math.cos(a) * 3.4, z = Math.sin(a) * 1.15; M.color(R.pick(cores)); M.save().move(Math.max(-3.6, Math.min(3.6, x)), 0.62, z).rotY(a); M.boxB('canvas', -0.3, 0.3, 0, 0.25, -0.2, 0.2, { bevel: 0.05 }); M.restore(); } M.cls = 0;
  M.col(-2.5, 2.5, 0, 0.9, -1.6, 1.6, 'metal'); for (const s of [-1, 1]) M.col(s > 0 ? 2.5 : -4.1, s > 0 ? 4.1 : -2.5, 0, 0.9, -1.2, 1.2, 'metal');
});

/* ---------- pacote 9: mais peças do aeroporto (paredes, lojas, esteira, plantas, balcões, escadas) ----------
   Paredes de 4 m de largura e 5,5 m de altura (do piso de cima, 4,5, até o teto, 10), 0,2 m de espessura, comprimento em x.
   Lojas de 6 x 5 m que dá para entrar (porta de 2,4 m na frente, +z), com vitrine, placa e o que cada uma vende.
   Escadas de 0 a 4,5 m com subida de verdade (KC_ESCADAS): 2,4 m de largura, 7,7 m de comprimento, patamar de 2,4 m no alto.
   As escadas só giram de 90 em 90 graus. */
const KC_AE = { branco: [0.93, 0.93, 0.92], cinza: [0.62, 0.63, 0.65], vidro: [0.55, 0.7, 0.78], inox: [0.8, 0.81, 0.83] };
// parede do terminal com uma abertura [a0, a1, b0, b1] (porta ou janela)
function kcAParede(M, H, abertura, vidroNaAbertura) {
  M.local(1); M.color(KC_AE.branco);
  kcParede(M, 'paint', 'x', -0.1, 0.1, -2, 2, 0, H, abertura ? [abertura] : [], 'concrete');
  M.color([0.85, 0.86, 0.88]); M.cls = 1; M.boxB('paint', -2, 2, 0, 0.15, -0.11, 0.11); M.cls = 0; // rodapé
  if (abertura && vidroNaAbertura) {
    const [a0, a1, b0, b1] = abertura;
    M.color(KC_AE.vidro); M.boxB('glass', a0, a1, b0, b1, -0.02, 0.02); M.col(a0, a1, b0, b1, -0.05, 0.05, 'glass');
    M.color(KC_AE.inox); M.cls = 1;
    for (const [p, q, r, t] of [[a0 - 0.06, a0, b0, b1], [a1, a1 + 0.06, b0, b1], [a0 - 0.06, a1 + 0.06, b0 - 0.06, b0], [a0 - 0.06, a1 + 0.06, b1, b1 + 0.06], [(a0 + a1) / 2 - 0.03, (a0 + a1) / 2 + 0.03, b0, b1]])
      M.boxB('steel', p, q, r, t, -0.12, 0.12);
    M.cls = 0;
  }
}
PF.kcAParedeJanela = () => prefab('kcAParedeJanela', (M) => kcAParede(M, 5.5, [-1.5, 1.5, 1.0, 3.2], true));
PF.kcAParedePorta = () => prefab('kcAParedePorta', (M) => { kcAParede(M, 5.5, [-1.2, 1.2, 0, 2.6], false); M.color(KC_AE.inox); M.cls = 1; M.boxB('steel', -1.3, 1.3, 2.6, 2.7, -0.13, 0.13); M.cls = 0; });
PF.kcAParedeLisa = () => prefab('kcAParedeLisa', (M) => kcAParede(M, 5.5, null, false));
// parede de vidro (pano de vidro com montantes), 4 x 5,5 m: vê através, segura gente e bala
PF.kcAParedeVidro = () => prefab('kcAParedeVidro', (M) => {
  M.local(1); M.color(KC_AE.vidro); M.boxB('glass', -2, 2, 0, 5.5, -0.03, 0.03); M.col(-2, 2, 0, 5.5, -0.06, 0.06, 'glass');
  M.color([0.35, 0.37, 0.4]);
  for (const x of [-2, 0, 2]) M.boxB('steel', x - 0.05, x + 0.05, 0, 5.5, -0.08, 0.08);
  for (const y of [0, 2.6, 5.45]) M.boxB('steel', -2, 2, y, y + 0.05, -0.08, 0.08);
});

// loja de 6 x 5 m: paredes, vitrine de vidro na frente com porta de 2,4 m, placa colorida com um símbolo e o que vende
function kcALoja(M, cor, simbolo, recheio) {
  M.local(1); const X = 3, Z = 2.5, H = 3.2;
  M.color([0.9, 0.9, 0.88]);
  kcParede(M, 'paint', 'x', -Z, -Z + 0.15, -X, X, 0, H); kcParede(M, 'paint', 'z', -X, -X + 0.15, -Z + 0.15, Z, 0, H); kcParede(M, 'paint', 'z', X - 0.15, X, -Z + 0.15, Z, 0, H);
  M.color(KC_COR.laje); M.boxB('concrete', -X, X, H, H + 0.2, -Z, Z); M.col(-X, X, H, H + 0.2, -Z, Z, 'concrete');
  M.color([0.82, 0.8, 0.76]); M.boxB('tiles', -X + 0.15, X - 0.15, 0, 0.02, -Z + 0.15, Z);
  // vitrine: vidro dos lados da porta (a porta, de 2,4 m, fica no meio)
  M.color(KC_AE.vidro); for (const [a, b] of [[-X + 0.15, -1.2], [1.2, X - 0.15]]) { M.boxB('glass', a, b, 0.4, 2.5, Z - 0.05, Z - 0.02); M.col(a, b, 0, 2.5, Z - 0.08, Z, 'glass'); }
  M.color(cor); M.boxB('paint', -X + 0.15, -1.2, 0, 0.4, Z - 0.1, Z); M.boxB('paint', 1.2, X - 0.15, 0, 0.4, Z - 0.1, Z);
  M.boxB('paint', -X, X, 2.5, H, Z - 0.1, Z + 0.05); M.col(-X, X, 2.5, H, Z - 0.1, Z + 0.05, 'concrete');
  // placa
  M.color(cor); M.boxB('paint', -2.2, 2.2, H + 0.2, H + 1.0, Z - 0.1, Z + 0.05);
  M.cls = 1; M.color([0.98, 0.98, 0.96]); simbolo(M, 0, H + 0.6, Z + 0.06); M.cls = 0;
  recheio(M, X, Z);
  M.color([1, 0.97, 0.9]); M.cls = 1; for (const x of [-1.5, 1.5]) M.boxB('lamp', x - 0.4, x + 0.4, H - 0.03, H, -0.5, 0.5); M.cls = 0;
}
// prateleira de parede com produtos coloridos
function kcAPrateleira(M, x0, x1, z, cores, seed) {
  const R = rngOf(seed);
  M.color([0.55, 0.42, 0.3]); M.boxB('wood', x0, x1, 0, 2.2, z, z + 0.45); M.col(x0, x1, 0, 2.2, z, z + 0.45, 'wood');
  M.cls = 1; for (let n = 0; n < 4; n++) { const y = 0.35 + n * 0.5; for (let x = x0 + 0.15; x < x1 - 0.15; x += 0.28) { M.color(R.pick(cores)); M.boxB('plastic', x - 0.1, x + 0.1, y, y + R.range(0.18, 0.35), z + 0.47, z + 0.55); } } M.cls = 0;
}
function kcABalcaoLoja(M, x0, x1, z0, z1, cor) { M.color(cor); M.boxB('paint', x0, x1, 0, 1.0, z0, z1, { bevel: 0.03 }); M.col(x0, x1, 0, 1.05, z0, z1, 'wood'); M.color([0.2, 0.2, 0.22]); M.boxB('steel', x0, x1, 1.0, 1.05, z0, z1); }
PF.kcALojaCafe = () => prefab('kcALojaCafe', (M) => kcALoja(M, [0.42, 0.26, 0.16],
  (M, x, y, z) => { M.save().move(x, y - 0.2, z); M.boxB('paint', -0.18, 0.18, 0, 0.4, 0, 0.02); M.boxB('paint', 0.18, 0.3, 0.12, 0.3, 0, 0.02); M.restore(); },
  (M, X, Z) => { kcABalcaoLoja(M, -2.85, -0.4, -0.2, 0.5, [0.42, 0.26, 0.16]); M.color([0.15, 0.15, 0.16]); M.cls = 1; M.boxB('steel', -2.3, -1.7, 1.05, 1.55, 0, 0.35); M.cls = 0; kcAPrateleira(M, -2.6, 2.6, -2.35, [[0.4, 0.25, 0.15], [0.9, 0.85, 0.75], [0.2, 0.2, 0.2]], 3); }));
PF.kcALojaFarmacia = () => prefab('kcALojaFarmacia', (M) => kcALoja(M, [0.1, 0.55, 0.3],
  (M, x, y, z) => { M.boxB('paint', x - 0.08, x + 0.08, y - 0.27, y + 0.27, z, z + 0.02); M.boxB('paint', x - 0.27, x + 0.27, y - 0.08, y + 0.08, z, z + 0.02); },
  (M, X, Z) => { kcABalcaoLoja(M, 1.2, 2.7, -1.5, 1.0, [0.95, 0.95, 0.93]); kcAPrateleira(M, -2.7, 0.8, -2.35, [[0.95, 0.95, 0.95], [0.2, 0.5, 0.8], [0.9, 0.3, 0.3], [0.3, 0.7, 0.4]], 5); }));
PF.kcALojaLivraria = () => prefab('kcALojaLivraria', (M) => kcALoja(M, [0.2, 0.25, 0.5],
  (M, x, y, z) => { M.boxB('paint', x - 0.3, x - 0.02, y - 0.2, y + 0.2, z, z + 0.02); M.boxB('paint', x + 0.02, x + 0.3, y - 0.2, y + 0.2, z, z + 0.02); },
  (M, X, Z) => { kcAPrateleira(M, -2.7, 2.7, -2.35, [[0.7, 0.15, 0.1], [0.1, 0.3, 0.6], [0.9, 0.8, 0.3], [0.2, 0.5, 0.3], [0.9, 0.9, 0.85]], 7); M.color([0.55, 0.42, 0.3]); M.boxB('wood', -1.0, 1.0, 0, 0.8, -0.3, 0.6); M.col(-1.0, 1.0, 0, 0.85, -0.3, 0.6, 'wood'); }));
PF.kcALojaRoupas = () => prefab('kcALojaRoupas', (M) => kcALoja(M, [0.75, 0.2, 0.45],
  (M, x, y, z) => { M.boxB('paint', x - 0.15, x + 0.15, y - 0.25, y + 0.15, z, z + 0.02); M.boxB('paint', x - 0.32, x + 0.32, y + 0.05, y + 0.2, z, z + 0.02); },
  (M, X, Z) => {
    const R = rngOf(11); M.color(KC_AE.inox);
    for (const z of [-1.4, 0.3]) { M.boxB('steel', -2.2, 1.2, 1.6, 1.64, z - 0.02, z + 0.02); for (const x of [-2.2, 1.2]) M.boxB('steel', x - 0.02, x + 0.02, 0, 1.64, z - 0.02, z + 0.02);
      M.cls = 1; for (let x = -2.0; x < 1.1; x += 0.22) { M.color(R.pick([[0.8, 0.2, 0.3], [0.2, 0.3, 0.6], [0.9, 0.9, 0.85], [0.15, 0.15, 0.15], [0.9, 0.7, 0.2]])); M.boxB('canvas', x - 0.08, x + 0.08, 0.7, 1.58, z - 0.2, z + 0.2); } M.cls = 0; M.color(KC_AE.inox);
      M.col(-2.2, 1.2, 0.7, 1.64, z - 0.2, z + 0.2, 'wood'); }
    kcABalcaoLoja(M, 1.7, 2.7, -1.8, -0.2, [0.95, 0.95, 0.93]);
  }));
PF.kcALojaEletronicos = () => prefab('kcALojaEletronicos', (M) => kcALoja(M, [0.12, 0.12, 0.14],
  (M, x, y, z) => { M.color([0.3, 0.75, 0.95]); M.boxB('lamp', x - 0.35, x + 0.35, y - 0.18, y + 0.22, z, z + 0.02); M.color([0.98, 0.98, 0.96]); M.boxB('paint', x - 0.1, x + 0.1, y - 0.3, y - 0.2, z, z + 0.02); },
  (M, X, Z) => {
    kcABalcaoLoja(M, -2.85, -0.2, -0.6, 0.4, [0.92, 0.92, 0.94]);
    M.cls = 1; for (let x = -2.4; x <= -0.6; x += 0.9) { M.color([0.08, 0.08, 0.1]); M.boxB('dark', x - 0.3, x + 0.3, 1.05, 1.45, -0.2, -0.16); M.color([0.3, 0.6, 0.9]); M.boxB('lamp', x - 0.27, x + 0.27, 1.08, 1.42, -0.16, -0.155); }
    M.color([0.08, 0.08, 0.1]); for (const x of [-1.8, 0, 1.8]) M.boxB('dark', x - 0.7, x + 0.7, 1.2, 2.0, -2.33, -2.3); M.cls = 0;
  }));

// esteira reta de bagagem (ou de raio-x longo), 6 x 0,9 x 1,2 m, com malas: cobre agachado
PF.kcAEsteiraReta = () => prefab('kcAEsteiraReta', (M) => {
  M.local(1); const R = rngOf(31);
  M.color([0.6, 0.62, 0.65]); M.boxB('steel', -3, 3, 0, 0.6, -0.6, 0.6); M.col(-3, 3, 0, 0.9, -0.6, 0.6, 'metal');
  M.color([0.12, 0.12, 0.13]); M.boxB('rubber', -3, 3, 0.6, 0.65, -0.5, 0.5);
  M.color(KC_AE.inox); for (const s of [-1, 1]) M.boxB('steel', -3, 3, 0.6, 0.9, s * 0.6 - 0.04, s * 0.6 + 0.04);
  M.cls = 1; for (let x = -2.4; x < 2.6; x += R.range(0.9, 1.4)) { M.color(R.pick([[0.2, 0.2, 0.22], [0.5, 0.15, 0.15], [0.15, 0.3, 0.55], [0.85, 0.75, 0.2]])); M.boxB('canvas', x - 0.35, x + 0.35, 0.65, 0.65 + R.range(0.25, 0.4), -0.25, 0.25, { bevel: 0.05 }); } M.cls = 0;
});
// palmeira num vaso grande, 2,5 x 3,2 x 2,5 m (só o vaso colide)
PF.kcAPalmeiraVaso = () => prefab('kcAPalmeiraVaso', (M) => {
  M.local(1); const R = rngOf(91);
  M.color([0.85, 0.84, 0.82]); M.lathe('concrete', [[0, 0], [0.45, 0], [0.55, 0.7], [0.6, 0.75], [0, 0.75]], 16); M.col(-0.55, 0.55, 0, 0.75, -0.55, 0.55, 'concrete');
  M.color([0.45, 0.34, 0.22]); M.tube('wood', 0.08, [[0, 0.7, 0], [0.1, 1.8, 0.05], [0.05, 2.6, 0]], 8);
  M.cls = 1; for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU + R.range(-0.2, 0.2); M.color(R() < 0.3 ? [0.2, 0.42, 0.18] : [0.28, 0.52, 0.22]); M.save().move(0.05, 2.6, 0).rotY(a).rotX(R.range(0.7, 1.2)); M.boxB('canvas', -0.12, 0.12, 0, 1.3, -0.006, 0.006); M.save().move(0, 1.3, 0).rotX(0.6); M.boxB('canvas', -0.1, 0.1, 0, 0.6, -0.006, 0.006); M.restore(); M.restore(); } M.cls = 0;
});
// floreira comprida com arbustos, 3 x 1,1 x 0,7 m (cobre agachado)
PF.kcAFloreira = () => prefab('kcAFloreira', (M) => {
  M.local(1); const R = rngOf(73);
  M.color([0.35, 0.36, 0.38]); M.boxB('concrete', -1.5, 1.5, 0, 0.6, -0.35, 0.35, { bevel: 0.03 }); M.col(-1.5, 1.5, 0, 0.6, -0.35, 0.35, 'concrete');
  M.color([0.3, 0.22, 0.15]); M.boxB('canvas', -1.42, 1.42, 0.56, 0.6, -0.28, 0.28);
  M.cls = 1; for (let x = -1.2; x <= 1.2; x += 0.4) { M.color(R() < 0.5 ? [0.22, 0.45, 0.18] : [0.3, 0.55, 0.22]); const r = R.range(0.25, 0.35); M.save().move(x, 0.55, R.range(-0.08, 0.08)); M.lathe('canvas', [[0, 0], [r, r * 0.4], [r * 0.8, r * 1.2], [0, r * 1.5]], 8); M.restore(); } M.cls = 0;
});
// balcão de informações em U, com o "i" em cima, 3,2 x 2,8 x 2 m
PF.kcABalcaoInfo = () => prefab('kcABalcaoInfo', (M) => {
  M.local(1);
  M.color([0.95, 0.95, 0.93]);
  for (const [x0, x1, z0, z1] of [[-1.6, 1.6, 0.5, 1.0], [-1.6, -1.1, -1.0, 0.5], [1.1, 1.6, -1.0, 0.5]]) { M.boxB('paint', x0, x1, 0, 1.05, z0, z1, { bevel: 0.03 }); M.col(x0, x1, 0, 1.1, z0, z1, 'wood'); }
  M.color([0.15, 0.35, 0.7]); M.boxB('paint', -1.62, 1.62, 1.05, 1.1, 0.48, 1.02);
  M.color([0.3, 0.31, 0.33]); M.boxB('steel', -0.04, 0.04, 1.1, 2.4, 0.7, 0.78);
  M.color([0.15, 0.35, 0.7]); M.save().move(0, 2.4, 0.74).rotX(Math.PI / 2); M.cyl('paint', 0.35, 0.08, 20); M.restore();
  M.cls = 1; M.color([0.98, 0.98, 0.96]); M.boxB('paint', -0.05, 0.05, 2.3, 2.47, 0.79, 0.8); M.boxB('paint', -0.05, 0.05, 2.52, 2.58, 0.79, 0.8); M.cls = 0;
});
// fila de check-in: postes de inox com fita azul em zigue-zague, 6 x 1 x 3 m (os postes colidem, a fita não)
PF.kcAFila = () => prefab('kcAFila', (M) => {
  M.local(1);
  const postes = []; for (const z of [-1.5, 0, 1.5]) for (const x of [-3, -1, 1, 3]) postes.push([x, z]);
  for (const [x, z] of postes) { M.color(KC_AE.inox); M.save().move(x, 0, z); M.cyl('steel', 0.18, 0.04, 12); M.cyl('steel', 0.035, 1.0, 8); M.restore(); M.col(x - 0.1, x + 0.1, 0, 1.0, z - 0.1, z + 0.1, 'metal'); }
  M.color([0.15, 0.3, 0.7]); M.cls = 1;
  for (const z of [-1.5, 0, 1.5]) { const [a, b] = z === 0 ? [-1, 3] : [-3, 1]; M.boxB('canvas', a, b, 0.88, 0.95, z - 0.01, z + 0.01); }
  M.cls = 0;
});

// escada externa de concreto, de 0 a 4,5 m: sobe para +z de z -4 a 3,7 (7,7 m) e tem patamar de 2,4 m (z 3,7 a 6,1) na altura 4,5;
// encoste a ponta do patamar (z 6,1) na beira do piso de cima. 2,4 m de largura, guarda-corpo dos dois lados
PF.kcAEscadaExterna = () => prefab('kcAEscadaExterna', (M) => {
  KC_ESCADAS.kcAEscadaExterna = []; M.local(1);
  kcEscadaF(M, 'kcAEscadaExterna', -1.2, 1.2, -4, 3.7, 'z', 0, 4.5, [[-1.25, -4], [-1.25, 3.7]]);
  kcPatamar(M, -1.2, 1.2, 3.7, 6.1, 4.5);
  M.color(KC_COR.ferro); M.cls = 1; M.tube('steel', 0.025, [[1.25, 0.95, -4], [1.25, 5.45, 3.7]], 6); for (let i = 0; i <= 4; i++) { const t = i / 4, z = -4 + t * 7.7, y = t * 4.5; M.boxB('steel', 1.23, 1.27, y, y + 0.95, z - 0.02, z + 0.02); } M.cls = 0;
  for (const s of [-1, 1]) kcGuarda(M, s * 1.22, 3.7, s * 1.22, 6.1, 4.5);
});
// escada rolante (parada, dá para subir) de 0 a 4,5 m, igual à externa no tamanho: degraus de alumínio, laterais de vidro e
// corrimão preto; sobe para +z, patamar no alto (z 3,7 a 6,1)
PF.kcAEscadaRolante = () => prefab('kcAEscadaRolante', (M) => {
  KC_ESCADAS.kcAEscadaRolante = []; M.local(1);
  KC_ESCADAS.kcAEscadaRolante.push({ x0: -1.2, x1: 1.2, z0: -4, z1: 3.7, axis: 'z', h0: 0, h1: 4.5 });
  // corpo maciço por baixo (lateral cinza) e degraus de alumínio
  const n = 23, dh = 4.5 / n;
  for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n, top = (t0 + t1) / 2 * 4.5 + dh / 2, za = -4 + t0 * 7.7, zb = -4 + t1 * 7.7; M.color([0.45, 0.47, 0.5]); M.boxB('steel', -1.3, 1.3, 0, top - 0.04, za, zb); M.color([0.75, 0.77, 0.8]); M.boxB('steel', -1.1, 1.1, top - 0.04, top, za, zb); }
  M.color([0.95, 0.75, 0.1]); M.cls = 1; for (const s of [-1, 1]) M.tube('paint', 0.015, [[s * 1.08, 0.02, -4], [s * 1.08, 4.52, 3.7]], 4); M.cls = 0;
  // laterais de vidro e corrimão
  for (const s of [-1, 1]) {
    const x = s * 1.25; M.color(KC_AE.vidro); M.cls = 1;
    for (let i = 0; i < 8; i++) { const t = i / 8, t2 = (i + 1) / 8, z0 = -4 + t * 7.7, z1 = -4 + t2 * 7.7, y = ((t + t2) / 2) * 4.5; M.boxB('glass', x - 0.02, x + 0.02, y + 0.1, y + 1.0, z0, z1); }
    M.color([0.08, 0.08, 0.09]); M.tube('rubber', 0.04, [[x, 1.0, -4.6], [x, 1.0, -4], [x, 5.5, 3.7], [x, 5.5, 4.3]], 6); M.cls = 0;
  }
  kcPatamar(M, -1.3, 1.3, 3.7, 6.1, 4.5);
  for (const s of [-1, 1]) kcGuarda(M, s * 1.27, 3.7, s * 1.27, 6.1, 4.5);
  M.color([0.45, 0.47, 0.5]); M.boxB('steel', -1.3, 1.3, 0, 0.05, -4.8, -4); // pente da entrada
});

/* ---------- vidro que quebra (objeto "kcVidro" da aba Objetos; o mapa usa com o tamanho em "a": [largura, altura]) ----------
   Um tiro estilhaça o painel e abre o vão. Até lá ele segura gente e bala. */
PF.kcVidroPainel = (w = 2, h = 2) => prefab('kcVidroPainel' + w + 'x' + h, (M) => {
  M.local(1); M.color([0.72, 0.84, 0.9]); M.boxB('carglass', -w / 2, w / 2, 0, h, -0.015, 0.015);
  M.col(-w / 2, w / 2, 0, h, -0.05, 0.05, 'glass');
});
propType('kcVidro', (a) => { const w = a[0] || 2, h = a[1] || 2;
  return { pf: () => PF.kcVidroPainel(w, h), shapes: [BOX(0, h / 2, 0, w / 2, h / 2, 0.02)], mass: 14, mu: 0.5, e: 0.1, resp: 0.6, blast: 2, hp: 1, mat: 'glass', snd: 'plastic', brk: 'glass' }; });
