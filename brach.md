# Tiro: no BR em dupla, quem morre volta se o parceiro sobreviver

Pedido do Thiago: quando um jogador morre de vez com a dupla dele ainda viva, ele volta depois de um tempo, que cresce com a partida, e cai do céu sem armas.

**Como funciona** (`ferramentas/tiro-br-dupla.js`):
- só vale para quem **morre de vez** (sangrou, levou o tiro final caído ou caiu do mapa) com o **parceiro vivo**;
- o tempo de espera depende de quanto da partida já passou (a partida é medida pela zona, do começo até ela sumir):
  - primeiro minuto e primeiro quarto: **10 s**;
  - segundo quarto: **30 s**;
  - terceiro quarto: **1 min**;
  - último quarto: **1 min 30 s**;
- se o parceiro morrer antes do tempo acabar, não volta (a dupla sai);
- volta **caindo de paraquedas em cima do parceiro** (de 75 m, a uns 3 m dele; com teto em cima, aparece no chão ao lado), **sem armas**: só a pistola, vazia, e nenhuma granada. Armas, munição e granadas se acham no chão;
- enquanto espera, a tela diz "Você volta em N s se fulano sobreviver" e a câmera segue o parceiro;
- vale para pessoas e robôs. No salão, a máquina dona do soldado decide e avisa os outros (evento `brvolta`).

Conferido só com `node --check` (o arquivo e o script do jogo montado); não joguei.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
