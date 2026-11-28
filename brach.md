# Tiro: airdrop no Battle royale (Barrett e o seu layout)

Pedido do Thiago: um airdrop que cai em lugares aleatórios do mapa a cada 2,5 min de partida, com a Barrett e a possibilidade de escolher um layout seu. E a Barrett, por ser muito meta, só no airdrop.

**Como funciona** (`ferramentas/tiro-br-airdrop.js`, novo, injetado depois das motos):
- a cada **2 min 30 s** de partida (pelo relógio da zona, o mesmo em todo o salão) cai uma caixa num ponto de chão **sorteado dentro da zona que vem**. A semente é a do salão, então todo mundo vê a caixa no mesmo lugar;
- ela desce de **paraquedas** de 85 m (uns 12 s), com um **facho de luz** amarelo até o céu e um **quadrado amarelo no minimapa** (piscando enquanto cai). Um aviso na tela diz que está caindo;
- quando pousa, aparece **uma Barrett M82 no chão**, do lado da caixa, com 3 pentes. Como as outras armas do chão, não vai pela rede: quem pega primeiro na sua tela leva;
- **na caixa**, a tecla de usar (E, X segurado no controle, botão Ramasser no tablet) dá **o seu layout**: as duas armas e as granadas da classe escolhida (para outra, troque a classe no menu de pausa antes de pegar). **Cada pessoa pega o seu uma vez por caixa**; depois disso o quadrado do minimapa fica apagado para ela.

**A Barrett só no airdrop:** ela saiu da lista das armas espalhadas pelo mapa (`BR_ARMAS`). Quem pegar uma e morrer deixa ela no chão, como qualquer arma.

**Ainda não tem:** robôs indo atrás do airdrop, e a caixa avisando pela rede quem já pegou o layout (o layout é de cada um, então isso não atrapalha).

Conferido só com `node --check` (o arquivo e o script do jogo montado); não joguei.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
