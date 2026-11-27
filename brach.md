# Tiro: sombras de longe mais leves no tablet

No iPad, o relatório de desempenho mostrou a placa de vídeo presa. Cada quadro levava 20 ms com o processador em 5 ms, igual na qualidade mínima e com a resolução baixa. Eram 1,3 milhão de triângulos por quadro, e boa parte vinha das 3 camadas de sombra se redesenhando enquanto o jogador anda.

**O que mudou** (em `ferramentas/tiro-frontline.js`, só em aparelho de toque):
- As duas camadas de sombra de longe se redesenham cada uma a cada 6 quadros, revezando. Antes era a cada passo do jogador.
- Se a câmera pular mais de 8 m (ao renascer), elas se redesenham na hora.
- A camada de perto continua igual.

Andando, eram até 3 sombras por quadro; agora é a de perto e, em média, um terço de uma de longe.

PC fica igual. Conferido só com `node --check`; falta jogar no iPad.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
