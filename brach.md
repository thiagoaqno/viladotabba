# O assobio do motor, o motor elétrico, e as falas do box que pareciam confirmar sozinhas

Pedido do Thiago (2026-11-21): "tem um assobio que sobe junto com o motor sempre; o motor elétrico não tem som" e "às vezes parece que confirmou o box, mas eu não escolhi ir". Não foi ouvido: conferido com `node --check`.

## Som (`motor-v6.js`)
- **O assobio do turbo** ficava ligado o tempo todo e alto até em marcha lenta (0,008 + 0,032 × turbo²). Agora vai com o cubo do turbo: quase some com o turbo baixo e, no máximo, fica num terço do volume de antes. O sopro de tirar o pé não mudou. O dos outros carros caiu de 0,05 para 0,02.
- **O motor elétrico (MGU-K)** estava em 0,016, enterrado embaixo do turbo. Agora soa claro quando entrega (o ERS ligado) e quando recarrega (no freio e no super clipping), e fica mudo no resto. O tom segue a velocidade, de ~600 Hz parado a ~3,3 kHz a 330 km/h, sem os degraus das marchas que confundiam com o motor.
- **O chiado do câmbio** ficou um terço mais baixo.

## Rádio do box
- A sugestão do MFD tocava "Box, box. Vamos de pneu macio", a mesma fala de quando você confirma. Agora ela pergunta: `sugere<pneu>`, "Sugerimos o box nesta volta, com pneu macio. Confirma?".
- O pneu no fim (`hud.js`) tocava "Box, box. Entre nesta volta". Agora avisa: `pneufim`, "Os pneus acabaram. Se quiser parar, estamos prontos.".
- "Box, box, vamos de <pneu>" só sai quando o box foi pedido de verdade (`box.js avisar`: a tecla, o MFD, a sugestão confirmada, o Jeff), 0,9 s depois de parar no mesmo pneu. Quem passa pelos pneus na tecla ouve só o último. O Jeff não fala mais duas vezes.
- 22 falas novas: rodar o `Falas novas da Corrida.bat` (1.101 caracteres).
