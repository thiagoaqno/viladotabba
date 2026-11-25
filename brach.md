`# Controle no celular: painel de volante com LEDs, os pneus, zona morta, sem zoom e tela cheia
`
`O Thiago pediu:
`- poder escolher o pneu direto no celular;
`- que a tela não dê zoom;
`- uma zona morta maior;
`- um estilo de painel de carro, com LEDs e animações;
`- tela cheia, "que no Safari é foda".
`
`## O visual (`controle.html`)
`
`- **Barra de LEDs de troca de marcha** no alto, com 5 verdes, 5 vermelhos e 5 azuis, como no volante de F1. Eles acendem com a rotação, de 45% em diante, e no corte piscam todos em azul.
`- **Display de vidro escuro:**
`  - a marcha enorme, que dá um "pop" quando troca;
`  - a velocidade, a volta e a posição em letra de painel;
`  - o ERS e a vida do pneu em barras de 10 segmentos. O ERS pisca quando está desdobrando, e a vida fica verde, amarela ou vermelha.
`- **Botões redondos** com aro de LED na cor de cada função: ERS amarelo, BOX azul, rádio verde e assim por diante. Eles acendem e afundam no toque e vibram de leve no Android.
`- **Pedais** com medidor de 12 segmentos que acende de baixo para cima: verde no acelerador, vermelho no freio, e os do topo mais claros.
`
`## Os pneus
`
`Uma fileira "BOX COM" tem cinco pneus: S, M, H, I e W. O toque pede o box com aquele composto, igual às teclas 1 a 5 do PC (\`digitoPneu\`).
`- Cada pneu mostra quantos jogos sobram, e fica apagado sem jogo.
`- O pedido de box fica aceso e "respirando", e o pneu de agora ganha um pontinho em cima.
`- No jogo, \`controle-celular.js\` aceita a ação \`pneu:<composto>\` e manda ao celular o pedido de box e os jogos (\`jogosDe\`).
`
`## Zona morta
`
`Ficou ajustável no ⚙, de 0 a 15°, com 4° por padrão. Antes era fixa em 1°. Fora dela, a conta recomeça da borda, sem degrau.
`
`## Sem zoom
`
`O controle bloqueia o toque duplo (dois toques em menos de 350 ms), a pinça, os gestos do Safari e o arrastar com dois dedos. Também usa \`touch-action:none\` em tudo.
`
`## Tela cheia
`
`- **Botão ⛶:** pede a tela cheia de verdade onde o navegador deixa (Android, iPad), e o "Começar" também pede.
`- **No iPhone:** o Safari não deixa uma página ocupar a tela toda. Por isso, lá o botão mostra o passo a passo do "Adicionar à Tela de Início", que abre o Volante como app, sem as barras. A página já tinha as marcas de app; aberto pelo ícone, o botão some.
`- **Aviso de conexão:** o "conectado" some depois de 3 s, para não ficar em cima dos LEDs.
`
`## Conferido
`
`Abri a página num servidor de teste, no tamanho de um celular deitado (844×390), sem erros, e conferi o visual. Não testei num celular de verdade, nem com o jogo mandando o painel.
`
`A novidade fica para depois do #966, que conserta o \`novidades.json\` da \`main\`.
