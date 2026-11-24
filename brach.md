# Curvas inclinadas (superelevação) na Corrida F1: Zandvoort e Madri, no desenho e na física

Pedido: pôr superelevação (o asfalto inclinado para dentro) nas curvas das pistas do jogo que têm superelevação de verdade, no visual e na física, com fonte para cada número.

## Quais curvas e quantos graus

Procurei nas 25 pistas de GP do jogo. Só três curvas do calendário têm uma inclinação grande e medida:

| Pista | Curva | Graus | Trecho no jogo (fração da volta) | Fonte |
|---|---|---|---|---|
| Zandvoort | Hugenholtz (curva 3), à esquerda | 19° | 0,196 a 0,236 | [formula1.com: First look, images of Zandvoort's completed banked corners](https://www.formula1.com/en/latest/article/first-look-images-of-zandvoorts-new-banked-corners-revealed.5BXXjRKQadkAX35ZOIWR2F.html) (19° na curva 3, 18° na 14) |
| Zandvoort | Arie Luyendyk (a última), à direita | 18° | 0,856 a 0,938 | a mesma |
| Madri (Madring) | La Monumental (curva 12), à direita | 13,5° (24% de rampa) | 0,412 a 0,512 | [formula1.com: Why Madrid's La Monumental corner lives up to its name](https://www.formula1.com/en/latest/article/why-madrids-la-monumental-corner-lives-up-to-its-name.2tbqkIagDDXxFRR48YH4Ih); [Motorsport Magazine](https://www.motorsportmagazine.com/articles/single-seaters/f1/madrings-la-monumental-the-banked-corner-thats-unlike-anything-else-in-f1/) também dá 13,5° |

- **Os trechos** foram medidos na curvatura dos pontos da pista (`Pistas.pontos`): é onde cada curva vira no traçado do jogo, para o lado certo. Na Madri, 0,412 a 0,512 dá 1391 u, uns 543 m na escala desta pista; a curva de verdade tem uns 550 m.
- **Ficaram de fora:** Interlagos, Baku e as outras não têm um número de inclinação publicado (são curvas com caimento pequeno, sem medida). Indianápolis e a Monza antiga (com a curva inclinada) não estão no jogo.
- **O que não fiz:** a Autosport diz que a Hugenholtz é parabólica, de 4,5° por dentro a 19° por fora. Aqui o asfalto é um plano com o número principal (19°): as malhas da pista têm só a beira de dentro e a de fora, e um plano fica igual no desenho e na física. A inclinação entra e sai suave nas pontas de cada trecho (20% dele em cada ponta). Isso é escolha de jogo, não medida.

## Como ficou

**O campo novo** (`pistas.js`): `banking: [{ de, ate, graus, nome }]`, em fração da volta (como `muros` e `drs`). A beira de dentro fica na altura de sempre e a de fora sobe largura × tan(graus): 41,3 u na Hugenholtz, 39,0 u na Arie Luyendyk e 28,8 u na La Monumental (a pista tem 120 u de largura). Fora do asfalto, a beira alta continua um pouco e desce até o chão sem chegar no trecho vizinho da pista: cada ponto mede o quanto tem livre antes de outro trecho ficar mais perto. Na Hugenholtz, que fica perto da reta dos boxes, o barranco desce em uns 30 a 70 u; nas outras duas ele desce devagar (até 314 u). **Sem `banking`, nada muda:** `bancoDaPista` devolve null e a altura do banco é 0.

As contas ficam em `pistas.js` (`bancoDaPista`, `alturaDoBanco`, `bancoNoLado`, `senoDoBanco`), e o servidor e o navegador usam as mesmas.

**O desenho** (`banco-visual.js`, novo, chamado no fim de `buildWorld`): a cena é montada plana como sempre e depois sobe pela mesma altura da física. Assim nada do kit precisou mudar:
- as malhas compridas (o asfalto, as zebras, o chão, o escape, os muros) sobem vértice por vértice. O asfalto vira o plano inclinado, sem vão para as zebras e o chão, e o chão continua afundado 9 u embaixo da pista;
- as peças pequenas e as repetidas (arquibancadas, postes, placas, cada cópia dos InstancedMesh) sobem inteiras pela altura do lugar delas. Ficam apoiadas e sem entortar;
- depois disso, `groundH` soma o banco, e o que aparece depois (a vida da pista, os enfeites) já nasce na altura certa;
- o carro deita junto com o asfalto (`inclinacao.js`: as rodas medem o chão com o banco).

**A física** (`sim.js` + `dinamica.js`, iguais no servidor e na previsão do navegador):
- `alturaDoChao` soma o banco. O carro anda em cima do asfalto que se vê, e a subida e a descida no rumo saem sozinhas;
- `inclinacaoDeLado` mede o ângulo que o carro sente, em `amb.banco`. No plano do asfalto, a gravidade puxa para o lado baixo (m·g·sen θ) e o peso apoia m·g·cos θ. A curva feita contra a inclinação ainda aperta o carro no chão (m·a·sen θ). Vale na dirigibilidade normal e na arcade (o macio);
- essa carga a mais entra com o atrito de um pneu slick de F1 de verdade, `MU_BANCO = 1,6` ([Grokipedia, "Racing slick"](https://grokipedia.com/page/Racing_slick): 1,55 a 1,60 em condições ideais). Não usei o `mu` do jogo (2,7 a 3,5, alto de propósito), porque com ele a conta do livro, v² = gR(sen θ + μ cos θ)/(cos θ − μ sen θ), vai ao infinito perto de 20° e a Hugenholtz sairia de pé cravado. **A fonte desse 1,6 é fraca** (uma enciclopédia feita por IA, a única com número que achei). Se ele quiser a curva mais ou menos rápida, é esse número que se mexe.

**Os robôs** (`corrida-piloto.js`, `corrida-robos-linha.js`): o perfil de velocidade (`perfilNoCaminho`) recebe a inclinação de cada ponto do caminho deles (`bancoNoCaminho`) e usa a mesma conta da física: a = (aLat·cos θ + g·sen θ) / (1 − MU_BANCO·sen θ). A linha guardada em `corrida-linhas-f1.json` não mudou (não rodei `ferramentas/gerar-linhas-f1.js`). Só a velocidade em cima dela muda. Medido no perfil do piloto ideal da McLaren (nível 1):

| Curva | Mínima antes | Mínima agora |
|---|---|---|
| Hugenholtz | 166 km/h | 219 km/h |
| Arie Luyendyk | 277 km/h | 321 km/h |
| La Monumental | 219 km/h | 276 km/h |

A volta no perfil caiu de 34,62 s para 34,10 s em Zandvoort e de 36,48 s para 35,87 s em Madri.

**O cenário de cada pista:** em Madri, a passarela do kit ia a 0,5 da volta, em cima da La Monumental. `gps/madri.js` tira esse lugar da lista, e ela vai para as outras retas. Em Zandvoort, a rampa de concreto que "contava" a inclinação por fora (`kit/zandvoort/curvas.js`) continua no lugar; só o comentário mudou, porque a pista agora inclina de verdade. Na Hugenholtz ela fica no pé do barranco: se ficar estranho, dá para tirar.

**Programa de PC:** `PROTOCOLO` subiu de 1 para 2 em `corrida-pc.js`. A física dessas curvas mudou, e o programa velho preveria errado nelas. Ele fica local e pede a atualização. Há uma entrada nova no topo de `public/corrida/novidades.json` (conferida com `JSON.parse`).

## Conferido
- `node --check` em todos os arquivos mudados (os de `public/corrida/` como módulo, quando são módulo).
- Em Node: na Hugenholtz, a altura do chão vai de 10,8 (beira de dentro) a 52,1 (beira de fora), com o eixo a 31,4. O carro andando no rumo da pista sente 18,99°. Monza (sem `banking`) dá 0 e a altura de sempre.
- Sem prints nem teste novo: o Thiago testa jogando. A suíte roda no CI; se algum teste quebrar só porque o tempo de volta de Zandvoort ou Madri mudou, ele é apagado e anotado aqui.
