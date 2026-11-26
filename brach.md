# Tiro: 120 fps andando nos tablets de tela rápida

No Mi Pad (tela de 120 Hz), parado dava 120 fps e andando cravava em 60.

**Por quê:** andando, as três camadas da sombra do sol se redesenham todo quadro (parado, só a de perto). O quadro passa de 8,3 ms e a tela cai para a metade, 60. A qualidade automática mirava 60 fps, então achava 60 ótimo e não mexia em nada.

**O que mudou** (em `ferramentas/tiro-frontline.js`, aplicado em `public/tiro/index.html`):
- Nos aparelhos de toque com tela rápida (90 Hz ou mais), a qualidade automática mira a taxa da tela. Ela baixa a resolução até 70% do degrau atual para segurar os 120; se nem assim chegar, desiste e volta a mirar 60 (sem baixar o degrau de qualidade por isso). Quem escolheu um limite de fps em Opções continua com o limite.
- Em tela rápida, as duas camadas de sombra de longe se revezam quando a câmera mexe: no máximo duas sombras por quadro em vez de três (em 120 Hz, a de longe atualiza a 60 por segundo, como antes nas telas de 60).
- PC e telas de 60 Hz ficam iguais.

Conferido só com `node --check`; falta jogar no tablet.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
