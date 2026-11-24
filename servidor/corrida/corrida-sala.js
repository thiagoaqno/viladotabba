// Corrida da Galera — a sala: a configuração, o estado que vai para os navegadores, as equipes, os carros, as falhas e o
// ponto de cada carro na volta. Parte de corrida.js (attachCorrida chama em ordem: sala, voltas, largada, gp, conexao).
const T = require("../../public/corrida/pistas.js");
const Anos = require("../../public/corrida/f1-temporadas.js"); // a temporada (2023 a 2026) da sala: equipes, pilotos e força dos carros daquele ano
const Itens = require("./corrida-itens.js");
const F1 = require("../../public/corrida/f1-regras.js"); // as regras de F1 (os pneus), opção da sala
const Direcao = require("./corrida-f1-direcao.js");
const Sim = require("../../public/corrida/sim.js");
const Quali = require("./corrida-f1-classificacao.js"); // a classificação (Q1, Q2, Q3) que define o grid das regras de F1
const Robos = require("./corrida-robos.js"); // os robôs (rodam aqui no servidor)
const Analise = require("./corrida-analise.js"); // as voltas, os setores e as posições que a aba Análise da carreira mostra
const Humanos = require("./corrida-humanos.js"); // os humanos nas regras de F1: o servidor anda o carro com as entradas do piloto (autoridade)
const Contato = require("./corrida-contato.js"); // as batidas entre carros (e quem está fantasma por causa do box)
const Equipes = require("../../public/corrida/f1-equipes.js"); // as equipes de 2026, o orçamento em pontos e a montagem do carro
const Pilotos = require("../../public/corrida/f1-pilotos-2026.js");
const { int } = require("./corrida-base.js");
module.exports = (C) => {
  const { nsp } = C;
  // regras "f1" (planos/temporada-f1.md): pneus que gastam; sem caixas e sem a ajuda do pelotão
  const cleanConfig = (c = {}) => {
    const f1 = c.regras === "f1";
    return {
      pista: T.PISTAS[c.pista] ? c.pista : "interlagos",
      hora: c.hora === "noite" || (c.hora == null && T.PISTAS[c.pista]?.horaPadrao === "noite") ? "noite" : "dia", // (sem horário na config: a pista que só corre à noite, Singapura, nasce de noite)
      voltas: [1, 2, 3, 5, 10, 21].includes(int(c.voltas, 3)) || (c.voltasDoGP && int(c.voltas, 0) >= 1 && int(c.voltas, 0) <= 40) ? int(c.voltas, 3) : 3, // (voltasDoGP: a carreira, com as voltas de cada pista, F1.voltasDoGP)
      regras: f1 ? "f1" : "galera",
      ano: Anos.anoValido(c.ano), // a temporada (f1-temporadas.js); sem ano, 2026
      caixas: !f1 && c.caixas === true,
      equilibrio: !f1 && c.equilibrio !== false,
      robos: Math.max(0, Math.min(f1 ? Robos.GRID_F1 - 1 : 7, int(c.robos, 0))), // nas regras de F1 o grid tem até 22 carros
      classificacao: f1 && c.classificacao === "pular" ? "pular" : f1 ? "completa" : "pular", // F1: Q1, Q2 e Q3 antes da corrida, ou grid pela ordem dos pilotos
      cambio: c.cambio === "manual" ? "manual" : "auto",
      ers: f1 && c.ers === "auto" ? "auto" : "manual", // o ERS é MANUAL por padrão (pedido do Thiago, 2026-11-10): segura E para usar; "auto" só se a sala escolher
      clima: f1 && F1.OPCOES_DE_CLIMA.includes(c.clima) ? c.clima : "aleatorio", // F1: aleatório (a previsão do GP), seco, chuva ou variável (começa seco e chove no meio)
      nivel: Robos.NIVEIS[c.nivel] ? c.nivel : Number.isFinite(Number(c.nivel)) && c.nivel !== "" && c.nivel !== null ? Math.round(Robos.forcaDoNivel(Number(c.nivel))) : "medio", // (0 a 100, ou um dos nomes antigos)
      contrarrelogio: f1 && c.contrarrelogio === true, // sozinho na pista, com o fantasma da sua melhor volta correndo junto (jogo.js)
    };
  };
  // Uma sala nova (o botão "Abrir sala nova", que não manda config) nasce em Mônaco, com as regras de F1, 5 voltas, grid de 22 (21 robôs
  // médios), clima variável e a classificação pulada; o pneu da largada de cada piloto já nasce médio (`F1.COMPOSTO_PADRAO`, em `addPlayer`) e
  // cada um já entra com uma equipe (`equipeLivre`), não com o carro avulso. O organizador muda tudo depois, e quem manda uma config
  // parcial (os testes, a carreira) continua recebendo os padrões de `cleanConfig` e sem equipe.
  const CONFIG_SALA_NOVA = { pista: "monaco", regras: "f1", voltas: 5, nivel: "medio", robos: Robos.GRID_F1 - 1, clima: "variavel", classificacao: "pular" };
  const nameOf = (room, id) => (room.players[id] ? room.players[id].name : "?");
  function log(room, text) {
    room.log.push({ t: Date.now(), text }); if (room.log.length > 80) room.log.splice(0, room.log.length - 80);
    if (room.config.regras === "f1") { try { Analise.evento(room, text, (p) => pontoDoCarro(room, p)); } catch (e) { /* a linha do tempo é um extra */ } }
  }

  // quem já carregou a pista (corrida: room.carga; classificação: room.quali.carga), para a tela de carregamento de cada um; null = ninguém mais esperando
  function cargaPublica(room) {
    const c = room.phase === "race" ? room.carga : room.phase === "quali" ? room.quali?.carga : null; if (!c) return null;
    const humanos = room.order.filter((id) => { const q = room.players[id]; return q && !q.bot && q.sockets && q.sockets.size; });
    return { prontos: humanos.filter((id) => c.prontos.has(id)).length, total: humanos.length };
  }
  function publicState(room) {
    return {
      code: room.code, host: room.host, phase: room.phase, config: room.config, startAt: room.startAt || null, carga: cargaPublica(room), endAt: room.endAt || null, ...(room.temporada ? { temporada: true, ...(room.salaTemporada ? { salaTemporada: room.salaTemporada } : {}) } : {}),
      boxReady: Itens.publicBoxes(room), ...(room.config.regras === "f1" ? { estrategistas: room.estrategistas || null, tvAte: room.tvAte || null, tv: room.tvAte && Date.now() < room.tvAte ? room.tv || null : null, clima: room.clima || null, previsao: F1.previsaoDoGP(sementeDoClima(room), room.config.clima, room.config.pista), montagens: room.montagens || {}, bonusMontagem: room.bonusMontagem || {}, pecasEq: room.pecasEq || {}, chefes: chefes(room), semente: room.semente || null, direcao: Direcao.publico(room), luzes: room.luzes || null, quali: Quali.publico(room), resultado: room.resultado || null } : {}),
      players: room.order.map((id) => {
        const p = room.players[id];
        return { id, bot: !!p.bot, ...(p.bonusBox ? { bonusBox: p.bonusBox } : {}), ...(p.assumido ? { assumido: true } : {}), ...(p.plano ? { plano: p.plano } : {}), ...(p.gpMods ? { gpMods: p.gpMods } : {}), name: p.name, nomeCompleto: p.nomeCompleto || null, equipe: p.equipe || null, numero: p.numero || null, sigla: p.sigla || null, pawn: p.pawn, color: p.color, skin: p.skin, car: p.car, mods: p.mods, pneu: p.pneu || F1.COMPOSTO_PADRAO, pneuAtual: p.pneuAtual || p.pneu || F1.COMPOSTO_PADRAO, paradas: (p.paradas || []).length, desg: Math.round((((p.sim && p.sim.c && p.sim.c.pneu) || (p.ia && p.ia.pneu) || {}).desgaste || 0) * 100), jogos: room.config.regras === "f1" ? F1.jogosRestantes(p) : null, noBox: !!p.box, fantBox: Contato.fantasmaDoBox(p), fantasma: (room.phase === "quali" && !!p.bot) || Date.now() < (p.fantAte || 0), quebrou: !!p.quebrou, acrescimo: p.acrescimo || 0, penal: p.penal || 0, dsq: !!p.dsq, causadas: p.causadas || 0, stopGo: p.stopGo ? { s: p.stopGo.s, v: Direcao.stopGoRestante(p, room.config.voltas) } : null, boxFase: Sim.faseDoBox((p.sim ? p.sim.c : p.ia && p.ia.sim)?.box), dano: p.dano || 0, dnf: !!p.dnf, ultimaBatida: p.ultimaBatida || null, avisosLimite: p.avisosLimite || 0, azul: !!p.azul, drsZona: p.drsZona ?? -1, ers: p.ia?.ers?.carga ?? p.ers?.carga ?? null, grid: p.grid, online: p.sockets.size > 0, laps: p.laps, sector: p.sector, started: p.started, finish: p.finish, best: p.best, last: p.last,
          item: p.item || null, cargas: p.cargas || 0, rolling: p.rolling || 0, boostUntil: p.boostUntil || 0, starUntil: p.starUntil || 0, spinUntil: p.spinUntil || 0,
          shrinkUntil: p.shrinkUntil || 0, inkUntil: p.inkUntil || 0, balaUntil: p.balaUntil || 0 };
      }),
      finishOrder: room.finishOrder, log: room.log.slice(-20), now: Date.now(),
    };
  }
  // ---------- a equipe e o carro (regras de F1) ----------
  // Cada equipe tem um orçamento em pontos para as peças (f1-equipes.js). A montagem da equipe fica em `room.montagens[equipe]`
  // (só quando o chefe mexeu: sem ela vale a padrão) e vale para os dois carros dela, humanos ou robôs. O chefe é o primeiro
  // humano da equipe na ordem da sala. Dois amigos podem dividir a mesma equipe; cada equipe tem só 2 carros.
  // a equipe com que entra quem chega numa sala nova: uma das que ainda têm vaga (as com menos humanos primeiro), sorteada
  const equipeLivre = (room) => {
    const ids = Object.keys(Pilotos.EQUIPES).filter((id) => Equipes.EQUIPES[id] && humanosDa(room, id).length < 2);
    if (!ids.length) return null;
    const menor = Math.min(...ids.map((id) => humanosDa(room, id).length)), ls = ids.filter((id) => humanosDa(room, id).length === menor);
    return ls[Math.floor(Math.random() * ls.length)];
  };
  function entrarNaEquipe(room, p, preferida) { // `preferida`: a equipe escolhida na garagem da tela inicial, se ela existe
    const id = Pilotos.EQUIPES[preferida] && Equipes.EQUIPES[preferida] ? preferida : equipeLivre(room), eq = id && Pilotos.EQUIPES[id]; if (!eq) return;
    p.equipe = id; if (T.MODS.pintura[eq.pintura]) p.mods = { ...p.mods, pintura: eq.pintura }; // a pintura da equipe (dá para trocar depois)
  }
  const humanosDa = (room, equipe) => room.order.filter((id) => room.players[id] && !room.players[id].bot && room.players[id].equipe === equipe);
  const chefes = (room) => { const out = {}; for (const id of room.order) { const p = room.players[id]; if (p && !p.bot && p.equipe && !out[p.equipe]) out[p.equipe] = id; } return out; };
  const limparMontagens = (room) => { if (!room.montagens) return; for (const eq of Object.keys(room.montagens)) if (!humanosDa(room, eq).length) delete room.montagens[eq]; if (room.pecasEq) for (const eq of Object.keys(room.pecasEq)) if (!room.montagens || !room.montagens[eq]) delete room.pecasEq[eq]; if (!Object.keys(room.montagens).length) delete room.montagens; };
  // o carro de cada um (`p.spec`) e a chance de quebrar: tudo sai da equipe; sem equipe (ou sem as regras de F1), vale o carro escolhido
  function atribuirCarros(room) {
    const f1 = room.config.regras === "f1";
    for (const id of room.order) {
      const p = room.players[id]; if (!p) continue;
      if (f1 && p.equipe && Equipes.EQUIPES[p.equipe]) p.spec = Equipes.specDaEquipe(p.equipe, room.montagens && room.montagens[p.equipe]); else delete p.spec;
    }
  }
  const specDe = (p) => p.spec || T.CARROS[p.car] || T.CARROS.equilibrado;
  // a falha mecânica: quem tira a sorte decide pela semente do GP em que ponto da corrida o carro quebra (ou se nem quebra)
  function sortearFalhas(room) {
    for (const id of room.order) {
      const p = room.players[id]; if (!p) continue;
      p.quebrou = false; p.falhaEm = null;
      if (!p.spec) continue;
      p.falhaEm = Equipes.sortearFalha(F1.sorteio(`quebra:${room.semente}:${id}`), p.spec); // em que fração da corrida o carro quebra (ou null)
    }
  }
  const pontosPorVolta = (pista) => (PONTOS_DA_PISTA[pista] = PONTOS_DA_PISTA[pista] || T.pontos(T.PISTAS[pista], 6).length);
  const PONTOS_DA_PISTA = {};
  function verificarFalhas(room) {
    const total = pontosPorVolta(room.config.pista) * room.config.voltas; let mudou = false;
    for (const id of room.order) {
      const p = room.players[id];
      if (!p || p.falhaEm == null || p.quebrou || p.finish != null || !p.pos || p.pos.prog / total < p.falhaEm) continue;
      p.quebrou = true; mudou = true;
      log(room, `🔧 ${p.name} quebrou! Anda no modo de emergência.`);
    }
    return mudou;
  }
  function broadcast(room) { room.t = Date.now(); nsp.to(room.code).emit("state", publicState(room)); }

  // ---------- os humanos nas regras de F1 ----------
  // Um laço por sala (a cada 10 ms) anda cada carro humano com as entradas que o piloto já mandou e, a cada 30 ms, manda a
  // posição dos carros (`snap`, binário: pose.js, Snap): quem está perto de você 33 vezes por segundo, o resto menos (corrida-humanos.js,
  // snapPara). Os ganchos levam o que a física viu (checkpoint, batida, box) para as regras da sala.
  const SNAP_TIQUES = process.env.CORRIDA_SITE ? 1 : 3; // a cada 3 voltas do laço de 10 ms (no programa de PC, em toda volta: o servidor está no próprio PC, não há internet para poupar, e menos tempo entre pacotes é menos previsão errada na tela)
  function enviarSnaps(room, n) {
    const agora = Date.now(), lista = Humanos.snap(room, agora), donos = [];
    if (!lista.length) return;
    for (const id of room.order) {
      const p = room.players[id]; if (!p || p.bot || !p.sockets.size) continue;
      const meus = Humanos.snapPara(lista, id, n), pacote = meus.length ? Humanos.pacote(agora, meus) : null;
      for (const sid of p.sockets) { donos.push(sid); const s = nsp.sockets.get(sid); if (s && pacote) s.volatile.emit("snap", pacote); }
    }
    nsp.to(room.code).except(donos).volatile.emit("snap", Humanos.pacote(agora, lista)); // (quem só assiste recebe todos)
  }
  // A semente que vale para a previsão do tempo: na sala (antes de largar) é a do GP que vem aí (`sementeProx`, sorteada na primeira
  // vez que alguém pergunta e usada por `preparar`: a previsão que se vê é a do GP que acontece); a carreira já tem a sua fixa.
  function sementeDoClima(room) {
    if (room.phase !== "lobby") return room.semente;
    return room.sementeFixa ?? (room.sementeProx ??= Math.floor(Math.random() * 1e9));
  }
  // o corredor dos boxes da pista da sala (os pontos da pista são de 6 em 6 unidades, como no navegador)
  const corredorDe = (room) => { const t = T.PISTAS[room.config.pista]; return t.boxes ? F1.corredor(t, pontosPorVolta(room.config.pista), t.width) : null; };
  // onde o carro está na pista agora (o ponto da pista), para conferir um setor que pulou: a simulação do servidor (humanos e
  // robôs das regras de F1) ou a posição que o navegador mandou
  const pontoDoCarro = (room, p) => {
    // (2026-11-20) `pontosPorVolta` guarda o número; antes `T.pontos` refazia o traçado inteiro para cada carro a cada amostra do replay: medido
    // no servidor local em Mônaco, 55 a 70 ms a cada 100 ms do laço da direção de prova, e os pacotes de posição dos robôs saíam com buracos de
    // até meio segundo (as travadinhas deles mesmo jogando no PC)
    const n = pontosPorVolta(room.config.pista), c = p.sim ? p.sim.c : p.ia && p.ia.sim;
    if (c && Number.isFinite(c.idx)) return { idx: c.idx, n };
    if (p.pos && Number.isFinite(p.pos.prog)) return { idx: ((Math.floor(p.pos.prog) % n) + n) % n, n };
    return { idx: NaN, n };
  };
  return { cleanConfig, CONFIG_SALA_NOVA, nameOf, log, entrarNaEquipe, humanosDa, chefes, limparMontagens, atribuirCarros, specDe, sortearFalhas, verificarFalhas, broadcast, SNAP_TIQUES, enviarSnaps, corredorDe, pontoDoCarro };
};
