# Red Bull RB22 (2026) pelos prints do Thiago

A pintura da Red Bull de 2026 refeita pelos prints de `Carros F1/2026/Redbull`:

- Azul-marinho com manchas mais escuras (como a textura do carro), de lado e de cima.
- O touro vermelho grande na tampa do motor, com o sol amarelo na entrada de ar; de cima, os touros no alto das caixas laterais.
- Bico amarelo na ponta com a chama vermelha atrás; VISA, AT&T e o escudo da TAG Heuer na frente do cockpit.
- Asas de carbono (antes azul-escuro): na dianteira o "Red Bull" vermelho grande com contorno branco e o VISA; na traseira o Gate em cima, o ORACLE atrás e o Mobil 1 nas placas.
- ORACLE na caixa lateral, Red Bull vermelho na tampa, ROKT, CARLYLE e Mobil 1 no bico.
- Marcas novas em `f1-marcas.js`: `gate`, `carlyle`, `att`, `tagheuer`.

**Depende do #725 (Ferrari), que depende do #724 (Mercedes):** os três saíram um do outro para as entradas do `novidades.json` não brigarem. Merge na ordem #724, #725, este.

**Peso:** zero a mais (a folha projetada de 2026, um canvas por equipe, só desenho; o touro é o logo que o jogo já tinha).

Conferido só com `node --check` (`f1-pintura.js`, `f1-marcas.js`) e o `JSON.parse` do `novidades.json`. O teste jogando é do Thiago.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
