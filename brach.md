# Imagem de satélite embaixo da pista na miniatura 3D

O Thiago notou que o fundo da miniatura (o mapa desenhado do #750) não era satélite e pediu imagem de satélite de verdade, como na referência do mapa da transmissão.

## O que mudou

- **`gp-satelite.js` (novo):** busca na hora os tiles do **Sentinel-2 cloudless 2016** (EOX IT Services, dados Copernicus, licença CC BY 4.0) que cobrem o disco da miniatura, junta num canvas e cola no chão com cada vértice no pixel certo.
  - Nada da imagem fica no jogo. O servidor da EOX libera os tiles para o navegador (CORS); conferi com um pedido de `viladotabba.com`.
  - Zoom 15 em todas as pistas (o Sentinel-2 é de 10 m por pixel), com 6 a 20 tiles por pista (272 no total, medido com a mesma conta do navegador). Um tile tem uns 10 KB.
  - O navegador guarda as duas últimas imagens montadas, de uns 20 MB de memória cada.
  - No tema escuro, a imagem fica um pouco mais escura para a pista e os carros saltarem. A grade do chão some, e o crédito aparece embaixo.
- **De volta ao mundo real:** `ferramentas/mapa-real.js` agora grava em `mapas/<pista>.json` a conta que leva o traçado do jogo a latitude e longitude (`geo`: os parâmetros do encaixe, que `ferramentas/pista-real.js` passou a devolver).
  - Regerei as 23 pistas só com o cache, sem download novo.
  - Em Monza, os pontos do jogo levados de volta caem a 3,8 m em média da linha real (13,7 m no pior), medido até o segmento.
- **Reserva:** sem internet, com o servidor fora ou com menos de 80% dos tiles, a miniatura usa o mapa desenhado do OpenStreetMap, como antes.

Entrada no topo de `novidades.json`. Conferido com `node --check` e `JSON.parse` (os 23 mapas). Não vi a imagem no jogo. O teste jogando fica com o Thiago.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
