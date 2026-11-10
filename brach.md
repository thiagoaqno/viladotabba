# Capa na tela inicial e capas na tela de carregamento

As imagens que o Thiago fez com o ChatGPT viram as capas do jogo, convertidas de PNG (cerca de 2 MB cada) para JPG (de 213 a 262 KB).

- **Tela inicial da Corrida** (`menu.css`, `menu.js`): a capa (`capa-inicio.jpg`: os três pilotos em Mônaco) fica atrás do menu. A garagem 3D, com o carro girando, só abre com o painel **Garagem** e é desligada quando ele fecha; a capa volta. A tela inicial fica mais leve, porque a placa de vídeo não desenha mais o carro o tempo todo, e o carregamento some assim que o menu aparece, sem esperar o carro 3D.
- **Tela de carregamento** (`index.html`): sorteia uma de três capas (`carregamento-kimi.jpg`, `carregamento-verts.jpg`, `carregamento-hamil.jpg`), com o mesmo escurecido à esquerda para o texto aparecer.

A `capa-carregamento.png` antiga continua no repositório: a vitrine da carreira (`temporada/vitrine.css`) ainda usa ela.

Conferido com `node --check`; o Thiago testa jogando.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
