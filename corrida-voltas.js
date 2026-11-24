// Corrida da Galera — as voltas: os setores, a chegada, os recordes, a parada no box, as batidas e o que os robôs aprendem
// com as voltas de quem joga. Parte de corrida.js.
const T = require("./public/corrida/pistas.js");
const Anos = require("./public/corrida/f1-temporadas.js"); // a temporada (2023 a 2026) da sala: equipes, pilotos e força dos carros daquele ano
const F1 = require("./public/corrida/f1-regras.js"); // as regras de F1 (os pneus), opção da sala
const Direcao = require("./corrida-f1-direcao.js");
const Sim = require("./public/corrida/sim.js");
const Quali = require("./corrida-f1-classificacao.js"); // a classificação (Q1, Q2, Q3) que define o grid das regras de F1
const Robos = require("./corrida-robos.js"); // os robôs (rodam aqui no servidor)
const Gravacao = require("./corrida-gravacao.js"); // o replay da tela do resultado: a fração da volta e a telemetria de cada carro a cada 250 ms, e as ultrapassagens
const Analise = require("./corrida-analise.js"); // as voltas, os setores e as posições que a aba Análise da carreira mostra
const Setores = require("./corrida-setores.js"); // a conta dos setores sem travar a volta por um aviso perdido
const Contato = require("./corrida-contato.js"); // as batidas entre carros (e quem está fantasma por causa do box)
const bd = require("./bd.js");
const noite = require("./noite.js"); // o placar da Noite da Galera (quem ganhou e quem perdeu cada partida)
const { nomesDe, ESPERA_CHEGADA, AFTER_FIRST_MS } = require("./corrida-base.js");
module.exports = (C) => {
  const { nsp, nameOf, log, specDe, broadcast, corredorDe, pontoDoCarro } = C;
  // Quando todos os humanos terminaram, projeta o restante dos robôs pelo progresso e pelo ritmo observado.
  // Um carro que abandonou ou foi desclassificado não recebe chegada estimada.
  function estimarRobos(room, now) {
    const n = Sim.criarPista(T.PISTAS[room.config.pista], room.config.pista).n;
    for (const id of room.order) {
      const p = room.players[id];
      if (!p.bot || p.finish != null || p.dnf || p.dsq || !p.pos || !Number.isFinite(p.pos.prog)) continue;
      const fracao = p.started ? ((p.pos.prog % n) + n) % n / n : 0;
      const faltam = Math.max(0, room.config.voltas - (p.laps || 0) - fracao);
      const referencia = p.last || p.best || Robos.idealDe(room.config.pista, p.spec || p.car);
      if (!Number.isFinite(referencia) || referencia <= 0) continue;
      p.finish = Math.max(0, (now - room.startAt) / 1000) + faltam * referencia;
      p.estimado = true; p.laps = room.config.voltas;
      if (p.stopGo) { p.stopGo = null; p.penal = (p.penal || 0) + F1.STOPGO_CONVERSAO_S; p.acrescimo = (p.acrescimo || 0) + F1.STOPGO_CONVERSAO_S; }
      const mais = F1.acrescimoDeFinal(p, room.config.voltas, !!(room.clima && room.clima.chove));
      if (mais) p.acrescimo = (p.acrescimo || 0) + mais;
      room.finishOrder.push(id);
    }
  }
  // (2026-11-23, o Thiago: "os bots deviam aprender comigo... voltas limpas ou com até 2 toques no muro... no fim de cada corrida") cada volta de quem joga
  // fica anotada com o pneu, a água e os toques; no fim da corrida (aprenderRitmo) as que servem viram o ritmo aprendido (bd.aprenderRitmoCorrida).
  // Não servem: a 1ª volta (largada parada), a volta com box (a de entrada e a de saída), com safety car, com toque em carro, com saída de pista (o limite
  // de pista da direção de prova, corrida-f1-direcao.js registrar) ou com mais de 2 toques no muro.
  function anotarVoltaParaRobos(room, p, lap, ini, fim) {
    const paradas = (p.paradas || []).length, sc = !!room.direcao?.safety || !!p.scNaVolta, pneu = (p.sim && p.sim.c && p.sim.c.pneu) || (p.ia && p.ia.pneu); // (o robô: o pneu da IA)
    const agua = room.clima ? (F1.climaEm(room.clima, ini).agua + F1.climaEm(room.clima, fim).agua) / 2 : 0;
    const saiu = (p.avisosLimite || 0) > (p.limitesAntes ?? (p.avisosLimite || 0)) || !!p.fora;
    const v = { t: lap, muros: p.murosNaVolta || 0, carro: !!p.carroNaVolta, saiu, box: paradas !== (p.paradasAntes ?? paradas) || !!p.boxNaVolta || !!p.box, sc, primeira: p.laps <= 1,
      composto: (pneu && pneu.composto) || p.pneuAtual || F1.COMPOSTO_PADRAO, desgaste: (pneu && pneu.desgaste) || 0, agua };
    (p.voltasRobos ||= []).push(v); if (p.voltasRobos.length > 200) p.voltasRobos.shift();
    p.murosNaVolta = 0; p.carroNaVolta = false; p.limitesAntes = p.avisosLimite || 0; p.boxNaVolta = !!p.box; p.scNaVolta = !!room.direcao?.safety; p.paradasAntes = paradas;
  }
  // A volta de cada um vira a razão "volta ÷ volta ideal do carro dele, com aquele pneu e aquela água" (Robos.razaoDaVolta): o carro fica descontado.
  // Quem joga: a mediana por condição e pneu vai para corrida_ritmo_aprendido. E, com robôs do Difícil para cima (todos no limite do carro), a
  // PROXIMIDADE: a razão de quem joga dividida pela dos robôs da mesma corrida (sem o carro a mais do nível: Robos.semReforco). É ela que decide o
  // carro a mais do 100 ao 150 (corrida-robos.js forcaDoReforco). (2026-11-23: a conta sozinha não servia: em Suzuka o Thiago fica a 0,96 da volta
  // ideal, mais rápido que o Difícil na conta, mas na pista o robô do 100 já faz 41,30 contra as 42,16 dele.)
  function aprenderRitmo(room) {
    if (room.config.regras !== "f1" || !room.order.some((id) => room.players[id]?.bot)) return;
    const pista = room.config.pista, boa = (v) => !v.primeira && !v.box && !v.sc && !v.carro && !v.saiu && v.muros <= Robos.TOQUES_MURO_MAX;
    const mediana = (rs) => { rs.sort((a, b) => a - b); return rs[rs.length >> 1]; }; // (o ritmo de corrida, sem a volta perdida nem a melhor de todas)
    const robos = {}; // condição -> razões das voltas boas dos robôs
    for (const id of room.order) {
      const p = room.players[id]; if (!p || !p.bot || !p.voltasRobos) continue;
      for (const v of p.voltasRobos.filter(boa)) { const r = Robos.razaoDaVolta(pista, p.spec, { composto: v.composto, desgaste: v.desgaste }, v.agua, v.t); if (r) (robos[Robos.condicaoDaAgua(v.agua)] ||= []).push(r); }
      p.voltasRobos = [];
    }
    const noLimite = Robos.forcaDoNivel(room.config.nivel) >= Robos.MARCA_NIVEL.dificil, fator = Robos.semReforco(room);
    for (const id of room.order) {
      const p = room.players[id]; if (!p || p.bot || !p.voltasRobos || !p.voltasRobos.length) continue;
      const boas = p.voltasRobos.filter(boa); p.voltasRobos = [];
      const grupos = {}, porCond = {};
      for (const v of boas) {
        const r = Robos.razaoDaVolta(pista, p.spec, { composto: v.composto, desgaste: v.desgaste }, v.agua, v.t); if (!r) continue;
        const cond = Robos.condicaoDaAgua(v.agua); (grupos[`${cond}|${v.composto}`] ||= []).push(r); (porCond[cond] ||= []).push(r);
      }
      for (const [k, rs] of Object.entries(grupos)) {
        const [cond, comp] = k.split("|");
        if (bd.aprenderRitmoCorrida(pista, p.name, cond, comp, mediana(rs), rs.length) != null) log(room, `🤖 Os robôs anotaram o ritmo de ${p.name} (${cond}, ${(F1.PNEUS[comp] || {}).nome || comp}): ${rs.length} ${rs.length === 1 ? "volta" : "voltas"}.`);
      }
      for (const [cond, rs] of Object.entries(porCond)) {
        const rb = robos[cond]; if (!noLimite || !rb || rb.length < 3 || rs.length < 2) continue; // (abaixo do Difícil os robôs não andam no limite: não servem de régua)
        const prox = mediana(rs) / (mediana([...rb]) * fator);
        const nova = bd.aprenderProximidadeCorrida(pista, p.name, cond, prox, rs.length);
        if (nova != null) log(room, `🤖 ${p.name} ficou a ${((prox - 1) * 100).toFixed(1).replace(".", ",").replace(/^(?!-)/, "+")}% dos robôs do Difícil (${cond}).`);
      }
    }
  }
  function aprenderAgora(room, nome) {
    const pista = room.config.pista, t = T.PISTAS[pista];
    if (Robos.aprender(pista, bd.melhoresTracadosCorrida(pista))) { log(room, `🤖 Os robôs aprenderam a volta de ${nome} em ${t.name}.`); broadcast(room); }
  }
  function endRace(room) { T.usarEscala(room.config.pista); Anos.usarAno(room.config.ano);
    if (room.aprenderPendente) { const a = room.aprenderPendente; room.aprenderPendente = null; setImmediate(() => { try { aprenderAgora(room, a.nome); } catch (e) { console.warn("Corrida: os robôs não aprenderam a volta", e.message); } }); }
    if (room.phase !== "race") return;
    try { aprenderRitmo(room); } catch (e) { console.warn("Corrida: os robôs não aprenderam o ritmo", e.message); }
    clearTimeout(room.endTimer);
    clearInterval(room.itemTimer); clearInterval(room.botTimer); clearInterval(room.f1Timer); clearInterval(room.humanosTimer);
    room.phase = "results";
    // regras de F1: os acréscimos (um composto só, passar do limitador) mexem na ordem de chegada
    if (room.config.regras === "f1" && room.finishOrder.some((id) => room.players[id].acrescimo)) {
      const final = (id) => room.players[id].finish + (room.players[id].acrescimo || 0), antes = room.finishOrder.join();
      room.finishOrder.sort((a, b) => final(a) - final(b));
      if (room.finishOrder.join() !== antes) log(room, `⏱️ Com os acréscimos, ${nameOf(room, room.finishOrder[0])} fica com a vitória.`);
    }
    // regras de F1: o resultado do GP, com os pontos oficiais (quem fez menos de 90% das voltas é NC e não pontua)
    if (room.config.regras === "f1") {
      // (2026-11-16, Las Vegas: "eu ganhei do Verstappen, mas o jogo deu a vitória para ele") um robô com chegada ESTIMADA ainda estava na pista atrás
      // de quem cruzou a linha de verdade: nem a estimativa nem o bônus do box (os engenheiros, por parada) o põem na frente de um carro que já tinha chegado
      const finalDe = (p) => p.finish + (p.acrescimo || 0); // (o bônus do box já encurtou as paradas na pista: não mexe mais na ordem de chegada)
      const chegaram = room.order.map((id) => room.players[id]).filter((p) => p.finish != null && !p.dnf && !p.estimado);
      let piso = chegaram.length ? Math.max(...chegaram.map(finalDe)) : -Infinity;
      const estimados = room.order.map((id) => room.players[id]).filter((p) => p.finish != null && !p.dnf && p.estimado).sort((x, y) => finalDe(x) - finalDe(y));
      const ajuste = new Map(); for (const p of estimados) { const f = finalDe(p); if (f <= piso) { ajuste.set(p.id, piso + 0.1 - f); piso += 0.1; } else piso = f; }
      room.resultado = F1.classificacaoFinal(room.order.map((id) => { const p = room.players[id]; return { id, laps: p.laps, finish: p.finish, dnf: !!p.dnf, acrescimo: (p.acrescimo || 0) + (ajuste.get(id) || 0), prog: p.pos ? p.pos.prog : 0, best: p.best, dsq: !!p.dsq }; }), room.config.voltas)
        .map((r) => { const p = room.players[r.id]; return { ...r, voltas: p.laps, grid: p.grid, paradas: (p.paradas || []).length + (p.consertos || []).length, compostos: p.compostos || [], estimado: !!p.estimado, penal: p.penal || 0, sg: p.sgFeitos || 0, dano: p.dano || 0, batidas: p.batidas || 0, melhor: p.best }; });
      const v = room.resultado[0]; if (v) log(room, `🏆 ${nameOf(room, v.id)} venceu o GP e leva ${v.pontos} pontos.`);
      // a análise do GP (posição, tempo e setores de cada volta, pits e safety car: corrida-analise.js) para a tela do resultado de qualquer sala;
      // vai só quando o navegador pede (`analise`), e não no estado, que sai várias vezes por segundo. Um erro nela nunca pode perder o resultado.
      try { room.analiseGP = { ...Analise.resumo(room, (p) => p.id), ultrapassagens: Gravacao.listaUltrapassagens(room) }; } catch (e) { room.analiseGP = null; console.warn("Corrida: análise do GP:", e.message); }
    }
    if (room.finishOrder.length) noite.vitoria("corrida", room.code, nomesDe(room, room.finishOrder.slice(0, 1)), nomesDe(room, room.order.filter((id) => id !== room.finishOrder[0])));
    log(room, "🏆 Fim de corrida!");
    if (room.aoTerminarGP) { try { room.aoTerminarGP(room); } catch (e) { console.warn("Temporada F1: GP não salvo:", e.message); } }
    broadcast(room);
  }
  // os recordes da pista para sempre (bd.js, os 5 melhores, um por piloto). O tempo é o que o servidor mediu pelos
  // setores, então não depende do que o navegador manda. Entrou no quadro: todo mundo da sala fica sabendo.
  function registrarRecorde(room, p, lap) {
    let pos = 0;
    try { pos = bd.registrarRecordeCorrida(room.config.pista, lap, p.car, p.name); } catch (e) { console.warn("Corrida: recorde não guardado", e.message); }
    if (!pos) return;
    const pista = T.PISTAS[room.config.pista].name;
    log(room, pos === 1 ? `🏆 Recorde de ${pista}! ${p.name} fez ${lap.toFixed(3)} s.` : `🏆 ${p.name} entrou no quadro de ${pista}: ${pos}º, ${lap.toFixed(3)} s.`);
    nsp.to(room.code).emit("recorde", { piloto: p.name, pos, tempo: lap, pista: room.config.pista });
  }
  // o melhor de cada setor da pista (bd.js), da volta limpa que acabou de fechar
  function registrarSetores(room, p, ms) {
    try { ms.forEach((m, i) => bd.registrarSetorCorrida(room.config.pista, i, m / 1000, p.name)); } catch (e) { console.warn("Corrida: setor não guardado", e.message); }
  }
  // ---------- o pit stop (regras de F1) ----------
  // A parada acabou (o navegador diz ao sair do corredor; o robô, aqui mesmo): guarda volta, tempo e composto novo,
  // confere o limitador pelo tempo que ficou no corredor (rápido demais: RAPIDO s de acréscimo) e avisa no log.
  function concluirParada(room, p, d) {
    if (!p || ((!d.stopGo || d.troca) && !F1.PNEUS[d.composto])) return;
    // O serviço dos boxes recupera 90% do dano existente, também na visita de stop-and-go.
    p.dano = Math.max(0, (p.dano || 0) * 0.1);
    // (2026-11-23, o Thiago: "quando o carro quebra e você vai para os boxes não era para consertar?") a parada na corrida conserta a quebra
    // (sai do modo de emergência); a garagem leva F1.CONSERTO_QUEBRA_S a mais nesse caso (sim.js), então ir ao box custa tempo, mas salva a corrida
    if (p.quebrou && room.phase === "race") { p.quebrou = false; p.falhaEm = null; log(room, `🔧 ${p.name}: a equipe consertou o carro nos boxes.`); }
    if (room.phase === "quali") { // (2026-11-16) na classificação o box só troca o pneu: não conta como parada da corrida nem na regra dos compostos
      if (F1.PNEUS[d.composto]) { log(room, `🔧 ${p.name} foi aos boxes na classificação (${F1.PNEUS[d.composto].nome}).`); }
      return;
    }
    if (d.manter && !d.stopGo) { // "não trocar" (menu do box, ou o robô avariado com o pneu bom): parou só para consertar o carro; não gasta jogo de
      // composto (não entra em `paradas`, que é a regra dos pneus), mas fica anotado à parte para a análise contar todas as idas ao box
      const tempo = Math.round((d.tempo || 0) * 10) / 10; (p.consertos ||= []).push({ volta: d.volta, tempo });
      log(room, `🔧 ${p.name} parou nos boxes só para consertar o carro (${tempo} s).`); return;
    }
    if (p && d.stopGo) { // a visita incluiu o stop-and-go: cumprido; se o pneu foi trocado na mesma parada, o resto é uma parada normal (sem os segundos do stop-and-go)
      Direcao.cumprirStopGo(room, p, (s) => log(room, s));
      if (!d.troca) return;
      d = { ...d, tempo: Math.max(0, d.tempo - (d.sg || 0)), stopGo: false };
    }
    if (!p || !F1.PNEUS[d.composto]) return;
    d = { ...d, composto: F1.compostoParaParada(p, d.composto) }; // limite de 2 jogos de cada composto: o servidor troca o esgotado
    const n = (p.paradas || []).length + 1, tempo = Math.round(d.tempo * 10) / 10, motivo = [];
    F1.registrarParada(p, { volta: d.volta, tempo, composto: d.composto });
    const caro = corredorDe(room);
    if (!p.bot && caro && tempo < F1.tempoNoBox(caro, specDe(p).vmax, F1.paradaComBonus(F1.tempoDeParada(room.semente, p.id, n), p.bonusBox)) * 0.85 - 1) {
      p.acrescimo = (p.acrescimo || 0) + F1.RAPIDO; motivo.push(`passou do limitador: +${F1.RAPIDO} s`);
    }
    const parada = F1.tempoDeParada(room.semente, p.id, n); // o tempo sorteado pela semente: o box perfeito, o normal ou o ruim
    // (2026-11-16) na carreira o engenheiro comenta a parada (o box perfeito ou o ruim; os mecânicos da equipe já entram no bônus de box: bonusDoBox)
    if (!p.bot && room.temporada) { const cl = F1.classeDaParada(parada); if (cl !== "normal") nsp.to(room.code).emit("radio:equipe", { para: p.id, sit: cl === "perfeito" ? "boxrapido" : "boxlento" }); }
    log(room, `🔧 ${p.name} parou nos boxes (${F1.PNEUS[d.composto].nome}): ${F1.textoDaParada(parada)}, ${tempo.toFixed(1)} s no corredor.${motivo.length ? " " + motivo.join(", ") : ""}`);
  }
  // Setor novo: vale o próximo na ordem (ou, se um aviso se perdeu, o que o carro mostra estar ali: corrida-setores.js).
  // Voltar ao setor 0 depois do 11 fecha a volta (a primeira passagem é a largada).
  function onSector(room, p, s, now = Date.now()) { // (`now`: a hora do passo da física em que o carro cruzou o portão)
    if (room.phase === "quali") {
      const anterior = p.qUltima?.id, mudou = Quali.aoSetor(room, p, s, now);
      if (mudou && p.qUltima && p.qUltima.id !== anterior) for (const sid of p.sockets) nsp.sockets.get(sid)?.emit("quali:volta", p.qUltima);
      if (mudou) Quali.verificarFim(room, C.classificacao);
      return mudou;
    } // classificação: volta lançada
    if (room.phase !== "race" || p.finish != null) return false;
    if (now < room.startAt) { if (now < room.startAt - 2000) return false; now = room.startAt; } // (o relógio dos passos pode errar por alguns ms: um setor logo antes das luzes não pode ser jogado fora, senão o contador do servidor fica um setor atrás para sempre)
    if (p.dnf) return false;
    const ponto = pontoDoCarro(room, p), lista = Setores.setoresDoAviso(p.sector, s, ponto.idx, ponto.n, T.SECTORS, T.checkpoint);
    if (!lista.length) return false;
    let mudou = false;
    for (const x of lista) mudou = fecharSetor(room, p, x, now) || mudou;
    return mudou;
  }
  function fecharSetor(room, p, s, now) {
    if (p.finish != null) return false;
    p.sector = s;
    if (s !== 0) {
      Analise.setor(p, s, now);
      if (s % (T.SECTORS / 3) === 0) { const q = (p.parciais ||= []); if (q.length === s / (T.SECTORS / 3) - 1) q.push(now); } // a hora em que fechou o 1º e o 2º setor de tempo
      return true;
    }
    if (!p.started) { p.started = true; p.lapStart = room.startAt; p.parciais = []; return true; }
    const lap = (now - p.lapStart) / 1000;
    if (lap < T.PISTAS[room.config.pista].minLap) return false; // rápido demais: atalho (a volta não conta, mas o setor segue o do navegador, senão a volta seguinte morria)
    // a volta é "suja" se o carro bateu (no muro ou em outro carro: `p.batidas`, corrida-f1-direcao.js) ou ficou fantasma nela (batida,
    // muro ou recolocado na pista: `p.fantAte`): essa não ensina os robôs (o "volta" abaixo recusa)
    p.voltaSuja = (p.batidas || 0) > (p.batidasNaVolta || 0) || (p.fantAte || 0) > p.lapStart; p.batidasNaVolta = p.batidas || 0;
    const inicioDaVolta = p.lapStart, parciais = p.parciais || []; p.parciais = [];
    p.laps++; p.last = lap; p.best = p.best == null ? lap : Math.min(p.best, lap); p.lapStart = now;
    if (room.config.regras === "f1" && room.phase === "race") anotarVoltaParaRobos(room, p, lap, inicioDaVolta, now);
    if (room.config.regras === "f1") Analise.volta(room, p, lap, inicioDaVolta);
    // o quadro de recordes da Vila só leva volta de corrida com as regras de F1 e com robôs na pista
    if (!p.bot && room.config.regras === "f1" && room.order.some((id) => room.players[id]?.bot)) { registrarRecorde(room, p, lap); if (!p.voltaSuja && parciais.length === 2) registrarSetores(room, p, [parciais[0] - inicioDaVolta, parciais[1] - parciais[0], now - parciais[1]]); }
    // stop-and-go pendente: sem voltas para cumprir vira +20 s; passou das 3 voltas sem cumprir, bandeira preta (desclassificado)
    if (room.config.regras === "f1" && Direcao.voltaFechada(room, p, (s) => log(room, s))) {
      if (!room.order.some((id) => { const q = room.players[id]; return q.finish == null && !q.dnf && (q.sockets.size || q.bot); })) endRace(room);
      return true;
    }
    if (p.laps >= room.config.voltas) {
      p.finish = (now - room.startAt) / 1000;
      room.finishOrder.push(p.id);
      log(room, `🏁 ${p.name} cruzou a chegada em ${room.finishOrder.length}º.`);
      if (room.config.regras === "f1") { // a regra dos dois compostos
        const mais = F1.acrescimoDeFinal(p, room.config.voltas, !!(room.clima && room.clima.chove)); // (com chuva a regra não vale)
        if (mais) { p.acrescimo = (p.acrescimo || 0) + mais; log(room, `⏱️ ${p.name} usou um composto só: +${mais} s no resultado.`); }
      }
      // A chegada do último humano encerra o GP: os robôs ainda na pista recebem tempos estimados. (2026-11-21, o Thiago em Mônaco: "cheguei colado com
      // o Norris, a menos de 3 s, e com a minha punição ele ainda ficou atrás") o GP fechava NA HORA, e o Norris, a 2 s, ganhava um tempo estimado pela
      // fração da volta (no save, 9 s atrás e "9 voltas"). Agora quem está perto tem até ESPERA_CHEGADA para cruzar a linha de verdade; só quem
      // não cruzou até lá é estimado. Quando todos cruzam antes, o GP fecha na hora (o `racing` abaixo).
      const humanos = room.order.map((id) => room.players[id]).filter((q) => !q.bot);
      if (room.config.regras === "f1" && !p.bot && humanos.length && humanos.every((q) => q.finish != null || q.dnf || q.dsq)) {
        const restam = room.order.some((id) => { const q = room.players[id]; return q.bot && q.finish == null && !q.dnf && !q.dsq; });
        if (!restam) { endRace(room); return true; }
        clearTimeout(room.endTimer); room.endAt = now + ESPERA_CHEGADA;
        room.endTimer = setTimeout(() => { if (room.phase !== "race") return; estimarRobos(room, Date.now()); endRace(room); }, ESPERA_CHEGADA);
        return true;
      }
      const racing = room.order.filter((id) => room.players[id].finish == null && !room.players[id].dnf && (room.players[id].sockets.size || (room.config.regras === "f1" && room.players[id].bot)));
      if (!racing.length) endRace(room);
      else if (room.finishOrder.length === 1) { // o primeiro chegou: os outros têm um tempo para terminar
        const prazo = Robos.prazoDeChegada(room, AFTER_FIRST_MS);
        room.endAt = now + prazo;
        clearTimeout(room.endTimer);
        room.endTimer = setTimeout(() => endRace(room), prazo);
      }
    }
    return true;
  }

  // uma batida (de um humano ou de um robô): a punição e o dano ficam com a direção de prova; com a perda total de quem
  // ainda corria, a corrida pode ter acabado para todos
  function aplicarBatida(room, p, forca, tipo, quando = Date.now(), chave = tipo) {
    if (p && room.phase === "race") { // (2026-11-23) os toques da volta (de quem joga e dos robôs), para o ritmo aprendido (aprenderRitmo): no muro um a cada 2 s, como anotarToque
      if (tipo === "muro") { if (quando - (p.murosT || 0) >= 2000) { p.murosNaVolta = (p.murosNaVolta || 0) + 1; p.murosT = quando; } }
      else p.carroNaVolta = true;
    }
    if (room.temporada && String(chave).startsWith("carro:")) anotarRixa(room, p, room.players[String(chave).slice(6)], quando);
    if (room.temporada) anotarToque(room, p, String(chave).startsWith("carro:") ? room.players[String(chave).slice(6)] : null, tipo, quando);
    const b = Direcao.bater(room, p, forca, tipo, quando, (s) => log(room, s), chave);
    if (!b) return false;
    if (p.dnf && !room.order.some((id) => { const q = room.players[id]; return q.finish == null && !q.dnf && (q.sockets.size || q.bot); })) endRace(room);
    return true;
  }

  // (2026-11-16, a rivalidade) batida entre você e o rival da temporada: conta uma por par a cada 3 s (os dois carros avisam a mesma), com quem
  // causou (corrida-contato.js impactoDe); vai na análise do GP (corrida-temporada.js) e o Paddock guarda a rixa (paddock.js aoResultado). O
  // rádio avisa na hora.
  function anotarRixa(room, p, o, quando) {
    if (!p || !o) return;
    const rival = p.bot && p.piloto && p.piloto.rival ? p : o.bot && o.piloto && o.piloto.rival ? o : null, eu = rival === p ? o : p;
    if (!rival || !eu || eu.bot) return;
    const r = room.rixa || (room.rixa = { id: rival.piloto.id, n: 0, culpaSua: 0, culpaDele: 0, t: 0 }); if (quando - r.t < 3000) return;
    const i = Contato.impactoDe(room, eu.id, rival.id); r.t = quando; r.n++;
    if (i && i.culpado === eu.id) r.culpaSua++; else if (i && i.culpado === rival.id) r.culpaDele++;
    nsp.to(room.code).emit("radio:equipe", { para: eu.id, sit: "rivalbatida" });
  }
  // (2026-11-21, o Thiago: "eventos ligados ao que acontece na corrida: quantidade de batidas, dano no carro, toque com pilotos específicos")
  // os toques de quem joga na carreira: no muro (um a cada 2 s) e em cada piloto (um por par a cada 3 s, com quem causou). Vão para a análise
  // do GP (corrida-temporada.js, `corrida`) e o Paddock (paddock.js) tira os acontecimentos do fim de semana seguinte deles.
  function anotarToque(room, p, o, tipo, quando) {
    if (!p) return;
    const eu = !p.bot ? p : o && !o.bot ? o : null; if (!eu) return;
    const t = room.toques || (room.toques = { muros: 0, carros: 0, por: {}, tm: 0 });
    if (!o) { if (eu === p && tipo === "muro" && quando - t.tm >= 2000) { t.muros++; t.tm = quando; } return; }
    const outro = eu === p ? o : p, id = outro.bot && outro.piloto ? outro.piloto.id : null; if (!id) return;
    const r = t.por[id] || (t.por[id] = { n: 0, culpaSua: 0, culpaDele: 0, t: 0 }); if (quando - r.t < 3000) return;
    const i = Contato.impactoDe(room, eu.id, outro.id); r.t = quando; r.n++; t.carros++;
    if (i && i.culpado === eu.id) r.culpaSua++; else if (i && i.culpado === outro.id) r.culpaDele++;
  }
  return { estimarRobos, aprenderAgora, endRace, concluirParada, onSector, aplicarBatida };
};
