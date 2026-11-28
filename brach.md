# Tiro: Battle royale com 150 de vida e colete em placas (300 no total, como no Warzone)

Pedido do Thiago: no BR, mais vida e escudo que no multijogador, para não morrer na hora depois de passar um tempão juntando coisas no mapa (mais tempo para matar).

**Vida de 150:** a vida do jogo continua de 0 a 100 por dentro (regeneração, cura, HUD), e o dano de tiro, granada, faca e zona que chega nela é multiplicado por 2/3. O número da vida no HUD mostra de 0 a 150. Só no battle royale; nos outros modos nada muda.

**Colete em placas:** cada caixa azul é **uma placa de 50**, até **3 placas (150)**. O colete agora segura **o dano inteiro** até acabar (antes segurava 60%, até 100), e só depois a vida começa a cair. A zona passa direto por ele. A barra azul vai de 0 a 150, e ao pegar uma caixa aparece "Colete: N de 3 placas".

**No total: 150 de vida + 150 de placas = 300**, em dano das armas (as mesmas de sempre). A cura continua dando +50 por dentro, o que aparece como "+75 de vida".

Arquivos: `ferramentas/tiro-br.js` (`BR_VIDA_K`, placas, dano e zona) e `ferramentas/tiro-frontline.js` (o número da vida no HUD).

Conferido só com `node --check` (os arquivos e o script do jogo montado); não joguei.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

**Faca:** a facada passa pelas placas e pela vida de 150, e mata direto como nos outros modos.
