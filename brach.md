# Tiro da Galera: ônibus, caminhão e carros do jogo com colisão nos mapas do editor

Os prefabs de veículo do jogo original (`busWreck`, `truck`, `car`, `boxcar` e `snowplow`) não trazem colisão na peça: nos mapas deles, ela é posta à parte. Nos mapas do editor, dava para atravessar o ônibus.

Agora o `mapa-json.js` dá a cada um deles uma caixa de colisão do tamanho da malha, girada e na escala da peça. A caixa segura gente e bala (`ED_COL_AUTO`; para pôr outro prefab sem colisão, é só acrescentar o nome).

Conferido no navegador, na Favela: o ônibus do planalto, o carro e o caminhão ganharam colisão.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
