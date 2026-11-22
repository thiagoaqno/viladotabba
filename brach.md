# Na carreira, cada robô também tem o plano do domingo

Pedido do Thiago (2026-11-21): "cada bot deve escolher uma estratégia também, assim fica justo pra todo mundo".

- `corrida-robos.js largar`: na carreira (`room.temporada`), cada robô sorteia o plano dele pela semente do GP (`planoDoRobo`): normal 35%; ataque, seguro, largada forte e guardar para o fim, 14% cada; esticar os pneus, 9%. Os efeitos são os mesmos de quem joga (`f1-regras.js PLANOS_DOMINGO`, já com um quarto do efeito de antes, #887), pelo `sim.js` (só na corrida) e pelo dano das batidas (`corrida-f1-direcao.js`).
- A estratégia de box do robô conta o pneu do plano: o `fator` de `F1.estrategia` e o das decisões no box (`decidirParada`) multiplicam `F1.desgasteDoPlano`.
- Fora da carreira (as corridas rápidas e as salas), nada muda.
- Conferido o sorteio em 10 sementes × 21 robôs. Não foi jogado.
