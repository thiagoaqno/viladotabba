# Marcas da asa traseira legíveis no carro da frente

O Thiago mandou prints do jogo oficial: na T-cam dá para ler o ETIHAD na asa traseira das McLaren da frente. Aqui não dava.

## Por quê

As marcas da asa traseira, as que quem vem atrás lê, eram pequenas. Atrás da asa (a vista R, `marcaU`) tinham no máximo 8,5 cm de altura e em cima dela (a vista T) de 5 a 9 cm. A uns 30 m, com o campo de visão da câmera F1, 1 m da pista dá uns 40 pixels na tela (conta, não medida), então essas letras ficavam com uns 4 pixels. A resolução da folha não é o limite: a dos adversários tem uns 350 pixels por metro.

## O que mudou (`f1-pintura.js`)

- **Atrás da asa:** a altura passa a ser 1,3× a pedida, com teto de 15 cm (antes era 0,75× com teto de 8,5 cm).
- **Em cima da asa:** as marcas lidas de trás (giro `-DE_FRENTE`, s > 3,85) ficam 1,5× maiores.
- **Largura:** nenhuma das duas passa de 1 m, para não sair da asa (o flap tem ±0,57 m). A largura vem da proporção do logo real, pela `proporcaoMarca` nova em `f1-marcas.js`.
- **Nitidez:** a anisotropia das folhas de pintura subiu de 4 (adversários) e 8 (o meu carro) para 16. O three corta no máximo que a placa aceita. Não gasta memória a mais.

Os números de 1,3×, 1,5× e 15 cm são o ponto de partida, para o Thiago conferir jogando. Se alguma marca vazar para fora da asa, eles ficam todos juntos no começo de `marca` (`ASA_CIMA`, `ASA_TRAS`, `ASA_TRAS_MAX`, `ASA_LARG`).
