# Tiro: modo tablet fica ligado depois que a resolução desiste

Relatório novo do Mi Pad (resolução dinâmica ligada):

- **Com o modo tablet (`hf` 2):** nos primeiros 11 s, os bots caíram para 0,4 ms e o jogo ficou entre 102 e 106 fps. Na partida toda, 72,6% dos quadros saíram a 120 (antes, 54%), e a média subiu de 79 para 92 fps.
- **O que desligava o modo:** aos 12 s a resolução dinâmica já tinha descido a 70%. Isso não ajuda quando o gargalo é o processador. Ela desistiu dos 120 (`HR.off`), e o `tabLeve` desligava junto: o `hf` voltava a 1 e os bots, a 1,3 a 2,8 ms.

Agora o modo tablet só depende de a tela ser rápida. A desistência da resolução não mexe mais nele.

Conferido com `node --check`; falta jogar no tablet.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
