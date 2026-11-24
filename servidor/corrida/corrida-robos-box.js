// Corrida da Galera — os robôs: a estratégia de box (quando parar e qual pneu pôr, pelo desgaste e pelo clima).
// Parte de corrida-robos.js.
const F1 = require("../../public/corrida/f1-regras.js"); // os pneus das regras de F1
const Estilos = require("./corrida-estilos.js");
const { TRANSITO_NIVEL } = require("./corrida-robos-transito.js");
// F1: os robôs usam o mesmo carro e a mesma pista física dos humanos. O controlador escolhe só o alvo de
// velocidade e o lugar da pista; Sim.passo aplica direção, pneu, freio, motor, muro e box a 120 Hz.
// ---------- a parada decidida pelo pneu, não só pelo plano ----------
// O plano (F1.estrategia) diz em que volta parar e com qual composto, mas o robô não pode seguir cego: uma parada antecipada
// (safety car) ou uma largada em tráfego desmancham a conta, e sem outra parada no plano ele rodava o resto da corrida com o
// pneu acabado (1,3x o tempo de volta). Então a cada passagem pela entrada do box o robô pergunta ao pneu: chega ao fim da
// corrida? Se sim, não para (só pela regra dos dois compostos, na última chance). Se não, para na volta do plano, ou antes se
// a próxima volta já passaria do penhasco, ou de graça sob safety car se o pneu já está pela metade.
// Depois da parada o composto é o que aguenta o resto da corrida (o mais rápido que aguenta), não o que o plano previa.
const ESTILOS_BOX = ["plano", "plano", "undercut", "overcut", "oportunista"];
const MARGEM_PNEU = 1.12; // o desgaste real passa um pouco do teórico (tráfego, largada, escorregão)
const taxaDoPneu = (composto, fator) => (F1.PENHASCO / F1.vidaEmVoltas(composto, 1)) * (fator || 1) * MARGEM_PNEU; // desgaste por volta
function escolherComposto(restam, usados, fator, p) {
  const ordem = ["macio", "medio", "duro"].filter((c) => !p || F1.podeUsar(p, c)), aguenta = (c) => F1.vidaEmVoltas(c, fator * MARGEM_PNEU) >= restam;
  let lista = ordem.filter(aguenta); if (!lista.length) lista = ordem.slice(-1); // nem o mais duro chega: para de novo mais tarde
  if (!lista.length) return F1.compostoParaParada(p, "duro"); // tudo esgotado: repete o menos usado
  if (usados.size < 2) { const novos = lista.filter((c) => !usados.has(c)); if (novos.length) lista = novos; } // dois compostos: prefere um que ainda não usou
  return lista[0];
}
// O clima manda no pneu (corrida com chuva): o robô "sente" a água com o seu viés (`ia.vies`) e compara a estimativa de volta de cada
// composto (F1.compostoPorAgua, a conta simples do molhado). Seco → chuva quando o de chuva fica mais de 0,8 s mais rápido;
// chuva → seco quando o seco (o que aguenta o resto da corrida) fica mais de 0,8 s mais rápido. Cada robô tem o seu limite
// (o viés), então não entram no box todos juntos. Devolve o composto, ou null para seguir como está.
// (2026-11-23, o Thiago: "em SP o engenheiro já tinha dito que ia chover, mas o Norris colocou pneu duro" e os robôs pararam de intermediário numa
// volta e de chuva na seguinte) a equipe olha o radar: a água que conta é a média de agora, de daqui a meia volta e de daqui a volta e meia (a
// previsão do roteiro do clima, como o estrategista de quem joga), e só troca se o ganho por volta vezes as voltas que faltam paga o tempo
// perdido no box (tab.parada, a tabela da pista).
function aguaDaPerna(room, p, ia, cl, restam) {
  const RP = ritmoDosPneus(), tab = RP && RP.tabelaDe(room.config.pista), ref = tab ? tab.compostos.medio.tempos[0] : (p.last || p.best || 90);
  const agora = room.clima && room.clima.t0 ? room.clima.t0 + (cl.t || 0) * 1000 : Date.now();
  const v = [cl.agua, ...[0.5, 1.5].filter((k) => k <= restam + 0.5).map((k) => F1.climaEm(room.clima, agora + k * ref * 1000).agua)];
  return Math.max(0, Math.min(1, v.reduce((a, b) => a + b, 0) / v.length + (ia.vies || 0)));
}
function trocaPeloClima(room, p, ia, pneu, cl, restam, usados, fator) {
  if (restam < 1) return null;
  const pista = room.config.pista, agua = aguaDaPerna(room, p, ia, cl, restam), RP = ritmoDosPneus(), tab = RP && RP.tabelaDe(pista), perda = tab ? tab.parada : 20;
  const vale = (c) => (F1.tempoMolhado(pista, pneu.composto, agua) - F1.tempoMolhado(pista, c, agua)) * restam > perda;
  const livres = [...F1.SECOS, "chuva", "intermediario"].filter((c) => c === pneu.composto || F1.podeUsar(p, c));
  const melhor = F1.compostoPorAgua(pista, agua, livres, pneu.composto);
  if (F1.SECOS.includes(pneu.composto)) return !F1.SECOS.includes(melhor) && vale(melhor) ? melhor : null;
  if (!F1.SECOS.includes(melhor)) {
    if (melhor !== pneu.composto && vale(melhor)) return melhor;
    // (2026-11-21, o Thiago: "às vezes eles esticam o pneu até o fim na chuva, principalmente o intermediário") parava só depois do penhasco, e sem jogo
    // novo do mesmo composto não parava nunca. Agora para quando a próxima volta já passaria do penhasco (como no seco), com o jogo que ainda tiver (o
    // outro de chuva se o mesmo acabou)
    const taxaChuva = taxaDoPneu(pneu.composto, fator * F1.relDaPista(pista));
    if (restam >= 1 && pneu.desgaste + taxaChuva > F1.PENHASCO) {
      const disponiveis = ["chuva", "intermediario"].filter((c) => F1.podeUsar(p, c));
      if (disponiveis.length) return F1.compostoPorAgua(pista, agua, disponiveis);
      return null; // (os quatro jogos de chuva acabaram: um seco na água é pior que o de chuva gasto)
    }
    return null;
  }
  const seco = escolherComposto(restam, usados, fator, p); // secou: volta ao seco que aguenta o resto da corrida (se a volta mais rápida pagar o box)
  return vale(seco) ? seco : null;
}
// parando de qualquer jeito (pneu no fim, dano) numa corrida com chuva: o pneu sai pela previsão, não só pelo seco que aguenta
function compostoDaParada(room, p, ia, cl, restam, usados, fv) {
  if (room.clima && room.clima.chove && cl) {
    const livres = [...F1.SECOS, "chuva", "intermediario"].filter((c) => F1.podeUsar(p, c)), m = F1.compostoPorAgua(room.config.pista, aguaDaPerna(room, p, ia, cl, restam), livres);
    if (m && !F1.SECOS.includes(m)) return m;
  }
  return escolherComposto(restam, usados, fv, p);
}
let RITMO_PNEUS = null;
const ritmoDosPneus = () => RITMO_PNEUS || (RITMO_PNEUS = (() => { try { return require("../../public/corrida/f1-pneus-ritmo.js"); } catch (e) { return null; } })());
function decidirParada(room, p, ia, car, spec, cl) {
  const voltas = room.config.voltas, feitas = p.laps || 0;
  if (!p.started || feitas + 1 >= voltas || car.box?.fase) return null; // na última volta o corredor passa pela chegada: sem box
  const chuvoso = !!(room.clima && room.clima.chove); // corrida com chuva: a regra dos dois compostos não vale e o plano de pneus seco fica de lado
  const planejada = !chuvoso && ia.plano && ia.plano.paradas[(p.paradas || []).length];
  const pneu = car.pneu, fator = (spec.desgaste || 1) * Estilos.parametros(room, p, TRANSITO_NIVEL.medio).desgaste * F1.desgasteDoPlano(p.plano), fv = fator * F1.relDaPista(room.config.pista), taxa = taxaDoPneu(pneu.composto, fv); // (fv: o gasto por volta DESTA pista, o pneu por distância; a tabela já vem em voltas desta pista)
  const restam = voltas - feitas - 1, usados = new Set(p.compostos || [p.pneu || F1.COMPOSTO_PADRAO]);
  if (chuvoso && cl) { const pelaAgua = trocaPeloClima(room, p, ia, pneu, cl, restam, usados, fator); if (pelaAgua) return pelaAgua; if (!F1.SECOS.includes(pneu.composto) && cl.agua + (ia.vies || 0) > 0.3) return null; }
  // carro avariado (mais de 10% de dano): para no box para consertar. Com o pneu ainda bom, só conserta ("manter", sem trocar); gasto, troca
  // também (o serviço do box conserta o dano em toda parada, concluirParada em corrida.js)
  if ((p.dano || 0) > 10 && restam >= 1) { if (pneu.desgaste < F1.PENHASCO * 0.6) return "manter"; return compostoDaParada(room, p, ia, cl, restam, usados, fv); }
  const chega = pneu.desgaste + taxa * (restam + 0.35) <= F1.PENHASCO; // o resto da corrida e o começo da volta de chegada
  const passaNaProxima = pneu.desgaste + taxa > F1.PENHASCO; // a volta que vem já passaria do penhasco
  // a volta planejada, ajustada pelo jeito: o undercut para uma volta antes se está colado no da frente; o overcut estica uma volta em
  // ar limpo (se o pneu aguenta essa volta a mais)
  const estilo = ia.estiloBox || "plano", voltaPlano = planejada ? planejada.volta + (estilo === "undercut" && ia.colado ? -1 : estilo === "overcut" && ia.arLimpo && !passaNaProxima && pneu.desgaste + taxa * 2 <= F1.PENHASCO ? 1 : 0) : Infinity;
  const noPlano = !!planejada && feitas + 1 >= voltaPlano;
  // o plano vale mesmo quando o pneu chegaria ao fim: antes o robô só parava na última chance (a regra dos dois compostos) e quase todos
  // paravam juntos, na penúltima volta. Só não para pelo plano se o composto previsto não aguenta o resto.
  const planoAguenta = !!planejada && F1.vidaEmVoltas(planejada.composto, fv * MARGEM_PNEU) >= restam - 0.5;
  const scLimite = estilo === "oportunista" ? 0.15 : 0.3;
  let para = false;
  if (!chega) para = passaNaProxima || noPlano || (room.direcao?.safety && pneu.desgaste > scLimite);
  // (2026-11-21) com a degradação uniforme o pneu passado do penhasco perde "só" mais 10%: no fim da corrida ficar fora pode sair mais barato que parar.
  // A conta é a da tabela da pista (f1-pneus-ritmo.js): as voltas que faltam no pneu de agora contra as mesmas com o pneu novo mais a parada.
  if (para && restam <= 3 && !(room.direcao?.safety)) {
    const RP = ritmoDosPneus(), tab = RP && RP.tabelaDe(room.config.pista), comp = tab && tab.compostos[pneu.composto];
    if (comp) {
      let ficar = 0, trocar = tab.parada, d = pneu.desgaste, dn = 0; const novo = tab.compostos[escolherComposto(restam, usados, fv, p)] || comp;
      for (let k = 0; k < restam; k++) { const d1 = Math.min(1, d + taxa), dn1 = Math.min(1, dn + novo.gasto * fator); ficar += RP.tempoDaVolta(comp, d, d1); trocar += RP.tempoDaVolta(novo, dn, dn1) + (k === 0 ? novo.frio : 0); d = d1; dn = dn1; }
      if (ficar < trocar) para = false;
    }
  }
  // (2026-11-23, Austin: depois de parar no safety car quase todos pararam de novo na volta 6, à toa) com o pneu chegando ao fim e os dois compostos já
  // usados, a parada do plano não serve para nada: fica na pista
  else if (noPlano && planoAguenta && estilo !== "overcut" && usados.size < 2) para = true; // (o overcut, com o pneu aguentando até o fim, estica sem parar)
  else if (estilo === "oportunista" && room.direcao?.safety && pneu.desgaste > 0.45 && restam >= 3) para = true; // parada barata sob SC, com pneu já gasto
  if (!para) return null;
  const aguentaPlano = planejada && planejada.composto !== pneu.composto && F1.podeUsar(p, planejada.composto) && F1.vidaEmVoltas(planejada.composto, fv * MARGEM_PNEU) >= restam;
  return aguentaPlano ? planejada.composto : compostoDaParada(room, p, ia, cl, restam, usados, fv);
}

module.exports = { ESTILOS_BOX, escolherComposto, ritmoDosPneus, decidirParada };
