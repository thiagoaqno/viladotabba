# Carreira: o Paddock (decisões e consequências), a aba Carro (peças e acerto juntos, com câmbio, freio e diferencial), o balanceamento do desenvolvimento e os insights do engenheiro

Pedido do Thiago (2026-11-15), com o print da tela de acerto do jogo da F1, uma ideia de central de análise e o texto sobre deixar a temporada "viva":
paddock, acontecimentos inesperados e consequências das decisões. "Pode fazer sem minha aprovação. Um PR só."

## O Paddock (aba nova da Central, só na carreira solo)

- **As regras** (`temporada/paddock.js`, as mesmas no servidor e no navegador). O save ganhou `s.paddock`, criado na hora nos saves antigos:
  - **moral e lealdade do companheiro.** A moral muda o ritmo dele na corrida (`regras.js pilotosNoGrid`): ±2 pontos de ritmo nos extremos, ±0,4% no tempo de volta pela conta de `fatorDeRitmo`;
  - **satisfação do patrocinador.** Passando de 80, a verba por GP sobe 1 milhão; abaixo de 20, cai 1 milhão;
  - **torcida;**
  - **diretoria** (−20 a +20), somada à confiança do chefe na caixa de mensagens (`regras.js imersao`);
  - **as decisões e o mural.**
- **Os acontecimentos:** até dois por GP, sorteados pela semente (o mesmo save vê sempre os mesmos), entre os que fazem sentido agora:
  - insatisfação no segundo cockpit;
  - conflito entre companheiros (quando vocês chegaram colados);
  - patrocinador pedindo visibilidade, com a opção de prometer a meta: cumprir dá +10, falhar dá −15;
  - imprensa depois de um resultado ruim;
  - marca querendo entrar depois de um resultado bom;
  - encontro com a torcida;
  - diretoria impaciente ou satisfeita;
  - companheiro conversando com outra equipe (moral ou lealdade abaixo de 30);
  - reunião técnica do fim de semana.

  Cada opção mostra o que mexe (+12 moral, −3 mi caixa...).
- **A decisão:** vai para o servidor (o evento novo `paddock`, `corrida-temporada.js`), que confere se o acontecimento ainda está aberto e se há caixa.
- **Depois de cada GP** (`registrarResultado`):
  - o companheiro ganha moral quando pontua ou chega na sua frente, e perde quando abandona;
  - o patrocinador sobe quando você cumpre a meta do GP e cai quando não cumpre;
  - a torcida segue os seus pontos.

  Tudo vai para o mural.
- **Na virada do ano**, os números voltam um pouco para o meio. Com companheiro novo ou equipe nova, o humor recomeça.
- **A tela** (`paddock-ui.js`, `paddock.css`):
  - o fim de semana em quatro passos (sexta, sábado, domingo, pós-corrida);
  - "Acontecendo agora";
  - o humor da equipe, com o que cada número faz;
  - os dois pilotos com o que foi medido no ano: a consistência (o desvio das voltas limpas) e as ultrapassagens por GP, da análise de cada GP;
  - o duelo interno;
  - a central de notícias, só com números de verdade: as equipes que levaram melhoria neste GP (`desenvolvimentoRivais`), a previsão do próximo GP, o vencedor do último e o líder;
  - o mural;
  - o histórico da equipe: cada temporada e os momentos marcantes (primeira vitória, primeiro pódio, melhor resultado, melhor temporada).
- **Ao abrir a carreira,** o Central mostra o acontecimento que espera decisão, com o atalho para o Paddock. A aba mostra quantos esperam.

## A tela de acerto no jeito do jogo da F1 (`central-acerto.js`, `central-acerto.css`)

- O título no meio e as abas em pílula: Ajustes, Equipe e Pista.
- O painel tem as linhas da asa e da altura:
  - a escolhida fica em destaque, invertida;
  - as setas mexem 5 pontos;
  - a barra é em gomos (cheia até o valor, listrada depois), com as marcas E e S do engenheiro e do estrategista;
  - o número de 0 a 100 e a faixa "Menos 0 – 100 Mais" vêm com o efeito ao lado.
- O carro de lado à direita, e a explicação da linha escolhida embaixo, como no jogo.
- A faixa de baixo tem:
  - a pista e a etapa;
  - a folga do assoalho no fim da reta;
  - o alerta, que fica vermelho e pisca quando o assoalho raspa abaixo de 300 km/h.
- Os botões com tecla: carro padrão, usar o do engenheiro, usar o do estrategista.
- O teclado anda como no jogo: para cima e para baixo trocam de linha, para os lados mexem o valor.
- Só a asa e a altura: são os dois ajustes que a física do jogo tem. Nenhuma linha sem efeito foi inventada.

## Refeitos pelas referências do Thiago (2026-11-15, a segunda rodada)

- **Paddock** (`paddock-ui.js`, `paddock.css`):
  - o topo com a foto do GP à direita, sumindo para a esquerda (a mesma do calendário, `GpInfo.fundoDe`), e as pílulas do fim de semana;
  - os cartões claros com a barra da equipe no título;
  - os acontecimentos com ícone, o selo "Decidido" ou "Esperando você" e as opções em pílula, com os efeitos dentro (depois de decidir, fica só a escolhida);
  - o humor com o número grande (a média dos cinco, com a diretoria levada para 0 a 100) e as linhas com ícone;
  - os pilotos com foto (`fotos-noticias.js`, Wikimedia Commons) e o logo da equipe no meio, com o duelo interno;
  - as notícias com miniatura e o mural com o balão.
- **Acerto** (`central-acerto.js`, `central-acerto.css`, `acerto3d.js`):
  - o título à esquerda com o traço da equipe e as abas inclinadas;
  - o painel com o ícone da suspensão;
  - as linhas com ‹ barra › e o valor com o mínimo e o máximo de verdade: a força da asa vai de 80 a 120% e a altura parada de 2,5 a 7,5 cm (`acerto-sugestao.js`);
  - o cartão de onde o assoalho começa a raspar e os medidores em barras;
  - o carro grande, agora de três-quartos, com o logo da equipe atrás;
  - a faixa de baixo com os três botões inclinados.

## Decisões que mudam a equipe, e não só números (a terceira rodada)

O Thiago: "preciso sentir as decisões mudando em algo além de números, talvez aumento e demissão"; os botões "com cara de IA"; e responder ao mouse.

- **Ações de verdade** (`paddock.js`, `acao`):
  - **aumento do companheiro:** o salário dele sobe 1 milhão por GP, somado aos salários de cada GP em `registrarResultado`;
  - **aumento dos mecânicos:** o mesmo, nos salários do box;
  - **demissão do companheiro:** custa 2 milhões de rescisão. O piloto de ritmo mais perto (e não acima) de outra equipe assume o segundo carro, e o grid já usa o piloto novo no próximo GP;
  - **o estrategista demitido** para cortar custos: a equipe volta um nível e recupera a diferença;
  - **o chefe dos mecânicos sai** se o aumento for recusado: o box cai um nível e as paradas ficam mais lentas;
  - **o seu aumento:** o bônus por vitória sobe 1 milhão no contrato;
  - **o ultimato da diretoria** (confiança abaixo de 30%): aceitar é prometer a meta no próximo GP. Falhar é ser demitido: a renovação fica bloqueada, e no fim do ano, se você não assinar com outra, vai para a equipe mais fraca que fez proposta.
- **Cada opção que muda a equipe** mostra antes o que vai acontecer ("Nico Hülkenberg sai; Oliver Bearman (Haas) assume o carro · rescisão de 2 milhões").
- **Depois de decidir:**
  - um cartão "O que mudou na equipe" aparece em destaque, vermelho na demissão;
  - as barras do humor andam do valor antigo ao novo, com o "+38" aparecendo e sumindo;
  - o caixa também mostra a diferença;
  - o acontecimento decidido guarda o texto e o resultado da hora da decisão.
- **No topo**, avisos de ultimato e de demissão. Embaixo dos pilotos fica a equipe técnica: o estrategista, os mecânicos, o seu bônus por vitória e os salários extras. O companheiro mostra o aumento.
- **As opções viraram linhas limpas:** a bolinha, o rótulo, o efeito em texto (verde ou vermelho) e a consequência. Ao passar o mouse:
  - a linha acende na cor da equipe;
  - a bolinha enche e a seta anda;
  - as barras do humor mostram, listrado, para onde vão, com o número ao lado.
- **O resto também responde ao mouse:** os cartões sobem, a foto do piloto e a da notícia aproximam, e a seta anda.
- **No Acerto:** as abas inclinadas viraram texto com o traço da equipe deslizando, e os botões ficaram retos (um cheio, dois discretos), subindo ao passar o mouse.

## A quarta rodada: sem viés nas escolhas, a aba Carro e o desenvolvimento balanceado

O Thiago:
- "se a gente já mostrar o resultado da escolha embaixo dela, dá muito viés: oculta e só mostra depois de escolher, com uma animação e talvez uma notícia";
- "acerto e desenvolvimento são as mesmas coisas em guias diferentes; deviam ser juntas, num layout mais bonito e intuitivo, com mais opções";
- "hoje é só upar 8 pontos em motor, 8 em aerodinâmica que você tem um carro overpowered".

- **As escolhas do Paddock** mostram só o rótulo, sem o efeito, sem a consequência e sem a prévia no humor. Depois de escolher:
  - o efeito e o que mudou entram com animação;
  - a escolha acende;
  - as barras andam;
  - a decisão vira notícia na Central de notícias, com a etiqueta "Agora". São manchetes para as 34 opções (`paddock.js`, `MANCHETES`), como "Audi demite Hülkenberg; Bearman assume o carro".
- **A aba Carro** (`central.js`) junta Desenvolvimento e Acerto:
  - o topo tem a nota e a ficha do carro (reta, aceleração, curva, freio, resistência e confiabilidade);
  - a troca entre "Peças" (o carro da temporada, na garagem 3D) e "Acerto" (o carro do próximo GP);
  - as abas salvas antigas abrem a parte certa.
- **As peças:** viraram uma lista com as seis peças. Cada uma mostra os níveis em gomos (os listrados não rendem), o − e o +, o custo do próximo nível e o aviso "rende X: falta suspensão". Embaixo fica o detalhe da escolhida.
- **O balanceamento** (`f1-equipes.js`):
  - **o custo sobe no alto:** do 1º ao 5º nível, 1 ponto cada; o 6º e o 7º, 2; o 8º, 3. Uma peça no máximo custa 12 pontos (antes, 8). Os carros padrão vão até o nível 5 e custam o mesmo de antes;
  - **uma peça depende de outra:** a aerodinâmica só rende até a suspensão + 4, e o motor até a confiabilidade + 4. O 8 de motor com 8 de aero e o resto zerado agora custa 24 pontos e rende como nível 4;
  - **os rivais** evoluem gastando o mesmo custo (`regras.js desenvolvimentoRivais`).
- **Três ajustes novos no acerto**, valendo na física do servidor e do navegador (`sim.js extraDoAcerto`), cada um trocando uma coisa por outra em até ±4% (valores para se sentir jogando, não medidos):
  - **câmbio:** curto arranca, longo chega mais longe;
  - **balanço de freio:** na frente freia mais, atrás o carro vira;
  - **diferencial:** aberto vira no meio da curva, travado tem mais tração na saída.

  O navegador manda 5 números (`fisica.js`), e o servidor aceita 2 (os programas de antes) ou 5 (`corrida-humanos.js`). "Usar" a sugestão do engenheiro mexe só na asa e na altura.
- **Os testes antigos:**
  - em `corrida-f1-equipes.test.js`, a montagem recusada agora é a que custa mais de 20 (não a que soma 21);
  - o teste "nenhuma montagem é melhor em tudo que outra" saiu: com a peça presa à outra, pôr ponto onde ele não rende é de propósito pior.

## Menos texto (a quinta rodada)

O Thiago: "muita coisa tem descrição demais e fica redundante".

- **No Paddock saíram:**
  - a frase embaixo do título;
  - os selos "Esperando você" e "Decidido" de cada cartão (o título do quadro já conta quantos esperam);
  - a legenda do humor;
  - o histórico vazio;
  - a frase longa do mural vazio.

  O aviso depois da decisão virou só "Decidido."
- **Na aba Carro saíram:**
  - o "(pouca asa, motor forte)" ao lado da nota;
  - o subtítulo das partes;
  - o subtítulo de cada peça (fica só o aviso de quando não rende);
  - o parágrafo da regra do custo, que virou dica no título da lista;
  - no detalhe da peça: a descrição, o "melhora / cobra em troca", o "Tirar 1 nível" (o − da lista faz isso) e os níveis repetidos embaixo.
- **No Acerto:**
  - as explicações viraram uma frase curta cada uma;
  - os três ajustes novos mostram só o lado ("curto", "no meio", "longo");
  - saíram o subtítulo do painel, a frase do cartão de raspar e os subtítulos dos medidores;
  - saíram também a folga e o "raspa a" da faixa de baixo (já estão no painel) e o "Acerto guardado" (a página já diz "Salvo").

## O Paddock pela referência nova e o carro em destaque (a sexta rodada)

- **O Paddock cabe numa vista** (`paddock-ui.js`, `paddock.css`):
  - "Ações do fim de semana" em linhas: ícone num quadrado, título, uma linha de texto e a seta;
  - um acontecimento aberto por vez, com as opções em linhas com ícone. O decidido fica aberto, mostrando o efeito;
  - o humor em linhas finas (ícone, nome, barra e número na mesma linha);
  - embaixo, três cartões pequenos:
    - **o companheiro**, com foto e ritmo; a seta abre os dois pilotos, o duelo e a equipe técnica;
    - **uma notícia por vez**, e a seta passa para a próxima;
    - **a última linha do mural**; a seta abre o mural inteiro e o histórico.
- **O carro com mais destaque na aba Carro:**
  - nas Peças, a câmera da garagem chegou mais perto (`estudio3d.js`, vista `dev`);
  - no Acerto, o painel ficou mais estreito, o palco ficou maior (4:3, fixo na tela ao rolar) e o carro enche mais o quadro (`acerto3d.js`).

## Insights do engenheiro (Visão geral da Análise)

Um quadro novo, só com o que o resumo do GP mede:
- o setor em que você mais perde para o melhor tempo da corrida;
- a sua melhor volta contra a do companheiro;
- a consistência das voltas limpas;
- as posições ganhas ou perdidas;
- as paradas contra a estratégia mais usada.

## Prints

Tirados com o servidor de teste (`DB_PATH=:memory:`) e o Playwright, a 1600×900, numa carreira nova da Audi, no tema escuro e depois no claro (o das referências): o Central com a chamada, o Paddock antes e depois de uma decisão e o Acerto. Estão em `C:\Users\thiag\Downloads\lts\prints\paddock\`, fora do repositório. Os insights da Análise precisam de um GP corrido e não entraram nos prints. Os prints da demissão usam um estado simulado só na página (um GP e a moral baixa), sem mexer no servidor.

Entrada no topo de `novidades.json`. Conferido com `node --check` e `JSON.parse`. O `brach.md` e o `novidades.json` também mudam no #755: quem for juntado depois precisa juntar as duas entradas.
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
