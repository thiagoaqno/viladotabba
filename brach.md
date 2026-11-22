# Barreiras sem manchas pretas, e o cenário do editor juntado (FPS em Mônaco)

O Thiago (2026-11-21): "as barreiras ficaram cheias de manchas pretas, e eu quero uma melhoria geral de desempenho, estou com muito pouco FPS". No `servidor.log` dele, em Mônaco: 1.900 a 2.800 chamadas de desenho e 70 a 99 ms só de desenho por quadro (em Jeddah eram ~270).

## As manchas pretas (#889)
- Cada pedaço da fita levava os triângulos dos dois lados nos mesmos vértices. O `computeVertexNormals` somava a frente com o verso e a normal zerava: a barreira saía preta.
- Agora é um lado só, e o material desenha os dois (`DoubleSide`). A tampa de cima ganhou a textura que faltava.
- Conferido no navegador de teste montando Mônaco: nenhuma normal zerada.

## O cenário do editor juntado (`cenario-pista.js carregarCenario`)
- O cenário do editor chega depois de a pista juntar as malhas (`pista.js fundirEstaticos`) e ficava peça por peça. Os dois Hotel de Paris são um `.glb` com 232 malhas cada.
- Agora, quando o cenário chega inteiro, ele passa pelo mesmo `fundirEstaticos` (por material e região) e depois pelo `enxugar` do grupo inteiro (uma malha por material). As linhas compridas e o hotel passam do tamanho que a junção por região aceita. No editor, nada muda: cada peça continua clicável.
- A faixa de patrocínio usa uma textura só por marca e fundo, o painel 4 × 1 repetido ao longo do pedaço. Antes era uma por proporção de pedaço.
- Medido no navegador de teste (`buildTrack("monaco")`):

| | Antes | Agora |
|---|---|---|
| Malhas do cenário do editor | 1.825 | 392 |
| Malhas da pista inteira | 2.741 | 1.308 |

- Os 481 mil triângulos do editor agora não são cortados por região: o gargalo do log era o número de chamadas, não os triângulos.
- O FPS jogando não foi medido.
