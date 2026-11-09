# Escala real: o carro e as pistas no tamanho de verdade

A física usa 1 unidade = 0,2083 m (`ESC` em `public/corrida/dinamica.js`). Antes deste plano, o carro saía com uns 9,2 m × 5,4 m nessa escala (`KS = 10`, 4,4 × 2,6 m), e por isso as pistas tinham o dobro da largura real e o cenário era desenhado grande.

O Thiago escolheu (2026-11-08) **encolher o carro** para a escala da física, em vez de mudar a física para a escala do carro.

## Fases

1. **Carro no tamanho real** (este PR): `CARS3` em metros de verdade (F1 de 2026, ~5,5 × 1,9 m), `KS` = 4,8 (o inverso de `ESC`), a colisão (`DIMENSOES` em `sim.js`, `EU` em `fisica.js`), as folgas dos robôs (`L_CARRO`, `W_CARRO`, `TRANSITO_NIVEL`, `MARG_PARADO` em `corrida-robos.js`), a folga da linha de corrida (`corrida-linha.js`) e as câmeras de perseguição (`cameras.js`).
2. **Pistas no comprimento e na largura reais**, uma por uma: `scale` para a volta dar o comprimento real em `Pistas.pontos(t, 6)`, `width` na largura real (metros ÷ 0,2083), `minLap` proporcional, e depois `ferramentas/pista-real.js` para relevo e barreiras. A Cidade do México (#602) já está.
3. **Cenário no tamanho real**, junto com cada pista: as peças do kit (`public/corrida/kit/`) e as de cada GP foram feitas para o carro grande (o degrau de arquibancada tem 9 × 6 u, ~1,9 × 1,25 m) e precisam diminuir. Começar pelas peças do kit compartilhado (arquibancadas, torcida, guard-rail, boxes, placas), com um fator por peça, e depois as exclusivas de cada GP.
   **Interlagos (cenário, feito):** o GP ganhou `escala: 0.4` e `escalaGente: 0.69` em `gps/interlagos.js`, lidas como `tr.escala` e `tr.escalaGente` (padrão 1, as outras pistas não mudam). Multiplicam o tamanho do degrau da arquibancada (e a marquise, a base e a gente sentada), da barreira do escape, das pilhas de pneus, dos painéis e placas de frenagem, do vão da passarela, do pórtico, da linha de chegada, das placas de DRS e PIT ENTRY, do colchete do grid e das setas. O fator vem do real ÷ medido: degrau 0,4 m ÷ 1,25 m, barreira 0,75 m ÷ 1,77 m, pessoa 1,75 m ÷ 2,54 m. Já estavam em tamanho real e não mudaram: o prédio dos boxes, São Paulo, as árvores, a cerca, os mastros, os postos, os mecânicos, a mureta do box e as garagens. Falta, para as outras pistas: medir peça por peça e escolher o fator de cada GP; as peças próprias de cada GP (`cenario`, `marcos`, `depois`) leem `tr.escala` se quiserem. Detalhes em `public/corrida/kit/README.md`.
   **Spa-Francorchamps (pista e cenário, feita):** `scale` 4 → 7,68 (a volta de `Pistas.pontos(t, 6)` foi de 17 446 u, 3 634 m, para 33 497 u = 6 977 m; real, 6 978 m), `width` 120 → 58 u (12,1 m; 12 m é o mínimo da FIA para pistas de grau 1, a largura de Spa não está publicada em nenhuma fonte que achei), `minLap` 41 → 79, `flat` 115, `fall` 730, zebra 653 e 422. Relevo e barreiras refeitos por `ferramentas/pista-real.js be-1925 spa --dem eudem25m --raio 3 --meia 6` (105 m de desnível, antes 55 m na escala da física; Raidillon a 13,1% e quebra de inclinação 0,34% a cada 6 u, antes 14,6% e 0,81%). Cenário: `escala: 0.4` e `escalaGente: 0.69` em `gps/spa.js` e, nas peças só de Spa, o degrau das tribunas cobertas (mais fileiras, mesma altura), o pneu do muro, as placas das curvas e a torcida das encostas (0,81). Robôs: linha refeita, migração `030-spa-escala-real.sql`. Não mexidos: prédios (a casa de enxaimel tem andar de 5 m, acima dos 3 m de verdade), árvores (35 a 62 m), carretas do paddock, bandeiras grandes das tribunas.
4. Robôs, recordes e linhas: recalcular `corrida-linhas-f1.json` e zerar os recordes de cada pista que mudar de tamanho (migração por pista).

Até a fase 3 terminar, numa pista antiga o carro fica pequeno (a pista tem o dobro da largura real) e o cenário fica grande em volta dele.

## Lote 1: o comprimento real de 14 pistas (2026-11-09)

`node ferramentas/escala-lote.js <id>=<metros> ...` acha o `scale` que faz a volta de `Pistas.pontos(t, 6)` dar o comprimento real e multiplica pelo mesmo fator `minLap`, `flat`, `fall`, a zebra (`dentro`, `fora`) de `gps/<id>.js` e a `britaCurvas` (de `gps/<id>.js` e de `SUPERFICIES_ESCAPE`). Medido depois de rodar:

| Pista | scale | Volta antes → depois | Real | minLap |
|---|---|---|---|---|
| Silverstone | 3,3 → 6,398 | 3 038 → 5 892 m | 5 891 m | 35 → 68 |
| Melbourne | 3,62 → 6,596 | 2 897 → 5 278 m | 5 278 m | 33 → 60 |
| Xangai | 2,8 → 4,56 | 3 347 → 5 452 m | 5 451 m | 38 → 62 |
| Suzuka | 3,77 → 7,332 | 2 986 → 5 808 m | 5 807 m | 35 → 68 |
| Bahrein | 2,39 → 4,462 | 2 900 → 5 413 m | 5 412 m | 34 → 63 |
| Jeddah | 5,09 → 10,25 | 3 066 → 6 174 m | 6 174 m | 35 → 70 |
| Miami | 3 → 5,609 | 2 895 → 5 412 m | 5 412 m | 34 → 64 |
| Montreal | 4,42 → 7,115 | 2 708 → 4 361 m | 4 361 m | 31 → 50 |
| Red Bull Ring | 2,9 → 4,649 | 2 693 → 4 318 m | 4 318 m | 31 → 50 |
| Zandvoort | 2,29 → 3,624 | 2 691 → 4 259 m | 4 259 m | 31 → 49 |
| Austin | 4,2 → 6,835 | 3 388 → 5 513 m | 5 513 m | 39 → 63 |
| Madri | 3,64 → 6,872 | 2 897 → 5 470 m | 5 470 m | 34 → 64 |
| Catar | 2,96 → 5,469 | 2 933 → 5 419 m | 5 419 m | 34 → 63 |
| Abu Dhabi | 3,51 → 6,418 | 2 888 → 5 280 m | 5 281 m | 33 → 60 |

Migrações `033` a `046` zeram voltas, recordes e setores de cada uma (031 é Mônaco e 032 é Hungaroring). Ainda falta em cada pista, numa passada por pista: `width` real (com fonte), relevo e barreiras (`ferramentas/pista-real.js`, porque as alturas de `hills` não cresceram com o `scale` e as ladeiras ficaram mais suaves), `escala` e `escalaGente` do cenário, as peças próprias lendo `tr.escala`, os cuidados visuais e a linha dos robôs. Madri, Catar e Abu Dhabi usam a zebra padrão de `kit/gp-simples.js`, que não cresceu. Monza e Barcelona ficaram de fora: o traçado delas ainda é desenhado à mão e precisa ser convertido antes.

**Depois de todas as pistas** (pedido do Thiago): a corrida com robôs de verdade roda uma vez só, no fim, e a pilotagem (aceleração, dirigibilidade) e o ajuste do trânsito dos robôs (#610, medido com o carro antigo) serão revistos para ficar perto de como era com o carro antigo.
