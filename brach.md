# Tiro da Galera: prefabs do editor separados em grupos

A aba Prefabs do editor de mapas agora separa as peças em grupos, com título na lista e botões para ver um grupo só: Todos, Favela (63), Navio, Praça e esporte (13), Veículos (9), Cobertura (27) e Jogo original (216).

- **Peça nova:** entra no grupo pelo nome. `kcN...` vai para o Navio; as outras kc vão para a Favela, a não ser que estejam nas listas de Praça e esporte, Veículos ou Cobertura (`ED_GRUPO_LISTA` no `editor.js`).
- **Busca:** continua procurando em todos os grupos (ou no grupo escolhido).

Conferido no navegador: os grupos e o filtro funcionam.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
