# Retratos dos pilotos em pixel art, montados por peças

O Thiago pediu uma imagem pixelada para cada piloto do grid, para ter "fotos" no card, e depois um espaço para montar o próprio piloto. Este PR faz os retratos. O montador vem no próximo.

## `pixel-piloto.js`

- **Sem arquivo de imagem:** cada retrato é uma grade de 32×32 montada em código, por peças:
  - o rosto e o tom de pele (6 tons);
  - o cabelo: curto, raspado, topete, ondulado, cacheado, longo, tranças ou calvo;
  - a cor do cabelo;
  - a barba: rala, cheia, bigode ou cavanhaque;
  - a sobrancelha, os olhos e os óculos.
- **Macacão:** vai embaixo, na cor da equipe, com a gola escura, a faixa do peito e os patrocínios.
- **Contorno:** o contorno escuro sai sozinho em volta de tudo.
- **`TRACOS`:** os traços dos 22 pilotos de 2026 e dos que aparecem nas temporadas de 2023 a 2025, pela sigla. Quem não está na tabela, como os jogadores, ganha traços sorteados pelo nome, sempre os mesmos.
- **`retrato(tracos, { cor })`:** devolve a imagem (data URL), guardada por combinação. Ela aparece com `image-rendering: pixelated`.
- **Montador:** as listas `PELES`, `CABELOS`, `CORES_CABELO`, `BARBAS` e `OLHOS` ficam exportadas para o montador do próximo PR.

## Onde aparece (HUD "Transmissão (TV)", `hud-tv.js`)

- **Cartão do piloto:** o retrato fica ao lado do número. O número e o nome ficaram um pouco menores para caber.
- **Aviso de novo líder:** o retrato aparece ao lado do nome.

A entrada no `novidades.json` fica para depois do #956, que conserta o JSON da `main`. Assim os dois PRs não mexem nas mesmas linhas.
