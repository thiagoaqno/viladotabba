# Capacete: o formato de F1 de verdade, a viseira em arco, patrocínios por lugar com as marcas dos carros, acabamentos novos, logos na torre, o halo da Audi e o editor que não atualiza a página de todos

Pedido do Thiago depois do #754: mudar o formato do capacete para ficar parecido com a referência, mostrar o print no fim, e consertar a página que "atualiza para todos" a cada clique.

## O clique que atualizava tudo

- **Por quê:** cada clique no editor mandava o capacete para a sala (`mods`, 250 ms depois). O servidor mandava o estado para todo mundo, cada navegador redesenhava a sala e, com ela, o editor de capacete do zero (`redesenhar` refazia o painel e as miniaturas).
- **Agora** (`capacete-editor-ui.js`, `capacete-editor.js`):
  - o editor só se refaz quando o capacete guardado (ou o número) mudou de verdade;
  - o capacete vai para a sala uma vez, 1,2 s depois do último clique;
  - os cliques do editor param nele (`stopPropagation`) e não chegam aos tratadores da sala nem da Central.

## O formato (`f1-piloto.js`, o mesmo modelo da pista)

- **A deformação do casco foi refeita:**
  - a cúpula redonda em cima (antes achatada);
  - os lados mais retos na altura da viseira;
  - a barra do queixo saliente, para a frente e para baixo, quase da largura toda;
  - a nuca que desce e vai para trás, com o degrau da aba;
  - a borda de baixo abrindo para fora.
- **As medidas:** o casco ficou 7% mais alto e 5% mais largo, e o corte de baixo desceu, mostrando a barra do queixo. A viseira ficou um pouco mais estreita na altura, e as dobradiças, menores. A normal passou a ser a do casco deformado (a da elipse sombreava errado o queixo e a nuca).
- **A viseira em arco** (o Thiago: "a viseira está reta, deve ser um arco"; depois, "com a concavidade voltada para cima"): antes era uma faixa entre dois paralelos, com as bordas retas. Agora cada ponto muda de altura conforme se afasta do meio da frente (`arquear` e `noArco`, na esfera antes de `casco`). O meio da frente fica mais baixo, e as pontas sobem uns 14° até as dobradiças, afinando 30%. A borracha em volta, o lábio de cima e as dobradiças seguem a mesma conta. Depois ("aumenta o tamanho e desce mais ela"), a viseira cresceu e desceu: começa 5° mais baixo (de 1,24 para 1,33 rad a partir do topo), ficou 25% mais alta (0,36 para 0,45 rad) e 6% mais larga (2,5 para 2,66 rad).
- **As entradas de ar da testa saíram:** viravam dois "chifres". A grade do queixo virou duas fendas rasas.
- **A prévia:** a câmera ficou mais perto e de três-quartos, e as miniaturas ganharam uma câmera um pouco mais longe, para o capacete aparecer inteiro.
- **A faixa do nome e do patrocínio** subiu, para não ficar embaixo do lábio da viseira.
- **As miniaturas:** apareciam apagadas quando a animação de entrada não corria; agora não ficam presas invisíveis.

## Patrocínios por lugar e acabamentos novos

Pedido do Thiago (2026-11-15): "mais variáveis de texturas no capacete… opções de colocar o patrocinador… da pra aproveitar as logos lá que já temos para os carros".

- **Os lugares** (`f1-capacetes.js`, `LUGARES_PATROCINIO`): testa, faixa do visor, lados, nuca e queixo, cada um com o seu patrocínio. No editor, na aba Patrocínios, você escolhe o lugar e depois a marca, numa lista com miniatura.
  - **As marcas:** os 4 selos da galera e as 76 marcas das pinturas dos carros (`f1-marcas.js`, as mesmas funções de canvas, sem imagem nova; `MARCAS_CAPACETE` dá o nome de cada uma).
  - **O tamanho:** cada marca tem uma largura, medida uma vez pelos pixels (`caixaDaMarca`), e cabe no lugar. Perto do topo e do queixo a folha encolhe na volta da cabeça, e a marca é esticada em 1/sen do ângulo (até 2x).
  - **A placa atrás:** direto no casco (a letra fica clara ou escura conforme a cor média do que está embaixo), placa escura, placa clara ou placa na cor 3.
  - **Com marca na faixa do visor,** o nome fica só na nuca.
  - **O capacete de antes** (um patrocínio só, `patrocinio`) continua valendo, na nuca e nos lados.
- **Os acabamentos** (agora 9): entraram acetinado, perolado (furta-cor leve e brilho de cetim), camaleão (furta-cor forte sobre metal), flocos de metal (relevo de pontos) e fibra de carbono.
  - **O carbono:** a sarja 2x2 em quadros de 4 px é a cor do casco, com 20% da cor 1 por cima, e também o relevo.
  - **O material:** o capacete de quem joga, na pista, passou a ser `MeshPhysicalMaterial` com o mesmo acabamento da prévia (`aplicarAcabamento`, em `f1-piloto.js`). O dos robôs continua o simples.
- **O servidor** (`corrida.js`, `limparCapacete`) aceita os acabamentos novos, `patrocinios` (só os 5 lugares, com id curto de letras e números) e `fundoPatrocinio`.

## Os logos na torre e o halo da Audi

Pedido do Thiago (2026-11-15), com um print de onboard da Audi: "faz no hud ao invés das barrinhas, aparecem logos. atenção ao halo da audi".

- **A torre** (`hud.js`, `hud-torre.js`, `hud-f1.css`): cada linha mostra o logo da equipe (os mesmos de `logos/`, do ano em uso por `logoF1`) no lugar da barrinha de cor.
  - A coluna passou de 4 para 20 px (de 3 para 15 px na tela estreita).
  - A imagem só é trocada quando a equipe da linha muda.
  - Sem logo, ou se a imagem não carregar, volta a barrinha na cor.
- **O halo da Audi** (`f1-pintura.js`, `HALOS`), pelo onboard:
  - as duas pernas levam `store.audif1.com` (antes eram lisas);
  - a direita diz "visit QATAR", antes só "QATAR";
  - a Castrol ganhou o redondo verde, branco e vermelho (`f1-marcas.js`);
  - as letras do halo ficaram brancas com contorno escuro, como no carro (antes eram escuras sobre o prata);
  - os anéis ("o símbolo da audi tá meio errado"): do cockpit, esse trecho do halo é visto ao longo da coluna do meio, e o desenho estica uns 3x na altura. Os ovais de antes viravam "tulipas" altas. Agora são desenhados achatados a 1/3 na altura e saem redondos e cruzados, como os da Audi;
  - o Revolut na face continua;
  - no cockpit, o "aleph" virou "Aleph".

## Prints

Tirados com o servidor de teste (`DB_PATH=:memory:`) e o Playwright, a 1600×900, com o editor montado na página da corrida:
- no tema claro, o desenho Lâminas com acabamento brilhante;
- no tema escuro, Chamas com acabamento metálico e o patrocínio Galera Racing.
- os patrocínios: Lâminas com Santander, Pirelli, Shell, Galera Racing e HP direto no casco, e Corte perolado com placa escura;
- os acabamentos: Velocidade em fibra de carbono e Chamas em camaleão.
- o cockpit da Audi em Melbourne, com a torre completa: os logos na torre e o halo com Castrol, Revolut e visit QATAR.

Estão em `C:\Users\thiag\Downloads\lts\prints\capacete\`, fora do repositório.

Entrada no topo de `novidades.json`. Conferido com `node --check` e `JSON.parse`. O conserto do clique não foi testado com duas pessoas na sala, e o resto do teste jogando fica com o Thiago.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
