# Narrador: a apresentação do grid de largada

O Thiago pediu falas novas do narrador para a apresentação do grid.

## As falas (`narrador/falas.js`)

`FALAS_GRID` tem 36 falas novas, com 991 caracteres no total:
- `grid-abre-1..3`: as aberturas ("Vamos ao grid de largada!");
- `grid-pole-1..3`: "Na pole position,", "Largando em primeiro,"…;
- `grid-lado-1..3`: "Ao lado dele, na primeira fila,"…;
- `grid-fecha-1..3`: os fechamentos ("Grid formado. Agora é com eles!");
- `grid-galera-1..2`: "um piloto da galera!";
- `nome-<SIGLA>`: um nome por piloto de 2026, com a equipe ("Lando Norris, da McLaren!").

`ferramentas/narrador-pistas.js` já gera essas falas junto com as outras: é rodar o `GERAR-VOZES-CORRIDA.bat`, opção 1 (narrador), "só as que faltam". O `--estimar` conta 46 falas a gerar, com 1.518 caracteres; esse total inclui 10 falas que já faltavam antes.

## Como toca

- **`narrador.js`:**
  - `falarDoGrid(pole, segundo, semente)` monta a frase em pedaços: a abertura, "na pole position", o nome do pole, "ao lado dele", o nome do segundo e o fechamento. A variação de cada pedaço sai da semente do GP, igual para todos da sala.
  - Quem é da galera, ou corre numa temporada que não é a de 2026, vira "um piloto da galera".
  - `falarSequencia(ids)` toca os pedaços colados, com 0,12 s entre eles. Ela só corta a fala que está no ar quando **todos** os pedaços carregaram. Sem os mp3, a fala da pista continua, só abaixada, como era antes.
  - O corte das luzes abaixa o volume de todas as partes.
- **`transmissao.js`:** no começo do bloco do grid, o narrador abaixa a fala da pista e chama `falarDoGrid` com a primeira fila.

A novidade deste PR vai no PR que conserta o `novidades.json` da `main`, para os dois não mexerem nas mesmas linhas.

## Conferido

A página carrega sem erros num servidor de teste. A voz não foi ouvida: os mp3 ainda não existem.
