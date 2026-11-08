# Escala real: o carro e as pistas no tamanho de verdade

A física usa 1 unidade = 0,2083 m (`ESC` em `public/corrida/dinamica.js`). Antes deste plano, o carro saía com uns 9,2 m × 5,4 m nessa escala (`KS = 10`, 4,4 × 2,6 m), e por isso as pistas tinham o dobro da largura real e o cenário era desenhado grande.

O Thiago escolheu (2026-11-08) **encolher o carro** para a escala da física, em vez de mudar a física para a escala do carro.

## Fases

1. **Carro no tamanho real** (este PR): `CARS3` em metros de verdade (F1 de 2026, ~5,5 × 1,9 m), `KS` = 4,8 (o inverso de `ESC`), a colisão (`DIMENSOES` em `sim.js`, `EU` em `fisica.js`), as folgas dos robôs (`L_CARRO`, `W_CARRO`, `TRANSITO_NIVEL`, `MARG_PARADO` em `corrida-robos.js`), a folga da linha de corrida (`corrida-linha.js`) e as câmeras de perseguição (`cameras.js`).
2. **Pistas no comprimento e na largura reais**, uma por uma: `scale` para a volta dar o comprimento real em `Pistas.pontos(t, 6)`, `width` na largura real (metros ÷ 0,2083), `minLap` proporcional, e depois `ferramentas/pista-real.js` para relevo e barreiras. A Cidade do México (#602) já está.
3. **Cenário no tamanho real**, junto com cada pista: as peças do kit (`public/corrida/kit/`) e as de cada GP foram feitas para o carro grande (o degrau de arquibancada tem 9 × 6 u, ~1,9 × 1,25 m) e precisam diminuir. Começar pelas peças do kit compartilhado (arquibancadas, torcida, guard-rail, boxes, placas), com um fator por peça, e depois as exclusivas de cada GP.
   **Interlagos (cenário, feito):** o GP ganhou `escala: 0.4` e `escalaGente: 0.69` em `gps/interlagos.js`, lidas como `tr.escala` e `tr.escalaGente` (padrão 1, as outras pistas não mudam). Multiplicam o tamanho do degrau da arquibancada (e a marquise, a base e a gente sentada), da barreira do escape, das pilhas de pneus, dos painéis e placas de frenagem, do vão da passarela, do pórtico, da linha de chegada, das placas de DRS e PIT ENTRY, do colchete do grid e das setas. O fator vem do real ÷ medido: degrau 0,4 m ÷ 1,25 m, barreira 0,75 m ÷ 1,77 m, pessoa 1,75 m ÷ 2,54 m. Já estavam em tamanho real e não mudaram: o prédio dos boxes, São Paulo, as árvores, a cerca, os mastros, os postos, os mecânicos, a mureta do box e as garagens. Falta, para as outras pistas: medir peça por peça e escolher o fator de cada GP; as peças próprias de cada GP (`cenario`, `marcos`, `depois`) leem `tr.escala` se quiserem. Detalhes em `public/corrida/kit/README.md`.
4. Robôs, recordes e linhas: recalcular `corrida-linhas-f1.json` e zerar os recordes de cada pista que mudar de tamanho (migração por pista).

Até a fase 3 terminar, numa pista antiga o carro fica pequeno (a pista tem o dobro da largura real) e o cenário fica grande em volta dele.
