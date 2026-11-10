# Vila da Galera: o foco agora é a Corrida F1

Site de jogos com os amigos, tudo em português. Hoje o projeto principal é **só a Corrida (F1 3D)**. Os outros jogos (Vila, Carreira de Treinador, Leilão, Pokémon e os de mesa) continuam no ar, mas o mapa deles saiu daqui para não gastar tokens: está em [`docs/mapa-completo.md`](docs/mapa-completo.md), o `CLAUDE.md` antigo inteiro. Quando for mexer num desses jogos, leia só o trecho dele lá (com grep) e, se o trabalho virar frequente, traga um resumo para cá.

## Como trabalhar (regras do Thiago)

- **Internet de plano:** nunca `git clone` nem `npm ci`. Os worktrees ficam em `C:\Users\thiag\Downloads\lts\klk\`, criados da `main` (`git worktree add -b <branch> ..\<pasta> origin/main`), com o `node_modules` ligado por junção ao de `klk\robos-pedal` (`mklink /J`).
- **Nunca apagar o `node_modules` compartilhado.** Para remover um worktree, primeiro rode `cmd /c rmdir <worktree>\node_modules`, confira que sumiu, e só depois `git worktree remove`. O `--force` com a junção no lugar já apagou o `node_modules` de todos.
- **Testes:** não crie testes e não rode a suíte; só `node --check` (os arquivos de `public/corrida/` são módulos: confira com `node --input-type=module --check < arquivo.js`). A suíte roda no CI do GitHub. Teste antigo que quebra só porque um número mudou: apague e anote.
- **Sem número inventado:** todo número anotado é medido.
- **Visual sem prints:** mudança de cenário ou de gráfico vai direto para PR, conferida com `node --check`; o Thiago testa jogando e manda print do que quebrou (pedido dele, 2026-11-10: os prints pelo SwiftShader levavam dezenas de minutos). Se precisar de um print mesmo assim: `C:/Users/thiag/Downloads/lts/ferramentas-prints/prints.js`. Servidor de teste: `PORT=33xx DB_PATH=:memory: node server.js`.
- **PRs pequenos para a `main`**, um por assunto ou pista. O merge (e com ele o deploy, que publica a `main` a cada push) é do Thiago.
- Commit termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. O `brach.md` descreve o que mudou no branch (vira o texto do PR).

## Servidor e navegador

Node + Express 5 + Socket.io 4 em `server.js` (`npm start`, porta 3000). Navegador em HTML/JS puro, sem build; o 3D é Three.js pelo importmap (`/vendor/three/`). Banco SQLite em `bd.js` com `migracoes/NNN-nome.sql`, que rodam em ordem, uma vez só.

## Mapa da Corrida (`corrida.js` + `public/corrida/`)

**Servidor:** `corrida.js` (salas, `create`/`join`/`act`, largada, resultado), `corrida-humanos.js` (o carro de quem joga, passo fixo de 1/120 s com autoridade do servidor), `corrida-robos.js` (robôs: `transito`, ultrapassagem, ERS, box), `corrida-piloto.js` + `corrida-linha.js` (linha de corrida, guardada em `corrida-linhas-f1.json` por `ferramentas/gerar-linhas-f1.js`), `corrida-contato.js` (batidas entre carros), `corrida-f1-direcao.js` (bandeiras, punições, safety car), `corrida-f1-classificacao.js`, `corrida-parados.js` (carro parado vira fantasma e volta para a pista), `corrida-temporada.js` e `corrida-temporada-grupo.js` (a carreira F1 solo e com os amigos).

**Física (a mesma no servidor e no navegador):** `dinamica.js` (pneus, carga, freio, câmbio; 1 u = 0,2083 m), `sim.js` (dinâmica + pista: relevo, muros, vácuo, DRS, ERS, box), `f1-regras.js` (pneus, clima, ERS, DRS, pontos), `f1-equipes.js` (orçamento e montagem de cada equipe; `PARELHO` diz o quanto os carros diferem), `pose.js` (rede suave).

**Pistas:** `pistas.js` (traçado, `scale`, `width`, `hills`, `muros`, `boxes`, `drs` de cada uma) e `pista.js` (monta a cena a partir de `GPS[id]`). Cada GP tem `gps/<id>.js` (configuração, com `escala`/`escalaGente` do cenário) e, quando tem cenário próprio, `<id>.js` + `kit/<id>/`. O kit compartilhado está em `kit/` (guia em `kit/README.md`, passo a passo de pista nova na skill `.claude/skills/nova-pista`). **Regra:** o cenário é exclusivo de cada pista; não mexer em `kit/*.js` nem em `pista.js` para o visual de uma pista (só opção nova lida de `GPS[id]`, desligada por padrão).

**Escala real:** o carro tem o tamanho de um F1 de 2026 e as pistas o comprimento real, com 12 m de largura (estimativa onde não há fonte). O plano vivo, com os números de cada pista, é [`planos/escala-real.md`](planos/escala-real.md); o guia para continuar é `planos/escala-real-guia.md`. Ferramentas: `ferramentas/escala-lote.js` (comprimento), `ferramentas/pista-real.js` + `escala-relevo-lote.js` (relevo e barreiras do EU-DEM/SRTM, cache em `C:\Users\thiag\Downloads\lts\cache-pista-real`), `ferramentas/circuitos-f1.js` (converte o traçado real do bacinger). Cada pista que muda de tamanho ganha uma migração que zera os recordes dela. Cuidados visuais em toda pista: base sólida sob o asfalto, chão no nível da pista, nada flutuando (conferir na primeira pessoa) e torcida só nas arquibancadas.

**A carreira** sorteia só as pistas prontas: `PISTAS_TRABALHADAS` em `public/corrida/temporada/regras.js`.

**Navegador:** `jogo.js` (laço, aquecimento da pista), `fisica.js` (previsão local), `controles.js` + `volante.js` + `teclas.js`/`teclas-ui.js` (entrada, sensibilidade e a tela Controles, tudo remapeável), `cameras.js`, `carros.js` (o carro, LOD dos adversários por `qualidade.js`: opção "Carros dos adversários"), `f1.js`/`f1-2026.js`/`f1-pintura.js` (o modelo do carro), `hud.js`, `hud-painel.js`, `mfd.js` (HUD no estilo do jogo da EA), `clima-visual.js` e `agua-pista.js` (chuva), `qualidade.js` + `pos.js` (gráficos), `sons.js`, `radio.js`, `menu.js`/`menus.js` (menu e sala em etapas), `temporada/` (a Central da carreira).

**Detalhes de cada sistema** (punições, clima, rede, HUD, box, pintura, sons etc.) estão no mapa antigo, `docs/mapa-completo.md`, na linha "Corrida (F1 3D)" e nas seções "Corrida F1 — ...". Procure lá com grep pelo nome do arquivo ou da função antes de mudar algo que não conhece.
