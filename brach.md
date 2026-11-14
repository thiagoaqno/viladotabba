# Análise repaginada: Replay primeiro, tela cheia, ícones, logos e o tempo certo das ultrapassagens

Pedidos do Thiago depois do #747.

## Correção: "Ver no replay" mostrava a ultrapassagem segundos depois

- O laço das regras de F1 roda a cada 100 ms, e a gravação pegava uma amostra "250 ms depois da última", o que na prática dava 300 ms. A tela converte o tempo em amostras contando 250 ms cada, e a conta passava do ponto (com 100 s de corrida, uns 17 s de erro).
- Agora a próxima amostra é marcada no relógio, em t0 + k × 250 ms (`corrida-gravacao.js`); rodando à mão, 30 s deram 121 amostras.
- Cada ultrapassagem guarda `j`, a amostra exata em que os dois trocaram. As gravadas antes desta correção usam o tempo dividido por 0,3 s.
- "Ver no replay" abre de 8 s antes até 4 s depois, com a câmera no lugar da ultrapassagem.

## Replay

- É a primeira aba e a que abre, na tela do resultado e na Central.
- "Seguir" começa desligado.
- O botão de tela cheia põe a pista, a torre, a barra do tempo e a telemetria inteiras em tela cheia (`requestFullscreen`).

## Repaginada

- **Sem emoji na interface:** os ícones dos momentos (largada, pit, batida, punição, bandeira, recorde, rádio) e os botões (tocar e pausar, zoom, centralizar, tela cheia, seta, fechar da vista do carro) são SVG de linha.
- **O logo da equipe no lugar das faixas de cor:** na lista de momentos, na torre do replay, na telemetria, nos pneus, nas ultrapassagens e nas legendas e listas das sub-abas antigas da Central.
- **A escolha do piloto:** os seletores A (de quem é a análise) e B (com quem comparar) têm o logo da equipe.
- **Momentos no layout das referências:**
  - um cartão com o mapa 3D, com a legenda dos setores e os botões de aproximar, afastar e ver a pista inteira (`gp-miniatura.js`, `aproximar`);
  - um cartão com a lista, em filtros de abas e ícones;
  - embaixo, os **setores de cada volta** do piloto A: roxo é o melhor da corrida naquele setor, verde o melhor dele, amarelo os outros. Clicar numa volta filtra os momentos dela.
- **Cartões arredondados**, também no tema claro e escuro da Central.
- **Cabeçalho da Análise na Central:** o rótulo "/ Análise da corrida", o nome do GP grande e "Etapa X / Y · circuito".
- O X de quem abandonou, no gráfico das posições, é desenhado (antes era um caractere).

Entrada no topo de `novidades.json`. Conferido com `node --check` e `JSON.parse`; a amostragem foi rodada uma vez à mão, sem teste novo. O teste jogando fica com o Thiago.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
