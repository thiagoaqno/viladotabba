# Câmeras de dentro presas ao carro (T-cam, cockpit e bico)

O Thiago: "fazer a câmera ser presa no carro é uma boa... pra quando o carro inclinar a visão também inclinar como numa câmera T-cam mesmo, e não uma câmera que sobrevoa o carro".

## Como era (`public/corrida/cameras.js` `pov`)
A posição vinha da posição do carro mais a guinada, e a câmera mirava um ponto do chão 70 u à frente (`lookAt`): o pitch era suavizado e o roll era só um pouco do volante. Quando o carro inclinava (curva inclinada, zebra, relevo, suspensão), a vista continuava reta: parecia uma câmera voando em cima do carro.

## Como fica
- A câmera é um ponto do corpo do carro desenhado (`carros.js` `k.body`): a posição sai do quadro dele (`localToWorld`) e a rotação é a dele (pitch e roll da inclinação, suspensão, guinada com a derrapagem).
- Por cima, o mesmo olhar para baixo de antes (mira 70 u à frente) e a inclinação do ajuste da câmera; o balanço da batida e da zebra e o tremor continuam.
- O rolar extra do volante só vale no modo antigo (o corpo já inclina com o volante).
- No ar (pulo) volta ao modo de antes, que segue o chão à frente.

Vale para as três câmeras de dentro: T-cam, cockpit e bico. Olhar para trás não muda.

Novidade do `novidades.json`: entra depois do #944 (os dois escreveriam no topo).

Conferido só com `node --check`; o Thiago testa jogando.
