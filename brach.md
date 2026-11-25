# HUD "Transmissão (TV)": a torre da transmissão como opção

O Thiago mandou prints de uma transmissão do jogo da F1 e pediu algo próximo disso **como opção**, principalmente na torre e no MFD. Este PR faz a torre e a caixa de marcha. O MFD fica para o próximo.

## O estilo

É o quarto estilo de HUD (`ESTILOS_HUD` em `hud-telemetria.js`): `tv`, "Transmissão (TV)". Ele aparece em Configurações > Geral, no MFD e no ciclo da tecla H, e liga `#race.hud-tv`. Os outros estilos não mudam.

- **`hud-tv.css`, a torre:**
  - o logo da F1 grande no alto e a volta embaixo dele;
  - linhas mais altas no azul-escuro;
  - o número do líder no vermelho e a sua linha branca;
  - a letra do pneu, sem o círculo, no fim da linha;
  - o relógio roxo da volta mais rápida do lado de fora, à esquerda, sem pintar a linha de roxo.
- **`hud-tv.js`**, chamado pela torre em `hud.js` (`hudTv`):
  - **Batalha:** o card de distância do seu carro (`gapF1`) vira faixa dentro da torre: "BATALHA PELO Nº" acima do da frente e a diferença grande entre as duas linhas, rolando quando muda. O card do canto some neste estilo.
  - **Cartão do piloto:** quando você ganha ou perde posição, a sua linha abre embaixo, por 6 s, um cartão na cor da equipe com o número, o nome e a equipe. Não há fotos dos pilotos, então vai só o número grande.
  - **Novo líder:** quando a liderança troca, depois da primeira volta do líder, aparece uma faixa no alto, no meio, com o sobrenome na cor da equipe e o logo, por 4 s.
  - **Caixa de marcha:** embaixo à direita, no lugar do mostrador grande: GEAR, a velocidade, KM/H e a bateria do ERS em %. A % fica amarela cheia ou desdobrando, azul no meio e vermelha abaixo de 20%. O MFD e o botão dele sobem para cima dela.
- As faixas não mexem na classe das linhas: `hud.js` reescreve essas classes. O espaço delas é a margem da linha, e as faixas são posicionadas pela posição da linha na tela.

## Fica para depois

- **O MFD no estilo dos prints:** o painel de vidro ao lado do halo, com as linhas "‹ valor ›" e a janela de parada. A tela de temperaturas dos prints não entra, porque o jogo não simula a temperatura dos pneus nem dos freios.
- **O card de baixo com os dois pilotos e as velocidades.**
