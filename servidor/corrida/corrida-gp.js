// Corrida da Galera — os GPs da carreira (solo e com os amigos): abrir a sala do GP, a TV da temporada e quem assume o carro
// de quem cai. Parte de corrida.js.
const T = require("../../public/corrida/pistas.js");
const F1 = require("../../public/corrida/f1-regras.js"); // as regras de F1 (os pneus), opção da sala
const Robos = require("./corrida-robos.js"); // os robôs (rodam aqui no servidor)
const Pilotos = require("../../public/corrida/f1-pilotos-2026.js");
const TRobo = require("./corrida-temporada-robo.js"); // o robô que leva o carro de quem cai no meio do GP da temporada em grupo
const { rid, novoCodigo, limparNome: cleanName, ok, falha: fail, contexto, ligarSocket, buscarSala, quemVolta, nomeEmUso, limparSalasParadas } = require("../comum/salas.js"); // as peças de sala que todo jogo repete
module.exports = (C) => {
  const { rooms, cleanConfig, log, broadcast, classificacao, iniciarClassificacao } = C;
  // O que a transmissão de TV mostra do campeonato (só em temporada): os 10 primeiros pilotos (mais os humanos que ficaram
  // de fora) e as 11 equipes, com os pontos de antes deste GP. `tab` é o `tabelas` da temporada (solo ou em grupo); no 1º GP
  // ninguém tem ponto e a tabela fica de fora (`vazia`). Só nome, equipe e pontos viajam: o resto da tabela fica no servidor.
  function resumoTV(tab, info, humano, equipeHumana) {
    if (!tab || !tab.pilotos.some((p) => p.pontos > 0)) return { ...info, vazia: true };
    const pil = tab.pilotos.map((p, i) => ({ pos: i + 1, nome: p.nome, equipe: p.equipe, pontos: p.pontos, ...(humano(p) ? { humano: 1 } : {}) }));
    return { ...info, pilotos: [...pil.slice(0, 10), ...pil.slice(10).filter((p) => p.humano)],
      equipes: tab.equipes.map((e, i) => ({ pos: i + 1, id: e.id, nome: e.nome, pontos: e.pontos, ...(equipeHumana(e) ? { humana: 1 } : {}) })) };
  }
  // ---------- conexões ----------
  function abrirGP(temporada, aoTerminarGP, aoMontar) {
    const gp = temporada.calendario[temporada.gp];
    if (!gp) throw Error("A temporada terminou.");
    const rivais = require("../../public/corrida/temporada/regras.js").desenvolvimentoRivais(temporada, [temporada.equipe], gp.pista); // (o carro dos rivais vem ajustado para esta pista, com os engenheiros deles)
    const room = { code: novoCodigo(rooms), host: null, phase: "lobby", config: cleanConfig({ ano: temporada.anoF1, regras: "f1", pista: gp.pista, voltas: F1.voltasDoGP(temporada.voltas, gp.pista), voltasDoGP: true, robos: Robos.GRID_F1 - 1, classificacao: "completa", nivel: temporada.nivel || "medio" }),
      players: {}, order: [], finishOrder: [], log: [], t: Date.now(), privada: true, temporada: true, equipeTemporada: temporada.equipe,
      sementeFixa: `${temporada.semente}:${temporada.ano}:${temporada.gp}`, pilotosTemporada: require("../../public/corrida/temporada/regras.js").pilotosNoGrid(temporada),
      montagens: { ...rivais.montagens, [temporada.equipe]: temporada.montagem }, bonusMontagem: { ...rivais.bonus, [temporada.equipe]: temporada.bonus }, estrategistas: { [temporada.equipe]: temporada.engenheiros.estrategista || 0 }, bonusBox: (temporada.engenheiros.mecanico * 0.5 + temporada.engenheiros.estrategista * 0.25), bonusBoxEquipes: { ...rivais.bonusBox, [temporada.equipe]: temporada.engenheiros.mecanico * 0.5 + temporada.engenheiros.estrategista * 0.25 }, aoTerminarGP, aoMontar,
      tvTemporada: resumoTV(require("../../public/corrida/temporada/regras.js").tabelas(temporada), { gp: temporada.gp + 1, total: temporada.tamanho, ano: temporada.ano }, (p) => p.id === "voce", (e) => e.id === temporada.equipe) };
    room.campeonatoPilotos = { restam: Math.max(0, temporada.tamanho - temporada.gp - 1), pilotos: require("../../public/corrida/temporada/regras.js").tabelas(temporada).pilotos.map(({ id, pontos }) => ({ id, pontos })) };
    const eq = Pilotos.EQUIPES[temporada.equipe], id = rid(6), token = rid();
    room.players[id] = { id, name: temporada.nome, token, pawn: "🏎️", color: eq.cor, skin: "padrao", car: "equilibrado", equipe: temporada.equipe,
      mods: { ...T.MODS_PADRAO, pintura: eq.pintura }, pneu: F1.COMPOSTO_PADRAO, grid: 0, laps: 0, sector: T.SECTORS - 1,
      ...(() => { const r = temporada.pilotoReal && Pilotos.PILOTOS.find((x) => x.id === temporada.pilotoReal); return r ? { numero: r.numero, sigla: r.sigla, nomeCompleto: r.nome, pilotoReal: r.id } : {}; })(), // (2026-11-21) a carreira como um piloto de verdade: o número e o capacete dele
      started: false, finish: null, best: null, last: null, sockets: new Set() };
    room.players[id].plano = ((temporada.paddock || {}).decisoes || {})[`${temporada.ano}:${temporada.gp}:plano`] || null; // (2026-11-16) o plano da corrida (paddock.js): sim.js PLANO
    try { const Pd = require("../../public/corrida/temporada/paddock.js"), m = Pd.modificadores(temporada); if (m) room.players[id].gpMods = m; } catch (e) { console.warn("Paddock: modificadores do GP:", e.message); } // (2026-11-21) os eventos do fim de semana no seu carro (sim.js) e no grid
    room.order.push(id); room.host = id; rooms.set(room.code, room); log(room, `🏁 GP de ${gp.nome}: box da temporada aberto.`);
    return { code: room.code, id, token, phase: room.phase };
  }
  // GP da temporada em grupo (corrida-temporada-grupo.js): todos os humanos da sala no mesmo grid, os robôs completando os 22
  // carros. `g.pessoas`: [{ pid, nome, equipe }]; `g.robos`: os pilotos reais de robô (com a equipe de quem os contratou);
  // `g.bonusBox`: o bônus dos engenheiros por equipe. Devolve o acesso de cada pessoa (e o de quem só assiste).
  function abrirGPGrupo(g, aoTerminarGP) {
    const gp = T.PISTAS[g.pista];
    if (!gp) throw Error("Pista inválida.");
    const room = { code: novoCodigo(rooms), host: null, phase: "lobby", config: cleanConfig({ regras: "f1", pista: g.pista, voltas: F1.voltasDoGP(g.voltas, g.pista), voltasDoGP: true, robos: g.robos.length, classificacao: "completa", nivel: g.nivel }),
      players: {}, order: [], finishOrder: [], log: [], t: Date.now(), privada: true, temporada: true, grupo: true, salaTemporada: g.salaTemporada || null, espectadores: new Set(),
      sementeFixa: g.semente, pilotosTemporada: g.robos, montagens: g.montagens || {}, bonusMontagem: g.bonusMontagem || {}, bonusBoxEquipes: g.bonusBox || {}, estrategistas: g.estrategistas || {}, aoTerminarGP, aoMontar: g.aoMontar,
      tvTemporada: g.tv ? resumoTV(g.tv.tabelas, { gp: g.tv.gp, total: g.tv.total, ano: g.tv.ano }, (p) => p.humano, (e) => e.humana) : null };
    if (g.tv && g.tv.tabelas) room.campeonatoPilotos = { restam: Math.max(0, g.tv.total - g.tv.gp), pilotos: g.tv.tabelas.pilotos.map(({ id, pontos }) => ({ id, pontos })) };
    const pessoas = {};
    for (const h of g.pessoas) {
      const eq = Pilotos.EQUIPES[h.equipe], id = rid(6), token = rid();
      room.players[id] = { id, pessoa: h.pid, name: h.nome, token, pawn: "🏎️", color: eq.cor, skin: "padrao", car: "equilibrado", equipe: h.equipe,
        mods: { ...T.MODS_PADRAO, pintura: eq.pintura }, pneu: F1.COMPOSTO_PADRAO, grid: room.order.length, laps: 0, sector: T.SECTORS - 1,
        started: false, finish: null, best: null, last: null, sockets: new Set() };
      room.order.push(id); if (!room.host) room.host = id; pessoas[h.pid] = { id, token };
    }
    const espectador = { watch: true, token: rid() };
    room.espectadores.add(espectador.token);
    rooms.set(room.code, room); log(room, `🏁 GP de ${gp.name}: a temporada em grupo abriu o box.`);
    return { code: room.code, pessoas, espectador };
  }
  // GP em grupo: a classificação começa quando todos os humanos chegaram à pista (ou 30 s depois da primeira pessoa)
  const ESPERA_GRUPO_MS = Number(process.env.CORRIDA_ESPERA_GRUPO_MS) || 30000, ASSUME_MS = process.env.CORRIDA_ASSUME_MS != null ? Number(process.env.CORRIDA_ASSUME_MS) : 8000;
  function entrouNoGP(room) {
    if (!room.grupo) return iniciarClassificacao(room);
    if (room.order.every((id) => room.players[id].bot || room.players[id].sockets.size)) { clearTimeout(room.esperaTimer); room.esperaTimer = null; return iniciarClassificacao(room); }
    if (!room.esperaTimer) room.esperaTimer = setTimeout(() => { room.esperaTimer = null; if (room.phase === "lobby") { iniciarClassificacao(room); broadcast(room); } }, ESPERA_GRUPO_MS);
  }
  // GP em grupo: quem caiu na corrida tem o carro levado por um robô depois de alguns segundos (a recarga da página não conta)
  function agendarAssumir(room, p) {
    clearTimeout(p.assumeTimer);
    p.assumeTimer = setTimeout(() => { if (p.sockets.size || room.phase !== "race") return; if (TRobo.assumir(room, p, (s) => log(room, s))) broadcast(room); }, ASSUME_MS);
  }
  function salaGP(code) { const r = rooms.get(code); return r?.temporada ? r : null; }
  return { abrirGP, abrirGPGrupo, entrouNoGP, agendarAssumir, salaGP };
};
