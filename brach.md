# Tiro: 120 fps estável no tablet (sem ficar trocando com 60)

No Mi Pad, pelo Chrome: "fica 60 e depois fica 120".

**Por quê:** a meta de 120 fps (#1051) baixava a resolução até chegar lá, mas:
1. cada abertura do jogo começava da resolução cheia, a 60 fps, até ela descer de novo;
2. depois de 2 s estáveis a 120 ela tentava subir a resolução, caía para 60 e descia outra vez.

**O que mudou** (em `ferramentas/tiro-frontline.js`, só nos aparelhos de toque com tela rápida):
- A resolução que segurou os 120 fica guardada no aparelho (`tiro_hr_escala`) e já vale na próxima abertura.
- Para tentar subir a resolução, agora precisa de 6 s seguidos a 120. Cada tentativa que falha dobra a espera, como antes.
- Se o aparelho não chega nos 120 nem com a resolução no mínimo, nada fica guardado e ele volta a mirar 60, como antes.

Conferido só com `node --check`; falta o amigo jogar no tablet.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
