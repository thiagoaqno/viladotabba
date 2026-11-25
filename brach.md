# Torre: o intervalo é para o carro da frente

O Thiago pediu que a torre mostrasse o tempo para o carro da frente, e não o de todos para o líder. O título já dizia "Interval".

- **`hud-torre.js` (`torre`):** cada linha agora compara com o carro logo à frente na torre:
  - a distância e o tempo medido pela cronometragem;
  - as voltas de atraso;
  - depois da bandeirada, a diferença real de chegada.
- **O líder:** continua com "Leader".
- **Sem dado do carro da frente** (sem notícia dele): cai para o líder, como antes.
- **Os testes da torre e da cronometragem:** continuam valendo, porque olham o 2º colocado, cujo intervalo para o da frente é o mesmo que para o líder.
