# Robôs: ataque na saída de curva com ERS

O Thiago: "saída de curva... reta longa na frente... você tem bateria... o que você faz? já sai da curva com ERS ligado e coloca de lado pra ultrapassar. sinto que falta isso".

## Como era
- O ERS do robô só ligava com o carro já em reta (curvatura baixa no ponto e ~2 carros à frente) e colado no da frente (a 3 carros).
- A ultrapassagem planejada só começava na reta e com diferença de velocidade já feita: na saída de curva o robô ficava atrás e só tentava no meio da reta, quando já era tarde.

## Como fica
- `corrida-robos.js` `passoF1`: **saída para reta longa** = em corrida, ainda abaixo de 90% do topo, uma reta de 1200 u ou mais começando até 30 pontos à frente, bateria acima do mínimo de ataque do piloto, fora da chuva, de Mônaco e do safety car.
- Nessa saída, com alguém a até 1,2 s (ou já na manobra), o **ERS liga desde a saída**, com a curva já aberta (curvatura abaixo de 1/600) e a traseira sem patinar. Fica de fora o meio da curva, onde o ERS dava muito mais batida (medido em 21/nov em Suzuka: 274 contra 74).
- `corrida-robos-transito.js` `transito`: com o da frente a até 5 carros nessa saída, **parte para o lado já ali**, sem esperar diferença de velocidade (ela vem do ERS).
- `retaAdiante`: o tamanho da reta à frente, guardado no perfil da pista (calculado uma vez).

Os números (1200 u, 1,2 s, 5 carros, 1/600) são de ajuste, não medidos: o Thiago testa jogando.

Novidade no `novidades.json` (com a da T-cam do #947).

Conferido só com `node --check`.
