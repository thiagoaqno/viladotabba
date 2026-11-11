# Robôs de F1: o difícil para de rodar (sem grip falso)

## O problema
O #692 subiu o difícil para 1,2. No perfil do robô (`Piloto.perfilDoNivel`) esse nível vira `latK = f * f` sem teto: 1,2 pede 44% a mais de aceleração lateral do que o pneu segura. O robô entra rápido demais, roda, bate e fecha a volta mais devagar do que o médio.

## A correção
- `corrida-piloto.js`: `latK` para em 1, como o `freioK` já parava. O robô nunca mira uma curva acima do que o pneu segura.
- `corrida-robos.js`: o difícil volta a 1 no `EMPURRAO_F1` (com o teto, qualquer valor acima de 1 dá o mesmo ritmo).

## Medido
Bancada: um robô sozinho, pista seca, pneu macio novo a cada volta, sementes 951 e 952, voltas 2 e 3.

Mônaco, Verstappen na Red Bull:

| nível | antes (main) | depois |
|---|---|---|
| fácil | 55,6 a 56,2 s | igual |
| médio | 50,1 a 50,9 s, 2 batidas/volta | igual |
| difícil | 58,8 a 66,1 s, 4 a 6 batidas/volta | 50,1 a 50,9 s, 2 batidas/volta |

Difícil em outras pistas (Norris na McLaren), melhor volta antes → depois: Interlagos 39,05 → 38,60 s; Monza 42,50 → 39,75 s; Silverstone 50,90 → 44,80 s; Suzuka 52,15 → 44,25 s (sem batidas antes nem depois: era só a curva lenta por causa do excesso).

## O que fica para depois
Com o teto, o difícil fica igual ao médio. Os caminhos medidos para ganhar ritmo sem inventar grip deram pouco:
- frear mais tarde (`PILOTO.antecipa` 0,28 → 0,22): −0,15 s em Mônaco, +0,1 s em Interlagos e Monza;
- deixar o ERS passar da velocidade final na reta: nada (o robô não chega na final nessas pistas);
- mirar mais perto no volante: pior (51 a 54 s).

O que ainda custa tempo em Mônaco nos três níveis: duas batidas por volta no muro da saída da chicane do túnel (fração 0,655, a ~265 km/h na conta do jogo), onde o carro passa 4 u para fora da linha que já encosta no limite.

`node --check` em `corrida-piloto.js` e `corrida-robos.js`: ok.
