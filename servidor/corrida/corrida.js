// Corrida da Galera — corrida de kart de 1 a 8 jogadores, com caixas opcionais.
// Nas regras de F1 o SERVIDOR é a autoridade: o navegador manda o que o piloto apertou em cada passo da física (`inp`) e o
// servidor anda o carro (corrida-humanos.js, com public/corrida/sim.js), conta os setores, as batidas e as paradas e devolve o
// estado verdadeiro (`ack`); o navegador prevê com a mesma física e se corrige aos poucos. Nas outras salas (arcade, com caixas)
// cada navegador roda a física do próprio carro e só manda a posição, e os carros batem uns nos outros (cada navegador resolve
// a sua metade da batida, em `public/corrida/colisao.js`).
// O servidor cuida da largada sincronizada, repassa as posições e conta as voltas pelos setores da pista,
// na ordem (contra atalho e contramão), com um tempo mínimo de volta. Canal "/corrida" do Socket.io.
const Quali = require("./corrida-f1-classificacao.js"); // a classificação (Q1, Q2, Q3) que define o grid das regras de F1
const Robos = require("./corrida-robos.js"); // os robôs (rodam aqui no servidor)
const bd = require("../comum/bd.js");
const { rid, novoCodigo, limparNome: cleanName, ok, falha: fail, contexto, ligarSocket, buscarSala, quemVolta, nomeEmUso, limparSalasParadas } = require("../comum/salas.js"); // as peças de sala que todo jogo repete
const { HORAS_CARREIRA, SALA_VAZIA_MS, MAX_PLAYERS, COLORS, PAWNS } = require("./corrida-base.js");
Robos.usarFonte((pista) => bd.melhoresTracadosCorrida(pista), (pista, nomes) => bd.ritmoCorrida(pista, nomes), (pista) => bd.melhorVoltaCorrida(pista), (pista, nomes, cond) => bd.proximidadeCorrida(pista, nomes, cond));
// (2026-11-21) os módulos que a sala só carregava na hora (a carreira, o Paddock, a análise, a gravação, os planos de pneu) vão para a memória logo
// depois da abertura: carregar arquivo no Windows chegou a parar o servidor 879 ms no começo da classificação (servidor.log do Thiago)
setImmediate(() => { for (const m of ["../../public/corrida/temporada/regras.js", "../../public/corrida/temporada/paddock.js", "../../public/corrida/f1-pneus-ritmo.js", "./corrida-contato.js", "./corrida-gravacao.js", "./corrida-analise.js"]) { try { require(m); } catch (e) { /* (só aquece) */ } } });
module.exports = function attachCorrida(io) {
  const nsp = io.of("/corrida");
  const rooms = new Map();
  // (2026-11-16) o que a sala está fazendo agora, para a vigia do laço no servidor.log do programa (corrida-pc.js): a fase, se o qualify está no
  // intervalo e os segundos desde a largada (ou a abertura da sessão)
  module.exports.faseAgora = () => { for (const r of rooms.values()) if (r.phase === "race" || r.phase === "quali") { const q = r.quali, s = r.startAt ? Math.round((Date.now() - r.startAt) / 1000) : null; return r.phase === "quali" ? (q && q.carga ? "qualify, carregando" : q && q.pausaAte ? `qualify, intervalo depois do ${q.nome}` : `qualify ${q ? q.nome : ""}, ${s} s de sessão`) : `corrida, ${s} s depois da largada`; } return null; };
  module.exports.emCorrida = () => { for (const r of rooms.values()) if (r.phase === "race" || r.phase === "quali") return true; return false; }; // (corrida-pc.js: os envios ao site esperam a bandeirada)
  require("../comum/lobby.js").registrar("corrida", rooms, { max: MAX_PLAYERS }); // aparece na lista de salas da Vila
  // (2026-11-23, o servidor.log do Thiago: 15 s parado na bandeirada, quase tudo o Node achando e lendo módulos: getNearestParentPackageJSON, loader)
  // o que só roda no fim da corrida (o replay, a análise, as regras e o paddock da carreira) era carregado na hora, na bandeirada. Carrega uns
  // segundos depois de o servidor abrir, com ninguém correndo ainda.
  setTimeout(() => { for (const m of ["./corrida-gravacao.js", "./corrida-analise.js", "../../public/corrida/temporada/regras.js", "../../public/corrida/temporada/paddock.js", "../../public/corrida/f1-pneus-ritmo.js", "./corrida-contato.js"]) { try { require(m); } catch (e) { /* carrega na hora, como antes */ } } }, 4000).unref?.();
  // as partes da sala, em ordem: cada uma pega de C o que as de antes já puseram lá (corrida-sala.js, corrida-voltas.js,
  // corrida-largada.js, corrida-gp.js e, por último, corrida-conexao.js, que liga o canal /corrida)
  const C = { io, nsp, rooms };
  Object.assign(C, require("./corrida-sala.js")(C));
  Object.assign(C, require("./corrida-voltas.js")(C));
  Object.assign(C, require("./corrida-largada.js")(C));
  Object.assign(C, require("./corrida-gp.js")(C));
  Object.assign(C, require("./corrida-conexao.js")(C));
  const { abrirGP, abrirGPGrupo, salaGP, endRace, estimarRobos, startRace, entrouNoGP, onSector, concluirParada, aplicarBatida } = C;
  // apagar uma sala: os relógios dela param (os robôs, a física, os avisos) e ela sai da lista
  const apagarSala = (r) => { Quali.cancelar(r); clearTimeout(r.endTimer); clearTimeout(r.abandonoTimer); clearTimeout(r.esperaTimer); for (const id of r.order) clearTimeout(r.players[id]?.assumeTimer); clearInterval(r.itemTimer); clearInterval(r.botTimer); clearInterval(r.f1Timer); clearInterval(r.humanosTimer); };
  // salas paradas somem: as dos GPs da carreira depois de 3 dias (o Thiago, 2026-11-13: "manter carreiras por 3 dias sem entrar"; antes era
  // 12 horas, e a carreira mandava para um GP que já não existia), as outras depois de 12 horas
  limparSalasParadas(rooms, { horasDe: (r) => (r.temporada ? HORAS_CARREIRA : 12), aoApagar: apagarSala });
  // as salas rápidas (fora da carreira) sem nenhum humano conectado somem em SALA_VAZIA_MS: antes os robôs seguiam correndo sozinhos, gastando o
  // servidor, por até 12 horas. Conta qualquer conexão na sala (quem joga ou assiste); a espera cobre quem recarrega a página.
  setInterval(() => {
    const agora = Date.now();
    for (const [code, r] of rooms) {
      if (r.temporada) continue;
      const conectados = nsp.adapter.rooms.get(code)?.size || 0;
      if (conectados) { r.vaziaDesde = 0; continue; }
      if (!r.vaziaDesde) { r.vaziaDesde = agora; continue; }
      if (agora - r.vaziaDesde >= SALA_VAZIA_MS) { apagarSala(r); rooms.delete(code); }
    }
  }, 15000).unref?.();
  // (as regras de cada evento da física, para os testes chamarem sem passar pela rede: checkpoint, parada nos boxes e batida)
  return { abrirGP, abrirGPGrupo, salaGP, internos: { sala: (codigo) => rooms.get(codigo), endRace, estimarRobos, startRace, entrouNoGP, onSector, concluirParada, aplicarBatida } };
};
module.exports.COLORS = COLORS;
module.exports.PAWNS = PAWNS;
