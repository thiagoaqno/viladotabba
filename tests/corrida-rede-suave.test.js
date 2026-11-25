// Corrida da Galera, regras de F1: a rede dos outros carros (pose.js). Uma regra de pose só para desenhar, bater e conferir; a hora
// real de cada passo vem do navegador (`tt`); o relógio é NTP; o pacote de posições é binário e mais denso para quem está perto.
const test = require("node:test");
const assert = require("node:assert/strict");
const Pose = require("../public/corrida/pose.js");
const S = require("../public/corrida/sim.js");
const T = require("../public/corrida/pistas.js");
const Equipes = require("../public/corrida/f1-equipes.js");
const Humanos = require("../servidor/corrida/corrida-humanos.js");
const Contato = require("../servidor/corrida/corrida-contato.js");

const ESC = 0.75 / 3.6; // metros por unidade

// ---------- extrapolar / interpolar ----------
test("extrapolar: segue o arco (a velocidade gira com a guinada) e a aceleração; erro de centímetros a 200 ms numa curva", () => {
  // um carro a 300 u/s numa curva de raio 100 u (r = 3 rad/s) e acelerando 40 u/s²
  const carro = (t) => { const s = t / 1000, v = 300 + 40 * s, th = 3 * s; return { t, x: 0, y: 0, a: th, vx: v * Math.cos(th), vy: v * Math.sin(th), r: 3 }; };
  const A = carro(0), B = carro(33), o = {};
  // a verdade por integração numérica fina
  let x = 0, y = 0; for (let t = 0; t < 233; t += 0.1) { const s = t / 1000, v = 300 + 40 * s, th = 3 * s; x += v * Math.cos(th) * 1e-4; y += v * Math.sin(th) * 1e-4; }
  let xb = 0, yb = 0; for (let t = 0; t < 33; t += 0.1) { const s = t / 1000, v = 300 + 40 * s, th = 3 * s; xb += v * Math.cos(th) * 1e-4; yb += v * Math.sin(th) * 1e-4; }
  B.x = xb; B.y = yb; A.x = 0; A.y = 0;
  const p = Pose.extrapolar(B, A, 233, o), seco = { x: B.x + B.vx * 0.2, y: B.y + B.vy * 0.2 };
  assert.ok(Math.hypot(p.x - x, p.y - y) < 1.5, `arco+aceleração: erro ${Math.hypot(p.x - x, p.y - y)} u`);
  assert.ok(Math.hypot(seco.x - x, seco.y - y) > 5 * Math.hypot(p.x - x, p.y - y), "bem melhor que seguir reto na velocidade");
});
test("extrapolar: freando para quando a velocidade zera (não anda de ré) e pacote atrasado apaga a velocidade sem tranco", () => {
  const A = { t: 0, x: 0, y: 0, a: 0, vx: 130, vy: 0, r: 0 }, B = { t: 33, x: 4, y: 0, a: 0, vx: 100, vy: 0, r: 0 }, o = {}; // freando a 900 u/s²... (limitado a ACEL_MAX)
  const f = (ms) => Pose.extrapolar(B, A, B.t + ms, {}, 0.3);
  assert.ok(f(2000).x >= f(100).x - 1e-9 && f(2000).vx === 0, "parou e não voltou");
  // pacote atrasado: a velocidade cai suave (sem degrau) depois do corte
  const B2 = { t: 0, x: 0, y: 0, a: 0, vx: 200, vy: 0, r: 0 }; let ant = null, maxSalto = 0;
  for (let ms = 0; ms <= 900; ms += 5) { const p = Pose.extrapolar(B2, null, ms, {}, 0.3); if (ant !== null) maxSalto = Math.max(maxSalto, Math.abs(p.vx - ant)); ant = p.vx; }
  assert.ok(maxSalto < 200 * 0.005 / Pose.QUEDA * 1.01 + 1e-9, `a velocidade cai em rampa (salto máximo ${maxSalto})`);
  assert.equal(Pose.extrapolar(B2, null, 5000, {}, 0.3).vx, 0);
  const x600 = Pose.extrapolar(B2, null, 600, {}, 0.3).x, x5000 = Pose.extrapolar(B2, null, 5000, {}, 0.3).x;
  assert.ok(Math.abs(x600 - x5000) < 1e-6 && x5000 < 200 * 0.6, "fica parado onde parou, sem passar do que andaria à velocidade cheia");
});
test("entre: Hermite passa pelas amostras com a velocidade delas", () => {
  const A = { t: 0, x: 0, y: 0, a: 0, vx: 100, vy: 0, r: 1 }, B = { t: 100, x: 12, y: 3, a: 0.2, vx: 140, vy: 20, r: 1.5 }, o = {};
  assert.deepEqual([Pose.entre(A, B, 0, o).x, o.y, o.a], [0, 0, 0]);
  Pose.entre(A, B, 100, o); assert.ok(Math.abs(o.x - 12) < 1e-9 && Math.abs(o.y - 3) < 1e-9 && Math.abs(o.vx - 140) < 1e-9 && Math.abs(o.r - 1.5) < 1e-9);
  Pose.entre(A, B, 0, o); assert.ok(Math.abs(o.vx - 100) < 1e-9);
});

// ---------- Outro: um carro de outro piloto ----------
test("Outro: um pacote novo não faz o desenho saltar (posição, velocidade e aceleração contínuas) e a correção se apaga", () => {
  const am = (t, x, vx, y = 0, vy = 0) => ({ t, x, y, z: 0, a: 0, vx, vy, r: 0 }), a = {}, b = {}, o = new Pose.Outro();
  o.receber(am(0, 0, 300), 100); o.receber(am(33, 10, 300), 133);
  // o próximo pacote traz o carro 3 u para o lado e freando
  const Tc = 180; o.pose(Tc, a);
  o.receber(am(66, 20, 280, 3, 5), Tc); o.pose(Tc, b);
  for (const k of ["x", "y", "vx", "vy", "ax", "ay"]) assert.ok(Math.abs(a[k] - b[k]) < 1e-6, `${k} contínua: ${a[k]} → ${b[k]}`);
  // o caminho novo (sem correção) e o desenhado: a diferença some em ~0,4 s
  const d = (ms) => { o.pose(Tc + ms, a); o.base(Tc + ms, b); return Math.hypot(a.x - b.x, a.y - b.y); };
  assert.ok(d(0) > 1, "a correção começa do tamanho do erro"); assert.ok(d(1000) < 0.02 * d(0), `e some: ${d(1000)} de ${d(0)}`);
  // sem salto: o desenho anda de forma suave (nenhuma passada de 1 ms maior que a velocidade + o pico da correção)
  let ant = null, maior = 0; for (let ms = 0; ms < 400; ms++) { o.pose(Tc + ms, a); if (ant) maior = Math.max(maior, Math.hypot(a.x - ant.x, a.y - ant.y)); ant = { x: a.x, y: a.y }; }
  assert.ok(maior < 0.3 * 1.5 + 0.1, `passo máximo por ms ${maior} u (300 u/s = 0,3 u/ms)`);
});
test("Outro: correção pequena some na hora (não atrasa o carro) e correção enorme (box, ↺ Pista) salta de uma vez", () => {
  const o = new Pose.Outro(), p = {}, am = (t, x) => ({ t, x, y: 0, z: 0, a: 0, vx: 0, vy: 0, r: 0 });
  o.receber(am(0, 0), 0); o.receber(am(33, 0.2), 40);
  o.pose(40 + 100, p); assert.ok(Math.abs(p.x - 0.2) < 0.006, `4 cm se apagam em 100 ms: ${p.x}`);
  o.receber(am(66, 400), 70); o.pose(70, p); assert.ok(Math.abs(p.x - 400) < 1e-6, "saltou");
  assert.equal(o.cor.length, 0);
});
test("Outro: a mesma conta para desenhar e para bater (pose(T) é função só do tempo) e a hora de uma amostra velha não vale", () => {
  const o = new Pose.Outro(), p1 = {}, p2 = {};
  o.receber({ t: 0, x: 0, y: 0, z: 0, a: 0, vx: 100, vy: 0, r: 0 }, 10); o.receber({ t: 33, x: 3.3, y: 1, z: 0, a: 0.1, vx: 100, vy: 5, r: 0.5 }, 60);
  o.pose(200, p1); o.pose(150, p2); o.pose(200, p2);
  assert.deepEqual(p1, p2);
  assert.equal(o.receber({ t: 20, x: 9, y: 9, z: 0, a: 0, vx: 0, vy: 0, r: 0 }, 220), false, "amostra fora de ordem é ignorada");
});

// ---------- o relógio ----------
test("relógio NTP: acerta o offset pelas respostas de menor ida e volta, mesmo com picos de fila", () => {
  let agora = 1000; const r = Pose.criarRelogio(() => agora), offReal = 5000; // o servidor está 5 s à frente
  let rng = 7; const rand = () => ((rng = (rng * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 20; i++) {
    const ida = 30 + rand() * 4 + (i % 4 === 0 ? 80 : 0), volta = 30 + rand() * 4 + (i % 5 === 0 ? 120 : 0), t0 = agora;
    agora += ida + volta; r.amostrar(t0, t0 + ida + offReal, agora);
    agora += 2000;
  }
  assert.ok(Math.abs(r.off - offReal) < 3, `offset ${r.off} (real ${offReal})`);
  assert.ok(r.rtt < 100 && r.minRtt >= 60 && r.minRtt < 72, `rtt ${r.rtt}, mínimo ${r.minRtt}`);
  // o offset muda devagar (no máximo 2 ms por resposta) depois de acertado
  const antes = r.off; agora += 5; r.amostrar(agora, agora + 40 + offReal + 30, agora + 80); assert.ok(Math.abs(r.off - antes) <= 2.001, "variação lenta");
});

// ---------- o pacote binário ----------
test("pacote de posições: ida e volta sem perder precisão e 3x menor que o JSON", () => {
  const lista = [["ab3x", 1234.5678, 2345.6789, 12.34, -2.9999, 301.27, 456.78, 17.3, 280.4, -90.2, 0.512], ["zz9", 10.01, 20.02, 0, 0.5, 0, 12.5, 0, 0, 0, 0]];
  const buf = Pose.Snap.codificar(1.7e12 + 123.4, lista), d = Pose.Snap.decodificar(buf);
  assert.equal(d.t, 1.7e12 + 123.4); assert.equal(d.c.length, 2);
  const e = lista[0], g = d.c[0];
  assert.equal(g[0], "ab3x"); for (const [i, tol] of [[1, 0.006], [2, 0.006], [3, 0.06], [4, 0.0001], [5, 0.06], [6, 0.01], [7, 0.06], [8, 0.06], [9, 0.06], [10, 0.001]]) assert.ok(Math.abs(g[i] - e[i]) <= tol, `campo ${i}: ${g[i]} contra ${e[i]}`);
  assert.ok(buf.length < JSON.stringify({ t: 1.7e12, c: lista }).length / 2, `${buf.length} bytes contra ${JSON.stringify({ t: 1.7e12, c: lista }).length} de JSON`);
  assert.equal(Pose.Snap.decodificar(new Uint8Array(buf).buffer).c[1][0], "zz9", "também lê um ArrayBuffer (o navegador)");
});
test("snapPara: quem está perto vem em todo pacote, quem está longe menos, e o meu registro raramente", () => {
  const rec = (id, x) => [id, x, 0, 0, 0, 0, 0, 0, 0, 0, 0], lista = [rec("eu", 0), rec("perto", 300), rec("meio", 1200), rec("longe", 5000)];
  const conta = {}; for (let n = 1; n <= 24; n++) for (const r of Humanos.snapPara(lista, "eu", n)) conta[r[0]] = (conta[r[0]] || 0) + 1;
  assert.deepEqual(conta, { perto: 24, meio: 12, longe: 6, eu: 6 });
  assert.equal(Humanos.snapPara(lista, null, 3).length, 4, "quem só assiste recebe todos em todo pacote");
});

// ---------- servidor: a hora real do passo (tt) ----------
const mk = (id, grid) => ({ id, name: id, grid, laps: 0, car: "equilibrado", pneu: "medio", sockets: new Set(), finish: null, dano: 0, paradas: [], bot: false });
const ganchos = { aoSetor: () => true, aoBater: () => true, aoParada() {}, registrar: () => false, mandarAck() {}, mudou() {} };
const sala = (...ps) => ({ phase: "race", startAt: 1.7e12 - 60000, luzes: { espera: 1 }, config: { pista: "interlagos", regras: "f1", voltas: 9, cambio: "auto", ers: "auto" }, players: Object.fromEntries(ps.map((p) => [p.id, p])), order: ps.map((p) => p.id), semente: 7, direcao: null });
test("servidor: dois pilotos com pings diferentes ficam na MESMA hora real (tt); sem tt valia a hora da chegada", () => {
  const t0 = 1.7e12;
  const roda = (comTt) => {
    const a = mk("a", 0), b = mk("b", 2), room = sala(a, b), cod = S.empacotar({ gas: 1 });
    // os dois dão os mesmos passos nas mesmas horas reais; o pacote de A chega 20 ms depois e o de B 140 ms depois
    for (let ms = 0; ms < 2000; ms += 50) {
      const k0 = Math.round(ms / (1000 / 120)), k = new Array(6).fill(cod), tt = t0 + ms + 50;
      for (const [p, atraso] of [[a, 20], [b, 140]]) { p.__fila = p.__fila || []; p.__fila.push({ chega: t0 + ms + 50 + atraso, d: { s: room.startAt, t0: k0, k, ...(comTt ? { tt } : {}) } }); }
    }
    for (let ms = 0; ms <= 2400; ms += 10) {
      for (const p of [a, b]) while (p.__fila.length && p.__fila[0].chega <= t0 + ms) Humanos.entrada(room, p, p.__fila.shift().d, t0 + ms);
      Humanos.andar(room, t0 + ms, ganchos);
    }
    const K = Contato.estado(room), Ha = K.hist.get("a"), Hb = K.hist.get("b");
    // a hora guardada do passo 100 (o mesmo passo, o mesmo instante real) de cada um
    const i = (H) => { for (let j = 0; j < H.n; j++) if (Math.abs(H.x[j] - H.x[0]) >= 0) { /* acha pela posição abaixo */ } return H; };
    const horaDoPasso = (H, n) => H.t[((H.i - 1 - (H.n - 1) + n) % 256 + 256) % 256];
    return { dif: Math.abs(horaDoPasso(Ha, 20) - horaDoPasso(Hb, 20)), i };
  };
  const com = roda(true), sem = roda(false);
  assert.ok(com.dif < 2, `com tt o mesmo passo tem a mesma hora nos dois históricos (${com.dif} ms)`);
  assert.ok(sem.dif > 100, `sem tt a hora é a da chegada e a diferença é a dos pings (${sem.dif} ms)`);
});
test("servidor: tt do futuro é cortado pela chegada, tt velho demais é ignorado e a hora só cresce", () => {
  const t0 = 1.7e12, a = mk("a", 0), room = sala(a), cod = S.empacotar({ gas: 1 });
  Humanos.entrada(room, a, { s: room.startAt, t0: 0, k: [cod, cod, cod], tt: t0 + 5000 }, t0); // mente: 5 s no futuro
  const S1 = a.sim; assert.ok([...S1.tfim.values()].every((v) => v <= t0 + 8 + 1e-6), "cortado pela chegada");
  Humanos.entrada(room, a, { s: room.startAt, t0: 3, k: [cod], tt: t0 - 9000 }, t0); // velho demais
  assert.equal(S1.tfim.has(3), false, "ignorado (vale a hora da chegada)");
  Humanos.entrada(room, a, { s: room.startAt, t0: 4, k: [cod, cod], tt: NaN }, t0);
  assert.equal(S1.tfim.has(4), false);
  for (let ms = 0; ms <= 100; ms += 10) Humanos.andar(room, t0 + ms, ganchos);
  const H = Contato.estado(room).hist.get("a"); for (let j = 1; j < H.n; j++) assert.ok(H.t[j] > H.t[j - 1], "as horas guardadas só crescem");
});
test("servidor: o snap leva a hora real da pose (qr) e os décimos de ms viajam no pacote", () => {
  const t0 = 1.7e12, a = mk("a", 0), room = sala(a), cod = S.empacotar({ gas: 1 });
  Humanos.entrada(room, a, { s: room.startAt, t0: 0, k: new Array(12).fill(cod), tt: t0 + 100.37 }, t0 + 130);
  for (let ms = 0; ms <= 200; ms += 10) Humanos.andar(room, t0 + 130 + ms, ganchos);
  const r = Humanos.snap(room, t0 + 400)[0], d = Pose.Snap.decodificar(Humanos.pacote(t0 + 400, [r])).c[0];
  assert.ok(Math.abs(d[7] - (400 - 100.37)) < 0.2, `idade ${d[7]} ms (a pose é de t0+100,37 e o pacote saiu em t0+400)`);
});

// ---------- batida: a folga da previsão do navegador ----------
test("contatoPasso: o navegador só prevê a batida com os carros mais enterrados que a folga (o servidor, sem folga, bate antes)", () => {
  const D = require("../public/corrida/dinamica.js"), eu = { L: 44, W: 26, massa: 800 };
  const carro = () => { const c = D.novoCarro(0, 0, 0); c.v = 300; c.vx = 300; c.z = 0; c.tick = 1; c.x0 = c.x - 300 / 120; c.y0 = 0; c.a0 = 0; return c; };
  const modelo = (folga) => ({ id: "b", x: 43.2, y: 0, a: 0, vx: 200, vy: 0, r: 0, L: 44, W: 26, massa: 800, z: 0, folga }); // enterrado uns 0,8 u
  const servidor = carro(), navegador = carro(), fundo = carro(), ev = [];
  assert.ok(S.contatoPasso(servidor, eu, [modelo(0)], ev, null, S.PASSO) > 0, "o servidor bate");
  assert.equal(S.contatoPasso(navegador, eu, [modelo(2)], [], null, S.PASSO), 0, "o navegador, com folga de 2 u, ainda não prevê");
  const m = modelo(2); m.x = 38; assert.ok(S.contatoPasso(fundo, eu, [m], [], null, S.PASSO) > 0, "mas prevê quando está bem enterrado");
});

// (2026-11-24: apagado o teste "conjunto: com 80 ms de ida e volta...", que quebrou na main com 0 amostras; pedido do Thiago)
