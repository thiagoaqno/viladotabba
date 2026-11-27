# Tiro: no Battle royale, os robôs esperam no ar junto com os jogadores

O Thiago viu que os robôs caíam antes dos jogadores. Na contagem, o robô dá o passo de movimento (com gravidade) e sai antes do ponto onde a queda do Battle royale segura todo mundo no ar (`ringCheck`). Por isso ele já descia enquanto o jogador ainda esperava lá em cima.

Agora o passo da contagem dos robôs também passa pela queda (`brQuedaPasso`): eles ficam parados no ar até o "Vai!" e caem junto com todo mundo.

Uma troca só, em `ferramentas/tiro-frontline.js`. Conferido com `node --check` (o build e o script do jogo montado); não joguei.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
