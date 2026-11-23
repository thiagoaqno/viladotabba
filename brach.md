# O fim da classificação em duas telas (Qualifying e Race Day), e as falas da classificação

Pedido do Thiago (2026-11-23), com duas imagens de referência: "essa tela entre qualifies precisa ser refeita: parece que a gente não sai da corrida, e não é intuitivo escolher o pneu"; o Continuar leva a uma tela de pré-corrida, RACE DAY, com o grid, as condições, a estratégia e a chamada para a corrida. E: "não temos falas específicas para os qualifies".

## As telas (`pos-quali.js`, `pos-corrida.css`)
- **QUALIFYING**, no fim do Q3:
  - a tabela com o top 5 em destaque e o 6º ao 10º mais apagados, com o resto embaixo, numa lista que abre;
  - o cartão da POLE POSITION, com a foto do piloto, a equipe e o tempo;
  - no rodapé, o mapa da pista, o nome do GP e "CONTINUAR".
- **RACE DAY:**
  - o grid de largada, com o top 5 e você, mais a punição de grid se houver;
  - as condições: as voltas, a volta de verdade em km, a chance de chuva da previsão, a pista seca ou molhada e a aderência;
  - o pneu da largada, os cinco com quantas voltas cada um dura nesta pista (`vidaEmVoltas`, com a água), e com o escolhido, quantas paradas ele pede;
  - "Voltar", "Acerto e pontos" (a página de ajustes de antes) e "IR PARA O GRID".
- Sem temperatura nem combustível: o jogo não tem esses números.
- A pausa inteira da classificação, Q1 e Q2 também, ganhou a foto do GP de fundo (`GpInfo.fundoDe`): não parece mais a corrida atrás.
- Conferido montando um fim de Q3 falso no navegador de teste (22 carros em Mônaco). Não foi visto com o print.

## As falas da classificação (`hud.js radioDaClassificacao`, `radio/falas.js`)
- Seis situações, cada uma uma vez só por sessão:
  - a sessão abrindo;
  - a volta melhorada;
  - a zona de eliminação, nos 90 s finais;
  - o último minuto;
  - no fim, passou ou caiu (o resultado final segue em `Radio.classificacao`).
- `corrida-f1-classificacao.js publico` passou a mandar as `sessoes` (quantos passam em cada uma).
- 24 falas novas: 1.065 caracteres no Jeff, e o mesmo em cada engenheiro novo.
