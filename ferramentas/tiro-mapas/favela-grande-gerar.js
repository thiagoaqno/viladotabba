// Gera ferramentas/tiro-mapas/editor/favela-grande.json (mapa "Favela Grande" do Tiro da Galera, para o Battle royale).
// Rode: node ferramentas/tiro-mapas/favela-grande-gerar.js  (lê o favela.json de agora: o que foi mexido nele pelo editor vem junto)
// Depois de mexer na Favela Grande pelo editor, NÃO rode de novo: ele sobrescreve.
//
// Versão 2 (2026-11-27, o Thiago: "cresce mais ainda o favela... usa assets de outros mapas"): 272 x 212 m de chão, tudo jogável.
//   Faixa do meio (z de -44 a 44), de oeste para leste:
//     Ferro-velho (x -136 a -96): vagões, ônibus queimado, contêineres, manilhas, carcaças, guarita;
//     Campinho (x -90 a -36): campo de terra, arquibancadas, duas fileiras de casas de cada lado;
//     a Favela de hoje inteira (x -30 a 30);
//     Comércio (x 36 a 90): fonte, quiosques, quadra, lojas e prédios;
//     Rodoviária (x 96 a 136): galpão coberto com bancos, guichê e painel de horários (dá para subir no teto pela escada),
//       pontos de ônibus e ônibus parados.
//   Ruas de divisa (N-S) entre as faixas; uma avenida (z 44 a 56) de ponta a ponta.
//   Morro (z de 56 a 106, e o espelho no norte): três fileiras de prédios e casas de favela com vielas entre elas, prédios com
//     escada até a laje, e no alto uma feira, uma praça e um parquinho.
//   Paredes: as invisíveis de dentro da Favela (dos lados e do fundo) saem; a única parede invisível é a da beira do chão,
//     com 600 m de altura (ninguém cai do mapa, nem planando de paraquedas), bem na beira do abismo.
//   O sul (z > 0) é feito aqui e espelhado no norte, como na Favela.
const fs = require('fs');
const path = require('path');

const FAV = JSON.parse(fs.readFileSync(path.join(__dirname, 'editor', 'favela.json'), 'utf8'));
const C = { rua: [0.74, 0.7, 0.63], praca: [0.8, 0.78, 0.74], terra: [0.62, 0.5, 0.38], tijolo: [0.86, 0.5, 0.36], laje: [0.66, 0.65, 0.62], telha: [0.55, 0.57, 0.6] };
const BX = 136, BZ = 106; // beira do chão (o abismo começa aqui)
const sul = [], meio = [];
const caixa = (L, x0, x1, y0, y1, z0, z1, m, cor, o = {}) => L.push(Object.assign({ t: 'caixa', p: [(x0 + x1) / 2, y0, (z0 + z1) / 2], s: [x1 - x0, y1 - y0, z1 - z0], r: 0, m, cor }, o));
const pf = (L, nome, x, z, r = 0, y = 0) => L.push({ t: 'prefab', nome, p: [x, y, z], r, e: 1 });
const prop = (L, nome, x, z, r = 0, y = 0) => L.push({ t: 'prop', nome, p: [x, y, z], r });
const escada = (L, x0, x1, z0, z1, h, r) => L.push({ t: 'escada', p: [(x0 + x1) / 2, 0, (z0 + z1) / 2], s: r % 180 ? [z1 - z0, h, x1 - x0] : [x1 - x0, h, z1 - z0], r, m: 'concrete', cor: C.laje });

// ---------- a Favela de agora, no meio, sem as paredes invisíveis e sem o cenário de fora ----------
const daFavela = FAV.pecas.filter((P) => {
  const [x, , z] = P.p, s = P.s || [0, 0, 0];
  if (P.t === 'caixa' && s[0] >= 80 && s[2] >= 100) return false; // o chão dela: vem um maior
  if (P.t === 'caixa' && P.inv) return false;                    // todas as paredes invisíveis dela
  if (Math.abs(x) > 30.5 || Math.abs(z) > 44.5) return false;     // casas e postes de fora do limite
  return true;
});

// ---------- chão e a parede da beira ----------
caixa(meio, -BX, BX, -0.3, 0, -BZ, BZ, 'cobble', C.rua);
const beira = (x0, x1, z0, z1) => caixa(meio, x0, x1, -0.3, 600, z0, z1, 'glass', [0.6, 0.8, 1], { inv: true });
beira(-BX, -BX + 0.2, -BZ, BZ); beira(BX - 0.2, BX, -BZ, BZ); beira(-BX, BX, -BZ, -BZ + 0.2); beira(-BX, BX, BZ - 0.2, BZ);

// ---------- tamanhos [largura x, profundidade z] com r = 0 (a frente olha +z), escritos no kit ----------
const TAM = {
  kcCasaAmarela: [6.2, 5.7], kcCasaVerde: [6.2, 5.2], kcPredioFavela3: [6.8, 5.7], kcPredioFavela4: [4.7, 5.9], kcPredioFavelaEsquina: [6.2, 6.2],
  kcCasaTijolo: [5, 5], kcCasaTelhado: [5, 5], kcCasaConcreto: [5.5, 5], kcCasaConcreto2: [5.5, 5], kcSobrado: [6, 5], kcPredioVelho: [8, 7],
  kcFavelaComercio: [9.2, 5.2], kcFavelaTorre: [4.5, 4.7], kcFavelaEscadaLado: [8.6, 7.7], kcFavelaEscadaTelhado: [9.5, 10], kcFavelaEscadaFundos: [7.5, 7.6], kcCasaAzul: [6.4, 7],
};
// fileira de prédios entre x0 e x1, com a frente em zFrente olhando -z (para a rua), vão de pelo menos 2,2 m entre eles
function fileira(L, x0, x1, zFrente, lista, olha = -1, vao = 2.2) {
  let x = x0, i = 0;
  while (true) {
    const nome = lista[i % lista.length], [w, d] = TAM[nome];
    if (x + w > x1) break;
    pf(L, nome, x + w / 2, olha < 0 ? zFrente + d / 2 : zFrente - d / 2, olha < 0 ? 180 : 0);
    x += w + vao + (i % 3 === 1 ? 1 : 0); i++;
  }
}
const quintal = (L, x0, x1, z, k) => {
  const coisas = ['kcCaixaDagua', 'kcVaral', 'kcBananeira', 'kcTambores', 'kcPneus', 'kcEngradados'];
  for (let x = x0, i = k; x < x1; x += 7.5, i++) pf(L, coisas[i % coisas.length], x, z + (i % 2 ? 0.8 : -0.8), (i * 70) % 360);
};

// ---------- ruas de divisa (N-S) ----------
for (const sd of [-1, 1]) for (const xs of [33, 93]) {
  pf(sul, 'kcPosteGato', sd * xs, 10, sd > 0 ? 270 : 90); pf(sul, 'kcPoste', sd * xs, 36);
  prop(sul, 'barrel', sd * (xs + 1.5), 27); prop(sul, 'barrel', sd * (xs + 2), 27.7, 0.6);
}

// ---------- Campinho (x -90 a -36) ----------
pf(meio, 'kcCampoFutebol', -63, 0);
pf(sul, 'kcArquibancadaConcreto', -72, 15); pf(sul, 'kcArquibancadaConcreto', -55, 15);
pf(sul, 'kcBancoPraca', -84.5, 14, 0); pf(sul, 'kcLixeiraRua', -46, 13.5);
pf(meio, 'kcPracaParquinho', -87, 0, 90);
fileira(sul, -89, -38, 21.5, ['kcCasaAmarela', 'kcCasaTijolo', 'kcPredioFavela3', 'kcCasaConcreto', 'kcCasaVerde', 'kcPredioFavela4', 'kcSobrado']);
fileira(sul, -88, -38, 31.5, ['kcCasaTelhado', 'kcPredioFavelaEsquina', 'kcCasaConcreto2', 'kcCasaVerde', 'kcCasaTijolo', 'kcPredioFavela4']);
quintal(sul, -86, -40, 40.5, 0);
pf(sul, 'kcCarroVelho', -50, 19.5, 90); pf(sul, 'kcMoto', -80, 19.2, 90); pf(sul, 'kcOrelhao', -40, 19);
pf(sul, 'kcPoste', -62, 19); pf(sul, 'kcPoste', -84, 29.5);

// ---------- Comércio (x 36 a 90) ----------
pf(meio, 'kcPracaFonte', 42.5, 0);
pf(meio, 'kcQuadra', 64, 0);
pf(meio, 'kcFliperamaBar', 85.5, 3, 270); pf(meio, 'kcMototaxi', 85.5, -3, 270);
pf(sul, 'kcQuiosqueAcai', 45, 7.5); pf(sul, 'kcChurrasquinho', 39.5, 8); pf(sul, 'kcCarrinhoPipoca', 47.5, 4.5);
pf(sul, 'kcMesaDomino', 39, 4); pf(sul, 'kcBancoPraca', 60, 10.8); pf(sul, 'kcBancoPraca', 70, 10.8);
fileira(sul, 38, 89, 17, ['kcFavelaComercio', 'kcFavelaTorre', 'kcPredioVelho', 'kcPredioFavelaEsquina', 'kcFavelaComercio', 'kcPredioFavela3']);
fileira(sul, 39, 89, 29, ['kcCasaVerde', 'kcCasaTijolo', 'kcCasaAmarela', 'kcCasaConcreto', 'kcPredioFavela4', 'kcCasaTelhado', 'kcSobrado']);
quintal(sul, 41, 87, 39.5, 3);
pf(sul, 'kcVan', 55, 14, 90); pf(sul, 'kcCarroVelho', 76, 14, 270); pf(sul, 'kcMoto', 44, 14.2, 90);
pf(sul, 'kcPoste', 66, 15.5); pf(sul, 'kcLixeiraRua', 38.5, 15.5); pf(sul, 'kcPosteGato', 86, 26, 270);

// ---------- Ferro-velho (x -136 a -96): peças dos mapas de neve e de deserto do jogo (vagão, ônibus) e do kit ----------
pf(sul, 'boxcar', -104, 7.5, 0); pf(sul, 'boxcar', -104, 24, 0);            // vagões, compridos em z (12,2 m)
pf(sul, 'busWreck', -118, 11, 0);                                            // ônibus queimado, comprido em z (11 m)
pf(sul, 'kcConteinerAberto', -124, 30, 0); pf(sul, 'kcConteinerAberto', -112, 37, 0);
pf(sul, 'kcCarroQueimado', -128, 5, 0); pf(sul, 'kcCarroQueimado', -111, 30, 90);
pf(sul, 'kcManilhas', -126, 19); pf(sul, 'kcPneus', -112, 19.5); pf(sul, 'kcPaletes', -129, 39); pf(sul, 'kcVigas', -120, 42, 90);
pf(sul, 'kcTambores', -98.5, 15); pf(sul, 'kcEntulho', -130, 13); pf(sul, 'kcCacamba', -100, 40);
pf(sul, 'kcGuarita', -99, 3, 90); pf(meio, 'stCrateStack', -126, 0, 0.4); pf(meio, 'kcGabiao', -112, 0, 90);

// ---------- Rodoviária (x 96 a 136): galpão coberto (x 100 a 128, z 14 a 36), teto a 5 m com escada ----------
caixa(sul, 100, 128, 5, 5.3, 14, 36, 'corrugated', C.telha);                // o teto (uma laje: dá para andar)
for (const x of [100.25, 107.25, 114.25, 121.25, 127.75]) for (const z of [14.25, 35.75]) caixa(sul, x - 0.25, x + 0.25, 0, 5, z - 0.25, z + 0.25, 'steel', [0.4, 0.42, 0.45]);
caixa(sul, 100, 128, 0, 5, 35.8, 36.2, 'brick', C.tijolo);                  // parede do fundo
caixa(sul, 100, 128, 5.3, 6.2, 35.8, 36, 'brick', C.tijolo);                // mureta do teto, no fundo
escada(sul, 128.4, 130.4, 18, 27.5, 5.3, 0);                                // sobe para +z, pelo lado leste, até o teto
caixa(sul, 128, 130.4, 5, 5.3, 27.5, 30, 'concrete', C.laje);               // patamar no topo da escada, encostado no teto
for (const [x, z] of [[104, 22], [104, 27], [110, 22], [110, 27], [116, 22], [116, 27]]) pf(sul, 'kcACadeiras', x, z, 0);
pf(sul, 'kcABalcao', 122, 32, 180); pf(sul, 'kcAPainelVoos', 114, 35.2, 180); pf(sul, 'kcCarrinhoPipoca', 124, 18);
pf(sul, 'kcLixeiraRua', 101.5, 31); pf(sul, 'kcBanca', 132, 40, 270);
pf(sul, 'busWreck', 112, 6, 90); pf(sul, 'kcVan', 126, 9, 90);              // ônibus e van parados na frente
pf(sul, 'kcPontoOnibus', 101, 10, 0); pf(sul, 'kcPontoOnibus', 133.2, 22, 270); pf(sul, 'kcOrelhao', 99, 40);
pf(meio, 'kcJersey', 104, 0, 90); pf(meio, 'kcJersey', 120, 0, 90);

// ---------- Morro (z 56 a 106): três fileiras com vielas, prédios com escada até a laje; feira, praça e parquinho no alto ----------
const VIELAS = [-102, -62, -22, 22, 62, 102]; // vielas N-S de 5 m
const trechos = []; let xa = -134;
for (const v of VIELAS) { trechos.push([xa, v - 2.5]); xa = v + 2.5; }
trechos.push([xa, 134]);
const R1 = ['kcPredioFavela3', 'kcCasaAmarela', 'kcFavelaEscadaLado', 'kcPredioFavela4', 'kcCasaVerde', 'kcFavelaComercio', 'kcPredioFavelaEsquina', 'kcSobrado'];
const R2 = ['kcCasaTijolo', 'kcFavelaEscadaFundos', 'kcCasaConcreto', 'kcPredioFavela4', 'kcCasaTelhado', 'kcFavelaTorre', 'kcCasaConcreto2', 'kcPredioFavela3'];
const R3 = ['kcFavelaEscadaTelhado', 'kcCasaVerde', 'kcPredioFavelaEsquina', 'kcCasaAmarela', 'kcFavelaTorre', 'kcPredioVelho'];
trechos.forEach(([a, b], k) => {
  const gira = (L) => L.slice(k % L.length).concat(L.slice(0, k % L.length)); // cada trecho começa num prédio diferente
  fileira(sul, a + 1, b - 1, 57, gira(R1));
  fileira(sul, a + 1, b - 1, 71, gira(R2));
  fileira(sul, a + 1, b - 1, 85.5, gira(R3));
});
// avenida (z 44 a 56): postes, carros, ponto de ônibus
for (let x = -126; x <= 126; x += 21) pf(sul, 'kcPoste', x, 55.2);
pf(sul, 'kcCarroVelho', -84, 50, 90); pf(sul, 'kcVan', -14, 47.5, 270); pf(sul, 'kcCarroQueimado', 40, 49, 90); pf(sul, 'kcMoto', 78, 47.2, 90); pf(sul, 'kcCarroVelho', 118, 50, 270);
pf(sul, 'kcPontoOnibus', -40, 54.4, 180); pf(sul, 'kcPontoOnibus', 10, 54.4, 180);
// no alto do morro (z 97 a 105): feira, praça e parquinho
for (let x = -58; x <= -26; x += 6.5) pf(sul, x % 13 ? 'kcBarraca' : 'kcBarracaAzul', x, 100, 180);
pf(sul, 'kcPracaFonte', 40, 101); pf(sul, 'kcPracaConvivio', 30, 99); pf(sul, 'kcPracaConvivio', 50, 99); pf(sul, 'kcArvoreCanteiro', 56, 102);
pf(sul, 'kcQuiosqueAcai', -12, 100); pf(sul, 'kcChurrasquinho', -4, 100); pf(sul, 'kcMesaDomino', 6, 99.5);
pf(sul, 'kcBancoPraca', 70, 99); pf(sul, 'kcBancoPraca', 78, 99); pf(sul, 'kcPracaParquinho', 90, 100);
pf(sul, 'kcTambores', -120, 100); pf(sul, 'kcManilhas', -108, 100); pf(sul, 'kcCaixaDagua', -92, 100); pf(sul, 'kcEntulho', -80, 100);
pf(sul, 'kcBananeira', 114, 100); pf(sul, 'kcBananeira', 124, 101); pf(sul, 'kcVaral', 104, 100);

// ---------- espelho: o norte é o sul com z trocado (o prefab gira 180 - r) ----------
const espelha = (P) => { const Q = JSON.parse(JSON.stringify(P)); Q.p[2] = -Q.p[2]; Q.r = (((180 - (Q.r || 0)) % 360) + 360) % 360; return Q; };
const pecas = [...daFavela, ...meio, ...sul, ...sul.map(espelha)];
for (const P of pecas) { P.p = P.p.map((v) => Math.round(v * 1000) / 1000); if (P.s) P.s = P.s.map((v) => Math.round(v * 1000) / 1000); }

// ---------- pontos de passagem: uma grade de 8 m fora da Favela, sem os que caem dentro de um prédio ----------
const ocupa = []; // [x0, x1, z0, z1] dos prédios e veículos novos (com folga de 0,8 m)
const DIM = Object.assign({}, TAM, { boxcar: [2.85, 12.2], busWreck: [2.5, 11], kcConteinerAberto: [6.1, 2.5], kcCarroQueimado: [1.9, 4.4], kcCarroVelho: [1.7, 3.9], kcVan: [1.9, 4.5],
  kcCampoFutebol: [0, 0], kcQuadra: [0, 0], kcArquibancadaConcreto: [10, 6], kcGuarita: [2.4, 2.4], kcManilhas: [2.4, 2.2], kcBanca: [2.9, 2.1], kcABalcao: [2.6, 1.5], kcAPainelVoos: [3, 0.5] });
for (const P of pecas) {
  if (Math.abs(P.p[0]) < 30.5 && Math.abs(P.p[2]) < 44.5) continue;
  let wd = P.t === 'prefab' ? DIM[P.nome] : P.t === 'caixa' && !P.inv && P.p[1] < 1 && P.s[1] > 1 ? [P.s[0], P.s[2]] : null;
  if (!wd || !wd[0]) continue;
  if (Math.round((P.r || 0) / 90) % 2) wd = [wd[1], wd[0]];
  ocupa.push([P.p[0] - wd[0] / 2 - 0.8, P.p[0] + wd[0] / 2 + 0.8, P.p[2] - wd[1] / 2 - 0.8, P.p[2] + wd[1] / 2 + 0.8]);
}
const livre = (x, z) => !ocupa.some(([a, b, c, d]) => x > a && x < b && z > c && z < d);
const poiNovos = [];
for (let x = -132; x <= 132; x += 8) for (let z = -102; z <= 102; z += 8) {
  if (Math.abs(x) < 30.5 && Math.abs(z) < 44.5) continue; // a Favela tem os dela
  if (livre(x, z)) poiNovos.push([x, 0, z, (x * 7 + z * 3) % 5 === 0 ? 1 : 0]);
}
const poi = [...(FAV.poi || []), ...poiNovos];

// ---------- sobreposições (para conferir ao gerar) ----------
const caixas = [];
for (const P of pecas) {
  if (P.t !== 'prefab' || !DIM[P.nome] || !DIM[P.nome][0] || (Math.abs(P.p[0]) < 30.5 && Math.abs(P.p[2]) < 44.5)) continue;
  let [w, d] = DIM[P.nome]; if (Math.round((P.r || 0) / 90) % 2) [w, d] = [d, w];
  caixas.push({ n: P.nome, x0: P.p[0] - w / 2, x1: P.p[0] + w / 2, z0: P.p[2] - d / 2, z1: P.p[2] + d / 2 });
}
let sobre = 0;
for (let i = 0; i < caixas.length; i++) for (let j = i + 1; j < caixas.length; j++) {
  const a = caixas[i], b = caixas[j];
  if (a.x0 < b.x1 - 0.05 && b.x0 < a.x1 - 0.05 && a.z0 < b.z1 - 0.05 && b.z0 < a.z1 - 0.05) { sobre++; console.log('encosta:', a.n, a.x0.toFixed(1), a.z0.toFixed(1), '|', b.n, b.x0.toFixed(1), b.z0.toFixed(1)); }
}
const fora = caixas.filter((c) => c.x0 < -BX + 0.3 || c.x1 > BX - 0.3 || c.z0 < -BZ + 0.3 || c.z1 > BZ - 0.3);
for (const c of fora) console.log('passa da beira:', c.n, c.x0.toFixed(1), c.x1.toFixed(1), c.z0.toFixed(1), c.z1.toFixed(1));

// ---------- marcadores do Battle royale (2026-11-27, o Thiago: "bota marcadores do BR na favela grande") ----------
// Onde dá para entrar e ficar coberto, ou subir: dentro das casas com porta, no canto coberto do prédio de esquina, no alpendre,
// na casa em obra, dentro dos contêineres abertos; nos terraços dos prédios com escada; nas lajes da Favela (Telhados e bloco
// leste); dentro do galpão da Rodoviária e no teto dele. Posições na peça (com r = 0: frente em +z), lidas dos blocos do kit.
const DENTRO = {
  kcCasaTijolo: [[0, 0.1, -0.4]], kcCasaTelhado: [[0, 0.1, -0.4]], kcCasaConcreto: [[0, 0.1, -0.3]], kcCasaConcreto2: [[0, 0.1, -0.3]],
  kcCasaObra: [[0, 0.1, 0]], kcCasaAzul: [[0, 0.1, 2.4]], kcPredioFavelaEsquina: [[1.7, 0.1, 1.5]], kcConteinerAberto: [[0, 0.3, 0]],
};
const LAJE = { kcFavelaEscadaLado: [[1, 3.3, 0.5]], kcFavelaEscadaFundos: [[0, 3.3, -1.2]], kcFavelaEscadaTelhado: [[-1, 6.2, -1.5]] };
const naPeca = (P, [lx, ly, lz]) => { const a = ((P.r || 0) * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a); return [+(P.p[0] + lx * c + lz * s).toFixed(2), +(P.p[1] + ly).toFixed(2), +(P.p[2] - lx * s + lz * c).toFixed(2)]; };
const lugarDentro = [], lugarLaje = [];
for (const P of pecas) {
  if (P.t !== 'prefab') continue;
  for (const l of DENTRO[P.nome] || []) lugarDentro.push(naPeca(P, l));
  for (const l of LAJE[P.nome] || []) lugarLaje.push(naPeca(P, l));
}
for (const sz of [1, -1]) {
  lugarLaje.push([-6, 3.4, 24 * sz], [6, 3.4, 24 * sz], [16, 3.4, 22 * sz], [16, 3.4, 27 * sz]); // lajes da Favela (Telhados e bloco leste)
  lugarDentro.push([106, 0.1, 30 * sz], [120, 0.1, 20 * sz], [112, 0.1, 25 * sz]);                // dentro do galpão
  lugarLaje.push([108, 5.6, 22 * sz], [120, 5.6, 30 * sz]);                                      // teto do galpão
}
// espalha: cada um a pelo menos "longe" m dos já escolhidos (ou em outra altura), na ordem dada
const espalha = (L, longe, usados = []) => { const out = []; for (const p of L) if (![...usados, ...out].some((o) => Math.hypot(o[0] - p[0], o[2] - p[2]) < longe && Math.abs(o[1] - p[1]) < 2)) out.push(p); return out; };
const ordena = (L) => L.slice().sort((a, b) => a[0] - b[0] || a[2] - b[2]);
// armas a 20 m umas das outras (as lajes primeiro); caixas a 16 m umas das outras, nas casas, meio metro ao lado de onde uma arma
// pode estar (alternando: uma de colete para duas de cura)
const armas = espalha([...ordena(lugarLaje), ...ordena(lugarDentro)], 20);
const caixasBr = espalha(ordena(lugarDentro).reverse(), 16).map(([x, y, z]) => [+(x + 0.6).toFixed(2), y, +(z + 0.6).toFixed(2)]);
const coletes = caixasBr.filter((p, i) => i % 3 === 0), curas = caixasBr.filter((p, i) => i % 3 !== 0);
console.log('marcadores BR:', armas.length, 'armas (' + armas.filter((p) => p[1] > 2).length + ' em lajes),', coletes.length, 'coletes,', curas.length, 'curas');

const J = {
  id: 'favela-grande', nome: 'Favela Grande', tag: 'Morro inteiro (Battle royale)', tipo: 'open', ceu: FAV.ceu || 'meltem', mar: null,
  desc: 'A Favela no meio do morro inteiro: o Campinho e o Ferro-velho a oeste, o Comércio e a Rodoviária a leste, e o morro com vielas, lajes, feira e praça ao norte e ao sul. Feito para o Battle royale.',
  pecas, nascer: FAV.nascer, dom: FAV.dom, mecha: FAV.mecha, poi,
  br: { armas, coletes, curas }, // o centro da zona e as largadas continuam automáticos (tiro-br.js)
  sniper: FAV.sniper, som: FAV.som || 'concrete', ambiente: FAV.ambiente,
  zonas: [...(FAV.zonas || []), ['Morro sul', -BX, BX, 44, BZ], ['Morro norte', -BX, BX, -BZ, -44], ['Ferro-velho', -BX, -90, -44, 44], ['Campinho', -90, -30, -44, 44],
    ['Comércio', 30, 90, -44, 44], ['Rodoviária', 90, BX, -44, 44]],
};
const out = path.join(__dirname, 'editor', 'favela-grande.json');
fs.writeFileSync(out, JSON.stringify(J, null, 1) + '\n');
console.log('gravado', out, pecas.length, 'peças,', poi.length, 'pontos (' + poiNovos.length + ' novos),', sobre, 'sobreposições,', fora.length, 'passando da beira');
