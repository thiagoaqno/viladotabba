# Corrida no servidor em módulos: corrida-robos.js e corrida.js (refatoração, sem mudar comportamento)

Pedido do Thiago (2026-11-24): "vamos refatorar o viladotabba. 1 pr só." O escopo escolhido foi a Corrida no servidor: os dois maiores arquivos da F1, `corrida-robos.js` (1515 linhas, 146 KB) e `corrida.js` (1092 linhas, 99 KB).

## Os robôs (`corrida-robos.js`)
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
- `node --check` nos seis arquivos dos robôs.
- Toda linha do arquivo antigo está num dos novos (fora as cinco acima e o `require` que saiu).
- Uma segunda checagem, pelo texto, não achou nenhum nome de outra parte usado sem importar.
- Ao carregar o módulo novo e o antigo, saem as mesmas 38 exportações, com os mesmos valores.
- A suíte roda no CI.

## A sala (`corrida.js`)
Era uma função só (`attachCorrida`, 1000 linhas), com tudo dentro dela vendo `rooms` e `nsp`. Agora o `corrida.js` tem 61 linhas: abre o canal, chama as partes em ordem e devolve o mesmo de antes (`abrirGP`, `abrirGPGrupo`, `salaGP` e os `internos` que os testes usam). Cada parte é uma função `(C) => { ... }`: pega de `C` o que as partes de antes já devolveram e devolve o que as de depois usam. O texto de cada função ficou igual.

| Arquivo | O que tem |
|---|---|
| `corrida-base.js` (49 linhas) | as constantes (tempos da TV e da largada, limites, cores e bonecos), `limparCapacete` e a medição do laço (`CORRIDA_PERF`) |
| `corrida-sala.js` (155) | `cleanConfig`, o estado que vai para os navegadores (`publicState`, `broadcast`, snaps), as equipes, os carros, as falhas, o ponto de cada carro na volta |
| `corrida-voltas.js` (293) | os setores (`onSector`, `fecharSetor`), a chegada (`endRace`), os recordes, a parada no box, as batidas e as rixas, o que os robôs aprendem com quem joga |
| `corrida-largada.js` (214) | o carro de quem joga no servidor (`ligarHumanos`), a espera do traçado e da carga, `startRace`, o clima, a classificação |
| `corrida-gp.js` (80) | os GPs da carreira: `abrirGP`, `abrirGPGrupo`, a TV da temporada, quem assume o carro de quem cai |
| `corrida-conexao.js` (336) | o `connection` do canal `/corrida`: criar e entrar na sala, os comandos, a saída |

A ordem é sala → voltas → largada → gp → conexao, sem ciclo, com uma exceção: `onSector` (voltas) avisa a classificação, que nasce depois, na largada. Essa linha lê `C.classificacao` na hora do uso, e foi a única linha de código que mudou aqui.

Conferido do mesmo jeito: `node --check` nos sete arquivos; toda linha do antigo está num dos novos (fora essa); nenhum nome usado sem vir do próprio arquivo, de um `require` ou de `C`; e, montando o antigo e o novo com um canal de mentira, saem o mesmo retorno, os mesmos `internos`, os mesmos exports do módulo e o mesmo evento ligado no canal.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
