// Corrida da Galera — a sensibilidade do volante (só a ENTRADA do navegador: o servidor e a física recebem o mesmo `steer` de -1 a 1, só que já
// medido por esta curva). Puro e testável; controles.js aplica, teclas.js guarda e a tela Controles ajusta.
(function (root) {
const limite = (v, a, b) => Math.max(a, Math.min(b, v));

// Os limites de cada ajuste (a tela usa os mesmos): k = teclado e toque (o quanto o volante vira com a tecla apertada, 1 = tudo),
// p = controle (o ganho do analógico), zona = a zona morta do analógico.
const LIMITES = { k: [0.3, 1.5], p: [0.5, 1.5], zona: [0, 0.4] };
const PADRAO = { k: 1, p: 1, zona: 0.15 };
const ajustar = (campo, v) => (Number.isFinite(+v) ? limite(+v, LIMITES[campo][0], LIMITES[campo][1]) : PADRAO[campo]);

// O analógico: tira a zona morta, aplica a curva (CURVA: macio no centro, firme no fim) e o ganho `sens`; o resultado nunca passa de -1 a 1.
function analogico(x, zona = PADRAO.zona, sens = PADRAO.p) {
  const z = limite(zona, 0, 0.9), a = Math.abs(x || 0);
  if (a < z) return 0;
  return Math.sign(x) * limite(((a - z) / (1 - z)) ** ACERTO.curva * sens, 0, 1) * ACERTO.virada; // (o teto é a virada do acerto)
}
// O ACERTO DA DIREÇÃO (só a ENTRADA do jogador; a física e os robôs não mudam, e o servidor recebe o mesmo `steer`, então nada sai de sincronia).
// Na escala real as curvas ficaram ~1,8 vez mais abertas (o raio cresceu com o `scale`) e a pista tem metade da largura: a mesma curva pede
// ~55% do volante. O PADRÃO é a direção antiga encolhida para a escala nova: a mesma resposta no tempo (o batente em 0,2 s, a volta ao centro em
// 0,125 s, como a rampa da física fazia) só que até `virada` em vez de até 1, e o analógico com a curva antiga (1,4) e o mesmo teto.
// O painel de acerto (tecla P, acerto.js) muda estes valores ao vivo e guarda em "corrida:acerto-direcao".
const ACERTO_PADRAO = { virada: 0.6, sobe: 0.15, volta: 0.125, curva: 1.4 }; // (os valores que o Thiago acertou no painel jogando, 2026-11-10: a virada era 0,75 e baixou para 0,6, "MUITO melhor de guiar"; partiram da antiga encolhida: 0,55 / 0,2 / 0,125 / 1,4)
const ACERTO_LIMITES = { virada: [0.25, 1.2], sobe: [0.05, 0.8], volta: [0.05, 0.5], curva: [1, 2.5] };
const ACERTO = { ...ACERTO_PADRAO };
try { const v = JSON.parse(localStorage.getItem("corrida:acerto-direcao") || "null"); if (v) for (const k of Object.keys(ACERTO_PADRAO)) if (Number.isFinite(+v[k])) ACERTO[k] = limite(+v[k], ...ACERTO_LIMITES[k]); } catch (e) {}
function acertar(campo, valor) { if (!(campo in ACERTO_PADRAO)) return; ACERTO[campo] = Number.isFinite(+valor) ? limite(+valor, ...ACERTO_LIMITES[campo]) : ACERTO_PADRAO[campo]; try { localStorage.setItem("corrida:acerto-direcao", JSON.stringify(ACERTO)); } catch (e) {} }
function acertoPadrao() { Object.assign(ACERTO, ACERTO_PADRAO); try { localStorage.removeItem("corrida:acerto-direcao"); } catch (e) {} }
const CURVA = ACERTO_PADRAO.curva;
// O teclado vira em RAMPA até `virada`: sobe em `sobe` segundos de 0 ao batente e volta ao centro em `volta` segundos (velocidades proporcionais à virada).
function rampa(alvo, atual, dt) {
  const d = alvo - atual, t = limite(dt || 0, 0, 0.1);
  const voltando = Math.abs(alvo) < Math.abs(atual) || alvo * atual < 0;
  const k = ACERTO.virada / (voltando ? ACERTO.volta : ACERTO.sobe);
  return atual + limite(d, -t * k, t * k);
}
const SOBE = ACERTO_PADRAO.virada / ACERTO_PADRAO.sobe, VOLTA = ACERTO_PADRAO.virada / ACERTO_PADRAO.volta; // (compat.: as taxas do padrão, por segundo)
// O teclado (ou o botão de toque): -1, 0 ou 1 vira o quanto o volante vira (`sens`, de 0,3 a 1,5; acima de 1 só limita em 1).
const teclado = (dir, sens = PADRAO.k) => limite((dir || 0) * sens, -1, 1) * ACERTO.virada; // (o batente do teclado é a virada do acerto)

const api = { LIMITES, PADRAO, ajustar, analogico, teclado, rampa, CURVA, SOBE, VOLTA, ACERTO, ACERTO_PADRAO, ACERTO_LIMITES, acertar, acertoPadrao };
if (typeof module !== "undefined" && module.exports) module.exports = api;
else root.Volante = api;
})(typeof self !== "undefined" ? self : this);
