// Corrida da Galera — o service worker do app instalável (PWA), só em /corrida/.
// A regra que manda: os deploys aparecem NA HORA (a main publica a cada push, quase todo dia).
//  - código (HTML, JS, CSS, JSON) e o resto: REDE PRIMEIRO; o cache só serve sem internet. Nunca código velho com internet.
//  - arquivos pesados que quase não mudam (modelos .glb/.gltf/.bin, imagens, sons, fontes, .ktx2): CACHE PRIMEIRO, e a cópia é
//    renovada por trás a cada uso (stale-while-revalidate): abrir uma pista já vista não baixa nada de novo, e uma imagem trocada chega
//    na abertura seguinte, sem precisar mudar versão nenhuma.
//  - nunca guarda /socket.io/, /api/ nem /admin/ (o jogo em tempo real, os dados e o painel).
// VERSAO: mudar só se a forma de guardar mudar; o `activate` apaga os caches de outras versões.
const VERSAO = "1", PESADOS = `corrida-pesados-${VERSAO}`, CODIGO = `corrida-codigo-${VERSAO}`;
const PESADO = /\.(glb|gltf|bin|jpg|jpeg|png|webp|avif|gif|mp3|ogg|wav|m4a|ktx2|hdr|woff2?|ttf|otf)$/i;
const NUNCA = /^\/(socket\.io|api|admin)\//;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== PESADOS && k !== CODIGO) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin || NUNCA.test(u.pathname) || r.headers.has("range")) return; // o navegador cuida sozinho (com `range`: áudio e vídeo em pedaços)
  if (PESADO.test(u.pathname)) e.respondWith(pesado(e, r));
  else e.respondWith(codigo(r));
});
async function pesado(e, r) {
  const c = await caches.open(PESADOS), guardado = await c.match(r);
  const rede = fetch(r).then((resp) => { if (resp.ok && resp.status === 200) c.put(r, resp.clone()); return resp; });
  if (guardado) { e.waitUntil(rede.catch(() => {})); return guardado; } // na hora, do cache; a cópia nova chega por trás
  return rede;
}
async function codigo(r) {
  const c = await caches.open(CODIGO);
  try {
    const resp = await fetch(r);
    if (resp.ok && resp.status === 200) c.put(r, resp.clone());
    return resp;
  } catch (erro) {
    const guardado = await c.match(r, { ignoreSearch: r.mode === "navigate" }); // sem internet: a última versão que deu certo
    if (guardado) return guardado;
    throw erro;
  }
}
