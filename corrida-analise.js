// Corrida da Galera — o que a aba Análise da carreira mostra: o servidor anota a corrida enquanto ela acontece (sem custo por quadro: só quando um carro
// passa por um portão de setor) e, no fim do GP, resume tudo num objeto pequeno que vai para o save (`resultado.analise`).
// A pista tem 12 portões (T.SECTORS): os setores da análise fecham nos portões 4 e 8 e na linha de chegada.
const ms = (s) => Math.round(s * 1000) / 1000;

function setor(p, s, agora) {
  if (s === 4) p.anaS1 = agora; else if (s === 8) p.anaS2 = agora;
}
// a volta fechou (`p.laps` já subiu, `inicio` é a hora em que ela começou)
function volta(room, p, tempo, inicio) {
  const a = (room.analise ||= { porVolta: {}, sc: [], amarelas: 0, safeties: 0 });
  const n = p.laps, h = (p.ana ||= { v: [], s: [], p: [] });
  a.porVolta[n] = (a.porVolta[n] || 0) + 1; // a ordem em que cruzaram a linha nesta volta é a posição
  h.v.push(ms(tempo)); h.p.push(a.porVolta[n]);
  const s1 = p.anaS1 > inicio ? p.anaS1 - inicio : null, s2 = s1 != null && p.anaS2 > p.anaS1 ? p.anaS2 - p.anaS1 : null;
  h.s.push(s1 != null && s2 != null && tempo * 1000 > s1 + s2 ? [ms(s1 / 1000), ms(s2 / 1000), ms(tempo - (s1 + s2) / 1000)] : null);
  const d = room.direcao; if (!d) return;
  if (d.safety) { if (!a.sc.includes(n)) a.sc.push(n); if (a.ultSafety !== d.safety) { a.ultSafety = d.safety; a.safeties++; } }
  if (d.amarelo && a.ultAmarelo !== d.amarelo) { a.ultAmarelo = d.amarelo; a.amarelas++; }
}
// os momentos da corrida (a linha do tempo da tela do resultado): cada linha da direção de prova, com a hora desde a largada, a volta do líder
// e, quando a linha fala de um piloto, o ponto da pista onde ele estava (fração da volta, a mesma do mapa). `onde(p)` dá { idx, n }.
const SEM_MOMENTO = /^(🔵|🏁 \S.* cruzou a chegada)/; // a bandeira azul e cada chegada encheriam a linha do tempo
function evento(room, texto, onde) {
  if (room.phase !== "race" || !room.startAt || SEM_MOMENTO.test(texto)) return;
  const a = (room.analise ||= { porVolta: {}, sc: [], amarelas: 0, safeties: 0 }), ev = (a.eventos ||= []);
  if (ev.length >= 300) return;
  const resto = texto.replace(/^\S+\s+/, "");
  let quem = null, quemId = null; for (const id of room.order) { const p = room.players[id]; if (p && p.name && resto.startsWith(p.name) && (!quem || p.name.length > quem.name.length)) { quem = p; quemId = id; } }
  let lider = 0; for (const id of room.order) { const p = room.players[id]; if (p && p.laps > lider) lider = p.laps; }
  let f = null; if (quem && onde) { try { const o = onde(quem); if (Number.isFinite(o.idx) && o.n) f = Math.round((o.idx / o.n) * 1000) / 1000; } catch (e) { f = null; } }
  ev.push({ t: Math.max(0, Math.round((Date.now() - room.startAt) / 100) / 10), v: lider + 1, x: texto, id: quemId, f });
}
function limpar(room) { room.analise = null; room.analiseGP = null; for (const id of room.order) { const p = room.players[id]; if (p) { p.ana = null; p.anaS1 = 0; p.anaS2 = 0; } } }

// O resumo do GP. `chave(p)` dá o nome do piloto no save ("voce" ou o id do piloto real).
function resumo(room, chave) {
  const a = room.analise || { sc: [], amarelas: 0, safeties: 0 }, pilotos = {};
  for (const r of room.resultado || []) {
    const p = room.players[r.id]; if (!p) continue;
    const h = p.ana || { v: [], s: [], p: [] };
    let melhorV = -1; h.v.forEach((t, i) => { if (melhorV < 0 || t < h.v[melhorV]) melhorV = i; });
    pilotos[chave(p)] = {
      g: (p.grid ?? -1) + 1, v: h.v, p: h.p, // largada, tempo e posição em cada volta
      s: melhorV >= 0 ? h.s[melhorV] : null, sv: h.s, mv: melhorV + 1, // setores da melhor volta, setores de cada volta e o número da melhor volta
      c0: (p.compostos && p.compostos[0]) || p.pneu || null, b: (p.paradas || []).map((x) => ({ v: x.volta, c: x.composto, t: x.tempo })),
      t: p.finish != null ? ms(p.finish + (p.acrescimo || 0)) : null, a: ms(p.acrescimo || 0), e: !!p.estimado,
    };
  }
  return { pilotos, voltas: room.config?.voltas || 0, pista: room.config?.pista || null, eventos: a.eventos || [], sc: a.sc, safeties: a.safeties, amarelas: a.amarelas, chuva: !!(room.clima && room.clima.chove), hora: room.config?.hora || "dia" };
}

module.exports = { setor, volta, evento, limpar, resumo };
