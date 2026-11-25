`# Capacetes dos 22 pilotos: desenho, logo da equipe e patrocínios de cada um
`
`O Thiago achou os padrões do editor de capacete "BEM diferentes" dos capacetes da folha de pixel art: só as cores tinham sido copiadas, e alguns têm logo da equipe e pintura únicos.
`
`## Os desenhos (`f1-capacetes-estilos.js`, `ESTILOS_PILOTOS`)
`
`Cada piloto do grid ganhou um desenho próprio (`p_NOR`, `p_LEC`…), pela folha de pixel art.
`
`- **As formas** seguem o jeito da equipe:
`  - McLaren: a coroa escura com cortes e a fita escura pelos lados;
`  - Ferrari: os blocos brancos do Leclerc, os cortes em vermelho escuro do Hamilton;
`  - Mercedes: a coroa descendo em ponta até a testa;
`  - Red Bull e Racing Bulls: a coroa, o queixo e as faixas diagonais;
`  - Aston Martin: a onda de baixo;
`  - Williams: as setas;
`  - Sauber/Audi: as fitas verdes;
`  - Alpine: os cortes rosa ou azul-claro;
`  - Haas: os cortes vermelhos;
`  - Cadillac: os cortes dourados ou brancos.
`- **As cores** são as do piloto, e o companheiro de equipe tem uma variação.
`- **As marcas fixas de cada um:**
`  - o logo da equipe na testa: a imagem do logo (Ferrari, McLaren, Aston, Racing Bulls) ou a marca (a estrela, o touro, o W, o K, o Alpine, o Haas, o brasão da Cadillac);
`  - o nome na faixa acima do visor e na nuca (PETRONAS, WILLIAMS, ALPINE…);
`  - os patrocínios nos lados e na nuca (Shell, HP, Oracle, Aramco, Visa, MoneyGram…).
`
`## Onde valem
`
`- **Na pintura (`pintarFolha`, `f1-capacetes.js`):** as marcas fixas entram quando o capacete não traz as suas. Para pôr o logo da equipe, entrou o `logoDaEquipe`, uma imagem que chega depois e repinta.
`- **No editor (`f1-capacetes-padroes.js`, `capacete-editor-ui.js`):** os 22 padrões usam esses desenhos. Escolher um padrão limpa os patrocínios e o nome, e aí entram os do piloto. Depois dá para mexer à vontade.
`- **Na pista (`capacetePorSigla`):** os robôs usam o capacete desenhado quando o piloto está na equipe de 2026. Numa temporada antiga, fica o de antes.
`- **Marcas novas:** \`MARCAS_CAPACETE\` ganhou Red Bull, Oracle, Mobil 1, CrowdStrike, Alpine, Haas, Visa e Valvoline. Os logos já existiam no projeto.
`- **No servidor:** \`limparCapacete\` (\`corrida-base.js\`) aceita os desenhos \`p_XXX\`.
`
`## Conserto
`
`As marcas fixas no capacete de um robô, que não tem \`extra\`, quebravam em \`extra.fundoPatrocinio\`. Agora elas vão direto no casco.
`
`## Conferido
`
`- Desenhei as 22 folhas planas: todas saem com o desenho, o logo, o nome e os patrocínios, e a página do jogo não teve erros.
`- No editor, o padrão aplica e guarda.
`- A prévia 3D apareceu com a pintura, mas o print pelo SwiftShader trava, então não conferi os 22 em 3D.
