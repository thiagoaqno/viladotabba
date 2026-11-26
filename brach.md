# Tiro da Galera: peças de iate para o editor de mapas

O editor ganha peças para montar um navio de luxo: salão e ponte envidraçados, cassino, escada externa com patamar, piscina e mobiliário de convés, heliponto, lanchas, equipamentos e detalhes náuticos. Os prédios têm portas de 2,4 m e laje andável; a escada registra a rampa usada por jogadores e bots.

Os vidros do salão e da ponte aparecem na prévia e são montados como painéis destrutíveis no jogo. A documentação reúne as medidas e orienta o uso da escada e do corrimão com parede invisível. Os mapas Navio e Favela não foram alterados.

Validação: `node --check` nos três arquivos alterados do editor e remontagem de `public/tiro/index.html` com `tiro-frontline.js`. A aparência, os vidros e a navegação dos bots ainda precisam ser conferidos no jogo.
