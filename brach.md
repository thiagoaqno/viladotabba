# Tiro da Galera: volume próprio para a voz do rádio

O Thiago pediu para separar a voz do "narrador" do resto dos sons. No jogo original, as falas do rádio só tinham liga/desliga e
saíam no mesmo volume geral dos tiros.

## O que mudou

- **Opções > Áudio > "Volume da voz do rádio"**, logo abaixo de "Anúncios de voz". Vai de 0 a 150% por cima do volume geral,
  então dá para deixar a voz mais alta que os tiros ou bem baixinha. O padrão é 100%, que é o som de antes.
- **O controle vale para a fala e para o chiado de abrir e fechar o rádio.** O sinal musical que toca antes do anúncio não muda.
- **O valor fica nos ajustes do jogo** (`dc_settings.vozVol`), então vai junto com o perfil da Vila para os outros aparelhos.
- Tudo é feito por `ferramentas/tiro-frontline.js`, com cinco trocas no código pronto do jogo.

## Conferido no navegador

Num servidor local, o controle apareceu na aba Áudio com 100%. Coloquei em 130%: o jogo passou a usar o valor novo e ele ficou
guardado no navegador.
