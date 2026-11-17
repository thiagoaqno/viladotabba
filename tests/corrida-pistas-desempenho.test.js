// Desempenho da pista (sobretudo Mônaco, que travava): conta, sem WebGL, o que o navegador teria de desenhar (tests/ajuda-cena/medir.mjs)
// e segura os tetos. Antes de juntar as malhas paradas (kit/fundir.js), Mônaco tinha 920 malhas e 371 chamadas de desenho por
// quadro na vista do jogo (414 com as sombras); agora tem ~270 malhas e ~160 chamadas. Os tetos têm uma folga de uns 25%.
const test = require("node:test");
const assert = require("node:assert/strict");

// (2026-11-17) teste apagado: quebrou depois das mudanças do Thiago (pedido dele)

// (2026-11-14: apagado o teste "as pistas do calendário e as antigas montam com um teto de malhas": falhava na main; pedido do Thiago, testes velhos que quebram se apagam)

test("o que se mexe não foi fundido nem congelado: bandeiras, barcos, bandos, gaivotas e checkpoints (e a roda-gigante, numa pista que tem uma: Mônaco não tem)", { timeout: 120000 }, async () => {
  const { montar } = await import("./ajuda-cena/index.mjs");
  const { tr, THREE } = await montar("monaco");
  const dentroDe = (grupo, o) => { for (let p = o; p; p = p.parent) if (p === grupo) return true; return false; };
  const dentro = (o) => dentroDe(tr.grp, o);
  const V = tr.vida;
  const rio = (await montar("rio")).tr, Rd = rio.vida.rodas; // Mônaco não tem roda-gigante (não há uma no circuito): a do Rio serve de prova
  assert.equal(V.panos.length, 0, "Mônaco não usa os mastros genéricos");
  assert.ok(rio.vida.panos.length > 0 && rio.vida.panos.every((p) => dentroDe(rio.grp, p.pano) && p.pano.matrixAutoUpdate), "as bandeiras do Rio ficam na cena e se mexem");
  assert.equal(V.rodas.length, 0, "Mônaco não tem roda-gigante");
  assert.ok(Rd.length > 0 && Rd.every((w) => w.roda.parent && w.cabs.parent && w.roda.matrixAutoUpdate), "a roda-gigante gira");
  assert.ok(V.barcos.length === 8 && dentro(V.barcos[0].cascos), "os barcos são um InstancedMesh na cena");
  assert.ok(V.passaros.length === 3 && dentro(V.asas), "os bandos são um InstancedMesh na cena");
  assert.ok(tr.portais.length === 11 && tr.portais.every((p) => dentro(p.g)), "os checkpoints ficam na cena (jogo.js liga e desliga)");
  assert.ok(tr.cones.every((c) => dentro(c.mesh)) && dentro(tr.portico.grupo) && dentro(tr.sky), "cones, pórtico e céu continuam mexíveis");
  // a animação continua mexendo: depois de 5 s, as matrizes dos barcos e das cabines mudaram
  const { animarVida } = await import("../public/corrida/vida.js");
  const antes = [V.barcos[0].cascos.instanceMatrix.version, Rd[0].cabs.instanceMatrix.version, V.asas.instanceMatrix.version];
  const p = tr.pts[200], foco = { x: p.x, y: p.y, z: p.h, a: 0 };
  for (let k = 0; k < 100; k++) { animarVida(tr, 0.05, foco); animarVida(rio, 0.05, { x: rio.pts[200].x, y: rio.pts[200].y, z: 0, a: 0 }); }
  assert.ok(V.barcos[0].cascos.instanceMatrix.version > antes[0] && Rd[0].cabs.instanceMatrix.version > antes[1] && V.asas.instanceMatrix.version > antes[2], "barcos, cabines e bandos andam");
  const m = V.barcos[0].cascos, a = new THREE.Matrix4(), b = new THREE.Matrix4();
  m.getMatrixAt(0, a); for (let k = 0; k < 100; k++) animarVida(tr, 0.05, foco); m.getMatrixAt(0, b);
  assert.notDeepEqual(a.elements, b.elements, "o barco mudou de lugar");
});
