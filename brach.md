# Tiro da Galera: base do mapa Navio no editor

- **Peça kcNavio:** casco de iate de 106 x 20,4 m (o mesmo desenho do Iate), com convés andável em y = 0, borda falsa sólida de 1,05 m e parede invisível em cima até 4,5 m, seguindo a curva do casco. A linha d'água fica em -4,3.
- **Mapa navio.json:** a base para montar no editor, com o mar, o navio, 11 pontos de nascer na proa (o Bravo na popa) e dominação e mecha no eixo do navio.
- **Paredes invisíveis de prefab (KC_INVIS[nome]):** viram glassWall no mapa, giradas com a peça.
- **Limite dos mapas do editor:** agora usa o tamanho de verdade de cada prefab, medido só quando o mapa começa. Antes, cada prefab contava ±1 m, e as pontas do navio ficavam fora da área dos bots.

Conferido no navegador: o mapa abre no Jogar com bots, e há caminho da proa (z 44) até a popa (z -50).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
