# Meu piloto: animação idle natural

O Thiago achou a animação do piloto ruim e pediu algo "idle", natural.

- **Antes:** a cada 6 a 11 s, um gesto em CSS que saltava: o braço girava 140°, a cabeça trocava de estado e o corpo pulava.
- **Agora** (`temporada/index.html`): um laço por quadro com molas suaves, sem nada que salte:
  - **Corpo:** respira (ciclo de 3,6 s) e passa o peso de uma perna para a outra (7 s), com um leve balanço.
  - **Cabeça:** segue o mouse com atraso, como um olhar. Uns 3 s depois que o mouse para, passeia o olhar devagar para os lados.
  - **Braço:** balança de leve. A cada 9 a 18 s, se o mouse está parado, faz um gesto curto, como ajeitar a luva.
  - **Clique:** um aceno de 1,7 s (o braço sobe pela mola e balança) e um pulinho pequeno.
  - **Piscar:** a cada 2,5 a 5,5 s, às vezes duas vezes seguidas.
- **Movimento reduzido:** quem tem essa opção ligada no aparelho vê o piloto parado.
- **Conferido:** num servidor de teste, o laço roda sem erros, e o print no meio do aceno mostra o braço subindo suave.
