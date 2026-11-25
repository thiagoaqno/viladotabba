// Corrida da Galera — os robôs. Rodam no servidor e aprendem com a galera: se alguém já fez uma volta limpa na pista,
// eles usam até cinco linhas humanas diferentes, com velocidade limitada e margem para ultrapassagem. Sem volta
// gravada, seguem o traçado de corrida calculado (abre antes da curva, corta no ápice) com a velocidade que a curva
// permite. Pegam caixas e usam os itens. Para os navegadores eles são pilotos como os outros: a posição sai pelo
// mesmo evento "ghost" e as voltas contam pelos mesmos setores.
const T = require("../../public/corrida/pistas.js");
const Itens = require("./corrida-itens.js");
const F1 = require("../../public/corrida/f1-regras.js"); // os pneus das regras de F1
const F1Equipes = require("../../public/corrida/f1-equipes.js"); // a montagem do carro de cada equipe
const D = require("../../public/corrida/dinamica.js");
const Sim = require("../../public/corrida/sim.js");
const Contato = require("./corrida-contato.js"); // a batida entre carros a cada passo, igual à dos humanos (histórico e impulsos)
const Estilos = require("./corrida-estilos.js");
const Pilotos = require("../../public/corrida/f1-pilotos-2026.js"); // as equipes e os pilotos reais de 2026 (os robôs das regras de F1)
const { SKINS } = require("../../public/pelada/campo.js");
const Piloto = require("./corrida-piloto.js");
const { GRID_F1, NOMES, nomeDoNivel, rnd, LARGURA_ESTREITA, porNivel, STEP, V_PRESO, T_SEM_ANDAR, T_PRESO, DIFICIL_ANTIGO, PAT, ALFA_TRACAO, ALFA_FRENTE, K_FRENTE, TRAVA_ABS, ENCOLHIDO, BALA, forcaDoNivel, MARCA_NIVEL, NIVEIS, RITMO } = require("./corrida-robos-base.js");
const { perfil, perfilF1, topoDe, aderRef, prepararTracado, tracadoPronto, linhaF1Pronta, idealDe, aprender, usarFonte, aprendido, tempoDaVolta } = require("./corrida-robos-linha.js");
const { largada, QUALI_SAIDA_MS, ritmoDosRobos, nivelDe, acertoDoRobo, aquecerNiveis, reforcoDoNivel, fatorDoQuali, razaoDaVolta, condicaoDaAgua, semReforco, forcaDoReforco, proximidadeDaSala, TOQUES_MURO_MAX, preaquecerQuali, preaquecerNiveis, prazoDeChegada, voltaLancada, duracaoDaClassificacao } = require("./corrida-robos-ritmo.js");
const TransitoRobo = require("./corrida-robos-transito.js"); // (L_CARRO: lidos por aqui para valer o valor de agora)
const { TRANSITO_NIVEL, ALEM_MONACO, transito, distanciaDaFreada, ladoDeDentro, minimoParaAtacar, ERS_ATAQUE, ERS_DEFESA, forcaDoContato } = require("./corrida-robos-transito.js");
const { ESTILOS_BOX, decidirParada, ritmoDosPneus, escolherComposto } = require("./corrida-robos-box.js");
// troca os robôs da sala pelos novos (chamado na largada); devolve os ids
function preparar(room, COLORS, rid) {
  remover(room);
  const f1 = room.config.regras === "f1";
  const livres = (f1 ? GRID_F1 : 8) - room.order.length, n = Math.max(0, Math.min(livres, room.config.robos || 0)), carros = Object.keys(T.CARROS), skins = Object.keys(SKINS);
  const sorteio = f1 ? F1.sorteio(`robos:${room.semente}`) : Math.random;
  // regras de F1: o robô anda com o carro da equipe dele (a montagem do chefe humano, se tem, senão a padrão de f1-equipes.js);
  // quem já tem humano na equipe deixa a vaga dele (cada equipe tem 2 carros)
  const ocupadas = {};
  for (const q of Object.values(room.players)) if (!q.bot && q.equipe) ocupadas[q.equipe] = (ocupadas[q.equipe] || 0) + 1;
  const pilotos = f1 ? (room.pilotosTemporada || Pilotos.escolher(n, room.semente, ocupadas)) : []; // na temporada, o contrato fixa o companheiro
  for (let k = 0; k < n; k++) {
    const usadas = new Set(Object.values(room.players).map((p) => p.color)), id = f1 ? `robo-${k + 1}` : "r" + rid(5), pil = pilotos[k], equipe = pil && Pilotos.EQUIPES[pil.equipe];
    room.players[id] = { id, name: pil ? pil.curto : NOMES[k % NOMES.length], bot: true, token: null, pawn: "🤖", color: equipe ? equipe.cor : COLORS.find((c) => !usadas.has(c)) || COLORS[k % COLORS.length], skin: skins[(sorteio() * skins.length) | 0], car: f1 ? "equilibrado" : carros[(sorteio() * carros.length) | 0], mods: equipe && T.MODS.pintura[equipe.pintura] ? { pintura: equipe.pintura } : { ...T.MODS_PADRAO }, grid: 0, laps: 0, sector: T.SECTORS - 1, started: false, finish: null, best: null, last: null, sockets: new Set(),
      ...(pil ? { piloto: { id: pil.id, ritmo: pil.ritmo, constancia: pil.constancia, largada: pil.largada }, equipe: pil.equipe, numero: pil.numero, sigla: pil.sigla, nomeCompleto: pil.nome, spec: F1Equipes.specDaEquipe(pil.equipe, room.montagens && room.montagens[pil.equipe]) } : {}) };
    room.order.push(id);
  }
}
function remover(room) {
  for (const id of room.order) if (room.players[id] && room.players[id].bot) delete room.players[id];
  room.order = room.order.filter((id) => room.players[id]);
}
// depois do grid sorteado: cada robô no seu lugar, parado
// o plano do domingo de um robô na carreira: o normal (35%), o ataque, o seguro, a largada forte e o fim forte (14% cada) e esticar os pneus (9%)
function planoDoRobo(room, id) {
  const r = F1.sorteio(`plano-robo:${room.semente}:${id}`)();
  return r < 0.35 ? null : r < 0.49 ? "arriscar" : r < 0.63 ? "seguro" : r < 0.77 ? "largada" : r < 0.91 ? "final" : "pneu";
}
function prepararQuali(room) {
  const q = room.quali; if (!q) return;
  largar(room);
  const agua = room.clima ? F1.climaEm(room.clima, q.startAt).agua : 0, composto = F1.compostoDaClassificacao ? F1.compostoDaClassificacao(agua) : "macio";
  const rg = F1.sorteio(`saida:${room.semente}:${q.i}`); let grupo = 0, noGrupo = 0, tam = 2 + Math.floor(rg() * 2);
  for (const id of room.order) {
    const p = room.players[id]; if (!p.bot) continue;
    if (!q.ativos.includes(id)) { p.ia = null; p.pos = null; continue; }
    if (noGrupo >= tam) { grupo++; noGrupo = 0; tam = 2 + Math.floor(rg() * 2); }
    p.qSaida = q.startAt + grupo * QUALI_SAIDA_MS; noGrupo++;
    if (p.ia && p.ia.sim) { const pn = F1.pneuNovo(composto); pn.temp = 0.85; p.ia.pneu = pn; p.ia.sim.pneu = pn; p.ia.plano = { largada: composto, paradas: [] }; Object.assign(p, { pneu: composto, pneuAtual: composto, compostos: [composto] }); }
  }
}
function largar(room) {
  const t = T.PISTAS[room.config.pista], bots = room.order.filter((id) => room.players[id].bot);
  // A conta do ritmo de cada robô (o perfil de velocidade da pista para o carro e o traçado dele) leva de 25 a 40 ms por robô numa pista
  // ainda não vista: com 21 robôs, o servidor parava uns 640 ms de uma vez na largada (medido em 2026-11-11, Monza, perfil do Node). Com
  // `room.nivelEmPedacos` (corrida.js), a conta vai um robô por vez em `aquecerNiveis`, durante a tela de carregamento e a transmissão: os
  // robôs só andam depois das luzes, e se ainda faltar alguém, o passo faz a conta dele na hora (passoF1). Sem a marca (os testes), tudo na hora.
  const emPedacos = !!room.nivelEmPedacos && room.config.regras === "f1", fila = [];
  if (!emPedacos) ritmoDosRobos(room);
  for (const id of room.order) {
    const p = room.players[id]; if (!p.bot) continue;
    const tracadoId = bots.indexOf(id), pf = perfil(room.config.pista, p.spec || p.car, tracadoId), g = largada(pf.pts, p.grid, t.width, room.config.regras === "f1");
    const nivel = emPedacos ? null : nivelDe(room, p, tracadoId, bots.length, pf);
    if (emPedacos) fila.push(id);
    const pil = p.piloto; // regras de F1: o piloto de verdade manda na reação da largada e na regularidade da linha
    p.pos = null; // a posição da corrida passada não vale (o bico seria calculado a partir dela)
    // na largada: sai na própria faixa do grid, com um tempo de reação diferente, e cada um tem o seu jeito de fazer as curvas
    // regras de F1: a estratégia de parada do robô (o composto da largada e as paradas) e o mesmo pneu de quem joga
    // (2026-11-21, o Thiago: "cada bot deve escolher uma estratégia também, assim fica justo pra todo mundo") na carreira, cada robô tem o plano do domingo
    // dele (f1-regras.js PLANOS_DOMINGO), sorteado pela semente do GP; a estratégia de box já conta o pneu do plano
    if (room.config.regras === "f1") p.plano = planoDoRobo(room, id); else delete p.plano; // (2026-11-24, o Thiago: em toda corrida de F1, não só na carreira)
    const f1 = room.config.regras === "f1", plano = f1 ? F1.estrategia(room.config.voltas, nomeDoNivel(room.config.nivel), `${room.semente}:${id}`, room.config.pista, (p.spec ? p.spec.desgaste : 1) * Estilos.parametros(room, p, TRANSITO_NIVEL.medio).desgaste * F1.desgasteDoPlano(p.plano)) : null;
    // chuva: o quanto cada robô "sente" a água a mais ou a menos (±0,1, fixo no GP): não trocam todos de pneu juntos
    const vies = f1 ? Math.round((F1.sorteio(`vies:${room.semente}:${id}`)() - 0.5) * 20) / 100 : 0, aguaLargada = f1 && room.clima ? F1.climaEm(room.clima, room.startAt).agua : 0;
    if (plano && aguaLargada > 0) { const melhor = F1.compostoPorAgua(room.config.pista, Math.max(0, Math.min(1, aguaLargada + vies)), [...F1.SECOS, "chuva", "intermediario"], plano.largada); if (!F1.SECOS.includes(melhor)) { plano.largada = melhor; plano.paradas = []; } } // larga molhado: sai de chuva
    if (plano) Object.assign(p, { pneu: plano.largada, pneuAtual: plano.largada, compostos: [plano.largada], paradas: [], acrescimo: 0, box: null });
    const rng = F1.sorteio(`estilo:${room.semente}:${id}`); // regras de F1: cada robô tem o seu jeito (sorteado pela semente do GP)
    // o jeito de cada robô com o box (sorteado pela semente do GP): segue o plano, faz o undercut (para uma volta antes quando está colado no
    // da frente), o overcut (estica uma volta em ar limpo) ou é oportunista (aproveita o safety car para parar mais cedo)
    const estiloBox = pil && Estilos.PERFIS[pil.id] ? Estilos.dePiloto(pil).box : ESTILOS_BOX[Math.floor(F1.sorteio(`box:${room.semente}:${id}`)() * ESTILOS_BOX.length)];
    // Cada corrida conserva seus perfis: aprender uma volta invalida o cache global só para as próximas largadas.
    p.ia = { estiloBox, perfil: pf, s: g.idx, s0: g.idx, lat: g.lat, lat0: g.lat, desvio: 0, v: 0, nivel, jeito: pil ? rnd(-1, 1) * (2 + (100 - pil.constancia) * 0.3) : rnd(-7, 7), tracadoId, reacao: pil ? Math.max(150, Math.min(400, Pilotos.reacaoNaLargada(pil.largada) + rnd(-25, 25))) : rnd(150, 400), usaEm: 0,
      pneu: f1 ? F1.pneuNovo(p.pneu) : null, ers: f1 ? F1.ersNovo() : null, plano, box: null,
      estilo: f1 ? estiloDe(room, p, rng) : null, vies, erro: null, erroLivre: 0, ult: null };
    if (f1) {
      if (t.width <= LARGURA_ESTREITA) p.ia.jeito *= 0.5; // menos variação lateral entre as muretas
      p.ia.jeito += p.ia.estilo.lado;
      if (T.baseDe(room.config.pista) === "monaco") p.ia.jeito *= 0.5; // menos oscilação entre os muros, sem mudar os desvios do trânsito
      const tr = Sim.criarPista(t, room.config.pista);
      const car = Sim.novo(tr, { grid: p.grid, f1: true, pneu: p.ia.pneu, box: true });
      car.ers = p.ia.ers;
      car.acerto = acertoDoRobo(room.config.pista, room.config.nivel, p.id); // (o mesmo acerto que quem joga usa: sim.js, extraDoAcerto)
      p.ia.sim = car;
      p.pos = { x: car.x, y: car.y, z: car.z, a: car.a, v: 0, prog: car.prog, at: Date.now() };
    } else posicionar(p, pf, 0);
  }
  if (emPedacos) aquecerNiveis(room, fila, bots.length);
}
// O jeito de pilotar de um robô (regras de F1): `dentro` (de -1, abre as curvas, a 1, fecha por dentro), `lado` (o quanto
// anda para um lado da linha), `look` (quantos pontos antes da curva ele começa a frear: 2 freia tarde, 5 cedo) e `erroK`
// (o quanto erra: o nível e a constância do piloto contam). Os erros saem de um sorteio da semente, como o resto do GP.
function estiloDe(room, p, rng) {
  const pil = p.piloto, nivel = Math.max(0.3, porNivel({ facil: 1.5, medio: 1, dificil: 0.6 }, room.config.nivel));
  const estreita = T.PISTAS[room.config.pista].width <= LARGURA_ESTREITA;
  return { dentro: (rng() * 2 - 1) * (estreita ? 0.5 : 1), lado: (rng() * 2 - 1) * (estreita ? 2 : 9), look: pil && Estilos.PERFIS[pil.id] ? 2 + Math.min(3, Math.floor((1 - Estilos.dePiloto(pil).frenagem) * 4)) : 2 + Math.floor(rng() * 4), erroK: nivel * (pil ? 0.5 + (100 - pil.constancia) / 40 : 1), erros: F1.sorteio(`erros:${room.semente}:${p.id}`) };
}
// Os erros de um robô (regras de F1): na frenagem para uma curva, de vez em quando (mais nos níveis fáceis e nos pilotos menos
// constantes) ele trava a roda: freia pela metade por um instante, estraga um pouco o pneu e entra rápido demais; aí sai largo
// (abre para fora da curva e perde tempo). Raramente entra tão rápido que bate no muro (a batida tem força, punição e dano
// como a de quem joga). Os erros só custam tempo: nunca dão velocidade. Devolve o alvo, o freio e o desvio de linha.
function erroDoRobo(room, p, ia, pf, i, alvo, olha, now, dt, emit) {
  const est = ia.estilo, k = pf.kf, j = (i + olha + 2) % pf.n, out = { alvo, freioK: 1, desvio: 0 };
  if (!ia.erro && now > ia.erroLivre && ia.v > alvo + 12 && Math.max(k[j], k[(j + 4) % pf.n], k[(j + 8) % pf.n]) > 1 / 450 && est.erros() < 0.05 * est.erroK * dt) {
    ia.erro = { tipo: "travou", ate: now + 900, lado: -pf.linha.sinal[j] }; ia.erroLivre = now + 30000;
    if (ia.pneu) ia.pneu.desgaste = Math.min(1, ia.pneu.desgaste + 0.004); // o pneu travado ganha um ponto chato
  }
  const e = ia.erro; if (!e) return out;
  if (now >= e.ate) {
    if (e.tipo === "travou" && ia.v > alvo + 15) ia.erro = { tipo: "largo", ate: now + 1800, lado: e.lado, bateu: false }; else ia.erro = null;
    return out;
  }
  if (e.tipo === "travou") out.freioK = 0.45;
  else {
    out.desvio = e.lado * 24 * Math.min(1, (T.PISTAS[room.config.pista].width - 36) / 68); out.alvo = alvo * 0.9; // (a saída larga acompanha a largura da pista: numa pista de 84 o desvio de 24 já jogava o carro no muro)
    const excesso = ia.v - pf.lim[i] * 1.25;
    if (!e.bateu && excesso > 20 && Math.abs(ia.lat) > T.PISTAS[room.config.pista].width * 0.22 && est.erros() < 0.35) { // entrou tão rápido que não segurou: o muro
      e.bateu = true; emit("batida", { id: p.id, forca: Math.min(F1.BATIDA_MAX, excesso * 1.2), tipo: "muro" }); ia.v *= 0.5;
    }
  }
  return out;
}
function posicionar(p, pf, laps) {
  const { pts, n } = pf, i = Math.floor(p.ia.s) % n, j = (i + 1) % n, f = p.ia.s - Math.floor(p.ia.s), a = pts[i], b = pts[j];
  const x = a.x + (b.x - a.x) * f - a.ty * p.ia.lat, y = a.y + (b.y - a.y) * f + a.tx * p.ia.lat, z = a.h + (b.h - a.h) * f;
  const prog = p.started ? laps * n + i : i - n;
  // o bico aponta para onde o carro está andando de verdade (sem isso, trocando de lado ele parecia derrapar)
  const ant = p.pos, mov = ant ? Math.hypot(x - ant.x, y - ant.y) : 0;
  let dir = mov > 0.4 ? Math.atan2(y - ant.y, x - ant.x) : ant ? ant.a : Math.atan2(a.ty, a.tx);
  if (ant && mov > 0.4) { const d = Math.atan2(Math.sin(dir - ant.a), Math.cos(dir - ant.a)); dir = ant.a + d * 0.6; } // suaviza
  p.pos = { x, y, z, a: dir, v: p.ia.v, prog, at: Date.now() };
  return i;
}
// ---------- o pit stop (regras de F1) ----------
// Passando pela linha de entrada do corredor, o robô entra se está na volta da parada da estratégia, ou antes dela se o
// pneu já passou do penhasco (e nunca na última volta, que passa pela chegada dentro do corredor).
function entrarNoBox(room, p, ia, pf) {
  const cor = pf.corredor, prox = ia.plano && ia.plano.paradas[(p.paradas || []).length];
  if (!cor || !prox || !p.started || p.laps + 1 >= room.config.voltas) return;
  const gasto = ia.pneu && ia.pneu.desgaste > F1.PENHASCO * 0.95;
  if (p.laps + 1 < prox.volta && !gasto && !room.direcao?.safety) return;
  const rel = (Math.floor(ia.s) - cor.i0 + pf.n) % pf.n;
  if (rel > 5) { // ainda não chegou: nos últimos 2 s antes da entrada já é fantasma (ninguém bate em quem está entrando)
    if ((pf.n - rel) * STEP < Math.max(ia.v, 60) * Contato.BOX_FANTASMA_MS / 1000) p.boxFant = Math.max(p.boxFant || 0, Date.now() + 250);
    return;
  }
  const n = (p.paradas || []).length + 1;
  ia.box = { fase: "entra", u: rel + (ia.s - Math.floor(ia.s)), lat0: ia.lat, garagem: F1.garagemDe(cor, p.grid, p.equipe), parada: F1.paradaComBonus(F1.tempoDeParada(room.semente, p.id, n), p.bonusBox), composto: prox.composto, volta: p.laps + 1, tempo: 0, t: 0 };
  p.box = ia.box;
}
// um passo dentro do corredor: freia até o limitador, para na garagem, espera a parada e sai no limitador
function passoNoBox(room, p, ia, pf, dt, emit) {
  const b = ia.box, cor = pf.corredor, c = pf.c, vlim = F1.LIMITADOR * c.vmax;
  b.tempo += dt;
  const vai = (alvo) => { ia.v = ia.v > alvo ? Math.max(alvo, ia.v - c.brake * dt) : Math.min(alvo, ia.v + c.acc * dt); };
  if (b.fase === "entra") {
    const falta = Math.max(0, b.garagem - b.u) * STEP;
    vai(Math.min(vlim, Math.sqrt(2 * c.brake * 0.6 * falta)));
    b.u = Math.min(b.garagem, b.u + (ia.v * dt) / STEP);
    if (b.u >= b.garagem - 0.02) { b.u = b.garagem; ia.v = 0; b.fase = "parada"; b.t = 0; }
  } else if (b.fase === "parada") {
    ia.v = 0; b.t += dt;
    if (b.t >= b.parada) { b.fase = "sai"; ia.pneu = F1.pneuNovo(b.composto); }
  } else {
    vai(vlim); b.u += (ia.v * dt) / STEP;
    if (b.u >= cor.len) { b.u = cor.len; ia.box = null; p.box = null; p.boxFant = Date.now() + Contato.BOX_FANTASMA_MS; emit("box", { id: p.id, composto: b.composto, tempo: b.tempo, volta: b.volta }); }
  }
    ia.s = (cor.i0 + b.u) % pf.n; ia.lat = cor.latParada(b.u, b.garagem, b.lat0);
}
// (2026-11-16, o Thiago: "decisões que impactam relacionamentos") O companheiro de quem joga na carreira corre pela relação (regras.js
// pilotosNoGrid, `relacao`): PARCEIRO, logo à frente e com você colado (menos de ~35 m), tira o pé por 4 s para você passar (uma vez por volta);
// logo atrás de você com outro carro colado nele, ele segura (a defesa do perfil já é dele) e o rádio avisa. TENSO, à frente e com você colado,
// não abre: o rádio diz que ele recusou a ordem. Nada disso na largada, sob safety car ou depois da bandeirada.
const PERTO_EQUIPE = 30;
// (2026-11-16, as estratégias de bateria do Thiago) lift and coast: abaixo de LIFT_CARGA, a LIFT_PONTOS pontos de uma freada forte; o bônus de
// ultrapassagem: cruzou a linha a menos de 1 s do carro da frente, +BONUS_ULTRAPASSAGEM de bateria (0,5 MJ da janela de 4 MJ) na volta seguinte
const LIFT_CARGA = 0.25, LIFT_PONTOS = 20, BONUS_ULTRAPASSAGEM = 0.125;
function bonusDeUltrapassagem(room, p, ia, car) {
  if (!car.ers || ia.bonusVolta === p.laps) return; ia.bonusVolta = p.laps;
  let frente = Infinity; for (const o of Object.values(room.players)) { if (o === p || !o.pos || o.finish != null || o.dnf) continue; const d = o.pos.prog - car.prog; if (d > 0 && d < frente) frente = d; }
  if (frente * STEP / Math.max(car.v, 1) < 1) car.ers.carga = Math.min(1, car.ers.carga + BONUS_ULTRAPASSAGEM);
}
// (2026-11-24, o Thiago: "algo assim para as corridas") o momento da corrida, por cima do plano do domingo: o robô muda de modo pela situação.
//   "ataque": nas últimas voltas, na volta de saída do box (o undercut) e a menos de MOM_ATAQUE_S do carro da frente, por até MOM_ATAQUE_VOLTAS
//     voltas; o carro anda como no plano "arriscar" (PLANOS_DOMINGO) e o ERS vai nas retas com a bateria acima do mínimo para atacar;
//   "gerir": em ar limpo (ninguém a MOM_LIVRE_S na frente nem atrás) ou na volta depois de um ataque que não deu certo: o plano "seguro",
//     MOM_GERIR do ritmo nas curvas, sem ERS (só para defender) e lift and coast em toda freada, para juntar bateria e pneu para o próximo ataque.
// O plano "arriscar" do domingo nunca gere; o "seguro" e o "pneu" gerem já com MOM_LIVRE_S - 1. Safety car e bandeiras: o normal.
const MOM_ATAQUE_S = 1.5, MOM_LIVRE_S = 3, MOM_ATAQUE_VOLTAS = 3, MOM_GERIR = 0.985;
function momentoDaCorrida(room, p, ia, car, tf) {
  const m = ia.mom || (ia.mom = { modo: "normal", paradas: 0, saidaAte: -1, ataqueDesde: null, folgaAte: -1 });
  if (room.phase !== "race" || room.direcao?.safety || p.finish != null) { m.modo = "normal"; return m; }
  const voltas = room.config.voltas, feitas = p.laps || 0, paradas = (p.paradas || []).length, v = Math.max(car.v, 30);
  const gapF = (tf.atras ?? Infinity) / v, gapT = tf.tras ? tf.tras.gap / v : Infinity, livre = p.plano === "seguro" || p.plano === "pneu" ? MOM_LIVRE_S - 1 : MOM_LIVRE_S;
  if (paradas !== m.paradas) { m.paradas = paradas; m.saidaAte = feitas + 1; }
  let modo = "normal";
  if (feitas >= voltas - Math.min(3, Math.floor(voltas / 4))) modo = "ataque";
  else if (feitas <= m.saidaAte) modo = "ataque";
  else if (feitas <= m.folgaAte) modo = "gerir";
  else if (gapF < MOM_ATAQUE_S) {
    if (m.ataqueDesde == null) m.ataqueDesde = feitas;
    if (feitas - m.ataqueDesde >= MOM_ATAQUE_VOLTAS) { m.folgaAte = feitas + 1; m.ataqueDesde = null; modo = "gerir"; } else modo = "ataque";
  } else { m.ataqueDesde = null; if (gapF > livre && gapT > livre) modo = "gerir"; }
  if (modo === "gerir" && p.plano === "arriscar") modo = "normal";
  m.modo = modo; m.gapF = gapF;
  return m;
}
// (2026-11-24, o Thiago: "hoje a segunda volta deles sempre é a melhor") o plano de cada robô na sessão do qualify, sorteado pela semente a cada Q:
//   "sempre": ataca toda volta, com o ERS automático (como era);
//   "ja": ataca já a primeira volta com a bateria cheia, volta lenta para recarregar, ataca de novo;
//   "tarde": a primeira volta é de preparação (devagar, recarregando), ataca na segunda e na quarta;
//   "box": volta de preparação, entra no box no fim dela (pneu novo), volta de saída e só então ataca.
// Na volta de ataque o ERS vai todo nas retas (o modo manual); na lenta, nada de ERS, lift and coast em toda freada e QUALI_LENTO do ritmo.
// Se a volta lenta não deixa tempo para mais uma volta antes da bandeira, ataca nela (a última chance de todos, como na F1).
// A volta conta pela própria classificação (p.qVoltas): no qualify o p.laps não sobe, e o teto de recarga do ERS (por volta) e o sorteio do ritmo
// da volta ficavam iguais na sessão inteira: a bateria secava depois da segunda volta, e era ela que sempre saía melhor.
const QUALI_LENTO = 0.9, QUALI_BOX_MS = 25000, PLANOS_QUALI = [["sempre", 0.25], ["ja", 0.3], ["tarde", 0.25], ["box", 0.2]];
const voltaDaQuali = (p) => (p.qVoltas || 0) + (p.qIni != null ? 1 : 0); // 0: a volta de saída (do grid, mais uma volta: aoSetor); 1: a primeira cronometrada
function planoDaQuali(room, p, ia, pf, now) {
  const q = room.quali, k = voltaDaQuali(p);
  let qp = ia.qPlano;
  if (!qp || qp.sessao !== q.startAt) {
    let r = F1.sorteio(`quali-plano:${room.semente}:${q.i}:${p.id}`)(), jeito = "sempre";
    for (const [nome, peso] of PLANOS_QUALI) { if (r < peso) { jeito = nome; break; } r -= peso; }
    qp = ia.qPlano = { sessao: q.startAt, jeito, k: -1, modo: "lento", box: false };
  }
  if (qp.k === k) return qp;
  qp.k = k; qp.box = false;
  const tVolta = (p.qMelhor || tempoDaVolta(pf, ia.nivel || 1)) * 1000, resta = q.fimAt - now;
  if (qp.jeito === "box" && k === 1 && resta < tVolta * 2.2 + QUALI_BOX_MS) qp.jeito = "tarde"; // não dá tempo da parada e da volta de saída: só prepara uma volta
  const j = qp.jeito;
  qp.modo = k === 0 ? "lento" : j === "sempre" ? "normal" : j === "ja" ? (k % 2 ? "ataque" : "lento") : j === "tarde" ? (k % 2 ? "lento" : "ataque") : (k <= 2 ? "lento" : "ataque");
  if (j === "box" && k === 1) qp.box = true;
  if (k > 0 && qp.modo === "lento" && resta > 0 && resta < tVolta * 1.15) { qp.modo = "ataque"; qp.box = false; } // a bandeira chega antes de outra volta
  return qp;
}
// a margem de cada piloto no limite de aderência das curvas: MARGEM_BASE para todos, mais MARGEM_POR_PONTO por ponto de constância abaixo de 95
const MARGEM_BASE = +(process.env.ROBO_MARGEM_BASE ?? 0.006), MARGEM_POR_PONTO = +(process.env.ROBO_MARGEM_PONTO ?? 0.0004); // pontos de pista (6 u cada, ~37 m)
function companheiroNaPista(room, p, ia, now, emit) {
  const rel = p.piloto && p.piloto.relacao; if (!rel || room.phase !== "race" || now < room.startAt + 15000 || room.direcao?.safety || !p.pos) return;
  const h = Object.values(room.players).find((q) => !q.bot && q.equipe === p.equipe); if (!h || !h.pos || h.finish != null || h.dnf || p.finish != null) return;
  const d = p.pos.prog - h.pos.prog, avisar = (sit) => emit && emit("radio:equipe", { para: h.id, sit });
  if (d > 0 && d < PERTO_EQUIPE) {
    if (rel === "parceiro" && ia.cedeuVolta !== p.laps) { ia.cedeuVolta = p.laps; ia.cedendoAte = now + 4000; avisar("compabre"); }
    else if (rel === "tenso" && !ia.recusou) { ia.recusou = true; avisar("compbriga"); }
  } else if (rel === "parceiro" && d < 0 && d > -PERTO_EQUIPE && !ia.segurouDito) {
    const atras = Object.values(room.players).some((o) => o !== p && o !== h && o.pos && !o.finish && p.pos.prog - o.pos.prog > 0 && p.pos.prog - o.pos.prog < PERTO_EQUIPE);
    if (atras) { ia.segurouDito = true; avisar("compsegura"); }
  }
}
// (2026-11-16, a rivalidade) O rival da temporada (regras.js pilotosNoGrid, `rival` e `rixa`) perto de você (a menos de ~37 m, nos dois
// sentidos) aperta o ritmo: +1,2% no alvo de velocidade, mais 0,4% por batida entre vocês nos GPs de antes (até 3). O rádio acompanha o duelo:
// colado atrás de você ou logo à frente (no máximo uma vez a cada 3 voltas) e quando um passa o outro (a troca de lado, com 8 s de folga).
function rivalNaPista(room, p, ia, now, emit) {
  if (!p.piloto || !p.piloto.rival || room.phase !== "race" || now < room.startAt + 15000 || room.direcao?.safety || !p.pos || p.finish != null) return false;
  const h = Object.values(room.players).find((q) => !q.bot && q.pos && q.finish == null && !q.dnf); if (!h) return false;
  const d = p.pos.prog - h.pos.prog, avisar = (sit) => emit && emit("radio:equipe", { para: h.id, sit });
  const perto = Math.abs(d) < PERTO_EQUIPE, lado = d > 0 ? 1 : -1, volta = h.laps || 0;
  if (perto && ia.ladoRival && lado !== ia.ladoRival && now - (ia.trocaRival || 0) > 8000) { ia.trocaRival = now; avisar(lado < 0 ? "rivalpassou" : "rivalperdeu"); }
  else if (perto && volta - (ia.voltaRival ?? -9) >= 3) { ia.voltaRival = volta; avisar(lado < 0 ? "rivalatras" : "rivalfrente"); }
  if (Math.abs(d) < PERTO_EQUIPE * 2) ia.ladoRival = lado;
  return perto;
}
// O robô está preso? Parado (menos de V_PRESO) por T_PRESO segundos, ou sem andar nem T_SEM_ANDAR pontos de pista em 6 s (rodando no
// lugar, de lado no muro, na brita). Não conta no box, sob bandeira, antes de a corrida ficar de pé nem com o carro quebrado.
function encalhou(room, ia, car, now, dt, atras = false) {
  // esperando atrás de um carro à frente na própria faixa (parado ou lento) não é estar preso: é trânsito
  if (car.box?.fase || room.direcao?.safety || car.air || atras) { ia.parado = 0; ia.refProg = car.prog; ia.refT = now; return false; }
  ia.parado = Math.abs(car.v) < V_PRESO ? (ia.parado || 0) + dt : 0;
  if (ia.refT == null || now - ia.refT > 6000) {
    const andou = ia.refT == null ? Infinity : car.prog - ia.refProg;
    ia.refProg = car.prog; ia.refT = now;
    if (andou < T_SEM_ANDAR) { ia.parado = 0; return true; }
  }
  if (ia.parado > T_PRESO) { ia.parado = 0; return true; }
  return false;
}
// Depois da bandeirada: fantasma (não bate e ninguém bate nele), no piloto automático da física a 70 u/s pela beira da pista. Antes ele
// ficava congelado onde cruzou a linha de chegada, e a galera que ainda corria dava de cara com um paredão de robôs parados.
function passoFantasma(room, p, ia, pf, dt, now) {
  const tr = Sim.criarPista(T.PISTAS[room.config.pista], room.config.pista), car = ia.sim;
  if (!car) return;
  car.fant = true;
  const amb = ia.ambFant || (ia.ambFant = { spec: pf.c, f1: true, ersAuto: false, fantasma: true, safety: false, agua: 0, semente: room.semente, id: p.id, grid: p.grid });
  amb.finish = p.finish; amb.voltas = room.config.voltas; amb.laps = p.laps || 0; amb.paradas = (p.paradas || []).length; amb.dano = p.dano || 0;
  const ent = ia.ent || (ia.ent = {}), ev = [];
  for (let s = 0, passos = Math.round(dt / Sim.PASSO); s < passos; s++) {
    ev.length = 0;
    Sim.passo(car, ent, amb, tr, ev);
    Contato.depoisDoPasso(room, p, car, now - dt * 1000 + (s + 1) * Sim.PASSO * 1000, [], false); // (só guarda o histórico)
  }
  ia.s = car.idx; ia.v = car.v; ia.lat = Sim.quadro(tr, car.x, car.y, car.idx).lat; ia.box = null; p.box = null;
  p.pos = { x: car.x, y: car.y, z: car.z, a: car.a, v: car.v, vx: car.vx, vy: car.vy, r: car.r, prog: car.prog, at: room.relogioRobos ?? now };
}
function passoF1(room, p, ia, pf, dt, now, setor, emit, outros) {
  const tr = Sim.criarPista(T.PISTAS[room.config.pista], room.config.pista), car = ia.sim;
  const spec = pf.c, n = tr.n;
  // Também aceita ajustes explícitos de velocidade feitos pela sala e pelos testes.
  if (Math.abs(ia.v - car.v) > 0.01) car.v = ia.v;
  const i = car.idx, est = ia.estilo;
  ia.s = i; ia.lat = Sim.quadro(tr, car.x, car.y, i).lat;
  const saidaGrid = Math.min(1, ((car.prog - (car.gridIdx - n)) / 100));
  const precisao = T.baseDe(room.config.pista) === "monaco" ? 0.4 : 1; // a variação de estilo é menor onde há pouco espaço para corrigir
  // (o piloto novo segue a linha base: a variedade vem do perfil do piloto, sem desvio fixo nem senoide somados ao traçado)
  const jeitoP = pf.linha.hi ? (ia.jeitoPiloto || (ia.jeitoPiloto = Piloto.jeitoDe(Estilos.dePiloto(p.piloto)))) : null;
  const linhaEm = pf.linha.hi ? (k) => pf.lat[(k + 2) % n] + jeitoP.zebra * pf.linha.sinal[k % n] * Math.min(1, pf.kf[k % n] * 400) * precisao : (k, prog) => pf.lat[(k + 2) % n] * pf.fator + ia.jeito + Math.sin(prog / 105 + ia.tracadoId * 1.7) * 3 * precisao
    + est.dentro * pf.linha.sinal[k % n] * Math.min(1, pf.kf[k % n] * 400) * 7 * precisao;
  const linha = linhaEm(i, car.prog);
  const baseLat = ia.lat0 * (1 - saidaGrid) + linha * saidaGrid;
  const novo = !!pf.linha.hi; // a pista de GP com o piloto novo
  const maxLat = novo && !ia.ult ? Math.max(pf.linha.hi[i], -pf.linha.lo[i]) : Math.min(tr.W / 2 - (ia.ult && ia.ult.parado ? 8 : T.baseDe(room.config.pista) === "monaco" ? 9 : 18), pf.teto ? pf.teto[i] + (T.baseDe(room.config.pista) === "monaco" ? 8 : 0) : Infinity);
  const maxLatDisputa = T.baseDe(room.config.pista) === "monaco" ? Math.min(tr.W / 2 - 9, pf.teto ? pf.teto[i] + ALEM_MONACO : Infinity) : Math.min(tr.W / 2 - 10, pf.teto ? pf.teto[i] : Infinity);
  // Na disputa em Mônaco chega perto do muro, com 4 u além do limite físico; nas outras pistas a folga extra é só para carro parado.
  const maxLatLento = T.baseDe(room.config.pista) === "monaco" ? Math.min(tr.W / 2 - 9, pf.teto ? pf.teto[i] + ALEM_MONACO : Infinity) : maxLatDisputa + 10;
  const cl = F1.climaEm(room.clima, now); // a água na pista agora (clima: f1-regras.js)
  const pneu = F1.aderencia(car.pneu, cl.agua), dano = F1.efeitoDoDano(p.dano), curva = pf.kf[i] > 1 / 600;
  if (ia.nivel == null) { if (!room.referenciaF1) ritmoDosRobos(room); ia.nivel = nivelDe(room, p, ia.tracadoId, 0, pf); } // (ainda não aquecido: aquecerNiveis)
  const fis = perfilF1(pf, ia.nivel), topo = topoDe(pf);
  const quali = room.phase === "quali" && !!room.quali, qp = quali ? planoDaQuali(room, p, ia, pf, now) : null, ritmoQ = qp && qp.modo === "lento" ? QUALI_LENTO : 1; // (o plano do qualify)
  // molhado (ou pneu gasto): o freio segura menos, então o robô olha mais longe para começar a frear a tempo (no seco com o macio: 1)
  // (a conta é a da física: o freio pedido e o que o pneu segura antes de travar, `D.frenagemMaxima`, contra o do pneu de referência)
  // A cautela do pneu na água (2026-11-13, o Thiago viu robôs derrapando na chuva): o quanto a água tira deste composto agora
  // (F1.fatorAgua: o seco na pista molhada perde muito, o de chuva e o intermediário quase nada). Quanto mais perde, mais cedo freia e
  // mais devagar contorna, além do que a aderência já tira; com o pneu certo para a condição sobra só uma margem pequena.
  const perdaAgua = cl.agua > 0 ? Math.max(0, Math.min(0.7, 1 - F1.fatorAgua(car.pneu && car.pneu.composto, cl.agua))) : 0;
  const cautelaPneu = 1 - 0.04 * cl.agua - 0.25 * perdaAgua;
  const velFreio = Math.max(car.v, 60), ref = aderRef();
  const alongaFreio = Math.max(1, Math.min(2.2, D.frenagemMaxima(spec, velFreio, 0, { freio: ref.freio, grip: ref.grip }) / Math.max(1, D.frenagemMaxima(spec, velFreio, 0, { freio: pneu.freio * dano.freio, grip: pneu.grip * dano.grip })))) * (1 + 0.3 * perdaAgua);
  const perfilPiloto = Estilos.dePiloto(p.piloto);
  const ajusteFreada = 1 + Math.max(0, 0.8 - perfilPiloto.frenagem) * (T.baseDe(room.config.pista) === "monaco" ? 0.06 : 0.14);
  const olhar = Math.max(3, Math.ceil(Math.max(car.v, 30) * (T.baseDe(room.config.pista) === "monaco" ? 0.20 : tr.W <= LARGURA_ESTREITA ? 0.27 : 0.20) * alongaFreio * ajusteFreada / STEP)); // o perfil já antecipa a frenagem; circuitos estreitos pedem mais folga
  let alvo = Infinity;
  for (let k = 0; k <= olhar; k++) alvo = Math.min(alvo, fis[(i + k) % n]);
  // Mirabeau e o grampo de Mônaco exigem mais margem na chuva, inclusive na aproximação.
  const f = i / n, margemMolhada = T.baseDe(room.config.pista) === "monaco" ? Math.max(0, Math.min(1, (f - 0.29) / 0.03, (0.44 - f) / 0.02)) : 0;
  const cautela = 1 - 0.20 * cl.agua * margemMolhada;
  const vLivre = Math.min(spec.vmax * pneu.final * dano.final, alvo < topo * 0.97 ? alvo * Math.sqrt((novo ? pneu.rel : pneu.grip) * dano.grip) * cautela : alvo); // a velocidade do robô sem ninguém na frente
  // Colado, o limite de trânsito não deixa o DRS virar velocidade: para decidir o ataque conta metade do ganho que ele teria ao sair da faixa (a velocidade leva tempo para chegar).
  const drsPronto = alvo >= topo * 0.97 && (car.drsAtivo || (p.drsZona >= 0 && p.drsZona === F1.zonaDRS(i / n, tr.t.drs)));
  const vAtaque = Math.min(spec.vmax * pneu.final * dano.final * F1.TETO_VELOCIDADE, vLivre * (drsPronto ? 1 + F1.DRS_GANHO * (spec.drs ?? 1) * 0.5 : 1));
  // o plano da frente para o trânsito: a que distância é a próxima freada e qual é o lado de dentro da próxima curva
  const tf = transito(room, p, ia, pf, i, baseLat, maxLatDisputa, vAtaque, { dFreio: distanciaDaFreada(fis, n, i, car.v), dentro: ladoDeDentro(pf, i), maxLatLento, linhaEm: (k) => linhaEm(k, car.prog + (k - i + n) % n), aderenciaFreio: cl.agua > 0 ? { freio: pneu.freio * dano.freio, grip: pneu.grip * dano.grip } : undefined });
  ia.desvio += (tf.desvio - ia.desvio) * Math.min(1, dt * 1.8);
  ia.colado = (tf.atras ?? Infinity) < TransitoRobo.L_CARRO * 2.2; ia.arLimpo = !tf.encontrou; // (para o undercut e o overcut, em decidirParada)
  const mom = momentoDaCorrida(room, p, ia, car, tf), gerindo = mom.modo === "gerir", atacando = mom.modo === "ataque"; // (o momento da corrida)
  // a folga lateral de quem está ao lado: o robô fica entre os limites (e se está mais perto que a folga, se afasta)
  const limiteAtual = ia.ult?.lento && (T.baseDe(room.config.pista) === "monaco" || ia.ult.parado) ? maxLatLento : ia.ult ? maxLatDisputa : maxLat;
  const entre = (l, limite) => { let lo = Math.max(-limite, tf.limMin), hi = Math.min(limite, tf.limMax); if (lo > hi) lo = hi = Math.max(-limite, Math.min(limite, (lo + hi) / 2)); l = Math.max(lo, Math.min(hi, l)); if (tf.bloqPos) l = Math.min(l, Math.max(ia.lat, lo)); if (tf.bloqNeg) l = Math.max(l, Math.min(ia.lat, hi)); return l; };
  // o ponto que o volante mira, lá na frente, está sobre a linha DALI (não sobre o lado em que o carro está agora): é o que faz o
  // robô entrar na curva a tempo em vez de cortar por dentro
  // (em Mônaco, na disputa, o limite é o de cada ponto adiante, não o do meu)
  const latLivre = (j) => { const q = ((j % n) + n) % n, l = entre(linhaEm(q, car.prog + (q - i + n) % n) * saidaGrid + ia.lat0 * (1 - saidaGrid) + ia.desvio, Math.max(pf.linha.hi[q], -pf.linha.lo[q])); return ia.ult ? l : Math.max(pf.linha.lo[q], Math.min(pf.linha.hi[q], l)); };
  const latAdiante = novo && !ia.ult ? latLivre : (j) => { const margemExtra = T.baseDe(room.config.pista) === "monaco" ? (ia.ult ? ALEM_MONACO : 8) : 0; const limite = Math.min(margemExtra ? tr.W / 2 - 9 : limiteAtual, pf.teto ? pf.teto[j] + margemExtra : Infinity); return entre(linhaEm(j, car.prog + (j - i + n) % n) * saidaGrid + ia.lat0 * (1 - saidaGrid) + ia.desvio, limite); };
  const vac = F1.vacuoF1(F1.vacuoPermitido(car.v, room.phase === "quali") ? tf.draft : 0, curva);
  const reta = alvo >= topo * 0.97;
  // (2026-11-16, o Thiago: "cada piloto ter sua margem pra não derrapar, exceto caso de erro") o piloto mais constante deixa menos sobra (o erro, erroK, vem por cima)
  const margemPiloto = 1 - (MARGEM_BASE + Math.max(0, 95 - (p.piloto ? p.piloto.constancia : 85)) * MARGEM_POR_PONTO);
  const escalaCurva = Math.sqrt((novo ? pneu.rel : pneu.grip) * dano.grip * vac.aderencia) * cautelaPneu * cautela * margemPiloto;
  if (!reta) alvo *= escalaCurva;
  const drs = !!car.drsAtivo && !room.direcao?.safety && !room.direcao?.amarelo;
  const ganhoReta = (1 + (drs ? F1.DRS_GANHO * (spec.drs ?? 1) : 0)) * (1 + vac.final);
  if (reta) alvo *= ganhoReta;
  if (gerindo && !reta) alvo *= MOM_GERIR;
  alvo = Math.min(alvo, spec.vmax * pneu.final * dano.final * (reta ? ganhoReta : 1));
  // Enquanto há pista livre ao lado, o ERS ajuda a passar. Se a porta fecha, o limite de tráfego manda frear.
  // (o próprio carro que estou passando ao meu lado não tira o empurrão: era justamente aí, lado a lado, que ele sumia e a disputa morria em 7 s)
  if (ia.ult && (!(tf.bloqPos || tf.bloqNeg) || !tf.ladoDeOutro)) alvo = Math.min(spec.vmax * (reta ? ganhoReta : 1), alvo * (T.baseDe(room.config.pista) === "monaco" ? 1.06 : 1.04));
  // dividir a pista (Mônaco): quem está sendo atacado por um carro já emparelhado (o bico dele passou da minha traseira) não briga com ele no
  // acelerador: mantém a linha e cede um pouco de ritmo, como o piloto que aceita a disputa lado a lado em vez de jogar o outro no muro
  if (T.baseDe(room.config.pista) === "monaco") for (const oid of room.order) { const q = room.players[oid]; if (!q || q === p || !q.ia || !q.ia.ult || q.ia.ult.id !== p.id || !q.pos || !p.pos) continue;
    const d = Math.hypot(q.pos.x - p.pos.x, q.pos.y - p.pos.y); if (d < TransitoRobo.L_CARRO * 1.1) { alvo *= 0.96; break; } }
  alvo = Math.min(alvo * ritmoQ, tf.freio);
  let tetoPiloto = tf.freio; // o que manda acima do ritmo da linha: o trânsito, a batida, a quebra
  // a batida abala o robô como a quem joga: a física já tira a aderência (car.inst, por 0,2 a 2 s); aqui ele também perde o ritmo (tira
  // o pé e dirige com mais cuidado) por mais um tempo, mais nos níveis fáceis e menos nos difíceis
  const ins = car.inst > 0 ? car.inst : 0;
  if (ins > (ia.susto || 0)) ia.vSusto = Math.max(car.v, 60); // a velocidade em que levou a pancada: o ritmo cai a partir dela e volta aos poucos
  ia.susto = Math.max(ins, (ia.susto || 0) - dt * 0.35);
  const medo = ia.susto * porNivel({ facil: 1.2, medio: 1, dificil: 1 }, room.config.nivel);
  if (medo > 0.01) { alvo = Math.min(alvo * (1 - 0.4 * Math.min(1, medo)), ia.vSusto * (1 - 0.4 * Math.min(1, medo))); tetoPiloto = Math.min(tetoPiloto, ia.vSusto * (1 - 0.4 * Math.min(1, medo))); }
  if (p.quebrou) { alvo = Math.min(alvo, spec.vmax * F1Equipes.EMERGENCIA); tetoPiloto = Math.min(tetoPiloto, spec.vmax * F1Equipes.EMERGENCIA); }
  if (p.incidenteAte > now) { alvo = Math.min(alvo, spec.vmax * 0.24); tetoPiloto = Math.min(tetoPiloto, spec.vmax * 0.24); }
  companheiroNaPista(room, p, ia, now, emit);
  if (rivalNaPista(room, p, ia, now, emit)) { const k = 1.012 + 0.004 * Math.min(3, p.piloto.rixa || 0); alvo *= k; } // o rival aperta o ritmo perto de você (mais com rixa)
  if (ia.cedendoAte > now) { alvo *= 0.9; tetoPiloto = Math.min(tetoPiloto, spec.vmax * 0.85); } // abrindo passagem para quem joga: tira o pé por uns segundos
  const relBox = tr.corredor ? (i - tr.corredor.i0 + n) % n : Infinity;
  // (só pesa a parada perto da entrada do corredor; nos 2 s antes de entrar o robô que vai parar já é fantasma: ninguém bate nele)
  const aEntrar = tr.corredor ? (n - relBox) % n : Infinity, antesDaEntrada = aEntrar * STEP < Math.max(car.v, 60) * Contato.BOX_FANTASMA_MS / 1000;
  let proxima = quali ? null : relBox <= 8 || antesDaEntrada ? decidirParada(room, p, ia, car, spec, cl) : null;
  // o plano "box" do qualify: no fim da volta de preparação (passada a metade dela, para não parar logo depois da linha) pede o mesmo composto, novo
  if (quali && qp.box && !car.box?.fase && (relBox <= 8 || antesDaEntrada) && p.qIni != null && now - p.qIni > (p.qMelhor || tempoDaVolta(pf, ia.nivel || 1)) * 500) proxima = car.pneu ? car.pneu.composto : p.pneuAtual || "macio";
  // stop-and-go pendente: o robô cumpre na primeira passagem pelo box (a visita é só ele, sem trocar o pneu: amb.stopGo)
  const stopGo = p.stopGo && F1.stopGoCabe(p.laps, room.config.voltas) ? p.stopGo.s : 0;
  if (!proxima && stopGo && (relBox <= 8 || antesDaEntrada)) proxima = car.pneu ? car.pneu.composto : p.pneuAtual || "medio"; // (se já ia trocar o pneu nesta passagem, o stop-and-go vem junto e depois a troca)
  if (proxima && antesDaEntrada && !car.box?.fase) p.boxFant = Math.max(p.boxFant || 0, now + 250);
  const estavaNoBox = !!p.box;
  const pedirBox = !!proxima; // (o composto pedido)
  const amb = { spec, dano: p.dano || 0, drsZona: p.drsZona ?? -1, safety: !!room.direcao?.safety, gpMods: reforcoDoNivel(room), plano: room.phase === "race" ? p.plano || null : null, // (o nível acima de 100: o carro a mais; o plano do domingo do robô, na carreira)
    // Em pista livre usa a bateria nas retas; no trânsito reserva energia e só aciona forte ao tentar passar.
    amarela: room.direcao?.amarelo?.setor === Math.floor(i / (n / T.SECTORS)), ersAuto: qp && qp.modo !== "normal" ? false : !ia.ult && !tf.encontrou && !tf.tras && now - room.startAt > 6000, quali, // (no plano do qualify o ERS é pelo comando, logo abaixo)
    voltas: room.config.voltas, laps: quali ? voltaDaQuali(p) : p.laps || 0, paradas: (p.paradas || []).length,
    semente: room.semente, id: p.id, grid: p.grid, equipe: p.equipe || null, f1: true, agua: cl.agua, outros, stopGo,
    boxOcupado: Sim.garagemOcupada(Object.values(room.players), p, (o) => Sim.faseDoBox((o.sim ? o.sim.c : o.ia && o.ia.sim)?.box)), // a fila do box da equipe
    fatorDesgastePneu: Estilos.parametros(room, p, TRANSITO_NIVEL.medio).desgaste };
  const ent = ia.ent || (ia.ent = {});
  if (mom.modo !== "normal") { amb.plano = gerindo ? "seguro" : "arriscar"; if (gerindo) amb.ersAuto = false; } // (o momento manda no plano do domingo enquanto dura)
  const ev = [], evC = [];
  // o ritmo varia de volta para volta (consistência), e de vez em quando o piloto erra a freada e entra forte demais na curva (taxa de erro)
  let ritmoDaVolta = 1, erroK = 1;
  if (novo) {
    const volta = quali ? `q${room.quali.i}:${voltaDaQuali(p)}` : p.laps || 0; // (no qualify, cada volta cronometrada sorteia o seu ritmo)
    if (ia.voltaRitmo !== volta) { const r = F1.sorteio(`ritmo:${room.semente}:${p.id}:${volta}`); ia.voltaRitmo = volta; ia.ritmoDaVolta = 1 - r() * jeitoP.sigma; if (!quali && volta > 0) bonusDeUltrapassagem(room, p, ia, car); }
    ritmoDaVolta = ia.ritmoDaVolta;
    if (ia.erroAte > now) erroK = ia.erroK;
    else if (!tf.encontrou && !amb.safety && !amb.amarela && alvo < car.v * 0.9 && Math.random() < (jeitoP.erro * Math.max(0.3, porNivel({ facil: 1.4, medio: 1, dificil: DIFICIL_ANTIGO ? 0.7 : 0.85, lendario: 0.65 }, room.config.nivel))) / 400) { ia.erroAte = now + 700; ia.erroK = erroK = 1.05 + Math.random() * 0.05; }
  }
  if (encalhou(room, ia, car, now, dt, tf.atras < 140)) { // preso (parado, rodado, de lado no muro ou sem andar): o "↺ Pista" do robô, do lado livre
    Sim.voltarParaPista(car, tr, ev);
    const q = tr.pts[car.idx], lado = tf.bloqPos && !tf.bloqNeg ? -1 : tf.bloqNeg && !tf.bloqPos ? 1 : 0, lat = lado * Math.min(maxLat, 40);
    car.x += q.nx * lat; car.y += q.ny * lat; car.sp = { x: car.x, y: car.y };
    ia.desvio = 0; ia.ult = null; ia.erro = null; ia.recuperacoes = (ia.recuperacoes || 0) + 1;
    // (2026-11-16, o Thiago: o robô travava, voltava e quem vinha atrás batia nele e levava a batida) recolocado, fica fantasma por 2 s, como
    // o parado de corrida-parados.js: sem colisão nos dois sentidos enquanto ganha velocidade
    p.fantAte = Math.max(p.fantAte || 0, Date.now() + 2000); room.fantMudou = true;
  }
  if (gerindo) ritmoDaVolta *= MOM_GERIR;
  for (let s = 0, passos = Math.round(dt / Sim.PASSO); s < passos; s++) {
    ev.length = 0;
    // o volante e os pedais são calculados a cada passo da física (120 Hz), como quem joga: o robô sente o carro escorregar
    // Em pista seca e livre, olha mais adiante no S e alivia o acelerador antes de frear. Tráfego,
    // bandeiras, dano e pneu gasto conservam a pilotagem normal; acima do limite volta a frear.
    const chicaneMonaco = T.baseDe(room.config.pista) === "monaco" && !tr.t.muros && ((f > 0.625 && f < 0.655) || (f > 0.805 && f < 0.835));
    const chicaneLivre = chicaneMonaco && !tf.encontrou && !amb.safety && !amb.amarela && !p.azul && !cl.agua &&
      (car.pneu?.desgaste || 0) < 0.5 && (p.dano || 0) < 10 && !car.inst;
    if (novo) {
      const ctx = pf.ctxPiloto || (pf.ctxPiloto = Piloto.contexto(spec, aderRef()));
      ctx.teto = tetoPiloto;
      const ataque = ia.ult && (!(tf.bloqPos || tf.bloqNeg) || !tf.ladoDeOutro) ? 1.04 : 1, medoK = medo > 0.01 ? 1 - 0.4 * Math.min(1, medo) : 1, tetoReta = spec.vmax * pneu.final * dano.final * ganhoReta * ritmoQ;
      const noPiloto = jeitoP.entradaK * ritmoDaVolta * erroK * ritmoQ; // o jeito do piloto, o ritmo desta volta e o erro de agora
      Piloto.comandos(car, tr, spec, latAdiante, (j) => { const v = fis[j]; return Math.min(tetoReta, (v >= topo * 0.97 ? tetoReta : v * escalaCurva * ataque * noPiloto) * medoK); }, ent, ctx, jeitoP);
      if (ent.gas && car.patina > PAT) ent.gas *= 0.6; // a traseira já está no limite: alivia o pé em vez de cortar
      // (2026-11-16, "lift and coast") com pouca bateria e sem disputa, tira o pé ~0,6 s antes da freada (a velocidade do traçado ~LIFT_PONTOS pontos à
      // frente bem abaixo da de agora): o carro rola e o MGU-K recarrega (F1 carregarErs, semGas), sem gastar freio
      // (2026-11-16, o Thiago: "ultrapassar sem ficar esperando atrás do jogador" e "andar só no embalo do carro") seguindo alguém sem os ERS_MANOBRA de
      // bateria para atacar, ele também tira o pé antes da freada: recarrega mais rápido, junta a bateria e parte para a manobra em vez de ficar atrás
      const querCarga = ritmoQ < 1 || (qp && qp.modo === "ataque" ? false : !tf.encontrou ? car.ers && car.ers.carga < LIFT_CARGA : !process.env.ROBO_SEM_EMBALO && car.ers && car.ers.carga < minimoParaAtacar(p));
      if (querCarga && !ia.ult && !amb.safety && ent.gas > 0 && !ent.brake && fis[(i + LIFT_PONTOS) % n] < car.v * 0.8) ent.gas = 0;
      else if (gerindo && !ia.ult && ent.gas > 0 && !ent.brake && fis[(i + LIFT_PONTOS) % n] < car.v * 0.8) ent.gas = 0; // gerindo: lift and coast em toda freada
    } else {
    Sim.pilotoAutomatico(car, tr, spec, alvo, latAdiante, ent, chicaneLivre ? 1.15 : 1);
    if (chicaneLivre && car.v < alvo * 1.20) ent.brake = 0;
    // Em ar limpo, uma pequena sobra de velocidade pode ser corrigida tirando o pé.
    if (T.baseDe(room.config.pista) === "monaco" && !tf.encontrou && !amb.safety && !amb.amarela && !cl.agua && car.v <= alvo * 1.10) ent.brake = 0;
    if (ent.gas && (car.patina > PAT || Math.abs(car.alR) > ALFA_TRACAO)) ent.gas = 0; // a traseira já está no limite: tira o pé em vez de rodar
    }
    const exc = Math.abs(car.alF) - ALFA_FRENTE; // a frente já passou do pico do pneu (anda de frente): mais volante só piora, alivia até ela voltar a pegar
    if (exc > 0 && car.alF * ent.steer < 0) ent.steer *= Math.max(0, 1 - exc * K_FRENTE);
    if (medo > 0.01) ent.steer = (ia.volante || 0) + (ent.steer - (ia.volante || 0)) * (1 - 0.85 * Math.min(1, medo)); // com o carro abalado o volante vai mais devagar
    ia.volante = ent.steer;
    if (ent.brake && car.travada > TRAVA_ABS) ent.brake = novo ? ent.brake * 0.6 : 0; // a roda da frente travou: alivia o freio um instante (o ABS de quem sabe frear)
    // a bateria como na F1: na manobra; para CRIAR a diferença de velocidade, numa reta, perto do carro da frente; e para DEFENDER, numa reta, com
    // alguém colado atrás. Sempre guardando um pouco (ERS_ATAQUE e ERS_DEFESA: a carga mínima para gastar em cada caso)
    const cargaErs = car.ers ? car.ers.carga : 0, pertoDaFrente = tf.atras != null && tf.atras < TransitoRobo.L_CARRO * 3, coladoAtras = !!tf.tras && tf.tras.gap < TransitoRobo.L_CARRO * 2.5;
    // (2026-11-16, o Thiago: "eles nunca me ultrapassam, ficam travados atrás de mim") colado atrás e sem manobra, gastava a bateria em toda reta (até zerar) e
    // nunca juntava ERS_MANOBRA para partir para a ultrapassagem. Agora guarda até ter ERS_MANOBRA; na manobra (ia.ult) gasta até zerar.
    // (2026-11-21, o Thiago: "eles precisam ser capazes de não usar o ERS em curvas") só com o carro em reta (a curvatura do ponto de agora e a de ~2 carros
    // adiante abaixo de 1/1500, a mesma conta do ERS automático de sim.js). Medido em Suzuka, 21 robôs: com o ERS na curva, 274 batidas; só na reta, 74
    const kAqui = Math.max(Math.abs(tr.pts[car.idx].k || 0), Math.abs(tr.pts[(car.idx + 14) % n].k || 0)), retaAqui = kAqui < 1 / 1500;
    ent.ers = retaAqui && ((!!ia.ult && !ia.ult.emergencia) || (!amb.safety && reta && ((pertoDaFrente && cargaErs > (process.env.ROBO_PERSEGUE_ANTIGO ? ERS_ATAQUE : minimoParaAtacar(p)) && T.baseDe(room.config.pista) !== "monaco") || (coladoAtras && cargaErs > ERS_DEFESA))));
    if (qp && qp.modo !== "normal") ent.ers = qp.modo === "ataque" && retaAqui && cargaErs > F1.ERS_PISO_OVERTAKE; // o plano do qualify: tudo nas retas, ou nada na volta lenta
    ent.pedido = proxima;
    if (gerindo && !coladoAtras && !ia.ult) ent.ers = false; // gerindo: a bateria só para defender
    else if (atacando && retaAqui && !amb.safety && mom.gapF < MOM_ATAQUE_S && cargaErs > minimoParaAtacar(p) && T.baseDe(room.config.pista) !== "monaco") ent.ers = true; // atacando: o ERS a 1,5 s, não só colado
    Sim.passo(car, ent, amb, tr, ev);
    // a batida deste passo: a mesma dos humanos (corrida-contato.js), com os outros carros na hora do passo; o robô também troca momento
    evC.length = 0;
    Contato.depoisDoPasso(room, p, car, now - dt * 1000 + (s + 1) * Sim.PASSO * 1000, evC, room.phase !== "quali" && !amb.safety && p.finish == null && !p.dnf && !car.box?.fase);
    for (const e of evC) if (e.forca >= 5) emit("batida", { id: p.id, forca: e.forca, tipo: "carro", chave: "carro:" + e.id }); // (a direção de prova decide: abaixo da força mínima só vale se o outro derrapava)
    for (const e of ev) {
      if (e.t === "setor") setor(p, e.s);
      else if (e.t === "box" && e.fase === "sai") emit("box", { id: p.id, composto: e.composto, tempo: e.tempo, volta: e.volta, stopGo: !!e.stopGo, troca: !!e.troca, sg: e.sg, manter: !!e.manter });
      else if (e.t === "muro" && e.forca >= F1.BATIDA_MIN) emit("batida", { id: p.id, forca: e.forca, tipo: "muro" });
    }
    amb.laps = quali ? voltaDaQuali(p) : p.laps || 0;
    amb.paradas = (p.paradas || []).length;
  }
  ia.s = car.idx; ia.v = car.v; ia.lat = Sim.quadro(tr, car.x, car.y, car.idx).lat;
  ia.pneu = car.pneu; ia.ers = car.ers; ia.box = car.box?.fase ? car.box : null; p.box = ia.box;
  if (estavaNoBox && !p.box) p.boxFant = now + Contato.BOX_FANTASMA_MS; // saiu do corredor: mais 2 s de fantasma
  p.pos = { x: car.x, y: car.y, z: car.z, a: car.a, v: car.v, vx: car.vx, vy: car.vy, r: car.r, prog: car.prog, at: room.relogioRobos ?? now };
}
// Quanto os robôs de F1 andam neste ciclo: o tempo real que passou, em passos inteiros da física. O timer não bate certinho (no Windows, de 46 a 62 ms): andar sempre
// 50 ms e carimbar a hora real fazia a tela ver o carro frear e acelerar. `room.relogioRobos` é a hora exata em que os robôs estão, e é ela que vai na pose.
function tempoDoPasso(room, agora = Date.now()) {
  if (room.relogioRobos == null || agora - room.relogioRobos > 250) room.relogioRobos = agora - Sim.PASSO * 1000; // (no começo, ou depois de um engasgo longo: não tenta recuperar)
  const n = Math.floor((agora - room.relogioRobos) / (Sim.PASSO * 1000));
  room.relogioRobos += n * Sim.PASSO * 1000;
  return n * Sim.PASSO;
}
// um passo (dt em segundos). setor(p, s) é o mesmo onSector dos humanos; emit manda eventos para a sala
function passo(room, dt, setor, emit) {
  const now = Date.now(), corrida = room.phase === "race" && now >= room.startAt, t = T.PISTAS[room.config.pista];
  const humanos = room.order.map((id) => room.players[id]).filter((q) => !q.bot && q.pos);
  const lider = humanos.length ? Math.max(...humanos.map((q) => q.pos.prog)) : null, f1 = room.config.regras === "f1";
  const outrosF1 = f1 ? room.order.map((id) => room.players[id]).filter((q) => q.pos && !q.dnf && q.finish == null).map((q) => q.pos) : null;
  for (const id of room.order) {
    const p = room.players[id]; if (!p.bot || !p.ia) continue;
    // Um robô que assumiu um humano pode não ter perfil ainda; calcula só uma vez ao assumir.
    const ia = p.ia, pf = ia.perfil || (ia.perfil = perfil(room.config.pista, p.spec || p.car, ia.tracadoId)), c = pf.c;
    if (f1 && ia.sim) {
      if (p.dnf) { ia.sim.v = ia.v = 0; if (p.pos) { p.pos.v = 0; p.pos.at = now; } continue; }
      if (room.phase === "quali") { // (2026-11-23) a classificação pilotada: só quem está na sessão aberta, depois da hora de sair; sem os outros carros (fantasmas)
        const q = room.quali; if (!q || q.pausaAte || !q.ativos.includes(id) || now < (p.qSaida || Infinity)) continue;
        passoF1(room, p, ia, pf, dt, now, setor, emit, []); continue;
      }
      if (corrida && p.finish == null && now >= room.startAt + ia.reacao) passoF1(room, p, ia, pf, dt, now, setor, emit, outrosF1);
      else if (p.finish != null) passoFantasma(room, p, ia, pf, dt, now); // depois da bandeirada o carro segue rodando sozinho (como o dos humanos), em vez de parar na linha de chegada
      continue;
    }
    if (p.dnf) { ia.v = Math.max(0, ia.v - c.brake * 1.2 * dt); ia.s = (ia.s + (ia.v * dt) / STEP) % pf.n; } // perda total: o carro para onde está
    else if (ia.box && corrida && p.finish == null) passoNoBox(room, p, ia, pf, dt, emit);
    else if (corrida && p.finish == null && now >= room.startAt + ia.reacao) {
      // Corre pelo próprio ritmo; a posição do humano não dá aceleração extra ao bot.
      let el = 1; if (lider != null && p.pos && (p.pos.prog - lider) / pf.n > 0.08) el = 0.97;
      const i = Math.floor(ia.s) % pf.n;
      const aderencia = ia.pneu && F1.aderencia(ia.pneu), est = f1 ? ia.estilo : null, dano = f1 ? F1.efeitoDoDano(p.dano) : null;
      // o traçado de cada robô: a linha mais o seu jeito (regras de F1: mais por dentro ou por fora das curvas, mais para um lado)
      const baseLat = pf.lat[(i + 2) % pf.n] + ia.jeito + Math.sin(ia.s / 105 + ia.tracadoId * 1.7) * 4 + (est ? est.dentro * pf.linha.sinal[i] * Math.min(1, pf.linha.k[i] * 400) * 12 : 0);
      const maxLat = Math.min(t.width / 2 - 10, pf.teto ? pf.teto[i] : Infinity), ponto = pf.pts[i];
      let desvio = 0, freioTrafego = Infinity, encontrou = false, tf = null;
      if (f1) { tf = transito(room, p, ia, pf, i, baseLat, maxLat); desvio = tf.desvio; freioTrafego = tf.freio; encontrou = tf.encontrou; }
      // regras de F1: cada robô começa a frear numa distância (est.look pontos antes da curva); com o pneu gasto ou o carro
      // batido, mais cedo
      const olha = est ? Math.max(1, Math.round(est.look + (aderencia ? (1 - aderencia.freio * dano.grip) * 14 : 0))) : 3;
      let alvo = Math.min(pf.lim[i], pf.lim[(i + olha) % pf.n]) * ia.nivel * el * (1 - Math.min(1, Math.abs(ia.desvio) / 40) * 0.06);
      // regras de F1: nas curvas, a velocidade vai com a raiz da aderência (o pneu gasto ou frio, o dano e o ar sujo de quem vem
      // colado atrás): o robô freia antes e não escorrega
      const curva = pf.linha.k[i] > 1 / 600, vac = aderencia ? F1.vacuoF1(tf && F1.vacuoPermitido(ia.v, room.phase === "quali") ? tf.draft : 0, curva) : null;
      if (aderencia && pf.lim[i] < c.vmax * 0.97) alvo *= Math.sqrt(aderencia.grip * dano.grip * vac.aderencia);
      if (aderencia) alvo = Math.min(alvo, c.vmax * aderencia.final * dano.final);
      if (!f1) for (const oid of room.order) {
        const o = room.players[oid]; if (o === p || !o.pos || Math.abs((o.pos.z || 0) - ponto.h) > 15) continue;
        const dx = o.pos.x - p.pos.x, dy = o.pos.y - p.pos.y;
        const frente = dx * ponto.tx + dy * ponto.ty, lado = dx * -ponto.ty + dy * ponto.tx;
        if (frente < -40 || frente > 185 || Math.abs(lado) > 65) continue;
        const latOutro = (o.pos.x - ponto.x) * -ponto.ty + (o.pos.y - ponto.y) * ponto.tx;
        if (Math.abs(latOutro - ia.lat) > 34) continue;
        encontrou = true;
        const esquerda = latOutro - 30, direita = latOutro + 30;
        const cabeEsquerda = esquerda >= -maxLat, cabeDireita = direita <= maxLat;
        if (room.direcao?.safety) ia.passSide = 0;
        else if (!ia.passSide || (ia.passSide < 0 && !cabeEsquerda) || (ia.passSide > 0 && !cabeDireita))
          ia.passSide = cabeEsquerda && (!cabeDireita || Math.abs(esquerda - baseLat) < Math.abs(direita - baseLat)) ? -1 : cabeDireita ? 1 : 0;
        const alvoPassagem = ia.passSide < 0 ? esquerda : direita;
        if (ia.passSide) desvio = alvoPassagem - baseLat;
        const faltaEspaco = !ia.passSide || Math.abs(ia.lat - latOutro) < 25;
        if (frente > 0 && frente < 115 && faltaEspaco) freioTrafego = Math.min(freioTrafego, Math.max(35, (o.pos.v || 0) * 0.94));
      }
      if (!f1 && !encontrou) ia.passSide = 0;
      if (p.azul) { desvio = maxLat * 0.65 - baseLat; alvo *= 0.82; }
      const bala = p.balaUntil > now; // a bala não freia para ninguém nem para curva: passa por cima
      if (!bala) alvo = Math.min(alvo, freioTrafego);
      let freioK = 1;
      if (est && !bala) { // regras de F1: de vez em quando o robô erra, como quem joga: trava a roda na frenagem e sai largo da curva
        const e = erroDoRobo(room, p, ia, pf, i, alvo, olha, now, dt, emit); alvo = e.alvo; freioK = e.freioK; desvio += e.desvio;
      }
      alvo = Math.min(alvo, c.vmax); // nunca passa da velocidade final do carro (a mesma de quem joga)
      if (room.direcao?.safety) alvo = Math.min(alvo, c.vmax * 0.54);
      else if (room.direcao?.amarelo?.setor === Math.floor(i / (pf.n / T.SECTORS))) alvo = Math.min(alvo, c.vmax * 0.82);
      if (p.incidenteAte > now) alvo = Math.min(alvo, c.vmax * 0.24);
      if (p.quebrou) alvo = Math.min(alvo, c.vmax * F1Equipes.EMERGENCIA); // o carro quebrou (f1-equipes.js): anda no modo de emergÃªncia
      if (p.shrinkUntil > now) alvo *= ENCOLHIDO; // o raio: pequeno e lento, como quem joga (fisica.js)
      if (p.inkUntil > now) alvo *= 0.9; // a lula: sem enxergar direito, tira o pé
      if (bala) alvo = c.vmax; // e a bala soma a força dela logo abaixo, como o turbo
      // turbo e estrela: as mesmas contas do carro de quem joga (fisica.js): mais velocidade final e mais força para chegar nela
      const turbo = p.boostUntil > now, estrela = p.starUntil > now;
      const drs = !!(aderencia && p.drsZona === F1.zonaDRS(ia.s / pf.n, t.drs) && p.drsZona >= 0 && !room.direcao?.safety && !room.direcao?.amarelo);
      const ers = ia.ers;
      if (ers) F1.carregarErs(ers, dt, ia.v > alvo + 12, ia.v >= alvo, p.laps);
      const saidaCurva = pf.lim[(i + 6) % pf.lim.length] > pf.lim[i] * 1.08 && pf.lim[i] > c.vmax * 0.45; // (2026-11-23) a saída da curva: o limite sobe logo à frente
      const usaErs = !!(ers && !room.direcao?.safety && F1.usarErsAuto(ers.carga, ia.v, c.vmax, pf.lim[i] > c.vmax * 0.93 || saidaCurva, encontrou));
      if (ers) F1.gastarErs(ers, dt, usaErs, encontrou);
      // regras de F1: o vácuo na reta (o mesmo de quem joga, com o mesmo teto do ganho aerodinâmico)
      const aero = vac ? Math.min(F1.AERO_MAX, vac.final + (drs ? F1.DRS_GANHO * (c.drs ?? 1) : 0) + (usaErs ? 0.03 : 0)) : (drs ? F1.DRS_GANHO * (c.drs ?? 1) : 0) + (usaErs ? 0.03 : 0);
      const bk = 1 + (turbo ? 0.18 : 0) + (estrela ? 0.12 : 0) + (bala ? BALA - 1 : 0) + aero;
      const ak = 1 + (turbo ? 0.8 : 0) + (estrela ? 0.4 : 0) + (bala ? 1.5 : 0) + (usaErs ? 0.25 : 0) + (vac ? vac.acel : 0);
      alvo += c.vmax * (bk - 1); // o item mantém sua força mesmo com o ritmo base mais acessível
      if (room.direcao?.safety) alvo = Math.min(alvo, c.vmax * 0.54);
      else if (room.direcao?.amarelo?.setor === Math.floor(i / (pf.n / T.SECTORS))) alvo = Math.min(alvo, c.vmax * 0.82);
      if (p.spinUntil > now) ia.v *= Math.exp(-dt * 2.2);
      else if (ia.v < alvo) ia.v = Math.min(alvo, ia.v + c.acc * ak * (aderencia?.tracao || 1) * (dano ? dano.tracao : 1) * (1 - 0.8 * Math.pow(Math.max(0, ia.v) / (c.vmax * bk), 1.6)) * dt); // a mesma arrancada do carro de quem joga
      else ia.v = Math.max(alvo, ia.v - (ia.v > c.vmax && alvo >= c.vmax * 0.98 ? T.TURBO_SOLTA : c.brake * (aderencia?.freio || 1) * (dano ? dano.freio : 1) * freioK) * dt); // fim do turbo na reta: solta aos poucos, como quem joga
      ia.s = (ia.s + (ia.v * dt) / STEP) % pf.n;
      entrarNoBox(room, p, ia, pf);
      // o pneu gasta pela distância; escorrega quando a curva pede mais que o grip do carro
      if (ia.pneu) F1.gastarPneu(ia.pneu, { dist: ia.v * dt, volta: pf.n * STEP, rel: F1.relDaPista(room.config.pista), ers: usaErs, slip: Math.max(0, (ia.v * ia.v * pf.linha.k[i]) / c.grip - 0.9) * 120, v: ia.v, vmax: c.vmax, dt, fator: c.desgaste });
      // depois da largada (~600 de reta), sai da faixa do grid e vai aos poucos para o traçado; antes disso, não desvia de ninguém
      const saida = Math.min(1, ((ia.s - ia.s0 + pf.n) % pf.n) / 100), largando = saida < 1;
      ia.desvio += (desvio - ia.desvio) * Math.min(1, dt * 2.2);
      const alvoLat = largando ? ia.lat0 * (1 - saida) + (baseLat + ia.desvio) * saida : baseLat + ia.desvio;
      let quer = Math.max(-maxLat, Math.min(maxLat, alvoLat));
      if (tf) { if (tf.bloqPos) quer = Math.min(quer, ia.lat); if (tf.bloqNeg) quer = Math.max(quer, ia.lat); } // não fecha a porta de quem está ao lado
      ia.lat += Math.max(-42 * dt, Math.min(42 * dt, quer - ia.lat));
    }
    const i = posicionar(p, pf, p.laps);
    // setores: o mesmo caminho dos humanos (a volta só conta passando pelos 4, na ordem)
    const sec = Math.floor(i / (pf.n / T.SECTORS));
    if (sec === (p.sector + 1) % T.SECTORS) setor(p, sec);
    // itens: pega a caixa em que passou por cima e usa depois de um tempinho
    if (room.config.caixas && corrida && p.finish == null) {
      if (!p.item) room.itemBoxes.forEach((b, k) => { if (Math.hypot(b.x - p.pos.x, b.y - p.pos.y) < 30) Itens.pick(room, p, k, emit); });
      else if (p.rolling <= now) { if (!ia.usaEm) ia.usaEm = now + rnd(1500, 6000); if (now > ia.usaEm) { ia.usaEm = 0; Itens.use(room, p, false, emit); } }
    }
  }
  // (as batidas entre os carros: cada carro, humano ou robô, bate a cada passo da física: corrida-contato.js)
}
function possivel(pista, spec) { return perfilF1(perfil(pista, spec || F1Equipes.specDaEquipe("mclaren"), 0), 1); }
possivel.topo = (pista, spec) => topoDe(perfil(pista, spec || F1Equipes.specDaEquipe("mclaren"), 0));
// (2026-11-21, o servidor.log do Thiago: 879 ms parado no começo da classificação, carregando arquivo: wrapResolveFilename / package.json) os
// arquivos que os robôs só liam na primeira classificação vão para a memória logo depois da abertura, fora de qualquer corrida
setImmediate(() => { try { fatorDoQuali("interlagos"); acertoDoRobo("interlagos", "medio", 0); ritmoDosPneus(); } catch (e) { /* (só aquece: o uso de verdade tenta de novo) */ } });
module.exports = { razaoDaVolta, condicaoDaAgua, semReforco, forcaDoReforco, proximidadeDaSala, TOQUES_MURO_MAX, prepararQuali, forcaDoNivel, nomeDoNivel, MARCA_NIVEL, preaquecerQuali, preaquecerNiveis, tempoDoPasso, transito, prepararTracado, tracadoPronto, linhaF1Pronta, idealDe, possivel, forcaDoContato, preparar, remover, largar, passo, NIVEIS, RITMO, GRID_F1, aprender, usarFonte, aprendido, tempoDaVolta, perfil, ritmoDosRobos, prazoDeChegada, voltaLancada, duracaoDaClassificacao, escolherComposto, decidirParada };
