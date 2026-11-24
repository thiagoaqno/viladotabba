// Corrida da Galera — a conexão de cada navegador no canal /corrida: criar e entrar na sala, os comandos e a saída.
// Parte de corrida.js.
const T = require("../../public/corrida/pistas.js");
const Anos = require("../../public/corrida/f1-temporadas.js"); // a temporada (2023 a 2026) da sala: equipes, pilotos e força dos carros daquele ano
const Itens = require("./corrida-itens.js");
const F1 = require("../../public/corrida/f1-regras.js"); // as regras de F1 (os pneus), opção da sala
const Direcao = require("./corrida-f1-direcao.js");
const Quali = require("./corrida-f1-classificacao.js"); // a classificação (Q1, Q2, Q3) que define o grid das regras de F1
const Robos = require("./corrida-robos.js"); // os robôs (rodam aqui no servidor)
const Gravacao = require("./corrida-gravacao.js"); // o replay da tela do resultado: a fração da volta e a telemetria de cada carro a cada 250 ms, e as ultrapassagens
const Humanos = require("./corrida-humanos.js"); // os humanos nas regras de F1: o servidor anda o carro com as entradas do piloto (autoridade)
const Contato = require("./corrida-contato.js"); // as batidas entre carros (e quem está fantasma por causa do box)
const Pecas = require("../../public/corrida/f1-pecas.js"); // as peças do carro (modo carreira), que viram a montagem
const Equipes = require("../../public/corrida/f1-equipes.js"); // as equipes de 2026, o orçamento em pontos e a montagem do carro
const Pilotos = require("../../public/corrida/f1-pilotos-2026.js");
const TRobo = require("./corrida-temporada-robo.js"); // o robô que leva o carro de quem cai no meio do GP da temporada em grupo
const bd = require("../comum/bd.js");
const { SKINS } = require("../../public/pelada/campo.js"); // o piloto do kart usa as skins da Pelada
const { rid, novoCodigo, limparNome: cleanName, ok, falha: fail, contexto, ligarSocket, buscarSala, quemVolta, nomeEmUso, limparSalasParadas } = require("../comum/salas.js"); // as peças de sala que todo jogo repete
const { LUZES_MS, MAX_PLAYERS, COLORS, PAWNS, int, num, limparCapacete } = require("./corrida-base.js");
module.exports = (C) => {
  const { nsp, rooms, cleanConfig, CONFIG_SALA_NOVA, log, entrarNaEquipe, humanosDa, chefes, limparMontagens, atribuirCarros, broadcast, liberarCarga, startRace, classificacao, iniciarClassificacao, aprenderAgora, endRace, concluirParada, corredorDe, onSector, aplicarBatida, entrouNoGP, agendarAssumir } = C;
  nsp.on("connection", (socket) => {
    const ctx = () => { const c = contexto(socket, rooms); if (c.room) { T.usarEscala(c.room.config.pista); Anos.usarAno(c.room.config.ano); } return c; }; // (Formula GP: a escala da sala vale para tudo que vem a seguir, pistas.js usarEscala)
    const bind = (room, pid) => ligarSocket(socket, rooms, room, pid);
    function addPlayer(room, name, skin) {
      const usedP = new Set(Object.values(room.players).map((p) => p.pawn)), usedC = new Set(Object.values(room.players).map((p) => p.color));
      const id = rid(6);
      room.players[id] = { id, name, token: rid(), pawn: PAWNS.find((x) => !usedP.has(x)), color: COLORS.find((c) => !usedC.has(c)), skin: SKINS[skin] ? skin : "padrao", car: "equilibrado", equipe: null, mods: { ...T.MODS_PADRAO }, pneu: F1.COMPOSTO_PADRAO, grid: room.order.length, laps: 0, sector: T.SECTORS - 1, started: false, finish: null, best: null, last: null, sockets: new Set() };
      room.order.push(id);
      return room.players[id];
    }

    socket.on("create", (data = {}, cb) => {
      const name = cleanName(data.name);
      if (!name) return fail(cb, "Coloque o seu nome.");
      const room = { code: novoCodigo(rooms), host: null, phase: "lobby", config: cleanConfig(data.config || CONFIG_SALA_NOVA), players: {}, order: [], finishOrder: [], log: [], t: Date.now(), ...(data.config ? {} : { salaNova: true }) };
      rooms.set(room.code, room);
      const p = addPlayer(room, name, data.skin);
      { const cap = limparCapacete(data.capacete); if (cap) p.mods = { ...p.mods, capacete: cap }; } // o capacete de quem joga já na criação: a corrida rápida larga direto, sem passar pela sala
      // `inicio` vem da tela inicial (Corrida rápida e Contrarrelógio): a equipe da garagem, o pneu e, com `largar`, a corrida já começa
      const inicio = data.inicio && typeof data.inicio === "object" ? data.inicio : null, f1 = room.config.regras === "f1";
      if (f1 && (room.salaNova || inicio)) entrarNaEquipe(room, p, inicio?.equipe);
      if (f1 && inicio && Object.hasOwn(F1.PNEUS, String(inicio.pneu))) { p.pneu = inicio.pneu; p.pneuEscolhido = true; }
      room.host = p.id;
      bind(room, p.id);
      log(room, `Box aberto por ${name}.`);
      ok(cb, { code: room.code, id: p.id, token: p.token });
      broadcast(room);
      if (inicio?.largar === true) { if (f1 && room.config.classificacao !== "pular") iniciarClassificacao(room); else startRace(room); }
    });

    socket.on("join", (data = {}, cb) => {
      const room = buscarSala(rooms, data.code);
      if (!room) { const irPara = require("../comum/lobby.js").enderecoDaTemporada(data.code); if (irPara && typeof cb === "function") return cb({ ok: false, irPara, error: "Esse código é de uma temporada." }); return fail(cb, "Sala não encontrada. Confira o código (se o servidor reiniciou, a sala se perdeu)."); }
      const back = quemVolta(room, data);
      if (back) { clearTimeout(room.abandonoTimer); clearTimeout(back.assumeTimer); bind(room, back.id); if (room.grupo && back.assumido) TRobo.devolver(room, back, (s) => log(room, s)); ok(cb, { code: room.code, id: back.id, token: back.token }); if (room.temporada && room.phase === "lobby") entrouNoGP(room); return broadcast(room); }
      if (room.privada && !(room.grupo && data.watch && room.espectadores.has(data.token))) return fail(cb, "GP privado da temporada. Entre pela sede.");
      if (data.watch || room.phase === "race" || room.phase === "quali") {
        if (!data.watch) return fail(cb, "A corrida já começou. Você pode entrar para assistir.");
        bind(room, null); ok(cb, { code: room.code, id: null }); return broadcast(room);
      }
      const name = cleanName(data.name);
      if (!name) return fail(cb, "Coloque o seu nome.");
      if (room.order.length >= MAX_PLAYERS) return fail(cb, `A sala já tem ${MAX_PLAYERS} pilotos. Você pode entrar para assistir.`);
      if (nomeEmUso(room, name)) return fail(cb, "Já tem alguém com esse nome na sala.");
      const p = addPlayer(room, name, data.skin);
      if (room.salaNova && room.config.regras === "f1") entrarNaEquipe(room, p); // quem chega numa sala nova também já entra com uma equipe livre
      bind(room, p.id);
      log(room, `${name} chegou ao box.`);
      ok(cb, { code: room.code, id: p.id, token: p.token });
      broadcast(room);
    });

    socket.on("act", (data = {}, cb) => {
      const { room, me } = ctx();
      if (!room) return fail(cb, "Você não está numa sala.");
      const type = data.type, isHost = me && room.host === me.id;
      if (room.temporada && !["qpronto", "confirmarLargada", "montagemGrid", "box", "batida", "sector", "pneu", "tvpular", "carregou", "mods", "abandonar"].includes(type)) return fail(cb, "Este GP é controlado pela sede da temporada.");
      const err = (() => {
        if (type === "color") {
          if (!me || room.phase === "race") return "Só dá para trocar fora da corrida.";
          if (!COLORS.includes(data.color)) return "Cor inválida.";
          if (Object.values(room.players).some((p) => p !== me && p.color === data.color)) return "Essa cor já é de outro piloto.";
          me.color = data.color; return;
        }
        if (type === "skin") { if (!me || room.phase === "race") return "Só dá para trocar fora da corrida."; if (!SKINS[data.skin]) return "Skin inválida."; me.skin = data.skin; return; }
        if (type === "car") {
          if (!me || room.phase === "race") return "Só dá para trocar de carro fora da corrida.";
          if (!T.CARROS[data.car]) return "Carro inválido.";
          me.car = data.car; return;
        }
        if (type === "mods") { // a pintura do carro
          if (!me || room.phase === "race") return "Só dá para mexer no carro fora da corrida.";
          const d = data.mods || {}, n = { ...me.mods };
          if (!room.temporada) for (const k of Object.keys(T.MODS)) if (T.MODS[k][d[k]]) n[k] = d[k]; // (na carreira, a pintura é a da equipe: só o capacete muda)
          if ("capacete" in d) n.capacete = limparCapacete(d.capacete); // o capacete de quem joga (f1-capacetes.js)
          for (const k of Object.keys(n)) if (!T.MODS[k] && k !== "capacete") delete n[k]; // opções antigas (rodas, aerofólio, faixa) saem
          if (!n.capacete) delete n.capacete;
          me.mods = n; return;
        }
        if (type === "pneu") { // o composto da largada (regras de F1)
          if (!me || room.phase === "race") return "Só dá para trocar o pneu fora da corrida.";
          if (room.quali && room.quali.confirmados.has(me.id)) return "Você já confirmou a largada.";
          if (!F1.PNEUS[data.pneu]) return "Pneu inválido.";
          me.pneu = data.pneu; me.pneuEscolhido = true; return;
        }
        if (type === "equipe") { // regras de F1: a equipe de 2026 (dois amigos podem dividir a mesma; o primeiro dela é o chefe)
          if (!me || room.phase !== "lobby") return "Só dá para escolher a equipe na sala, antes da largada.";
          if (room.config.regras !== "f1") return "A equipe vale só nas regras de Fórmula 1.";
          if (data.id == null || data.id === "") { me.equipe = null; limparMontagens(room); return; }
          const eq = Pilotos.EQUIPES[data.id];
          if (!eq || !Equipes.EQUIPES[data.id]) return "Equipe inválida.";
          if (me.equipe !== data.id && humanosDa(room, data.id).length >= 2) return `A ${eq.nome} já tem os dois carros ocupados.`;
          me.equipe = data.id;
          if (T.MODS.pintura[eq.pintura]) me.mods = { ...me.mods, pintura: eq.pintura }; // a pintura da equipe (dá para trocar depois)
          limparMontagens(room); return;
        }
        if (type === "montagem") { // regras de F1: só o chefe da equipe distribui os pontos; `montagem: null` volta para a padrão
          if (!me || room.phase !== "lobby") return "Só dá para montar o carro na sala, antes da largada.";
          if (room.config.regras !== "f1") return "A montagem vale só nas regras de Fórmula 1.";
          if (!me.equipe) return "Escolha uma equipe primeiro.";
          if (chefes(room)[me.equipe] !== me.id) return "Só o chefe da equipe monta o carro.";
          if (data.montagem == null && data.pecas == null) { if (room.montagens) delete room.montagens[me.equipe]; if (room.pecasEq) delete room.pecasEq[me.equipe]; limparMontagens(room); return; }
          const v = Pecas.resolver(me.equipe, data); // `pecas` (a escolha de peças) ou `montagem` (os níveis, formato antigo)
          if (!v.ok) return v.erro;
          room.montagens = { ...(room.montagens || {}), [me.equipe]: v.montagem };
          room.pecasEq = { ...(room.pecasEq || {}) }; if (v.pecas) room.pecasEq[me.equipe] = v.pecas; else delete room.pecasEq[me.equipe]; return;
        }
        if (type === "pawn") {
          if (!me || room.phase === "race") return "Só dá para trocar fora da corrida.";
          if (!PAWNS.includes(data.pawn)) return "Avatar inválido.";
          if (Object.values(room.players).some((p) => p !== me && p.pawn === data.pawn)) return "Esse avatar já é de outro piloto.";
          me.pawn = data.pawn; return;
        }
        if (type === "config") {
          if (!isHost || room.phase === "race" || room.phase === "quali") return "Só o organizador muda, fora da corrida.";
          room.config = cleanConfig(data.config); return;
        }
        if (type === "kick") {
          if (!isHost || room.phase === "race" || room.phase === "quali") return "Só o organizador, fora da corrida.";
          const p = room.players[data.id]; if (!p || p.id === me.id) return "Piloto inválido.";
          for (const sid of p.sockets) nsp.sockets.get(sid)?.emit("kicked");
          delete room.players[p.id]; room.order = room.order.filter((x) => x !== p.id); limparMontagens(room);
          log(room, `${p.name} saiu da sala.`); return;
        }
        if (type === "start") {
          if (!isHost) return "Só o organizador dá a largada.";
          if (room.phase === "race" || room.phase === "quali" || room.preparandoTracado) return; // um segundo clique não vira erro de permissão
          if (room.config.regras === "f1" && room.config.classificacao !== "pular") iniciarClassificacao(room); else startRace(room);
          return;
        }
        if (type === "reiniciar") { // corrida avulsa: o organizador recomeça do zero (a classificação também, se a sala tiver); na carreira não
          if (!isHost || room.temporada || room.grupo) return "Só o organizador, fora da carreira.";
          if (!["race", "quali", "results"].includes(room.phase)) return "Não há corrida para reiniciar.";
          clearTimeout(room.endTimer); clearInterval(room.itemTimer); clearInterval(room.botTimer); clearInterval(room.f1Timer); clearInterval(room.humanosTimer); Quali.cancelar(room); Robos.remover(room); room.resultado = null; room.phase = "lobby"; room.startAt = null; room.endAt = null; room.tvAte = null;
          log(room, `${me ? me.name : "O organizador"} reiniciou a corrida.`);
          if (room.config.regras === "f1" && room.config.classificacao !== "pular") iniciarClassificacao(room); else startRace(room);
          return;
        }
        if (type === "lobby") {
          if (!isHost) return "Só o organizador.";
          clearTimeout(room.endTimer); clearInterval(room.itemTimer); clearInterval(room.botTimer); clearInterval(room.f1Timer); clearInterval(room.humanosTimer); Quali.cancelar(room); Robos.remover(room); room.resultado = null; room.phase = "lobby"; room.startAt = null; room.endAt = null; room.tvAte = null; return;
        }
        if (type === "end") {
          if (!isHost || room.phase !== "race") return "Só o organizador encerra a corrida.";
          endRace(room); return;
        }
        if (!me) return "Você está só assistindo.";
        if (room.config.regras === "f1" && (type === "sector" || type === "box" || type === "batida")) return "ignorado"; // regras de F1: checkpoint, box e batida saem da física do servidor
        if (type === "qpronto") { // classificação: "já fiz a minha volta" (a sessão fecha quando todo mundo na pista disser)
          if (room.phase !== "quali" || room.quali.pausaAte) return "ignorado";
          Quali.pronto(room, me); Quali.verificarFim(room, classificacao); return;
        }
        if (type === "confirmarLargada") {
          if (room.phase !== "quali" || !room.quali || !room.quali.pausaAte) return "ignorado"; // (o grid final e, agora, as pausas entre as sessões)
          Quali.confirmarLargada(room, me, classificacao); return;
        }
        if (type === "montagemGrid") {
          if (!room.temporada || room.phase !== "quali" || !room.quali?.pausaAte || room.quali.carga) return "A montagem só muda nas pausas da classificação (a tela de ajustes).";
          if (room.quali.confirmados.has(me.id)) return "Você já confirmou a largada.";
          if (!me.equipe || !room.montagens?.[me.equipe]) return "Equipe inválida.";
          const v = Equipes.validar(me.equipe, data.montagem, room.bonusMontagem?.[me.equipe] || 0, room.montagens[me.equipe]);
          if (!v.ok) return v.erro;
          try { if (room.aoMontar) room.aoMontar(me, v.montagem); } catch (e) { return e.message || "Não foi possível salvar a montagem."; }
          room.montagens[me.equipe] = v.montagem;
          atribuirCarros(room);
          return;
        }
        if (type === "abandonar") { // (2026-11-23) quem joga abandona a corrida (DNF), pelo MFD: o carro sai da pista e o resto do grid segue
          if (!me || room.phase !== "race" || me.finish != null || me.dnf) return "ignorado";
          me.dnf = true; me.box = null; log(room, `🏳️ ${me.name} abandonou a corrida (DNF).`); return;
        }
        if (type === "box") { // regras de F1: entrou no corredor dos boxes (fase "entra") ou saiu dele com o pneu novo (fase "sai")
          if (room.config.regras !== "f1" || room.phase !== "race" || me.finish != null || !corredorDe(room)) return "ignorado";
          if (data.fase === "entra") {
            if (me.box || me.laps + 1 >= room.config.voltas) return "ignorado"; // na última volta o corredor passa pela chegada: sem box
            me.box = { entrou: Date.now(), volta: me.laps + 1 }; return;
          }
          if (data.fase === "sai") {
            if (!me.box) return "ignorado";
            if (!F1.PNEUS[data.composto]) return "Pneu inválido.";
            const box = me.box; me.box = null; me.boxFant = Date.now() + Contato.BOX_FANTASMA_MS;
            concluirParada(room, me, { composto: data.composto, tempo: (Date.now() - box.entrou) / 1000, volta: box.volta }); return;
          }
          return "Fase inválida.";
        }
        if (type === "batida") { // regras de F1: o navegador diz a força; o servidor confere com o carro, a velocidade e quem estava perto
          const forca = num(data.forca), car = T.CARROS[me.car] || T.CARROS.equilibrado;
          if (room.config.regras !== "f1" || room.phase !== "race" || !me.pos || !(forca > 0)) return "ignorado";
          const tipo = data.tipo === "carro" ? "carro" : "muro", agora = Date.now();
          const perto = tipo === "carro" ? room.order.some((id) => { const o = room.players[id]; return o && o !== me && !o.dnf && o.finish == null && o.pos && Math.abs((o.pos.z || 0) - me.pos.z) < 20 && Math.hypot(o.pos.x - me.pos.x, o.pos.y - me.pos.y) < 90; }) : true;
          const teto = Math.min(F1.BATIDA_MAX, car.vmax * 1.15, (Math.abs(me.pos.v || 0) + 80) * 1.3);
          if (!perto || agora - me.pos.at > 1500) return "ignorado";
          if (!aplicarBatida(room, me, Math.min(forca, teto), tipo)) return "ignorado";
          return;
        }
        if (type === "carregou") { // regras de F1: este jogador já carregou a pista; com todos os conectados prontos, a TV encurta para o tempo dela a partir de agora
          if (!me) return "ignorado";
          if (room.phase === "quali" && room.quali?.carga) { Quali.carregou(room, me.id, classificacao); return; } // (a classificação: o Q1 abre quando todos chegam)
          if (!room.carga || room.phase !== "race") return "ignorado";
          room.carga.prontos.add(me.id); liberarCarga(room); broadcast(room); return;
        }
        if (type === "tvpular") { // regras de F1: pulou a transmissão de TV; quando todos os humanos presentes pulam, as luzes vêm já
          const agora = Date.now();
          if (room.config.regras !== "f1" || room.phase !== "race" || !room.tvAte || agora >= room.tvAte - 400 || room.tvPulos.has(me.id)) return "ignorado";
          room.tvPulos.add(me.id);
          if (room.order.some((id) => { const q = room.players[id]; return q && !q.bot && q.sockets.size && !room.tvPulos.has(id); })) return "ignorado"; // ainda falta gente: só esconde para quem pulou
          room.tvAte = agora; room.startAt = agora + Math.round(LUZES_MS + (4 + room.luzes.espera) * 1000);
          if (room.clima) room.clima.t0 = room.startAt;
          return;
        }
        if (type === "sector") {
          if (!onSector(room, me, int(data.s, -1))) return "ignorado";
          return;
        }
        return "Ação desconhecida.";
      })();
      if (err === "ignorado") return ok(cb, { ignored: true });
      if (err) return fail(cb, err);
      ok(cb);
      broadcast(room);
    });

    socket.on("item:pick", (d = {}) => {
      const { room, me } = ctx(); if (!room || !me) return;
      if (Itens.pick(room, me, int(d.i, -1), (event, data) => nsp.to(room.code).emit(event, data))) broadcast(room);
    });
    socket.on("item:use", (d = {}) => {
      const { room, me } = ctx(); if (!room || !me) return;
      if (Itens.use(room, me, d.back === true, (event, data) => nsp.to(room.code).emit(event, data))) broadcast(room);
    });

    // a análise do GP que acabou (a tela do resultado pede uma vez: resultado-analise.js)
    socket.on("analise", (cb) => {
      if (typeof cb !== "function") return;
      const { room } = ctx();
      cb(room && room.phase === "results" && room.analiseGP ? { startAt: room.startAt || null, ...room.analiseGP } : null);
    });

    // o replay do GP que acabou (corrida-gravacao.js): só quando a aba Replay ou Ultrapassagens pede
    socket.on("replay", (cb) => {
      if (typeof cb !== "function") return;
      const { room } = ctx();
      let r = null; try { r = room && room.phase === "results" ? Gravacao.replay(room) : null; } catch (e) { r = null; }
      cb(r ? { startAt: room.startAt || null, ...r } : null);
    });

    // Voltas de corrida e classificação (amostras a cada 0,1 s) ensinam até cinco traçados.
    // O tempo e a sequência precisam coincidir com a volta medida pelo servidor.
    socket.on("volta", (d = {}) => {
      const { room, me } = ctx();
      if (!room || !me || me.bot) return;
      const quali = d.quali != null ? me.qUltima : null;
      if (d.quali != null && (!quali || quali.id !== d.quali || me.qVoltaEnviada === quali.id || Date.now() - quali.fim > 15000)) return;
      if (!quali && (!Number.isFinite(me.last) || me.voltaEnviada === me.laps)) return;
      const tempo = quali ? quali.tempo : me.last;
      const s = d.s, pista = room.config.pista, t = T.PISTAS[pista];
      if (!Array.isArray(s) || s.length < 100 || s.length > 4000 || tempo < t.minLap) return;
      if (!s.every((a) => Array.isArray(a) && a.length === 6 && a.every(Number.isFinite) && a[1] >= 0 && a[2] >= 0 && a[1] <= t.world && a[2] <= t.world)) return;
      if (Math.abs((s[s.length - 1][0] - s[0][0]) / 1000 - tempo) > 1.5) return;
      if (quali) me.qVoltaEnviada = quali.id; else me.voltaEnviada = me.laps;
      let nova = 0;
      try { nova = bd.salvarVoltaCorrida(pista, tempo, me.car, me.name, s); } catch (e) { console.warn("Corrida: volta não guardada", e.message); }
      // As cinco voltas mais rápidas da pista alimentam os traçados da próxima largada.
      // (2026-11-16) aprender joga fora a conta de ritmo da pista, e refazer custa 140 a 200 ms por robô (Baku, 21 robôs: segundos de servidor parado,
      // os outros carros pulando na tela). No meio do qualify ou da corrida fica para depois da bandeirada (endRace).
      if (nova > 0) { if (room.phase === "race" || room.phase === "quali") room.aprenderPendente = { nome: me.name }; else aprenderAgora(room, me.name); }
    });

    // o relógio: o navegador pergunta a hora do servidor várias vezes e fica com a resposta de menor ida e volta (pose.js, criarRelogio)
    socket.on("clock", (cb) => typeof cb === "function" && cb(Date.now()));

    // regras de F1: as entradas do piloto, um número por passo da física (corrida-humanos.js)
    socket.on("inp", (d) => {
      const { room, me } = ctx();
      if (!room || !me || me.bot) return;
      Humanos.entrada(room, me, d);
    });

    // posição do meu carro (10 por segundo): vai para os outros (só nas salas sem as regras de F1; nelas o servidor anda o carro)
    socket.on("pos", (d = {}) => {
      const { room, me } = ctx();
      if (!room || !me || me.dnf || room.config.regras === "f1" || (room.phase !== "race" && room.phase !== "quali")) return;
      if (room.phase === "quali" && (room.quali.pausaAte || !room.quali.ativos.includes(me.id))) return; // só quem está na sessão
      const now = Date.now();
      if (now - (me.lastPos || 0) < 50) return;
      me.lastPos = now;
      const x = num(d.x), y = num(d.y), a = num(d.a), v = num(d.v), prog = num(d.prog);
      if (![x, y, a].every(Number.isFinite)) return;
      const z = num(d.z);
      const world = T.PISTAS[room.config.pista].world;
      if (x < 0 || y < 0 || x > world || y > world) return;
      const pos = { x, y, z: Number.isFinite(z) ? z : 0, a, v: Number.isFinite(v) ? v : 0, prog: Number.isFinite(prog) ? prog : 0, at: now };
      if (room.config.regras === "f1" && room.phase === "race") { const penal = me.penal || 0; Direcao.registrar(room, me, pos, now, (s) => log(room, s)); if ((me.penal || 0) !== penal) broadcast(room); } // a penalidade aparece na hora
      else me.pos = pos;
      socket.to(room.code).volatile.emit("ghost", { id: me.id, x, y, z: Number.isFinite(z) ? Math.max(-50, Math.min(400, z)) : 0, a, v: Number.isFinite(v) ? v : 0, prog: Number.isFinite(prog) ? prog : 0, laps: me.laps, t: now });
    });

    socket.on("disconnect", () => {
      const { room, me } = ctx();
      if (!room) return;
      if (me) me.sockets.delete(socket.id);
      if (room.grupo) { if (me && !me.sockets.size && room.phase === "race") agendarAssumir(room, me); } // (na classificação quem sai só fica sem tempo)
      else if (room.temporada && me && !me.sockets.size && (room.phase === "race" || room.phase === "quali")) {
        clearTimeout(room.abandonoTimer);
        room.abandonoTimer = setTimeout(() => { if (me.sockets.size || room.phase === "results") return; me.dnf = true; log(room, `${me.name} abandonou o GP (DNF).`); if (room.phase === "quali") Quali.verificarFim(room, classificacao); broadcast(room); }, 20000);
      }
      if (room.phase === "quali") { Quali.verificarFim(room, classificacao); Quali.verificarLargada(room, classificacao); } // quem saiu não segura a sessão nem a confirmação
      if (!room.temporada && room.phase === "race" && room.finishOrder.length && !room.order.some((id) => room.players[id].finish == null && room.players[id].sockets.size)) endRace(room);
      broadcast(room);
    });
  });
  return {};
};
