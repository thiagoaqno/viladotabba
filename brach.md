# Tiro: selo do ranque no placar e bônus +1/+2 pelo desempenho

**Selo do ranque no placar:**
- Ao lado do nome de cada jogador, no placar da partida (Tab) e no do fim, aparece o hexágono na cor do ranque com o número da divisão. Passando o mouse, mostra o ranque inteiro ("Ouro 2").
- Só no online e só para gente; bot não tem selo.
- O selo dos outros vem do servidor pelo nome do jogo (`GET /tiro/perfil/elo/nomes`), numa pergunta só para todo o placar.
- Quem ainda não jogou valendo elo fica sem selo.

**Bônus pelo desempenho individual:**
- **+2** para o melhor da partida inteira (o MVP).
- **+1** para o melhor do próprio time.
- O bônus soma na vitória (+26 vira +28) e tira da perda (-12 vira -10). Empate não mexe nos pontos.
- Na animação do fim aparece "+2 de bônus: MVP da partida" ou "+1 de bônus: melhor do time".

**Conferido:** no servidor em memória, o MVP vencedor levou +28 (26 + 2). No navegador, o selo aparece para quem tem elo e não aparece para quem não tem.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
