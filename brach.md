# Tiro: mais armas no BR (várias por construção grande) e vegetação e covers no Danger Zone

Pedido do Thiago: "no Danger Zone construções grandes devem ter mais de uma arma dentro. Inclusive eu coloquei algumas construções do aeroporto... é um mapa bem completo. Espalhe mais armas nele e alguns elementos... como vegetação, covers etc."

**Armas por construção** (`ferramentas/tiro-br.js`: `brLootGrupos`, `brLoot`; vale para os dois mapas do BR):
- antes eram até 30 armas no mapa, cada uma a 6 m das outras, então um galpão grande ficava com uma só;
- agora os pontos de dentro (com teto e paredes, ou em laje) se juntam por construção: os vizinhos no mesmo piso são o mesmo cômodo, galpão ou laje;
- cada construção ganha **uma arma a cada 35 m² de piso**, de 1 a 6, nos pontos mais afastados entre si, com o máximo de 110 no mapa. Por exemplo, uma casa pequena fica com 1 e um mercado ou terminal com várias;
- as dos módulos continuam (uma no meio de cada um) e não se repetem no mesmo módulo;
- as granadas e peças de arma, que ficam ao lado da metade dos lugares das armas, também aumentam;
- o limite de armas no chão subiu para 260.

**Danger Zone** (`ferramentas/tiro-mapas/editor/danger-zone.json`): 125 peças novas, em lugares livres, longe das construções e dos nascimentos, e em chão plano, no piso do relevo:
- **70 de vegetação:** arbustos, bananeiras, árvores de canteiro e de praça, árvores de pomar;
- **55 covers:** sacos de areia (altos e baixos), sacos de cimento, barreiras jersey e de água, tambores, muros quebrados, paletes, pneus e manilhas.

As peças novas aparecem no editor como as outras e dá para mover ou apagar qualquer uma.

Conferido só com `node --check` (o arquivo e o script do jogo montado); não joguei.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
