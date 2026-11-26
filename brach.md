# Tiro da Galera: módulos de arquitetura para o navio

O editor ganha módulos de salas, varandas, deques, escadas, cabines, corredor, garagem e fechamentos para construir um iate de vários níveis. As salas envidraçadas e a parede com janela usam painéis destrutíveis; as escadas de acesso registram rampas para o jogo, e as bordas abertas relevantes têm proteção invisível.

O convés do `kcNavio` original é maciço. Para permitir uma descida real sem alterar mapas existentes, `kcNavioComAbertura` fornece um vão central de 2,6 x 6 m e uma abertura inferior na popa. O patamar da escada interna avança além do vão para manter a inclinação e a passagem exigidas. A documentação explica o posicionamento e as dimensões.

Validação: `node --check` nos arquivos de editor alterados e remontagem de `public/tiro/index.html` com `tiro-frontline.js`. Aparência, vidros, encaixes e navegação dos bots ainda precisam ser conferidos no jogo. Os arquivos de mapas JSON não foram modificados.
