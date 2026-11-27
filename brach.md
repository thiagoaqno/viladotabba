# Tiro: marcadores do Battle royale na Favela Grande e armas de fato dentro das construções

O Thiago jogou e não viu nenhuma arma dentro das construções nem nas lajes. Pediu também os marcadores do BR na Favela Grande.

**Por que não aparecia:** a escolha automática (#1074) contava como "dentro de construção" qualquer ponto com algo em cima. Barraca, guarda-sol, sacada e copa de árvore viravam construção, e a arma caía na rua debaixo de uma lona. "Laje" era qualquer ponto a 1,5 m do chão, o que inclui escadas e muretas.

**A regra automática agora** (vale para os mapas sem marcador):
- dentro de construção: teto a até 4,5 m **e** parede em pelo menos 3 dos 4 lados (até 7 m, na altura do peito);
- laje: mais de 2,5 m acima do chão, sem teto.

**Marcadores na Favela Grande** (o gerador põe sozinho, em `br` do `.json`):
- **70 armas**, a pelo menos 20 m umas das outras:
  - **30 em lajes**: terraços dos prédios com escada (pelo lado, pelos fundos e até o telhado), lajes dos Telhados e do bloco leste da Favela, teto do galpão da Rodoviária;
  - **40 dentro**: casas com porta, casa em obra, alpendre da casa azul, canto coberto do prédio de esquina, contêineres abertos do Ferro-velho e dentro do galpão;
- **19 coletes e 36 curas** dentro das casas, a 16 m umas das outras;
- o centro da zona e as largadas continuam automáticos.

As posições dentro de cada prédio saem dos blocos do kit (o térreo, a laje e o quarto de cima de cada um). Como o mapa tem muitas armas marcadas, o limite de armas no chão do Battle royale subiu de 80 para 160.

Conferido só com `node --check` (o gerador, o `tiro-br.js` e o script do jogo montado); não joguei.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
