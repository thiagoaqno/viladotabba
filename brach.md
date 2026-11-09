# Corrida F1 em escala real: as pistas no tamanho de verdade, a pilotagem revista e os gráficos dos adversários

Traz de volta para a `main` todo o trabalho de escala real, que saiu do site pelo #608 para o jogo continuar jogável enquanto as pistas eram refeitas. O branch `feat/escala-real-pistas` já desfaz a volta do #608 dentro dele (commit "Desfaz a volta do #608 dentro do branch de integração"), então este PR **traz** a escala real, em vez de apagá-la.

## O carro e as pistas no tamanho de verdade

- **Carro real** (#603): o F1 de 2026 com ~5,5 × 1,9 m na escala da física (1 u = 0,2083 m). A colisão, as folgas dos robôs, a linha de corrida e as câmeras seguem esse tamanho.
- **Pistas no comprimento real** (`ferramentas/escala-lote.js`): o `scale` de cada uma faz a volta de `Pistas.pontos(t, 6)` dar o comprimento do circuito, com o mesmo fator em `minLap`, `flat`, `fall`, zebra e brita.
- **Largura e relevo** (`ferramentas/pista-real.js` + `ferramentas/escala-relevo-lote.js`): `width` de 12 m, que é o mínimo da FIA, e é estimativa onde a largura não está publicada. Madri (madring.com) e Catar (dado do MotoGP) têm fonte. Relevo do EU-DEM e do SRTM, com mais suavização onde o SRTM inventava ladeira, e `muros` da ferramenta só onde a barreira mapeada cobre mais de 70% de cada lado. O carro não decola em nenhuma pista: a maior quebra de inclinação é 0,34% a cada 6 u.
- **Suzuka:** o relevo real não tem a ponte do oito, então o trecho de cima sobe numa rampa e o vão fica com 8,6 m. O viaduto foi refeito para cruzar a pista de baixo de viés.
- **Robôs:** as linhas de corrida foram refeitas por `gerar-linhas-f1.js`.

### As 13 pistas prontas (escala + cenário conferido) — a Carreira F1 usa só estas

| Pista | Volta | O que mais mudou no cenário |
|---|---|---|
| Interlagos | 4 309 m | traçado real (#601), cenário na escala (#605) |
| Spa | 6 977 m | relevo de 105 m, tribunas e torcida das encostas (#606) |
| Cidade do México | 4 304 m | Foro Sol e pódio na escala, jacarandás no tamanho real |
| Mônaco | 3 337 m | cerca sobre o guard-rail (antes flutuava), paredão de pedra sob a pista, terreno junto do asfalto |
| Hungaroring | 4 381 m | cenário próprio no lugar do genérico |
| Madri | 5 470 m | largura de 12 m com fonte, desnível de 32,5 m |
| Catar | 5 419 m | areia sólida no nível do asfalto |
| Abu Dhabi | 5 280 m | chão sólido, mastros e placas no chão |
| Silverstone | 5 892 m | The Wing, aeródromo, aldeias e placas no tamanho real |
| Red Bull Ring | 4 318 m | touro de aço de 36 → 17 m, grama acompanhando 70 m de desnível |
| Zandvoort | 4 259 m | curvas inclinadas coladas na borda nova, Hugenholtz com tribuna |
| Suzuka | 5 808 m | ponte do oito, torre, torii e parque no tamanho real |
| Melbourne | 5 278 m | mureta e alambrado na borda nova, lago que não corta a pista |

Em todas valem os cuidados visuais:

- base sólida com textura sob a pista;
- nada flutuando, conferido na câmera de primeira pessoa;
- torcida só nas arquibancadas;
- grama, areia ou brita no nível do asfalto, sem vão.

Os prints de cada pista estão em `C:\Users\thiag\Downloads\lts\prints\<pista>\`.

### No comprimento real, mas sem a passada visual

Estão na corrida avulsa, fora da carreira:

- **Xangai, Bahrein, Jeddah, Miami, Montreal e Austin:** comprimento, largura, relevo, barreiras e robôs já estão na escala real. As peças próprias do cenário ainda estão grandes.
- **Monza e Barcelona:** ainda no tamanho antigo, porque o traçado é desenhado à mão e precisa ser convertido.
- **Baku, Singapura e Las Vegas:** ainda no tamanho antigo, porque o cenário sai de dados gerados.

## Pilotagem e jogabilidade

- **Direção menos sensível:**
  - **Teclado e toque:** viram o volante em rampa, levando 0,39 s até o batente. Antes a tecla dava o volante inteiro na hora.
  - **Analógico:** mais macio no centro (curva 1,4 → 1,8).
  - **Batente:** a física segura 1,1× o que o pneu aguenta (era 1,25×).
- **Carros desiguais de novo:** `PARELHO` voltou a 1, como antes de 7/nov. Velocidade final de 411 a 440 (era 416 a 433) e aderência de 412 a 454 (era 418 a 444).
- **Vácuo:** de +20% para +6% de velocidade final e aceleração, e de 94 m para 60 m de alcance. O carro de trás chegava rápido demais e o freio não acompanhava.
- **Overtake (ERS):** no **Shift esquerdo**. Vale também no modo automático, onde antes a tecla era ignorada.
- **Trânsito dos robôs na pista de 12 m:**
  - A "faixa" do robô era de 34 u, a largura do carro antigo mais 8, e com a pista nova cobria a pista inteira. Agora é `W_CARRO + 8`.
  - A folga ao emparelhar ficava menor que um carro e agora tem no mínimo `W_CARRO + 3`.
  - O rastro do vácuo tem 12 u de largura (era 24).
  - Medido em Hungaroring, só no servidor, com 21 robôs e 2 voltas: antes 19 de 21 completavam as 2 voltas, e só 11 com o servidor carregado, com voltas de até 136 s. Agora **21 de 21 completam, e as melhores voltas ficam de 61,9 a 71,2 s.**
- **Folga à frente dos robôs (#610):** já está na `main` e veio junto.

## Teclas e atalhos (todos remapeáveis na tela Controles)

| Tecla | Faz |
|---|---|
| Shift esquerdo | ERS / overtake (a marcha acima do câmbio manual ficou só no Shift direito) |
| Q / E | Páginas do MFD (eram N / M) |
| H | HUD: clássico → telemetria → sem HUD |
| J | Ajuste da câmera (era H) |
| T | Torre completa / compacta |
| N | Minimapa da pista inteira / de perto |
| M | Som liga / desliga |
| U | Rádio do engenheiro liga / desliga |
| F | Tela cheia |
| K | Abre a tela Controles |

Quem já tinha trocado teclas continua com as suas.

## Gráficos: "Carros dos adversários"

Opção nova na tela de ajustes da sala e no MFD (Ajustes). Vale só para os carros dos outros; o seu fica sempre completo.

- **Completo:** o de antes.
- **Leve:** as peças pequenas somem a partir de 29 m, e de 104 m fica só corpo e pneus.
- **Mínimo:** a partir de 10 m e de 46 m.
- **Automático** (o padrão) segue a qualidade gráfica: Baixa usa Mínimo, Média usa Leve e Alta usa Completo.

Medido no grid de Interlagos com 21 robôs:

| Nível | Chamadas de desenho | Triângulos |
|---|---|---|
| Completo | 636 | 1,30 milhão |
| Leve | 497 (−22%) | 1,05 milhão (−19%) |
| Mínimo | 417 (−34%) | 0,95 milhão (−27%) |

## Recordes

As migrações `029` a `046` zeram voltas, recordes e setores de cada pista que mudou de tamanho: Cidade do México, Spa, Mônaco, Hungaroring, Madri, Catar, Abu Dhabi, Silverstone, Melbourne, Xangai, Suzuka, Bahrein, Jeddah, Miami, Montreal, Red Bull Ring, Zandvoort e Austin. Se a 029 e a 030 já rodaram antes do #608, não rodam de novo, porque o banco guarda o nome de cada migração.

## O que não foi testado

- A suíte de testes não rodou localmente: só `node --check`. Ela fica com o CI.
- Testes antigos que medem tamanho de pista podem quebrar.
- Corrida com robôs só no servidor, sem desenhar: as 12 primeiras pistas antes da correção do trânsito, sem nenhum abandono, e Hungaroring depois dela.
- A pilotagem nova, as teclas e a opção de gráficos não foram jogadas por ninguém ainda.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
