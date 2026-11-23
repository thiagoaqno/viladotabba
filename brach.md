# Torre de posições mais animada (2 de 3 das animações)

Pedido do Thiago (2026-11-23): "animações na UI/UX do HUD da corrida. Precisam ser mais animados... especialmente a torre de troca de posições e informações novas". Vai em cima de #909 (os cards).

## O que muda (`hud.js animarLinhaTorre`, CSS no fim de `hud-cards.css`)
A torre já movia as linhas para o lugar novo (FLIP, 260 ms) e mostrava ▲/▼. Agora, quando algo muda para o mesmo piloto, a linha ganha um efeito de uma vez:
- **Trocou de posição:** um brilho atravessa a linha da esquerda para a direita, verde quando subiu e vermelho quando caiu; o número da posição gira como placar; a sigla de quem subiu dá um tranco curto.
- **Sua linha:** quando você ganha ou perde posição, um anel abre em volta dela.
- **Etiqueta nova** (BOX, DNF, punição): entra deslizando da direita; o BOX pisca de leve enquanto o carro está no box.
- **Volta mais rápida:** a linha roxa acende e volta ao normal.
- **Abandono:** a linha pisca em vermelho, fica apagada e com a sigla riscada (e desce para o fim, como antes).

Os efeitos ficam em atributos `data-tt-*`, não na classe: a classe da linha é reescrita quando muda o estado, o que cortaria a animação no meio. Com "reduzir movimento" no sistema, nada anima.

O que não fiz: as diferenças de tempo rolando a cada mudança. Elas mudam o tempo todo na corrida, e rolar a cada atualização viraria tremedeira. Quem rola é o número da batalha pela liderança (#909).

Conferido no navegador com linhas da torre montadas à mão e a animação parada no meio: o brilho verde em quem subiu, o vermelho em quem caiu, o anel na sua linha, o BOX e o DNF. Não rodei uma corrida inteira.
