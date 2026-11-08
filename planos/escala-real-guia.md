# Guia: levar as pistas da Corrida para a escala real

Guia para outro Claude continuar o projeto de escala real da Corrida da Galera (repositório `thiagoaqno/viladotabba`). Leia tudo antes de começar. O plano técnico vivo fica em `planos/escala-real.md`, dentro do repositório.

## O objetivo

Todas as 24 pistas de GP de F1 com **traçado real, comprimento real, largura real, relevo real, barreiras reais e cenário no tamanho certo**, com o carro no tamanho de um F1 de verdade. As pistas inventadas já foram apagadas (PR #604).

## O que já está feito

| PR | O quê |
|---|---|
| #603 | **Carro no tamanho real.** `CARS3` em metros (F1 de 2026, ~5,5 × 1,9 m) e `KS` = 4,8, a escala da física (`ESC` em `public/corrida/dinamica.js`: 1 u = 0,2083 m). Colisão (`DIMENSOES` em `sim.js`, `EU` em `fisica.js`), folgas dos robôs (`L_CARRO`, `W_CARRO`, `TRANSITO_NIVEL`, `MARG_PARADO` em `corrida-robos.js`), folga da linha (`corrida-linha.js`) e câmeras de perseguição. |
| #604 | As 10 pistas fora do calendário da F1 foram apagadas. |
| #605 | **Interlagos (o piloto)** e a **chave de escala do cenário por GP**: `escala` e `escalaGente` na configuração do GP (`gps/<id>.js`), lidas como `tr.escala` e `tr.escalaGente` (padrão 1). O #605 inclui o #603. |
| #602 | Cidade do México no comprimento e na largura reais (falta só o cenário: `escala`). |
| #606 | Spa inteira na escala real (branch `feat/escala-spa`; se o PR ainda não entrou, junte no integrador). |
| (em andamento) | Mônaco: outra conta está terminando. O trabalho parcial está no worktree `klk/escala-monaco` (branch `feat/escala-monaco`, local). Confira com o Thiago antes de mexer. |

O #603, o #604 e o #605 já estão na main: crie os branches novos a partir de `origin/main`.

## A receita (por pista)

Unidade da física: **1 u = 0,2083 m** (metros ÷ 0,2083 = unidades).

1. **Traçado real.** As pistas com id do bacinger (tabela abaixo) já têm a linha central real. Monza, Barcelona e Silverstone ainda são desenhadas à mão (ou ajustadas): converta a linha de `bacinger/f1-circuits` com `ferramentas/circuitos-f1.js`, como foi feito em Interlagos.
2. **Comprimento real.** Multiplique `scale` em `public/corrida/pistas.js` pelo fator da tabela, até `Pistas.pontos(t, 6).length * 6 * 0,2083` dar o comprimento real. Multiplique `minLap` pelo mesmo fator. As frações da volta (`boxes`, `drs`, `SUPERFICIES_ESCAPE`, peças do cenário) não mudam; o que estiver em unidade fixa (zebra, brita, `flat`, `fall`) cresce na mesma proporção.
3. **Largura real.** `width` = largura real em metros ÷ 0,2083. A maioria dos autódromos tem 12 a 15 m; ruas, menos. Pesquise e diga a fonte no PR. Sem fonte, use 12 m (o mínimo da FIA) e diga que é estimativa.
4. **Relevo e barreiras.** Rode, DEPOIS de mudar o `scale`:
   `node ferramentas/pista-real.js <id-bacinger> <pista> --dem eudem25m --raio 3 --cache <pasta fora do repo>`
   - Fora da Europa, use `--dem srtm30m`. O SRTM conta árvore e prédio como ladeira: se a inclinação máxima sair absurda (acima de uns 15% numa pista plana), aumente `--raio` (Melbourne precisou de 8, a Cidade do México de 14).
   - Aplique `hills`, `hillsSuave: true` e `flat`/`fall` proporcionais.
   - Use os `muros` da ferramenta só se faltar barreira mapeada em menos de 30% da volta em CADA lado. Senão, fica a regra automática, e o PR diz isso.
   - Confira que o carro não decola: o script de Spa mediu a quebra de inclinação a cada 6 u.
5. **Cenário.** Defina `escala` e `escalaGente` em `gps/<id>.js`. Interlagos e Spa usaram `escala: 0.4` e `escalaGente: 0.69`, medidas assim: degrau de arquibancada ~0,4 m de altura e ~0,8 m de fundo, barreira ~0,75 m, pessoa ~1,75 m. **Meça antes de copiar** o fator: prédios, árvores e peças feitas com dados reais (Mônaco, Baku, Las Vegas, Singapura) podem já estar certos. As peças exclusivas da pista (`<id>.js`, `kit/<id>/`) precisam ler `tr.escala` como as do kit leem. Nada em cima do asfalto, flutuando ou enterrado.
6. **Robôs.** Refaça a linha da pista em `corrida-linhas-f1.json` (`ferramentas/gerar-linhas-f1.js`). Rode uma corrida com robôs no navegador: ninguém pode abandonar, ficar preso ou bater sem parar. Anote as voltas no PR.
7. **Recordes.** Crie uma migração `migracoes/NNN-<pista>-escala-real.sql` que zere os recordes, as voltas e os setores da pista, como a `029-mexico-escala-real.sql` e a `030-spa-escala-real.sql`. Veja o maior número que já existe na main e nos PRs abertos para não repetir.

## As pistas que faltam

Medido em 2026-11-08, depois do carro novo e antes das mudanças de cada pista. "Fator" é quanto `scale` precisa crescer.

| Pista | bacinger | Real | Hoje | Fator | Largura hoje | Cenário próprio | Observação |
|---|---|---|---|---|---|---|---|
| Cidade do México | mx-1962 | 4,304 km | 4,30 km | 1,00 | 14 m | sim | Só falta `escala` do cenário |
| Monza | — (à mão) | 5,793 km | 3,10 km | 1,87 | 23,3 m | sim | Converter o traçado real primeiro |
| Barcelona | — (à mão) | 4,657 km | 2,89 km | 1,61 | 27,1 m | sim | Converter o traçado real primeiro |
| Silverstone | gb-1948 | 5,891 km | 3,04 km | 1,94 | 25,8 m | sim | Já tem relevo e `muros` (refazer na escala nova) |
| Melbourne | au-1953 | 5,278 km | 2,90 km | 1,82 | 25,0 m | sim | SRTM com `--raio 8` |
| Xangai | cn-2004 | 5,451 km | 3,35 km | 1,63 | 25,0 m | sim | |
| Suzuka | jp-1962 | 5,807 km | 2,99 km | 1,94 | 25,0 m | sim | Passa por cima de si mesma (`cruza`, ponte) |
| Bahrein | bh-2002 | 5,412 km | 2,90 km | 1,87 | 25,0 m | sim | |
| Jeddah | sa-2021 | 6,174 km | 3,07 km | 2,01 | 21,7 m | sim | Pista de rua com muro (`muro`) |
| Miami | us-2022 | 5,412 km | 2,89 km | 1,87 | 25,0 m | sim | |
| Montreal | ca-1978 | 4,361 km | 2,71 km | 1,61 | 25,0 m | sim | |
| Red Bull Ring | at-1969 | 4,318 km | 2,69 km | 1,60 | 25,0 m | sim | Já tem relevo e `muros` (PR #577) |
| Hungaroring | hu-1986 | 4,381 km | 2,72 km | 1,61 | 25,0 m | não | Cenário genérico |
| Zandvoort | nl-1948 | 4,259 km | 2,69 km | 1,58 | 25,0 m | sim | Curvas inclinadas |
| Madri | es-2026 | 5,470 km | 2,90 km | 1,89 | 25,0 m | não | Cenário genérico |
| Baku | az-2016 | 6,003 km | 2,95 km | 2,04 | 20,0 m | sim | Dados reais (`kit/baku/dados.js`); `muros` com recuo negativo na Cidade Velha |
| Singapura | sg-2008 | 4,940 km | 3,88 km | 1,27 | 17,5 m | sim | Dados reais; noite |
| Austin | us-2012 | 5,513 km | 3,39 km | 1,63 | 25,0 m | sim | Já tem relevo e `muros` (PR #578) |
| Las Vegas | us-2023 | 6,201 km | 3,09 km | 2,01 | 21,7 m | sim | Dados reais; noite |
| Catar | qa-2004 | 5,419 km | 2,93 km | 1,85 | 25,0 m | não | Cenário genérico |
| Abu Dhabi | ae-2009 | 5,281 km | 2,89 km | 1,83 | 25,0 m | não | Cenário genérico |

Ordem sugerida: primeiro as de cenário genérico (Hungaroring, Madri, Catar, Abu Dhabi), que são rápidas, e a Cidade do México (só cenário). Depois as de autódromo com cenário próprio. Por último as que têm dados reais gerados (Baku, Singapura, Las Vegas), porque o gerador delas pode precisar rodar de novo.

## Como trabalhar (regras do Thiago)

**Tudo num branch local de integração, com um mega PR só no fim.** Decidido em 2026-11-08 para não estourar o limite semanal com conflitos e PRs pequenos.

- O branch de integração é `feat/escala-real-pistas`, criado de `origin/main` num worktree próprio:
  `git -C C:Users	hiagDownloadsltsklkobos-pedal worktree add -b feat/escala-real-pistas ../escala-real-pistas origin/main`
  Junte nele o que já está pronto e ainda não foi para a main (a Spa, PR #606, branch `feat/escala-spa`; Mônaco, se a outra conta deixar num branch).
- **Uma pista por subagente, cada um no seu worktree, criado a partir do branch de integração** (nunca dois subagentes no mesmo worktree):
  `git worktree add -b escala/<pista> ../escala-<pista> feat/escala-real-pistas`
  e `node_modules` ligado por junção ao de `klk/robos-pedal` (`mklink /J`). **Nunca** `git clone` nem `npm ci`: a internet do Thiago é de plano.
- O subagente **faz commit no branch dele e NÃO dá push nem abre PR**. Ele também não escreve o `brach.md`: as notas da pista (números medidos, fontes, prints, o que ficou de fora) vão para `planos/escala-real.md`, na seção da pista.
- Quando a pista termina e está conferida, **você** junta no integrador (`git -C ../escala-real-pistas merge --no-edit escala/<pista>`), resolve os conflitos juntando os dois lados (em geral `CLAUDE.md`, `kit/README.md`, `planos/escala-real.md` e `corrida-linhas-f1.json`) e apaga o worktree da pista.
- **Backup:** de tempos em tempos, `git push origin feat/escala-real-pistas`, SEM abrir PR, só para não perder o trabalho se o disco falhar.
- **No fim**, com todas as pistas juntas: escreva um `brach.md` só, com o resumo de cada pista, e o Thiago abre o mega PR (ou você abre com `gh pr create --body-file brach.md` se ele pedir). Não faça merge.
- **Migrações:** cada pista tem a sua (`migracoes/NNN-<pista>-escala-real.sql`). Reserve os números em sequência no integrador para não repetir.
- **Subagentes Sonnet em esforço alto**, no máximo **2 ao mesmo tempo**, em segundo plano, cada um com uma porta própria (`PORT=33xx DB_PATH=:memory: node server.js`), parando o servidor no fim.
- **Prints obrigatórios** antes de a pista ir para o integrador (Playwright em `node_modules/.bin/playwright`), com o carro à vista: largada, as curvas famosas e uma vista geral. Poucos prints. Se o painel do navegador do app estiver escondido, a cena não desenha: use o Playwright.
- **Não criar testes.** Teste antigo que quebra só porque a pista mudou de tamanho: apagar e anotar.
- Rodar só `node --check`. A suíte fica com o CI do GitHub, no mega PR.
- Sem número inventado. Todo número anotado é medido.
- Commit terminando com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Quando um subagente parar por limite de uso, retome o MESMO subagente (SendMessage), sem começar outro.

## Armadilhas já encontradas

- **Conflitos entre PRs paralelos** quase sempre em `brach.md`, `CLAUDE.md`, `kit/README.md` e `planos/escala-real.md`. Resolve juntando os dois lados (no `brach.md`, fica o do PR que está entrando).
- **Desempenho:** pista maior quer dizer mais peças distribuídas pela volta. A Spa foi de 566 mil para 888 mil triângulos na vista do jogo. Meça com `node tests/ajuda-cena/medir.mjs <pista>` e reaproveite material e `InstancedMesh`.
- **O corte do que não se vê** (`public/corrida/recorte.js`): peça que se mexe precisa de `frustumCulled = false` ou material transparente, senão some.
- **A primeira volta no navegador** pode demorar muito se o carro do teste fica parado no grid; isso não é bug da pista.
- **Ruído do SRTM:** árvores e prédios viram ladeira. Aumente `--raio` e confira a inclinação máxima contra o que a pista real tem.
- **A largura real** raramente está publicada. Diga a fonte ou que é estimativa.

## Texto para mandar a cada subagente (troque os campos)

> Leve **<PISTA>** inteira para a escala real na Corrida da Galera, seguindo `planos/escala-real.md` e a receita de `C:Users	hiagDownloadsltsGUIA-ESCALA-REAL.md`. Onde: só no worktree `C:Users	hiagDownloadsltsklkescala-<pista>`, branch `escala/<pista>` (criado do branch de integração `feat/escala-real-pistas`). Servidor: `PORT=<porta> DB_PATH=:memory: node server.js`. Bacinger: `<id>`. Real: <km> km (fator ~<fator>). Faça os 7 passos da receita, com prints obrigatórios (largada, <curvas famosas>, vista geral, carro à vista), corrida com robôs e migração dos recordes (número <NNN>). Anote os números, as fontes, os prints e o que ficou de fora na seção da pista em `planos/escala-real.md`. Faça commit com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` no seu branch, SEM push, SEM PR e sem mexer no `brach.md`. Responda com os números medidos, os caminhos dos prints e o que ficou de fora.
