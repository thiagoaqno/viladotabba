# Raiz arrumada: o servidor vai para `servidor/`, os textos para `docs/`

Pedido do Thiago (2026-11-24): "arruma os arquivos soltos". A raiz tinha 131 itens, 93 deles `.js`/`.html`/`.json` do servidor de cada jogo.

## Para onde foi cada coisa
| Pasta | Arquivos |
|---|---|
| `servidor/corrida/` (36) | todos os `corrida*.js` e o `corrida-linhas-f1.json` |
| `servidor/carreira/` (18) | os `carreira*.js` e o `fotos-jogadores.js` |
| `servidor/jogos/` (27) | os outros jogos: banco, batalha, bloqueio, botao, cozinha, digita, domino, drag, futevolei, galeramon, ginasio, haxball, juri, ludo, noite, pelada, peladaBots, proibida, rumi, simulador, sinuca, tenis, tiro, truco, uno, vila, vila-mato |
| `servidor/admin/` (8) | os painéis `admin-*.js` e `admin-*.html` e a `moderacao-api.js` |
| `servidor/comum/` (3) | `bd.js`, `salas.js` e `lobby.js` |
| `docs/` (5) | `DEPLOY-VPS.md`, `DEPLOY-FLY.md`, `LISTAS.md`, `MUDANCAS.md`, `PROJETO.md` |

Saíram:
- `falas.js` da raiz: uma cópia antiga das falas do rádio, de um upload, que ninguém carregava (a de verdade é `public/corrida/radio/falas.js`).
- `arquivos-pc.json` do git: é o cache que o programa de PC grava sozinho. Foi para o `.gitignore`.

Ficaram na raiz: `server.js`, `package.json`, `Dockerfile`, `playwright.config.js`, os `.md` de entrada (README, CLAUDE, AGENTS, brach) e os `.bat`. Os `.bat` ficaram porque os atalhos de `Downloads\lts` chamam eles pelo caminho da raiz do clone, e eles dependem do `%~dp0`.

## Como os caminhos foram corrigidos
- Um script moveu os arquivos com `git mv` (o histórico de cada um continua) e reescreveu todo caminho relativo (`require("./...")`, `require("../...")`, `import(...)` e as listas de arquivos que vão para `require`) em todos os `.js`, `.mjs` e `.cjs` do repositório: no servidor, nos testes, nas ferramentas e no `public/`. Foram 157 arquivos.
- Corrigidos à mão os lugares que montam o caminho a partir da pasta do próprio arquivo (`__dirname`):
  - `bd.js` (as migrações e o banco em `dados/`);
  - `corrida-pc-atualizar.js` (a raiz do programa de PC, que ele lista para a atualização);
  - os dois editores de cenário;
  - o controle no celular;
  - `corrida-robos-linha.js` (o `linha-correcao.json`);
  - `fotos-jogadores.js`;
  - `drag.js`;
  - as ferramentas que gravam o `corrida-linhas-f1.json`;
  - duas ferramentas que montam o caminho com `RAIZ + "..."`;
  - os testes do painel da carreira.
- A checagem rápida do CI (`checagem.yml`) agora roda o `node --check` em `servidor/corrida/*.js`.
- O `CLAUDE.md` e o `README.md` explicam a pasta nova.

## Conferido
- Os 1030 caminhos relativos do projeto apontam para arquivos que existem. Só um não aponta, e ele já não apontava na `main`: `tests/ajuda-cena/index.mjs`.
- `node --check` em todos os arquivos movidos ou mudados.
- O servidor sobe (`PORT=3391 DB_PATH=:memory: node server.js`): `/`, `/corrida/`, `/api/corrida/menu`, `/api/musicas` e `/vendor/marked.js` respondem 200.
- O programa de PC continua rodando `server.js` na raiz. A atualização baixa os arquivos novos de `servidor/`. Os arquivos antigos da raiz ficam no PC sem uso.
- A suíte roda no CI.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
