# Carreira: a personalidade dos pilotos, a aba Telemetria da Análise, mais ajustes no acerto e o botão de pular a espera do Q1

O Thiago pediu os itens 2, 5 e 6 da lista do que faltou ("um PR só"):
- 2: a personalidade dos pilotos;
- 5: a central de análise da referência;
- 6: mais opções no acerto, como na tela do jogo da F1.

Pediu também, no meio, o botão de pular a espera do Q1. O `novidades.json` da `main` estava quebrado pela junção do #755 com o #756 (faltava fechar a entrada do Paddock antes da do capacete) e foi consertado aqui.

## A personalidade do companheiro (`temporada/paddock.js`, `regras.js`, `corrida-estilos.js`, `corrida-robos.js`)

- **Confiança** (0 a 100, no save):
  - sobe 6 quando ele pontua e 4 quando chega na sua frente;
  - cai 8 quando ele abandona e 2 quando fica fora dos pontos;
  - na corrida, mexe na constância dele, ±6 pontos nos extremos: as voltas variam menos ou mais.
- **Experiência:** os GPs que ele já fez pela sua equipe, contados no save. Cada GP dá +0,25 de constância (até 4) e +0,4 de largada (até 6), e a largada é a reação no semáforo.
- **Agressividade** (0 a 100):
  - vem da instrução de corrida, um acontecimento novo: "Atacar" (+15), "Corrida limpa" (−15) ou "Deixar com ele";
  - a briga entre os dois também mexe: defender a sua corrida dá −8, dar razão a ele dá +8;
  - na corrida, muda o ataque e a defesa dele (±0,2) e a taxa de erro (±40%), no perfil de corrida (`corrida-estilos.js`, que agora aceita um ajuste do próprio piloto: `perfil`).
- **Ele vai embora sozinho:** com a moral abaixo de 22 e a lealdade abaixo de 25 depois de um GP (antes do último), ele assina com uma rival. O piloto de ritmo mais perto (e não acima) de outra equipe assume o carro, e isso vai para o mural, as notícias e "O que mudou na equipe".
- **A tela:** a confiança, a agressividade e a experiência aparecem ao abrir "Os pilotos" no Paddock.

Os números são de jogo, para sentir jogando; não são medidos.

## A aba Telemetria da Análise (`temporada/central-telemetria.js`)

Uma sub-aba nova entre Desempenho e Pneus:
- **Mapa da pista** na sua melhor volta, colorido por velocidade, frenagem ou aceleração. As amostras de 250 ms do replay (a fração da volta, a velocidade, o acelerador e o freio, `corrida-gravacao.js`) vão sobre o traçado de `Pistas.pontos`.
- **Telemetria comparativa:** a velocidade ao longo da melhor volta sua e a do piloto escolhido para comparar, com os setores, a diferença na volta e o ponto marcado onde você mais perde.
- **Desgaste dos pneus:** a vida do pneu no fim de cada volta, sua e dele, com as paradas. O desgaste passou a ser gravado por volta (`corrida-analise.js`, campo `d`), então só os GPs corridos daqui em diante mostram.
- **Estratégia de corrida:** a faixa dos stints de cada um, com a letra e a cor do composto.

O GP sem replay salvo (só o ano atual e o anterior guardam) avisa que não tem.

## Mais ajustes no acerto (`sim.js`, `corrida-humanos.js`, `fisica.js`, `central-acerto.js`)

Três linhas novas. Os efeitos são de jogo (não medidos) e valem no servidor e no navegador:
- **Rigidez da suspensão:** dura segura a carga da asa (até +3%) e perde aderência mecânica nas zebras (até −2%).
- **Cambagem:** muita dá mais curva (até +4%), menos freio e tração (até −3%) e gasta mais o pneu (até +12%).
- **Pressão dos pneus:** baixa agarra mais (até +4%) e gasta mais (até +15%); alta dura mais e agarra menos.

O desgaste agora também vem do acerto (`extraDoAcerto` → `desgaste`, multiplicado no `gastarPneu`). O navegador manda 8 números, e o servidor aceita 2, 5 ou 8.

Combustível não entrou: o jogo não tem consumo nem peso de combustível.

## O botão de pular a espera entre as sessões da classificação (`pos-quali.js`)

Eliminado no Q1, sozinho na sala, você esperava os 3 minutos da pausa. Agora, quando nenhum humano precisa confirmar, aparece "Pular para o Q2" (ou "Ir para a largada"). O servidor já seguia quando ninguém precisava confirmar; faltava o botão.

## Prints

Tirados com o servidor de teste (`DB_PATH=:memory:`) e o Playwright, a 1600×900, no tema claro: o Acerto com as oito linhas e o Paddock com os pilotos abertos. A Telemetria foi vista com um GP simulado só na página (dois carros e um replay inventado para desenhar a tela), porque o servidor de teste não tem corrida gravada. O botão do Q1 não foi visto em print.

Entrada no topo de `novidades.json`. Conferido com `node --check` e `JSON.parse`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
