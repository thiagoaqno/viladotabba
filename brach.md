# A travada da classificação: o servidor carrega tudo na abertura, e o log da tela aponta o quadro certo

Pedido do Thiago (2026-11-21): "na contagem do qualify o game sempre trava" e "quando cliquei em ir pra largada... o tanto que demorou". O `servidor.log` dele (Jeddah) mostrou duas coisas.

## Servidor: 879 ms carregando arquivo no começo da classificação
- O perfil da travada era quase todo o Node procurando arquivo (`wrapResolveFilename`, `getNearestParentPackageJSON`), um `require` feito na hora.
- Os robôs liam `quali-fator.json` e `acerto-ideal.json` e os planos de pneu só na primeira classificação (`corrida-robos.js`). A sala carregava na hora a carreira, o Paddock, a análise e a gravação (`corrida.js`).
- Agora os dois carregam tudo isso logo depois da abertura do programa (`setImmediate`), fora de qualquer corrida.

## Tela: quadros de 12,4 s (começo do Q1), 5,2 s (contagem do Q2) e 4 a 4,7 s (antes da largada)
- O log não dizia o porquê, e o próprio log tinha um erro. O tempo de um quadro é medido no começo do quadro SEGUINTE, mas os shaders, as geometrias e as texturas novas eram contados no quadro errado (o seguinte, quase sempre sem nada). Por isso as travadas grandes apareciam "sem nada novo", e uma de 396 ms aparecia com 20 shaders.
- `jogo.js contarTravada` agora manda o que o quadro lento criou de verdade e quanto cada parte dele levou (física, outros carros, sons e efeitos, desenho, HUD), mais o que sobrou fora do quadro (eventos do servidor, placa de vídeo, navegador).
- Ainda não corrige a travada da tela. Ele diz onde ela está: com o próximo `servidor.log` dá para corrigir no lugar certo (provavelmente shaders dos carros e da câmera compilados na hora).
