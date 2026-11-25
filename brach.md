# Torre: o cartão do novo líder, o seu só às vezes e também com a torre compacta; MFD tipo 2 como padrão

O Thiago pediu:
- que o cartão também aparecesse com a torre compacta;
- que, quando alguém assume a liderança, apareça o cartão dele, e não o seu;
- que o seu cartão não apareça em toda troca de posição, só às vezes;
- que o MFD novo (tipo 2) seja o padrão.

## O cartão (`hud-tv.js`)

- **Torre compacta:** o cartão aparece com a torre compacta ou completa, em qualquer estilo de HUD.
- **Novo líder:** quando a liderança muda (depois da primeira volta do líder), abre o cartão de quem assumiu, embaixo da linha dele.
- **O seu cartão:**
  - quando a sua posição muda, aparece no máximo uma vez por minuto (`MEU_INTERVALO`), e nunca por cima do cartão do novo líder;
  - ao expandir a torre, ele abre como antes.

## O MFD (`qualidade.js`, `configuracoes.js`)

- O tipo 2 virou o padrão.
- Quem tinha o "1" guardado sem ter escolhido passa para o 2. Antes, o "1" era gravado junto ao mudar qualquer opção de gráfico.
- A escolha feita pelo jogador, em Configurações ou no próprio MFD, fica marcada (`mfdEscolhido`) e é respeitada.

## Fica para depois

O Thiago contou que a página de dano do MFD tipo 2 bugou. Montada de forma estática, a página sai igual nos dois tipos, então o defeito deve aparecer só com o carro avariado. Falta um print para consertar.

## Conferido

A página do jogo carrega sem erros num servidor de teste. O cartão e o MFD não foram vistos numa corrida.
