# CLAUDE.md só com a Corrida F1

O `CLAUDE.md` tinha 222 KB, uns 55 mil tokens, e entrava inteiro em toda conversa e em todo subagente do Claude, mesmo quando o trabalho era só numa pista da F1. Como hoje o projeto principal é só a Corrida, ele ficou com 5,9 KB:

- **o que ficou:** as regras de trabalho do Thiago (internet de plano, junção do `node_modules`, sem testes, prints, PRs pequenos) e um mapa enxuto da Corrida, com o servidor, a física, as pistas e a escala real, a carreira e o navegador, apontando para `planos/escala-real.md` e para o mapa antigo quando precisar de detalhe;
- **o que saiu:** o `CLAUDE.md` antigo foi movido sem mudança nenhuma para `docs/mapa-completo.md`, que não é carregado sozinho. Quando alguém for mexer nos outros jogos (Vila, Carreira de Treinador, Leilão, Pokémon e os de mesa), lê o trecho de lá, ou traz um resumo de volta para o `CLAUDE.md`.

Só documentação, sem mudança de código. Todos os arquivos citados no mapa novo foram conferidos e existem.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
