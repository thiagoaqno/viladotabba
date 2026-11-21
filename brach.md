# O Jeff responde "qual a estratégia?"

Pedido do Thiago (2026-11-21): "pergunta e resposta de: qual a estratégia? e o Jeff poder responder".

- `jeff-comandos.js`: o tipo novo `estrategia`, para "qual a estratégia", "qual o plano", "quando eu paro", "quantas paradas faltam". Vem antes do box, então "quando eu paro" não pede o box. Conferido: "box box", "colocar macio", "quem está na frente" e "como estão meus pneus" seguem como antes.
- `mfd.js executarJeff`:
  - **Com o plano de paradas da equipe** (`m.paradasEquipe`, de #875), o Jeff diz a próxima parada, as seguintes, a vida do pneu de agora e o plano do domingo (nos de duas fases, a volta em que ele vira).
  - **Sem plano**, ele diz que a decisão é sua e lê os pneus.
  - O rádio emenda os pedaços: "a próxima parada do plano é na" + "volta N" + o pneu, ou o fim do plano, ou sem plano.
- `radio/falas.js`: 6 pedaços novos. O `Falas novas da Corrida.bat` gera eles junto com os 12 dos planos de #875 (18 falas, 973 caracteres).
