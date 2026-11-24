// Corrida da Galera — os robôs: as constantes de base (nomes, a régua de nível de 0 a 150 e as margens do carro físico).
// Parte de corrida-robos.js, que junta tudo; quem usa os robôs continua pedindo só ele.
const T = require("../../public/corrida/pistas.js");
const NOMES = ["Faísca", "Pistão", "Graxa", "Biela", "Vácuo", "Turbo", "Chicane"];
const DIFICIL_ANTIGO = !!process.env.ROBO_DIFICIL_ANTIGO; // (só para medir o de antes)
const NIVEIS = { facil: 0.80, medio: 0.87, dificil: 0.93, lendario: 0.96 }; // modo clássico: fração da velocidade do traçado
// (2026-11-21, o Thiago: "queria que o nível fosse uma barra que vai de 0-100") o nível da sala é um número de 0 a 100; as tabelas por nível continuam
// com as três marcas de antes, e o número mistura as duas vizinhas: Fácil = 60, Médio = 92 (o de sempre: o padrão da sala) e Difícil = 100. Abaixo
// de 60 a reta continua, mais fácil ainda. Os nomes antigos ("facil", "medio", "dificil": a carreira usa) valem o número da marca deles.
// (2026-11-21, o Thiago vencendo tudo de Racing Bulls no Difícil: "o nível é uma escala... coloca a escala de 0-150, até na carreira") a régua vai de 0
// a 150. Até 100, o de antes. De 100 a 150 (o "lendario" é o 150) a folga do ritmo vai de +0,5% a −1% da volta ideal do traçado (FOLGA_F1), o acerto
// vai para o ideal, os erros caem e o carro do robô ganha aderência e potência (reforcoDoNivel): só pedir ritmo não bastava, porque no Difícil o
// robô já anda no limite do carro (medido: sozinho em Bahrein, 45,45 s no 100 e 45,15 s com a folga de −1% e o carro de sempre).
const MARCA_NIVEL = { facil: 60, medio: 92, dificil: 100, lendario: 150 };
function forcaDoNivel(nivel) {
  const n = typeof nivel === "number" ? nivel : MARCA_NIVEL[nivel];
  return Number.isFinite(n) ? Math.max(0, Math.min(MARCA_NIVEL.lendario, n)) : MARCA_NIVEL.medio;
}
function porNivel(T, nivel) { // o valor da tabela { facil, medio, dificil } para o nível
  const n = forcaDoNivel(nivel), M = MARCA_NIVEL;
  if (n > M.dificil) return T.dificil + ((T.lendario ?? T.dificil) - T.dificil) * (n - M.dificil) / (M.lendario - M.dificil); // (o Lendário: a coluna dele, ou a do Difícil)
  return n >= M.medio ? T.medio + (T.dificil - T.medio) * (n - M.medio) / (M.dificil - M.medio) : T.medio + (T.facil - T.medio) * (M.medio - n) / (M.medio - M.facil);
}
const nomeDoNivel = (nivel) => { const n = forcaDoNivel(nivel); return n >= 96 ? "dificil" : n >= 76 ? "medio" : "facil"; }; // (o que só tem as três: o plano de box)
// Com voltas guardadas: o tempo de volta que o robô mira, em relação ao ritmo de quem joga (a média das cinco
// melhores voltas de cada um). No médio, um pouco mais lento que essa média; no difícil, um pouco mais rápido.
const RITMO = { facil: 1.12, medio: 1.03, dificil: 0.98 };
const STEP = 6;
const FOLGA_LINHA = 4; // (pouca folga: no ápice e na saída o robô põe meio carro em cima da zebra, como quem joga)
const _FOLGA_LINHA_ANTIGA = 18; // a linha de F1 fica a esta distância (u) da beira da pista, de centro a centro: sobra meia largura do carro e um respiro
// O robô de F1 segue a linha de corrida (o elástico de `tracado`) por inteiro, menos uma folga: o suficiente para abrir as curvas e
// encostar nos ápices sem raspar no zebra. A velocidade que ele mira sai da curvatura DESSE caminho (`curvaturaDoCaminho`), não da do
// elástico cru, que tinha quinas de raio quase zero.
const FATOR_LINHA = 0.8; // (só nas pistas de fantasia e no jogo clássico: a linha de F1 de `tracado(pista, true)` já é a de menor curvatura e vale inteira)
// o menor raio (u) que o robô considera numa curva: o carro não fecha mais que isso, e uma quina de raio quase zero no traçado (um
// ponto fora do lugar) fazia o perfil de velocidade despencar para 1 u/s no meio de uma reta
const RAIO_MIN = 22;
// Limite de curva calibrado com o carro físico: 1,085 nas pistas largas e 1,08 entre muretas, com frenagem no limite.
// Valores maiores fazem o robô sair da pista em Mônaco. As pistas fantasia conservam a margem antiga por causa das lombadas.
const LARGURA_ESTREITA = 110, MARGEM_F1 = 1.085, MARGEM_FREIO = 1.0;
const MARGEM_ANTIGA = { margem: 0.95, freio: 0.8 }, PISTAS_FANTASIA = new Set(["serra", "deserto", "nurburgring", "arcoiris"]);
const margemDaPista = (pista) => (PISTAS_FANTASIA.has(pista) ? MARGEM_ANTIGA : { margem: T.PISTAS[pista].width <= LARGURA_ESTREITA ? 1.08 : MARGEM_F1, freio: MARGEM_FREIO });
const TRAVA_ABS = 0.25; // quanto a roda pode travar na frenagem antes do robô soltar o freio
const ALFA_FRENTE = 0.10, K_FRENTE = 8; // o pico do pneu é 0,11 rad
const V_ARRASTO = 16; // u/s: velocidade mínima para sair de trás do carro parado e contorná-lo
const V_PRESO = 8, T_PRESO = 2.5, T_SEM_ANDAR = 10; // u/s, s e pontos de pista (6 u cada): quando o robô se considera preso
const ALFA_TRACAO = 0.11, PAT = 0.3; // o ângulo de deriva da traseira (rad; o pico do pneu é 0,11) a partir do qual o robô tira o pé do acelerador
const GRID_F1 = 22; // as regras de F1: o grid tem 22 carros (humanos e robôs)
const ENCOLHIDO = 0.72, BALA = 1.45; // o raio deixa o carro com 72% da velocidade final; a bala anda a 145% (iguais em fisica.js)
const rnd = (a, b) => a + Math.random() * (b - a);

module.exports = { NOMES, DIFICIL_ANTIGO, NIVEIS, MARCA_NIVEL, forcaDoNivel, porNivel, nomeDoNivel, RITMO, STEP, FOLGA_LINHA, FATOR_LINHA, RAIO_MIN, LARGURA_ESTREITA, PISTAS_FANTASIA, margemDaPista, TRAVA_ABS, ALFA_FRENTE, K_FRENTE, V_ARRASTO, V_PRESO, T_PRESO, T_SEM_ANDAR, ALFA_TRACAO, PAT, GRID_F1, ENCOLHIDO, BALA, rnd };
