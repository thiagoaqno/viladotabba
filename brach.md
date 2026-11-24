# Robôs da Corrida em módulos (refatoração, sem mudar comportamento)

Pedido do Thiago (2026-11-24): "vamos refatorar o viladotabba. 1 pr só." O escopo escolhido foi a Corrida no servidor, começando pelo maior arquivo da F1: `corrida-robos.js`, que tinha 1515 linhas (146 KB).

## O que mudou
O `corrida-robos.js` continua sendo a porta de entrada (o servidor, a carreira, as ferramentas e os testes seguem pedindo só ele, com as mesmas 38 exportações), mas agora tem 579 linhas: a largada, o `passo`/`passoF1` e o box na pista. O resto foi para cinco partes, com o texto de cada função e cada comentário igual ao de antes:

| Arquivo | O que tem |
|---|---|
| `corrida-robos-base.js` (53 linhas) | nomes, a régua de nível (0 a 150, `MARCA_NIVEL`, `forcaDoNivel`, `porNivel`), as margens e limites do carro físico |
| `corrida-robos-linha.js` (283) | o traçado de cada pista (e o preparo em outra thread), o que os robôs aprendem com as voltas da galera, o perfil de velocidade (`perfil`, `perfilF1`, `tempoDaVolta`, `idealDe`) |
| `corrida-robos-ritmo.js` (233) | o ritmo por nível (`FOLGA_F1`, `EMPURRAO_F1`, o carro a mais acima de 100), a classificação, `acertoDoRobo` e o aquecimento dos níveis |
| `corrida-robos-transito.js` (307) | `transito` (lado, ultrapassagem, defesa), o contato entre os círculos dos carros e a escala do carro (`L_CARRO`) |
| `corrida-robos-box.js` (115) | a estratégia de box: `decidirParada`, `escolherComposto`, a troca pelo clima |

## Como foi feito
- O corte foi feito por um script, bloco por bloco, sem reescrever o texto das funções: cada parte importa o que usa das outras, e a ordem não tem ciclos (base → linha → ritmo → transito → box → corrida-robos).
- Os três valores que mudam durante o jogo e são lidos em outra parte (`L_CARRO`, que muda com a escala; `fonteAprendido` e `fonteRecorde`, que o servidor liga ao banco) são lidos pelo módulo (`TransitoRobo.L_CARRO`, `LinhaRobo.fonteRecorde(...)`), para valer sempre o valor de agora. Foram as únicas cinco linhas de código que mudaram.
- Saiu o `require("./corrida-linha.js")`, que não era usado aqui (só aparecia num comentário; o `corrida-piloto.js` continua carregando ele).

## Conferido
- `node --check` nos seis arquivos.
- Toda linha do arquivo antigo está num dos novos (fora as cinco acima e o `require` que saiu).
- Uma segunda checagem, pelo texto, não achou nenhum nome de outra parte usado sem importar.
- Ao carregar o módulo novo e o antigo, saem as mesmas 38 exportações, com os mesmos valores.
- A suíte roda no CI.

## O que ficou de fora
O `corrida.js` (1092 linhas) é uma função só, de 1000 linhas, com o estado das salas compartilhado por closure. Separar isso não é um corte mecânico como o dos robôs e fica para um PR próprio.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
