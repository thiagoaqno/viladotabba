// Gera ferramentas/tiro-mapas/editor/favela.json (mapa "Favela" do Tiro da Galera, 2026-11-26).
// Rode: node ferramentas/tiro-mapas/favela-gerar.js  (depois de mexer no mapa pelo editor, NÃO rode de novo: ele sobrescreve)
// Plano (70 x 88 m jogáveis, três rotas): o Alpha nasce no sul (+z), o Bravo no norte (-z); a metade sul é feita aqui e espelhada.
//   Beco oeste (x -28 a -19) com o mercado perto do meio; bloco oeste de casas; praça central com a árvore; prédio dos Telhados
//   (laje a 3 m, passagem por baixo, passarela até o bloco leste); bloco leste com escada para a laje; beco leste com a casa em obra.
//   Em volta, fora do limite (parede invisível), mais casas para fechar a vista.
const fs = require('fs');
const path = require('path');

const C = {
  rua: [0.74, 0.7, 0.63], praca: [0.8, 0.78, 0.74], tijolo: [0.86, 0.5, 0.36], laje: [0.66, 0.65, 0.62], madeira: [0.62, 0.46, 0.32],
  amarelo: [0.95, 0.78, 0.15], azul: [0.15, 0.35, 0.75], verde: [0.1, 0.55, 0.3], branco: [0.92, 0.92, 0.9], reboco: [0.8, 0.79, 0.75],
};
const sul = [];   // peças da metade sul (z > 0): espelhadas no norte
const meio = [];  // peças em z = 0 (uma vez só)
const fora = [];  // cenário fora do limite (também espelhado)
const caixa = (L, x0, x1, y0, y1, z0, z1, m, cor, o = {}) => L.push(Object.assign({ t: 'caixa', p: [(x0 + x1) / 2, y0, (z0 + z1) / 2], s: [x1 - x0, y1 - y0, z1 - z0], r: 0, m, cor }, o));
const pf = (L, nome, x, z, r = 0, y = 0) => L.push({ t: 'prefab', nome, p: [x, y, z], r, e: 1 });
const prop = (L, nome, x, z, r = 0, y = 0) => L.push({ t: 'prop', nome, p: [x, y, z], r });
// escada de 3 m: (x, z) é o centro; sobe para +z com r 0, -z com 180, +x com 90, -x com 270
const escada = (L, x, z, r, h = 3) => L.push({ t: 'escada', p: [x, 0, z], s: [2, h, h === 3 ? 5.5 : 3], r, m: 'concrete', cor: C.laje });

// ---------- chão (a rua inteira, de uma vez) e o limite ----------
caixa(meio, -44, 44, -0.3, 0, -56, 56, 'cobble', C.rua);
caixa(meio, -12, 12, 0, 0.02, -12, 12, 'pavers', C.praca, { col: false });
for (const x of [-30, 30]) caixa(meio, x - 0.1, x + 0.1, 0, 6, -44, 44, 'glass', [0.6, 0.8, 1], { inv: true });
caixa(sul, -30, 30, 0, 6, 43.9, 44.1, 'glass', [0.6, 0.8, 1], { inv: true });

// ---------- base do Alpha (x -9 a 9, z 33 a 43) ----------
pf(sul, 'kcCasaTijolo', -12, 38, 90);          // casa de frente para a base (a porta olha +x)
pf(sul, 'kcCasaTelhado', 12, 38, 270);
pf(sul, 'kcPortaoGaragem', -5, 43.6, 180); pf(sul, 'kcPortaoGaragem', 5, 43.6, 180);
caixa(sul, -9, 9, 0, 2.9, 43.8, 44.4, 'brick', C.tijolo);
pf(sul, 'kcCaixaDagua', -7.6, 34.5); prop(sul, 'barrel', 7.5, 34.2); prop(sul, 'barrel', 8.1, 34.8, 0.6);
caixa(sul, -0.8, 0.8, 0, 0.02, 40, 41.6, 'paint', C.verde, { col: false }); caixa(sul, -0.5, 0.5, 0.02, 0.03, 40.3, 41.3, 'paint', C.amarelo, { col: false });

// ---------- Telhados: prédio de x -9 a 9, z 21 a 27, laje a 3 m, passagem de 3 m no meio ----------
caixa(sul, -9, -1.5, 0, 3, 21, 27, 'brick', C.tijolo); caixa(sul, 1.5, 9, 0, 3, 21, 27, 'brick', C.tijolo);
caixa(sul, -1.5, 1.5, 2.6, 3, 21, 27, 'concrete', C.laje);
caixa(sul, -9.1, 9.1, 3, 3.15, 20.9, 27.1, 'concrete', C.laje);
caixa(sul, -9.1, -3, 3.15, 3.65, 20.9, 21.15, 'brick', C.tijolo); caixa(sul, 3, 9.1, 3.15, 3.65, 20.9, 21.15, 'brick', C.tijolo); // mureta olhando a praça
escada(sul, -6, 29.75, 180); escada(sul, 6, 29.75, 180);   // sobem da base para a laje
pf(sul, 'kcPortaoGaragem', -5.5, 21, 180); pf(sul, 'kcPortaoGaragem', 5.5, 21, 180);
pf(sul, 'kcCaixaDagua', -7.8, 26, 0, 3.15); pf(sul, 'kcAntena', 7.8, 26.3, 200, 3.15); pf(sul, 'kcArCondicionado', -3.5, 27, 0, 1.9);
// passarela da laje dos Telhados até a laje do bloco leste
caixa(sul, 9, 13, 2.95, 3.15, 23.5, 25.5, 'timber', C.madeira);
caixa(sul, 9, 13, 3.15, 4.1, 23.45, 23.55, 'steel', [0.86, 0.72, 0.18], { col: false }); caixa(sul, 9, 13, 3.15, 4.1, 25.45, 25.55, 'steel', [0.86, 0.72, 0.18], { col: false });

// ---------- bloco leste: x 13 a 19, z 18 a 30, laje a 3 m, escada pelo beco leste ----------
caixa(sul, 13, 19, 0, 3, 18, 30, 'brick', C.tijolo);
caixa(sul, 12.9, 19.1, 3, 3.15, 17.9, 30.1, 'concrete', C.laje);
caixa(sul, 19, 21, 0, 3.15, 23.5, 25.5, 'concrete', C.laje);     // patamar no topo da escada
escada(sul, 20, 20.75, 0);                                        // sobe de z 18 (chão) até z 23,5 (patamar)
pf(sul, 'kcPortaoGaragem', 16, 18, 180); pf(sul, 'kcArCondicionado', 13, 26, 270, 2.0);
pf(sul, 'kcCaixaDagua', 17.6, 28.6, 0, 3.15); pf(sul, 'kcCaixaDagua', 14.4, 28.6, 0, 3.15);
caixa(sul, 13, 19, 3.15, 3.6, 29.9, 30.1, 'brick', C.tijolo);

// ---------- bloco oeste: sobrado e casa (a casa dá para entrar pela praça), vão de 2 m entre eles ----------
pf(sul, 'kcSobrado', -16, 25, 90);      // x -18,5 a -13,5, z 22 a 28
pf(sul, 'kcCasaTijolo', -16, 17.5, 90); // x -18,5 a -13,5, z 15 a 20 (porta para +x)
pf(sul, 'kcCasaConcreto', -22, 40.5, 0);   // no canto do beco oeste, perto da base
pf(sul, 'kcPuxadinho', -22.5, 21, 90);  // sombra no beco oeste, na boca do vão
pf(sul, 'kcPoste', -27.5, 30); pf(sul, 'kcPoste', 27.5, 30);

// ---------- beco oeste e mercado (perto do meio) ----------
pf(sul, 'kcBarraca', -23, 6, 90); pf(sul, 'kcBarracaAzul', -16.5, 4.5, 0); pf(sul, 'kcBarraca', -20, 10.5, 180);
pf(sul, 'stCrateStack', -26.5, 9, 0); prop(sul, 'barrel', -27.2, 12.5); prop(sul, 'barrel', -26.6, 13.1, 0.7);
pf(sul, 'kcGuardaSol', -14, 9.5);
pf(sul, 'kcLanchonete', -26, 16, 90);   // x -27,9 a -24,1, encostada no limite
pf(sul, 'kcBananeira', -28.5, 26); pf(sul, 'kcBananeira', -28.6, 34);
caixa(sul, -28, -25, 0, 1.0, 37, 37.4, 'brick', C.tijolo);   // mureta de cobertura no beco

// ---------- beco leste: casa em obra perto do meio, cobertura ----------
pf(sul, 'kcCasaObra', 23.2, 7, 270);    // x 20,2 a 26,2: a frente olha -x (para a praça)
pf(sul, 'kcMuroPortao', 25, 13.5, 0);
pf(sul, 'kcBananeira', 28.4, 15.5); pf(sul, 'kcCaixaDagua', 27.8, 35); pf(sul, 'stCrateStack', 23, 33, 1.57);
caixa(sul, 22, 25, 0, 1.0, 26, 26.4, 'brick', C.tijolo);

// ---------- praça central ----------
pf(meio, 'kcArvoreCanteiro', 0, 0);
pf(sul, 'stCrateStack', 7, 6, 0.3); pf(sul, 'stCrateStack', -8, 8.5, 1.2);
caixa(sul, 3, 6, 0, 0.9, 10.5, 10.9, 'brick', C.tijolo); caixa(sul, -6.5, -3.5, 0, 0.9, 14.6, 15, 'brick', C.tijolo);
caixa(meio, -8.4, -7.6, 0, 0.9, -1.5, 1.5, 'brick', C.tijolo); caixa(meio, 7.6, 8.4, 0, 0.9, -1.5, 1.5, 'brick', C.tijolo);
caixa(sul, -3, 0, 0, 0.02, 7.5, 8.3, 'paint', C.amarelo, { col: false }); caixa(sul, 0, 3, 0, 0.02, 7.5, 8.3, 'paint', C.azul, { col: false });
pf(sul, 'kcPoste', 10.5, 12.5); pf(sul, 'kcGuardaSol', 9, 3);

// ---------- cenário fora do limite (casas fechando a vista; ninguém chega lá) ----------
const CASAS = ['kcCasaTelhado', 'kcSobrado', 'kcCasaTijolo', 'kcPredioVelho', 'kcCasaConcreto2', 'kcCasaObra', 'kcSobrado', 'kcCasaTelhado'];
let k = 0;
for (let z = 4; z <= 49; z += 9, k++) {
  pf(fora, CASAS[k % CASAS.length], -35, z, 90); pf(fora, CASAS[(k + 3) % CASAS.length], 35, z, 270);
  if (k % 2) { pf(fora, 'kcBananeira', -31.5, z + 3.5); pf(fora, 'kcCaixaDagua', 31.4, z - 3.5); }
}
for (let x = -27, i = 0; x <= 27; x += 9, i++) pf(fora, CASAS[(i + 1) % CASAS.length], x, 49, 180);
pf(fora, 'kcPoste', -30.8, 44.8); pf(fora, 'kcPoste', 30.8, 44.8);

// ---------- espelho: o norte é o sul com z trocado (o prefab gira 180 - r) ----------
const espelha = (P) => { const Q = JSON.parse(JSON.stringify(P)); Q.p[2] = -Q.p[2]; Q.r = (((180 - (Q.r || 0)) % 360) + 360) % 360; return Q; };
const pecas = [...meio, ...sul, ...sul.map(espelha), ...fora, ...fora.map(espelha)];
for (const P of pecas) { P.p = P.p.map((v) => Math.round(v * 1000) / 1000); if (P.s) P.s = P.s.map((v) => Math.round(v * 1000) / 1000); }

const nascer = [[-4, 39], [-1.5, 39], [1.5, 39], [4, 39], [-3, 41.5], [0, 41], [3, 41.5], [-5.5, 36], [5.5, 36], [-2, 36.5], [2, 36.5]];
const poiSul = [
  // [x, y, z, segura]: 1 = o bot para e segura a posição (lajes, janelas, cantos)
  [0, 0, 33], [-6, 3.15, 22.5, 1], [6, 3.15, 22.5, 1], [0, 0, 24], [11, 0, 24], [16, 3.15, 19.5, 1], [17, 3.15, 27], [20, 0, 15], [24, 0, 27],
  [27.5, 0, 8], [24, 0, 7, 1], [-11, 0, 17.5], [-16, 0, 17.5, 1], [-23, 0, 24], [-24, 0, 33], [-27, 0, 3, 1], [-20, 0, 4], [-15, 0, 11],
  [-25, 0, 12, 1], [8, 0, 9], [-5, 0, 11, 1], [14, 0, 10], [-22, 0, 37.5, 1], [24, 0, 26.8, 1],
];
const poi = [[0, 0, 3.6], [-9, 0, 0], [9, 0, 0], [-24, 0, 0], [24, 0, 0], ...poiSul, ...poiSul.map(([x, y, z, h]) => [x, y, -z, h || 0])];

const J = {
  id: 'favela', nome: 'Favela', tag: 'Morro carioca', ceu: 'meltem', mar: null,
  desc: 'Becos estreitos, lajes e uma praça com uma árvore no meio. Três rotas: o mercado a oeste, a praça e o beco leste; por cima, os telhados.',
  pecas, nascer, dom: [[-22, 0], [0, 0], [22, 0]], mecha: [[-22, 0], [10.5, 0], [22, 0]], poi,
  sniper: [0, 3.15, 24], som: 'concrete',
  zonas: [
    ['Base Alpha', -30, 30, 31, 44], ['Base Bravo', -30, 30, -44, -31], ['Telhados', -12, 12, 18, 31], ['Oficina', -12, 12, -31, -18],
    ['Praça central', -12, 12, -18, 18], ['Mercado', -30, -12, -14, 14], ['Beco oeste', -30, -12, -31, 31], ['Beco leste', 12, 30, -31, 31],
  ],
};
const out = path.join(__dirname, 'editor', 'favela.json');
fs.writeFileSync(out, JSON.stringify(J, null, 1) + '\n');
console.log('gravado', out, pecas.length, 'peças');
