# Capacete: 10 estampas novas, com a textura de verdade

O Thiago pediu texturas novas para o capacete, estampas, e mandou a imagem das 10 que queria: Carbono Neon, Tigre, Geométrica, Topográfica, Bandeira Brasileira, Digital, Gradiente, Relâmpago, Onda e Hexagonal.

- **As texturas (`public/corrida/capacete-estampas/`, 372 KB):** as 10 recortadas da imagem dele em 512×512 (webp).
- **No capacete (`f1-capacetes.js`):**
  - `ESTAMPAS` traz as 10 (`t_tigre`, `t_onda`…), cada uma com as suas 3 cores, as das bolinhas da imagem.
  - `pintarFolha` envolve a cabeça com a textura: uma metade da folha com ela e a outra espelhada. Assim a frente mostra a estampa inteira, e a emenda fica nas laterais.
  - Acabamento, patrocínios, nome e bandeira continuam valendo por cima.
  - A imagem chega depois e repinta.
- **No editor (`capacete-editor-ui.js`, `capacete.css`):** a aba "Estampas" mostra as 10 miniaturas, o nome e as bolinhas de cor. O clique aplica a estampa e as cores dela.
- **No servidor (`corrida-base.js`):** `limparCapacete` aceita os desenhos `t_xxx`.
- **Conferido:** desenhei as 10 folhas planas. Não vi em 3D, porque a prévia trava no print.
