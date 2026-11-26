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
