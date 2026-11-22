# Classificação com os cortes da F1 de 2026

Pedido do Thiago (2026-11-21): "precisa revisar quem sai no Q1, Q2 e Q3, pra ficar igual na F1. No Q1 passam 16!"

- `f1-regras.js sessoesDeClassificacao`: com 21 ou 22 carros (o grid de 2026), os cortes são 16 e 10: o Q1 elimina 6, o Q2 mais 6 e o Q3 tem os 10. Antes eram 15 e 10 sempre, a regra dos 20 carros.
- Com 20 carros (2023 a 2025) e grids menores, nada muda: [20, 15, 10], [16, 15, 10], [12, 10], [8], os mesmos do teste `corrida-f1-fim-de-semana`.
- O resto da classificação (os eliminados no log, a torre, as sessões) já lê esses números.
