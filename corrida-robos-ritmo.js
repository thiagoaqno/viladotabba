// Corrida da Galera — os robôs: o ritmo de cada um (a folga sobre o ideal do carro pelo nível, o carro a mais acima de 100,
// o ritmo de quem joga), a classificação e o aquecimento dos níveis antes da largada. Parte de corrida-robos.js.
const T = require("./public/corrida/pistas.js");
const F1 = require("./public/corrida/f1-regras.js"); // os pneus das regras de F1
const F1Equipes = require("./public/corrida/f1-equipes.js"); // a montagem do carro de cada equipe
const Sim = require("./public/corrida/sim.js");
const Pilotos = require("./public/corrida/f1-pilotos-2026.js"); // as equipes e os pilotos reais de 2026 (os robôs das regras de F1)
const { forcaDoNivel, porNivel, rnd, NIVEIS, RITMO, DIFICIL_ANTIGO } = require("./corrida-robos-base.js");
const LinhaRobo = require("./corrida-robos-linha.js"); // (fonteAprendido, fonteRecorde: lidos por aqui para valer o valor de agora)
const { tempoDaVolta, perfil, aderRef, escalaPara, ritmoDaSala, perfilF1 } = require("./corrida-robos-linha.js");
// o carro a mais dos robôs acima de 100 (sim.js gpMods): no 150, +5% de aderência e +6% de potência
// (2026-11-23) a FORÇA do carro a mais: 1 é o do 150 de antes (+5% / +6%). Com o ritmo de quem joga (forcaDoReforco), ela pode passar de 1.
// ROBO_REFORCO_X: só para medir (klk/medir).
const reforcoDe = (x) => (x > 0 ? { grip: 1 + 0.05 * x, potencia: 1 + 0.06 * x, desgaste: 1, grid: 0 } : null);
function reforcoDoNivel(room) {
  if (process.env.ROBO_REFORCO_X != null) return reforcoDe(+process.env.ROBO_REFORCO_X);
  const k = Math.max(0, Math.min(1, (forcaDoNivel(room.config.nivel) - 100) / 50)); if (!(k > 0)) return null;
  return reforcoDe(forcaDoReforco(room, k));
}
// Folga sobre o ideal do carro: difícil 0, médio 1,5% e fácil 5,5%, além da pequena diferença do piloto.
// O tráfego e o controle dos pedais ainda custam tempo na corrida real.
const FOLGA_F1 = { facil: 0.04, medio: 0, dificil: 0.005, lendario: -0.01 }, // (2026-11-16, o Thiago: "deixa o difícil só 1% mais fácil"; depois do Catar: "tira só mais meio por cento, não quero que virem lendas") (2026-11-21: o difícil mais difícil veio da linha de corrida nova, que usa a pista toda; mirar abaixo do limite fazia todos baterem no teto e andarem igual)
  FOLGA_F1_ANTIGA = { ...FOLGA_F1 }, FOLGA_F1_REAL = { facil: 0.13, medio: 0.08, dificil: 0 }; // (Formula GP: os de antes de #665, afinados na escala real) // (de volta à escala antiga, 2026-11-11: os números de antes; os de #620 e #621 eram afinados na escala real)
// por nível, a fração do limite das curvas e da frenagem que o robô usa, por cima do nível que dá o ideal. 1 é o limite do pneu:
// o perfil (Piloto.perfilDoNivel) para nele, então acima de 1 não muda nada.
// (2026-11-11, #692 tinha posto o difícil em 1,2: sem o teto, isso era grip que o pneu não tem, e o robô rodava. Medido em Mônaco,
// Verstappen de Red Bull, macio, seco, sozinho: 1,2 sem teto fazia 58,8 a 66,1 s com 4 a 6 batidas por volta; com o teto, 50,1 a 50,9 s.)
const EMPURRAO_F1 = { facil: 0.86, medio: 1, dificil: 1 }, EMPURRAO_F1_ANTIGO = { ...EMPURRAO_F1 }, EMPURRAO_F1_REAL = { facil: 0.85, medio: 0.92, dificil: 0.96 }; // (Formula GP: os de antes de #665)
// ---------- (2026-11-23) o ritmo aprendido de quem joga ----------
// O Thiago: "os bots deviam aprender comigo (piloto de um jeito na chuva e com um pneu específico) e fazer um ritmo 2% mais lento, para dificultar os níveis
// mais altos: o 150 é igual a mim mas 2% mais lento, e vai diminuindo até o 100, que pilota no difícil padrão; as voltas entram aos poucos, no fim de cada
// corrida; voltas limpas ou com até 2 toques no muro". A volta de quem joga vira uma RAZÃO: o tempo dela sobre a volta ideal do carro dele, com o pneu e a
// água daquela volta (`razaoDaVolta`): o carro dele fica descontado. Comparada com a razão dos robôs da MESMA corrida, vira a proximidade
// (corrida.js aprenderRitmo), que decide o carro a mais do 100 ao 150 (forcaDoReforco, abaixo).
const RITMO_HUMANO_FOLGA = 0.02, TOQUES_MURO_MAX = 2;
const condicaoDaAgua = (agua) => (/^(intermediario|chuva)$/.test(F1.compostoDaClassificacao ? F1.compostoDaClassificacao(agua || 0) : "macio") ? "molhado" : "seco");
function razaoDaVolta(pista, spec, pneu, agua, tempo) {
  const sp = spec && spec.chave ? spec : F1Equipes.specDaEquipe("mclaren");
  const ideal = tempoDaVolta(perfil(pista, sp), 1, F1.aderencia({ composto: (pneu && pneu.composto) || "medio", desgaste: (pneu && pneu.desgaste) || 0, temp: 1 }, agua || 0));
  return ideal > 0 && Number.isFinite(tempo) ? tempo / ideal : null;
}
// Do 100 ao 150, o que mexe no ritmo é o carro a mais (o alvo de tempo já está no limite do carro: a tabela de tempoDaVolta para em f = 1). Medido com o
// Perez de Cadillac sozinho em Suzuka (3 sementes, voltas 2 a 5): força 1 / 2 / 3 deixa o robô 1,4 / 2,6 / 3,4% mais rápido, sem batidas. Daí a conta
// ritmo = 1 / (1 + REFORCO_POR_X · força). A proximidade de quem joga (a razão dele sobre a dos robôs do Difícil, sem carro a mais: corrida.js
// aprenderRitmo) dá o alvo: no 150, o ritmo dele + 2%; do 100 ao 150, em linha reta. Nunca mais fácil que o nível sem o ritmo dele, e no máximo
// REFORCO_X_MAX (+20% de aderência e +24% de potência; acima de 3 é conta, não medida).
const REFORCO_POR_X = 0.012, REFORCO_X_MAX = 4;
function proximidadeDaSala(room) {
  const chave = `${room.startAt}|${room.config.pista}|${room.config.nivel}`; if (room._proximidade && room._proximidade.chave === chave) return room._proximidade.v;
  let v = null;
  const nomes = room.order.map((id) => room.players[id]).filter((p) => p && !p.bot).map((p) => p.name);
  if (nomes.length) {
    const cond = condicaoDaAgua(room.clima ? F1.climaEm(room.clima, room.startAt || Date.now()).agua : 0);
    try { const a = LinhaRobo.fonteAprendido(room.config.pista, nomes, cond); if (a && Number.isFinite(a.prox)) v = { ...a, condicao: cond }; } catch (e) { /* banco indisponível */ }
  }
  room._proximidade = { chave, v }; return v;
}
function forcaDoReforco(room, k) {
  const pr = proximidadeDaSala(room); if (!pr) return k;
  const antes = 1 / (1 + REFORCO_POR_X * k), alvo = 1 + (pr.prox * (1 + RITMO_HUMANO_FOLGA) - 1) * k;
  return Math.min(REFORCO_X_MAX, Math.max(k, (1 / Math.min(antes, alvo) - 1) / REFORCO_POR_X));
}
// o fator que leva o ritmo dos robôs desta sala ao do Difícil sem carro a mais (para medir a proximidade)
function semReforco(room) { const g = reforcoDoNivel(room); return g ? 1 + REFORCO_POR_X * ((g.grip - 1) / 0.05) : 1; }
function referenciaF1(room) {
  const pista = room.config.pista;
  const pf = perfil(pista, F1Equipes.specDaEquipe("mclaren"));
  const ideal = tempoDaVolta(pf, 1, aderRef());
  let recorde = null;
  try { const v = LinhaRobo.fonteRecorde(pista); if (v && Number.isFinite(v.tempo) && v.tempo >= T.PISTAS[pista].minLap) recorde = v.tempo; } catch (e) { /* banco indisponível: usa o traçado */ }
  return { tempo: ideal * (1 + porNivel(FOLGA_F1, room.config.nivel)), ideal, recorde, origem: false, proteger: !!recorde && recorde <= ideal * 1.01 };
}
const PILOTO_TOPO = 98;
function alvoF1(room, p, pf) {
  const ref = room.referenciaF1 || referenciaF1(room);
  // (2026-11-23, o Thiago: "agora que os carros seguem uma volta do banco, os perfis dos pilotos importam MUITO mais, especialmente no qualify") o
  // ritmo do piloto pesava no máximo 1,2% e todo mundo de 96 para cima andava igual. Agora conta a escala toda, a partir do melhor (Verstappen, 98):
  // na corrida 0,11% por ponto (Norris +0,2%, Hamilton +0,7%, Lindblad +2,1%); na classificação 0,16% por ponto, onde o talento mais aparece
  // (Norris +0,3%, Hamilton +1,0%, Lindblad +3,0%). Sem piloto, o meio da tabela.
  const porPonto = room.phase === "quali" ? 0.0016 : 0.0011;
  const folga = porNivel(FOLGA_F1, room.config.nivel), piloto = (p.piloto ? Math.max(0, PILOTO_TOPO - p.piloto.ritmo) : 10) * porPonto;
  const ideal = tempoDaVolta(pf, 1, aderRef());
  return Math.max(ref.proteger ? ref.recorde * 1.025 : 0, ideal * (1 + folga + piloto));
}
function largada(pts, g, W, f1) { // mesma posição usada pela física e pelas marcas na pista
  const { idx } = Sim.vagaDoGrid(pts, g, W, f1);
  return { idx, lat: (g % 2 ? 1 : -1) * W * 0.22 };
}
// O nível de um robô (a escala do limite do traçado, em `ia.nivel`). Na F1, o alvo combina recorde/procedural,
// montagem do carro e ritmo do piloto; no modo clássico, continua seguindo a média das voltas da sala.
function nivelDe(room, p, tracadoId, nBots, pf) {
  if (room.config.regras === "f1") {
    // (2026-11-21) Mônaco no difícil (96 ou mais): todos no limite do próprio carro. Com a diferença de ritmo de cada piloto, na rua colada no muro eles viviam
    // tentando passar e batiam: medido com 21 robôs, 4 sementes, 116 batidas fortes; com todos no limite, 88 (a main, 60)
    if (T.baseDe(room.config.pista) === "monaco" && forcaDoNivel(room.config.nivel) >= 96) return 1;
    return Math.min(1.5, escalaPara(pf, alvoF1(room, p, pf), aderRef(), 8) * porNivel(EMPURRAO_F1, room.config.nivel)); // o nível é do piloto; o pneu de cada momento (macio, gasto, frio) mexe no ritmo de verdade, em passoF1
  }
  const pil = p.piloto, ritmo = room.ritmoRobos;
  const sorte = rnd;
  const espalha = pil ? Pilotos.fatorDeRitmo(pil.ritmo) - 1 : nBots > 1 ? (tracadoId / (nBots - 1) - 0.5) * 0.03 : 0;
  return ritmo ? escalaPara(pf, ritmo * (1 + espalha)) : porNivel(NIVEIS, room.config.nivel) * sorte(0.98, 1.02) * (pil ? 2 - Pilotos.fatorDeRitmo(pil.ritmo) : 1);
}
// o ritmo da sala (o tempo que os robôs miram), guardado em room.ritmoRobos
function ritmoDosRobos(room) {
  if (room.config.regras === "f1") {
    room.referenciaF1 = referenciaF1(room);
    room.ritmoRobos = room.referenciaF1.tempo;
    return room.ritmoRobos;
  }
  const ritmo = ritmoDaSala(room);
  room.ritmoRobos = ritmo ? ritmo.tempo * porNivel(RITMO, room.config.nivel) : null;
  return room.ritmoRobos;
}
// Depois da primeira chegada, quem ainda corre tem 1 minuto para terminar (em todos os modos; passou disso, o resultado fecha).
function prazoDeChegada(room, prazoNormal = 60000) { return prazoNormal; }
// ---------- a classificação (regras de F1) ----------
// A volta lançada de um robô: o tempo da volta no ritmo dele (a mesma conta da corrida, `tempoDaVolta`) com pneu macio novo e
// quente (a mesma aderência do carro de quem joga), mais o ruído da constância do piloto, sorteado pela semente do GP,
// da sessão e do robô (recarregar nada muda). `em` é a hora (fração da sessão) em que o robô cruza a linha.
function gauss(r) { return Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r()); }
// `janela` ({ startAt, durMs }, opcional): a sessão, para achar a água na pista na hora da volta do robô (clima.js do jogo: com
// chuva a classificação usa o pneu de chuva se a pista abre com água, o mesmo de quem joga).
// (2026-11-16, o Thiago: "os bots são os goats do qualify") A volta do qualify é calculada pelo limite do traçado; na corrida o robô pilota pela
// física e anda mais devagar (trânsito, pneu, as batidas: em Baku, 99 toques em 5 voltas com 10 robôs). O fator de cada pista é medido por
// ferramentas/quali-fator.js (a melhor volta pilotada sobre a calculada) e fica em public/corrida/quali-fator.json; sem medição, 1.
let FATOR_QUALI = null;
function fatorDoQuali(pista) {
  if (FATOR_QUALI == null) { try { FATOR_QUALI = require("./public/corrida/quali-fator.json"); } catch { FATOR_QUALI = {}; } }
  const f = Number(FATOR_QUALI[pista] ?? FATOR_QUALI[T.baseDe(pista)]); return Number.isFinite(f) ? Math.max(0.96, Math.min(1.08, f)) : 1;
}
// o quanto a pista molhada deixa a volta mais lenta, na física do carro (a média de Mônaco e Bahrein, piloto ideal, o pneu certo de cada água):
// sem água 1; garoa (0,3) +9,3%; de 0,6 para cima, +10,4%; no meio, a reta entre eles
const MOLHADO = [[0, 1], [0.3, 1.093], [0.6, 1.104], [1, 1.104]];
function molhadoNaFisica(agua) { const a = Math.max(0, Math.min(1, agua || 0)); for (let i = 1; i < MOLHADO.length; i++) if (a <= MOLHADO[i][0]) { const [x0, y0] = MOLHADO[i - 1], [x1, y1] = MOLHADO[i]; return y0 + (y1 - y0) * (a - x0) / (x1 - x0); } return MOLHADO[MOLHADO.length - 1][1]; }
function voltaLancada(room, p, sessao, tracadoId, nBots, janela = null) {
  const pf = perfil(room.config.pista, p.spec || p.car, tracadoId), nivel = nivelDe(room, p, tracadoId, nBots, pf);
  const r = F1.sorteio(`quali:${room.semente}:${sessao}:${p.id}`), sigma = p.piloto ? Pilotos.ruidoDaVolta(p.piloto.constancia) : 0.012;
  const ruido = Math.max(-2.5, Math.min(2.5, gauss(r))), em = 0.3 + 0.62 * r();
  // (2026-11-23, o Thiago: "os bots fizeram 48 s chovendo em Mônaco, isso não existe") a volta é a do seco, e a chuva entra pelo que ela custa na física
  // do carro (molhadoNaFisica). A conta da tabela com a aderência molhada tirava só metade: medido, Mônaco +4,0 / +5,1 / +3,4% e Bahrein +3,6 / +4,5 /
  // +3,0% (garoa 0,3 / chuva 0,6 / forte 0,9), contra +9,4 / +10,6 / +10,6% e +9,2 / +10,2 / +10,1% do piloto ideal na física (klk/medir/chuva-volta.js)
  let agua = 0;
  if (janela && room.clima) agua = Math.round(F1.climaEm(room.clima, janela.startAt + em * janela.durMs).agua * 10) / 10; // (a água na hora da volta)
  const ader = F1.aderencia({ composto: "macio", desgaste: 0.03, temp: 0.8 });
  const tempo = tempoDaVolta(pf, nivel, ader) * molhadoNaFisica(agua) * (1 + ruido * sigma) * fatorDoQuali(room.config.pista);
  // o recorde de quem joga protegido: nenhum robô abaixo de recorde + 1,5%. (2026-11-16, o Thiago: "todos os pilotos fizeram exatamente o mesmo tempo
  // no Q1") Era um corte em cada tempo (Math.max com o piso): com os robôs mais rápidos, todos caíam abaixo e iam para o MESMO número. Agora escala
  // todos juntos: a volta ideal (a do carro de referência, com o fator da pista) vai para o piso e cada um mantém a sua diferença.
  const ref = room.config.regras === "f1" ? room.referenciaF1 || referenciaF1(room) : null;
  const final = ref && ref.proteger ? tempo * Math.max(1, (ref.recorde * 1.015) / (ref.ideal * fatorDoQuali(room.config.pista))) : tempo;
  return { tempo: Math.round(final * 1000) / 1000, em };
}
// quanto dura uma sessão de classificação, em segundos: dá para uma volta de saída e duas lançadas de um carro médio
function duracaoDaClassificacao(pista) {
  const t = tempoDaVolta(perfil(pista, "equilibrado", 0), NIVEIS.medio);
  return Math.max(80, Math.min(260, Math.round(t * 2.2 + 12 + QUALI_SAIDA_TOTAL_S))); // (+ a saída em grupos dos robôs pilotando: prepararQuali)
}

// (2026-11-23, o Thiago: "pensei em nos qualifies todo mundo correr junto, mas com modo fantasma, dando pra ver os bots também") a sessão da classificação
// com os robôs pilotando: cada um sai do grid (largar), com o pneu da classificação pela água da abertura, um a cada QUALI_SAIDA_MS; quem não está na
// sessão (eliminado) sai da pista. A volta deles é cronometrada pela mesma conta de quem joga (corrida-f1-classificacao.js aoSetor).
// (2026-11-23, o Thiago: "eles devem ser liberados aos poucos, a cada 5 s libera uns 2 ou 3, igual na F1") em grupos de 2 ou 3 (pela semente), a cada QUALI_SAIDA_MS
const QUALI_SAIDA_MS = 5000, QUALI_SAIDA_TOTAL_S = 45;
// O acerto do robô (2026-11-15, o Thiago: "os bots precisam poder usar o acerto também"): parte do acerto ideal medido da pista
// (acerto-ideal.json, ferramentas/acerto-ideal.js: asa e altura) e deduz o resto dele, como um engenheiro faria. Pista de reta (pouca asa):
// câmbio mais longo e suspensão mais macia; pista de curva (muita asa): câmbio mais curto e suspensão mais dura para segurar a carga. Um
// pouco de cambagem e o resto no meio, sem exagero no desgaste. O nível da sala diz o quanto o robô chega perto disso: difícil 100%,
// médio 75%, fácil 40% (o resto fica no acerto padrão), e cada piloto erra um pouco a asa (±0,05, fixo por piloto e sala).
let IDEAIS_AC = null;
const PERTO_DO_IDEAL = { facil: 0.4, medio: 0.75, dificil: DIFICIL_ANTIGO ? 1 : 0.9, lendario: 1 }; // (2026-11-16, o Thiago: "o difícil está insano": era 1)
function acertoDoRobo(pista, nivel, id) {
  if (IDEAIS_AC == null) { try { IDEAIS_AC = require("./public/corrida/acerto-ideal.json"); } catch { IDEAIS_AC = {}; } }
  const id0 = IDEAIS_AC[pista] || IDEAIS_AC[T.baseDe ? T.baseDe(pista) : pista], P = Sim.ACERTO_PADRAO;
  if (!id0 || !Number.isFinite(id0.asa)) return null;
  const asa = id0.asa, curva = asa - 0.5; // −0,5 (reta) a +0,5 (curva)
  let h = 0; for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const ideal = { asa: Math.max(0, Math.min(1, asa + ((h % 11) - 5) * 0.01)), altura: Number.isFinite(id0.altura) ? id0.altura : 0.5,
    cambio: 0.5 - curva * 0.4, freio: 0.5, diferencial: 0.5, cambagem: 0.6, pressao: 0.5, rigidez: 0.5 + curva * 0.4 };
  const k = Math.max(0, Math.min(1, porNivel(PERTO_DO_IDEAL, nivel))), o = {};
  for (const c of Object.keys(P)) o[c] = P[c] + ((ideal[c] ?? P[c]) - P[c]) * k;
  return o;
}
// o nível de cada robô, um por vez (setImmediate entre eles: o servidor atende os outros eventos no meio). A primeira tarefa é o ritmo da sala.
function aquecerNiveis(room, fila, nBots) {
  const vez = room.aquecendo = {}, sem = () => room.phase !== "race" || room.aquecendo !== vez; // (a largada ainda soma o tempo de preparo ao startAt: por isso a marca, não o horário)
  let i = -1;
  const um = () => {
    if (sem()) return; // (a sala mudou: outra largada refaz tudo)
    if (i < 0) { ritmoDosRobos(room); i = 0; return setImmediate(um); }
    if (i >= fila.length) return;
    const p = room.players[fila[i++]], ia = p && p.ia;
    if (ia && ia.nivel == null) { ia.nivel = nivelDe(room, p, ia.tracadoId, nBots, ia.perfil); perfilF1(ia.perfil, ia.nivel); } // (o perfil do nível dele também fica pronto)
    setImmediate(um);
  };
  setImmediate(um);
}
// (2026-11-16, o Thiago: "ficou travando na largada da corrida de Baku") A mesma conta de aquecerNiveis, ADIANTADA: chamada quando o último Q fecha
// (corrida-f1-classificacao.js), na tela do resultado, onde ninguém pilota. Um robô por vez (setImmediate); deixa prontos o perfil, a tabela de
// tempos e o perfil do nível de cada um (os caches de perfil, tabelaF1 e perfilF1), e a largada só reaproveita. Medido em Baku: 140 a 200 ms por robô.
// (2026-11-16, o servidor.log do Thiago: "o laço atrasou 8713 ms") Abrir o Q1 calculava, de uma vez, a volta lançada dos 21 robôs: ~225 ms por robô em
// Baku (medido: 4,9 s no total; o Q2, com a conta já guardada, 1 ms). Esta faz a mesma conta ANTES, na tela de carregamento do qualify
// (corrida-f1-classificacao.js iniciar), um robô por vez (setImmediate): na abertura do Q1 os caches (o perfil e a tabela de tempos de cada carro) já
// estão prontos. O resultado é jogado fora: a volta de verdade sai em abrirSessao, com a semente da sessão.
function preaquecerQuali(room) {
  if (room.config.regras !== "f1" || !room.quali) return;
  const q = room.quali, bots = room.order.filter((id) => room.players[id] && room.players[id].bot);
  let i = 0;
  const um = () => {
    if (room.quali !== q || !q.carga || i >= bots.length) return;
    try { const k = i++; const p = room.players[bots[k]]; if (p) voltaLancada(room, p, 0, k, bots.length); } catch (e) { console.warn("Corrida: o aquecimento do qualify falhou", e.message); return; }
    setImmediate(um);
  };
  setImmediate(um);
}
function preaquecerNiveis(room) {
  if (room.config.regras !== "f1") return;
  const bots = room.order.filter((id) => room.players[id] && room.players[id].bot), vez = room.preaquecendo = {};
  let i = -1;
  const um = () => {
    if (room.preaquecendo !== vez || room.phase !== "quali") return;
    try {
      if (i < 0) { ritmoDosRobos(room); i = 0; return setImmediate(um); }
      if (i >= bots.length) return;
      const p = room.players[bots[i]], tracadoId = i++;
      if (p) { const pf = perfil(room.config.pista, p.spec || p.car, tracadoId); perfilF1(pf, nivelDe(room, p, tracadoId, bots.length, pf)); }
    } catch (e) { console.warn("Corrida: o aquecimento dos robôs falhou", e.message); return; }
    setImmediate(um);
  };
  setImmediate(um);
}

module.exports = { reforcoDoNivel, FOLGA_F1, FOLGA_F1_ANTIGA, FOLGA_F1_REAL, EMPURRAO_F1, EMPURRAO_F1_ANTIGO, EMPURRAO_F1_REAL, TOQUES_MURO_MAX, condicaoDaAgua, razaoDaVolta, proximidadeDaSala, forcaDoReforco, semReforco, largada, nivelDe, ritmoDosRobos, prazoDeChegada, fatorDoQuali, voltaLancada, duracaoDaClassificacao, QUALI_SAIDA_MS, acertoDoRobo, aquecerNiveis, preaquecerQuali, preaquecerNiveis };
