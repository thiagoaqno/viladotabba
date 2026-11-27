// Gera ferramentas/tiro-mapas/editor/favela-grande.json (mapa "Favela Grande" do Tiro da Galera, 2026-11-27, para o Battle royale).
// Rode: node ferramentas/tiro-mapas/favela-grande-gerar.js  (lê o favela.json de agora: o que foi mexido nele pelo editor vem junto)
// Depois de mexer na Favela Grande pelo editor, NÃO rode de novo: ele sobrescreve.
// Plano (180 x 88 m jogáveis, uns 3 vezes a Favela):
//   - no meio, a Favela inteira (x -30 a 30), sem as paredes invisíveis dos lados e sem as casas de fora do limite lateral;
//   - uma rua de divisa de cada lado (x 30 a 36), que liga a Favela aos bairros novos em todo o comprimento;
//   - a oeste (x -36 a -90), o Campinho: campo de futebol de terra no meio, arquibancadas, uma rua e duas fileiras de casas de cada lado;
//   - a leste (x 36 a 90), o Comércio: fonte, quiosques e a quadra no meio, uma rua com carros, lojas e prédios, e casas atrás;
//   - casas fora do limite fechando a vista. Os bairros são feitos na metade sul (z > 0) e espelhados no norte, como a Favela.
const fs = require('fs');
const path = require('path');

const FAV = JSON.parse(fs.readFileSync(path.join(__dirname, 'editor', 'favela.json'), 'utf8'));
const C = { rua: [0.74, 0.7, 0.63], praca: [0.8, 0.78, 0.74], terra: [0.62, 0.5, 0.38], tijolo: [0.86, 0.5, 0.36] };
const sul = [], meio = [], fora = [];
const caixa = (L, x0, x1, y0, y1, z0, z1, m, cor, o = {}) => L.push(Object.assign({ t: 'caixa', p: [(x0 + x1) / 2, y0, (z0 + z1) / 2], s: [x1 - x0, y1 - y0, z1 - z0], r: 0, m, cor }, o));
const pf = (L, nome, x, z, r = 0, y = 0) => L.push({ t: 'prefab', nome, p: [x, y, z], r, e: 1 });
const prop = (L, nome, x, z, r = 0, y = 0) => L.push({ t: 'prop', nome, p: [x, y, z], r });
const parede = (L, x0, x1, z0, z1) => caixa(L, x0, x1, 0, 6, z0, z1, 'glass', [0.6, 0.8, 1], { inv: true });

// ---------- a Favela de agora, no meio ----------
const daFavela = FAV.pecas.filter((P) => {
  const [x] = P.p, s = P.s || [0, 0, 0];
  if (P.t === 'caixa' && s[0] >= 80 && s[2] >= 100) return false;                      // o chão dela: vem um maior
  if (P.t === 'caixa' && P.inv && Math.abs(Math.abs(x) - 30) < 0.5 && s[0] < 0.5) return false; // paredes invisíveis dos lados
  if (Math.abs(x) > 30.5) return false;                                                 // casas de fora do limite dos lados
  return true;
});

// ---------- chão, limite e ruas de divisa ----------
caixa(meio, -98, 98, -0.3, 0, -58, 58, 'cobble', C.rua);
for (const sd of [-1, 1]) {
  parede(meio, sd * 90 - 0.1, sd * 90 + 0.1, -44, 44);
  parede(sul, Math.min(sd * 30, sd * 90), Math.max(sd * 30, sd * 90), 43.9, 44.1);
  pf(sul, 'kcPosteGato', sd * 33, 10, sd > 0 ? 270 : 90); pf(sul, 'kcPoste', sd * 33, 36);
  prop(sul, 'barrel', sd * 34.5, 27); prop(sul, 'barrel', sd * 35, 27.7, 0.6);
}

// fileira de casas de frente para -z (para a rua), da esquerda para a direita, com vão de pelo menos 2 m entre elas
// tam: [largura (x), profundidade (z)] com r = 0 (a frente olha +z; com r = 180, -z)
const TAM = {
  kcCasaAmarela: [6.2, 5.7], kcCasaVerde: [6.2, 5.2], kcPredioFavela3: [6.8, 5.7], kcPredioFavela4: [4.7, 5.9], kcPredioFavelaEsquina: [6.2, 6.2],
  kcCasaTijolo: [5, 5], kcCasaTelhado: [5, 5], kcCasaConcreto: [5.5, 5], kcCasaConcreto2: [5.5, 5], kcSobrado: [6, 5], kcPredioVelho: [8, 7],
  kcFavelaComercio: [9.2, 5.2], kcFavelaTorre: [4.5, 4.7], kcFavelaEscadaLado: [8.6, 7.7], kcCasaAzul: [6.4, 7],
};
function fileira(L, x0, x1, zFrente, lista, olha = -1, vao = 2.2) {
  let x = x0, i = 0;
  while (true) {
    const nome = lista[i % lista.length], [w, d] = TAM[nome];
    if (x + w > x1) break;
    const cx = x + w / 2, cz = olha < 0 ? zFrente + d / 2 : zFrente - d / 2;
    pf(L, nome, cx, cz, olha < 0 ? 180 : 0);
    x += w + vao + (i % 3 === 1 ? 1 : 0); i++;
  }
}
const quintal = (L, x0, x1, z, k) => { // fundos: caixa d'água, varal, bananeira, tambores
  const coisas = ['kcCaixaDagua', 'kcVaral', 'kcBananeira', 'kcTambores', 'kcPneus', 'kcEngradados'];
  for (let x = x0, i = k; x < x1; x += 7.5, i++) pf(L, coisas[i % coisas.length], x, z + (i % 2 ? 0.8 : -0.8), (i * 70) % 360);
};

// ---------- oeste: o Campinho ----------
pf(meio, 'kcCampoFutebol', -63, 0);                      // x -83 a -43, z -11 a 11
pf(sul, 'kcArquibancadaConcreto', -72, 15); pf(sul, 'kcArquibancadaConcreto', -55, 15);
pf(sul, 'kcBancoPraca', -84.5, 14, 0); pf(sul, 'kcLixeiraRua', -46, 13.5);
pf(meio, 'kcPracaParquinho', -87, 0, 90);
fileira(sul, -89, -38, 21.5, ['kcCasaAmarela', 'kcCasaTijolo', 'kcPredioFavela3', 'kcCasaConcreto', 'kcCasaVerde', 'kcPredioFavela4', 'kcSobrado']);
fileira(sul, -88, -38, 31.5, ['kcCasaTelhado', 'kcPredioFavelaEsquina', 'kcCasaConcreto2', 'kcCasaVerde', 'kcCasaTijolo', 'kcPredioFavela4']);
quintal(sul, -86, -40, 40.5, 0);
pf(sul, 'kcCarroVelho', -50, 19.5, 90); pf(sul, 'kcMoto', -80, 19.2, 90); pf(sul, 'kcOrelhao', -40, 19);
pf(sul, 'kcPoste', -62, 19); pf(sul, 'kcPoste', -84, 29.5);

// ---------- leste: o Comércio ----------
pf(meio, 'kcPracaFonte', 42.5, 0);
pf(meio, 'kcQuadra', 64, 0);                             // x 49 a 79, z -9 a 9
pf(meio, 'kcFliperamaBar', 85.5, 3, 270); pf(meio, 'kcMototaxi', 85.5, -3, 270);
pf(sul, 'kcQuiosqueAcai', 45, 7.5); pf(sul, 'kcChurrasquinho', 39.5, 8); pf(sul, 'kcCarrinhoPipoca', 47.5, 4.5);
pf(sul, 'kcMesaDomino', 39, 4); pf(sul, 'kcBancoPraca', 60, 10.8); pf(sul, 'kcBancoPraca', 70, 10.8);
fileira(sul, 38, 89, 17, ['kcFavelaComercio', 'kcFavelaTorre', 'kcPredioVelho', 'kcPredioFavelaEsquina', 'kcFavelaComercio', 'kcPredioFavela3']);
fileira(sul, 39, 89, 29, ['kcCasaVerde', 'kcCasaTijolo', 'kcCasaAmarela', 'kcCasaConcreto', 'kcPredioFavela4', 'kcCasaTelhado', 'kcSobrado']);
quintal(sul, 41, 87, 39.5, 3);
pf(sul, 'kcVan', 55, 14, 90); pf(sul, 'kcCarroVelho', 76, 14, 270); pf(sul, 'kcMoto', 44, 14.2, 90);
pf(sul, 'kcPoste', 66, 15.5); pf(sul, 'kcLixeiraRua', 38.5, 15.5); pf(sul, 'kcPosteGato', 86, 26, 270);

// ---------- fora do limite: casas fechando a vista ----------
const CASAS = ['kcCasaTelhado', 'kcSobrado', 'kcCasaTijolo', 'kcPredioVelho', 'kcCasaConcreto2', 'kcCasaObra', 'kcPredioFavela4', 'kcCasaVerde'];
for (const sd of [-1, 1]) {
  let k = sd > 0 ? 2 : 0;
  for (let z = 4; z <= 49; z += 9, k++) pf(fora, CASAS[k % CASAS.length], sd * 95, z, sd > 0 ? 270 : 90);
  for (let x = 36, i = 0; x <= 88; x += 9, i++) pf(fora, CASAS[(i + k) % CASAS.length], sd * x, 49, 180);
}

// ---------- espelho: o norte é o sul com z trocado (o prefab gira 180 - r) ----------
const espelha = (P) => { const Q = JSON.parse(JSON.stringify(P)); Q.p[2] = -Q.p[2]; Q.r = (((180 - (Q.r || 0)) % 360) + 360) % 360; return Q; };
const pecas = [...daFavela, ...meio, ...sul, ...sul.map(espelha), ...fora, ...fora.map(espelha)];
for (const P of pecas) { P.p = P.p.map((v) => Math.round(v * 1000) / 1000); if (P.s) P.s = P.s.map((v) => Math.round(v * 1000) / 1000); }

// ---------- pontos de passagem dos robôs (e das armas e caixas do Battle royale) ----------
const poiSul = [];
for (const sd of [-1, 1]) {
  for (let z = 4; z <= 40; z += 9) poiSul.push([sd * 33, 0, z]);                       // rua de divisa
  for (let x = 40; x <= 86; x += 9) { poiSul.push([sd * x, 0, sd < 0 ? 18.5 : 14]); poiSul.push([sd * x, 0, sd < 0 ? 29.5 : 26.5]); poiSul.push([sd * x, 0, 41, 1]); } // rua, viela e fundos
}
for (let x = -80; x <= -46; x += 8.5) poiSul.push([x, 0, 6]);                            // campo
poiSul.push([-72, 0, 13, 1], [-55, 0, 13, 1], [-87, 0, 6, 1]);
for (let x = 52; x <= 76; x += 8) poiSul.push([x, 0, 5]);                                // quadra
poiSul.push([40, 0, 6], [46, 0, 2], [85.5, 0, 8, 1]);
const poiMeio = [[-33, 0, 0], [33, 0, 0], [-63, 0, 0], [-87, 0, 0], [42.5, 0, 4], [64, 0, 0], [85.5, 0, 0]];
const poi = [...(FAV.poi || []), ...poiMeio, ...poiSul, ...poiSul.map(([x, y, z, h]) => [x, y, -z, h || 0])];

const J = {
  id: 'favela-grande', nome: 'Favela Grande', tag: 'Morro inteiro (Battle royale)', tipo: 'open', ceu: FAV.ceu || 'meltem', mar: null,
  desc: 'A Favela com os dois bairros do lado: o Campinho, com o campo de terra, a oeste, e o Comércio, com a quadra e as lojas, a leste. Feito para o Battle royale.',
  pecas, nascer: FAV.nascer, dom: FAV.dom, mecha: FAV.mecha, poi,
  sniper: FAV.sniper, som: FAV.som || 'concrete', ambiente: FAV.ambiente,
  zonas: [...(FAV.zonas || []), ['Divisa oeste', -36, -30, -44, 44], ['Divisa leste', 30, 36, -44, 44], ['Campinho', -90, -36, -44, 44], ['Comércio', 36, 90, -44, 44]],
};
const out = path.join(__dirname, 'editor', 'favela-grande.json');
fs.writeFileSync(out, JSON.stringify(J, null, 1) + '\n');
console.log('gravado', out, pecas.length, 'peças,', poi.length, 'pontos');
