// Corrida da Galera — o Paddock da carreira F1 solo (2026-11-15, a ideia do Thiago de uma temporada "viva"): a equipe passa a ter humor e memória.
// Contas puras, as mesmas no servidor (corrida-temporada.js, o evento "paddock", e regras.js) e no navegador (a aba Paddock, paddock-ui.js).
//
// O estado (s.paddock, criado na hora nos saves antigos):
//  - moral e lealdade do companheiro de equipe (0 a 100): a moral muda o ritmo dele na corrida (regras.js pilotosNoGrid: ±2 pontos de ritmo
//    nos extremos, ±0,4% no tempo de volta pela conta de f1-pilotos-2026.js fatorDeRitmo);
//  - satisfação do patrocinador (0 a 100): passando de 80 ele aumenta a verba por GP em 1 milhão; abaixo de 20 ele corta 1 milhão;
//  - torcida (0 a 100) e a conta com a diretoria (−20 a +20, somada à confiança da caixa de mensagens, regras.js imersao);
//  - as decisões tomadas (uma por acontecimento) e o mural: o que aconteceu, GP a GP.
// Além dos números, algumas opções mudam a equipe de verdade (`acao`, 2026-11-15, o Thiago: "sentir as decisões mudando em algo além de números,
// talvez aumento e demissão"): aumento de salário do companheiro e dos mecânicos (os salários de cada GP sobem), demissão do companheiro (outro
// piloto assume o segundo carro), corte do estrategista ou saída do chefe dos mecânicos (a equipe técnica cai um nível), aumento no seu bônus
// por vitória, e o ultimato da diretoria: falhar nele é ser demitido, e no fim do ano você vai para a equipe mais fraca que fez proposta.
// Os acontecimentos de cada GP são sorteados pela semente da carreira (o mesmo save vê sempre os mesmos) entre os que fazem sentido agora
// (o último resultado, a briga com o companheiro, a moral). Cada opção mexe nesses números e no caixa; a prova sai no mural.
(function (root) {
"use strict";
const Pilotos = root.F1Pilotos || require("../f1-pilotos-2026.js");
const Reg = () => root.F1Temporada || require("./regras.js"); // (na hora do uso: regras.js também carrega este arquivo)
const PONTOS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
const lim = (v, a = 0, b = 100) => Math.max(a, Math.min(b, Math.round(v)));
function gerador(semente) {
  let a = 2166136261; for (const c of String(semente)) { a ^= c.charCodeAt(0); a = Math.imul(a, 16777619); } a = (a >>> 0) || 1;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function garantir(s) {
  if (!s.paddock || typeof s.paddock !== "object") s.paddock = {};
  const p = s.paddock;
  for (const [k, v] of [["moral", 55], ["lealdade", 50], ["patrocinador", 60], ["torcida", 50], ["diretoria", 0], ["confianca", 55], ["agressividade", 50]]) if (!Number.isFinite(p[k])) p[k] = v;
  if (!p.decisoes || typeof p.decisoes !== "object") p.decisoes = {};
  if (!Array.isArray(p.mural)) p.mural = [];
  if (p.promessa === undefined) p.promessa = null;
  for (const k of ["salarioComp", "salarioStaff"]) if (!Number.isFinite(p[k])) p[k] = 0; // (os aumentos: milhões a mais por GP nos salários)
  return p;
}
// uma linha no mural (os 60 últimos ficam)
function anotar(s, tipo, texto, efeito = null) {
  const p = garantir(s); p.mural.push({ ano: s.ano, gp: s.gp, tipo, texto, efeito });
  if (p.mural.length > 60) p.mural.splice(0, p.mural.length - 60);
}
// o ajuste de ritmo do companheiro pela moral (regras.js pilotosNoGrid): 50 é neutro, 0 tira 2 pontos, 100 dá 2
const ajusteDeRitmo = (s) => Math.round(((garantir(s).moral - 50) / 25) * 10) / 10;
// (2026-11-15) a personalidade do companheiro na corrida (regras.js pilotosNoGrid; os números do piloto são os de f1-pilotos-2026.js e os de
// corrida-estilos.js), em escala de jogo, para sentir jogando:
//  - confiança (0 a 100, sobe com bons resultados e cai com abandonos): a constância, ±6 pontos nos extremos (as voltas variam menos ou mais);
//  - experiência (os GPs que ele já fez pela sua equipe): até +4 de constância e +6 de largada (a reação no semáforo), 0,25 e 0,4 por GP;
//  - agressividade (0 a 100, das instruções e das brigas): o ataque e a defesa ±0,2 e a taxa de erro ±40% (ataca mais e erra mais).
// (os perfis de corrida só existem no servidor: corrida-estilos.js; no navegador a personalidade serve só para a tela)
const Estilos = () => { if (typeof module === "undefined" || !module.exports) return null; try { return require("../../../corrida-estilos.js"); } catch (e) { return null; } };
function experiencia(s) { return (s.resultados || []).filter((r) => r.linhas.some((l) => l.piloto === s.piloto2 && l.equipe === s.equipe)).length; }
function personalidade(s, piloto) {
  const p = garantir(s), exp = experiencia(s), base = Estilos() ? Estilos().dePiloto(piloto.id) : null, a = (p.agressividade - 50) / 50; // −1 a +1
  const c01 = (v) => Math.max(0, Math.min(1, Math.round(v * 100) / 100));
  const perfil = base ? { ataque: c01(base.ataque + a * 0.2), defesa: c01(base.defesa + a * 0.2), erro: c01(base.erro * (1 + a * 0.4)) } : null;
  return { constancia: Math.round(piloto.constancia + ((p.confianca - 50) / 25) * 3 + Math.min(4, exp * 0.25)), largada: Math.round(piloto.largada + Math.min(6, exp * 0.4)), perfil, exp };
}

// o que os acontecimentos olham: o último GP deste ano, a minha linha e a do companheiro, a meta, o nome dele
function contexto(s) {
  const ultimo = (s.resultados || []).filter((r) => r.ano === s.ano).at(-1) || null;
  const eu = ultimo && ultimo.linhas.find((r) => r.piloto === "voce"), comp = ultimo && ultimo.linhas.find((r) => r.piloto === s.piloto2);
  const companheiro = Pilotos.PILOTOS.find((p) => p.id === s.piloto2) || { nome: "Seu companheiro", id: s.piloto2 };
  const faixa = ["mclaren", "ferrari", "mercedes", "red-bull"].includes(s.equipe) ? 0 : 1; // (as metas de verdade vêm de regras.js metas; aqui só o tamanho da equipe)
  return { ultimo, eu, comp, companheiro, nomeComp: companheiro.nome, faixa, p: garantir(s), proximo: s.calendario && s.calendario[s.gp] };
}
const bem = (l) => l && !l.dnf && !l.nc;
// O catálogo. `quando(ctx, s)`: se faz sentido agora. `opcoes`: o rótulo, o efeito ({ moral, lealdade, patrocinador, torcida, diretoria, caixa })
// e, às vezes, `depois(s)` (a promessa ao patrocinador). Os textos usam o nome do companheiro e o GP de verdade.
const EVENTOS = {
  segundoCockpit: {
    quem: "Piloto", fase: "sexta",
    quando: (c) => c.p.moral < 60 && c.ultimo,
    titulo: (c) => `Insatisfação no segundo cockpit`,
    texto: (c) => `${c.nomeComp} acha que está recebendo menos atualizações que você e pediu uma conversa antes do fim de semana.`,
    opcoes: [
      { id: "pecas", rotulo: "Garantir peças iguais para os dois", efeito: { moral: 12, lealdade: 6, caixa: -3, diretoria: -1 } },
      { id: "foco", rotulo: "Dizer que o foco da equipe é você", efeito: { moral: -10, lealdade: -6, diretoria: 3 } },
      { id: "conversa", rotulo: "Conversar com calma, sem prometer nada", efeito: { moral: 4, lealdade: 2 } },
      { id: "aumento", rotulo: "Dar um aumento a ele", efeito: { moral: 10, lealdade: 8 }, acao: "aumentoComp" },
    ],
  },
  // (2026-11-16, o Thiago: "decisões que impactam diretamente no carro"; 2026-11-21: "o de arriscar nem vale a pena") o plano do domingo, em todo GP:
  // os números estão em sim.js PLANO (no seu carro). A conta da diretoria vem no fim do GP (aoResultado).
  plano: {
    quem: "Engenheiros", fase: "domingo",
    quando: (c) => !!c.proximo,
    titulo: () => "O plano para a corrida",
    texto: () => "Os engenheiros querem saber como você vai correr. Cada plano muda o motor, a aderência e o pneu, e alguns mudam no meio da prova.",
    opcoes: [
      { id: "arriscar", rotulo: "Ataque total: +2,5% de potência e +0,5% de aderência; pneu +10% e as batidas dão 30% mais dano", efeito: { torcida: 2 } },
      { id: "largada", rotulo: "Largada forte: +3% de potência e +0,8% de aderência no primeiro terço, depois o carro cai um pouco", efeito: { torcida: 1 } },
      { id: "final", rotulo: "Guardar para o fim: poupa pneu e motor até 60% da prova, depois +3% de potência e +0,8% de aderência", efeito: {} },
      { id: "pneu", rotulo: "Esticar os pneus: o pneu gasta 15% menos", efeito: { diretoria: 1 } },
      { id: "seguro", rotulo: "Jogar seguro: −1% de potência; pneu −10% e as batidas dão 30% menos dano", efeito: { diretoria: 1 } },
      { id: "normal", rotulo: "Sem plano especial", efeito: {} },
    ],
  },
  instrucao: {
    quem: "Engenheiros", fase: "sexta",
    quando: (c) => !!c.proximo,
    titulo: () => "Instrução de corrida para o companheiro",
    texto: (c) => `Os engenheiros querem saber como ${c.nomeComp} deve correr neste GP.`,
    opcoes: [
      { id: "ataque", rotulo: "Atacar: buscar ultrapassagens", efeito: { agressividade: 15, confianca: 2 } },
      { id: "limpa", rotulo: "Corrida limpa: levar o carro até o fim", efeito: { agressividade: -15 } },
      { id: "livre", rotulo: "Deixar com ele", efeito: { moral: 3 } },
    ],
  },
  conflito: {
    quem: "Piloto", fase: "pos",
    quando: (c) => bem(c.eu) && bem(c.comp) && Math.abs(c.eu.pos - c.comp.pos) <= 2,
    titulo: () => "Conflito entre companheiros",
    texto: (c) => `Vocês terminaram colados no último GP e ${c.nomeComp} reclama que você não respeitou o espaço na pista. A imprensa já percebeu o clima.`,
    opcoes: [
      { id: "eu", rotulo: "Defender a sua corrida", efeito: { moral: -8, lealdade: -5, torcida: 3, agressividade: -8 } },
      { id: "ele", rotulo: "Dar razão a ele", efeito: { moral: 10, lealdade: 6, diretoria: -2, agressividade: 8 } },
      { id: "nada", rotulo: "Não interferir", efeito: { moral: -3 } },
      { id: "reuniao", rotulo: "Conversar com os dois juntos", efeito: { moral: 5, lealdade: 3, caixa: -1 } },
    ],
  },
  patrocinadorVisibilidade: {
    quem: "Patrocinador", fase: "sexta",
    quando: (c) => c.p.patrocinador < 75,
    titulo: () => "O patrocinador quer mais visibilidade",
    texto: () => "O principal patrocinador acha que a marca aparece pouco e cobra resultado neste fim de semana.",
    opcoes: [
      { id: "acao", rotulo: "Fazer uma ação de marketing no fim de semana", efeito: { patrocinador: 12, caixa: -2, torcida: 2 } },
      { id: "promessa", rotulo: "Prometer chegar dentro da meta neste GP", efeito: { patrocinador: 4 }, promessa: true },
      { id: "recusar", rotulo: "Dizer que o foco é o carro", efeito: { patrocinador: -8, diretoria: 1 } },
    ],
  },
  imprensaCritica: {
    quem: "Imprensa", fase: "pos",
    quando: (c) => c.eu && (!bem(c.eu) || c.eu.pos > (c.faixa === 0 ? 6 : 12)),
    titulo: () => "A imprensa questiona a equipe",
    texto: (c) => `Depois ${c.eu && !bem(c.eu) ? "do abandono" : `do ${c.eu.pos}º lugar`}, os jornalistas querem saber o que deu errado.`,
    opcoes: [
      { id: "assumir", rotulo: "Assumir o erro e prometer melhora", efeito: { diretoria: 4, torcida: 2 } },
      { id: "carro", rotulo: "Culpar o carro", efeito: { diretoria: -4, moral: -3, torcida: -2 } },
      { id: "defender", rotulo: "Defender o trabalho da equipe", efeito: { moral: 4, torcida: 3, diretoria: -1 } },
    ],
  },
  patrocinioExtra: {
    quem: "Patrocinador", fase: "pos",
    quando: (c) => c.eu && bem(c.eu) && c.eu.pos <= (c.faixa === 0 ? 3 : 8),
    titulo: () => "Uma marca quer entrar no carro",
    texto: (c) => `O ${c.eu.pos}º lugar chamou atenção: uma marca oferece um contrato curto para estampar o carro no próximo GP.`,
    opcoes: [
      { id: "aceitar", rotulo: "Aceitar o contrato curto (+3 milhões)", efeito: { caixa: 3, patrocinador: -3 } },
      { id: "recusar", rotulo: "Recusar para não incomodar o patrocinador", efeito: { patrocinador: 6 } },
    ],
  },
  torcida: {
    quem: "Torcida", fase: "sexta",
    quando: (c) => !!c.proximo,
    titulo: () => "A torcida pede um encontro com os pilotos",
    texto: (c) => `O fã-clube quer uma sessão de autógrafos na quinta-feira${c.proximo ? ` do GP (${c.proximo.nome})` : ""}, o dia em que os engenheiros queriam os pilotos na fábrica.`,
    opcoes: [
      { id: "fazer", rotulo: "Fazer a sessão de autógrafos", efeito: { torcida: 10, moral: 3, caixa: -1 } },
      { id: "fabrica", rotulo: "Manter o dia na fábrica", efeito: { torcida: -5, diretoria: 1 } },
    ],
  },
  diretoria: {
    quem: "Diretoria", fase: "pos",
    quando: (c) => c.ultimo && !c.p.demitido && c.p.diretoria > 8,
    titulo: () => "A diretoria está satisfeita",
    texto: () => "O conselho gostou do rumo da equipe e quer saber o que você precisa para seguir assim.",
    opcoes: [
      { id: "aumento", rotulo: "Pedir um aumento no bônus por vitória", efeito: { diretoria: -2 }, acao: "aumentoVoce" },
      { id: "verba", rotulo: "Pedir verba para o carro (+2 milhões)", efeito: { caixa: 2, diretoria: -3 } },
      { id: "seguir", rotulo: "Agradecer e seguir o plano", efeito: { diretoria: 2 } },
    ],
  },
  ultimato: {
    quem: "Diretoria", fase: "pos",
    quando: (c, s) => c.ultimo && !c.p.demitido && !c.p.ultimato && Reg().imersao(s).confianca < 30,
    titulo: () => "Ultimato da diretoria",
    texto: (c, s) => `A confiança do conselho caiu para ${Reg().imersao(s).confianca}%. Eles querem você no top ${Reg().imersao(s).meta.gp} no próximo GP, ou não renovam o seu contrato.`,
    opcoes: [
      { id: "aceitar", rotulo: "Aceitar o ultimato", efeito: { diretoria: 2 }, acao: "ultimato" },
      { id: "tempo", rotulo: "Pedir mais tempo", efeito: { diretoria: -4, torcida: -2 } },
    ],
  },
  cortes: {
    quem: "Diretoria", fase: "sexta",
    quando: (c, s) => c.ultimo && s.caixa < 12 && (s.engenheiros?.estrategista || 0) > 0,
    titulo: () => "A diretoria quer cortar custos",
    texto: (c, s) => `O caixa está em ${s.caixa} milhões. O conselho sugere dispensar o estrategista (${Reg().ENGENHEIROS.estrategista[s.engenheiros.estrategista].nome.toLowerCase()}).`,
    opcoes: [
      { id: "demitir", rotulo: "Demitir o estrategista", efeito: { diretoria: 3 }, acao: "demitirEstrategista" },
      { id: "manter", rotulo: "Mantê-lo e cortar na fábrica", efeito: { diretoria: -3, moral: -3 } },
    ],
  },
  mecanicos: {
    quem: "Engenheiros", fase: "sexta",
    quando: (c, s) => c.ultimo && (s.engenheiros?.mecanico || 0) > 0 && c.p.salarioStaff < 2,
    titulo: () => "Os mecânicos pedem aumento",
    texto: (c, s) => `O chefe dos mecânicos (${Reg().ENGENHEIROS.mecanico[s.engenheiros.mecanico].nome.toLowerCase()}) diz que o pessoal do box está ganhando abaixo das rivais.`,
    opcoes: [
      { id: "aumento", rotulo: "Dar o aumento aos mecânicos", efeito: { moral: 2 }, acao: "aumentoMecanicos" },
      { id: "recusar", rotulo: "Recusar", efeito: { diretoria: 1 }, acao: "perderMecanico" },
    ],
  },
  saida: {
    quem: "Piloto", fase: "pos",
    quando: (c) => c.p.moral < 30 || c.p.lealdade < 30,
    titulo: (c) => `${c.nomeComp} conversa com outra equipe`,
    texto: (c) => `O empresário de ${c.nomeComp} foi visto no motorhome de uma rival. Com a moral baixa, ele pode não render no carro.`,
    opcoes: [
      { id: "segurar", rotulo: "Oferecer um aumento", efeito: { moral: 15, lealdade: 15 }, acao: "aumentoComp" },
      { id: "confiar", rotulo: "Mostrar que conta com ele", efeito: { moral: 6, lealdade: 8 } },
      { id: "demitir", rotulo: "Demitir e trazer outro piloto", efeito: { diretoria: 1 }, acao: "demitirComp" },
    ],
  },
  reuniaoTecnica: {
    quem: "Engenheiros", fase: "sexta",
    quando: (c) => !!c.proximo,
    titulo: (c) => `Reunião técnica${c.proximo ? `: ${c.proximo.nome}` : ""}`,
    texto: () => "Os engenheiros querem saber a prioridade do fim de semana antes de montar o plano dos treinos.",
    opcoes: [
      { id: "juntos", rotulo: "Os dois pilotos dividem o programa", efeito: { moral: 4 } },
      { id: "voce", rotulo: "O programa principal fica no seu carro", efeito: { moral: -4, diretoria: 1 } },
      { id: "extra", rotulo: "Pagar uma sessão extra no simulador (−1 milhão)", efeito: { moral: 3, caixa: -1, diretoria: 1 } },
    ],
  },
  // ---------- (2026-11-21, o Thiago: "os atuais são muito repetitivos e pouco impactam") os que mudam o fim de semana de verdade ----------
  // O que cada escolha faz no SEU carro neste GP está em modificadores() (sim.js: aderência, potência, desgaste do pneu; corrida.js: as
  // posições perdidas no grid). Os sorteios (o evento aparecer, a peça nova funcionar) saem da semente da carreira.
  pacoteNovo: {
    quem: "Engenheiros", fase: "sexta",
    quando: (c, s) => s.gp >= 1 && chance(s, "pacote", 0.45),
    titulo: () => "O pacote novo chegou da fábrica",
    texto: () => "Um assoalho novo ficou pronto antes do previsto. No túnel de vento ele é mais rápido, mas ninguém sabe se vai funcionar na pista.",
    opcoes: [
      { id: "estrear", rotulo: "Estrear já: +0,6% de aderência se funcionar, −0,4% se não", efeito: { diretoria: 1 } },
      { id: "tunel", rotulo: "Pagar mais testes e estrear certo: +0,6% de aderência (−2 milhões)", efeito: { caixa: -2 } },
      { id: "esperar", rotulo: "Deixar para o próximo GP", efeito: { diretoria: -1 } },
    ],
  },
  motorNoLimite: {
    quem: "Engenheiros", fase: "sexta",
    quando: (c, s) => s.gp >= 2 && chance(s, "motor", 0.3),
    titulo: () => "O motor está no limite",
    texto: () => "A telemetria mostra o motor perdendo pressão. Um motor novo é mais forte, mas a troca fora da cota custa 5 posições no grid.",
    opcoes: [
      { id: "trocar", rotulo: "Trocar o motor: +1,2% de potência e 5 posições a menos no grid", efeito: {} },
      { id: "seguir", rotulo: "Seguir com o motor velho: −0,8% de potência", efeito: { diretoria: 1 } },
    ],
  },
  calor: {
    quem: "Engenheiros", fase: "sexta",
    quando: (c, s) => !!c.proximo && chance(s, "calor", 0.25),
    titulo: (c) => `Onda de calor${c.proximo ? ` em ${c.proximo.nome}` : ""}`,
    texto: () => "A previsão é de asfalto fervendo no domingo. Os engenheiros querem saber se mudam o acerto para proteger o pneu.",
    opcoes: [
      { id: "poupar", rotulo: "Acerto para o calor: −0,3% de aderência e o pneu gasta 10% menos", efeito: {} },
      { id: "manter", rotulo: "Manter o acerto: o pneu gasta 12% mais", efeito: { torcida: 1 } },
    ],
  },
  chassiReserva: {
    quem: "Engenheiros", fase: "sexta",
    quando: (c, s) => s.gp >= 1 && chance(s, "chassi", 0.12),
    titulo: () => "Batida no treino livre",
    texto: () => "Você bateu no TL2 e o chassi trincou. Dá para correr com o reserva, mais velho, ou virar a noite consertando o titular.",
    opcoes: [
      { id: "reserva", rotulo: "Correr com o chassi reserva: −0,5% de aderência e −0,3% de potência", efeito: { diretoria: -1 } },
      { id: "consertar", rotulo: "Virar a noite consertando (−2 milhões)", efeito: { caixa: -2, moral: -2 } },
    ],
  },
  provocacao: {
    quem: "Rival", fase: "pos",
    quando: (c, s) => !!rivalDe(s) && !!c.ultimo && chance(s, "provoca", 0.4),
    titulo: (c, s) => `${rivalDe(s).nome} provoca você`,
    texto: (c, s) => `Na entrevista depois do GP, ${rivalDe(s).nome} disse que você "só anda rápido sem ninguém por perto". Os jornalistas querem a sua resposta.`,
    opcoes: [
      { id: "responder", rotulo: "Responder à altura: a rixa esquenta e ele aperta mais na pista", efeito: { torcida: 6, diretoria: -1 }, acao: "rixa" },
      { id: "desafio", rotulo: "Desafiar: chegar na frente dele no próximo GP (vale torcida e patrocinador)", efeito: { torcida: 3 } },
      { id: "ignorar", rotulo: "Ignorar e falar do trabalho da equipe", efeito: { torcida: -2, diretoria: 2 } },
    ],
  },
  apostaPatrocinador: {
    quem: "Patrocinador", fase: "sexta",
    quando: (c, s) => !!c.proximo && s.gp >= 1 && chance(s, "aposta", 0.3),
    titulo: () => "O patrocinador aposta alto",
    texto: (c, s) => `A marca oferece um bônus de 5 milhões se você chegar no top ${alvoDaAposta(s)} neste GP. Se falhar, ela vai cobrar.`,
    opcoes: [
      { id: "aceitar", rotulo: "Aceitar a aposta (+5 milhões, ou o patrocinador bravo)", efeito: {} },
      { id: "recusar", rotulo: "Recusar com educação", efeito: { patrocinador: -2 } },
    ],
  },
  propostaRival: {
    quem: "Diretoria", fase: "pos",
    quando: (c, s) => !!c.eu && bem(c.eu) && c.eu.pos <= (c.faixa === 0 ? 4 : 8) && s.gp >= Math.floor(s.tamanho / 2) && chance(s, "sonda", 0.35),
    titulo: () => "Uma rival sonda você",
    texto: () => "O empresário recebeu uma ligação de outra equipe interessada em você para o ano que vem. A diretoria já ficou sabendo.",
    opcoes: [
      { id: "renegociar", rotulo: "Usar a proposta para renegociar", efeito: { diretoria: -4 }, acao: "aumentoVoce" },
      { id: "lealdade", rotulo: "Dizer que fica: a diretoria e a torcida gostam", efeito: { diretoria: 5, torcida: 4 } },
    ],
  },
};
// (2026-11-21) os que mexem no fim de semana passam na frente no sorteio dos dois do GP
const NOVOS = new Set(["pacoteNovo", "motorNoLimite", "calor", "chassiReserva", "provocacao", "apostaPatrocinador", "propostaRival"]);
// ---------- (2026-11-21, o Thiago: "eventos ligados ao que acontece na corrida: batidas, dano no carro, toque com pilotos específicos") ----------
// Saem do resumo do último GP (corrida-temporada.js `analise.corrida`: os toques no muro e em cada piloto, com a culpa, o dano no fim, as punições
// e as ultrapassagens). Valem para o GP que vem (as decisões ficam na chave dele, como as outras).
Object.assign(EVENTOS, {
  contaDaOficina: {
    quem: "Engenheiros", fase: "pos",
    quando: (c) => { const r = corridaDe(c); return !!r && (r.dano >= 20 || r.carros + r.muros >= 4); },
    titulo: () => "A conta da oficina",
    texto: (c) => { const r = corridaDe(c); return `O carro voltou com ${r.dano}% de dano depois de ${r.carros} toque${r.carros === 1 ? "" : "s"} em carros e ${r.muros} no muro. Os mecânicos querem saber até onde consertar.`; },
    opcoes: [
      { id: "completo", rotulo: (c) => `Conserto completo: o carro 100% (−${custoDoConserto(c)} milhões)`, custo: (c) => custoDoConserto(c), efeito: {} },
      { id: "basico", rotulo: "Conserto básico: −0,4% de aderência e −0,3% de potência no próximo GP", efeito: { diretoria: 1 } },
    ],
  },
  comissarios: {
    quem: "Direção de prova", fase: "pos",
    quando: (c) => { const r = corridaDe(c); return !!r && culpasSuas(r) >= 2; },
    titulo: () => "Os comissários chamam você",
    texto: (c) => `Você causou ${culpasSuas(corridaDe(c))} toques no último GP. Os comissários abriram uma investigação e falam em punição no grid.`,
    opcoes: [
      { id: "aceitar", rotulo: "Aceitar a advertência: 3 posições a menos no grid", efeito: { diretoria: 1 } },
      { id: "recorrer", rotulo: "Recorrer (−1 milhão): metade das vezes anula, senão são 5 posições", efeito: { caixa: -1, torcida: 2 } },
    ],
  },
  toquePiloto: {
    quem: "Piloto", fase: "pos",
    quando: (c, s) => !!quemTocou(c, s),
    titulo: (c, s) => `${quemTocou(c, s).nome} reclama de você`,
    texto: (c, s) => { const q = quemTocou(c, s); return `${q.nome} ${q.culpaSua ? "disse que você jogou o carro em cima dele" : "acha que você não deu espaço"} no último GP${q.n > 1 ? ` (${q.n} toques)` : ""}.`; },
    opcoes: [
      { id: "desculpas", rotulo: "Pedir desculpas em público", efeito: { torcida: -1, diretoria: 2 } },
      { id: "provocar", rotulo: (c, s) => `Provocar de volta: ${quemTocou(c, s).nome} vem com tudo para cima de você no próximo GP`, efeito: { torcida: 5 } },
      { id: "ignorar", rotulo: "Ignorar", efeito: {} },
    ],
  },
  batidaCompanheiro: {
    quem: "Piloto", fase: "pos",
    quando: (c, s) => { const r = corridaDe(c); return !!r && !!(r.por && r.por[s.piloto2] && r.por[s.piloto2].n); },
    titulo: () => "Batida entre os carros da equipe",
    texto: (c) => `Você e ${c.nomeComp} se tocaram no último GP. A garagem está dividida e o chefe quer uma posição sua.`,
    opcoes: [
      { id: "assumir", rotulo: "Assumir a culpa", efeito: { moral: 8, lealdade: 5, diretoria: -2 } },
      { id: "culpar", rotulo: "Dizer que a culpa foi dele", efeito: { moral: -12, lealdade: -8, diretoria: 1, agressividade: 10 } },
      { id: "ordem", rotulo: "Pedir ordem de equipe: ele não disputa com você", efeito: { moral: -4, agressividade: -25 } },
    ],
  },
  corridaLimpa: {
    quem: "Engenheiros", fase: "pos",
    quando: (c, s) => { const r = corridaDe(c); return !!r && bem(c.eu) && r.carros === 0 && r.muros === 0 && chance(s, "limpa", 0.7); },
    titulo: () => "Corrida sem um arranhão",
    texto: () => "Nenhum toque o GP inteiro. Os engenheiros têm dados limpos de todas as voltas e querem usá-los.",
    opcoes: [
      { id: "dados", rotulo: "Usar os dados no acerto: +0,4% de aderência no próximo GP", efeito: {} },
      { id: "folga", rotulo: "Dar folga para a garagem", efeito: { moral: 3, diretoria: 2 } },
    ],
  },
  showUltrapassagens: {
    quem: "Patrocinador", fase: "pos",
    quando: (c) => { const r = corridaDe(c); return !!r && r.passou >= 6; },
    titulo: () => "Show de ultrapassagens",
    texto: (c) => `Foram ${corridaDe(c).passou} ultrapassagens suas no último GP. O vídeo viralizou e o patrocinador quer aproveitar.`,
    opcoes: [
      { id: "video", rotulo: "Gravar um comercial com a marca (+2 milhões)", efeito: { caixa: 2, patrocinador: 4 } },
      { id: "fas", rotulo: "Fazer uma live com os fãs", efeito: { torcida: 8 } },
    ],
  },
  depoisDoAbandono: {
    quem: "Engenheiros", fase: "pos",
    quando: (c) => !!c.eu && !!c.eu.dnf,
    titulo: () => "Depois do abandono",
    texto: () => "O carro voltou destruído. Os engenheiros querem trocar o que pode ter sido afetado antes do próximo GP.",
    opcoes: [
      { id: "revisao", rotulo: "Revisão completa (−2 milhões)", efeito: { caixa: -2 } },
      { id: "rapida", rotulo: "Revisão rápida: −0,5% de potência no próximo GP", efeito: { diretoria: 1 } },
    ],
  },
  punicoes: {
    quem: "Direção de prova", fase: "pos",
    quando: (c) => { const r = corridaDe(c); return !!r && (r.acrescimo >= 10 || r.stopGo >= 1); },
    titulo: () => "Punições demais",
    texto: (c) => { const r = corridaDe(c); return `Foram ${r.acrescimo} s de punição${r.stopGo ? ` e ${r.stopGo} stop-and-go` : ""} no último GP. A diretoria cobra disciplina.`; },
    opcoes: [
      { id: "simulador", rotulo: "Treinar largadas e disputas no simulador (−1 milhão)", efeito: { caixa: -1, diretoria: 3 } },
      { id: "reclamar", rotulo: "Reclamar dos comissários na imprensa", efeito: { torcida: 3, diretoria: -3 } },
    ],
  },
  // a estratégia de paradas que a equipe planeja (vem em todo GP, junto do plano do domingo): o engenheiro chama o box nas voltas dela (o MFD,
  // estrategia-box.js) e você larga com o pneu dela (corrida.js abrirGP). As opções saem da conta dos planos (f1-pneus-ritmo.js) desta pista.
  estrategia: {
    quem: "Estrategista", fase: "domingo",
    quando: (c, s) => !!c.proximo && estrategiasDoGP(s).length > 0,
    titulo: () => "A estratégia de paradas",
    texto: (c, s) => `O estrategista montou os planos para as ${voltasDoGP(s)} voltas, já contando o pneu do plano do domingo e dos eventos que você decidiu. Com um deles, a equipe chama o seu box na volta certa e você larga com o pneu do plano.`,
    opcoes: [
      { id: "equilibrada", rotulo: (c, s) => rotuloDaEstrategia(s, "equilibrada"), pode: (s) => !!estrategiaDe(s, "equilibrada"), efeito: {} },
      { id: "agressiva", rotulo: (c, s) => rotuloDaEstrategia(s, "agressiva"), pode: (s) => !!estrategiaDe(s, "agressiva"), efeito: { torcida: 1 } },
      { id: "conservadora", rotulo: (c, s) => rotuloDaEstrategia(s, "conservadora"), pode: (s) => !!estrategiaDe(s, "conservadora"), efeito: {} },
      { id: "livre", rotulo: "Sem plano: eu decido as paradas", efeito: {} },
    ],
  },
});
const CORRIDA = new Set(["contaDaOficina", "comissarios", "toquePiloto", "batidaCompanheiro", "corridaLimpa", "showUltrapassagens", "depoisDoAbandono", "punicoes"]);
const corridaDe = (c) => (c.ultimo && c.ultimo.analise && c.ultimo.analise.corrida) || null;
const culpasSuas = (r) => Object.values((r && r.por) || {}).reduce((a, x) => a + (x.culpaSua || 0), 0);
const custoDoConserto = (c) => Math.max(1, Math.round(((corridaDe(c) || {}).dano || 0) / 12));
// o piloto (de outra equipe) em quem você mais encostou no último GP
function quemTocou(c, s) {
  const r = corridaDe(c); if (!r || !r.por) return null;
  const l = Object.entries(r.por).filter(([id, x]) => x.n > 0 && id !== s.piloto2).sort((a, b) => b[1].n - a[1].n || b[1].culpaSua - a[1].culpaSua);
  if (!l.length) return null;
  const p = Pilotos.PILOTOS.find((x) => x.id === l[0][0]); return p ? { id: p.id, nome: p.nome, ...l[0][1] } : null;
}
// as estratégias da equipe para o próximo GP: a melhor da conta, a melhor com uma parada a mais (agressiva) e com uma a menos (conservadora)
const Ritmo = () => { try { return root.F1PneusRitmo || require("../f1-pneus-ritmo.js"); } catch (e) { return null; } };
const Regras1 = () => { try { return root.F1Regras || require("../f1-regras.js"); } catch (e) { return null; } };
const voltasDoGP = (s) => { const g = s.calendario && s.calendario[s.gp], F = Regras1(); return g && F && F.voltasDoGP ? F.voltasDoGP(s.voltas, g.pista) : s.voltas; };
const CACHE_EST = new Map();
function estrategiasDoGP(s) {
  const g = s.calendario && s.calendario[s.gp], R = Ritmo(); if (!g || !R) return [];
  const tab = R.tabelaDe(g.pista), voltas = voltasDoGP(s); if (!tab || voltas < 2) return [];
  // (2026-11-21) o pneu do seu carro neste GP: o plano do domingo já escolhido vezes o dos eventos (o mesmo limite de sim.js), para as voltas das
  // paradas baterem com o pneu de verdade (em Jeddah o plano "conservador" chamava o box na 7, com o médio ainda em 60%)
  const Fr = Regras1(), lim = Fr && Fr.DESGASTE_SOMADO ? Fr.DESGASTE_SOMADO : [0.8, 1.4], idPlano = garantir(s).decisoes[`${s.ano}:${s.gp}:plano`], mods = modificadores(s);
  const fator = Math.round(Math.max(lim[0], Math.min(lim[1], (Fr && Fr.desgasteDoPlano ? Fr.desgasteDoPlano(idPlano) : 1) * ((mods && mods.desgaste) || 1))) * 20) / 20;
  const k = `${g.pista}:${voltas}:${fator}`; if (CACHE_EST.has(k)) return CACHE_EST.get(k);
  const F = Regras1(), teto = (F ? F.PENHASCO : 0.8) + 0.05; // (nenhum stint passa do penhasco: o plano que a equipe sugere nunca deixa o pneu acabar)
  const l = R.planos(tab, voltas, { janela: 40, max: 400, fator }).filter((x) => R.simular(tab, voltas, x, { fator }).desgaste.every((d) => d <= teto)), melhor = l[0], out = [];
  if (melhor) {
    out.push({ id: "equilibrada", ...melhor });
    const mais = l.find((x) => x.paradas.length > melhor.paradas.length), menos = l.find((x) => x.paradas.length < melhor.paradas.length);
    if (mais) out.push({ id: "agressiva", ...mais }); if (menos) out.push({ id: "conservadora", ...menos });
  }
  const r = out.map((x) => ({ id: x.id, largada: x.largada, paradas: x.paradas.map((q) => ({ volta: q.volta, composto: q.composto })), tempo: Math.round((x.tempo - melhor.tempo) * 10) / 10 }));
  if (CACHE_EST.size > 50) CACHE_EST.clear(); CACHE_EST.set(k, r); return r;
}
const estrategiaDe = (s, id) => estrategiasDoGP(s).find((x) => x.id === id) || null;
const NOME_PNEU = { macio: "macio", medio: "médio", duro: "duro" };
function rotuloDaEstrategia(s, id) {
  const e = estrategiaDe(s, id); if (!e) return "";
  const nome = { equilibrada: "Equilibrada", agressiva: "Agressiva", conservadora: "Conservadora" }[id], n = e.paradas.length;
  const paradas = n ? `, box ${e.paradas.map((q) => `na ${q.volta} (${NOME_PNEU[q.composto] || q.composto})`).join(" e ")}` : ", sem parar";
  return `${nome}: ${n} parada${n === 1 ? "" : "s"}, largar de ${NOME_PNEU[e.largada] || e.largada}${paradas}${e.tempo > 0 ? ` · +${String(e.tempo).replace(".", ",")} s na conta` : " · a mais rápida na conta"}`;
}
// a estratégia escolhida para o GP (corrida.js: o pneu da largada e as paradas que o MFD chama), ou null
function estrategiaEscolhida(s, ano = s.ano, gp = s.gp) {
  const id = garantir(s).decisoes[`${ano}:${gp}:estrategia`]; if (!id || id === "livre") return null;
  return estrategiaDe(s, id);
}
// um sorteio fixo da carreira para este GP (o mesmo save vê sempre o mesmo)
const chance = (s, tag, p) => gerador(`${tag}:${s.semente}:${s.ano}:${s.gp}`)() < p;
const rivalDe = (s) => { try { const r = Reg().imersao(s).rival; return r && r.id ? (Pilotos.PILOTOS.find((x) => x.id === r.id) || null) : null; } catch (e) { return null; } };
const alvoDaAposta = (s) => { try { return Math.max(1, Reg().imersao(s).meta.gp - 1); } catch (e) { return 5; } };
const pacoteFunciona = (s, ano, gp) => gerador(`pacote-ok:${s.semente}:${ano}:${gp}`)() < 0.7;
// O que as decisões do GP fazem no SEU carro (fora do plano do domingo, que é o PLANO de sim.js): { grip, potencia, desgaste, grid }, ou null.
// O pacote "estrear" funciona em 70% das vezes (pelo sorteio da carreira).
function modificadores(s, ano = s.ano, gp = s.gp) {
  const d = garantir(s).decisoes, de = (id) => d[`${ano}:${gp}:${id}`], m = { grip: 1, potencia: 1, desgaste: 1, grid: 0 };
  const pac = de("pacoteNovo");
  if (pac === "tunel") m.grip *= 1.006; // (2026-11-21: todos os efeitos daqui caíram para um quarto, a pedido do Thiago)
  else if (pac === "estrear") m.grip *= pacoteFunciona(s, ano, gp) ? 1.006 : 0.996;
  const mot = de("motorNoLimite");
  if (mot === "trocar") { m.potencia *= 1.012; m.grid += 5; } else if (mot === "seguir") m.potencia *= 0.992;
  const cal = de("calor");
  if (cal === "poupar") { m.grip *= 0.997; m.desgaste *= 0.9; } else if (cal === "manter") m.desgaste *= 1.12;
  if (de("chassiReserva") === "reserva") { m.grip *= 0.995; m.potencia *= 0.997; }
  if (de("contaDaOficina") === "basico") { m.grip *= 0.996; m.potencia *= 0.997; }
  const com = de("comissarios"); if (com === "aceitar") m.grid += 3; else if (com === "recorrer" && gerador(`recurso:${s.semente}:${ano}:${gp}`)() >= 0.5) m.grid += 5;
  if (de("corridaLimpa") === "dados") m.grip *= 1.004;
  if (de("depoisDoAbandono") === "rapida") m.potencia *= 0.995;
  return m.grip === 1 && m.potencia === 1 && m.desgaste === 1 && !m.grid ? null : m;
}
// os acontecimentos deste GP: até dois, sorteados pela semente entre os que fazem sentido (os já decididos continuam na lista, com a escolha)
function acontecimentos(s) {
  garantir(s);
  if (!s.calendario || s.gp >= s.tamanho) return [];
  const c = contexto(s), base = `${s.ano}:${s.gp}`;
  const candidatos = Object.keys(EVENTOS).filter((id) => id !== "plano" && id !== "estrategia" && (s.paddock.decisoes[`${base}:${id}`] || EVENTOS[id].quando(c, s)));
  const r = gerador(`paddock:${s.semente}:${base}`), embaralhados = candidatos.map((id) => [r() * (CORRIDA.has(id) ? 0.3 : NOVOS.has(id) ? 0.45 : 1), id]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  const decididos = embaralhados.filter((id) => s.paddock.decisoes[`${base}:${id}`]), resto = embaralhados.filter((id) => !s.paddock.decisoes[`${base}:${id}`]);
  const comPlano = [...[...decididos, ...resto].slice(0, 3), ...(EVENTOS.estrategia.quando(c, s) || s.paddock.decisoes[`${base}:estrategia`] ? ["estrategia"] : []), ...(EVENTOS.plano.quando(c, s) || s.paddock.decisoes[`${base}:plano`] ? ["plano"] : [])]; // (o plano do domingo vem sempre, fora dos dois sorteados)
  return comPlano.map((id) => {
    const e = EVENTOS[id], escolha = s.paddock.decisoes[`${base}:${id}`] || null, fixo = escolha && s.paddock.textos && s.paddock.textos[`${base}:${id}`]; // (decidido: o texto da hora da decisão, mesmo que o companheiro tenha mudado)
    return { id, quem: e.quem, fase: e.fase, titulo: fixo ? fixo.titulo : e.titulo(c, s), texto: fixo ? fixo.texto : e.texto(c, s), escolha, resultado: fixo ? fixo.resultado : null, opcoes: e.opcoes.filter((o) => !o.pode || o.pode(s)).map((o) => ({ id: o.id, rotulo: typeof o.rotulo === "function" ? o.rotulo(c, s) : o.rotulo, efeito: o.custo ? { ...o.efeito, caixa: -o.custo(c, s) } : o.efeito, consequencia: o.acao ? previaDaAcao(s, o.acao) : null })) };
  });
}
const NOMES = { moral: "moral do companheiro", lealdade: "lealdade", patrocinador: "patrocinador", torcida: "torcida", diretoria: "diretoria", caixa: "caixa" };
function aplicar(s, efeito) {
  const p = garantir(s);
  for (const k of ["moral", "lealdade", "patrocinador", "torcida", "confianca", "agressividade"]) if (efeito[k]) p[k] = lim(p[k] + efeito[k]);
  if (efeito.diretoria) p.diretoria = lim(p.diretoria + efeito.diretoria, -20, 20);
  if (efeito.caixa) s.caixa = Math.max(0, s.caixa + efeito.caixa);
}
function decidir(s, id, opcao) {
  garantir(s);
  if (s.gp >= s.tamanho) throw Error("A temporada terminou.");
  const ev = acontecimentos(s).find((e) => e.id === id); if (!ev) throw Error("Este acontecimento não está mais aberto.");
  if (ev.escolha) throw Error("Você já decidiu isso.");
  const o0 = EVENTOS[id].opcoes.find((x) => x.id === opcao); if (!o0 || (o0.pode && !o0.pode(s))) throw Error("Opção inválida.");
  const c = contexto(s), o = { ...o0, rotulo: typeof o0.rotulo === "function" ? o0.rotulo(c, s) : o0.rotulo, efeito: o0.custo ? { ...o0.efeito, caixa: -o0.custo(c, s) } : o0.efeito };
  if (o.efeito.caixa < 0 && s.caixa < -o.efeito.caixa) throw Error("Caixa insuficiente para essa decisão.");
  aplicar(s, o.efeito);
  if (id === "toquePiloto" && opcao === "provocar") { const q = quemTocou(c, s); if (q) s.paddock.inimigo = { ano: s.ano, gp: s.gp, id: q.id }; }
  if (o.promessa) s.paddock.promessa = { ano: s.ano, gp: s.gp };
  s.paddock.decisoes[`${s.ano}:${s.gp}:${id}`] = opcao;
  const antesComp = Pilotos.PILOTOS.find((x) => x.id === s.piloto2);
  const mudou = o.acao ? acao(s, o.acao) : null;
  // a notícia da decisão (os 12 últimos ficam)
  const m = MANCHETES[`${id}:${opcao}`];
  if (m) {
    const novo = Pilotos.PILOTOS.find((x) => x.id === s.piloto2), gpNome = (s.calendario[s.gp] && s.calendario[s.gp].nome) || "";
    const troca = (t) => t.replace(/\{eq\}/g, nomeEq(s.equipe)).replace(/\{comp\}/g, antesComp ? antesComp.nome : "o companheiro").replace(/\{novo\}/g, novo ? novo.nome : "outro piloto").replace(/\{gp\}/g, gpNome);
    const ns = (s.paddock.noticias ||= []); ns.push({ ano: s.ano, gp: s.gp, t: troca(m[0]), x: troca(m[1]), eq: s.equipe, quem: EVENTOS[id].quem });
    if (ns.length > 12) ns.splice(0, ns.length - 12);
  }
  const tx = (s.paddock.textos ||= {}); tx[`${s.ano}:${s.gp}:${id}`] = { titulo: ev.titulo, texto: ev.texto, resultado: mudou };
  for (const k of Object.keys(tx)) if (Number(k.split(":")[0]) < s.ano - 1) delete tx[k];
  anotar(s, EVENTOS[id].quem, `${ev.titulo}: ${o.rotulo.replace(/\s*\(.*\)$/, "")}.${mudou ? ` ${mudou}` : ""}`, o.efeito);
  if (mudou) s.paddock.ultimaMudanca = { ano: s.ano, gp: s.gp, quem: EVENTOS[id].quem, texto: mudou };
  return s;
}
// (2026-11-15) cada decisão vira notícia na Central de notícias: a manchete e a linha de baixo. {eq} a equipe, {comp} o companheiro (o de
// antes da decisão), {novo} quem entrou no lugar dele, {gp} o próximo GP.
const MANCHETES = {
  "segundoCockpit:pecas": ["{eq} promete o mesmo carro para os dois pilotos", "{comp} recebe a garantia de peças iguais e o clima melhora no box."],
  "segundoCockpit:foco": ["{eq} define a hierarquia: o primeiro piloto é a prioridade", "{comp} não gostou de ouvir que o foco da equipe é o outro carro."],
  "segundoCockpit:conversa": ["Conversa franca acalma o segundo cockpit da {eq}", "{comp} saiu da reunião sem promessa, mas mais tranquilo."],
  "segundoCockpit:aumento": ["{comp} ganha aumento na {eq}", "A equipe sobe o salário do companheiro para segurar o clima no box."],
  "conflito:eu": ["Clima tenso na {eq}: a equipe defende o primeiro piloto", "{comp} reclamou do espaço na pista e ficou sem apoio da direção."],
  "conflito:ele": ["{eq} dá razão a {comp} na briga interna", "A equipe admite que faltou espaço na disputa entre os dois carros."],
  "conflito:nada": ["{eq} se cala sobre a briga entre os pilotos", "Sem posição da equipe, {comp} segue incomodado."],
  "conflito:reuniao": ["Reunião a portas fechadas acalma a {eq}", "Os dois pilotos saíram juntos da sala e combinaram as regras da disputa."],
  "patrocinadorVisibilidade:acao": ["{eq} lança ação de marketing para o GP de {gp}", "O patrocinador principal ganha espaço no fim de semana."],
  "patrocinadorVisibilidade:promessa": ["{eq} promete resultado ao patrocinador", "A meta do GP de {gp} agora vale também para o contrato com a marca."],
  "patrocinadorVisibilidade:recusar": ["{eq} prioriza o carro e irrita o patrocinador", "A marca esperava mais visibilidade e não escondeu a decepção."],
  "imprensaCritica:assumir": ["{eq} assume o erro e promete reação", "A franqueza da equipe agradou a diretoria."],
  "imprensaCritica:carro": ["{eq} culpa o carro pelo resultado", "A declaração caiu mal na fábrica e entre os torcedores."],
  "imprensaCritica:defender": ["{eq} sai em defesa da equipe", "O discurso unido animou o box e a torcida."],
  "patrocinioExtra:aceitar": ["Nova marca estampa o carro da {eq}", "Contrato curto rende 3 milhões para o caixa da equipe."],
  "patrocinioExtra:recusar": ["{eq} recusa patrocínio extra", "A equipe preferiu não dividir o carro e agradou o patrocinador principal."],
  "torcida:fazer": ["Pilotos da {eq} param para autógrafos", "A sessão com o fã-clube lotou antes do GP de {gp}."],
  "torcida:fabrica": ["{eq} cancela encontro com a torcida", "Os pilotos ficaram na fábrica, e o fã-clube reclamou nas redes."],
  "diretoria:aumento": ["Diretoria da {eq} aumenta o seu bônus por vitória", "O conselho premiou a boa fase com um contrato melhor."],
  "diretoria:verba": ["{eq} libera verba extra para o carro", "O conselho aprovou 2 milhões a mais para o desenvolvimento."],
  "diretoria:seguir": ["{eq} mantém o plano para a temporada", "A diretoria segue confiante no rumo da equipe."],
  "ultimato:aceitar": ["Ultimato na {eq}: é resultado no GP de {gp} ou nada", "O conselho deu uma última chance ao piloto titular."],
  "ultimato:tempo": ["Piloto da {eq} pede mais tempo à diretoria", "O conselho não gostou e a pressão aumenta."],
  "cortes:demitir": ["{eq} demite o estrategista para cortar custos", "A equipe volta ao time de base na estratégia de corrida."],
  "cortes:manter": ["{eq} corta na fábrica e mantém o estrategista", "A economia caiu sobre o pessoal da sede."],
  "mecanicos:aumento": ["Mecânicos da {eq} ganham aumento", "O pessoal do box recebe o reajuste pedido."],
  "mecanicos:recusar": ["Chefe dos mecânicos deixa a {eq}", "Sem o aumento, ele aceitou uma proposta rival; o box perde qualidade."],
  "saida:segurar": ["{eq} segura {comp} com aumento", "O companheiro desiste de ouvir outras equipes."],
  "saida:confiar": ["{eq} renova a confiança em {comp}", "O piloto ouviu que segue nos planos da equipe."],
  "saida:demitir": ["{eq} demite {comp}; {novo} assume o carro", "A troca vale a partir do GP de {gp}."],
  "reuniaoTecnica:juntos": ["{eq} divide o programa entre os dois carros", "Os engenheiros vão testar as peças nos dois pilotos em {gp}."],
  "reuniaoTecnica:voce": ["{eq} concentra os testes no primeiro carro", "{comp} fica com o programa secundário em {gp}."],
  "reuniaoTecnica:extra": ["{eq} paga sessão extra no simulador", "Os pilotos chegam a {gp} com horas a mais de preparação."],
  "pacoteNovo:estrear": ["{eq} estreia assoalho novo em {gp}", "A peça chegou da fábrica antes do previsto e vai direto para a pista."],
  "pacoteNovo:tunel": ["{eq} paga testes extras e estreia pacote em {gp}", "A equipe gastou 2 milhões para chegar com a peça já aprovada."],
  "motorNoLimite:trocar": ["{eq} troca o motor e perde 5 posições no grid", "Com a unidade nova, o carro chega mais forte para a corrida em {gp}."],
  "motorNoLimite:seguir": ["{eq} arrisca o motor velho em {gp}", "A equipe evita a punição, mas o carro perde potência."],
  "calor:poupar": ["{eq} muda o acerto para o calor de {gp}", "Os engenheiros sacrificaram aderência para proteger os pneus."],
  "calor:manter": ["{eq} ignora o calor e mantém o acerto", "A aposta é andar rápido e parar mais vezes nos boxes."],
  "chassiReserva:reserva": ["Batida no treino: {eq} corre com o chassi reserva", "O carro titular trincou no TL2 e ficou na garagem."],
  "chassiReserva:consertar": ["Mecânicos da {eq} viram a noite consertando o carro", "O chassi titular foi salvo, mas custou 2 milhões."],
  "provocacao:responder": ["Troca de farpas na imprensa esquenta a rivalidade", "O piloto da {eq} respondeu à provocação, e a torcida adorou."],
  "provocacao:desafio": ["Piloto da {eq} desafia o rival para {gp}", "Quem chegar na frente no próximo GP fica com a razão."],
  "provocacao:ignorar": ["{eq} não entra na provocação", "O piloto preferiu falar do trabalho da equipe."],
  "apostaPatrocinador:aceitar": ["Patrocinador da {eq} promete bônus por resultado em {gp}", "São 5 milhões se a meta for batida."],
  "propostaRival:renegociar": ["Piloto da {eq} usa proposta rival e ganha aumento", "A diretoria cedeu, mas não gostou da pressão."],
  "propostaRival:lealdade": ["Piloto da {eq} recusa sondagem e fica", "A torcida e a diretoria comemoraram a lealdade."],
  "contaDaOficina:completo": ["{eq} gasta milhões para reconstruir o carro", "Depois das batidas, os mecânicos trocaram tudo o que estava torto."],
  "contaDaOficina:basico": ["{eq} faz só o conserto básico", "O carro chega a {gp} remendado e um pouco mais lento."],
  "comissarios:aceitar": ["Piloto da {eq} aceita advertência e perde 3 posições", "Os comissários puniram os toques do último GP."],
  "comissarios:recorrer": ["{eq} recorre da punição dos comissários", "A equipe gastou 1 milhão com advogados para tentar anular a perda de posições."],
  "toquePiloto:desculpas": ["Piloto da {eq} pede desculpas pelo toque", "O gesto agradou a diretoria."],
  "toquePiloto:provocar": ["Clima quente: piloto da {eq} provoca adversário", "A promessa é de briga dura na pista em {gp}."],
  "batidaCompanheiro:assumir": ["Piloto da {eq} assume a culpa na batida com {comp}", "O gesto acalmou a garagem."],
  "batidaCompanheiro:culpar": ["Racha na {eq}: piloto culpa {comp} pela batida", "O clima entre os dois carros ficou pesado."],
  "batidaCompanheiro:ordem": ["{eq} impõe ordem de equipe depois da batida", "{comp} não poderá disputar posição com o companheiro em {gp}."],
  "corridaLimpa:dados": ["{eq} usa os dados de uma corrida limpa no acerto", "O carro chega a {gp} mais afinado."],
  "showUltrapassagens:video": ["Ultrapassagens do piloto da {eq} viram comercial", "O vídeo rendeu 2 milhões para o caixa."],
  "showUltrapassagens:fas": ["Live do piloto da {eq} bate recorde de audiência", "Os fãs reviram as ultrapassagens ao vivo."],
  "depoisDoAbandono:revisao": ["{eq} revisa o carro inteiro depois do abandono", "A equipe gastou 2 milhões para não repetir o problema."],
  "punicoes:simulador": ["Piloto da {eq} treina disputas no simulador", "A diretoria quer menos punições a partir de {gp}."],
  "punicoes:reclamar": ["Piloto da {eq} critica os comissários", "A torcida apoiou, mas a diretoria não gostou."],
};
// o substituto quando o companheiro é demitido: o piloto de ritmo mais perto (e não acima) do dele, de outra equipe (nunca o titular que você
// substituiu na sua equipe); na falta, o mais lento de todos
function substituto(s) {
  const atual = Pilotos.PILOTOS.find((p) => p.id === s.piloto2), titulares = Pilotos.PILOTOS.filter((p) => p.equipe === s.equipe);
  const vaga = Reg().vagaDe ? Reg().vagaDe(s) : titulares[1];
  const livres = Pilotos.PILOTOS.filter((p) => p.id !== s.piloto2 && p.id !== (vaga && vaga.id) && p.id !== s.pilotoReal && p.equipe !== s.equipe);
  const abaixo = livres.filter((p) => !atual || p.ritmo <= atual.ritmo).sort((a, b) => b.ritmo - a.ritmo || a.id.localeCompare(b.id));
  return abaixo[0] || livres.sort((a, b) => a.ritmo - b.ritmo)[0] || null;
}
const nomeEq = (id) => (Pilotos.EQUIPES[id] && Pilotos.EQUIPES[id].nome) || id;
// o que a ação vai fazer, em palavras (mostrado na opção antes de decidir)
function previaDaAcao(s, a) {
  const p = garantir(s), comp = Pilotos.PILOTOS.find((x) => x.id === s.piloto2), E = Reg().ENGENHEIROS;
  if (a === "aumentoComp") return `Salário de ${comp ? comp.nome : "seu companheiro"} +1 milhão por GP`;
  if (a === "aumentoMecanicos") return "Salários do box +1 milhão por GP";
  if (a === "demitirComp") { const n = substituto(s); return n ? `${comp ? comp.nome : "Ele"} sai; ${n.nome} (${nomeEq(n.equipe)}) assume o carro · rescisão de 2 milhões` : "Ele sai da equipe"; }
  if (a === "demitirEstrategista") { const n = s.engenheiros.estrategista; return `O estrategista volta para a ${E.estrategista[0].nome.toLowerCase()} · devolve ${E.estrategista[n].custo - E.estrategista[n - 1].custo} milhões`; }
  if (a === "perderMecanico") return `O chefe dos mecânicos sai: o box cai para ${E.mecanico[Math.max(0, s.engenheiros.mecanico - 1)].nome.toLowerCase()}`;
  if (a === "aumentoVoce") return `Bônus por vitória +1 milhão (hoje ${Reg().contrato(s).bonusVitoria})`;
  if (a === "ultimato") return `Top ${Reg().imersao(s).meta.gp} no próximo GP; falhar é ser demitido no fim do ano`;
  if (a === "rixa") { const r = rivalDe(s); return r ? `${r.nome} aperta mais o ritmo perto de você` : null; }
  void p; return null;
}
// a ação de verdade; devolve a frase do mural
function acao(s, a) {
  const p = garantir(s), comp = Pilotos.PILOTOS.find((x) => x.id === s.piloto2), E = Reg().ENGENHEIROS;
  if (a === "aumentoComp") { p.salarioComp = Math.min(3, p.salarioComp + 1); return `${comp ? comp.nome : "O companheiro"} ganhou aumento: o salário dele subiu 1 milhão por GP.`; }
  if (a === "aumentoMecanicos") { p.salarioStaff = Math.min(3, p.salarioStaff + 1); return "Os mecânicos ganharam aumento: os salários do box subiram 1 milhão por GP."; }
  if (a === "demitirComp") {
    const n = substituto(s); if (!n) return null;
    if (s.caixa < 2) throw Error("Caixa insuficiente para a rescisão (2 milhões).");
    s.caixa -= 2; s.piloto2 = n.id; p.moral = 60; p.lealdade = 55; p.salarioComp = 0;
    return `${comp ? comp.nome : "O companheiro"} foi demitido. ${n.nome}, que estava na ${nomeEq(n.equipe)}, assume o segundo carro a partir do próximo GP.`;
  }
  if (a === "demitirEstrategista") { const n = s.engenheiros.estrategista; if (!n) return null; const volta = E.estrategista[n].custo - E.estrategista[n - 1].custo; s.engenheiros.estrategista = n - 1; s.caixa += volta; return `O estrategista foi demitido: a equipe volta para o nível "${E.estrategista[n - 1].nome}" e recupera ${volta} milhões.`; }
  if (a === "perderMecanico") { const n = s.engenheiros.mecanico; if (!n) return null; s.engenheiros.mecanico = n - 1; return `O chefe dos mecânicos pediu demissão: o box caiu para "${E.mecanico[n - 1].nome}" e as paradas ficam mais lentas.`; }
  if (a === "aumentoVoce") { const c = Reg().contrato(s); s.contrato = { inicio: c.inicio, fim: c.fim, bonusVitoria: c.bonusVitoria + 1 }; return `Você ganhou aumento: o bônus por vitória subiu para ${c.bonusVitoria + 1} milhões.`; }
  if (a === "ultimato") { const alvo = Reg().imersao(s).meta.gp; p.ultimato = { ano: s.ano, gp: s.gp, alvo }; return `Agora é top ${alvo} no próximo GP.`; }
  if (a === "rixa") { const r = rivalDe(s); if (!r) return null; if (!p.rixas || typeof p.rixas !== "object") p.rixas = {}; p.rixas[r.id] = (p.rixas[r.id] || 0) + 1; return `A rixa com ${r.nome} esquentou: ele vai apertar o ritmo quando estiver perto de você.`; }
  return null;
}
// Depois de cada GP (regras.js registrarResultado): o resultado mexe no humor da equipe. `meta`: a posição-alvo do GP.
function aoResultado(s, resultado, meta) {
  const p = garantir(s), eu = resultado.linhas.find((r) => r.piloto === "voce"), comp = resultado.linhas.find((r) => r.piloto === s.piloto2);
  const ef = { moral: 0, patrocinador: 0, torcida: 0, lealdade: 0, confianca: 0 }, notas = [];
  if (comp) {
    ef.confianca += !bem(comp) ? -8 : (PONTOS[comp.pos - 1] || 0) > 0 ? 6 : -2;
    if (bem(comp) && bem(eu) && comp.pos < eu.pos) ef.confianca += 4;
    if (!bem(comp)) { ef.moral -= 4; notas.push("o abandono pesou no companheiro"); }
    else if ((PONTOS[comp.pos - 1] || 0) > 0) { ef.moral += 4; notas.push("o companheiro pontuou"); }
    if (bem(comp) && bem(eu) && comp.pos < eu.pos) { ef.moral += 3; ef.lealdade += 1; notas.push("ele chegou na sua frente"); }
    if (bem(comp) && bem(eu) && comp.pos - eu.pos > 6) { ef.moral -= 2; }
  }
  const cumpriu = bem(eu) && eu.pos <= meta;
  ef.patrocinador += cumpriu ? 6 : -5;
  if (p.promessa && p.promessa.ano === resultado.ano && p.promessa.gp === resultado.gp) {
    ef.patrocinador += cumpriu ? 10 : -15; notas.push(cumpriu ? "a promessa ao patrocinador foi cumprida" : "a promessa ao patrocinador não foi cumprida");
    p.promessa = null;
  }
  if (p.ultimato && p.ultimato.ano === resultado.ano && p.ultimato.gp === resultado.gp) {
    const passou = bem(eu) && eu.pos <= p.ultimato.alvo; p.ultimato = null;
    if (passou) { p.diretoria = lim(p.diretoria + 8, -20, 20); notas.push("o ultimato foi cumprido"); }
    else { p.demitido = { ano: resultado.ano }; s.paddock.ultimaMudanca = { ano: s.ano, gp: s.gp, quem: "Diretoria", texto: "Você foi demitido: a equipe não renova o seu contrato. No fim do ano, você vai para a equipe mais fraca que fizer proposta." }; anotar(s, "Diretoria", "O ultimato não foi cumprido: você foi demitido. A equipe não renova o seu contrato no fim do ano."); }
  }
  const de = (id) => p.decisoes[`${resultado.ano}:${resultado.gp}:${id}`];
  if (de("pacoteNovo") === "estrear") notas.push(pacoteFunciona(s, resultado.ano, resultado.gp) ? "o pacote novo funcionou" : "o pacote novo não funcionou na pista");
  if (de("motorNoLimite") === "trocar") notas.push("o motor novo custou 5 posições no grid");
  if (de("apostaPatrocinador") === "aceitar") {
    if (bem(eu) && eu.pos <= Math.max(1, meta - 1)) { s.caixa += 5; ef.patrocinador += 8; notas.push("a aposta do patrocinador rendeu 5 milhões"); }
    else { ef.patrocinador -= 12; notas.push("a aposta com o patrocinador foi perdida"); }
  }
  const desafio = p.decisoes[`${resultado.ano}:${resultado.gp - 1}:provocacao`] === "desafio" ? rivalDe(s) : null; // (o desafio vale no GP seguinte ao da provocação)
  if (desafio) {
    const ele = resultado.linhas.find((l) => l.piloto === desafio.id);
    if (bem(eu) && (!ele || !bem(ele) || eu.pos < ele.pos)) { ef.torcida += 8; ef.patrocinador += 8; notas.push(`você venceu o desafio contra ${desafio.nome}`); }
    else { ef.torcida -= 8; ef.patrocinador -= 6; notas.push(`${desafio.nome} ganhou o desafio`); }
  }
  const plano = p.decisoes[`${resultado.ano}:${resultado.gp}:plano`];
  if (plano === "arriscar") { if (cumpriu) { p.diretoria = lim(p.diretoria + 3, -20, 20); ef.torcida += 3; notas.push("o risco valeu a pena"); } else if (!bem(eu)) { p.diretoria = lim(p.diretoria - 4, -20, 20); notas.push("o risco custou o carro"); } }
  else if (plano === "seguro") { if (cumpriu) { p.diretoria = lim(p.diretoria + 1, -20, 20); notas.push("a corrida segura deu certo"); } else { ef.patrocinador -= 2; notas.push("a corrida segura ficou longe da meta"); } }
  ef.torcida += bem(eu) ? Math.min(8, Math.round(((PONTOS[eu.pos - 1] || 0) + (eu.voltaRapida ? 1 : 0)) / 3)) - 1 : -3;
  duelo(s, resultado, eu, ef, notas); // (a rivalidade: antes de aplicar, para entrar na conta e nas notas do fim de semana)
  aplicar(s, ef);
  anotar(s, "Fim de semana", `GP de ${s.calendario[resultado.gp]?.nome || resultado.pista}: ${bem(eu) ? `você em ${eu.pos}º` : "você não terminou"}${comp ? `, ${Pilotos.PILOTOS.find((x) => x.id === s.piloto2)?.nome || "o companheiro"} ${bem(comp) ? `em ${comp.pos}º` : "fora"}` : ""}${notas.length ? ` (${notas.join("; ")})` : ""}.`, ef);
  // (2026-11-15) com a moral e a lealdade lá embaixo, o companheiro assina com uma rival e vai embora sem pedir: outro piloto assume o carro
  if (p.moral < 22 && p.lealdade < 25 && resultado.gp < s.tamanho - 1) {
    const antigo = Pilotos.PILOTOS.find((x) => x.id === s.piloto2), novo = substituto(s);
    if (antigo && novo) {
      s.piloto2 = novo.id; p.moral = 60; p.lealdade = 55; p.confianca = 55; p.agressividade = 50; p.salarioComp = 0;
      const texto = `${antigo.nome} assinou com outra equipe e foi embora. ${novo.nome}, que estava na ${nomeEq(novo.equipe)}, assume o segundo carro.`;
      anotar(s, "Piloto", texto); p.ultimaMudanca = { ano: s.ano, gp: s.gp, quem: "Piloto", texto };
      (p.noticias ||= []).push({ ano: s.ano, gp: s.gp, t: `${antigo.nome} deixa a ${nomeEq(s.equipe)}`, x: `${novo.nome} assume o segundo carro a partir do próximo GP.`, eq: s.equipe, quem: "Piloto" });
    }
  }
  marcos(s);
  // o patrocinador nos extremos muda a verba por GP
  if (p.patrocinador >= 80 && s.patrocinio < 12) { s.patrocinio++; p.patrocinador = 62; anotar(s, "Patrocinador", `O patrocinador gostou e aumentou a verba para ${s.patrocinio} milhões por GP.`); }
  else if (p.patrocinador <= 20 && s.patrocinio > 3) { s.patrocinio--; p.patrocinador = 42; anotar(s, "Patrocinador", `O patrocinador cortou a verba para ${s.patrocinio} milhões por GP.`); }
}
// (2026-11-16, a rivalidade) O duelo com o rival da temporada (regras.js imersao) depois de cada GP: na frente dele, a torcida sobe 3; atrás, cai 1.
// As batidas entre vocês (a análise do GP, `rixa`, de corrida.js anotarRixa) somam na rixa (p.rixas[id]): a torcida gosta do drama (+2), a diretoria
// não gosta de você causar (−2 por batida sua). Com a rixa, o rival aperta mais na pista (corrida-robos.js rivalNaPista) e vira notícia.
function duelo(s, resultado, eu, ef, notas) {
  const p = garantir(s); if (!p.rixas || typeof p.rixas !== "object") p.rixas = {};
  const im = (() => { try { return Reg().imersao(s); } catch { return null; } })(), id = im && im.rival && im.rival.id; if (!id) return;
  const ele = resultado.linhas.find((l) => l.piloto === id), nome = Pilotos.PILOTOS.find((x) => x.id === id)?.nome || "o rival";
  if (bem(eu) && bem(ele)) {
    if (eu.pos < ele.pos) { ef.torcida += 3; notas.push(`você ficou na frente de ${nome}`); }
    else { ef.torcida -= 1; notas.push(`${nome} ficou na sua frente`); }
  }
  const rx = resultado.analise && resultado.analise.rixa;
  if (rx && rx.id === id && rx.n > 0) {
    p.rixas[id] = (p.rixas[id] || 0) + rx.n; ef.torcida += 2;
    if (rx.culpaSua) p.diretoria = lim(p.diretoria - 2 * rx.culpaSua, -20, 20);
    const texto = rx.culpaSua > rx.culpaDele ? `${nome} reclamou de você depois das batidas no GP. A rixa esquentou.` : rx.culpaDele > rx.culpaSua ? `Você reclamou de ${nome} depois das batidas no GP. A rixa esquentou.` : `Você e ${nome} se tocaram de novo. A rixa esquentou.`;
    anotar(s, "Rival", texto);
    (p.noticias ||= []).push({ ano: s.ano, gp: s.gp, t: `Rixa: você e ${nome}`, x: texto, eq: s.equipe, quem: "Rival" });
  }
}
// (2026-11-16, o Thiago: "ser recompensado por adquirir certas porcentagens nos relacionamentos") Os MARCOS: passou da faixa, a recompensa
// sai uma vez por temporada (p.marcos guarda `ano:id`), com uma linha no mural e uma notícia. Cada um muda algo de verdade:
//  - companheiro parceiro (moral 85+ e lealdade 75+): ele passa os dados do simulador e o PRÓXIMO desenvolvimento do carro sai de graça (regras.js desenvolver);
//  - torcida 85+: a loja vende camisas e entram 2 milhões no caixa;
//  - diretoria 15+: o conselho libera 3 milhões para o carro;
//  - patrocinador 95+: um bônus de 3 milhões de uma vez (fora do aumento da verba por GP, que já existe nos 80);
//  - e o lado ruim: torcida 15 ou menos, a loja encalha e sai 1 milhão do caixa.
const MARCOS = [
  { id: "parceiro", quando: (p) => p.moral >= 85 && p.lealdade >= 75, faz: (s, p) => { p.desenvolvimentoGratis = true; }, texto: (s, nome) => `${nome} virou parceiro de verdade: passou os dados do simulador e o próximo desenvolvimento do carro sai de graça.`, quem: "Piloto" },
  { id: "torcida", quando: (p) => p.torcida >= 85, faz: (s) => { s.caixa += 2; }, texto: () => "A torcida está em festa: as camisas da equipe esgotaram e entraram 2 milhões no caixa.", quem: "Torcida" },
  { id: "diretoria", quando: (p) => p.diretoria >= 15, faz: (s) => { s.caixa += 3; }, texto: () => "A diretoria confia no seu trabalho e liberou 3 milhões a mais para o carro.", quem: "Diretoria" },
  { id: "patrocinador", quando: (p) => p.patrocinador >= 95, faz: (s) => { s.caixa += 3; }, texto: () => "O patrocinador está encantado e pagou um bônus de 3 milhões.", quem: "Patrocinador" },
  { id: "torcidaRuim", quando: (p) => p.torcida <= 15, faz: (s) => { s.caixa = Math.max(0, s.caixa - 1); }, texto: () => "A torcida sumiu das arquibancadas: a loja encalhou e saiu 1 milhão do caixa.", quem: "Torcida" },
];
function marcos(s) {
  const p = garantir(s); if (!p.marcos || typeof p.marcos !== "object") p.marcos = {};
  const nome = Pilotos.PILOTOS.find((x) => x.id === s.piloto2)?.nome || "Seu companheiro";
  for (const m of MARCOS) {
    const chave = `${s.ano}:${m.id}`; if (p.marcos[chave] || !m.quando(p)) continue;
    p.marcos[chave] = true; m.faz(s, p);
    const texto = m.texto(s, nome); anotar(s, m.quem, texto);
    (p.noticias ||= []).push({ ano: s.ano, gp: s.gp, t: texto.split(":")[0], x: texto, eq: s.equipe, quem: m.quem });
  }
}
// A virada do ano (regras.js proximaTemporada): os números voltam um pouco para o meio, e o mural guarda a virada.
function novaTemporada(s) {
  const p = garantir(s);
  for (const k of ["moral", "lealdade", "patrocinador", "torcida"]) p[k] = lim(p[k] + (55 - p[k]) * 0.3);
  p.diretoria = lim(p.diretoria * 0.5, -20, 20); p.promessa = null;
  for (const k of Object.keys(p.decisoes)) if (Number(k.split(":")[0]) < s.ano - 1) delete p.decisoes[k];
}
const salarios = (s) => (s.paddock ? (s.paddock.salarioComp || 0) + (s.paddock.salarioStaff || 0) : 0);
const api = { estrategiasDoGP, estrategiaEscolhida, modificadores, MARCOS, marcos, personalidade, experiencia, garantir, acontecimentos, decidir, aoResultado, novaTemporada, ajusteDeRitmo, salarios, substituto, EVENTOS, NOMES };
if (typeof module !== "undefined" && module.exports) module.exports = api;
else root.F1Paddock = api;
})(typeof window !== "undefined" ? window : globalThis);
