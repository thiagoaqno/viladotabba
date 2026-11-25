// Corrida da Galera — os robôs: o trânsito (ver quem está perto, escolher o lado, ultrapassar e defender) e o contato
// entre os círculos dos carros. Parte de corrida-robos.js.
const T = require("../../public/corrida/pistas.js");
const F1 = require("../../public/corrida/f1-regras.js"); // os pneus das regras de F1
const D = require("../../public/corrida/dinamica.js");
const Sim = require("../../public/corrida/sim.js");
const Estilos = require("./corrida-estilos.js");
const { STEP, porNivel, V_ARRASTO } = require("./corrida-robos-base.js");
const { FOLGA_F1, FOLGA_F1_REAL, FOLGA_F1_ANTIGA, EMPURRAO_F1, EMPURRAO_F1_REAL, EMPURRAO_F1_ANTIGO } = require("./corrida-robos-ritmo.js");
let L_CARRO = 44, W_CARRO = 20; // (2026-11-20: W_CARRO 26 → 20: o carro da física tem 16 u de largura, sim.js DIMENSOES; 20 é ele com 2 u de folga de cada lado. Medido com 20 robôs, 3 min, 2 sementes: Mônaco 105 → 228 batidas e 136 → 230 trocas de posição; Interlagos 104 → 226 e 267 → 397; Monza 126 → 92 e 346 → 440) o carro em unidades da pista (carros.js: 4,4 m x 2,6 m, escala 10; no Formula GP 26,4 × 9,1: 5,5 m × 1,9 m, escala 4,8)
// atrás de um HUMANO, no Formula GP, o robô guarda mais espaço (de antes de #665): RESERVA_HUMANO s da velocidade dele na folga e FREADA_HUMANO s da freada medida
let RESERVA_HUMANO = 0, FREADA_HUMANO = 0.25;
// os 3 círculos do carro (como em colisao.js, que é do navegador)
function circulos(pos) {
  const r = W_CARRO * 0.45, d = Math.max(0, L_CARRO / 2 - r), fx = Math.cos(pos.a), fy = Math.sin(pos.a);
  return [-d, 0, d].map((u) => [pos.x + fx * u, pos.y + fy * u, r]);
}
// A força do contato entre dois carros: a velocidade com que se aproximaram (a de colisao.js: 0 se não encostaram).
function forcaDoContato(A, B) {
  if (Math.hypot(A.x - B.x, A.y - B.y) > L_CARRO * 1.6 || Math.abs((A.z || 0) - (B.z || 0)) > 12) return 0;
  let melhor = null;
  for (const [ax, ay, ar] of circulos(A)) for (const [bx, by, br] of circulos(B)) {
    const dx = ax - bx, dy = ay - by, d = Math.hypot(dx, dy), pen = ar + br - d;
    if (pen > 0 && (!melhor || pen > melhor.pen)) melhor = { pen, nx: d > 1e-6 ? dx / d : 0, ny: d > 1e-6 ? dy / d : 1 };
  }
  if (!melhor) return 0;
  const vx = Math.cos(A.a) * (A.v || 0) - Math.cos(B.a) * (B.v || 0), vy = Math.sin(A.a) * (A.v || 0) - Math.sin(B.a) * (B.v || 0);
  return Math.max(0, -(vx * melhor.nx + vy * melhor.ny));
}
// Os robôs batem entre si e nos humanos (a metade dos humanos o navegador deles manda): o servidor diz a força do contato.
function contatos(room, emit) {
  const rodando = room.order.map((id) => room.players[id]).filter((q) => q && q.pos && q.finish == null && !q.dnf && !q.box);
  for (let a = 0; a < rodando.length; a++) for (let b = a + 1; b < rodando.length; b++) {
    const A = rodando[a], B = rodando[b]; if (!A.bot && !B.bot) continue;
    const forca = forcaDoContato(A.pos, B.pos); if (!(forca >= F1.BATIDA_MIN)) continue;
    for (const q of [A, B]) if (q.bot) emit("batida", { id: q.id, forca, tipo: "carro" });
  }
}
// ---------- o trânsito: perceber, ultrapassar, defender e não bater (regras de F1) ----------
// O robô olha cada carro por perto (humano ou robô) pela distância ao longo da pista, pelo lado e pela velocidade de aproximação:
//  - AO LADO (|frente| < 1,7 carro): marca o lado como ocupado e mantém `margem` de folga lateral (de centro a centro; o carro tem 26 u
//    de largura): não vai para cima de quem está ao lado e, se já está mais perto que isso, se afasta;
//  - À FRENTE na faixa: limita a velocidade para parar a tempo (a do da frente mais o que dá para frear até chegar nele) e segue no
//    vácuo; a vez de ultrapassar só começa se o robô chega ao lado ANTES da freada (`tAlcance` menor que o tempo até frear): senão fica
//    atrás; escolhe o lado de dentro da próxima curva se couber (o de fora, só com folga de tempo), muda de linha com antecedência e,
//    se na freada ainda está atrás, desiste em vez de mergulhar por dentro;
//  - ATRÁS e chegando: nos níveis médio e difícil o robô pode fechar a porta UMA vez por atacante e por volta (vai para o lado de
//    dentro antes da freada) e nunca depois que o atacante emparelha.
// Devolve o desvio do traçado, o limite de velocidade, se tem alguém à frente, os lados bloqueados e os limites laterais.
const ALEM_MONACO = 14; // Mônaco, disputa: o centro do carro pode passar até 14 u do `teto` das barreiras (o muro físico fica a ~15, `muroFolga` 9), e até W/2 - 9 onde a rua é mais larga
const ATAQUE_PERTO_MONACO = L_CARRO * 2.5; // Mônaco: só começa a ultrapassar com o alvo a até 2,5 carros (ao longo da pista), onde o lado medido ainda vale
let MARG_PARADO = 28; // Mônaco: metade da folga extra ao contornar um carro lento; a largura é 26
const ARRANQUE_INI_MS = 2000, ARRANQUE_RAMPA_MS = 4000, ARRANQUE_SEM_ULT_MS = 3500; // a largada: a reserva de espaço à frente volta ao normal entre 2 s e 6 s, e sem ultrapassagem nos primeiros 3,5 s
// (2026-11: mais agressivos depois dos carros parelhos: emparelham mais cedo, mais perto de lado, e o difícil defende mais)
// (2026-11-24, o Thiago: "se o bot vem muito rápido e tem um carro na frente, frear não é a escolha certa: é colocar de lado e tentar a ultrapassagem,
// em milissegundos") chegando DESVIO_FECHA u/s ou mais rápido que o da frente, a menos de DESVIO_T s do contato e fora de curva fechada (curvatura abaixo
// de DESVIO_K), o robô vai para o lado livre na hora, sem esperar bateria, paciência nem reta; e durante a manobra só freia se a mudança de faixa
// (DESVIO_LAT u/s de lado, mais DESVIO_REACAO s) não terminar antes de encostar. Números de ajuste, não medidos: o Thiago testa jogando.
const DESVIO_FECHA = 20, DESVIO_T = 2.5, DESVIO_K = 1 / 300, DESVIO_LAT = 35, DESVIO_REACAO = 0.25;
const ESPERA_VAGA_MS = 2500, FECHA_MANOBRA = 20, ERS_ATAQUE = 0, ERS_DEFESA = 0.6; // (2026-11-16, o Thiago: "eles frequentemente zeram a bateria, é normal": no ataque gasta até zerar; era 0,35) (a defesa só com sobra: defendendo sempre, a bateria de quem ataca e a de quem defende se anulavam e o pelotão virava trem) // FECHA_MANOBRA: u/s acima do alvo que o robô mantém, meio de lado, para emparelhar (~15 km/h)
const _x = 0; // quanto tempo o robô espera, ainda atrás do alvo, o lado escolhido voltar a caber (transito)
const TRANSITO_NIVEL = { facil: { margem: 40, antec: 0.95, defende: 0.2 }, medio: { margem: 32, antec: 1.3, defende: 0.55 }, dificil: { margem: 30, antec: 1.5, defende: 0.65 } };
// Formula GP: a escala real troca os números acima pelos de antes de #665 (pistas.js chama na troca de escala)
const MARGENS_ANTIGAS = { facil: 40, medio: 32, dificil: 30 }, MARGENS_REAIS = { facil: 17, medio: 13.5, dificil: 12.5 };
T.aoTrocarEscala((real) => {
  [L_CARRO, W_CARRO, MARG_PARADO, RESERVA_HUMANO, FREADA_HUMANO] = real ? [26.4, 9.1, 10, 0.15, 0.45] : [44, 20, 28, 0, 0.25];
  Object.assign(FOLGA_F1, real ? FOLGA_F1_REAL : FOLGA_F1_ANTIGA); Object.assign(EMPURRAO_F1, real ? EMPURRAO_F1_REAL : EMPURRAO_F1_ANTIGO);
  for (const [k, m] of Object.entries(real ? MARGENS_REAIS : MARGENS_ANTIGAS)) TRANSITO_NIVEL[k].margem = m;
}); // (o difícil disputa como o médio: só o ritmo é maior, sem jogar ninguém para fora)
// a distância (u) até o ponto em que o perfil exige frear a partir da velocidade `v` (0: já freando; Infinity: nada nos próximos 540 u)
// (2026-11-24, o Thiago: "saída de curva, reta longa na frente, você tem bateria: já sai da curva com o ERS ligado e coloca de lado para ultrapassar")
// o tamanho da reta (em u) que começa até SAIDA_PONTOS pontos à frente; 0 se não há reta logo ali. Reta: curvatura abaixo de 1/1500 (a mesma do ERS).
// As corridas de pontos retos ficam guardadas no perfil (pf.retas), contadas de trás para a frente uma vez só.
const SAIDA_PONTOS = 30, RETA_K = 1 / 1500;
function retaAdiante(pf, i) {
  const n = pf.n;
  if (!pf.retas) { const r = new Int32Array(n); for (let volta = 0; volta < 2; volta++) for (let j = n - 1; j >= 0; j--) r[j] = pf.kf[j] < RETA_K ? Math.min(n, 1 + r[(j + 1) % n]) : 0; pf.retas = r; }
  for (let k = 0; k <= SAIDA_PONTOS; k++) { const c = pf.retas[(i + k) % n]; if (c > 0) return c * STEP; }
  return 0;
}
function distanciaDaFreada(fis, n, i, v) { const lim = v * 0.9; for (let k = 0; k <= 90; k++) if (fis[(i + k) % n] < lim) return k * STEP; return Infinity; }
// o lado de dentro da próxima curva de verdade (+1: lado de lat positivo; -1; 0 sem curva nos próximos ~600 u)
function ladoDeDentro(pf, i) { for (let k = 0; k <= 100; k++) { const j = (i + k) % pf.n; if (pf.kf[j] > 1 / 400) return pf.linha.sinal[j]; } return 0; }
// Resume até três curvas à frente: direção e distância. Uma sequência da mesma direção conta como uma curva;
// uma mudança de direção só entra quando é sustentada, para o ruído da linha não inventar um S.
function curvasAdiante(pf, i) {
  const curvas = []; let direcao = 0, candidata = 0, pontos = 0, distancia = 0, reta = 0;
  for (let k = 0; k <= 500 && k < pf.n; k += 4) {
    const j = (i + k) % pf.n, s = pf.kf[j] > 1 / 500 ? Math.sign(pf.linha.sinal[j]) : 0;
    if (!s) { if (++reta >= 4) direcao = 0; candidata = 0; pontos = 0; continue; }
    reta = 0;
    if (s === direcao) { candidata = 0; pontos = 0; continue; }
    if (s !== candidata) { candidata = s; pontos = 1; distancia = k * STEP; } else pontos++;
    if (pontos >= 3) { curvas.push({ lado: s, distancia }); direcao = s; candidata = 0; pontos = 0; if (curvas.length === 3) break; }
  }
  return curvas;
}
// Na disputa, privilegia a primeira curva, mas considera a segunda e a terceira para não escolher um lado ruim para um S.
function ordemDaPassagem(pf, i, latOutro, margem, baseLat, dentro) {
  const curvas = curvasAdiante(pf, i), pesos = [1, 0.65, 0.4];
  const valor = (lado) => curvas.reduce((v, curva, j) => v + lado * curva.lado * pesos[j] / (1 + curva.distancia / 2000), 0)
    - Math.abs(latOutro + lado * margem - baseLat) / 500;
  if (!curvas.length && dentro) return [dentro, -dentro];
  return valor(1) >= valor(-1) ? [1, -1] : [-1, 1];
}
function transito(room, p, ia, pf, i, baseLat, maxLat, vLivre = 0, plano = {}) {
  const ponto = pf.pts[i], c = pf.c, k = pf.kf, n = pf.n, now = Date.now();
  const nv = room.config.nivel; // (o nível de 0 a 100: porNivel; a conta fica guardada na sala, porque isto roda a cada passo de cada robô)
  if (!room._transitoNivel || room._transitoNivel.nv !== nv) { const T = TRANSITO_NIVEL; room._transitoNivel = { nv, v: Object.fromEntries(["margem", "antec", "defende"].map((k) => [k, Math.max(0, porNivel({ facil: T.facil[k], medio: T.medio[k], dificil: T.dificil[k] }, nv))])) }; }
  const niv = room._transitoNivel.v;
  const estilo = Estilos.parametros(room, p, niv);
  // a folga lateral entre carros acompanha a largura da pista: nas de 104 ou mais vale a de sempre; numa mais estreita (Mônaco, 84) a faixa em que o robô anda (maxLat = W/2 - 18) cabe menos, e uma folga de 44 jogava o carro de lado contra o muro
  const monaco = T.baseDe(room.config.pista) === "monaco";
  // (Mônaco: os robôs com mais cuidado, a pedido do Thiago, 2026-11-11: a folga lateral de antes, 6 a mais, e mais espaço atrás do carro da frente)
  const margemNormal = (niv.margem + (monaco ? 6 : 0)) * Math.min(1, (T.PISTAS[room.config.pista].width - 36) / 68);
  const MARG = monaco ? W_CARRO + Math.max(0, margemNormal - W_CARRO) * 0.5 : T.escalaReal() ? Math.max(W_CARRO + 3, margemNormal) : margemNormal; // (Formula GP: nunca menos que um carro e mais 3)
  const dFreio = plano.dFreio ?? Infinity, dentro = plano.dentro || 0, meu = ia.sim;
  const tx = ponto.tx, ty = ponto.ty, vlatMeu = meu ? meu.vx * -ty + meu.vy * tx : 0;
  const out = { desvio: 0, freio: Infinity, encontrou: false, bloqPos: false, bloqNeg: false, draft: 0, limMin: -Infinity, limMax: Infinity, tras: null };
  const reta = k[i] < 1 / 1100 && k[(i + 6) % n] < 1 / 1100 && k[(i + 12) % n] < 1 / 900;
  let alvo = null, tras = null; const vizinhos = [];
  // onde o outro carro está EM RELAÇÃO À PISTA: o ponto dele (a partir da distância ao longo da pista) e o lateral nesse ponto
  const ondeEsta = (o, distancia) => {
    let j = (((i + Math.round(distancia)) % n) + n) % n, a = pf.pts[j];
    j = (((j + Math.round(((o.pos.x - a.x) * a.tx + (o.pos.y - a.y) * a.ty) / STEP)) % n) + n) % n; a = pf.pts[j];
    return { i: j, lat: (o.pos.x - a.x) * -a.ty + (o.pos.y - a.y) * a.tx, dist: distancia * STEP };
  };
  const desdeLargada = room.startAt ? now - room.startAt : Infinity, arranque = Math.max(0, Math.min(1, (desdeLargada - ARRANQUE_INI_MS) / ARRANQUE_RAMPA_MS)), largando = desdeLargada < ARRANQUE_SEM_ULT_MS;
  // (2026-11-23, o Thiago: "mesmo com modo fantasma os robôs ainda evitam passar um dentro do outro") na classificação ninguém é tráfego: são fantasmas
  for (const oid of (room.phase === "quali" ? [] : room.order)) {
    const o = room.players[oid]; if (o === p || !o.pos || o.finish != null || o.dnf || Math.abs((o.pos.z || 0) - ponto.h) > 15 || o.fantAte > now) continue; // (o fantasma, parado e recolocado, não é tráfego)
    // Duas partes próximas do desenho (especialmente curvas de Spa) não são tráfego uma da outra. Confere também a
    // distância ao longo da pista; só o carro realmente adiante pode mandar frear.
    const distancia = ((o.ia ? o.ia.s : o.pos.prog) - ia.s + n * 1.5) % n - n * 0.5;
    if (distancia * STEP < -220 || distancia * STEP > 470) continue; // (até 470 adiante: o rastro do vácuo vai até 450)
    const dx = o.pos.x - p.pos.x, dy = o.pos.y - p.pos.y;
    const frente = dx * tx + dy * ty, lado = dx * -ty + dy * tx;
    // (2026-11-21) numa curva, o carro 300 u adiante aparece a mais de 90 u de lado no MEU quadro e era descartado: o robô só via o carro lento (rodado,
    // batido) a 60 u e entrava na traseira dele a 100-150 u/s a mais. O lado longe é o da pista (o dele no ponto dele contra o meu no meu).
    if (frente < -210 || frente > 460 || (o.box && !p.box)) continue;
    if (Math.abs(lado) > 90 && (monaco || Math.abs(ondeEsta(o, distancia).lat - (ia.lat || 0)) > 90)) continue;
    const temV = o.pos.vx !== undefined, ov = temV ? o.pos.vx * tx + o.pos.vy * ty : (o.pos.v || 0), vlatO = temV ? o.pos.vx * -ty + o.pos.vy * tx : 0;
    let latOutro = (o.pos.x - ponto.x) * -ty + (o.pos.y - ponto.y) * tx, iO = i, frentePista = frente;
    // Mônaco: o alvo adiante (100 a 260 u) costuma estar do outro lado de uma curva, e o lateral medido no quadro do MEU ponto não tem sentido ali
    // (dava 50 a 68 com a meia pista de 42). O lateral vale no quadro da pista DELE (o ponto dele), o mesmo do `baseLat` e dos limites.
    if (monaco) { const q = ondeEsta(o, distancia); latOutro = q.lat; iO = q.i; frentePista = q.dist; }
    // (2026-11-21) com a linha de corrida usando a pista toda, o lado medido no MEU quadro erra o do carro adiante numa curva (ele já foi para o ápice e
    // parecia estar de lado): o robô não freava por trânsito e batia na traseira. Longe (mais de 1,5 carro), a faixa é comparada pela pista: o lateral
    // dele no ponto dele contra o meu no meu.
    const faixaPista = !monaco && Math.abs(frente) > L_CARRO * 1.5 ? ondeEsta(o, distancia).lat - (ia.lat || 0) : lado;
    vizinhos.push({ id: oid, frente: monaco ? frentePista : frente, lat: latOutro, v: ov });
    const perto = Math.min(Math.abs(lado), Math.abs(lado + (vlatO - vlatMeu) * (monaco && ia.ult ? 0.5 : 0.4))); // a folga agora e adiante: quem vem de lado conta antes
    if (Math.abs(frente) < L_CARRO * 1.7 && perto < MARG + 12) { // ao lado (ou prestes a): lado ocupado e folga lateral mínima
      if (lado > 0) { out.bloqPos = true; out.limMax = Math.min(out.limMax, latOutro - MARG); } else { out.bloqNeg = true; out.limMin = Math.max(out.limMin, latOutro + MARG); }
      if (!ia.ult || ia.ult.id !== oid) out.ladoDeOutro = true; // (alguém além do carro que estou passando está ao meu lado)
    }
    const [ALC, LARG, ABRE] = Sim.vacuoRastro(); if (frente > 22 && frente < ALC && distancia * STEP > 8 && Math.abs(lado) < LARG + frente * ABRE) out.draft = Math.max(out.draft, 1 - (frente - 22) / (ALC - 22)); // (o mesmo rastro longo de Sim.vacuoAlvo)
    // quanto ele está freando (a desaceleração medida de uma passagem à outra): quem vem atrás conta com mais 0,25 s do mesmo freio
    const visto = (ia.vistos || (ia.vistos = {}))[oid] || (ia.vistos[oid] = { ov, t: now, a: 0 }), dtv = (now - visto.t) / 1000;
    if (dtv >= 0.04) { visto.a += (Math.max(-300, Math.min(100, (ov - visto.ov) / dtv)) - visto.a) * Math.min(1, dtv * 6); visto.ov = ov; visto.t = now; }
    const humano = !o.bot, ovPlano = Math.max(0, ov + Math.min(0, visto.a) * (humano ? FREADA_HUMANO : 0.25));
    const aproxima = Math.max(0, ia.v - ovPlano); // a velocidade com que me aproximo dele
    // Depois que abriu espaço lateral suficiente, o carro ultrapassado já não está na mesma faixa:
    // continuar seguindo a velocidade dele ali fazia o robô andar lado a lado sem conseguir passar.
    // (Mônaco: o espaço entre os dois pela faixa de cada um na pista, `ia.lat` x o lateral dele no ponto DELE; medido no meu quadro, com o outro
    // adiante numa curva, a faixa nunca ficava livre e o atacante seguia freando pelo da frente, sem nunca emparelhar)
    // (nas outras pistas vale a menor das duas medidas: numa curva, o lateral medido no meu quadro sozinho poderia soltar o freio com o outro ainda na minha frente)
    const alvoDaManobra = ia.ult?.id === oid;
    const separados = !alvoDaManobra ? perto : monaco ? Math.abs(ia.lat - latOutro) : ia.ult.lento ? perto : Math.min(perto, Math.abs(ia.lat - ondeEsta(o, distancia).lat));
    const faixaLivre = alvoDaManobra && separados >= W_CARRO + 1; // (sem sobreposição de lado: já pode emparelhar)
    if (frente > 0 && distancia * STEP > 8 && !faixaLivre && Math.abs(faixaPista) < W_CARRO + 8 + Math.min(10, aproxima * 0.1)) { // na minha faixa (quem chega rápido vê a faixa mais larga), à frente
      // reserva espaço para o freio progressivo da física (o pedal leva ~0,2 s para subir) e para o da frente frear mais forte que o previsto
      // (na largada o pelotão sai junto: a reserva de espaço cresce aos poucos, de quase nada no grid, onde os carros estão a 4 u um do outro, até
      // a de sempre; senão a fila de trás esperava cada carro da frente andar, uma fileira de cada vez)
      const folga = frente - L_CARRO - (12 + (monaco ? 8 : 0) + Math.min(15, k[i] * 1000) + aproxima * 0.1 + (humano ? ia.v * RESERVA_HUMANO : 0)) * arranque - 1;
      const desacel = D.frenagemMaxima(c, ia.v, 0, plano.aderenciaFreio) * 0.75;
      let lim = folga <= 0 ? ovPlano * 0.82 : Math.sqrt(Math.max(0, ovPlano * ovPlano + 2 * desacel * folga));
      // Já decidiu ultrapassar este carro mas ainda está na faixa dele: um fio de velocidade (sem encostar) para o volante ter o que virar
      // (o loop que o Thiago apontou: o robô chegava embalado, o freio de trânsito o segurava atrás com folga, a diferença de velocidade sumia e ele
      // desistia da manobra; e tentava de novo.) Meio de lado em relação ao alvo da manobra, ele continua FECHANDO: até FECHA_MANOBRA acima do outro
      if (alvoDaManobra && !monaco && separados >= W_CARRO * 0.5 && frente > L_CARRO * 1.15) lim = Math.max(lim, ovPlano + FECHA_MANOBRA);
      // já indo para o lado: se a mudança de faixa termina antes de encostar, não freia (mantém a velocidade de agora); só freia se não der tempo
      if (alvoDaManobra && !monaco && folga > 0) { const falta = Math.max(0, W_CARRO + 1 - separados); if (folga > aproxima * (DESVIO_REACAO + falta / DESVIO_LAT)) lim = Math.max(lim, ia.v); }
      else if (ia.ult && ia.ult.id === oid && frente > L_CARRO + 2) lim = Math.max(lim, V_ARRASTO);
      out.freio = Math.min(out.freio, lim);
      out.atras = Math.min(out.atras ?? Infinity, frente);
      const alcance = ov < 12 ? 300 : Math.max(200, Math.min(450, 160 + Math.max(0, ia.v - ov) * 2.2)); // quem chega rápido é visto de mais longe
      if (frente < alcance && (!alvo || frente < alvo.frente)) alvo = { o, ov, frente, latOutro, iO, dist: frentePista };
    }
    if (frente < -22 && distancia * STEP < -8 && Math.abs(lado) < 40 && (!tras || -frente < tras.gap)) tras = { o, oid, gap: -frente, ov, lado }; // o carro logo atrás, na minha esteira
  }
  out.encontrou = !!alvo; out.tras = tras;
  const livre = (side) => (side > 0 ? !out.bloqPos : !out.bloqNeg), naPista = (lat) => Math.abs(lat) <= maxLat;
  // Mônaco: o limite do centro do carro na disputa NUM ponto qualquer da pista (o do alvo, adiante), não só no meu
  const limEm = (j) => Math.min(T.PISTAS[room.config.pista].width / 2 - 9, pf.teto ? pf.teto[((j % n) + n) % n] + ALEM_MONACO : Infinity);
  // "preso": o carro da frente é bem mais lento do que eu andaria sozinho; nem esperando na reta nem atrás dele numa curva leve: passa por onde cabe
  const preso = !!alvo && vLivre > alvo.ov + 12, leve = k[i] < 1 / 450 && k[(i + 6) % n] < 1 / 450;
  const sob = !!(room.direcao?.safety || room.direcao?.amarelo) || largando; // (na largada ninguém ultrapassa nem defende: todos saem juntos, cada um na sua fila)
  if (sob) { ia.ult = null; ia.defesa = null; } // sob bandeira ninguém ultrapassa nem defende
  else {
    let emergenciaSemEspaco = false;
    // Se está chegando muito rápido, tenta desviar ANTES de encostar, sem soltar a freada de trânsito.
    // Só inicia a manobra com tempo, pista quase reta e espaço livre até o ponto onde o carro chegará.
    // (2026-11-24) não precisa de reta nem de estar longe da freada: basta não ser curva fechada; um carro bem mais lento (menos de 60% da minha velocidade)
    // se desvia até na entrada da freada. Começa a até DESVIO_T s do contato, não só quando o freio já não daria conta.
    if (!ia.ult && alvo && !ia.defesa && !monaco && k[i] < DESVIO_K && k[(i + 6) % n] < DESVIO_K && (dFreio > 30 || alvo.ov < ia.v * 0.6)) {
      const fecha = ia.v - alvo.ov, folga = alvo.frente - L_CARRO;
      const risco = fecha > DESVIO_FECHA && folga > 0 && folga / fecha < DESVIO_T;
      if (risco) {
        const olhar = Math.ceil(Math.max(ia.v, 30) * 1.2 / STEP);
        let limite = maxLat;
        if (pf.teto) for (let k = 0; k <= olhar; k++) limite = Math.min(limite, pf.teto[(i + k) % n] + (monaco ? ALEM_MONACO : 0));
        const lados = ordemDaPassagem(pf, i, alvo.latOutro, MARG, baseLat, dentro);
        const lado = lados.find((s) => livre(s) && Math.abs(alvo.latOutro + s * MARG) <= limite);
        if (lado) ia.ult = { id: alvo.o.id, lado, ate: now + 3000, lento: false, parado: false, marg: MARG, emergencia: true };
        else emergenciaSemEspaco = true;
      }
    }
    const limiteLento = 40; // o tratamento especial de um carro quase parado não é um limite de velocidade para atacar
    const curvaDisputavel = monaco && !!alvo;
    // o ataque na saída (passoF1 manda `plano.saidaReta`: saindo de curva para uma reta longa, com bateria): parte para o lado já na saída, com o carro
    // da frente a até SAIDA_PERTO carros, sem esperar ter diferença de velocidade (ela vem do ERS ligado desde a saída)
    const saidaAtaque = !!plano.saidaReta && !!alvo && alvo.frente < L_CARRO * SAIDA_PERTO && k[i] < 1 / 600;
    if (!ia.ult && !emergenciaSemEspaco && alvo && now > (ia.ultAte || 0) && (!monaco || alvo.dist < ATAQUE_PERTO_MONACO) && (monaco || reta || saidaAtaque || alvo.ov < limiteLento || (preso && leve) || dFreio === Infinity)) {
      // Usa a velocidade que teria com pista livre: depois de alcançar o carro o freio de trânsito já reduziu ia.v.
      const fecha = Math.max(ia.v, vLivre) - alvo.ov, lento = alvo.ov < limiteLento;
      // quanto tempo até emparelhar (o bico no meio do outro carro; a mudança de linha leva ~0,9 s em paralelo) contra o tempo até frear
      const tAlcance = Math.max(0.9, (alvo.frente - L_CARRO * 0.5) / Math.max(fecha, 10)), tFreio = dFreio / Math.max(ia.v, 30);
      const chega = lento || dFreio === Infinity || tAlcance < tFreio * estilo.antec || curvaDisputavel, foraDaFreada = lento || dFreio > 30 || curvaDisputavel;
      const querPassar = saidaAtaque || (monaco ? (fecha > estilo.diferencaMinima * 0.5 || (ia.v < 12 && alvo.ov < 12)) : ((fecha > estilo.diferencaMinima && ia.v > 30) || (preso && (ia.v > 30 || lento)) || (ia.v < 12 && alvo.ov < 12)));
      // (2026-11-16, o Thiago: "eles só entram no modo ultrapassagem se tiverem bateria, exceto na garoa e na chuva") sem ERS_MANOBRA de bateria o
      // robô não parte para a manobra: fica atrás guardando energia. Na garoa e na chuva a bateria não conta (passa quando quiser), e um carro quase
      // parado à frente sempre pode ser passado.
      const molhado = room.clima ? F1.climaEm(room.clima, now).agua > 0.1 : false, comBateria = !ia.ers || ia.ers.carga >= minimoParaAtacar(p);
      // (2026-11-16, Catar: "parecia um safety car, ninguém me ultrapassava"; "esperar a bateria é estratégia, mas gosto dos bots agressivos que
      // tentam passar, não em toda curva") esperar carga é o plano, mas cada piloto tem PACIÊNCIA: colado atrás do mesmo carro por mais que ela,
      // tenta mesmo sem bateria. O mais agressivo (ataque 1) espera ~4 s, o do meio ~9 s, o mais cauteloso ~14 s. Um carro bem mais lento (`preso`) passa logo.
      const seg = ia.seguindo && ia.seguindo.id === alvo.o.id && alvo.frente < L_CARRO * 3 ? ia.seguindo : (ia.seguindo = { id: alvo.o.id, desde: now });
      const ataqueP = p.piloto ? Estilos.dePiloto(p.piloto).ataque : 0.5, paciencia = 4000 + 10000 * (1 - Math.max(0, Math.min(1, Number.isFinite(ataqueP) ? ataqueP : 0.5)));
      const cansou = alvo.frente < L_CARRO * 3 && now - seg.desde > paciencia;
      if (querPassar && chega && foraDaFreada && (comBateria || molhado || lento || preso || cansou)) {
        // O lado leva em conta a sequência de curvas; em Mônaco também pode disputar por fora quando a faixa está livre.
        const lados = ordemDaPassagem(pf, i, alvo.latOutro, MARG, baseLat, dentro);
        const folgaFora = lento || dFreio === Infinity || tAlcance < tFreio * estilo.antec * 0.8;
        let lado = 0;
        // carro PARADO à frente (acidente, rodado): passa raspando, com menos folga lateral e usando até perto do muro (senão, numa pista estreita, ninguém cabia ao lado dele)
        const parado = alvo.ov < 15, lentoMonaco = lento && T.baseDe(room.config.pista) === "monaco";
        const mg = lentoMonaco ? MARG_PARADO : parado ? 32 : MARG;
        const limiteLento = lentoMonaco || parado ? (plano.maxLatLento ?? maxLat) : maxLat;
        const cabe = (lat) => Math.abs(lat) <= (monaco ? limEm(alvo.iO) : limiteLento);
        // Em Mônaco a faixa pode estreitar antes de o carro terminar a mudança. Confere esse trecho e
        // outros carros que já estejam na faixa pretendida, sem proibir a disputa por velocidade ou curva.
        const faixaSegura = (lat) => {
          if (!monaco) return true;
          // o lado só precisa caber ONDE o alvo está (um pouco antes e depois dele): até lá o carro vai mudando de linha, e a rua mais
          // estreita lá na frente não cancela a tentativa; quem cai nela fica atrás do outro e o limite o segura
          const ate = Math.max(0, Math.round(alvo.dist / STEP)) + 8;
          for (let j = Math.max(0, ate - 14); j <= ate; j += 2) if (Math.abs(lat) > limEm(i + j)) return false;
          return vizinhos.every((v) => v.id === alvo.o.id || Math.abs(v.frente) > L_CARRO * 2.5 + Math.min(80, Math.max(0, ia.v - v.v) * 0.4) || Math.abs(v.lat - lat) >= MARG);
        };
        // fora de Mônaco a folga encolhe até o que couber (mínimo: a largura do carro com um respiro): com 44 u fixos, um alvo perto do centro não deixava lado nenhum nas pistas de até 104
        let mgLado = mg;
        for (const s of lados) { const m = monaco ? mg : Math.max(W_CARRO + 3, Math.min(mg, limiteLento - s * alvo.latOutro)), lat = alvo.latOutro + s * m; if (cabe(lat) && livre(s) && faixaSegura(lat) && (monaco || !dentro || s === dentro || folgaFora || parado)) { lado = s; mgLado = m; break; } }
        if (lado) ia.ult = { id: alvo.o.id, lado, ate: now + 7000, lento, parado, marg: mgLado, curva: curvaDisputavel };
      }
    }
    if (ia.ult) { // a ultrapassagem em andamento segue até o carro ficar para trás (ou o lado fechar)
      const o = room.players[ia.ult.id], tem = o && o.pos, dx = tem ? o.pos.x - p.pos.x : 0, dy = tem ? o.pos.y - p.pos.y : 0;
      const frente = dx * tx + dy * ty;
      let alvoLat = (tem ? (o.pos.x - ponto.x) * -ty + (o.pos.y - ponto.y) * tx : 0) + ia.ult.lado * (ia.ult.marg || MARG);
      let limite = ia.ult.lento && (T.baseDe(room.config.pista) === "monaco" || ia.ult.parado) ? (plano.maxLatLento ?? maxLat) : maxLat, linhaDele = baseLat;
      if (monaco && tem) { // o lateral do alvo no quadro DELE, e a linha do robô ali: o desvio leva o carro até o lado escolhido onde o alvo está
        const q = ondeEsta(o, ((o.ia ? o.ia.s : o.pos.prog) - ia.s + n * 1.5) % n - n * 0.5);
        limite = limEm(q.i) + 1;
        // o alvo andou de lado e o lado escolhido já não cabe na rua: se ainda estou atrás dele, troca para o outro lado em vez de desistir
        if (Math.abs(q.lat + ia.ult.lado * (ia.ult.marg || MARG)) > limite && frente > L_CARRO * 0.6 && (ia.ult.trocas || 0) < 2 && Math.abs(q.lat - ia.ult.lado * (ia.ult.marg || MARG)) <= limite && livre(-ia.ult.lado)) { ia.ult.lado = -ia.ult.lado; ia.ult.trocas = (ia.ult.trocas || 0) + 1; }
        // aperta o carro contra o limite da rua em vez de desistir: só vale se sobrar entre os dois pelo menos a largura do carro com um respiro
        const fisico = limEm(q.i), cabeAo = ia.ult.lado > 0 ? fisico - q.lat : fisico + q.lat;
        const mgAgora = Math.max(W_CARRO + 1, Math.min(ia.ult.marg || MARG, cabeAo));
        alvoLat = q.lat + ia.ult.lado * mgAgora; if (cabeAo >= W_CARRO + 1) limite = Infinity; linhaDele = plano.linhaEm ? plano.linhaEm(q.i) : baseLat;
      }
      if (!monaco && tem && !ia.ult.parado) { // o alvo andou para o meu lado: aperta até o limite ou, ainda atrás dele, troca de lado (a mesma ideia de Mônaco, sem passar do limite da pista)
        const latDele = alvoLat - ia.ult.lado * (ia.ult.marg || MARG), minimo = W_CARRO + 1, espaco = (s) => limite - s * latDele;
        if (espaco(ia.ult.lado) < minimo && frente > L_CARRO * 0.6 && (ia.ult.trocas || 0) < 2 && espaco(-ia.ult.lado) >= minimo && livre(-ia.ult.lado)) { ia.ult.lado = -ia.ult.lado; ia.ult.trocas = (ia.ult.trocas || 0) + 1; }
        alvoLat = latDele + ia.ult.lado * Math.max(minimo, Math.min(ia.ult.marg || MARG, espaco(ia.ult.lado)));
      }
      // (sem prazo: a disputa pode durar várias curvas; acaba se passou, se ele abriu mais de ~6 carros, se não cabe mais ou se o lado fechou)
      // o lado escolhido não cabe agora: ainda atrás do alvo (que atravessa a pista seguindo a linha), o robô ESPERA a vaga encostado no limite
      // em vez de desistir (medido em Interlagos: 9 de cada 10 manobras acabavam assim, com o alvo de 1 a 6 carros à frente, e logo começava outra);
      // só desiste sem vaga se já emparelhou ou se a vaga não abre em ESPERA_VAGA_MS
      let semVaga = Math.abs(alvoLat) > limite;
      if (semVaga && frente > L_CARRO * 0.6 && !monaco) { ia.ult.semVaga ??= now; if (now - ia.ult.semVaga < ESPERA_VAGA_MS) { alvoLat = Math.sign(alvoLat) * limite; semVaga = false; } }
      else if (!semVaga) ia.ult.semVaga = null;
      let acabou = !tem || frente < -L_CARRO * 1.6 || frente > L_CARRO * 6 || semVaga || (!livre(ia.ult.lado) && Math.abs(frente) < L_CARRO);
      // na freada não mergulha: quem ainda está atrás do outro (o bico não chegou ao meio dele) desiste e fica no vácuo; por dentro, já encostado na lateral dele, segue
      if (!acabou && !ia.ult.lento && !ia.ult.curva && dFreio < 30 && frente > L_CARRO * (ia.ult.lado === dentro ? 0.9 : 0.45)) { acabou = true; ia.ultAte = now + estilo.espera; }
      if (acabou) ia.ult = null; else out.desvio = alvoLat - linhaDele;
    }
    // defesa: UMA porta fechada por atacante e por volta, antes da freada, e nunca contra quem já emparelhou
    if (!ia.defesa && !ia.ult && tras && estilo.defende > 0 && dentro && dFreio > 90 && dFreio < 450 && ia.v > 80) {
      const chave = tras.oid + ":" + (p.laps || 0), usadas = ia.defendeu || (ia.defendeu = {});
      if (!usadas[chave] && (tras.ov > ia.v - 4 || tras.gap < 110) && !out.bloqPos && !out.bloqNeg) {
        usadas[chave] = true;
        if (F1.sorteio(`defesa:${room.semente}:${p.id}:${chave}`)() < estilo.defende) ia.defesa = { id: tras.oid, lado: dentro, ate: now + Math.min(3000, (dFreio / Math.max(ia.v, 60)) * 1000) };
      }
    }
    // o vácuo: na reta, longe da freada, sem manobra nem defesa, o robô se alinha atrás do carro da frente para pegar o vácuo
    // (e daí sai de lado para atacar já com a velocidade a mais); só se a linha dele cabe na pista e ninguém está ao meu lado
    if (!ia.ult && !ia.defesa && alvo && reta && !monaco && dFreio > 160 && alvo.frente > L_CARRO * 1.4 && alvo.frente < 230 && !out.bloqPos && !out.bloqNeg && Math.abs(alvo.latOutro) <= maxLat) {
      const peso = Math.min(1, (230 - alvo.frente) / 120) * 0.8;
      out.desvio = (alvo.latOutro - baseLat) * peso;
    }
    if (ia.defesa) {
      const emparelhou = out.bloqPos || out.bloqNeg;
      if (now > ia.defesa.ate || dFreio < 20 || ia.ult) ia.defesa = null;
      else if (emparelhou) out.desvio = (meu ? ia.lat : baseLat) - baseLat; // o atacante chegou ao lado: não se mexe mais
      else out.desvio = ia.defesa.lado * maxLat * 0.8 - baseLat;
    }
  }
  return out;
}
const ERS_MANOBRA = +(process.env.ROBO_ERS_MANOBRA ?? 0.3);
// (2026-11-16, o Thiago: "os pilotos têm diferentes perfis e carros") o mínimo de bateria para partir para a ultrapassagem é de cada piloto, pelo perfil de
// ataque (corrida-estilos.js, 0 a 1, com a pressão do campeonato): o mais agressivo (1) parte com 18%, o do meio (0,5) com 30%, o mais cauteloso (0) espera 42%
const minimoParaAtacar = (p) => { const a = p && p.piloto ? Estilos.dePiloto(p.piloto).ataque : 0.5; return ERS_MANOBRA * (1.4 - 0.8 * Math.max(0, Math.min(1, Number.isFinite(a) ? a : 0.5))); }; // a bateria mínima para partir para uma ultrapassagem (fora da chuva)

const SAIDA_PERTO = 5; // (carros: ~1 s a 200 km/h)
module.exports = { retaAdiante, get L_CARRO() { return L_CARRO; }, forcaDoContato, ALEM_MONACO, ERS_ATAQUE, ERS_DEFESA, TRANSITO_NIVEL, distanciaDaFreada, ladoDeDentro, transito, minimoParaAtacar };
