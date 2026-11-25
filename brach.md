# Clima: a pista seca na metade do tempo depois da chuva

O Thiago achou que a pista demorava demais para secar depois da chuva.

- **`AGUA_SECA_S` (`f1-regras.js`):** é o tempo para uma pista encharcada secar de vez, sem chuva. Passou de 240 s (4 minutos de corrida) para 120 s.
- **A conta (`aguaEm`):** continua a mesma, uma queda de 1/`AGUA_SECA_S` por segundo. Agora uma pista encharcada (água 1) chega a "molhada" (0,15) em uns 102 s, contra uns 204 s antes, e a seca em 120 s.
- **Onde vale:** o servidor, o navegador, os robôs, o visual da água e o rádio leem a mesma conta, então tudo seca junto.
- **O teste de clima:** usa a própria constante e continua valendo.
