# Robôs do 100 ao 150 aprendem o ritmo de quem joga, medido contra eles na mesma corrida

Pedido do Thiago (2026-11-23, aprovado com "pode fazer"): os robôs aprendem com as voltas de quem joga, separado por pista, seco ou molhado e pneu; no 150 o robô fica 2% mais lento que o jogador, diminuindo até o 100 (o Difícil de hoje); abaixo de 100 nada muda.

## O que entra
- **Banco** (migração `055-ritmo-aprendido.sql`, `bd.js aprenderRitmoCorrida / ritmoAprendidoCorrida`): por pista, piloto, condição e pneu, a razão "volta ÷ volta ideal do carro dele com aquele pneu e aquela água". Cada corrida entra com peso 0,25 (a primeira entra inteira). Testado: 0,96 e depois 1,00 dá 0,97.
- **Coleta** (`corrida.js anotarVoltaParaRobos / aprenderRitmo`): só no fim da corrida de F1 com robôs. Ficam de fora a 1ª volta, voltas com box, com safety car, com toque em carro, com **saída de pista** (o limite de pista da direção de prova) e com mais de 2 toques no muro. Por condição e pneu entra a mediana das voltas boas.
- **Diferença de carro**: a razão é medida contra o carro de quem jogou e aplicada à volta ideal do carro de cada robô (`corrida-robos.js razaoDaVolta`).
- **Base inicial**: sem ritmo aprendido no seco, valem as voltas guardadas em `corrida_voltas_piloto`.

## A 1ª versão não mudava nada (por isso a régua nova)
Classificação pilotada de Suzuka (21 robôs, `klk/medir/quali-nivel.js`, banco com as voltas do Thiago):

| Nível | Pole | 10º | Último |
|---|---|---|---|
| 100 | 41,300 | 42,300 | 42,850 |
| 125 | 40,900 | 41,800 | 42,450 |
| 150 | 40,600 | 41,400 | 42,100 |
| 150 com o ritmo do Thiago | 40,600 | 41,400 | 42,100 |

Por quê:
1. **Do 100 para cima o alvo de tempo não acelera ninguém.** A tabela de tempo por nível trava na volta ideal (f = 1: Suzuka 43,89 com qualquer f de 1 a 1,5); qualquer alvo abaixo dela vira o nível máximo, 1,5. O 125 e o 150 já pilotam no limite do carro; a diferença entre eles vem só do carro a mais do nível (+2,5% / +5% de aderência e +3% / +6% de potência).
2. **A conta e a pista estão em réguas diferentes.** Na conta, o Thiago em Suzuka (média das 5 melhores voltas de corrida, 42,16) fica a 0,96 da volta ideal, mais rápido que o Difícil (1,005). Na pista, o robô do 100 já faz 41,30 na classificação. Juntar as duas réguas (somar aderência ao robô pela conta) deixaria o 150 ainda mais longe do Thiago em Suzuka.

## O que falta (próximo passo recomendado)
Medir o jogador e os robôs **na mesma corrida**: no fim de cada corrida, a razão do jogador dividida pela dos robôs daque## A régua nova: jogador × robôs na mesma corrida
- **Coleta dos robôs** (`corrida.js anotarVoltaParaRobos`): as voltas dos robôs passam pelo mesmo filtro (1ª volta, box, safety car, toque em carro, saída de pista, mais de 2 toques no muro).
- **Proximidade** (`corrida.js aprenderRitmo`, migração 055 `corrida_ritmo_proximidade`): no fim da corrida, com robôs do Difícil para cima (todos no limite do carro), a mediana da razão de quem joga dividida pela mediana dos robôs, tirando deles o carro a mais do nível. Por pista, piloto e seco/molhado, com o mesmo peso 0,25 por corrida. Aparece no registro: "Tabba ficou a +1,5% dos robôs do Difícil (seco)".
- **Uso** (`corrida-robos.js forcaDoReforco`): do 100 ao 150 a alavanca é a força do carro a mais (1 = o 150 de antes, +5% de aderência e +6% de potência). O alvo vai em linha reta do Difícil (100) até o ritmo do jogador + 2% (150). Nunca fica mais fácil que o nível sem o ritmo dele, e a força para em 4 (+20% / +24%). Na classificação os robôs andam como fantasmas sem o carro a mais, como antes.
- **A conta da força** (`REFORCO_POR_X = 0,012`: ritmo = 1 ÷ (1 + 0,012 · força)), medida com o Perez de Cadillac sozinho em Suzuka (3 sementes, voltas 2 a 5, `klk/medir/voltas-dbg.js` com `ROBO_REFORCO_X`):

  | Força | Mediana | Ganho medido | Pela conta |
  |---|---|---|---|
  | 0 | 52,85 | — | — |
  | 1 | 52,10 | 1,4% | 1,2% |
  | 2 | 51,50 | 2,6% | 2,3% |
  | 3 | 51,05 | 3,4% | 3,5% |
  | 4 | 50,60 | 4,3% | 4,6% |

  Com 21 robôs (4 voltas, semente 4321): força 1 deu 12 toques entre carros, força 4 deu 6. Ninguém no muro.
- **Exemplos da conta** (força no 110 / 125 / 150, e o ritmo do 150 sobre o do jogador):

  | Jogador a X dos robôs do Difícil | 110 | 125 | 150 | 150 ÷ jogador |
  |---|---|---|---|---|
  | sem dado, ou mais lento que eles | 0,2 | 0,5 | 1 | (o de antes) |
  | 0,96 | 0,35 | 0,88 | 1,77 | 1,020 |
  | 0,94 | 0,69 | 1,75 | 3,58 | 1,020 |
  | 0,90 | 1,39 | 3,56 | 4 (teto) | 1,060 |

## O que não entra
- **As 167 voltas guardadas** (`corrida_voltas_piloto`) não servem de base inicial na régua nova: são as melhores voltas, sem robôs na mesma corrida para comparar. A proximidade de cada pista começa na primeira corrida do jogador com robôs do Difícil para cima. A tabela `corrida_ritmo_aprendido` (razão por pneu) continua sendo gravada, para quando o pneu entrar na conta.
- **A régua mede corrida, não volta lançada**: a proximidade vem do ritmo de corrida (mediana das voltas boas).
- Não rodei uma corrida inteira pelo servidor com jogador e robôs; a coleta foi conferida pelo código, e a conta e o banco por scripts (`DB_PATH=:memory:`).

`node --check` em `bd.js`, `corrida.js` e `corrida-robos.js`. Sem testes novos (regra do projeto).
