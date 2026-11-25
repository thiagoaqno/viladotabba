# MFD: a linha vermelha da aba ativa alinhada

O Thiago: "quando mudo de aba aquela linha vermelha fica torta".

A linha ficava 15 px abaixo do botão da aba (`bottom:-15px`), e a altura do botão dependia do ícone e da margem do grupo de abas: em cada aba ela caía numa altura e numa largura diferentes.

- As abas ocupam a altura toda do topo; a linha da ativa fica presa no pé dele (`bottom:0`), com 32 px de largura e centrada no ícone, igual em todas.
- O divisor entre a marca e as abas virou um traço fixo (`::before`), sem margem que empurre os botões.
- Abas com a mesma largura (até 40 px, encolhem em tela estreita) e o hover só acende o ícone (o fundo do hover ocupava a altura toda).
- A marca F centrada na altura do topo.

Conferido sem prints; o Thiago testa jogando.
