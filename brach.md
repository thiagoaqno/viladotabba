# TabbaTracks: interface nova do editor de pistas + desempenho

- **Nome novo:** o editor de pistas agora é o **TabbaTracks** (título, logo, botão no menu, janela do .bat).
- **Interface no jeito Revit/Enscape** (`public/corrida/editor/layout.js`): barra de título (Salvar/Publicar, desfazer, mover/girar/escala),
  **faixa de ferramentas** com abas Construir · Pista · Terreno · Modificar · Vista e um botão grande para cada ferramenta (barreira, zebra,
  escape, linha, trecho, área, pincel, placa, pórtico, marca no chão, Craft, vistas, régua…). À esquerda o navegador (Biblioteca com
  miniaturas grandes, Cena, Importar); à direita **Propriedades** com **prévia 3D girando** (peça escolhida, a que o mouse está em cima ou o
  item selecionado, com as medidas em metros), só as opções da ferramenta ativa e a seleção; Histórico. Painéis recolhem (Tab), botões de
  vista no canto do 3D, Ctrl+S salva. Nada do editor foi refeito: as seções são movidas com os mesmos ids.
- **Desempenho:** `montarKit` monta cada peça uma vez e as próximas são cópias que dividem geometria e material (uma fileira de 300
  guard-rails montava 300 vezes tudo; vale no editor e no jogo). As miniaturas da biblioteca saem aos poucos em vez de todas de uma vez.
- **Estudo do editor de pinturas** (Livery Studio): `planos/livery-studio.md`.
