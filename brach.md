# Tiro: bots sobem e descem escada atrás do inimigo

"Os bots não sobem muito as escadas."

**Por quê:** quando o bot ia atrás de um inimigo, ele mirava o x/z do inimigo, mas na altura dele mesmo. Isso valia para a vingança de quem o matou, o aviso de um colega ("tem um ali") e o radar. Quem estava no chão e caçava alguém numa laje ganhava um destino no chão, embaixo da laje, e nunca pegava a escada. Quem estava no alto nunca descia.

**O que mudou** (em `ferramentas/tiro-frontline.js`): a vingança, o aviso e o radar guardam a altura do inimigo, e o destino do bot usa essa altura.

**Medido no Aeroporto** (12 bots, mata-mata):
- **Antes:** o Alfa passava 100% do tempo no terminal e o Bravo só 4% no alto. Nenhum dos dois trocava de andar.
- **Agora:** o Alfa desce (57% do tempo no alto), e o Bravo vai pela rampa atrás deles; a briga acontece no meio.
- **Favela:** os bots já passavam 41% do tempo nas lajes, e chegaram a 21 dos 23 destinos no alto.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
