/* Camuflagens novas do Tiro da Galera (2026-11-26): oito motivos nossos, desenhados como os do jogo (06q-camos.js) numa
   tela de 256 px que se emenda nas bordas, e liberados pelo nível da arma entre o Diamante (20) e o Holo (30), um por nível.
   Os ids só têm letras minúsculas: a chave da arma no online (netWeaponDef) só aceita [a-z.] no camuflagem. */
{
  const N = CAMO_N;
  // linha fechada por pontos, repetida nas nove posições (o que sai de uma borda volta pela outra)
  const poly = (g, pts, fill) => camoWrap(g, () => { g.fillStyle = fill; g.beginPath(); pts.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill(); });
  const soft = (g, x, y, r, col, a) => camoWrap(g, () => {
    const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col.replace('A', a)); gr.addColorStop(1, col.replace('A', 0));
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  });
  const NOVAS = {
    // fibra de carbono: trama em sarja 2x2, cada fio com o brilho no meio
    carbono: { name: 'Carbono', lvl: 21, seed: 113, metal: 0.3, rough: 0.3, base: '#16181b', draw: (g) => {
      const c = 8;
      for (let j = 0; j < N / c; j++) for (let i = 0; i < N / c; i++) {
        const hor = ((i + j) & 3) < 2, x = i * c, y = j * c;
        const gr = hor ? g.createLinearGradient(x, y, x, y + c) : g.createLinearGradient(x, y, x + c, y);
        gr.addColorStop(0, '#0c0d0f'); gr.addColorStop(0.5, '#4d535c'); gr.addColorStop(1, '#0c0d0f');
        g.fillStyle = gr; g.fillRect(x + 0.4, y + 0.4, c - 0.8, c - 0.8);
      }
    } },
    // onça-pintada: rosetas (anel de manchas pretas em volta de um miolo mais escuro) e pintas soltas no dourado
    onca: { name: 'Onça', lvl: 22, seed: 127, base: '#c9963f', draw: (g, rnd) => {
      for (let i = 0; i < 30; i++) camoBlob(g, rnd, rnd() * N, rnd() * N, 14 + rnd() * 18, i % 2 ? '#d6a752' : '#b9853a', 0.7, rnd() * TAU);
      for (let i = 0; i < 34; i++) {
        const cx = rnd() * N, cy = rnd() * N, r = 10 + rnd() * 7, n = 4 + Math.floor(rnd() * 3), a0 = rnd() * TAU;
        camoBlob(g, rnd, cx, cy, r * 0.75, '#9c6326', 0.85, rnd() * TAU);
        for (let k = 0; k < n; k++) { if (rnd() < 0.15) continue; const a = a0 + k / n * TAU; camoBlob(g, rnd, cx + Math.cos(a) * r, cy + Math.sin(a) * r, 4 + rnd() * 2.6, '#1a120b', 0.55 + rnd() * 0.3, a + Math.PI / 2); }
      }
      for (let i = 0; i < 40; i++) camoBlob(g, rnd, rnd() * N, rnd() * N, 2 + rnd() * 2.6, '#1a120b', 0.8, rnd() * TAU);
    } },
    // selva: folhas grandes de vários verdes, com a nervura clara no meio
    selva: { name: 'Selva', lvl: 23, seed: 131, base: '#12301c', draw: (g, rnd) => {
      const cols = ['#1f4f2a', '#2e6b34', '#3f8a3c', '#245c30', '#5a9e44', '#18402a'];
      for (let i = 0; i < 70; i++) {
        const x = rnd() * N, y = rnd() * N, L = 26 + rnd() * 40, W = L * (0.22 + rnd() * 0.14), a = rnd() * TAU, ca = Math.cos(a), sa = Math.sin(a);
        const P = (u, v) => [x + ca * u - sa * v, y + sa * u + ca * v];
        camoWrap(g, () => {
          g.fillStyle = cols[i % cols.length]; g.beginPath(); g.moveTo(...P(0, 0));
          g.quadraticCurveTo(...P(L * 0.45, W * 1.6), ...P(L, 0)); g.quadraticCurveTo(...P(L * 0.45, -W * 1.6), ...P(0, 0)); g.fill();
          g.strokeStyle = 'rgba(160,214,120,0.45)'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(...P(-L * 0.15, 0)); g.lineTo(...P(L * 0.92, 0)); g.stroke();
        });
      }
    } },
    // canarinho: digital em verde, amarelo e um pouco de azul
    canarinho: { name: 'Canarinho', lvl: 24, seed: 137, base: '#1f8a3f', draw: (g, rnd) => camoDigital(g, rnd, ['#0d5c2e', '#1f8a3f', '#1f8a3f', '#1d3f8f', '#f2c31b', '#ffdf4a'], 8) },
    // maré: faixas de onda em azul-petróleo e a espuma clara nas cristas (frequências inteiras: emenda nas bordas)
    mare: { name: 'Maré', lvl: 25, seed: 139, base: '#0b3b52', draw: (g, rnd) => {
      const cols = ['#0e5170', '#13698a', '#1b86a3', '#0a2f44', '#11607f'];
      for (let b = 0; b < 16; b++) {
        const y0 = b * N / 16 + rnd() * 6, k1 = 1 + Math.floor(rnd() * 3), k2 = 3 + Math.floor(rnd() * 3), p1 = rnd() * TAU, p2 = rnd() * TAU, amp = 5 + rnd() * 7, th = 8 + rnd() * 10;
        const yy = (x) => y0 + Math.sin(x / N * TAU * k1 + p1) * amp + Math.sin(x / N * TAU * k2 + p2) * amp * 0.3;
        const top = [], bot = [];
        for (let x = 0; x <= N; x += 4) { top.push([x, yy(x)]); bot.push([x, yy(x) + th]); }
        poly(g, top.concat(bot.reverse()), cols[b % cols.length]);
        camoWrap(g, () => { g.strokeStyle = 'rgba(214,240,246,0.55)'; g.lineWidth = 1.4; g.beginPath(); top.forEach(([x, y], j) => (j ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); });
      }
      for (let i = 0; i < 140; i++) { g.fillStyle = 'rgba(230,248,252,0.5)'; g.fillRect(rnd() * N, rnd() * N, 1 + rnd() * 2, 1); }
    } },
    // grafite: jatos de spray coloridos sobre o cinza, com escorrido e rabiscos pretos
    grafite: { name: 'Grafite', lvl: 26, seed: 149, base: '#2b2c30', draw: (g, rnd) => {
      const cols = ['255,61,127', '38,211,255', '255,224,58', '124,255,79', '176,92,255', '255,122,26'];
      for (let i = 0; i < 26; i++) {
        const x = rnd() * N, y = rnd() * N, r = 14 + rnd() * 22, c = cols[i % cols.length];
        soft(g, x, y, r, `rgba(${c},A)`, 0.95);
        camoBlob(g, rnd, x, y, r * 0.45, `rgb(${c})`, 0.8, rnd() * TAU);
        for (let d = 0; d < 3; d++) { const dx = x + (rnd() - 0.5) * r, len = 8 + rnd() * 26; camoWrap(g, () => { g.fillStyle = `rgb(${c})`; g.fillRect(dx, y, 1.6, len); g.beginPath(); g.arc(dx + 0.8, y + len, 1.6, 0, TAU); g.fill(); }); }
      }
      for (let k = 0; k < 9; k++) {
        let x = rnd() * N, y = rnd() * N, a = rnd() * TAU; const pts = [[x, y]];
        for (let s = 0; s < 10; s++) { a += (rnd() - 0.5) * 2.4; x += Math.cos(a) * 9; y += Math.sin(a) * 9; pts.push([x, y]); }
        camoWrap(g, () => { g.strokeStyle = '#0b0b0d'; g.lineWidth = 2.2; g.lineCap = g.lineJoin = 'round'; g.beginPath(); pts.forEach(([px, py], j) => (j ? g.lineTo(px, py) : g.moveTo(px, py))); g.stroke(); });
      }
    } },
    // galáxia: nebulosas roxas, magenta e azuis no escuro, estrelas miúdas e algumas grandes com cruz
    galaxia: { name: 'Galáxia', lvl: 27, seed: 151, metal: 0.25, rough: 0.4, base: '#07061a', draw: (g, rnd) => {
      const cols = ['120,60,220', '220,60,170', '50,90,230', '90,40,140', '40,160,220'];
      for (let i = 0; i < 40; i++) soft(g, rnd() * N, rnd() * N, 30 + rnd() * 60, `rgba(${cols[i % cols.length]},A)`, 0.22 + rnd() * 0.2);
      for (let i = 0; i < 420; i++) { g.fillStyle = `rgba(255,255,255,${0.35 + rnd() * 0.6})`; const s = rnd() < 0.85 ? 1 : 1.6; g.fillRect(rnd() * N, rnd() * N, s, s); }
      for (let i = 0; i < 12; i++) {
        const x = rnd() * N, y = rnd() * N, r = 4 + rnd() * 5;
        soft(g, x, y, r, 'rgba(230,220,255,A)', 0.9);
        camoWrap(g, () => { g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillRect(x - r * 1.6, y - 0.4, r * 3.2, 0.8); g.fillRect(x - 0.4, y - r * 1.6, 0.8, r * 3.2); });
      }
    } },
    // rubi: pedra lapidada, quatro facetas por casa (cruzando no centro), vermelhos do vinho ao rosado, e pontos de brilho
    rubi: { name: 'Rubi', lvl: 28, seed: 157, metal: 0.85, rough: 0.18, base: '#8a0d1e', draw: (g, rnd) => {
      const c = 32, cols = ['#5e0714', '#8a0d1e', '#c21a33', '#e8394f', '#a3122a', '#ff6b7c'];
      for (let y = 0; y < N; y += c) for (let x = 0; x < N; x += c) {
        const m = [x + c / 2 + (rnd() - 0.5) * 8, y + c / 2 + (rnd() - 0.5) * 8], q = [[x, y], [x + c, y], [x + c, y + c], [x, y + c]];
        for (let k = 0; k < 4; k++) { g.fillStyle = cols[Math.floor(rnd() * cols.length)]; g.beginPath(); g.moveTo(...q[k]); g.lineTo(...q[(k + 1) % 4]); g.lineTo(...m); g.closePath(); g.fill(); }
      }
      for (let i = 0; i < 70; i++) { g.fillStyle = 'rgba(255,230,235,0.8)'; g.fillRect(rnd() * N, rnd() * N, 1.5, 1.5); }
    } },
    // cromado (pedido do Thiago, 2026-11-26, depois da comparação com o cromado da Corrida): o espelho puro copiava a cor do mapa e,
    // nas faces retas das armas, virava uma cor lisa. Este tem prata própria (aço escovado na tela) e faixas de luz de estúdio que
    // correm pela arma conforme ela se mexe (shader abaixo, no lugar da cor do motivo, como o Holo)
    cromo: { name: 'Cromado', lvl: 29, seed: 163, metal: 0.85, rough: 0.16, scale: 0.3, base: '#b4b8bd', draw: (g, rnd) => {
      for (let i = 0; i < 900; i++) { const y = rnd() * N, a = 0.05 + rnd() * 0.12; g.fillStyle = rnd() < 0.5 ? `rgba(255,255,255,${a})` : `rgba(60,64,70,${a})`; g.fillRect(0, y, N, 0.6 + rnd() * 1.2); }
    } },
  };
  for (const id in NOVAS) {
    const { base, draw, ...c } = NOVAS[id];
    CAMOS[id] = Object.assign(c, { id }); CAMO_BASE[id] = base; CAMO_DRAW[id] = draw;
  }
  // a lista do menu segue a ordem de CAMOS: reordena pelo nível, para as novas ficarem entre o Diamante e o Holo
  const ord = Object.values(CAMOS).sort((a, b) => a.lvl - b.lvl);
  for (const c of ord) delete CAMOS[c.id];
  for (const c of ord) CAMOS[c.id] = c;

  /* Shader do Cromado: troca a cor do motivo por prata escovada e soma faixas de luz no reflexo (no espaço da vista: deslizam quando a
     arma se mexe), o céu mais claro em cima e um liseré nas bordas. Programa próprio (chave '-cromo'), as outras camuflagens não mudam */
  const ALVO = 'else diffuseColor.rgb = pow(cc, vec3(2.2)) * 0.74;';
  const CROMO = `else {
    vec3 cN = normalize(vNormal), cV = normalize(vViewPosition), cR = reflect(-cV, cN);
    float cRim = 1.0 - clamp(dot(cN, cV), 0.0, 1.0);
    diffuseColor.rgb = pow(vec3(0.58, 0.6, 0.63) * (0.8 + 0.4 * cc.r), vec3(2.2));
    float cB1 = pow(0.5 + 0.5 * sin((cR.y * 2.7 + cR.x * 0.9 + dot(vCamoP, vec3(0.2, 1.4, 0.8))) * 6.2832), 16.0);
    float cB2 = pow(0.5 + 0.5 * sin((cR.y * 1.1 - cR.x * 2.3 + cR.z * 0.7) * 6.2832 + 1.7), 28.0);
    float cSky = smoothstep(-0.3, 0.9, cR.y);
    camoGlow = vec3(0.88, 0.92, 0.97) * (0.015 + 0.05 * cSky + cRim * cRim * 0.25 + cB1 * 0.6 + cB2 * 0.4);
  }`;
  const orig = camoPatch;
  camoPatch = function (m, id) {
    const r = orig(m, id);
    if (id !== 'cromo') return r;
    const ob = m.onBeforeCompile, key = m.customProgramCacheKey();
    m.onBeforeCompile = (sh, rd) => { ob(sh, rd); sh.fragmentShader = sh.fragmentShader.replace(ALVO, CROMO); };
    m.customProgramCacheKey = () => key + '-cromo';
    return m;
  };
  // miniatura do menu: um degradê de cromo (a tela do motivo é só o aço escovado)
  {
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 64, 64);
    [['#f4f6f8', 0], ['#7d848d', 0.38], ['#f8fafc', 0.52], ['#4a5059', 0.78], ['#d9dde2', 1]].forEach(([col, t]) => gr.addColorStop(t, col));
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); CAMO_SWATCH.cromo = c.toDataURL('image/png');
  }
}
