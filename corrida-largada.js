// Corrida da Galera — a largada: o carro de quem joga no servidor, a espera do traçado e da carga, a largada, o clima e a
// classificação. Parte de corrida.js.
const T = require("./public/corrida/pistas.js");
const Anos = require("./public/corrida/f1-temporadas.js"); // a temporada (2023 a 2026) da sala: equipes, pilotos e força dos carros daquele ano
const Itens = require("./corrida-itens.js");
const F1 = require("./public/corrida/f1-regras.js"); // as regras de F1 (os pneus), opção da sala
const Direcao = require("./corrida-f1-direcao.js");
const Parados = require("./corrida-parados.js"); // o carro parado na pista vira fantasma e é recolocado (sem engavetamento)
const Quali = require("./corrida-f1-classificacao.js"); // a classificação (Q1, Q2, Q3) que define o grid das regras de F1
const Robos = require("./corrida-robos.js"); // os robôs (rodam aqui no servidor)
const Gravacao = require("./corrida-gravacao.js"); // o replay da tela do resultado: a fração da volta e a telemetria de cada carro a cada 250 ms, e as ultrapassagens
const Analise = require("./corrida-analise.js"); // as voltas, os setores e as posições que a aba Análise da carreira mostra
const Humanos = require("./corrida-humanos.js"); // os humanos nas regras de F1: o servidor anda o carro com as entradas do piloto (autoridade)
const TRobo = require("./corrida-temporada-robo.js"); // o robô que leva o carro de quem cai no meio do GP da temporada em grupo
const { rid, novoCodigo, limparNome: cleanName, ok, falha: fail, contexto, ligarSocket, buscarSala, quemVolta, nomeEmUso, limparSalasParadas } = require("./salas.js"); // as peças de sala que todo jogo repete
const { PERF, medirPerf, ROBOS_F1_MS, CARGA_MAX_MS, LUZES_MS, TV_TEMPORADA_MS, TV_AVULSA_MS, COUNTDOWN_MS, MAX_RACE_MS, COLORS } = require("./corrida-base.js");
module.exports = (C) => {
  const { nsp, rooms, log, atribuirCarros, sortearFalhas, verificarFalhas, broadcast, SNAP_TIQUES, enviarSnaps, endRace, concluirParada, pontoDoCarro, onSector, aplicarBatida } = C;
  function ligarHumanos(room) {
    clearInterval(room.humanosTimer);
    if (room.config.regras !== "f1") return;
    const h = {
      aoSetor: (r, p, s, quando) => onSector(r, p, s, quando),
      aoBater: (r, p, forca, tipo, chave, quando) => aplicarBatida(r, p, forca, tipo, quando, chave),
      aoParada: (r, p, d) => concluirParada(r, p, d),
      registrar: (r, p, pos, quando) => { // a direção de prova olha o carro (DRS, limites de pista, bandeiras); na classificação só guarda a posição
        if (r.phase !== "race") { p.pos = pos; return false; }
        const penal = p.penal || 0; Direcao.registrar(r, p, pos, quando, (s) => log(r, s));
        return (p.penal || 0) !== penal; // a penalidade aparece na hora
      },
      mandarAck: (p, ack) => { for (const sid of p.sockets) { const s = nsp.sockets.get(sid); if (s) s.emit("ack", ack); } },
      mudou: () => broadcast(room),
    };
    let tique = 0, nSnap = 0;
    room.humanosTimer = setInterval(() => { T.usarEscala(room.config.pista); Anos.usarAno(room.config.ano);
      if (room.phase !== "race" && room.phase !== "quali") return;
      Humanos.andar(room, Date.now(), h);
      if (++tique % SNAP_TIQUES) return;
      enviarSnaps(room, ++nSnap);
    }, 10);
  }

  // A primeira otimização de uma pista roda fora do laço principal, sem parar outras salas.
  function aguardarTracado(room, continuar) {
    if (room.config.regras !== "f1" || Robos.tracadoPronto(room.config.pista)) return false;
    if (room.preparandoTracado) return true;
    const pista = room.config.pista, fase = room.phase, registrada = rooms.get(room.code) === room;
    room.preparandoTracado = true;
    Robos.prepararTracado(pista).then(() => {
      room.preparandoTracado = false;
      if ((!registrada || rooms.get(room.code) === room) && room.phase === fase && room.config.pista === pista) {
        continuar();
        broadcast(room); // a largada adiada também precisa avisar todos que aguardam no lobby
      }
    }).catch((e) => { room.preparandoTracado = false; console.warn("Corrida: falha ao preparar traçado", e.message); });
    return true;
  }
  function liberarCarga(room) {
    const c = room.carga; if (!c || !room.tvAte) return;
    if (room.order.some((id) => { const q = room.players[id]; return q && !q.bot && q.sockets && q.sockets.size && !c.prontos.has(id); })) return; // ainda falta gente carregar
    room.carga = null;
    const novo = Date.now() + c.tvMs, delta = room.tvAte - novo; if (delta <= 0) return;
    room.tvAte -= delta; room.startAt -= delta; if (room.clima) room.clima.t0 = room.startAt;
    broadcast(room);
  }
  // ---------- corrida ----------
  // A classificação (regras de F1) já escolheu a semente e os robôs; ela chama `startRace(room, grid)` com os ids na ordem do grid.
  function startRace(room, grid) { T.usarEscala(room.config.pista); Anos.usarAno(room.config.ano);
    if (aguardarTracado(room, () => startRace(room, grid))) return;
    const f1 = room.config.regras === "f1", daClassificacao = !!(grid && room.quali);
    clearTimeout(room.endTimer);
    clearInterval(room.itemTimer); clearInterval(room.botTimer); clearInterval(room.f1Timer); clearInterval(room.humanosTimer);
    Quali.cancelar(room);
    Analise.limpar(room); Gravacao.limpar(room);
    room.phase = "race";
    for (const id of room.order) delete room.players[id].sim; // cada largada começa com o carro no grid
    require("./corrida-contato.js").limpar(room);
    ligarHumanos(room);
    if (!daClassificacao) preparar(room);
    atribuirCarros(room);
    if (f1) sortearFalhas(room);
    room.resultado = null;
    // as cinco luzes (F1): acendem uma por segundo e apagam juntas depois de uma espera sorteada (0,4 a 2,8 s) pela semente do GP
    room.luzes = f1 ? { espera: Math.round((0.4 + F1.sorteio(`luzes:${room.semente}`)() * 2.4) * 100) / 100 } : null;
    // a transmissão de TV vem antes de tudo: `tvAte` é quando ela acaba e as luzes só começam depois (LUZES_MS + as cinco luzes)
    const tvMs = !f1 ? 0 : process.env.CORRIDA_TV_MS ? Math.max(0, Number(process.env.CORRIDA_TV_MS) || 0) : room.temporada ? TV_TEMPORADA_MS : TV_AVULSA_MS;
    const inicioPreparoGrid = Date.now();
    const esperaCarga = tvMs && room.order.some((id) => { const q = room.players[id]; return q && !q.bot && q.sockets && q.sockets.size; }) ? CARGA_MAX_MS : 0;
    room.tvAte = tvMs ? inicioPreparoGrid + esperaCarga + tvMs : null; room.tvPulos = new Set(); room.tv = tvMs ? room.tvTemporada || {} : null;
    room.carga = esperaCarga ? { prontos: new Set(), tvMs } : null; // (quem já carregou a pista; `liberarCarga` encurta a TV quando todos chegam)
    room.startAt = (room.tvAte || Date.now()) + (f1 ? Math.round(LUZES_MS + (4 + room.luzes.espera) * 1000) : COUNTDOWN_MS);
    room.endAt = null;
    room.clima = room.sorteioClima ? { ...room.sorteioClima.corrida, t0: room.startAt } : null; // o relógio da chuva começa na largada
    room.finishOrder = [];
    // grid: o da classificação; nas regras de F1 sem classificação, a ordem dos pilotos da sala; senão, embaralhado a cada corrida
    // (corrida rápida de F1, sem classificação: o grid é sorteado, humanos e robôs misturados, pela semente do GP; a carreira sempre tem classificação)
    const sorteado = () => { const l = [...room.order], r = F1.sorteio(`grid:${room.semente}`); for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; } return l; };
    const ids = grid ? [...grid.filter((id) => room.players[id]), ...room.order.filter((id) => !grid.includes(id))] : f1 ? (room.temporada ? [...room.order] : sorteado()) : [...room.order].sort(() => Math.random() - 0.5);
    // (2026-11-21) a punição de grid dos eventos da carreira (paddock.js modificadores: o motor trocado fora da cota) só na corrida, depois da classificação
    for (const id of [...ids]) { const n = room.players[id].gpMods && room.players[id].gpMods.grid; if (n > 0) { const i = ids.indexOf(id), j = Math.min(ids.length - 1, i + n); ids.splice(i, 1); ids.splice(j, 0, id); } }
    ids.forEach((id, i) => Object.assign(room.players[id], { grid: i, laps: 0, sector: T.SECTORS - 1, started: false, finish: null, estimado: false, best: null, last: null, lapStart: null, lastPos: 0 }));
    // regras de F1: a semente do GP (os erros dos mecânicos saem dela) e o pit stop de cada um começa do zero
    // quem não escolheu o pneu (fora da carreira) e larga com a pista molhada vai de pneu de chuva, em vez do médio padrão
    const largaMolhado = f1 && F1.climaEm(room.clima, room.startAt).agua >= F1.AGUA_MOLHADA;
    if (largaMolhado && !room.temporada) for (const id of ids) { const p = room.players[id]; if (!p.bot && !p.pneuEscolhido) p.pneu = "chuva"; }
    for (const id of ids) { const p = room.players[id]; Object.assign(p, { paradas: [], consertos: [], compostos: [p.pneu || F1.COMPOSTO_PADRAO], pneuAtual: p.pneu || F1.COMPOSTO_PADRAO, acrescimo: 0, box: null, boxFant: 0 }); }
    for (const id of ids) room.players[id].bonusBox = bonusDoBox(room, room.players[id]); // (2026-11-23) os segundos que os engenheiros tiram de cada parada, na garagem (sim.js e os robôs)
    Itens.start(room);
    room.nivelEmPedacos = true; // (o ritmo de cada robô é calculado aos pedaços, durante o carregamento: corrida-robos.js, aquecerNiveis)
    Robos.largar(room);
    // A preparação pode demorar em uma pista fria: a contagem só começa depois que o grid está pronto.
    const tempoPreparoGrid = Date.now() - inicioPreparoGrid;
    room.startAt += tempoPreparoGrid;
    if (room.tvAte) room.tvAte += tempoPreparoGrid;
    if (room.clima) room.clima.t0 = room.startAt;
    if (room.grupo) for (const id of room.order) { const p = room.players[id]; if (!p.bot && !p.sockets.size) TRobo.assumir(room, p, (s) => log(room, s)); } // temporada em grupo: quem não chegou à largada tem o carro levado por um robô
    if (room.config.regras === "f1") {
      Direcao.iniciar(room);
      room.f1Timer = setInterval(() => { T.usarEscala(room.config.pista); Anos.usarAno(room.config.ano);
        if (room.phase !== "race") return;
        try { Gravacao.passo(room, Date.now(), (p) => pontoDoCarro(room, p)); } catch (e) { /* o replay é um extra: nunca para a corrida */ }
        for (const id of room.order) { const p = room.players[id]; if (p?.bot && p.pos && p.finish == null && !p.dnf) Direcao.registrar(room, p, p.pos, Date.now(), (s) => log(room, s)); }
        const quebrou = verificarFalhas(room), parou = Parados.passo(room, Date.now());
        if (Direcao.passo(room, Date.now(), (s) => log(room, s)) || quebrou || parou) broadcast(room);
      }, 100);
    } else room.direcao = null;
    if (room.ritmoRobos) { const tt = room.ritmoRobos; log(room, `🤖 Os robôs miram voltas de ${Math.floor(tt / 60)}:${(tt % 60).toFixed(1).padStart(4, "0")} (${room.config.regras === "f1" ? room.referenciaF1.origem ? "pelo recorde da pista" : "pela capacidade dos carros nesta pista" : "pela média das 5 melhores voltas de quem está na sala"}).`); }
    if (room.order.some((id) => room.players[id].bot)) {
      let tique = 0;
      const emit = (event, data) => nsp.to(room.code).emit(event, data);
      room.relogioRobos = null;
      room.botTimer = setInterval(() => { T.usarEscala(room.config.pista); Anos.usarAno(room.config.ano);
        // nas regras de F1, os robôs andam o tempo real que passou (o timer não bate certinho em 50 ms: Robos.tempoDoPasso)
        const dtRobos = room.config.regras === "f1" ? Robos.tempoDoPasso(room) : 0.05;
        if (dtRobos <= 0) return;
        logTravadaChuva(room, dtRobos);
        const t0Perf = PERF ? process.hrtime.bigint() : 0n; if (PERF) setImmediate(() => medirPerf(room, Number(process.hrtime.bigint() - t0Perf) / 1e6, dtRobos));
        Robos.passo(room, dtRobos, (p, s) => { if (onSector(room, p, s)) broadcast(room); }, (e, d) => {
          if (e === "box") { concluirParada(room, room.players[d.id], d); return broadcast(room); } // um robô acabou a parada
          if (e === "batida") { if (aplicarBatida(room, room.players[d.id], d.forca, d.tipo, Date.now(), d.chave)) broadcast(room); return; } // um robô bateu (no muro ou em outro carro)
          emit(e, d); if (e === "item:box" || e === "item:use") broadcast(room);
        });
        if (++tique % 2) return;
        // todos os robôs num pacote só (dois pacotes "volatile" seguidos: o segundo se perde)
        if (room.config.regras === "f1") return; // (nas regras de F1 os robôs vão no `snap` junto com os humanos)
        const lista = room.order.map((id) => room.players[id]).filter((p) => p && p.bot && p.pos).map((p) => ({ id: p.id, x: p.pos.x, y: p.pos.y, z: p.pos.z, a: p.pos.a, v: p.pos.v, prog: p.pos.prog, laps: p.laps, t: Date.now() }));
        nsp.to(room.code).volatile.emit("ghosts", lista);
      }, room.config.regras === "f1" ? ROBOS_F1_MS : 50); // (F1: os robôs andam a ~60 Hz; a 50 ms o Windows batia a cada 66,7 ms e as posições deles saíam em saltos de 15 por segundo, as microtravadas)
    }
    if (room.config.caixas) {
      let frame = 0;
      room.itemTimer = setInterval(() => { T.usarEscala(room.config.pista); Anos.usarAno(room.config.ano); Itens.tick(room, (event, data) => nsp.to(room.code).emit(event, data));
        if (++frame % 2 === 0) nsp.to(room.code).volatile.emit("item:hazards", Itens.publicHazards(room)); }, 50);
    }
    room.endTimer = setTimeout(() => endRace(room), tvMs + COUNTDOWN_MS + MAX_RACE_MS);
    log(room, `🏁 Largada em ${T.PISTAS[room.config.pista].name}, ${room.config.voltas} volta${room.config.voltas > 1 ? "s" : ""}.`);
  }
  // a semente do GP (os sorteios saem dela) e os robôs da sala
  function preparar(room) {
    room.semente = room.config.regras === "f1" ? (room.sementeFixa ?? room.sementeProx ?? Math.floor(Math.random() * 1e9)) : null;
    room.sementeProx = null;
    Robos.preparar(room, COLORS, rid);
    atribuirCarros(room); // quem tem equipe corre com o carro dela (os robôs já saem com o spec); a classificação já usa
    sortearClima(room);
  }
  // O clima do GP (regras de F1): a previsão e a chuva saem da semente do GP (o mesmo em qualquer recarga): chove com a chance da
  // previsão, dentro da janela prevista, e a opção de clima da sala (aleatório, seco, chuva, variável) manda nela. Se chove, a
  // classificação e a corrida têm cada uma o seu roteiro (f1-regras.js, `sortearClima`). `room.sorteioClima` guarda os dois;
  // `room.clima` é o da sessão que está valendo (o que vai no estado público), com o zero do relógio (`t0`) na largada da
  // sessão: a primeira classificação (Q1) ou as luzes apagando na corrida.
  function sortearClima(room) {
    room.clima = null; room.sorteioClima = null;
    if (room.config.regras !== "f1") return;
    const pista = room.config.pista, tab = require("./public/corrida/f1-pneus-ritmo.js").tabelaDe(pista), volta = (tab ? tab.volta : 75) * 1.12;
    const sessoes = F1.sessoesDeClassificacao(room.order.length).length;
    room.sorteioClima = F1.sortearClima(room.semente, { corrida: Math.round(volta * room.config.voltas + 15), quali: sessoes * (Robos.duracaoDaClassificacao(pista) + 13) }, room.config.clima, pista);
  }
  // a classificação (Q1, Q2 e Q3) antes da corrida das regras de F1; no fim ela chama startRace com o grid
  const classificacao = { log, broadcast, largar: (room, grid) => startRace(room, grid) };
  function iniciarClassificacao(room) { T.usarEscala(room.config.pista); Anos.usarAno(room.config.ano);
    if (aguardarTracado(room, () => iniciarClassificacao(room))) return;
    clearTimeout(room.endTimer); clearInterval(room.itemTimer); clearInterval(room.botTimer); clearInterval(room.f1Timer); clearInterval(room.humanosTimer);
    preparar(room);
    room.phase = "quali"; room.resultado = null; room.luzes = null; room.finishOrder = [];
    room.clima = room.sorteioClima ? { ...room.sorteioClima.quali } : null; // (o `t0` vem na abertura do Q1: corrida-f1-classificacao.js)
    for (const id of room.order) delete room.players[id].sim;
    ligarHumanos(room);
    // (2026-11-23) os robôs pilotam a classificação (como fantasmas): o mesmo passo da corrida, com os setores pela conta da classificação (onSector)
    room.relogioRobos = null; clearInterval(room.botTimer);
    if (room.config.regras === "f1" && room.order.some((id) => room.players[id].bot)) room.botTimer = setInterval(() => { if (room.phase !== "quali") return; T.usarEscala(room.config.pista); Anos.usarAno(room.config.ano);
      const dt = Robos.tempoDoPasso(room); if (dt <= 0) return;
      try { Robos.passo(room, dt, (p, s) => { if (onSector(room, p, s)) broadcast(room); }, () => {}); } catch (e) { console.warn("Classificação: passo dos robôs", e.message); }
    }, 50);
    Quali.iniciar(room, classificacao);
  }
  // (2026-11-23, o Thiago: "os robôs dão uma travadinha quando muda o clima"; a leitura do código não achou a causa) um log temporário: com o
  // clima ligado, avisa no console do servidor quando o passo dos robôs demora mais de 20 ms ou quando o timer chega atrasado (algo travou o
  // servidor entre dois passos), com a água, a chuva e quantos robôs estão no box. Tirar quando a causa aparecer.
  function logTravadaChuva(room, dt) {
    if (!room.clima || room.config.regras !== "f1") return;
    const t0 = process.hrtime.bigint(), cl = F1.climaEm(room.clima, Date.now());
    const resumo = () => { const bots = room.order.map((id) => room.players[id]).filter((p) => p && p.bot); return `água ${cl.agua.toFixed(2)}, chuva ${cl.chuva.toFixed(2)}, ${bots.filter((p) => p.box).length}/${bots.length} robôs no box, volta ${Math.max(0, ...bots.map((p) => p.laps || 0))}`; };
    if (dt > 0.12) console.warn(`[travada-chuva] timer atrasado: ${Math.round(dt * 1000)} ms desde o último passo (${resumo()})`);
    setImmediate(() => { const ms = Number(process.hrtime.bigint() - t0) / 1e6; if (ms > 20) console.warn(`[travada-chuva] passo dos robôs: ${ms.toFixed(1)} ms (${resumo()})`); });
  }
  // o bônus dos mecânicos e estrategistas da equipe, por parada (temporada solo: uma equipe; em grupo: uma por equipe humana)
  // os segundos que os engenheiros (mecânico 0,5 s e estrategista 0,25 s por nível) tiram de CADA parada desta equipe, na garagem
  function bonusDoBox(room, p) {
    if (!room.temporada) return 0;
    return room.bonusBoxEquipes ? room.bonusBoxEquipes[p.equipe] || 0 : p.equipe === room.equipeTemporada ? room.bonusBox || 0 : 0;
  }
  return { liberarCarga, startRace, classificacao, iniciarClassificacao };
};
