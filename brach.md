# README novo: a Vila da Galera em resumo

Pedido do Thiago (2026-11-24): o README devia ter um resumo enxuto da ideia do servidor, as tecnologias do frontend e do backend, as linguagens, quem ele é e outros dados relevantes.

## O que mudou (só o `README.md`)
- **Título:** Vila da Galera, com a Corrida como destaque (antes o README era só da Corrida). Os links de jogar, da Vila e do programa para Windows continuam no topo.
- **A ideia:** um parágrafo sobre o servidor único (Express + um canal Socket.io por jogo, o servidor é quem manda, sem build) e outro sobre a Corrida (física no servidor a 1/120 s com previsão no navegador, robôs no servidor, o mesmo servidor dentro do programa de PC).
- **Os jogos:** todos, em cinco linhas por tipo.
- **Tecnologias:** frontend, backend (com Docker na VPS, GitHub Actions e o programa para Windows) e uma tabela de linguagens.
- **Rodar no seu PC** e **como o código está organizado**, mais curtos.
- **Quem sou eu.**

## De onde vêm os números
Os números da tabela de linguagens foram medidos com `git ls-files` na `main` de hoje: JS + MJS 181.563 linhas, HTML 9.866, CSS 8.814, Python 728, SQL 403, Batch 312 + PowerShell 12, C# 96; 6.187 arquivos e 1.987 commits, o primeiro em 01/10/2026. Os 25 GPs são os arquivos de `public/corrida/gps/`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
