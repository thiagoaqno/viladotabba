# Muros do editor sem o carro preso e teleportando (Mônaco)

O Thiago (2026-11-22): "toda vez que bate numa parede em Mônaco meu carro fica travado e teletransportando... quando derrapei na chuva e bati isso aconteceu".

- A batida nos muros do editor (`murosDoCenario`, `colisao: "pecas"`) é uma distância do muro em cada ponto da pista, de cada lado. Quem passa dela é empurrado de volta até ela, de uma vez (`sim.js`, e igual na previsão do navegador, `fisica.js`).
- Em Mônaco, onde uma barreira começa ou muda de distância, essa distância caía até 48 u de um ponto para o vizinho (~6 u). Foram 12 lugares, medidos com `criarPista("monaco")`. O carro encostado ali era jogado para dentro da pista num passo: o teleporte, e preso quando ia e voltava.
- `pistas.js suavizarMuros`: entre dois pontos com muro, ele chega no máximo 6 u mais perto por ponto (`MURO_RAMPA`). Perto da emenda o muro fica um pouco mais longe, nunca mais perto: sem muro invisível. Onde não há muro, nada muda. Medido de novo: nenhum salto acima de 6 u nos dois lados.
- `sim.js` e `fisica.js`: o empurrão de volta é de no máximo 10 u por passo (`EMPURRAO_MURO`, o mesmo nos dois lados). Um caso estranho, como o carro rodando perto de outro trecho da pista, vira um deslize rápido, não um salto.
- Não foi jogado. No programa de PC, vale ao reabrir (é servidor).
