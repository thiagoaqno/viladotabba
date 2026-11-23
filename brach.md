# Robôs anotam o ritmo de quem joga (coleta e guarda); o uso no 100 a 150 fica sem efeito até resolver a régua

Pedido do Thiago (2026-11-23, aprovado com "pode fazer"): os robôs aprendem com as voltas de quem joga, separado por pista, seco ou molhado e pneu; no 150 o robô fica 2% mais lento que o jogador, diminuindo até o 100 (o Difícil de hoje); abaixo de 100 nada muda.

## O que entra
- **Banco** (migração `055-ritmo-aprendido.sql`, `bd.js aprenderRitmoCorrida / ritmoAprendidoCorrida`): por pista, piloto, condição e pneu, a razão "volta ÷ volta ideal do carro dele com aquele pneu e aquela água". Cada corrida entra com peso 0,25 (a primeira entra inteira). Testado: 0,96 e depois 1,00 dá 0,97.
- **Coleta** (`corrida.js anotarVoltaParaRobos / aprenderRitmo`): só no fim da corrida de F1 com robôs. Ficam de fora a 1ª volta, voltas com box, com safety car, com toque em carro, com **saída de pista** (o limite de pista da direção de prova) e com mais de 2 toques no muro. Por condição e pneu entra a mediana das voltas boas.
- **Diferença de carro**: a razão é medida contra o carro de quem jogou e aplicada à volta ideal do carro de cada robô (`corrida-robos.js razaoDaVolta`).
- **Base inicial**: sem ritmo aprendido no seco, valem as voltas guardadas em `corrida_voltas_piloto`.
- **Uso** (`alvoF1`): do 100 ao 150, o alvo vai em linha reta do Difícil até o ritmo do jogador + 2%, mas nunca fica mais fácil que o nível sem o ritmo dele.

## A medição: hoje o uso não muda nada
Classificação pilotada de Suzuka (21 robôs, `klk/medir/quali-nivel.js`, banco com as voltas do Thiago):

| Nível | Pole | 10º | Último |
|---|---|---|---|
| 100 | 41,300 | 42,300 | 42,850 |
| 125 | 40,900 | 41,800 | 42,450 |
| 150 | 40,600 | 41,400 | 42,100 |
| 150 com o ritmo do Thiago | 40,600 | 41,400 | 42,100 |

Por quê:
1. **Do 100 para cima o alvo de tempo não acelera ninguém.** A tabela de tempo por nível trava na volta ideal (f = 1: Suzuka 43,89 com qualquer f de 1 a 1,5); qualquer alvo abaixo dela vira o nível máximo, 1,5. O 125 e o 150 já pilotam no limite do carro; a diferença entre eles vem só do carro a mais do nível (+2,5% / +5% de aderência e +3% / +6% de potência).
2. **A conta e a pista estão em réguas diferentes.** Na conta, o Thiago em Suzuka (média das 5 melhores voltas de corrida, 42,16) fica a 0,96 da volta ideal, mais rápido que o Difícil (1,005). Na pista, o robô do 100 já faz 41,30 na classificação. Juntar as duas réguas (somar aderência ao robô pela conta) deixaria o 150 ainda mais longe do Thiago em Suzuka.

## O que falta (próximo passo recomendado)
Medir o jogador e os robôs **na mesma corrida**: no fim de cada corrida, a razão do jogador dividida pela dos robôs daquele nível, com o mesmo pneu e a mesma água. Com essa proximidade em voltas de verdade, o carro a mais do 150 (a única alavanca que mexe acima do 100) passa a ser ajustado para deixar o robô 2% atrás do jogador. Até lá este PR só guarda os dados, e o jogo anda igual à `main`.

`node --check` em `bd.js`, `corrida.js` e `corrida-robos.js`. Sem testes novos (regra do projeto).
