# Mônaco igual ao editor na corrida, e o replay 3D fluido e com som

Pedido do Thiago (2026-11-21): "você mudou completamente minha Mônaco, colocando barreiras onde eu tirei... no replay fica exatamente como eu fiz" e "o replay 3D é travoso, parece que o carro teleporta, além de não ter som".

## Mônaco: a pista montada antes do cenário do editor
- Os ajustes do editor (as peças escondidas ou mexidas, `cenario/<pista>.json ajustes`) só valem antes de juntar as malhas (`pista.js`). O arquivo chega pela rede sem a pista esperar.
- O lobby monta a pista assim que a página abre (`jogo.js prepararPista`). Quando ela ficava pronta antes do arquivo, era guardada assim, sem os ajustes, e a corrida usava essa. As barreiras tiradas voltavam. O replay abre depois, com o arquivo já carregado, e por isso ficava certo.
- Agora o `prepararPista` espera o cenário (`cenario-pista.js cenarioPronto`), e o `buildTrack` não guarda uma pista montada sem ele (`cenarioCarregado`). Se a largada chegar antes do arquivo, raro, aquela corrida ainda sai sem os ajustes, mas a próxima já vem certa.
- Não foi visto na tela: é uma conta de tempo, conferida no código.

## Replay 3D: as amostras na hora certa
- A amostra de 250 ms saía no primeiro passo do laço do servidor depois da hora dela: até 100 ms atrasada, e 150 a 280 ms quando o laço atrasava, como no `servidor.log`. O replay punha essa posição na hora certa, e o carro pulava. Com o laço atrasado mais de 250 ms, uma amostra nem existia e o tempo encolhia.
- `corrida-gravacao.js`: cada amostra é a posição na hora dela, interpolada entre o passo de antes e o de agora. A fração da volta e o giro vão pelo caminho mais curto, e um salto grande não mistura. Todas as amostras que ficaram para trás são escritas.
- Conferido com um laço falso de 100 ms e uma travada de 600 ms: 6 amostras (as esperadas), cada uma na posição da hora dela (100, 200, 300…).
- Vale para as corridas gravadas daqui em diante.

## Replay 3D com som
- `replay-3d.js`: o motor do carro seguido, com o mesmo som do jogo (`Sound.engine`). A rotação vem da velocidade e da marcha gravadas (`cambio.js rotacao`), o som segue a câmera, e fica mudo pausado, para trás ou acima de 2×. Não foi ouvido.
