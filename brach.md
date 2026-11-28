# Tiro: avião na largada do Battle royale e levantar o parceiro segurando E

Pedido do Thiago: "para reanimar, precisa ter um botão que você aperta... não só chegar perto e reanima sozinho. Além disso, para nascer, deve passar um avião lento por cima do mapa... aí as pessoas vão dropando do avião quando quiserem... o avião passa em sentidos aleatórios, mas sempre cruzando o meio do mapa."

**Levantar o parceiro** (`ferramentas/tiro-br-dupla.js`):
- no BR em dupla, o jogador só levanta o parceiro caído **segurando E** perto dele, por 4 s e sem atirar. Soltou o E, o tempo volta a zero;
- perto dele, o E levanta o parceiro em vez de pegar a arma do chão;
- no tablet e no controle, um toque no botão de pegar (ou de usar) começa a levantar, e segue enquanto você fica perto;
- os robôs continuam levantando o parceiro sozinhos.

**Avião da largada** (arquivo novo `ferramentas/tiro-br-aviao.js`, montado depois do airdrop):
- no começo, todo mundo entra num avião que cruza o mapa em linha reta, **sempre passando pelo meio**, de uma borda à outra, num ângulo sorteado a cada partida. A semente é a do salão, então todos veem o mesmo avião;
- o avião voa 65 m acima do ponto mais alto embaixo da rota, a 12 m/s (devagar). Na contagem ele espera na borda; no "Vai!" começa a andar;
- **Espaço ou E salta** quando você quiser (no tablet, pular ou pegar). Aparece um aviso com o tempo que falta; no fim da rota, quem ainda está dentro salta sozinho. Dali segue a queda de antes: queda livre planando e paraquedas a 35 m do chão;
- cada robô salta quando o avião passa mais perto do lugar de largada dele (os lugares espalhados de antes) e plana até lá, então eles continuam espalhados pelo mapa;
- no minimapa aparecem a rota tracejada e um triângulo branco no avião;
- dentro do avião ninguém aparece, não se atira e a zona não tira vida.

A volta do parceiro no BR em dupla continua caindo de paraquedas em cima dele, sem avião.

Conferido só com `node --check` (os arquivos e o script do jogo montado); não joguei.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
