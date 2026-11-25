# Meu piloto: o piloto vivo e os patrocínios da equipe no macacão

O Thiago pediu duas coisas: que o piloto da aba "Meu piloto" não ficasse parado, interagindo às vezes e com o mouse; e os patrocinadores nas roupas.

## O piloto vivo (`temporada/index.html`, `pixel-piloto.js` `camadasInteiro`)

- **As camadas:** o corpo inteiro virou três imagens do mesmo tamanho, o corpo, o braço esquerdo do piloto (à direita da tela) e a cabeça. Elas vêm com os pivôs: o ombro, o pescoço e onde ficam os olhos.
- **O mouse:** a cabeça vira e inclina para onde ele está.
- **Sozinho:**
  - ele pisca a cada 2,5 a 5 s;
  - a cada 6 a 11 s, se o mouse ficou parado, acena (o braço sobe e balança), pula ou olha em volta.
- **No clique:** pula e acena.
- **Movimento reduzido:** quem tem essa opção ligada no aparelho vê o piloto parado.

## Os patrocínios no macacão (`PATROCINIOS_EQUIPE`)

- Cada equipe tem dois patrocinadores de verdade: na Ferrari, HP e Shell; na Mercedes, Petronas e CrowdStrike; na Red Bull, Oracle e Mobil 1; e assim por diante.
- Eles entram no peito (os dois e um menor embaixo) e na perna, desenhados por cima do pixel art, em branco ou escuro no macacão claro. Cada logo cabe inteiro na sua caixa, pela proporção dele.
- No pixel art, as plaquinhas brancas do peito saem quando há equipe.

## Consertos

- No montador, um piloto sorteado mostrava "undefined" no brinco.
- A `main` tinha o `lerPixel` importado duas vezes; isso já foi consertado no #973 e trazido para cá.

## Novidades

Entraram as do #967 ao #971, que tinham ficado para depois do conserto do JSON, e a deste PR.

## Conferido

Num servidor de teste, a aba monta as 3 camadas e os 2 olhos, o clique dispara o pulo e o aceno, e o print mostra o braço acenando, a cabeça virada para o mouse e o HP e a Shell no macacão da Ferrari.
