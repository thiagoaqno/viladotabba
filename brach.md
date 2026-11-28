# Tiro: Favela Grande com zona rural, centro comercial e bairro novo (peças do Codex)

Com as 37 peças novas do Codex (#1079), a Favela Grande cresce de 272 x 212 m para **480 x 212 m** de chão. A parede de 600 m vai para a nova beira, bem na beira do abismo. O sul é feito no gerador e espelhado no norte, como o resto.

**Zona rural** (oeste, x -232 a -136, depois do Ferro-velho):
- estrada de terra N-S colada ao Ferro-velho e uma E-W cortando a zona;
- **estação de trem** no meio (plataforma coberta, bilheteria, trilhos e passarela);
- sítio com **casa sede** e **cerca com porteira**, poço, carroça, **celeiro com mezanino**, **torre d'água** (ponto alto), galinheiro, duas **casas de pau a pique**, **curral**, trator, fardos;
- **milharal** de 24 x 24 m e **pomar** com 18 árvores.

**Centro comercial** (leste, x 136 a 248, perto da avenida):
- **passarela** sobre a avenida;
- **galeria** de 2 andares, **supermercado** e **posto de gasolina** na frente;
- banco, farmácia, lanchonete, loja de roupas e **estacionamento** atrás;
- carros e postes na avenida, ponto de ônibus.

**Bairro novo** (mais para o alto, a leste):
- **prédio comercial de 4 andares** com escada até a laje;
- **escola** com quadra coberta, **igreja** com torre, **posto de saúde**, **condomínio** com guarita e **lava-rápido**;
- praça com banco, lixeira e árvore.

**Battle royale:** os pontos `KC_BR` de cada peça do Codex são lidos direto do `pecas.js` e viram marcadores. Agora são **119 armas** (46 em lajes e mezaninos), **30 coletes** e **59 curas**, para até 20 jogadores. A grade de pontos de passagem cobre o mapa inteiro (1.115 pontos novos).

**Conferido:** o gerador confere sozinho que nenhuma peça encosta em outra (0) nem passa da beira (0), pelos tamanhos do guia, e o script do jogo montado passa no `node --check`. Não joguei nem vi o mapa. São uns 760 prefabs; vale ver o desempenho.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
