# Tiro: Favela Grande bem maior, com peças de outros mapas e parede alta na beira

Pedido do Thiago: "cresce mais ainda o favela... usa assets de outros mapas e afins". E o cuidado: tirar as paredes invisíveis da Favela e pôr uma nova na beira do mapa, "absurdamente alta", bem na beira do abismo.

**Tamanho:** de 196 x 116 m de chão para **272 x 212 m**, tudo jogável (uns 2,5 vezes a versão anterior e uns 11 vezes a Favela).

**O que entrou** (o sul é feito no gerador e espelhado no norte, como na Favela):
- **Ferro-velho** (oeste, x -136 a -96): dois vagões e um ônibus queimado (peças dos mapas de neve e de deserto do jogo), contêineres, carcaças de carro, manilhas, pneus, vigas, caçamba, guarita e engradados;
- **Rodoviária** (leste, x 96 a 136): **galpão coberto** de 28 x 22 m com bancos, guichê e painel de horários (peças do aeroporto). O teto, a 5 m, é laje, com **escada** pelo lado leste. Na frente, ônibus e van parados, pontos de ônibus, banca e orelhão;
- **avenida** de ponta a ponta (z 44 a 56), com postes, carros e pontos de ônibus;
- **Morro** (z 56 a 106, ao sul e ao norte): **três fileiras de prédios e casas de favela** com vielas entre elas e 6 vielas atravessando. Entre eles, prédios com escada até a laje (escada pelo lado, pelos fundos, até o telhado). No alto, uma **feira** de barracas, uma **praça** com fonte, quiosque de açaí, churrasquinho, dominó e parquinho;
- o Campinho, o Comércio e a Favela continuam como estavam.

**Paredes:**
- saem **todas as paredes invisíveis de dentro**, inclusive as da Favela (as dos lados e as do fundo das bases) e as do Campinho e do Comércio, junto com as casas de cenário de fora do limite;
- a única parede invisível agora é a da **beira do chão**, com **600 m de altura** (nem planando de paraquedas dá para passar), bem na beira do abismo (os 20 cm finais do chão).

**Pontos de passagem:** uma grade de 8 m em todo o mapa fora da Favela, sem os pontos que caem dentro de um prédio: 603 novos (778 no total). Servem para os robôs andarem e para as caixas de colete e cura. As armas usam a malha dos robôs dentro das construções e nas lajes, e o galpão e os prédios com escada dão muitos lugares assim.

**Conferido:** o gerador confere sozinho que nenhum prédio ou veículo novo encosta em outro (0) nem passa da beira (0), pelo tamanho de cada peça escrito no kit, e o script do jogo montado passa no `node --check`. Não joguei nem vi o mapa. São 553 prefabs (antes uns 250), então vale olhar o desempenho no tablet.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
