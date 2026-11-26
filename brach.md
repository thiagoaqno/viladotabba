# Tiro da Galera: oito camuflagens novas de arma

O Thiago pediu skins novas para o Tiro e escolheu camuflagens de arma, com os motivos por nossa conta.

## As camuflagens

Elas saem pelo nível da arma, uma por nível entre o Diamante (20) e o Holo (30):

| Nível | Nome | Como é |
|---|---|---|
| 21 | Carbono | Fibra de carbono trançada, meio brilhante |
| 22 | Onça | Dourado com as rosetas e pintas da onça-pintada |
| 23 | Selva | Folhas tropicais de vários verdes, com nervura clara |
| 24 | Canarinho | Digital verde e amarelo, com um pouco de azul |
| 25 | Maré | Ondas em azul-petróleo com espuma nas cristas (combina com o Iate Esmeralda) |
| 26 | Grafite | Jatos de spray coloridos e escorridos sobre o cinza, com rabiscos pretos |
| 27 | Galáxia | Nebulosas roxas e azuis, cheias de estrelas |
| 28 | Rubi | Pedra lapidada em vermelhos, metálica e polida |

## Como entrou

- O código fica em `ferramentas/tiro-camos/camuflagens.js`. O `tiro-frontline.js` coloca ele logo antes do boot, como o mapa do iate.
- Cada camuflagem é desenhada numa tela que se emenda nas bordas, como as do jogo. Elas usam o mesmo shader, sem textura nova
  para baixar.
- A lista do menu ficou em ordem de nível, com as novas entre o Diamante e o Holo.
- No online, a arma com camuflagem nova é aceita (os nomes só têm letras minúsculas, como a chave da arma pede).

## Conferido no navegador

- As 18 camuflagens aparecem em ordem e as miniaturas são desenhadas sem erro.
- O material da arma na mão e o da arma do soldado são montados com as camuflagens novas.
- A chave online `m4~~galaxia` é reconhecida.

Falta o Thiago ver as camuflagens nas armas jogando.
