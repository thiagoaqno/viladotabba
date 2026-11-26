# Tiro da Galera: mapa novo, o Iate Esmeralda

O Thiago pediu um mapa de navio no clima do Hijacked (Black Ops 2), mas com traçado, nome e visual nossos.

## O mapa

Um iate de luxo parado em alto-mar, com 106 × 20 m. Alpha nasce na proa e Bravo na popa.

- **Proa:** heliponto, duas lanchas nos berços e o castelo de proa fechado.
- **Salão Panorâmico:** envidraçado, com bar e sofás. Uma escada central desce às cabines, e o teto é o **Solário**, com escadas
  externas dos dois lados.
- **Convés da Piscina,** no meio: piscina elevada (com água de verdade), espreguiçadeiras e armários de convés como abrigo baixo.
  Outra escada central desce às cabines.
- **Cassino:** mesas de jogo e bar. Em cima ficam a **Ponte de comando**, cujo janelão para a proa é o posto do atirador, e o
  terraço, com escadas externas.
- **Popa:** convés aberto com sofás e bar. Duas escadas descem à **Garagem das lanchas**, aberta para o mar.
- **Embaixo:** o corredor das cabines, de ponta a ponta, com seis camarotes de cada lado e uma passagem entre dois deles de cada
  lado.
- **Passadiços laterais:** linha de tiro da proa à popa.
- **Dominação:** A no heliponto, B entre a piscina e a escada, C na popa. O mecha cai no heliponto, na piscina ou na popa.
- **Ninguém cai no mar:** a borda falsa é sólida e tem parede invisível até 4,5 m. Fora do navio não há chão (como em Stratus):
  quem passasse morreria.

## Como entra no jogo

- O código fica em `ferramentas/tiro-mapas/iate.js` e a prévia do menu em `iate.svg`. O `tiro-frontline.js` põe o código no fim
  do script do jogo, logo antes do boot, e copia a prévia. O mapa se registra sozinho (`MAP_DEFS`, `MAPS`, `MAP_ART`), sem precisar
  do `build.py` deles nem baixar assets.
- A água é a do porto (ondas, espuma, reflexo). Lá só havia mar a oeste do cais, então o iate traz a própria grade de água em
  volta do navio. O campo de espuma fica centrado nele quando o mapa é o iate (uma troca no `tiro-frontline.js`). Os outros
  mapas não mudam.
- O convés principal fica em y = 0, porque as aparições e as rotas do jogo partem do chão em 0. As cabines ficam em y = -3, o
  Solário e a ponte em y = 3.

## Conferido no navegador (só o carregamento, sem jogar)

- O mapa carrega sem erro e aparece na lista de mapas.
- 3.022 pontos de rota para os bots. Na rota principal ficam o convés, o Solário e a ponte, as cabines (836 pontos) e a garagem.
- As 3 zonas do mecha são válidas, as 28 aparições caem no convés e todos os pontos de interesse dos bots ficam na rota.
- As portas das cabines eram estreitas demais para a rota dos bots. Foram alargadas para 1,5 m e alinhadas com a grade.

Falta o Thiago jogar, no solo e no online.
