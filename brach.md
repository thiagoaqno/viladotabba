# Tiro: peças rurais, comerciais e de bairros no editor

O editor ganha 37 peças nos grupos Rural, Centro comercial e Bairros. As construções acessíveis têm pontos locais em `KC_BR`; vitrines e portas de vidro usam `KC_VIDROS`, e escadas usam `KC_ESCADAS`. Os pontos não adicionam armas automaticamente. A documentação traz as dimensões aproximadas e a descrição de cada peça. Nenhum mapa existente foi alterado.

A galeria tem quatro lojas por piso, escada interna e acesso ao terraço. O prédio comercial tem térreo acessível e andares superiores de cenário; sua escada externa leva à laje. A rampa e o tabuleiro do viaduto são módulos separados. Peças com escada devem girar em múltiplos de 90 graus.

Conferido com `node --check` em `pecas.js` e `editor.js`; o jogo foi remontado e o catálogo mostrou os grupos com as peças, sem indicação de parâmetros ausentes. Uma partida abriu com a galeria colocada. **Rascunho:** o navegador integrado não manteve a captura do mouse, então ainda falta verificar andando os interiores, as escadas e as colisões; as miniaturas de todas as peças também não foram inspecionadas individualmente.

As posições abaixo são `[x, y, z]` locais; D é `dentro` e L é `laje`. Um travessão indica que não há ponto registrado. As medidas são largura x altura x profundidade em metros e são aproximadas.

| Peça | Tamanho | Entrada | Escada até piso alto | KC_BR |
|---|---|---|---|---|
| `kcComGaleria` | 26,4 x 6,8 x 14 | Sim | Sim | D `[-10.5,0.1,-4.5]`, `[-1,0.1,-4.5]`; L `[-5,3.05,-4.5]`, `[0,6,0]` |
| `kcComSupermercado` | 20 x 3,4 x 16 | Sim, após quebrar a porta de vidro | Não | D `[-4,0.1,-6.8]`, `[0,0.1,0]`, `[4,0.1,0]` |
| `kcComPosto` | 20 x 4,5 x 16 | Loja | Não | D `[-6,0.1,-4]` |
| `kcComEstacionamento` | 18 x 3 x 12 | Cabine | Não | D `[7.4,0.1,4]` |
| `kcComCarro` | 4,4 x 1,7 x 2 | Não | Não | — |
| `kcComBanco` | 10 x 3,4 x 8 | Sim, após quebrar a porta de vidro | Não | D `[0,0.1,0]`, `[2,0.1,1.5]` |
| `kcComFarmacia` | 8 x 3,4 x 8 | Sim | Não | D `[0,0.1,-1]`, `[0,0.1,1.5]` |
| `kcComLanchonete` | 8 x 3,4 x 8 | Sim | Não | D `[0,0.1,-1]`, `[0,0.1,1.5]` |
| `kcComRoupas` | 8 x 3,4 x 8 | Sim | Não | D `[0,0.1,-1.5]`, `[0,0.1,1.5]` |
| `kcComPredio4` | 40 x 12,7 x 14,4 | Térreo | Sim | D `[10,0.1,0]`; L `[9,11.9,-1]` |
| `kcComPassarela` | 31,2 x 5,8 x 2,4 | Não | Sim | L `[0,4.9,0]` |
| `kcComPlaca` | 3 x 0,7 x 0,11 | Não | Não | — |
| `kcComPlacaServico` | 3 x 0,7 x 0,11 | Não | Não | — |
| `kcBaiEscola` | 28 x 4,8 x 20 | Sim | Não | D `[-10,0.1,-4]`, `[-4,0.1,-4]` |
| `kcBaiIgreja` | 14,4 x 5,8 x 16 | Sim | Sim | D `[-3.2,0.1,0]`, `[-3.2,0.1,-5.8]`; L `[2.8,3.05,-3.2]` |
| `kcBaiSaude` | 14 x 3,4 x 8 | Sim | Não | D `[-4,0.1,-2]`, `[4,0.1,-2]`, `[0,0.1,0.5]` |
| `kcBaiEstacao` | 24 x 5,5 x 29,4 | Bilheteria | Sim | D `[-8,0.25,-7.3]`; L `[0,4.6,0]` |
| `kcBaiViaduto` | 12 x 7 x 8 | Sob o tabuleiro | Rampa separada | L `[0,6.1,0]` |
| `kcBaiRampaViaduto` | 12,6 x 7 x 8 | Não | Sim | L `[5.1,6.1,0]` |
| `kcBaiCondominio` | 24 x 5,9 x 16 | Sim | Sim | D `[-9,0.1,5]`, `[0,0.1,-5]`; L `[3.3,3.05,-1]` |
| `kcBaiLavaRapido` | 12 x 3,8 x 10 | Sim | Não | D `[0,0.1,0]`, `[2,0.1,2]` |

As peças rurais e os pontos correspondentes estão documentados no guia e na seção rural de `pecas.js`.
