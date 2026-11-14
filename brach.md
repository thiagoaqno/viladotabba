# Pré-carga: os arquivos pesados de todas as pistas baixados no menu

O Thiago viu travadas na primeira carga de cada pista e sugeriu deixar tudo em cache já na abertura.

- **`/api/corrida/pre-carga` (`server.js`):** a lista dos arquivos pesados de todas as pistas (céus, fotos do GP, fotos da tela de carregamento e da capa, modelos dos carros, do piloto, do pódio e dos enfeites). São 64 arquivos e 15,8 MB, medidos na pasta. A lista é montada uma vez por servidor.
- **`pre-carga.js` (novo):** com o menu na tela, depois de 5 s, o navegador baixa esses arquivos um por vez, só quando está folgado (`requestIdleCallback`) e com a aba visível. Eles ficam no cache do service worker (`sw.js`, que já serve arquivo pesado do cache primeiro). Pula o que já está no cache, refaz a lista no máximo uma vez por dia e para quando a corrida começa (`menuNaTela`). Não roda com "economia de dados", em rede 2G nem no programa de PC (lá os arquivos já estão no computador).
- **O que isto resolve e o que não resolve:** tira a espera da REDE na primeira vez em cada pista no site. Não muda a montagem da pista (o cenário é gerado em código) nem a primeira compilação dos sombreadores de cada pista, que também travam e acontecem no PC. Para essas, o próximo passo precisa de uma medição na máquina do Thiago (em que pista e em que momento: na tela de carregamento ou nos primeiros segundos de corrida).
- Sem entrada no `novidades.json`: o arquivo está quebrado na `main`, e o conserto está no #717.
