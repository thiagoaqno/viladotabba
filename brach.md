# Classificação: saída em grupos, tempo estimado no "Pronto", fantasmas de verdade e a tela entre as sessões

Pedidos do Thiago (2026-11-23):
- "quando eu termino o qualify (faço 1 volta) eu aperto em pronto, então o tempo dos bots precisa ser estimado. Além disso, eles devem ser liberados aos poucos, a cada 5 s uns 2 ou 3, igual na F1";
- "mesmo com modo fantasma os robôs ainda evitam passar um dentro do outro";
- "você não fez o estilo das telas pós-qualify".

## A saída em grupos
- `corrida-robos.js prepararQuali`: grupos de 2 ou 3 robôs (sorteados pela semente) a cada `QUALI_SAIDA_MS = 5000`. No Q1 de Mônaco com 21 robôs, as saídas ficam em 0, 5, 10… 40 s.
- `duracaoDaClassificacao`: em vez da saída de um por segundo, soma `QUALI_SAIDA_TOTAL_S = 45`. Na simulação, o Q1 de Mônaco dura 248 s.

## O tempo estimado quando a sessão fecha antes ("Pronto")
- `corrida-f1-classificacao.js completarRobos`, chamada em `fechar`: o robô que ainda não fez a volta lançada (menos de 2 voltas) fica com o melhor entre o que já fez e a volta estimada (`voltaLancada`).
- A conta e a volta pilotada não batem igual em toda pista. Medido com 21 robôs, a mediana da razão pilotada/estimada:

  | Pista | Mediana | Faixa |
  |---|---|---|
  | Mônaco | 1,019 | 0,992 a 1,047 |
  | Interlagos | 0,978 | 0,939 a 1,011 |

  Por isso, a estimativa é multiplicada pela mediana dos robôs que já fizeram a lançada nesta sessão, ou da sessão anterior (`room.razaoQuali`, zerada a cada classificação). Sem nenhum, fica a conta pura.
- Simulado o Q1 de Mônaco fechando cedo (`klk/medir/quali-pronto.js`):

  | Fechou em | Robôs com tempo | Estimados | Pole |
  |---|---|---|---|
  | 70 s | 21 de 21 | 21 (sem razão: a conta pura) | 48,633 |
  | 110 s | 21 de 21 | 12 | 49,600 |
  | 150 s | 21 de 21 | 0 | 49,600 |

## Fantasmas de verdade
- Na fase `quali`, o `transito` dos robôs não vê ninguém, e a batida (`Contato.depoisDoPasso`) fica desligada. Antes, eles ainda desviavam e freavam atrás uns dos outros.

## A tela entre as sessões
- `pos-quali.js sessaoHTML`: depois do Q1 e do Q2, o mesmo estilo do QUALIFYING:
  - a sessão inteira, com quem caiu apagado e a linha vermelha do CORTE;
  - o cartão do mais rápido da sessão e "Sua sessão" embaixo;
  - no rodapé: "Ajustes do carro" e "Largar para o Q2/Q3".
- Os ajustes continuam na tela de antes. CSS no fim de `pos-corrida.css`.

Não foi jogado. Conferido com `node --check`.
