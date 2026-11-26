# Tiro da Galera: o mouse não fica mais solto no meio da partida

Um amigo do Thiago ficava com o mouse comum (cursor normal) no meio da partida, às vezes depois do botão direito ou de mexer.

## O que acontecia

O jogo prende o mouse na tela para mirar. Se o navegador soltava o mouse, o jogo pausava e pedia um clique. Mas, se o
navegador recusasse a nova captura **duas vezes**, o jogo desistia e passava a usar o mouse comum até o fim da partida. O Chrome
recusa quando o pedido vem menos de ~1 s depois do mouse escapar, então clicar logo para voltar já contava como recusa.

## O que mudou (tudo pelo `ferramentas/tiro-frontline.js`, seção "captura do mouse")

- **Espera o navegador:** um clique feito cedo demais não é recusado. O jogo guarda o pedido e prende o mouse assim que o
  navegador libera (1,15 s depois do mouse escapar). O clique continua valendo como gesto do jogador nesse meio-tempo.
- **Sem "movimento bruto" depois de uma recusa:** a captura com `unadjustedMovement` (sem aceleração do Windows) falha em
  alguns mouses e drivers. Depois da primeira recusa, o jogo pede a captura comum.
- **Só desiste depois de 5 recusas**, e não de 2.

O que solta o mouse no PC do amigo (sobreposição do Discord, programa do mouse, extensão) continua fora do alcance do jogo. O
que muda é que ele volta a prender com um clique, em vez de ficar solto até o fim da partida.

Conferido no navegador: o jogo abre sem erro e o pedido de captura é o novo. A captura em si não dá para testar sem alguém
jogando: falta o amigo testar.
