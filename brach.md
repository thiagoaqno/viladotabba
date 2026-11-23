# A chuva na volta de classificação dos robôs, e a linha da batida no editor

O Thiago (2026-11-23): "sinto que os bots jogam numa configuração diferente da minha nos qualifies, especialmente quando chove... fizeram 48 s chovendo em Mônaco". E sobre a hitbox de Mônaco: "faça o 2" (ele mesmo acerta as peças no editor).

## A chuva na classificação (`corrida-robos.js voltaLancada`)
- O robô não pilota a volta da classificação: o tempo sai da tabela do perfil dele (`tempoDaVolta`). A chuva entrava pela aderência molhada do pneu, e isso só tirava metade do que a física do carro perde. Medido:

| Pista | Conta do robô (garoa / chuva / forte) | Piloto ideal na física (`klk/medir/chuva-volta.js`) |
|---|---|---|
| Mônaco | +4,0 / +5,1 / +3,4% | +9,4 / +10,6 / +10,6% |
| Bahrein | +3,6 / +4,5 / +3,0% | +9,2 / +10,2 / +10,1% |

- Agora a volta é a do seco vezes o que a chuva custa na física (`molhadoNaFisica`, a média das duas pistas): garoa (0,3) +9,3%, de 0,6 para cima +10,4%, e no meio a reta entre eles.
- Conferido com um robô de nível 100 em Mônaco: 49,50 s no seco; 54,10 s na garoa; 54,65 s na chuva e na chuva forte.
- Na corrida nada muda: lá o robô anda com a física de verdade.

## A linha da batida no editor (`cenario-pista.js`)
- No editor de pistas a linha vermelha da batida (#901) aparece sempre. Ela mostra a batida de quando a pista abriu; depois de mexer nas peças, recarregue.
- Na curva antes do grampo de Mônaco, quem estreita a pista são o item 187 (guard-rail com tela) e o 188 (placa), do lado esquerdo, que encostam na beira do asfalto entre os pontos 884 e 890.
