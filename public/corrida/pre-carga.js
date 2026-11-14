// Corrida da Galera — a PRÉ-CARGA: enquanto a pessoa está no menu, o navegador baixa aos poucos os arquivos pesados de TODAS as pistas (o céu,
// as fotos do GP e da tela de carregamento, os modelos dos carros e dos enfeites: a lista vem de /api/corrida/pre-carga) e eles ficam no cache do
// service worker (sw.js, "cache primeiro" para arquivos pesados). Assim a primeira vez em cada pista não espera a rede (pedido do Thiago,
// 2026-11-13: "no loading inicial devia dar load em todas as pistas e deixar tudo em cache").
// Cuidados: um arquivo por vez, só com a aba visível e o navegador folgado (requestIdleCallback), nada com "economia de dados" ou rede 2G, e
// nada no programa de PC (lá os arquivos já estão no próprio computador). O que já está no cache é pulado; a lista inteira é refeita no
// máximo uma vez por dia neste navegador (`corrida:preCarga`).
const CHAVE = "corrida:preCarga", DIA = 24 * 3600 * 1000, CACHE = "corrida-pesados-1"; // (o mesmo nome do cache de sw.js)

function podeBaixar() {
  const c = navigator.connection;
  if (c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || ""))) return false;
  if (/^(127\.0\.0\.1|localhost|\[::1\])$/.test(location.hostname)) return false; // o programa de PC (e o servidor de teste): os arquivos já são locais
  return "caches" in window && "serviceWorker" in navigator;
}
const ocioso = () => new Promise((ok) => (window.requestIdleCallback ? requestIdleCallback(() => ok(), { timeout: 4000 }) : setTimeout(ok, 600)));
const visivel = () => new Promise((ok) => { if (!document.hidden) return ok(); const f = () => { if (!document.hidden) { document.removeEventListener("visibilitychange", f); ok(); } }; document.addEventListener("visibilitychange", f); });

let rodando = false, parar = false;
export async function preCarregarPistas() {
  if (rodando || !podeBaixar()) return;
  try { const ult = JSON.parse(localStorage.getItem(CHAVE) || "0"); if (Date.now() - ult < DIA) return; } catch { /* sem armazenamento: segue */ }
  rodando = true; parar = false;
  try {
    await navigator.serviceWorker.ready; // (o pedido passa pelo sw.js, que guarda o arquivo pesado no cache dele)
    const lista = await (await fetch("/api/corrida/pre-carga")).json(), cache = await caches.open(CACHE);
    for (const { f } of lista) {
      if (parar) return;
      if (await cache.match(f)) continue;
      await visivel(); await ocioso();
      try { await fetch(f, { priority: "low" }); } catch { /* sem rede: tenta no próximo dia */ }
    }
    try { localStorage.setItem(CHAVE, JSON.stringify(Date.now())); } catch { /* sem armazenamento */ }
  } catch (e) { console.warn("Corrida: pré-carga das pistas", e); }
  finally { rodando = false; }
}
// a corrida começou: a pré-carga para, para não disputar a rede e a CPU com o jogo (no menu de novo, ela continua de onde parou)
export function pararPreCarga() { parar = true; }
