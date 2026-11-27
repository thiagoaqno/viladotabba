# Tiro: modo tablet liga mesmo com a resolução dinâmica desligada

O relatório do Mi Pad mostrou `hf 1` na partida inteira: o modo tablet (#1060) não ligou. Ele dependia da taxa da tela (`HR.ms`), que só era medida no `hrAlvo`, e o `hrAlvo` só roda com a "Resolução dinâmica" ligada. O amigo jogava com ela desligada.

Agora o `tabLeve` mede a taxa sozinho, então o modo tablet liga em qualquer configuração.

O mesmo relatório confirma o diagnóstico: o processador gasta uns 7 ms por quadro (render 4,3 e bots 1,2), quase no limite de 8,3 ms dos 120 fps. Metade dos quadros sai a 120 e a outra metade a 60 (54% em 8,4 ms e 42% em 16,6 ms). Com o modo tablet ligado, os bots pensam a cada dois quadros e menos coisa é desenhada ao longe.

Conferido no navegador: a taxa da tela é medida com a resolução dinâmica desligada. Falta jogar no Mi Pad.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
