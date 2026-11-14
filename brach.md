# Capacete: o editor novo no estilo da referência, o modelo 3D mais real e as opções novas; e o satélite sai

O Thiago mandou a tela de inspiração do capacete, com as opções novas de personalização, e pediu o modelo 3D o mais perto possível de um capacete de verdade. No meio, pediu para desfazer a imagem de satélite do #752, porque a resolução ficou baixa.

## O editor (`capacete-editor-ui.js`, `capacete.css`)

O mesmo `montarEditorCapacete` e o mesmo capacete guardado (`corrida:capacete`), na etapa Carro da sala e na aba Capacete da Central:
- **Menu à esquerda:** Desenho, Cores, Detalhes, Patrocínios, Visor e Acabamento, com ícones em SVG e a barra na cor da equipe na opção ativa.
- **Desenho:** a grade de miniaturas **em 3D, com as suas cores**, fotografadas pela própria prévia (`capacete-3d.js`, `fotografar`), 12 por página, com "1 / 2" e o selo na escolhida.
- **Cores:** casco, segunda cor e detalhes, cada uma com 12 cores prontas e o "+" para escolher outra.
- **Detalhes:** a bandeira e o nome.
- **Patrocínios:** selos inventados (Vila do Tabba, Galera Racing, Tabba Energy, Turbo Pneus), sem marca de verdade, na nuca e nos lados.
- **Visor:** as cores de antes.
- **Acabamento:** brilhante, fosco, metálico ou cromado.
- **À direita, o capacete grande:** arrastar gira, e ele não gira sozinho. Embaixo ficam as **cores principais** e o **Padrão**, com as 4 variações do desenho em miniatura (original, detalhe trocado, cores trocadas e espelhado).
- As cores saem do tema de onde o editor está: os tokens da Central (claro ou escuro) ou o escuro da sala. Ele empilha nas telas estreitas.

## O modelo 3D (`f1-piloto.js`, o mesmo da pista)

- O casco ficou mais liso (56 × 34) e **aberto embaixo**, como um capacete de verdade; o UV continua o da esfera inteira, e a pintura não muda de lugar.
- Peças escuras novas, todas seguindo a forma do casco, na mesma malha da moldura que o carro já tinha (uns 2200 triângulos por piloto, medido no Node):
  - a borracha do pescoço e o friso da borda de baixo;
  - a **aba aerodinâmica** atrás, levantada no meio;
  - o **lábio** em cima da viseira;
  - as duas **entradas de ar** da testa;
  - a **grade do queixo**.
- O acabamento vale também no capacete do carro (`acabamentoDoCasco`).

## A pintura e o servidor

- **`f1-capacetes.js`:**
  - 4 desenhos novos, angulosos como os da referência: Lâminas, Garras, Corte e Velocidade (20 ao todo);
  - a variante: as cores trocadas ou o desenho espelhado;
  - os selos de patrocínio;
  - as propriedades de cada acabamento.
- **`corrida.js`** (`limparCapacete`): aceita os desenhos novos, a `variante` (0 a 3), o `acabamento` e o `patrocinio`.

## O satélite sai

`gp-satelite.js` foi apagado. A miniatura 3D volta a usar direto o mapa desenhado do OpenStreetMap, com o crédito. Os mapas continuam com o `geo`, que não pesa e fica para outro uso.

Entrada no topo de `novidades.json`. Conferido com `node --check` e `JSON.parse`; as geometrias novas do capacete foram montadas uma vez no Node, sem teste novo. Não vi o capacete na tela. O teste jogando fica com o Thiago.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
