`# Notícias da carreira com os retratos em pixel art: figurinhas, duelos e o pódio
`
`O Thiago pediu que os retratos novos dos pilotos rendessem mais notícias e animações.
`
`## As figurinhas (`temporada/stories.js` `figurinhas`, `stories.css`)
`
`- **Figurinha:** é um adesivo com o retrato em pixel art, a borda na cor da equipe com contorno branco e um brilho que passa a cada 2,6 s. Ela entra com um "pop" girando, logo depois que o card abre.
`- **Notícias com um piloto:** o líder do campeonato (ou você, quando lidera), o destaque do GP, a volta mais rápida e o box mais rápido ganham a figurinha dele.
`- **Duelos:** o rival na tabela e o duelo com o companheiro de equipe mostram as duas figurinhas frente a frente. Cada uma entra de um lado, e o "VS" aparece no meio, crescendo.
`- **Seu retrato:** é o do montador (`lerPixel`), com o macacão da sua equipe.
`
`## Notícias novas
`
`- **"Pódio do GP":** os três primeiros do último GP caem nos degraus, nesta ordem: o 3º, o 2º e o 1º, no degrau dourado do meio. O texto vem em cima ("Verstappen no topo, Leclerc e Norris ao lado").
`- **"Pole do GP":** quem largou em 1º no último GP, pela análise do GP (posição no grid = 1), com a figurinha dele.
`- **Textos:** as situações novas `podio_gp` e `pole` têm títulos e textos que se combinam (`stories-textos.js`), como as outras.
`
`## Os retratos na página da carreira (`temporada/index.html`)
`
`O `window.PixelPiloto.porId(id, cor)` devolve o retrato de um piloto da tabela, pela sigla do grid do ano: o desenhado, para os 22 de 2026. Com "voce", devolve o seu, do montador. Sem a página pronta, a notícia sai sem figurinha.
`
`## Conferido
`
`- A página da carreira carrega e entrega os retratos.
`- Montei uma prévia estática do pódio e do duelo e acertei dois problemas: um nome de classe repetido, \`.st-vs\`, que desenhava um anel em volta da figurinha (o meu virou \`.st-pxvs\`), e o duelo que cobria o título.
`
`A novidade fica para depois do #966, que conserta o \`novidades.json\` da \`main\`.
