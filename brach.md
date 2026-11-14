# Interlagos: a mata do autódromo e as placas das curvas

O Thiago mandou a coleção "F1 Tracks" do Sketchfab (10 pistas cartoon do rccdesign) e escolheu refazer só Interlagos. Os modelos não entram no jogo: são pagos (US$ 25 cada, nenhum com download grátis) e têm de 0,5 a 1,5 milhão de faces cada. Serviram só de referência, e o cenário continua desenhado em código. Interlagos era a pista com menos cenário próprio: só o lago, a caixa-d'água e o prédio dos boxes, sem `kit/interlagos/`.

## O que mudou
- `public/corrida/kit/interlagos/placas.js` (novo): as placas com o nome de cada curva (S do Senna, Curva do Sol, Descida do Lago, Ferradura, Laranjinha, Pinheirinho, Bico de Pato, Mergulho, Junção e Café), nas frações de `gps/interlagos.js`, com a faixa verde e amarela em cima. Ficam atrás da barreira e de frente para quem vem, como as do Red Bull Ring. Uma malha de placas (atlas no canvas) e uma de postes.
- `public/corrida/kit/interlagos/mata.js` (novo): a mata da beira, dos dois lados, em manchas de ruído (o gramado fica aberto entre elas). Tem copas largas de mata atlântica e eucaliptos altos de tronco claro. Fica fora da pista, atrás das barreiras, fora do que está reservado (boxes, caixa-d'água, placas), fora do lago e atrás das arquibancadas de `gps/interlagos.js`. São três InstancedMesh, sem sombra. Os troncos ficam 1,5 u abaixo do chão, para não flutuar.
- `public/corrida/interlagos.js`: `depoisInterlagos` agora monta o prédio dos boxes (o código de antes, que virou `predioDosBoxes`), depois as placas e depois a mata. As contagens ficam em `tr.placasInterlagos` e `tr.mataInterlagos`.
- `public/corrida/gps/interlagos.js`: o `depois` passa os trechos das arquibancadas para a mata.
- `public/corrida/novidades.json`: entrada nova no topo.

Não mexi em `kit/*.js` nem em `pista.js`. O traçado, o relevo e a física continuam iguais.

## Conferido
- `node --input-type=module --check` em `interlagos.js`, `gps/interlagos.js`, `kit/interlagos/placas.js` e `kit/interlagos/mata.js`: tudo ok.
- `novidades.json` com `JSON.parse`: ok.
- Nada foi testado no jogo nem no navegador, sem prints: o Thiago testa jogando.
