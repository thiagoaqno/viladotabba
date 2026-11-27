# Tiro: mapa Favela Grande (para o Battle royale)

Mapa novo do editor, feito juntando a **Favela** com dois bairros novos dos lados, com as peças do mesmo kit. O Aeroporto e a Maré Alta ficaram de fora, como pedido. Os mapas originais do jogo (Sable, Simoun etc.) não dá para emendar, porque cada um é montado por código, com céu, luz e caminhos dos robôs próprios. O Battle royale continua funcionando em todos eles.

**O mapa** (180 x 88 m jogáveis, uns 3 vezes a Favela):
- **no meio, a Favela de hoje inteira** (o que estiver no `favela.json`, inclusive o que foi mexido pelo editor), sem as paredes invisíveis dos lados;
- **uma rua de divisa de cada lado**, que liga a Favela aos bairros em todo o comprimento;
- **a oeste, o Campinho**: campo de futebol de terra no meio, arquibancadas, parquinho, uma rua com carro e moto, e duas fileiras de casas e prédios de favela de cada lado, com vielas entre elas e quintais nos fundos;
- **a leste, o Comércio**: fonte, quiosque de açaí, churrasquinho, pipoca e mesa de dominó perto da divisa, a quadra de futsal no meio, fliperama e mototáxi no fim, uma rua com van e carros, lojas e prédios, e casas atrás;
- casas fora do limite fechando a vista, como na Favela.

Mais 129 pontos de passagem nos bairros (ruas, vielas, fundos, campo e quadra), que servem para os robôs andarem e para espalhar as armas e as caixas do Battle royale.

**Como foi feito:** `ferramentas/tiro-mapas/favela-grande-gerar.js` lê o `favela.json` e grava o `favela-grande.json`, que entra no jogo como os outros mapas do editor. Conferi por script que nenhuma casa nova encosta em outra (pelo tamanho de cada prefab escrito no kit). Depois de mexer na Favela Grande pelo editor, não rode o gerador de novo, porque ele sobrescreve.

Montado de novo em cima da main depois do #1069 (robôs esperando no ar).

Conferido só com `node --check` (o gerador e o script do jogo montado); não joguei nem vi o mapa.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
