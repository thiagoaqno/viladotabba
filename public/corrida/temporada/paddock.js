// Corrida da Galera — o Paddock da carreira F1 solo (2026-11-15, a ideia do Thiago de uma temporada "viva"): a equipe passa a ter humor e memória.
// Contas puras, as mesmas no servidor (corrida-temporada.js, o evento "paddock", e regras.js) e no navegador (a aba Paddock, paddock-ui.js).
//
// O estado (s.paddock, criado na hora nos saves antigos):
//  - moral e lealdade do companheiro de equipe (0 a 100): a moral muda o ritmo dele na corrida (regras.js pilotosNoGrid: ±2 pontos de ritmo
//    nos extremos, ±0,4% no tempo de volta pela conta de f1-pilotos-2026.js fatorDeRitmo);
//  - satisfação do patrocinador (0 a 100): passando de 80 ele aumenta a verba por GP em 1 milhão; abaixo de 20 ele corta 1 milhão;
//  - torcida (0 a 100) e a conta com a diretoria (−20 a +20, somada à confiança da caixa de mensagens, regras.js imersao);
//  - as decisões tomadas (uma por acontecimento) e o mural: o que aconteceu, GP a GP.
// Os acontecimentos de cada GP são sorteados pela semente da carreira (o mesmo save vê sempre os mesmos) entre os que fazem sentido agora
// (o último resultado, a briga com o companheiro, a moral). Cada opção mexe nesses números e no caixa; a prova sai no mural.
(function (root) {
"use strict";
const Pilotos = root.F1Pilotos || require("../f1-pilotos-2026.js");
const PONTOS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
const lim = (v, a = 0, b = 100) => Math.max(a, Math.min(b, Math.round(v)));
function gerador(semente) {
  let a = 2166136261; for (const c of String(semente)) { a ^= c.charCodeAt(0); a = Math.imul(a, 16777619); } a = (a >>> 0) || 1;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function garantir(s) {
  if (!s.paddock || typeof s.paddock !== "object") s.paddock = {};
  const p = s.paddock;
  for (const [k, v] of [["moral", 55], ["lealdade", 50], ["patrocinador", 60], ["torcida", 50], ["diretoria", 0]]) if (!Number.isFinite(p[k])) p[k] = v;
  if (!p.decisoes || typeof p.decisoes !== "object") p.decisoes = {};
  if (!Array.isArray(p.mural)) p.mural = [];
  if (p.promessa === undefined) p.promessa = null;
  return p;
}
// uma linha no mural (os 60 últimos ficam)
function anotar(s, tipo, texto, efeito = null) {
  const p = garantir(s); p.mural.push({ ano: s.ano, gp: s.gp, tipo, texto, efeito });
  if (p.mural.length > 60) p.mural.splice(0, p.mural.length - 60);
}
// o ajuste de ritmo do companheiro pela moral (regras.js pilotosNoGrid): 50 é neutro, 0 tira 2 pontos, 100 dá 2
const ajusteDeRitmo = (s) => Math.round(((garantir(s).moral - 50) / 25) * 10) / 10;

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
    ],
  },
  conflito: {
    quem: "Piloto", fase: "pos",
    quando: (c) => bem(c.eu) && bem(c.comp) && Math.abs(c.eu.pos - c.comp.pos) <= 2,
    titulo: () => "Conflito entre companheiros",
    texto: (c) => `Vocês terminaram colados no último GP e ${c.nomeComp} reclama que você não respeitou o espaço na pista. A imprensa já percebeu o clima.`,
    opcoes: [
      { id: "eu", rotulo: "Defender a sua corrida", efeito: { moral: -8, lealdade: -5, torcida: 3 } },
      { id: "ele", rotulo: "Dar razão a ele", efeito: { moral: 10, lealdade: 6, diretoria: -2 } },
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
    quando: (c) => c.ultimo && (c.p.diretoria < -4 || c.p.diretoria > 8),
    titulo: (c) => (c.p.diretoria < 0 ? "A diretoria está impaciente" : "A diretoria está satisfeita"),
    texto: (c) => (c.p.diretoria < 0 ? "O conselho pediu uma reunião para entender o plano da equipe para o resto da temporada." : "O conselho gostou do rumo da equipe e quer saber o que você precisa."),
    opcoes: [
      { id: "plano", rotulo: "Apresentar um plano detalhado", efeito: { diretoria: 3 } },
      { id: "verba", rotulo: "Pedir mais verba (+2 milhões)", efeito: { caixa: 2, diretoria: -3 } },
    ],
  },
  saida: {
    quem: "Piloto", fase: "pos",
    quando: (c) => c.p.moral < 30 || c.p.lealdade < 30,
    titulo: (c) => `${c.nomeComp} conversa com outra equipe`,
    texto: (c) => `O empresário de ${c.nomeComp} foi visto no motorhome de uma rival. Com a moral baixa, ele pode não render no carro.`,
    opcoes: [
      { id: "segurar", rotulo: "Oferecer um aumento (−3 milhões)", efeito: { moral: 15, lealdade: 15, caixa: -3 } },
      { id: "confiar", rotulo: "Mostrar que conta com ele", efeito: { moral: 6, lealdade: 8 } },
      { id: "deixar", rotulo: "Deixar ir, se quiser", efeito: { moral: -6, lealdade: -10, diretoria: 1 } },
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
};
// os acontecimentos deste GP: até dois, sorteados pela semente entre os que fazem sentido (os já decididos continuam na lista, com a escolha)
function acontecimentos(s) {
  garantir(s);
  if (!s.calendario || s.gp >= s.tamanho) return [];
  const c = contexto(s), base = `${s.ano}:${s.gp}`;
  const candidatos = Object.keys(EVENTOS).filter((id) => s.paddock.decisoes[`${base}:${id}`] || EVENTOS[id].quando(c, s));
  const r = gerador(`paddock:${s.semente}:${base}`), embaralhados = candidatos.map((id) => [r(), id]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  const decididos = embaralhados.filter((id) => s.paddock.decisoes[`${base}:${id}`]), resto = embaralhados.filter((id) => !s.paddock.decisoes[`${base}:${id}`]);
  return [...decididos, ...resto].slice(0, 2).map((id) => {
    const e = EVENTOS[id], escolha = s.paddock.decisoes[`${base}:${id}`] || null;
    return { id, quem: e.quem, fase: e.fase, titulo: e.titulo(c), texto: e.texto(c), escolha, opcoes: e.opcoes.map((o) => ({ id: o.id, rotulo: o.rotulo, efeito: o.efeito })) };
  });
}
const NOMES = { moral: "moral do companheiro", lealdade: "lealdade", patrocinador: "patrocinador", torcida: "torcida", diretoria: "diretoria", caixa: "caixa" };
function aplicar(s, efeito) {
  const p = garantir(s);
  for (const k of ["moral", "lealdade", "patrocinador", "torcida"]) if (efeito[k]) p[k] = lim(p[k] + efeito[k]);
  if (efeito.diretoria) p.diretoria = lim(p.diretoria + efeito.diretoria, -20, 20);
  if (efeito.caixa) s.caixa = Math.max(0, s.caixa + efeito.caixa);
}
function decidir(s, id, opcao) {
  garantir(s);
  if (s.gp >= s.tamanho) throw Error("A temporada terminou.");
  const ev = acontecimentos(s).find((e) => e.id === id); if (!ev) throw Error("Este acontecimento não está mais aberto.");
  if (ev.escolha) throw Error("Você já decidiu isso.");
  const o = EVENTOS[id].opcoes.find((x) => x.id === opcao); if (!o) throw Error("Opção inválida.");
  if (o.efeito.caixa < 0 && s.caixa < -o.efeito.caixa) throw Error("Caixa insuficiente para essa decisão.");
  aplicar(s, o.efeito);
  if (o.promessa) s.paddock.promessa = { ano: s.ano, gp: s.gp };
  s.paddock.decisoes[`${s.ano}:${s.gp}:${id}`] = opcao;
  anotar(s, EVENTOS[id].quem, `${ev.titulo}: ${o.rotulo.replace(/\s*\(.*\)$/, "")}.`, o.efeito);
  return s;
}
// Depois de cada GP (regras.js registrarResultado): o resultado mexe no humor da equipe. `meta`: a posição-alvo do GP.
function aoResultado(s, resultado, meta) {
  const p = garantir(s), eu = resultado.linhas.find((r) => r.piloto === "voce"), comp = resultado.linhas.find((r) => r.piloto === s.piloto2);
  const ef = { moral: 0, patrocinador: 0, torcida: 0, lealdade: 0 }, notas = [];
  if (comp) {
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
  ef.torcida += bem(eu) ? Math.min(8, Math.round(((PONTOS[eu.pos - 1] || 0) + (eu.voltaRapida ? 1 : 0)) / 3)) - 1 : -3;
  aplicar(s, ef);
  anotar(s, "Fim de semana", `GP de ${s.calendario[resultado.gp]?.nome || resultado.pista}: ${bem(eu) ? `você em ${eu.pos}º` : "você não terminou"}${comp ? `, ${Pilotos.PILOTOS.find((x) => x.id === s.piloto2)?.nome || "o companheiro"} ${bem(comp) ? `em ${comp.pos}º` : "fora"}` : ""}${notas.length ? ` (${notas.join("; ")})` : ""}.`, ef);
  // o patrocinador nos extremos muda a verba por GP
  if (p.patrocinador >= 80 && s.patrocinio < 12) { s.patrocinio++; p.patrocinador = 62; anotar(s, "Patrocinador", `O patrocinador gostou e aumentou a verba para ${s.patrocinio} milhões por GP.`); }
  else if (p.patrocinador <= 20 && s.patrocinio > 3) { s.patrocinio--; p.patrocinador = 42; anotar(s, "Patrocinador", `O patrocinador cortou a verba para ${s.patrocinio} milhões por GP.`); }
}
// A virada do ano (regras.js proximaTemporada): os números voltam um pouco para o meio, e o mural guarda a virada.
function novaTemporada(s) {
  const p = garantir(s);
  for (const k of ["moral", "lealdade", "patrocinador", "torcida"]) p[k] = lim(p[k] + (55 - p[k]) * 0.3);
  p.diretoria = lim(p.diretoria * 0.5, -20, 20); p.promessa = null;
  for (const k of Object.keys(p.decisoes)) if (Number(k.split(":")[0]) < s.ano - 1) delete p.decisoes[k];
}
const api = { garantir, acontecimentos, decidir, aoResultado, novaTemporada, ajusteDeRitmo, EVENTOS, NOMES };
if (typeof module !== "undefined" && module.exports) module.exports = api;
else root.F1Paddock = api;
})(typeof window !== "undefined" ? window : globalThis);
