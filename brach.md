# Carreira de F1: a aba "Meu piloto"

O Thiago pediu que a carreira de F1 tivesse uma guia "Meu piloto" para montar o piloto em pixel art.

- **A aba (`temporada/central.js`):** "Meu piloto" entra na Central, entre "Capacete" e "Contratos". Ela funciona como a aba Capacete: a Central marca o lugar (`data-cx-piloto`), e o módulo de `temporada/index.html` (`window.PilotoCarreira`) põe ali o montador. Ele é o mesmo da sala (`piloto-pixel-editor.js`), com a prévia no macacão da sua equipe da carreira.
- **Onde fica guardado:** neste navegador, o mesmo do montador da sala. Vai para a pista na próxima corrida, porque a carreira passa pela classificação, onde o piloto é enviado (`sincronizarPixel`).
- **Conserto:** o montador importava o `estado.js` direto, e ele depende do `Comum` que só existe na página do jogo. Na Central, isso derrubava o módulo inteiro. Agora o `estado.js` só é carregado quando o montador fala com a sala. Na sala, a cor do macacão e o nome para o sorteio entram pelas opções de `montarMontador` (`cor` e `nome`).
- **Conferido:** a página da carreira e a do jogo carregam num servidor de teste, e o montador aparece e responde nas duas. Na carreira, o único aviso é o ícone da aba (`favicon`), que já faltava antes.
