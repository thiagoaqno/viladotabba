# Carreira: o Paddock (a temporada viva, com decisões e consequências), a tela de acerto no jeito do jogo da F1 e os insights do engenheiro

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

## Insights do engenheiro (Visão geral da Análise)

Um quadro novo, só com o que o resumo do GP mede:
- o setor em que você mais perde para o melhor tempo da corrida;
- a sua melhor volta contra a do companheiro;
- a consistência das voltas limpas;
- as posições ganhas ou perdidas;
- as paradas contra a estratégia mais usada.

## Prints

Tirados com o servidor de teste (`DB_PATH=:memory:`) e o Playwright, a 1600×900, numa carreira nova da Audi, no tema escuro e depois no claro (o das referências): o Central com a chamada, o Paddock antes e depois de uma decisão e o Acerto. Estão em `C:\Users\thiag\Downloads\lts\prints\paddock\`, fora do repositório. Os insights da Análise precisam de um GP corrido e não entraram nos prints.

Entrada no topo de `novidades.json`. Conferido com `node --check` e `JSON.parse`. O `brach.md` e o `novidades.json` também mudam no #755: quem for juntado depois precisa juntar as duas entradas.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
