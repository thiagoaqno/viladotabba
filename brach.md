# Viseira curva e saltada, com borda e dobradiças (pela imagem do Thiago)

Antes, a viseira era uma faixa da própria casca, só 1,2% maior: parecia pintada e reta. Agora (`f1-piloto.js`, `geometrias`):

- **Curva e saltada:** é uma peça à parte que dá a volta pela frente (~150°, antes ~130°) seguindo a forma da cabeça. Fica 2 mm para fora do casco e estufa no meio (até +3,5 mm), como uma lente de verdade (`estufar`).
- **Mais alta:** vai da altura dos olhos até perto do queixo (0,44 rad de altura na esfera, antes 0,36). A faixa do nome, acima dela, continua livre.
- **Moldura (`molduraDaViseira`):** a borracha escura da borda (um pedaço da casca um pouco maior, rente ao casco, que aparece em volta da viseira) e as duas dobradiças redondas nas pontas. É uma malha à parte, com um material escuro acetinado (`materialDaMoldura`) dividido por todos os pilotos. Ela não entra em `k.mats` (o piloto não está lá).
- **Entradas de ar no queixo (`f1-capacetes.js`, `pintarFolha`):** duas fendas escuras inclinadas logo abaixo da viseira, em todo capacete.
- **Onde aparece:** no piloto da pista e na prévia 3D do editor (`capacete-3d.js`). Nos mecânicos e no pódio, entra pelo #720, que já usa a moldura quando ela existe. A prévia 2D (sem WebGL) desenha a viseira no tamanho novo.
- Conferido só com `node --check`: a forma precisa ser vista (a prévia do editor mostra de perto).
