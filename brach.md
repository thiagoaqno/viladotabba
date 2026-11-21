# Apaga o teste que fixava a montagem antiga dos rivais

`tests/corrida-temporada.test.js`: "equipes rivais desenvolvem os dois carros ao longo da temporada" esperava o carro montado a partir do padrão da equipe; desde #881 os rivais montam do zero pelo que rende. Quebrava o CI da `main` desde #881.
