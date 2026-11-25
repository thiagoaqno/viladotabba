# MFD tipo 2: o painel de vidro da transmissão, opcional

O Thiago pediu o MFD dos prints da transmissão do jogo da F1 como opção: um "MFD tipo 2" nas configurações.

- **A opção:** `graficos().mfd` em `qualidade.js`, com "1" como padrão (o MFD de sempre) e "2" para o novo. Ela fica em Configurações > Geral > MFD e também na aba Ajustes do MFD, na linha "MFD". O `mfd.js` liga `#race.mfd-t2`.
- **O visual, em `hud-mfd2.css`:**
  - quase transparente, com o carro aparecendo atrás, e a ponta de cima à direita cortada;
  - o nome da página pequeno e os ícones das abas pequenos em cima à direita;
  - sem cartões: tudo em lista, com letra clara e sombra;
  - a linha escolhida em branco, com a ponta cortada, no formato "nome ‹ valor ›";
  - a janela de parada (aba Jogos de pneu) na faixa ciano;
  - o painel fica mais alto, ao lado do halo. Com o HUD "Transmissão (TV)" do #953, ele sobe para cima da caixa de marcha.
- **O conteúdo das páginas é o mesmo do tipo 1.** A tela de temperaturas de pneus e freios dos prints não entra, porque o jogo não simula essas temperaturas.
