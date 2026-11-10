# Som do rádio antes de falar e som do ERS ligando

Os dois sons são sintetizados no navegador (Web Audio), como o motor. Se aparecer o arquivo de verdade, ele toca no lugar, sem mexer no código.

- **Rádio da equipe** (`radio.js`): antes da voz do engenheiro, o chiado de abrir o canal e dois bipes subindo (1 150 e 1 550 Hz, onda quadrada abafada como o rádio); no fim, depois do clique de fechar, um bipe mais grave. A voz entra depois da abertura. Arquivo de verdade: `public/corrida/radio/bip.mp3` (toca no lugar da abertura sintetizada).
- **ERS ligando** (`sons.js`, `jogo.js`): ao apertar a tecla do ERS (E) com a bateria entregando, uma subida elétrica (220 a 1 900 Hz em 0,32 s), um estalo agudo no começo e um sininho no fim. Só no aperto do piloto, não no automático (que liga e desliga sozinho), e no máximo um a cada 1,5 s. Arquivo de verdade: `public/corrida/sons/ers-liga-1.mp3`, com `"ers-liga": 1` em `sons/indice.json`.

Conferido com `node --check`; o Thiago testa jogando.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
