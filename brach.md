# Tiro: peças rurais para o editor de mapas

O catálogo ganha o grupo Rural com 16 peças: casas, celeiro com mezanino, cercas e curral, fardos, torre d'água, galinheiro, poço, carroça, trator, milho, estrada e árvore de pomar. As posições locais sugeridas para armas ficam em `KC_BR`; elas não alteram mapas nem criam armas automaticamente. A seção Zona rural do guia descreve as peças e as medidas.

As escadas do celeiro e da torre usam `KC_ESCADAS`; gire essas peças apenas de 90 em 90 graus. O curral é descoberto e não oferece ponto coberto para armas. O milho e a estrada não colidem.

Validação até aqui: `node --check` em `pecas.js` e `editor.js`; o editor exibiu as 16 peças no grupo Rural e foi possível colocar o celeiro e iniciar uma partida. A tentativa de andar na partida ficou presa na captura do mouse do navegador. **Rascunho: ainda falta validar a circulação, escadas e colisões de todas as peças jogando.**
