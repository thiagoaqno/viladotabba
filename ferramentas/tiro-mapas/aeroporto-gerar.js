// Gera ferramentas/tiro-mapas/editor/aeroporto.json (mapa "Aeroporto" do Tiro da Galera, 2026-11-26), pelo desenho do Thiago:
//   - terminal no piso de cima (y 4,5, maciço por baixo) ocupando o sul (z 6,5 a 44), com o salão da segurança no meio (duas
//     paredes em colchete, entradas de 6 m em cima e embaixo) e dois blocos fechados (loja e café) dos lados;
//   - plataforma alta a oeste (x -40 a -10,5, z -5 a 6,5) e a rampa larga que desce dela até o pátio;
//   - pátio (y 0) ao norte, com o avião (cabine em y 4,5), a escada do avião e a ponte de embarque em "L" até o terminal.
// O Alpha nasce no fundo do terminal (sul); o Bravo, espelhado, no fundo do pátio (norte).
// Rode: node ferramentas/tiro-mapas/aeroporto-gerar.js  (depois de mexer no mapa pelo editor, NÃO rode de novo: ele sobrescreve)
const fs = require('fs');
const path = require('path');

const Y = 4.5; // o piso de cima
const C = { branco: [0.93, 0.93, 0.92], cinza: [0.6, 0.61, 0.63], escuro: [0.32, 0.33, 0.36], vidro: [0.6, 0.75, 0.82], amarelo: [0.95, 0.78, 0.15], piso: [0.85, 0.84, 0.8], asfalto: [0.42, 0.42, 0.44], concreto: [0.72, 0.71, 0.68] };
const pecas = [];
const caixa = (x0, x1, y0, y1, z0, z1, m, cor, o = {}) => pecas.push(Object.assign({ t: 'caixa', p: [(x0 + x1) / 2, y0, (z0 + z1) / 2], s: [x1 - x0, y1 - y0, z1 - z0], r: 0, m, cor }, o));
const pf = (nome, x, y, z, r = 0, e) => pecas.push(Object.assign({ t: 'prefab', nome, p: [x, y, z], r }, e ? { e } : {}));
const luz = (x, y, z) => pecas.push({ t: 'luz', p: [x, y, z], forca: 1.3, raio: 12, cor: [1, 0.95, 0.85] });
const grafite = (x, y, z, r, s, texto, estilo, cor, borda) => pecas.push({ t: 'grafite', p: [x, y, z], r, s, texto, estilo, cor, borda: borda || [0.08, 0.08, 0.1] });

// ---------- chão do pátio, faixas e limite ----------
caixa(-46, 46, -0.3, 0, -50, 50, 'asphalt', C.asfalto);
caixa(14.1, 14.5, 0, 0.02, -43, 3, 'paint', C.amarelo, { col: false });            // linha do avião
caixa(-20, 10, 0, 0.02, -36.2, -35.8, 'paint', C.amarelo, { col: false });
caixa(-20, -19.6, 0, 0.02, -43, -10, 'paint', C.amarelo, { col: false });
caixa(30, 39, 0, 0.02, -40, -39.6, 'paint', [0.85, 0.15, 0.12], { col: false });
for (const x of [-40.1, 40.1]) caixa(x - 0.1, x + 0.1, 0, 14, -44, 44, 'glass', [0.6, 0.8, 1], { inv: true });
caixa(-40, 40, 0, 14, -43.6, -43.4, 'glass', [0.6, 0.8, 1], { inv: true });

// ---------- terminal (piso de cima, maciço por baixo) e plataforma oeste ----------
caixa(-40, 40, 0, Y, 6.5, 44, 'concrete', C.concreto);
caixa(-40, -10.5, 0, Y, -5, 6.5, 'concrete', C.concreto);
caixa(-40, 40, Y, Y + 0.02, 6.5, 44, 'tiles', C.piso, { col: false });
caixa(-40, -10.5, Y, Y + 0.02, -5, 6.5, 'tiles', C.piso, { col: false });
// rampa larga: sobe do pátio (z -26) até a plataforma (z -5)
pecas.push({ t: 'escada', p: [-34.85, 0, -15.6], s: [9.7, Y, 21.2], r: 0, m: 'concrete', cor: C.concreto });
// guarda-corpo de vidro na beira (1,1 m), com o vão da ponte de embarque (x 25,4 a 28,4)
caixa(-10.5, 25.4, Y, Y + 1.1, 6.5, 6.75, 'glass', C.vidro); caixa(28.4, 40, Y, Y + 1.1, 6.5, 6.75, 'glass', C.vidro);
// janelão do corredor da frente: 20 painéis de vidro que quebram com tiro (objeto kcVidro), do guarda-corpo (5,6) a 9,4 m, com
// montantes de aço, viga em cima e o teto fechando a faixa da frente
{
  const faixas = [[-10.5, 25.4, 15], [28.4, 39.7, 5]];
  for (const [x0, x1, n] of faixas) {
    const w = (x1 - x0) / n;
    for (let i = 0; i < n; i++) pecas.push({ t: 'prop', nome: 'kcVidro', p: [+(x0 + (i + 0.5) * w).toFixed(3), Y + 1.1, 6.62], r: 0, a: [+(w - 0.1).toFixed(2), 3.8] });
    for (let i = 0; i <= n; i++) { const x = x0 + i * w; caixa(x - 0.05, x + 0.05, Y + 1.1, Y + 4.9, 6.55, 6.7, 'steel', C.escuro); }
  }
  caixa(-10.5, 40, Y + 4.9, 10, 6.5, 6.8, 'paint', C.branco);
  caixa(-10.5, 40, 10, 10.3, 6.5, 9, 'paint', C.branco);
}
caixa(-29.8, -10.5, Y, Y + 1.1, -5, -4.75, 'glass', C.vidro); caixa(-10.75, -10.5, Y, Y + 1.1, -4.75, 6.5, 'glass', C.vidro);
// paredes, colunas e teto do terminal (o teto começa 2,5 m para dentro: a beira fica aberta para o pátio)
caixa(-40, 40, Y, 10, 43.7, 44, 'paint', C.branco); caixa(-40, -39.7, Y, 10, 6.5, 44, 'paint', C.branco); caixa(39.7, 40, Y, 10, 6.5, 44, 'paint', C.branco);
caixa(-40, 40, 10, 10.3, 9, 44, 'paint', C.branco);
for (const x of [-30, -15, 0, 15, 33]) caixa(x - 0.3, x + 0.3, Y, 10, 9, 9.6, 'paint', C.branco);
for (const x of [-30, -15, 0, 15, 30]) for (const z of [15, 30, 40]) luz(x, 9.4, z);

// ---------- salão da segurança (duas paredes em colchete; entradas de 6,3 m em cima e embaixo) ----------
const P = (x0, x1, z0, z1) => caixa(x0, x1, Y, Y + 3, z0, z1, 'paint', [0.85, 0.86, 0.88]);
P(-12, 2.5, 15, 15.3); P(-12, -11.7, 15, 36.7); P(-12, 2.5, 36.4, 36.7);
P(8.8, 23.7, 15, 15.3); P(23.4, 23.7, 15, 36.7); P(8.8, 23.7, 36.4, 36.7);
pf('kcARaioX', -4, Y, 21); pf('kcARaioX', 15.5, Y, 21); pf('kcAPortico', -4, Y, 25.5); pf('kcAPortico', 15.5, Y, 25.5);
pf('kcACadeiras', -6, Y, 31); pf('kcACadeiras', 17, Y, 31); pf('kcACadeiras', -6, Y, 33.5, 180); pf('kcACadeiras', 17, Y, 33.5, 180);
pf('kcAPainelVoos', 5.6, Y, 30, 0);
grafite(-11.68, Y + 1, 26, 90, [6, 1.6], 'EMBARQUE', 'pixo', [0.1, 0.25, 0.6]);

// ---------- blocos fechados (loja e café) ----------
caixa(-31.7, -21, Y, Y + 4, 16.3, 36, 'paint', [0.36, 0.38, 0.42]); caixa(-31.7, -21, Y + 4, Y + 4.2, 16.3, 36, 'paint', C.branco);
caixa(-21.05, -21, Y + 0.3, Y + 3, 18, 34, 'glass', [0.25, 0.32, 0.38], { col: false });
grafite(-20.98, Y + 3, 26, 90, [7, 1.2], 'FREE SHOP', 'bomb', [0.95, 0.78, 0.15]);
caixa(29.7, 39.7, Y, Y + 4, 15.5, 36.7, 'paint', [0.55, 0.32, 0.22]); caixa(29.7, 39.7, Y + 4, Y + 4.2, 15.5, 36.7, 'paint', C.branco);
caixa(29.65, 29.7, Y + 0.3, Y + 3, 18, 34, 'glass', [0.25, 0.32, 0.38], { col: false });
grafite(29.62, Y + 3, 26, 270, [5, 1.2], 'CAFÉ', 'tag', [0.98, 0.9, 0.75], [0.3, 0.15, 0.08]);

// ---------- frente do terminal: check-in, cadeiras, painel; fundo: esteira e plantas ----------
for (const x of [-37, -33.5, -30, -26.5]) pf('kcABalcao', x, Y, 11.5, 180);
for (const [x, z] of [[-6, 10.8], [-2, 12.6], [5, 10.8], [12, 12.6], [18, 10.8], [22, 12.6]]) pf('kcACadeiras', x, Y, z);
pf('kcAPainelVoos', 8, Y, 8.3, 180);
pf('kcAEsteira', -32, Y, 40.5); pf('kcAEsteira', 34, Y, 40.5);
for (const [x, z] of [[-17, 42.8], [27, 42.8], [-38.8, 8], [38.8, 8], [-38.8, 2]]) pf('kcVasoPlanta', x, Y, z);
grafite(5, Y + 2.5, 43.68, 180, [10, 1.6], 'AEROPORTO DA GALERA', 'bomb', [0.15, 0.4, 0.8]);

// ---------- avião, escada do avião e ponte de embarque ----------
pf('kcAAviao', 14.3, Y, -17.5);
pecas.push({ t: 'escada', p: [7.75, 0, -29], s: [3, Y, 9], r: 90, m: 'steel', cor: [0.9, 0.9, 0.92] });
// ponte em "L": trecho do avião (x 16,35 a 28,4, z -5,5 a -2,5) e trecho até o terminal (x 25,4 a 28,4, z -2,5 a 6,5)
caixa(16.35, 28.4, Y - 0.3, Y, -5.5, -2.5, 'steel', C.cinza); caixa(25.4, 28.4, Y - 0.3, Y, -2.5, 6.5, 'steel', C.cinza);
caixa(16.35, 28.5, Y, Y + 2.6, -5.6, -5.5, 'corrugated', C.cinza); caixa(16.35, 25.4, Y, Y + 2.6, -2.5, -2.4, 'corrugated', C.cinza);
caixa(25.3, 25.4, Y, Y + 2.6, -2.4, 6.5, 'corrugated', C.cinza); caixa(28.4, 28.5, Y, Y + 2.6, -5.6, 6.5, 'corrugated', C.cinza);
caixa(16.35, 28.5, Y + 2.6, Y + 2.8, -5.6, -2.4, 'corrugated', C.escuro); caixa(25.3, 28.5, Y + 2.6, Y + 2.8, -2.4, 6.5, 'corrugated', C.escuro);
for (const [x, z] of [[26.9, -4], [26.9, 2.5]]) caixa(x - 0.35, x + 0.35, 0, Y - 0.3, z - 0.35, z + 0.35, 'steel', C.escuro);

// ---------- pátio: carrinhos, contêineres, cones, barreiras, combustível ----------
pf('kcACarrinhoBagagem', -4, 0, -12, 90); pf('kcACarrinhoBagagem', 28, 0, -15, 0);
pf('kcConteinerAberto', -24, 0, -33, 90); pf('kcConteinerAberto', 32, 0, -30, 0);
pf('kcTanque', -30, 0, -40, 0); pf('kcIBC', -12, 0, -22); pf('kcIBC', -11, 0, -23.3);
pf('kcJersey', -2, 0, -2, 0); pf('kcJersey', 33, 0, -5, 90); pf('kcJersey', -16, 0, -40, 0);
pf('kcTamboresAzuis', 20, 0, -36); pf('kcPaletes', 36, 0, -18); pf('kcPaletes', -27, 0, -8);
for (const [x, z] of [[9, -2], [10, -4], [19, -8], [20, -10], [-6, -20], [4, -33]]) pf('kcCone', x, 0, z);
pf('kcPoste', -18, 0, 2); pf('kcPoste', 36, 0, 2); pf('kcPoste', 0, 0, -42);

const nascer = [[-14, 40], [-10, 40], [-6, 40], [-2, 40], [2, 40], [9, 40], [13, 40], [17, 40], [21, 40], [-12, 42], [15, 42]];
const J = {
  id: 'aeroporto', nome: 'Aeroporto', tag: 'Terminal e pátio', ceu: 'meltem', ambiente: 'amb_floreal', mar: null,
  desc: 'O terminal fica no alto e o pátio embaixo. Rampa larga a oeste, ponte de embarque até o avião e a escada dele do lado da pista.',
  pecas, nascer,
  dom: [[5.6, 26, Y], [-25, 0.5, Y], [-8, -26]],
  mecha: [[-15, -30], [0, -12], [30, -25]],
  som: 'concrete',
  zonas: [
    ['Salão da segurança', -12, 23.7, 15, 36.7], ['Terminal', -40, 40, 6.5, 44], ['Ponte de embarque', 16, 28.5, -6, 6.5],
    ['Avião', 11, 18, -40, 5], ['Plataforma', -40, -10.5, -5, 6.5], ['Rampa', -40, -29.8, -27, -5], ['Pátio', -40, 40, -44, 6.5],
  ],
};
const out = path.join(__dirname, 'editor', 'aeroporto.json');
fs.writeFileSync(out, JSON.stringify(J, null, 1) + '\n');
console.log('gravado', out, pecas.length, 'peças');
