# Acabamento do carro: cromado, metálico, brilhante, acetinado ou fosco

O Thiago pediu a opção de escolher o material do carro, o acabamento.

- **A escolha (`acabamento-carro-ui.js`, novo):** fica na gaveta da sala, na seção Pintura, com uma amostra de reflexo para cada opção: Cromado (o de antes, que continua o padrão), Metálico, Brilhante, Acetinado e Fosco. Fica guardada neste navegador.
- **O material (`f1-pintura.js`):** `aplicarVerniz` aceita um perfil por acabamento, com:
  - a camada acetinada ligada ou não;
  - a tinta metálica ou não;
  - a rugosidade da tinta (o brilhante bem liso, o fosco bem áspero);
  - a força do verniz.
  - Os outros carros seguem o acetinado de sempre.
- **No carro (`f1.js`):** o seu carro, o do volante vivo, usa o acabamento escolhido. Cada acabamento é um programa de shader próprio, com a chave de cache dele.
- **Quando vale:** a partir da próxima corrida, porque o material é montado na largada.
- **Não conferido:** não vi o carro com cada acabamento numa corrida. O shader só compila quando o carro aparece, então um erro nele só aparece jogando.
