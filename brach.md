# O pós-corrida interativo na carreira solo e com os amigos

O Thiago pediu que tudo do pós-corrida (#742, #743 e #744) também ficasse na carreira, solo e com os amigos. Na tela do resultado do GP de carreira a análise já aparecia, porque é a mesma sala da Corrida. O que faltava era guardar o GP e mostrar tudo na Central depois: as posições, os momentos, as ultrapassagens, o replay com a telemetria, o ritmo e os pneus, além do guia do GP e da vista do carro.

## Servidor

- **Replay guardado** (migração `054-corrida-replays.sql`, `bd.js`): tabela `corrida_replays` por dono (`solo:<id>` ou `grupo:<código>`), ano e GP.
  - `meta` guarda as colunas, o passo e o número de amostras; `dados` guarda as amostras de `corrida-gravacao.js` com gzip.
  - Cada dono fica com os 30 GPs mais recentes, e os replays somem junto quando a carreira é excluída ou a sala do grupo é apagada.
- `corrida-gravacao.js` ganhou `paraSave(room, chave)`, que troca os ids da sala pelos do save (`voce`, `h:<pessoa>` ou o piloto real) nas ultrapassagens e nas colunas do replay. `corrida-analise.js` faz o mesmo nos momentos.
- `corrida-temporada.js` e `corrida-temporada-grupo.js` guardam, no fim do GP, as ultrapassagens dentro de `resultado.analise` e o replay na tabela nova. Tudo fica em `try`, como a análise: nunca segura o resultado.
- Evento novo `replay` ({ ano, gp }) no canal da carreira solo e no da temporada em grupo, só para quem já abriu a carreira ou está na sala.

## Navegador

- `resultado-analise.js` não importa mais o `estado.js`, que abre a conexão da sala da Corrida: quem chama passa a `fonte` dos dados. A tela do resultado passa o socket da sala. A carreira usa `montarAnaliseSalva`, com o resumo que já veio no save.
- `analise-salva.js` (novo): a análise 3D de um GP guardado, numa tela por cima da Central. A Central se redesenha sozinha e levaria o canvas junto, por isso a tela fica fora dela. Tem as mesmas abas: Posições, Momentos, Ultrapassagens, Replay, Ritmo e Pneus. O replay vem do servidor só quando a aba pede.
- Aba Análise da Central (`central-analise.js`): o botão "Replay e análise 3D" no topo, para o GP escolhido. Serve à carreira solo e à em grupo, que usa a mesma Central; na do grupo, os seus carros viram `voce` também nos momentos, nas ultrapassagens e no replay (`grupo.js`).
- Ficha do circuito da Central (calendário): monta o guia do GP (`gp-guia.js`, agora sem o `estado.js`), com a miniatura 3D, a história e as curvas famosas, na cor da equipe.
- "Ver o carro de perto" ao lado de "Seu carro" na Central abre a vista do carro (`vista-carro.js`).
- `pos-corrida.css` (novo): os estilos da análise, da miniatura, do guia e da vista saíram de `resultado-gp.css`, `sala-nova.css` e `menu.css` (só os blocos que esses PRs tinham posto) e vão para as duas páginas.

Os momentos do rádio do engenheiro continuam só na tela do resultado, porque o rádio toca no navegador e não vai para o save.

Entrada no topo de `novidades.json`. Conferido com `node --check` e `JSON.parse`; o caminho do replay (guardar e ler de volta) foi rodado uma vez à mão com o banco em memória, sem teste novo. O teste jogando fica com o Thiago.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
