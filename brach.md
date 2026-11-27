# Tiro: a zona do Battle royale no minimapa

No Battle royale, o minimapa agora mostra a zona:
- **fora da zona** o minimapa fica escurecido em azul, e a **borda atual** é uma linha azul cheia;
- a **próxima zona** (para onde ela vai fechar) é um círculo branco tracejado; some quando a zona está fechando até ela;
- se você está **fora**, um tracejado azul liga você ao ponto mais perto da borda (o caminho mais curto para voltar).

Feito em `ferramentas/tiro-br.js`, por cima do `domMinimap` do jogo (desenha depois do plano do mapa, antes dos jogadores). Nos outros modos nada muda.

Conferido só com `node --check` (o arquivo e o script do jogo montado); não joguei.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
