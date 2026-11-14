# Cadillac MAC-26 (2026) pelo modelo 3D

A Cadillac de 2026 refeita pelo modelo "2026 Cadillac MAC-26" do Sketchfab que o Thiago mandou, olhado dos dois lados, de cima (bico, asa dianteira e tampa), de frente e de trás.

O carro é **assimétrico**, e a pintura agora segue isso:
- **Lado esquerdo:** prata-claro, com uma faixa preta larga descendo do cockpit até embaixo atrás, a barriga preta embaixo do bico e da frente da caixa, as duas barras pretas na tampa e o TWG preto.
- **Lado direito:** o contrário. Preto, com a faixa prata subindo de trás até a frente da caixa, os frisos cromados na tampa e o TWG prata.
- **Nos dois lados:** o triângulo do TWG AI, o brasão na tampa, Cadillac no bico, Claro, Jim Beam no painel preto, Core Scientific, a barbatana preta, as placas da asa dianteira cromadas e o IFS na placa da asa traseira (preto no prata, prata no preto).
- **De cima:** a tampa meio a meio (prata à esquerda, preta à direita) com a espinha preta e os frisos; o bico prata com o brasão, TWG, IFS e a bandeirinha da Tommy Hilfiger; o preto antes do cockpit, onde fica o número; a asa dianteira em blocos pretos e brancos.
- **Atrás e embaixo da asa** (`ASA_BAIXO`): preto com o Cadillac prata.
- Marcas novas em `f1-marcas.js`: `twgai`, `jimbeam`, `corescientific`, `brasao`, `hilfiger`.

**Saiu do #733 (Audi), que conserta o `novidades.json` da `main`:** faça o merge do #733 primeiro.

**Peso:** zero a mais (a folha projetada de 2026, um canvas por equipe, só desenho).

Conferido só com `node --check` (`f1-pintura.js`, `f1-marcas.js`) e o `JSON.parse` do `novidades.json`. O teste jogando é do Thiago.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
