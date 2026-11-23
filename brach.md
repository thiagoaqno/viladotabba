# Telas do fim da classificação mais perto das referências (QUALIFYING e RACE DAY), tudo reagindo ao mouse

Pedido do Thiago (2026-11-23), com as duas imagens de referência do GP de Mônaco: as telas estavam "meio longe da referência" e "os elementos devem ser responsivos ao mouse".

## QUALIFYING (o resultado final e a pausa entre Q1, Q2 e Q3)
- Topo com a marca e o caminho, "QUALIFYING" grande, "RESULTADO" espaçado e a linha vermelha.
- Tabela POS | PILOTO (barra fina na cor da equipe) | EQUIPE (logo + nome) | TEMPO. Top 5 maior, a 1ª linha mais clara; do 6º ao 10º menor e mais apagado, depois do separador; do 11º em diante num "Do 11º ao 20º" que abre.
- Cartão POLE POSITION inclinado: a foto do piloto saindo por cima do cartão (com as bordas esfumadas), o primeiro nome fino, o sobrenome grosso em itálico, a equipe com o logo e o tempo grande.
- Rodapé: o traçado da pista, a bandeira, "GP DE MÔNACO / CIRCUIT DE MONACO" e o botão "CONTINUAR →" inclinado.
- Fundo: a foto do GP escurecida, a faixa diagonal escura e os riscos vermelhos.
- Na pausa entre as sessões, a tabela inteira rola por dentro e o rodapé (com "LARGAR PARA O Q2") fica sempre à vista.

## RACE DAY
- Topo: a marca, "GP DE MÔNACO › RACE DAY" e, à direita, a sua equipe com o logo. "RACE DAY" em itálico, "Prepare-se para a corrida" e a linha laranja.
- GRID DE LARGADA: o top 5 (posição, logo, equipe, piloto, tempo e diferença), o separador e a sua linha em laranja, mais as punições de grid.
- ESTRATÉGIA: pneu de largada, paradas e vida do pneu (o jogo não tem temperatura nem combustível, por isso não aparecem).
- À direita: o cartão do GP (foto, nome, voltas e km, chuva, pista, aderência) e, embaixo dele, a escolha do PNEU DA LARGADA (antes ficava dentro da estratégia e empurrava os botões para fora da tela).
- Rodapé: "← VOLTAR", "ACERTO E PONTOS" e o botão laranja inclinado "IR PARA O GRID →".

## Mouse
- Linhas da tabela e do grid: fundo na cor da equipe, a linha anda um pouco para o lado e o logo cresce. A animação de entrada passou de `both` para `backwards`: com `both` ela segurava a posição e o movimento do hover não aparecia.
- Cartões (pole, grid, estratégia, GP, pneus): sobem um pouco e a borda acende; a foto cresce. Botões: o inclinado acende, a seta anda.

## Janela menor
- Altura baixa (até 760 px): título, cartão da pole e linhas mais compactos.
- O rodapé com os botões fica preso embaixo (`position: sticky`) quando a tela precisa rolar.
- Estreita (até 900 px) uma coluna só; celular (até 560 px) esconde o nome da equipe e o traçado, sem rolagem para o lado.

Conferido no navegador com um estado de teste de Mônaco (Norris na pole com 1:09.673, você em 7º) em 1600 × 900, 1100 × 640 e 375 × 812. `node --check` no `pos-quali.js`.

Arquivos: `public/corrida/pos-quali.js`, `public/corrida/pos-corrida.css`, `public/corrida/novidades.json`.
