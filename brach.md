# Robôs sem as travadinhas (servidor)

`pontoDoCarro` (corrida.js), chamado pela gravação do replay para cada carro a cada 250 ms, fazia `T.pontos(t, 6)` (o traçado inteiro) só para saber quantos pontos a pista tem. Agora usa o `pontosPorVolta`, que já guardava esse número; o `corredorDe` também.

Medido com o servidor de verdade (`node server.js`, Mônaco, 21 robôs, 90 s, no modo do programa de PC com `CORRIDA_SITE`):

| | antes | depois |
|---|---|---|
| laço da direção de prova (100 ms) | 55 a 70 ms por volta, quase tudo na gravação | < 1 ms |
| atraso do laço do servidor, p99 | 93 ms | 21 ms |
| intervalo entre pacotes de posição, p99 | 120 ms | 34 ms |
| intervalos acima de 80 ms | 303 | 3 (no carregamento) |
| pacotes em 90 s | 3538 | 5109 |

O `servidor.log` do programa no PC do Thiago (19/nov, Mônaco) também mostrava o laço atrasando ~90 ms todo minuto durante a corrida.
