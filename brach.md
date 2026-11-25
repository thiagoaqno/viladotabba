# Torre: só os avisos que importam e o card de distância do seu carro

O Thiago: na torre apareciam muitos avisos sem sentido (o "entrou no quadro de recordes", que parecia "pódio", box, DRS, largada...) e o card de distância só mostrava o 2º para o 1º, uma vez por corrida.

## Avisos da torre

- A fila dos cards da torre (`criarFila` em `avisos-f1.js`, opção nova `tipos`) só aceita `NA_TORRE`: **volta mais rápida** da corrida, **bandeira amarela**, **bandeira verde**, **punição** e o card de distância. Todo o resto (recorde da pista, box, DRS, luzes da largada, bandeirada, limites da pista, bandeira azul, investigação, abandono...) não entra mais na torre.
- A volta mais rápida é só a daquela corrida (a sua, quando você baixa o melhor tempo da corrida): o "recorde" do log do servidor (o da pista, de sempre) não vira mais card, nem pelo log (`deLinha`) nem pelo toast (`E.avisarF1`).
- O rádio e o narrador continuam falando o que já falavam; só a torre ficou mais limpa.

## Card de distância (gap)

- O card "Battle for first" virou o card de distância do **seu** carro (`gapF1` em `hud.js`, no lugar de `batalhaF1`), em qualquer posição: a diferença para o carro da frente, ou para o de trás quando você lidera, com posição, sigla e equipe dos dois e o número ao vivo.
- Aparece **3 vezes por corrida**, quando você completa 1/4, 2/4 e 3/4 das voltas (em corrida curta, as voltas repetidas viram uma só), e fica 6 s na tela.
- Não aparece na classificação, depois da sua chegada nem com o carro fora da corrida.

Conferido com `node --check` em `hud.js` e `avisos-f1.js`; o Thiago testa jogando.
