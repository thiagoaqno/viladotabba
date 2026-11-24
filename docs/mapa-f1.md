# Mapa da Corrida F1: onde mexer para cada coisa

Guia rápido para quem vai fazer update (Thiago ou Claude). Para cada pedido comum: o arquivo, a variável e o que mais precisa mudar junto.
O resumo dos sistemas fica no `CLAUDE.md`; o mapa antigo e detalhado, em `docs/mapa-completo.md`.

## Como o jogo roda
- **Servidor** (`corrida.js`): cria a sala, larga a corrida, recebe os comandos e manda o estado. O carro de quem joga roda em `corrida-humanos.js` (passo de 1/120 s, o servidor manda). Os robôs, em `corrida-robos.js` (a entrada) e nas partes `corrida-robos-*.js` (base, linha, ritmo, transito, box).
- **Física compartilhada** (o mesmo arquivo roda no servidor e no navegador): `public/corrida/dinamica.js`, `sim.js`, `f1-regras.js`, `f1-equipes.js`. **Mudou aqui, mudou para todo mundo.** Se um programa de PC velho deixar de bater com o site, suba `PROTOCOLO` em `corrida-pc.js`.
- **Navegador**: `public/corrida/jogo.js` (laço), `cena.js` (renderer), `pista.js` + `kit/` (cenário), `carros.js` + `f1*.js` (modelo do carro), `hud*.js`/`mfd.js`, `qualidade.js` + `pos.js` (gráficos).

## Pedidos comuns → onde mexer

| Quero mudar… | Arquivo | O quê |
|---|---|---|
| Quantas voltas dura cada pneu | `public/corrida/f1-regras.js` | `PNEUS.<composto>.vida` (voltas até o penhasco). Teste: `tests/corrida-f1-pneus.test.js` (os valores esperados) |
| Aderência de cada pneu | `f1-regras.js` | `PNEUS.<composto>.pico` (1,35 = referência); queda com o desgaste em `CURVAS` (as listas `[desgaste, fator]`) |
| Pneu na chuva | `f1-regras.js` | `molhado`, `derrete`, `esquenta`, `PERDA_ESQUENTA`; a pista molhada no visual em `clima-visual.js` e `agua-pista.js` |
| Peças do carro (motor, aero…) | `public/corrida/f1-equipes.js` | `PECAS` (textos), `custoDoNivel` (preço por nível), `SUPORTE` (aero ≤ suspensão+4, motor ≤ confiab+4), `LIMITES` (o pior e o melhor de cada número) |
| Força de cada equipe | `f1-equipes.js` | `EQUIPES.<id>.orcamento` e `.padrao` (o carro inicial; o custo do padrão tem que ser igual ao orçamento) |
| Como os bots evoluem as peças | `public/corrida/temporada/regras.js` | `desenvolvimentoRivais`: o ritmo (atraso por faixa: grandes 0, meio 1/4, pequenas 1/2 temporada) e `prioridadeDaPeca` + `PESO_PECA` (onde vai cada ponto). Sem sorteio |
| Pontos de evolução por temporada | `f1-equipes.js` | `BONUS_POR_TEMPORADA`, `BONUS_MAX`; o preço para quem joga em `custoDoDesenvolvimento` (regras.js) |
| Acerto (asa, altura, câmbio, freio, diferencial, cambagem, pressão, rigidez) | `public/corrida/sim.js` | `ACERTO_PADRAO` e a função logo abaixo (cada ajuste vai até ±4–8%; a aderência somada fica travada em ±6%). Tela: `temporada/central-acerto.js` |
| Acerto dos bots | `corrida-robos-ritmo.js` | `acertoDoRobo`: parte de `acerto-ideal.json`; `PERTO_DO_IDEAL` por nível (fácil 40%, médio 75%, difícil 100%) |
| Paddock da carreira (decisões, marcos, plano) | `temporada/paddock.js` | `EVENTOS` (o `plano` vem em todo GP), `MARCOS` (recompensas por faixa), `aoResultado` (as consequências) |
| O plano na física (arriscar/seguro) | `sim.js` | `PLANO` (aderência e desgaste); o humano leva `plano` no jogador (corrida.js abrirGP) |
| Companheiro na pista pela relação | `corrida-robos.js` | `companheiroNaPista`; a relação sai de `pilotosNoGrid` (regras.js) |
| Falas da carreira na corrida | `hud.js` | `meioDaCorrida`, `memoriaDoPaddock`, o plano na largada; `sede.js` guarda `corrida:paddockGP`; o servidor manda `radio:equipe` (rede.js) |
| Frases do rádio | `radio/falas.js` | Variantes novas vão no FIM da lista (o número dos mp3 não muda); gerar com `GERAR-VOZES-CORRIDA.bat` |
| Pilotagem dos bots, ultrapassagem, box | `corrida-robos.js` (`passoF1`, ERS) + `corrida-robos-transito.js` (`transito`) + `corrida-robos-box.js` (`decidirParada`) | a linha de corrida em `corrida-linha.js` / `corrida-linhas-f1.json` |
| Nível dos bots (fácil/médio/difícil) | `temporada/regras.js` + `corrida-robos-base.js` | `NIVEIS`, `mudarNivel` |
| Ritmo/personalidade dos pilotos | `public/corrida/f1-pilotos-2026.js`, `temporada/paddock.js` | `ritmo`; a moral muda até ±2 (`ajusteDeRitmo`) |
| Pontos, DRS, ERS, clima | `f1-regras.js` | `PONTOS`, `CHANCE_CHUVA`, `FAIXAS_DE_CHUVA` |
| Bandeiras, punições, safety car | `corrida-f1-direcao.js` | |
| Classificação Q1/Q2/Q3 | `corrida-f1-classificacao.js` | |
| Pistas que a carreira sorteia | `temporada/regras.js` | `PISTAS_TRABALHADAS` |
| Traçado de uma pista | `public/corrida/pistas.js` | `scale`, `width`, `hills`, `muros`, `boxes`, `drs` |
| Cenário de uma pista | `public/corrida/gps/<id>.js` + `<id>.js` + `kit/<id>/` | Exclusivo da pista: não mexer em `kit/*.js` nem `pista.js` para uma pista só |
| Zebras, faixas pintadas | `kit/chao.js` (zebras dos GPs), `kit/comum.js` (`tinta`), `pista.js` (`kerbM`, `tinta`) | `roughness` alto e `envMapIntensity` baixo = acetinado |
| Gráficos Baixa/Média/Alta | `qualidade.js` (`PREDEF`, `RAZAO`), `pos.js` (`AJUSTE`: amostras, bloom) | |
| HUD | `hud.js`, `hud-painel.js`, `mfd.js` | |
| Novidade para a galera | `public/corrida/novidades.json` | Entrada no topo, conferir com `JSON.parse` |

## Antes de fechar um update
1. `node --check arquivo.js` (os de `public/corrida/` são módulos: `node --input-type=module --check < arquivo.js`).
2. Mudou a física ou as regras? Procure o número nos `tests/` (`grep -rn "valor" tests/`) e atualize o esperado.
3. Mudou algo que os humanos têm (acerto, peças)? Confira se os bots acompanham: peças em `desenvolvimentoRivais`, acerto em `acertoDoRobo` (corrida-robos-ritmo.js).
4. Entrada no `novidades.json` se a galera vai notar.
