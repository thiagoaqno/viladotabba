// Temporada solo da F1: contas puras, usadas pelo servidor e pela sede.
(function (root) {
const Pilotos = root.F1Pilotos || require("../f1-pilotos-2026.js");
const Equipes = root.F1Equipes || require("../f1-equipes.js");
const Pecas = root.F1Pecas || require("../f1-pecas.js");
const Paddock = root.F1Paddock || require("./paddock.js"); // (2026-11-15) o humor da equipe: moral do companheiro, patrocinador, torcida e diretoria
const PONTOS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
// Todas as pistas recriadas do jogo, na ordem do calendário real de 2026.
const CALENDARIO = [
  ["melbourne", "Austrália"], ["xangai", "China"], ["suzuka", "Japão"], ["bahrein", "Bahrein"], ["jeddah", "Arábia Saudita"], ["miami", "Miami"], ["montreal", "Canadá"], ["monaco", "Mônaco"],
  ["barcelona", "Barcelona"], ["redbullring", "Áustria"], ["silverstone", "Grã-Bretanha"], ["spa", "Bélgica"], ["hungaroring", "Hungria"], ["zandvoort", "Holanda"], ["monza", "Itália"], ["madri", "Madri"],
  ["baku", "Azerbaijão"], ["singapura", "Singapura"], ["austin", "Estados Unidos"], ["mexico", "Cidade do México"], ["interlagos", "São Paulo"], ["lasvegas", "Las Vegas"], ["catar", "Catar"], ["abudhabi", "Abu Dhabi"],
];
// As pistas do sorteio dos calendários de 4 e 8 GPs e da temporada completa: hoje, todas as do CALENDARIO (a chave é a mesma de `pistas.js`).
const PISTAS_TRABALHADAS = CALENDARIO.map(([pista]) => pista);
// mulberry32 sobre o hash do texto (a mesma família de f1-regras.js `sorteio`, sem depender dele aqui)
function gerador(semente) {
  let a = 2166136261; for (const c of String(semente)) { a ^= c.charCodeAt(0); a = Math.imul(a, 16777619); } a = (a >>> 0) || 1;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function embaralhar(lista, r) {
  const v = lista.slice();
  for (let i = v.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [v[i], v[j]] = [v[j], v[i]]; }
  return v;
}
// Sorteia `tamanho` GPs sem repetir pista, de PISTAS_TRABALHADAS; se o calendário for maior que a lista, completa com as demais
// do CALENDARIO. Depois põe na ordem do CALENDARIO. `anterior` (as pistas
// da temporada passada) faz o sorteio tentar outro conjunto, quando existe outro. Devolve a semente que valeu, para guardar no estado.
function sortearCalendario(tamanho, semente, anterior = []) {
  const n = Math.min(tamanho, CALENDARIO.length), antes = [...anterior].sort().join();
  const chaves = CALENDARIO.map(([pista]) => pista), boas = PISTAS_TRABALHADAS.filter((k) => chaves.includes(k));
  const resto = chaves.filter((k) => !boas.includes(k));
  let escolha, usada;
  for (let tentativa = 0; tentativa < 20; tentativa++) {
    usada = `calendario:${semente}:${tentativa}`;
    const r = gerador(usada), ordem = [...embaralhar(boas, r), ...embaralhar(resto, r)];
    escolha = ordem.slice(0, n);
    if (escolha.slice().sort().join() !== antes) break;
  }
  return { semente: usada, calendario: CALENDARIO.filter(([pista]) => escolha.includes(pista)).map(([pista, nome]) => ({ pista, nome })) };
}
const ENGENHEIROS = {
  mecanico: [{ nome: "Equipe de base", custo: 0, reducao: 0 }, { nome: "Box experiente", custo: 8, reducao: 0.12 }, { nome: "Box de elite", custo: 18, reducao: 0.24 }],
  estrategista: [{ nome: "Equipe de base", custo: 0, reducao: 0 }, { nome: "Estrategista experiente", custo: 6, reducao: 0.08 }, { nome: "Estrategista de elite", custo: 14, reducao: 0.16 }],
};
const teto = 140;
const inteiro = (n) => Number.isInteger(n) && n >= 0;
const NIVEIS = ["facil", "medio", "dificil"];
// (2026-11-21, o Thiago: "escolher ir com o nosso nick ou jogar a carreira com um piloto já existente") `real`: o id de um piloto da equipe
// (f1-pilotos-2026.js, do ano da carreira). Você é ele: o nome, o número e o capacete dele, a vaga dele no carro (o outro titular é o seu
// companheiro) e ele some do grid dos robôs (pilotosNoGrid, tabelas). Sem `real`, o de sempre: você entra no lugar do segundo titular.
function criar(nome, equipe, tamanho = 8, voltas = 3, semente = Date.now(), nivel = "medio", real = null) {
  if (!Pilotos.EQUIPES[equipe] || !Equipes.EQUIPES[equipe]) throw Error("Equipe inválida.");
  if (![4, 8, PISTAS_TRABALHADAS.length].includes(tamanho) || ![2, 3, 5, 10].includes(voltas)) throw Error("Formato inválido.");
  if (!NIVEIS.includes(nivel)) throw Error("Nível dos robôs inválido.");
  const titulares = Pilotos.PILOTOS.filter((p) => p.equipe === equipe);
  const eu = real ? titulares.find((p) => p.id === real) : null; if (real && !eu) throw Error("Esse piloto não corre por essa equipe.");
  if (eu) nome = eu.nome;
  const sorteado = sortearCalendario(tamanho, semente);
  return { v: 1, nome: String(nome || "").trim().slice(0, 40), equipe, ano: 1, gp: 0, tamanho, voltas, nivel, semente,
    montagem: Object.fromEntries(Equipes.ORDEM.map((k) => [k, 0])), bonus: 0, caixa: 42, gasto: 0, patrocinio: verbaBase(equipe),
    piloto2: (eu ? titulares.find((p) => p.id !== eu.id) : titulares[0]).id, ...(eu ? { pilotoReal: eu.id } : {}), engenheiros: { mecanico: 0, estrategista: 0 },
    resultados: [], calendario: sorteado.calendario, calendarioSemente: sorteado.semente };
}
// monta o carro: a carreira usa `d.montagem` (pontos livres); `d.pecas` segue aceito em saves antigos.
function aplicarMontagem(s, d) {
  const v = Pecas.resolver(s.equipe, d, s.bonus, s.montagem); // (acima do orçamento, só deixa mudar para mais barato: f1-equipes.js validar)
  if (!v.ok) throw Error(v.erro);
  s.montagem = v.montagem; s.pecas = v.pecas; // `pecas` é null quando veio do formato antigo
}
function conferirMontagem(s, m) {
  const v = Equipes.validar(s.equipe, m, s.bonus);
  if (!v.ok) throw Error(v.erro);
  return v.montagem;
}
function gastar(s, quantia) {
  if (!inteiro(quantia) || quantia > s.caixa) throw Error("Caixa insuficiente.");
  if (s.gasto + quantia > teto) throw Error(`Teto de gastos de ${teto} milhões atingido nesta temporada.`);
  s.caixa -= quantia; s.gasto += quantia;
}
function contratarPiloto(s, id) {
  if (s.gp >= s.tamanho) throw Error("A temporada terminou.");
  const p = Pilotos.PILOTOS.find((x) => x.id === id);
  if (!p || p.id === vagaDe(s).id || p.id === s.pilotoReal) throw Error("Piloto indisponível.");
  if (s.piloto2 === id) return s;
  if (s.paddock) { s.paddock.moral = 55; s.paddock.lealdade = 50; } // (companheiro novo, humor novo)
  const custo = Math.max(5, Math.round((p.ritmo - 70) * 0.7));
  gastar(s, custo); s.piloto2 = id; return s;
}
// a dificuldade dos robôs no meio da carreira: vale a partir do próximo GP (cada GP lê s.nivel quando abre a sala)
function mudarNivel(s, nivel) {
  if (!NIVEIS.includes(nivel)) throw Error("Nível dos robôs inválido.");
  s.nivel = nivel; return s;
}
function contratarEngenheiro(s, area, nivel) {
  const lista = ENGENHEIROS[area];
  if (!lista || ![0, 1, 2].includes(nivel)) throw Error("Engenheiro inválido.");
  if (nivel <= s.engenheiros[area]) throw Error("Escolha um nível superior.");
  gastar(s, lista[nivel].custo - lista[s.engenheiros[area]].custo);
  s.engenheiros[area] = nivel; return s;
}
// O desenvolvimento do carro: até BONUS_POR_TEMPORADA pontos por temporada, que se acumulam de um ano para o outro (até BONUS_MAX). O preço
// sobe dentro da temporada (20, 30) e recomeça na seguinte (2026-11-16: eram 12, 18, 24, 30, com 4 pontos por ano).
const limiteDoAno = (ano) => Math.min(Equipes.BONUS_MAX, Equipes.BONUS_POR_TEMPORADA * Math.max(1, ano || 1));
const custoDoDesenvolvimento = (bonus, ano) => 20 + Math.max(0, bonus - (limiteDoAno(ano) - Equipes.BONUS_POR_TEMPORADA)) * 10; // (2026-11-16: era 12 + 6 por ponto; a progressão mais lenta)
function desenvolver(s) {
  if (s.bonus >= limiteDoAno(s.ano)) throw Error(s.bonus >= Equipes.BONUS_MAX ? "O carro atingiu o limite de desenvolvimento." : "O carro já evoluiu tudo o que dava nesta temporada.");
  if (s.paddock && s.paddock.desenvolvimentoGratis) s.paddock.desenvolvimentoGratis = false; // (o marco do companheiro parceiro: paddock.js MARCOS)
  else gastar(s, custoDoDesenvolvimento(s.bonus, s.ano));
  s.bonus++; return s;
}
// Equipes controladas pelo jogo desenvolvem o carro durante a temporada. A semente original e o GP
// determinam os pontos: saves antigos funcionam e reabrir o mesmo GP nunca muda a montagem.
// As equipes da máquina evoluem como quem joga (2026-11-13, o Thiago: "só os humanos estão conseguindo upar os carros"):
//  · os mesmos BONUS_POR_TEMPORADA pontos por temporada, que se acumulam de um ano para o outro (até BONUS_MAX), cada equipe no seu ritmo;
//    o ponto que cairia numa peça já no máximo vai para a seguinte (antes ele se perdia);
//  · com `pista`, o carro é ajustado para ela, como quem joga monta: o acerto ideal medido de cada pista (acerto-ideal.json, `asa`: 0 pede
//    pouca asa, 1 pede muita) puxa até 2 pontos do motor para a asa nas pistas de curva, ou da asa para o motor nas de reta;
//  · os engenheiros (`engenheiros[id]` = { mecanico, estrategista }): a equipe grande começa com um mecânico, e todas ganham um nível por
//    temporada, até o máximo de quem joga (o bônus de box é a mesma conta da sede: mecânico × 0,5 + estrategista × 0,25 s por parada).
function desenvolvimentoRivais({ semente, ano = 1, gp = 0, tamanho = 8 }, equipesHumanas = [], pista = null) {
  const humanos = new Set(equipesHumanas), montagens = {}, bonus = {}, engenheiros = {}, bonusBox = {};
  const base = Number(semente) - (ano - 1) * 937;
  const rodadas = Math.max(0, (ano - 1) * tamanho + gp), ideal = pista ? asaIdeal(pista) : null;
  for (const [id, equipe] of Object.entries(Equipes.EQUIPES)) {
    if (humanos.has(id)) continue;
    // (2026-11-15, o Thiago: "não deve ser aleatório, tem que fazer sentido") o momento do ponto na temporada sai do tamanho da equipe: o `atraso` entra
    // SOMANDO na conta, então as pequenas recebem o ponto mais cedo (meia temporada) e as do meio 1/4 antes das 3 grandes; no ano todas somam o mesmo
    // (2026-11-16, corrigido o comentário, que dizia o contrário; o Thiago quer as pequenas acompanhando). As peças seguem prioridadeDaPeca.
    const atraso = Math.floor(tamanho * [0, 0.25, 0.5][faixaDe(id)]);
    const pontos = Math.min(Equipes.BONUS_MAX, Math.floor((rodadas * Equipes.BONUS_POR_TEMPORADA + atraso) / tamanho));
    const m = { ...equipe.padrao }, limite = equipe.orcamento + pontos; // (2026-11-15: os níveis altos custam mais; o rival gasta do mesmo jeito que você)
    for (let k = 0; k < 200; k++) {
      let melhor = null, nota = Infinity;
      for (const p of Equipes.ORDEM) {
        if (m[p] >= Equipes.MAX_NIVEL || Equipes.custoDaMontagem({ ...m, [p]: m[p] + 1 }) > limite) continue;
        const v = prioridadeDaPeca(m, p, equipe.padrao); if (v < nota) { nota = v; melhor = p; }
      }
      if (!melhor) break; m[melhor]++;
    }
    if (ideal != null) ajustarParaPista(m, ideal);
    montagens[id] = m; bonus[id] = pontos;
    const faixa = faixaDe(id), nivel = Math.min(2, (faixa === 0 ? 1 : 0) + Math.floor((rodadas + atraso) / tamanho));
    engenheiros[id] = { mecanico: nivel, estrategista: Math.max(0, nivel - (faixa === 2 ? 1 : 0)) };
    bonusBox[id] = engenheiros[id].mecanico * 0.5 + engenheiros[id].estrategista * 0.25;
  }
  return { montagens, bonus, engenheiros, bonusBox };
}
// Onde o rival põe o próximo ponto (a menor nota ganha): no nível mais baixo e mais barato, puxado para o forte da equipe (a Ferrari
// cuida do motor, a Red Bull da asa) e para o que mais dá tempo de volta (motor e asa, depois chassi e suspensão). Nunca passa das
// travas de specDaMontagem: a asa só rende até a suspensão + 4 e o motor até a confiabilidade + 4; quando a peça bate na trava, sobe a
// que segura ela (o rival não joga ponto fora como antes, quando a confiabilidade nem entrava na lista).
const PESO_PECA = { motor: 0.6, aero: 0.6, chassi: 0.3, suspensao: 0.3, freios: 0.2, confiab: 0.1 };
function prioridadeDaPeca(m, p, padrao) {
  if (p === "aero" && m.aero >= m.suspensao + 4) return Infinity;
  if (p === "motor" && m.motor >= m.confiab + 4) return Infinity;
  const trava = (p === "suspensao" && m.aero >= m.suspensao + 3) || (p === "confiab" && m.motor >= m.confiab + 3) ? 1 : 0;
  return m[p] + 1.5 * (Equipes.custoDoNivel(m[p] + 1) - 1) - 0.5 * ((padrao[p] || 0) - 3) - PESO_PECA[p] - trava;
}
// o acerto ideal de asa da pista (0 a 1), medido por ferramentas/acerto-ideal.js; null se a pista não tem medição
let IDEAIS = null;
function asaIdeal(pista) {
  if (IDEAIS == null) { try { IDEAIS = root.AcertoIdeal || (typeof require === "function" ? require("../acerto-ideal.json") : {}); } catch { IDEAIS = {}; } }
  const v = IDEAIS && IDEAIS[pista] && IDEAIS[pista].asa; return Number.isFinite(v) ? v : null;
}
// passa até 2 pontos entre o motor e a asa (a soma não muda): pista de curva (asa ideal ≥ 0,75) pede asa; de reta (≤ 0,25), motor
function ajustarParaPista(m, asa) {
  const de = asa >= 0.75 ? "motor" : asa <= 0.25 ? "aero" : null, para = de === "motor" ? "aero" : "motor"; if (!de) return m;
  for (let i = 0; i < 2 && m[de] > 1 && m[para] < Equipes.MAX_NIVEL; i++) { m[de]--; m[para]++; }
  return m;
}
// o titular que você substitui na equipe de agora: o próprio piloto real (na equipe dele), senão o segundo titular que não é o seu companheiro
const pilotoRealDe = (s) => (s && s.pilotoReal ? Pilotos.PILOTOS.find((p) => p.id === s.pilotoReal) || null : null);
function vagaDe(s) {
  const titulares = Pilotos.PILOTOS.filter((p) => p.equipe === s.equipe), real = pilotoRealDe(s);
  if (real && real.equipe === s.equipe) return real;
  return titulares.find((p) => p.id !== s.piloto2 && p.id !== titulares[0].id) || titulares[1] || titulares[0];
}
function pilotosNoGrid(s) {
  const titulares = Pilotos.PILOTOS.filter((p) => p.equipe === s.equipe);
  const companheiro = Pilotos.PILOTOS.find((p) => p.id === s.piloto2);
  const vaga = vagaDe(s), real = pilotoRealDe(s);
  const removidos = new Set([vaga.id, companheiro.id, ...(real ? [real.id] : [])]);
  const disponiveis = Pilotos.PILOTOS.filter((p) => !removidos.has(p.id) && p.equipe !== s.equipe);
  // o piloto real que trocou de equipe deixou a vaga dele na equipe antiga: quem você tirou da equipe nova vai para lá
  if (real && real.equipe !== s.equipe && vaga.id !== real.id) disponiveis.push({ ...vaga, equipe: real.equipe });
  // Se o companheiro veio de outra equipe, o titular deslocado ocupa a vaga deixada por ele.
  const rivais = disponiveis.slice();
  if (companheiro.equipe !== s.equipe) {
    const deslocado = titulares.find((p) => p.id !== companheiro.id && p.id !== vaga.id && p.id !== s.pilotoReal);
    if (deslocado) rivais.push({ ...deslocado, equipe: companheiro.equipe });
  }
  const ritmo = companheiro.ritmo + (s.paddock ? Paddock.ajusteDeRitmo(s) : 0); // (a moral do Paddock: ±2 pontos de ritmo nos extremos)
  const pers = s.paddock ? Paddock.personalidade(s, companheiro) : null; // (a confiança, a experiência e a agressividade: paddock.js)
  // (2026-11-16) a relação vai para a pista (corrida-robos.js, companheiroNaPista): parceiro abre passagem e segura quem vem atrás; tenso não obedece
  const pd = s.paddock, relacao = pd ? (pd.moral >= 75 && pd.lealdade >= 65 ? "parceiro" : pd.moral <= 30 ? "tenso" : null) : null;
  // (2026-11-16, a rivalidade) o rival da temporada (imersao: com quem você mais disputou posição no ano) vai marcado, com a rixa (as batidas
  // entre vocês nos GPs de antes, paddock.js): corrida-robos.js rivalNaPista
  const rivalId = (() => { try { return imersao(s).rival?.id || null; } catch { return null; } })(), rixa = (pd && pd.rixas && pd.rixas[rivalId]) || 0;
  // (2026-11-21) e o piloto que você provocou depois de um toque (paddock.js toquePiloto): rival só neste GP, com a rixa no máximo
  const inimigo = pd && pd.inimigo && pd.inimigo.ano === s.ano && pd.inimigo.gp === s.gp ? pd.inimigo.id : null;
  const marcar = (r) => (r.id === rivalId ? { ...r, rival: true, ...(rixa ? { rixa } : {}) } : r.id === inimigo ? { ...r, rival: true, rixa: 3 } : r);
  return [{ ...companheiro, equipe: s.equipe, ritmo, ...(relacao ? { relacao } : {}), ...(pers ? { constancia: pers.constancia, largada: pers.largada, ...(pers.perfil ? { perfil: pers.perfil } : {}) } : {}) }, ...rivais.map(marcar)].slice(0, 21);
}
// Metas dependem da força inicial da equipe, não do resultado que acabou de acontecer.
function metas(s) {
  const ordem = Object.keys(Equipes.EQUIPES).sort((a, b) => Equipes.EQUIPES[b].orcamento - Equipes.EQUIPES[a].orcamento || a.localeCompare(b));
  const faixa = ordem.indexOf(s.equipe);
  return { gp: faixa < 3 ? 6 : faixa < 7 ? 10 : 15, temporada: faixa < 3 ? 5 : faixa < 7 ? 10 : 15 };
}
function imersao(s) {
  const meta = metas(s), resultados = s.resultados || [];
  // Saves anteriores à caixa de mensagens recuperam uma confiança coerente a partir dos resultados já guardados.
  let confianca = 50;
  const duelos = new Map();
  for (const r of resultados) {
    const eu = r.linhas.find((x) => x.piloto === "voce"); if (!eu) continue;
    if (eu.equipe && eu.equipe !== s.equipe) continue; // (2026-11-21) a confiança é da diretoria da equipe de agora: trocou de equipe, a conta recomeça
    const alvo = r.objetivoGP || meta.gp, cumpriu = !eu.dnf && !eu.nc && eu.pos <= alvo;
    confianca = Math.max(0, Math.min(100, confianca + (cumpriu ? 6 : -4)));
    if (r.gp === s.tamanho - 1) {
      const pos = tabelas({ ...s, ano: r.ano }).pilotos.findIndex((p) => p.id === "voce") + 1;
      confianca = Math.max(0, Math.min(100, confianca + (pos <= (r.objetivoTemporada || meta.temporada) ? 10 : -8)));
    }
    if (r.ano !== s.ano) continue;
    for (const p of r.linhas) {
      if (p.piloto === "voce" || p.dnf || p.nc || eu.dnf || eu.nc || !Pilotos.PILOTOS.some((x) => x.id === p.piloto)) continue;
      const distancia = Math.abs(p.pos - eu.pos); if (distancia > 3) continue;
      const d = duelos.get(p.piloto) || { id: p.piloto, encontros: 0, venceu: 0, perdeu: 0, distancia: 0 };
      d.encontros++; d.distancia += distancia; if (eu.pos < p.pos) d.venceu++; else d.perdeu++; duelos.set(p.piloto, d);
    }
  }
  const rival = [...duelos.values()].sort((a, b) => b.encontros - a.encontros || a.distancia - b.distancia || a.id.localeCompare(b.id))[0] || null;
  const classificacao = tabelas(s).pilotos.findIndex((p) => p.id === "voce") + 1;
  if (s.paddock && Number.isFinite(s.paddock.diretoria)) confianca = Math.max(0, Math.min(100, confianca + s.paddock.diretoria)); // (a conta com a diretoria no Paddock)
  return { meta, confianca, rival, classificacao };
}
function registrarResultado(s, linhas, analise = null) {
  if (s.gp >= s.tamanho) throw Error("A temporada terminou.");
  if (!Array.isArray(linhas) || ![20, 22].includes(linhas.length)) throw Error("Resultado incompleto.");
  const total = linhas.length; // aceita também GPs de 20 que já estavam em andamento
  const ids = new Set(linhas.map((r) => r.piloto));
  const posicoes = new Set(linhas.map((r) => r.pos));
  if (ids.size !== total || !ids.has("voce") || posicoes.size !== total || linhas.some((r) => !inteiro(r.pos) || r.pos < 1 || r.pos > total || r.pontos !== (r.dnf || r.nc ? 0 : (PONTOS[r.pos - 1] || 0) + (r.voltaRapida ? 1 : 0))) || linhas.filter((r) => r.voltaRapida).length > 1) throw Error("Resultado inválido.");
  const gp = s.calendario[s.gp];
  const objetivo = metas(s);
  const resultado = { ano: s.ano, gp: s.gp, pista: gp.pista, objetivoGP: objetivo.gp, objetivoTemporada: objetivo.temporada, linhas: linhas.map((r) => ({ piloto: r.piloto, equipe: r.equipe, pos: r.pos, pontos: r.pontos || 0, dnf: !!r.dnf, nc: !!r.nc, voltaRapida: !!r.voltaRapida })) };
  if (analise) resultado.analise = analise;
  s.resultados.push(resultado); s.gp++;
  const humano = resultado.linhas.find((r) => r.piloto === "voce");
  const premio = 4 + Math.round((humano.pontos || 0) * 0.4);
  const contratado = Pilotos.PILOTOS.find((p) => p.id === s.piloto2);
  const salarios = 3 + Math.round((contratado.ritmo - 70) / 8) + s.engenheiros.mecanico + s.engenheiros.estrategista + Paddock.salarios(s); // (+ os aumentos do Paddock)
  const bonus = pagarBonus(s, humano);
  s.caixa = Math.max(0, s.caixa + s.patrocinio + premio + bonus - salarios);
  resultado.financas = { patrocinio: s.patrocinio, premio, salarios, bonus };
  const receita = s.patrocinio + premio + bonus - salarios;
  Paddock.aoResultado(s, resultado, objetivo.gp); // (o humor da equipe depois do GP; a verba nova do patrocinador vale a partir do próximo)
  demissaoNoMeio(s);
  return { resultado, receita };
}
function tabelas(s) {
  const pilotos = new Map(), equipes = new Map();
  for (const p of Pilotos.PILOTOS) if (p.id !== s.pilotoReal) pilotos.set(p.id, { id: p.id, nome: p.nome, equipe: p.equipe, pontos: 0, vitorias: 0, colocacoes: Array(22).fill(0) }); // (o piloto real da carreira é "voce")
  if (pilotos.has(s.piloto2)) pilotos.get(s.piloto2).equipe = s.equipe;
  pilotos.set("voce", { id: "voce", nome: s.nome, equipe: s.equipe, pontos: 0, vitorias: 0, colocacoes: Array(22).fill(0) });
  for (const [id, eq] of Object.entries(Pilotos.EQUIPES)) equipes.set(id, { id, nome: eq.nome, pontos: 0, vitorias: 0, colocacoes: Array(22).fill(0) });
  for (const gp of s.resultados.filter((r) => r.ano === s.ano)) for (const r of gp.linhas) {
    const p = pilotos.get(r.piloto); if (!p) continue;
    p.equipe = r.equipe; p.pontos += r.pontos; p.vitorias += r.pos === 1 && !r.nc && !r.dnf ? 1 : 0;
    if (!r.dnf && !r.nc) p.colocacoes[r.pos - 1]++;
    const e = equipes.get(r.equipe); if (e) { e.pontos += r.pontos; e.vitorias += r.pos === 1 && !r.nc && !r.dnf ? 1 : 0; if (!r.dnf && !r.nc) e.colocacoes[r.pos - 1]++; }
  }
  const ordenar = (a, b) => b.pontos - a.pontos || b.vitorias - a.vitorias || a.colocacoes.reduce((d, _, i) => d || b.colocacoes[i] - a.colocacoes[i], 0)
    || Number(b.id === "voce" || b.id === s.equipe) - Number(a.id === "voce" || a.id === s.equipe) || a.nome.localeCompare(b.nome, "pt-BR");
  return { pilotos: [...pilotos.values()].sort(ordenar), equipes: [...equipes.values()].sort(ordenar) };
}
// ---------- o contrato, os objetivos e as propostas ----------
// A faixa da equipe (pelo orçamento) decide o tamanho das metas: 0 = equipe de ponta, 1 = do meio, 2 = de trás.
const ordemDeForca = () => Object.keys(Equipes.EQUIPES).sort((a, b) => Equipes.EQUIPES[b].orcamento - Equipes.EQUIPES[a].orcamento || a.localeCompare(b));
const faixaDe = (equipe) => { const i = ordemDeForca().indexOf(equipe); return i < 3 ? 0 : i < 7 ? 1 : 2; };
const BONUS_VITORIA = [1, 2, 3], VERBA_FAIXA = [8, 6, 5];
// (2026-11-21, o Thiago: "rever os contratos para ter opções mais vantajosas e receber oportunidades de outras equipes; o salário e os requisitos
// têm que ser diferentes; tem que rolar demissões, até a minha") O contrato é o que entra no caixa da equipe (não há caixa do piloto): a verba por
// GP de cada equipe vai da mais rica (9 milhões) à mais pobre (4), e a proposta de quem quer você soma pela sua posição no campeonato (até +3).
// As exigências são as metas da equipe nova (metas(): top no GP e no campeonato). Escolhidos para o jogo, não medidos.
const verbaBase = (equipe) => { const i = Math.max(0, ordemDeForca().indexOf(equipe)); return Math.max(4, Math.round(9 - i * 0.5)); };
const extraPelaPosicao = (pos) => (pos <= 3 ? 3 : pos <= 6 ? 2 : pos <= 10 ? 1 : 0);
function garantirContrato(s) {
  if (!s.contrato) s.contrato = { inicio: s.ano, fim: s.ano, bonusVitoria: BONUS_VITORIA[faixaDe(s.equipe)] };
  return s.contrato;
}
function contrato(s) {
  const c = s.contrato || { inicio: s.ano, fim: s.ano, bonusVitoria: BONUS_VITORIA[faixaDe(s.equipe)] };
  return { ...c, verbaGP: s.patrocinio, restam: Math.max(0, (c.fim - s.ano) * s.tamanho + s.tamanho - s.gp), precontrato: s.precontrato || null };
}
function numerosDoAno(s) {
  const n = { vitorias: 0, podios: 0, pontuou: 0, poles: 0, top5: 0, top10: 0 };
  for (const r of s.resultados) {
    if (r.ano !== s.ano) continue;
    const eu = r.linhas.find((x) => x.piloto === "voce"), g = r.analise?.pilotos?.voce?.g || 0;
    if (g === 1) n.poles++;
    if (g >= 1 && g <= 5) n.top5++;
    if (g >= 1 && g <= 10) n.top10++;
    if (!eu || eu.dnf || eu.nc) continue;
    if (eu.pos === 1) n.vitorias++;
    if (eu.pos <= 3) n.podios++;
    if (eu.pontos > 0) n.pontuou++;
  }
  return n;
}
// as metas de bônus da temporada: pagas no caixa uma vez, na hora em que se cumprem
function metasDeBonus(s, n = numerosDoAno(s)) {
  const f = faixaDe(s.equipe), q = (k) => Math.max(1, Math.ceil(s.tamanho * k)), umaOuVarias = (v, um, varias) => (v === 1 ? um : varias);
  if (f === 0) return [{ id: "largada", nome: `Conquistar ${q(0.25)} ${umaOuVarias(q(0.25), "pole", "poles")}`, atual: n.poles, alvo: q(0.25), premio: 3 }, { id: "chegada", nome: `Subir ao pódio em ${q(0.5)} corridas`, atual: n.podios, alvo: q(0.5), premio: 4 }];
  if (f === 1) return [{ id: "largada", nome: `Largar no top 5 em ${q(0.25)} ${umaOuVarias(q(0.25), "GP", "GPs")}`, atual: n.top5, alvo: q(0.25), premio: 3 }, { id: "chegada", nome: `Pontuar em ${q(0.5)} corridas`, atual: n.pontuou, alvo: q(0.5), premio: 4 }];
  return [{ id: "largada", nome: `Largar no top 10 em ${q(0.25)} ${umaOuVarias(q(0.25), "GP", "GPs")}`, atual: n.top10, alvo: q(0.25), premio: 3 }, { id: "chegada", nome: `Pontuar em ${q(0.25)} ${umaOuVarias(q(0.25), "corrida", "corridas")}`, atual: n.pontuou, alvo: q(0.25), premio: 4 }];
}
function pagarBonus(s, humano) {
  const c = garantirContrato(s), pagos = (s.bonusPagos ||= {}); let total = 0;
  if (humano && humano.pos === 1 && !humano.dnf && !humano.nc) total += c.bonusVitoria;
  for (const m of metasDeBonus(s)) { const k = `${s.ano}:${s.equipe}:${m.id}`; if (m.atual >= m.alvo && !pagos[k]) { pagos[k] = true; total += m.premio; } }
  return total;
}
function objetivos(s, tb = null) { // `tb`: as tabelas já prontas (na temporada em grupo, as da sala)
  const f = faixaDe(s.equipe), t = tb || tabelas(s), n = numerosDoAno(s), meta = metas(s), acabou = s.gp >= s.tamanho, q = (k) => Math.max(1, Math.ceil(s.tamanho * k));
  const pos = t.pilotos.findIndex((p) => p.id === "voce") + 1, posE = t.equipes.findIndex((e) => e.id === s.equipe) + 1, alvoE = [1, 5, 8][f];
  const estado = (ok) => (acabou ? (ok ? "cumprido" : "falhou") : ok ? "caminho" : "risco");
  const plural = (v, um, varias) => (v === 1 ? um : varias);
  const contagem = f === 0 ? { nome: `Conquistar ${q(0.25)} ${plural(q(0.25), "vitória", "vitórias")}`, atual: n.vitorias, alvo: q(0.25), nota: "Meta de vitórias" }
    : f === 1 ? { nome: `Subir ao pódio em ${q(0.125)} ${plural(q(0.125), "corrida", "corridas")}`, atual: n.podios, alvo: q(0.125), nota: "Meta de pódios" }
    : { nome: `Pontuar em ${q(0.25)} ${plural(q(0.25), "corrida", "corridas")}`, atual: n.pontuou, alvo: q(0.25), nota: "Meta de pontos" };
  const lider = t.equipes[0], segundo = t.equipes[1], minha = t.equipes[posE - 1];
  return {
    expectativa: { pilotos: meta.temporada, construtores: alvoE },
    pilotos: { nome: `Terminar entre os ${meta.temporada} primeiros`, sub: "Campeonato de pilotos", atual: pos, alvo: meta.temporada, estado: s.gp ? estado(pos <= meta.temporada) : "aberto" },
    contagem: { ...contagem, estado: contagem.atual >= contagem.alvo ? "cumprido" : acabou ? "falhou" : "aberto" },
    construtores: { nome: alvoE === 1 ? "Vencer o campeonato de construtores" : `Ficar entre os ${alvoE} primeiros construtores`, atual: posE, alvo: alvoE, estado: s.gp ? estado(posE <= alvoE) : "aberto", sub: !s.gp ? "A disputa começa no primeiro GP." : posE === 1 ? `${lider.nome} lidera por ${lider.pontos - (segundo?.pontos || 0)} pontos.` : `Faltam ${lider.pontos - minha.pontos} pontos para ${lider.nome}.` },
    bonus: metasDeBonus(s, n).map((m) => ({ ...m, pago: !!s.bonusPagos?.[`${s.ano}:${s.equipe}:${m.id}`] })),
  };
}
// como está a renovação: a confiança da diretoria decide
function perspectiva(s) {
  const c = imersao(s).confianca;
  return c >= 65 ? { nivel: "favoravel", rotulo: "Favorável", confianca: c } : c >= 40 ? { nivel: "neutra", rotulo: "Em aberto", confianca: c } : { nivel: "risco", rotulo: "Em risco", confianca: c };
}
function renovar(s, anos) {
  if (![1, 2].includes(anos)) throw Error("Prazo inválido.");
  const c = garantirContrato(s), p = perspectiva(s);
  if (c.fim > s.ano) throw Error("Seu contrato já cobre a próxima temporada.");
  if (s.paddock && s.paddock.demitido && s.paddock.demitido.ano === s.ano) throw Error("Você foi demitido: a equipe não renova. Escolha uma das propostas.");
  if (p.confianca < 25) throw Error("A diretoria não quer conversar agora. Melhore os resultados primeiro.");
  if (s.precontrato) throw Error("Você já assinou com outra equipe para a próxima temporada.");
  c.fim = s.ano + anos;
  if (p.confianca >= 70) s.patrocinio = Math.min(14, s.patrocinio + 2); else if (p.confianca >= 50) s.patrocinio = Math.min(14, s.patrocinio + 1); // boa fase: a verba por GP sobe na assinatura
  return s;
}
// As propostas (2026-11-21): do meio do ano em diante as equipes mais fortes sondam quem vai bem (pré-contrato para a próxima temporada); nas 2
// últimas etapas vêm todas: uma mais forte (se a temporada foi boa), uma parecida e uma para liderar. Cada uma com a verba dela, o extra pela sua
// posição, o bônus por vitória e as exigências (as metas da equipe nova).
function propostas(s) {
  const meio = s.gp >= Math.ceil(s.tamanho / 2), fim = s.gp >= s.tamanho - 2; if (!meio) return [];
  const ordem = ordemDeForca(), i = ordem.indexOf(s.equipe), pos = tabelas(s).pilotos.findIndex((p) => p.id === "voce") + 1;
  const passo = pos <= 5 ? 3 : pos <= 10 ? 2 : pos <= 15 ? 1 : 0;
  const alvos = fim ? [i - passo, i + 1, i + 3] : passo >= 2 ? [i - passo, i - passo + 1] : [];
  return [...new Set(alvos.map((k) => ordem[Math.max(0, Math.min(ordem.length - 1, k))]))].filter((id) => id !== s.equipe).map((id) => ({
    equipe: id, verbaGP: Math.min(14, verbaBase(id) + extraPelaPosicao(pos)), bonusVitoria: BONUS_VITORIA[faixaDe(id)], exige: metas({ ...s, equipe: id }),
    orcamento: Equipes.EQUIPES[id].orcamento, antecipada: !fim }));
}
// troca de equipe (a proposta assinada, ou a demissão): o carro novo, o companheiro novo, o humor da equipe do zero
function trocarDeEquipe(s, id, termos, inicio) {
  const titulares = Pilotos.PILOTOS.filter((x) => x.equipe === id);
  if (s.paddock) { s.paddock.moral = 55; s.paddock.lealdade = 50; s.paddock.patrocinador = 60; s.paddock.salarioComp = 0; s.paddock.salarioStaff = 0; s.paddock.demitido = null; s.paddock.ultimato = null; s.paddock.diretoria = 0; } // (equipe nova: o humor e a conta com a diretoria recomeçam)
  s.equipe = id; s.piloto2 = (titulares.find((x) => x.id !== s.pilotoReal) || titulares[0]).id; s.montagem = Object.fromEntries(Equipes.ORDEM.map((k) => [k, 0])); s.pecas = null; s.bonus = 0;
  s.patrocinio = termos.verbaGP; s.contrato = { inicio, fim: inicio, bonusVitoria: termos.bonusVitoria };
}
function aceitarProposta(s, id) {
  const p = propostas(s).find((x) => x.equipe === id);
  if (!p) throw Error("Esta equipe não fez proposta.");
  if (s.gp < s.tamanho) { // antes do último GP: pré-contrato, vale na virada do ano
    if (s.precontrato) throw Error("Você já assinou um pré-contrato.");
    s.precontrato = { ano: s.ano, equipe: p.equipe, verbaGP: p.verbaGP, bonusVitoria: p.bonusVitoria };
    noticia(s, `Pré-contrato: você vai para a ${nomeDaEquipe(p.equipe)}`, `A mudança vale a partir da temporada ${s.ano + 1}. A diretoria atual não gostou.`, "Diretoria");
    if (s.paddock) s.paddock.diretoria = Math.max(-20, (s.paddock.diretoria || 0) - 6);
    return s;
  }
  trocarDeEquipe(s, id, p, s.ano + 1);
  return s;
}
const nomeDaEquipe = (id) => (Pilotos.EQUIPES[id] && Pilotos.EQUIPES[id].nome) || id;
function noticia(s, t, x, quem) {
  const p = Paddock.garantir(s); (p.noticias ||= []).push({ ano: s.ano, gp: s.gp, t, x, eq: s.equipe, quem });
  if (p.noticias.length > 12) p.noticias.splice(0, p.noticias.length - 12);
  p.ultimaMudanca = { ano: s.ano, gp: s.gp, quem, texto: x };
}
// A DEMISSÃO NO MEIO DO ANO: a confiança da diretoria abaixo de DEMITE_MEIO, com 3 GPs seguidos fora da meta, a partir do 3º GP do ano: você
// vai para a equipe mais fraca que tiver vaga (uma das 3 de trás, pela semente) e a temporada segue de lá. Não antes de 2 GPs na equipe nova.
const DEMITE_MEIO = 35, DEMITE_FIM = 30;
function demissaoNoMeio(s) {
  if (s.gp >= s.tamanho || s.gp < 3 || s.precontrato) return false;
  const doAno = s.resultados.filter((r) => r.ano === s.ano), ult = doAno.slice(-3);
  const naEquipe = doAno.filter((r) => { const e = r.linhas.find((x) => x.piloto === "voce"); return e && e.equipe === s.equipe; }).length;
  if (ult.length < 3 || naEquipe < 2) return false;
  const falhou = ult.every((r) => { const e = r.linhas.find((x) => x.piloto === "voce"); return !e || e.dnf || e.nc || e.pos > (r.objetivoGP || 99); });
  if (!falhou || imersao(s).confianca >= DEMITE_MEIO) return false;
  const ordem = ordemDeForca(), fracas = ordem.slice(-3).filter((id) => id !== s.equipe), r = gerador(`demissao:${s.semente}:${s.ano}:${s.gp}`);
  const nova = fracas[Math.floor(r() * fracas.length)] || ordem[ordem.length - 1]; if (!nova || nova === s.equipe) return false;
  const antiga = s.equipe;
  trocarDeEquipe(s, nova, { verbaGP: verbaBase(nova), bonusVitoria: BONUS_VITORIA[faixaDe(nova)] }, s.ano);
  s.demissoes = (s.demissoes || 0) + 1;
  noticia(s, `Você foi demitido da ${nomeDaEquipe(antiga)}`, `Três GPs fora da meta e a diretoria perdeu a paciência. A ${nomeDaEquipe(nova)} tinha uma vaga e você corre por ela a partir do próximo GP.`, "Diretoria");
  return true;
}
function proximaTemporada(s) {
  if (s.gp !== s.tamanho) throw Error("Termine o calendário primeiro.");
  garantirContrato(s);
  // o pré-contrato assinado no meio do ano vale agora
  if (s.precontrato && s.precontrato.ano === s.ano && Pilotos.EQUIPES[s.precontrato.equipe]) trocarDeEquipe(s, s.precontrato.equipe, s.precontrato, s.ano + 1);
  else {
    // demitido no Paddock (o ultimato) ou, sem contrato para o ano que vem, com a confiança abaixo de DEMITE_FIM: a equipe não renova e você
    // vai para a equipe mais fraca que fez proposta
    const semContrato = s.contrato.fim <= s.ano, confianca = imersao(s).confianca;
    if ((s.paddock && s.paddock.demitido && s.paddock.demitido.ano === s.ano) || (semContrato && confianca < DEMITE_FIM)) {
      const ps = propostas(s), antiga = s.equipe, nova = ps.length ? ps[ps.length - 1] : null;
      if (nova) { trocarDeEquipe(s, nova.equipe, nova, s.ano + 1); s.demissoes = (s.demissoes || 0) + 1; noticia(s, `A ${nomeDaEquipe(antiga)} não renova com você`, `A diretoria encerrou o contrato. Você corre pela ${nomeDaEquipe(nova.equipe)} na temporada ${s.ano + 1}.`, "Diretoria"); }
      if (s.paddock) s.paddock.demitido = null;
    }
  }
  s.precontrato = null;
  if (s.contrato.fim <= s.ano) s.contrato.fim = s.ano + 1; // sem conversa (e com a confiança boa), o contrato segue por mais um ano nos mesmos termos
  for (const r of s.resultados) if (r.ano < s.ano) delete r.analise; // o detalhe volta a volta só vale para o ano atual e o anterior (o save não cresce sem fim)
  s.ano++; s.gp = 0; s.gasto = 0; s.semente = Number(s.semente) + 937;
  Paddock.novaTemporada(s);
  const sorteado = sortearCalendario(s.tamanho, s.semente, s.calendario.map((g) => g.pista));
  s.calendario = sorteado.calendario; s.calendarioSemente = sorteado.semente; return s;
}
const api = { vagaDe, pilotoRealDe, verbaBase, demissaoNoMeio, limiteDoAno, custoDoDesenvolvimento, ajustarParaPista, CALENDARIO, PISTAS_TRABALHADAS, sortearCalendario, PONTOS, ENGENHEIROS, teto, criar, mudarNivel, conferirMontagem, aplicarMontagem, contratarPiloto, contratarEngenheiro, desenvolver, desenvolvimentoRivais, pilotosNoGrid, registrarResultado, tabelas, metas, imersao, proximaTemporada, contrato, objetivos, perspectiva, renovar, propostas, aceitarProposta, metasDeBonus };
if (typeof module !== "undefined" && module.exports) module.exports = api;
else root.F1Temporada = api;
})(typeof window !== "undefined" ? window : globalThis);
