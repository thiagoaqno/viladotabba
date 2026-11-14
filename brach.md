# Mercedes W17 (2026) pelos prints do Thiago

A pintura da Mercedes de 2026 refeita pelos prints de `Carros F1/2026/Mercedes`: antes era preta com umas lâminas prata; agora é como no carro.

- Corpo prata; a parte de cima preta (do cockpit à asa traseira), com estrelas apagadas e o filete verde-água na borda.
- Quatro faixas pretas em diagonal na caixa lateral (de lado e de cima) e o PETRONAS embaixo dela.
- Asa dianteira grafite com os riscos verde-água, TeamViewer e PETRONAS Syntium; asa traseira preta com PETRONAS em cima, CROWDSTRIKE atrás e a gota da Petronas nas placas.
- Bico prata claro com bordas verde-água, a estrela na ponta e a fileira SAP, AKKODIS, PIRELLI, INEOS, CROWDSTRIKE (o atlas do nariz); PETRONAS Syntium perto do cockpit.
- As marcas do cockpit (nu, TeamViewer) passaram para branco, porque em volta do cockpit agora é preto.
- Marcas novas em `f1-marcas.js`: `estrela`, `gota`, `syntium`.

**Peso:** zero a mais. Continua a folha projetada de 2026 (um canvas por equipe, guardado; só desenho no canvas, nenhuma imagem para baixar). Não usa a pintura na textura da Alpine 2023 (`f1-uv.js`), que é a pesada: ela calcula a cor pixel por pixel em JavaScript e faz duas texturas de 2048 px por carro e por número.

**Forma:** o carro de 2026 continua o mesmo modelo (Audi R26) para todas as equipes; aqui muda só a pintura.

Conferido só com `node --check` (`f1-pintura.js`, `f1-marcas.js`) e o `JSON.parse` do `novidades.json`. O teste jogando é do Thiago.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
