# Tiro da Galera: Favela do Thiago (versão 3) e dominação em cima de morro ou laje

- **Mapa:** o `favela.json` passa a ser a versão que o Thiago editou (posições ajustadas e dominação nova). Conferido: os 107 pontos dos bots e os nascer dos dois times estão na rede de caminhos dos bots. Um ponto que ficou fora foi tirado.
- **Dominação na altura certa:** o ponto de dominação agora pode ter um 3º número, a altura do piso (`[x, z, y]`). O editor grava essa altura quando o ponto é colocado em cima de um morro ou de uma laje, e o jogo usa ela (troca em `tiro-frontline.js`). Antes, o jogo procurava o chão em y = 0 e o ponto afundava embaixo da terra. Na Favela, o ponto A está em cima do morro (y 3,05).

Conferido no navegador, no modo dominação: A fica em y 3,05, e B e C ficam no chão.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
