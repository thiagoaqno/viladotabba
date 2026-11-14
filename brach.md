# Logos das equipes na classificação

Primeiro PR do pós-corrida interativo: o Thiago pediu as logos das equipes na classificação. O resultado do GP e o pódio já tinham; faltavam nas tabelas abaixo, que só mostravam uma faixinha na cor do carro.

## O que mudou

- **Classificação (Q1, Q2, Q3):** a tabela entre as sessões e o grid de largada (`hud.js`, `renderQuali`) mostram a logo da equipe antes do nome. Com o mouse em cima, a logo cresce e o `title` dá o nome da equipe.
- **Quadro de tempos no HUD durante a sessão** (`hudClassificacao`): a logo pequena no lugar da faixa de cor.
- **Campeonato da carreira** (`temporada/central.js`): as tabelas de pilotos e de construtores ganham a logo ao lado da faixa de cor, com o mesmo hover.
- **Temporada com os amigos** (`temporada/grupo.js`): o placar de pilotos e construtores também.
- Sem equipe (regras arcade) ou sem arquivo de logo, fica a faixa de cor de antes. Se a imagem não carregar, entra a sigla (o tratador que já existe em `menus.js`), ou ela some na Central, como as outras logos de lá.
- O endereço vem de `window.logoF1`, então as temporadas de 2023 a 2025 mostram as logos da época (AlphaTauri, Alfa Romeo, Sauber...).
- Entrada nova no topo de `novidades.json`.

Conferido só com `node --check` e `JSON.parse`. O teste jogando fica com o Thiago.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
