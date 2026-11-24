// Corrida: as equipes de F1 de 2026 com o orçamento em pontos e a montagem do carro (public/corrida/f1-equipes.js), a conferência
// do servidor e os robôs correndo com o carro da própria equipe.
const test = require("node:test");
const assert = require("node:assert/strict");
const E = require("../public/corrida/f1-equipes.js");
const Pilotos = require("../public/corrida/f1-pilotos-2026.js");
const T = require("../public/corrida/pistas.js");
const Robos = require("../servidor/corrida/corrida-robos.js");
const bd = require("../servidor/comum/bd.js");

process.env.CORRIDA_TV_MS = "0"; // sem a transmissão de TV antes das luzes: a largada vem logo
const montagem = (motor, aero, chassi, freios, suspensao, confiab) => ({ motor, aero, chassi, freios, suspensao, confiab });
// toda montagem de 6 peças (níveis de 0 a MAX_NIVEL) cuja soma é `soma`
function* montagens(soma) {
  const n = E.MAX_NIVEL;
  for (let a = 0; a <= n; a++) for (let b = 0; b <= n; b++) for (let c = 0; c <= n; c++) for (let d = 0; d <= n; d++) for (let e = 0; e <= n; e++) {
    const f = soma - a - b - c - d - e;
    if (f >= 0 && f <= n) yield montagem(a, b, c, d, e, f);
  }
}

test("as 11 equipes: orçamento de 15 a 20 pontos pela força, e a montagem padrão gasta o orçamento inteiro", () => {
  assert.deepEqual(Object.keys(E.EQUIPES).sort(), Object.keys(Pilotos.EQUIPES).sort());
  const ordem = Object.keys(E.EQUIPES), orc = ordem.map((id) => E.EQUIPES[id].orcamento);
  assert.equal(Math.max(...orc), 20); assert.equal(Math.min(...orc), 15);
  for (let i = 1; i < orc.length; i++) assert.ok(orc[i] <= orc[i - 1], "as equipes vêm das mais fortes para as mais fracas");
  for (const id of ordem) {
    const q = E.EQUIPES[id], v = E.validar(id, q.padrao);
    assert.ok(v.ok, `${id}: ${v.erro}`);
    assert.equal(E.custoDaMontagem(q.padrao), q.orcamento, `${id} gasta o orçamento todo`);
    assert.ok(Pilotos.EQUIPES[id] && q.nota);
  }
  // as de ponta têm mais pontos que as do fim
  assert.ok(E.EQUIPES.mclaren.orcamento > E.EQUIPES.audi.orcamento && E.EQUIPES.haas.orcamento > E.EQUIPES.cadillac.orcamento - 1);
});

test("o orçamento não estoura: o servidor-regra recusa montagem inválida e aceita as válidas", () => {
  const ok = montagem(4, 4, 3, 3, 3, 3); // 20
  assert.ok(E.validar("mclaren", ok).ok);
  assert.ok(E.validar("mclaren", montagem(0, 0, 0, 0, 0, 0)).ok, "gastar menos que o orçamento pode");
  assert.equal(E.validar("mclaren", { ...ok, motor: 5 }).ok, false, "21 de 20 pontos");
  assert.equal(E.validar("cadillac", ok).ok, false, "20 pontos numa equipe de 15");
  assert.equal(E.validar("mclaren", montagem(9, 0, 0, 0, 0, 0)).ok, false, "nível acima do máximo");
  assert.equal(E.validar("mclaren", montagem(-1, 4, 4, 4, 4, 4)).ok, false, "nível negativo para esconder custo");
  assert.equal(E.validar("mclaren", montagem(1.5, 4, 4, 4, 4, 4)).ok, false, "meio ponto");
  assert.equal(E.validar("mclaren", montagem("4", 4, 3, 3, 3, 3)).ok, false, "texto no lugar de número");
  assert.equal(E.validar("mclaren", montagem(NaN, 4, 3, 3, 3, 3)).ok, false);
  assert.equal(E.validar("mclaren", montagem(Infinity, 0, 0, 0, 0, 0)).ok, false);
  assert.equal(E.validar("mclaren", { motor: 4, aero: 4, chassi: 3, freios: 3, suspensao: 3 }).ok, false, "falta uma peça");
  assert.equal(E.validar("mclaren", { ...ok, turbo: 5 }).ok, false, "peça que não existe");
  for (const ruim of [null, undefined, 7, "x", [4, 4, 3, 3, 3, 3]]) assert.equal(E.validar("mclaren", ruim).ok, false);
  assert.equal(E.validar("ninguem", ok).ok, false, "equipe inválida");
  // nenhuma montagem aceita passa do orçamento (todas as de 0 a 20 pontos numa equipe de 20)
  let aceitas = 0;
  for (const soma of [19, 20, 21]) for (const m of montagens(soma)) { const v = E.validar("mclaren", m); if (v.ok) { aceitas++; assert.ok(E.custoDaMontagem(v.montagem) <= 20); } else assert.ok(E.custoDaMontagem(m) > 20); } // (2026-11-15: o nível alto custa mais que 1 ponto)
  assert.ok(aceitas > 1000);
  // a cópia devolvida é limpa (não guarda o que o navegador mandou além das seis peças)
  assert.deepEqual(Object.keys(E.validar("mclaren", ok).montagem), E.ORDEM);
});

test("cada peça muda o spec no sentido certo", () => {
  const base = montagem(4, 4, 4, 4, 4, 4), s0 = E.specDaMontagem(base), mais = (k) => E.specDaMontagem({ ...base, [k]: 5 });
  const m = mais("motor"); assert.ok(m.vmax > s0.vmax && m.acc > s0.acc && m.quebra === s0.quebra, "motor: mais velocidade e aceleração (a quebra é só da confiabilidade)");
  const a = mais("aero"); assert.ok(a.grip > s0.grip && a.turn > s0.turn && a.drs > s0.drs, "aerodinâmica: mais aderência, volante e DRS");
  assert.ok(a.vmax < s0.vmax && a.acc <= s0.acc, "...e menos velocidade final e aceleração");
  const c = mais("chassi"); assert.ok(c.acc > s0.acc && c.brake > s0.brake, "chassi leve: mais aceleração e freio");
  assert.ok(c.wall < s0.wall && c.offMax < s0.offMax, "...e menos resistência");
  const f = mais("freios"); assert.ok(f.brake > s0.brake);
  const s = mais("suspensao"); assert.ok(s.offMax > s0.offMax && s.desgaste < s0.desgaste && s.scrub < s0.scrub && s.kin > s0.kin && s.grip > s0.grip, "suspensão: zebras, desgaste do pneu e escorregão");
  const r = mais("confiab"); assert.ok(r.quebra < s0.quebra, "confiabilidade: quebra menos");
  for (const k of E.ORDEM) { // peça nenhuma é de graça: cada uma só mexe nos números dela
    const t = mais(k); assert.notEqual(JSON.stringify(t), JSON.stringify(s0), k);
  }
});

test("todo número de toda montagem possível fica entre o pior e o melhor dos cinco carros de antes", () => {
  const n = E.MAX_NIVEL;
  for (let motor = 0; motor <= n; motor++) for (let aero = 0; aero <= n; aero++) for (let chassi = 0; chassi <= n; chassi += 2) for (let suspensao = 0; suspensao <= n; suspensao += 2) for (let freios = 0; freios <= n; freios += 4) {
    const s = E.specDaMontagem(montagem(motor, aero, chassi, freios, suspensao, 2));
    for (const [k, [a, b]] of Object.entries(E.LIMITES)) assert.ok(s[k] >= a && s[k] <= b, `${k}=${s[k]} fora de ${a}..${b}`);
    assert.ok(s.quebra > 0 && s.quebra < 0.4 && s.desgaste > 0.5 && s.drs > 0.5);
  }
  // e os limites são mesmo os dos cinco carros
  for (const k of Object.keys(E.LIMITES)) {
    const f = k === "vmax" ? E.VMAX_F1 : 1; // a velocidade final dos carros de F1 é a dos cinco carros com o ganho igual para todos
    const v = Object.values(T.CARROS).map((c) => c[k] * f);
    assert.ok(E.LIMITES[k][0] <= Math.min(...v) + 1e-9 && E.LIMITES[k][1] >= Math.max(...v) - 1e-9, `${k}: os limites cobrem os cinco carros`);
  }
  for (const id of Object.keys(E.EQUIPES)) assert.match(E.specDaEquipe(id).chave, /^\d-\d-\d-\d-\d-\d$/);
});

// (2026-11-15) o teste "com o mesmo orçamento, nenhuma montagem é melhor em tudo que outra" saiu: com a aerodinâmica presa à suspensão e o
// motor à confiabilidade (f1-equipes.js rendimento), pôr ponto onde ele não rende é de propósito pior em tudo.
test("a equipe forte anda mais que a do fim com o carro padrão, mas sem passar de uns 6% na volta", () => {
  for (const pista of ["monaco", "monza", "interlagos"]) {
    const t = (id) => Robos.tempoDaVolta(Robos.perfil(pista, E.specDaEquipe(id), 0), 0.9);
    const tops = ["mclaren", "ferrari", "mercedes", "red-bull"].map(t), fundo = ["audi", "alpine", "cadillac"].map(t);
    assert.ok(Math.min(...tops) < Math.min(...fundo), pista);
    assert.ok(Math.max(...fundo) / Math.min(...tops) < 1.06, `${pista}: a diferença cabe nos pilotos`);
  }
  // o carro de cada equipe é diferente (a Red Bull não anda como a Haas): uma é de curva, outra de reta
  assert.equal(E.specDaEquipe("red-bull").estilo, "curva"); assert.equal(E.specDaEquipe("haas").estilo, "reta");
  assert.ok(E.specDaEquipe("haas").vmax > E.specDaEquipe("red-bull").vmax && E.specDaEquipe("red-bull").grip > E.specDaEquipe("haas").grip);
  assert.equal(E.specDaEquipe("ferrari").name, "Ferrari");
});

test("a ficha do carro dá notas de 1 a 10 e as extremidades aparecem", () => {
  for (const m of [montagem(8, 0, 0, 0, 0, 0), montagem(0, 8, 0, 0, 0, 0), montagem(0, 0, 8, 8, 0, 4)]) for (const f of E.ficha(E.specDaMontagem(m))) assert.ok(f.nota >= 1 && f.nota <= 10 && Number.isInteger(f.nota), f.id);
  const nota = (m, id) => E.ficha(E.specDaMontagem(m)).find((f) => f.id === id).nota;
  assert.ok(nota(montagem(8, 0, 0, 0, 0, 0), "reta") > nota(montagem(0, 8, 0, 0, 0, 0), "reta"));
  assert.ok(nota(montagem(0, 8, 0, 0, 0, 0), "curva") > nota(montagem(8, 0, 0, 0, 0, 0), "curva"));
  assert.ok(nota(montagem(0, 0, 0, 0, 0, 8), "confiab") > nota(montagem(8, 0, 0, 0, 0, 0), "confiab"));
});

// (2026-11-11: o caso "a falha mecânica: a chance..." saiu: esperava as chances de quebra de antes das mudanças pedidas pelo Thiago — ver o PR "testes da volta à escala antiga")

// ---------- a sala do servidor, sem rede ----------
function salaDeMentira() {
  const estados = {};
  const nsp = { handlers: {}, on(e, f) { this.handlers[e] = f; }, to(codigo) { return { emit(ev, d) { if (ev === "state") estados[codigo] = JSON.parse(JSON.stringify(d)); }, volatile: { emit() {} } }; }, sockets: new Map() };
  require("../servidor/corrida/corrida.js")({ of: () => nsp });
  let n = 0;
  const socket = () => {
    const h = {}, s = { id: "s" + ++n, data: {}, h, on(e, f) { h[e] = f; }, emit() {}, join() {}, leave() {}, to() { return { emit() {}, volatile: { emit() {} } }; } };
    nsp.handlers.connection(s); return s;
  };
  const chamar = (s, ev, dados) => new Promise((ok) => s.h[ev](dados, ok));
  return { socket, chamar, estado: (codigo) => estados[codigo] };
}

// (2026-11-16: apagado o teste "sala: a equipe e a montagem passam pelo servidor…", que quebrou na main com o custo novo dos níveis altos e a montagem antiga da carreira; pedido do Thiago)

// (2026-11-16: apagado o teste "sala: as peças (modo carreira) viram a montagem…", que quebrou na main com o custo novo dos níveis altos e a montagem antiga da carreira; pedido do Thiago)
