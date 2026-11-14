# Carros pelos modelos 3D: Cadillac, Aston Martin, Williams, Haas, RB e a asa da Ferrari (junta #734 a #739)

Os PRs #734 a #739 saíram um do outro e entraram em conflito depois que o #733 (Audi) entrou na `main` com squash. Este PR junta todos, em cima da `main` atual, com o mesmo conteúdo:

- **Cadillac MAC-26 (2026):** o carro assimétrico (esquerda prata com a faixa preta, direita preta com a faixa prata), TWG e o triângulo do AI, o brasão, Jim Beam, Claro, Core Scientific, IFS e a asa dianteira em blocos.
- **Aston Martin AMR26 (2026):** o verde-petróleo do modelo, a barriga preta com o filete limão, os pontinhos limão no alto das caixas, as asas cinza-prata com o aramco, a fileira do bico e o Valvoline embaixo da asa traseira.
- **Williams (2026), pelo FW47:** azul-royal, a barriga marinho com os frisos, KOMATSU, Gulf, ATLASSIAN e a faixa roxa do Kraken embaixo da asa.
- **Haas:** a de 2024 e 2025 (VF-24) e, a pedido do Thiago, a de 2026 iguais ao modelo: preta com o HAAS branco, a MoneyGram, o bico branco e a asa traseira vermelha.
- **RB / Racing Bulls:** a de 2024 (VCARB 01) e, a pedido do Thiago, a de 2026 iguais ao modelo: azul-royal, o branco do cockpit e do bico, o VISA, o touro e o Cash App embaixo da asa.
- **Ferrari:** a asa traseira, de trás e por baixo, azul vivo com o IBM prateado.
- Marcas novas em `f1-marcas.js` (desenhadas no canvas, sem imagem nova). As novidades de cada equipe no topo do `novidades.json`, conferido com `JSON.parse`.

Conferido só com `node --check` (`f1-pintura.js`, `f1-marcas.js`). O teste jogando é do Thiago.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
