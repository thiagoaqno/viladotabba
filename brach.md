# As barreiras de patrocínio moldadas à pista

Pedido do Thiago (2026-11-21): "as barreiras de patrocínio com arame triplo fazerem curvas e se moldarem com a inclinação... melhorar as emendas, e não serem pedaços quadrados".

- `cenario-pista.js`: a "faixa" e a "faixa com tela" do editor (39 linhas em Mônaco) viraram uma fita contínua (`fitaDePatrocinio`).
  - Cada ponto da linha é um vértice, na altura do chão dele (a beira da pista, com o relevo).
  - Os dois pedaços vizinhos usam o mesmo vértice, com o lado pela média das duas direções. O canto fecha: sem vão por fora e sem um pedaço entrando no outro por dentro.
  - A tela, os três fios de arame e a tampa de cima seguem a subida. Os postes ficam de pé em cada ponto, com o braço dobrado para a pista.
- Antes era um bloco reto por pedaço, na altura média dos dois pontos e virado só no plano: na subida virava degrau, e na curva abria vão.
- As marcas, os fundos e o painel alternado (`marca2`/`fundo2`) continuam por pedaço. A colisão não muda (`murosDoCenario` segue os pontos).
- Conferido no navegador de teste montando Mônaco (`buildTrack`): sem erro, e nenhum vértice com número inválido. Não foi visto na tela (sem print).
- As barreiras que voltaram onde ele tirou eram o cenário montado antes do arquivo do editor chegar, já corrigido em #888.
