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
- **Livery Studio, passo 1** (`/corrida/livery.html`, botão no topo do TabbaTracks): o carro do jogo num estúdio, vistas Frente/Trás/Lado/
  Topo, árvore de peças com olho, cor base e secundária, metálico/rugosidade/reflexo com esfera de amostra, gaveta de Cores (pinturas
  prontas) e Patrocinadores (as marcas do jogo, só para ver por enquanto), Salvar no navegador e Renderizar imagem (PNG).
- **Livery Studio, passo 2:** a pintura vira dados. Zonas do carro (bico, asa dianteira, cockpit, laterais, tampa, asa traseira, assoalho;
  `ZONAS` em `f1-pintura.js`) e camadas por cima de uma base (a pintura de uma equipe ou cor lisa): cor na peça, faixa inclinada, listra de
  corrida e degradê, cada uma num lado ou nos dois, com cor e opacidade; lista de camadas com subir/descer/olho/apagar; desfazer/refazer;
  a folha da pintura aparece nas Propriedades. Salvar grava `public/corrida/pinturas/<id>.json` (rota nova no `corrida-editor.js`, só no
  PC) e o Publicar do TabbaTracks leva a pasta junto. O jogo ainda não lê essas pinturas (passo 4).
- **Livery Studio, passo 3:** patrocinadores. Escolha uma marca do jogo na gaveta (ou **＋ Importar** um PNG) e clique no carro: o logo
  entra como camada da folha, nos dois lados ou em cima. Arraste no carro para mover, `[` `]` tamanho, `Q` `E` giro, e nas Propriedades:
  lado, tamanho, giro, posição em metros, espelhar, opacidade e cor única. Também acabamentos (brilhante, fosca, metálica, perolizada…)
  com verniz, clicar no carro escolhe a peça, duplicar e espelhar camada. PNG importado vai para `public/corrida/pinturas/logo-*.png`.
- **Livery Studio, passo 4:** a pintura salva no estúdio vale no jogo. `f1-pintura.js` carrega `public/corrida/pinturas/` ao abrir e a
  folha da equipe (temporada 2026) passa a ser a das camadas, em todos os carros dela. O acabamento continua o do jogo. Sem nenhuma
  pintura salva (como agora: `pinturas/index.json` vazio), nada muda no jogo.
