# Tiro da Galera: editor de superfícies e mais peças no editor de mapas

O Thiago pediu mais assets e um editor de textura de superfície.

**Superfícies.** As caixas e escadas do editor escolhem a superfície numa galeria com miniaturas (52 opções, em grupos: Parede,
Chão, Madeira, Metal, Outros), e a cena do editor já mostra a textura, no tamanho certo em metros. O campo novo "Tamanho da
textura" (`tx` no `.json`) aumenta ou diminui o desenho.
- 17 fotos que o jogo tinha e os mapas do editor não usavam viram superfícies: ferrugem, grama, ardósia, rocha, laje de pedra,
  tábuas, seixos, cascalho, adobe, taipa, neve e outras.
- 4 texturas novas, desenhadas por shader: chapa xadrez, faixa de perigo, azulejo e piso xadrez.
- Cada mapa do editor carrega só as fotos que usa. Nos mapas do jogo nada muda.
- Código em `ferramentas/tiro-editor/texturas.js`.

**Peças.** Mais 11 prefabs (cidade e fábrica): ponto de ônibus, banca, carro queimado, cavalete de obra, entulho, manilhas,
prateleira de galpão, tambores, vigas de aço, alambrado e armário elétrico. Agora são 24 peças `kc`.

O guia `docs/tiro-editor-de-mapas.md` ganhou a lista das superfícies e a tabela das peças novas.

Conferido no navegador: as 24 peças montam, as 52 miniaturas carregam e um mapa com tijolo, ferrugem, grama, chapa, faixa,
azulejo e xadrez montou no Jogar com as texturas certas e sem erro no console.
