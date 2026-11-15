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

🤖 Generated with [Claude Code](https://claude.com/claude-code)
