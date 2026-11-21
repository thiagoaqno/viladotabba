# Robôs com a linha de corrida de verdade, pneu com desgaste uniforme, chuva por lugar, MFD e os muros de Mônaco

Pedidos do Thiago de 2026-11-21 (itens 1, 3, 5, 6 e 7 da lista; o replay 3D e o controle no celular vêm em PRs próprios).

## Robôs (item 1)
Medido com `klk/medir/voltas.js` (os robôs sem tela, a física do servidor) e com o banco da carreira do PC (Melbourne e Suzuka da temporada 1).

- **A linha de corrida ficava no eixo da pista, em todas as pistas.** O otimizador da curvatura mínima (`corrida-linha.js`, gradiente conjugado com os pontos de 6 em 6 u) não convergia: em Suzuka só 6 dos 2389 pontos chegavam na beira e 67% ficavam a menos de 1/5 da meia-largura do centro. Depois o ajuste pelo tempo de volta (`linhaDeCorrida`) só andava ±21 u a partir dali.
  - Agora a curvatura mínima é medida no grosso (`curvaturaMinima`, nós de 48, 24 e 12 pontos, Gauss-Seidel preso entre as beiras), e o tempo de volta desce em `[[32, 16], [16, 8], [8, 4]]`. Em Suzuka, 43% dos pontos passaram a ficar perto da beira.
  - `corrida-linhas-f1.json` foi refeito para 23 pistas do calendário. **Mônaco ficou com a linha antiga:** a nova ganhava só 0,4 s lá, e no pelotão as batidas iam de 264 para 394.
  - Suzuka, Cadillac do Pérez, robô sozinho, nível 100: **45,95 → 43,8 s**, sem batida.
  - Um robô sozinho, 2 voltas, a segunda volta, main → este PR: todas as pistas mais rápidas, nenhuma batida.
    - Interlagos 41,95 → 41,7; Monza 39,2 → 38,35; Barcelona 42,6 → 40,95; Silverstone 45,6 → 44,2; Xangai 53,3 → 50,55
    - Bahrein 46 → 44,1; Jeddah 43,65 → 41,5; Miami 43,5 → 41,7; Montreal 39,55 → 39,2; Red Bull Ring 38,6 → 37,25; Spa 52,05 → 49,95
    - Hungaroring 43,25 → 41,8; Zandvoort 42,95 → 42,5; Madri 43,85 → 42,25; Baku 43,4 → 42,45; Singapura 60,4 → 59,5; Austin 53,6 → 51,95
    - México 39,9 → 38,2; Las Vegas 45,5 → 44; Catar 45,65 → 44,05; Abu Dhabi 43,85 → 42,95; Mônaco 50,9 → 50,05
- **"Na minha faixa" medido pela pista:** com a linha usando a pista toda, o lado do carro da frente medido no quadro do próprio robô errava numa curva (o outro já tinha ido para o ápice e parecia estar de lado). Aí o robô não freava por trânsito e batia na traseira. Agora, com o outro a mais de 1,5 carro, a faixa compara o lateral dele no ponto dele com o meu no meu (como já era em Mônaco).
  - Suzuka, 21 robôs, 5 voltas, sementes 1 e 2: 232 e 162 batidas → 74 e 86 (a main: 74 e 48).
- **Nível 100:** o robô pode passar um pouco do limite calculado da curva e da freada (`LAT_ALEM` = 1,04 em `corrida-piloto.js`), e o difícil mira 0,5% abaixo do ideal do carro (`FOLGA_F1.dificil`, era +0,5%).
  - Medido: com 1,04, Suzuka 42,85 s e Melbourne 39,25 s.
  - Com 1,06 ele escorrega: 46,2 s em Suzuka.
  - Com o alvo a −2%, todos batiam no teto da conta e andavam igual.
- **ERS:** só na reta (com o ERS na curva, 274 batidas em Suzuka; só na reta, 74). A curvatura do ponto de agora e a de ~2 carros adiante têm de estar abaixo de 1/1500. Vale na ultrapassagem e também no ERS automático colado no da frente (`usarErsAuto`, que era `reta || perto`).
- **Fim de corrida:** a 3 voltas ou menos do fim, o robô compara, pela tabela da pista, ficar no pneu gasto com parar. Com o penhasco mais suave, às vezes ficar sai mais barato.
- **Batidas no pelotão:** ficaram no nível da main (Melbourne, 3 sementes: 302 contra 324; Mônaco: 249 contra 204, com 15 batidas de muro a mais porque agora os muros estão onde as peças estão). Testei e **descartei**, porque não reduziram:
  - freio de emergência pelo tempo até a batida (0,5 a 1 s): 90 a 124 batidas contra 74 a 86, porque o freio brusco leva o de trás junto;
  - a distância segura supondo que o da frente freia no máximo: 348 batidas (152 fortes) contra 322 (142), em 4 sementes;
  - o atacante só seguir fechando com o alvo 80% de lado: 136 contra 74.
- **Ainda não resolvido:** no pelotão a média por volta quase não muda (Melbourne ~48 s contra 39 s sozinho). Quem segura é o trânsito, as paradas e as batidas. É o próximo PR: as linhas variadas por piloto (para não virar fila indiana) e a freada no pelotão.

## Pneu (item 3)
- **Degradação uniforme:** a vida que o HUD mostra (100% novo, 0% no penhasco) tira 1% a cada 10%. Vale para a aderência, o freio e a tração (`PERDA_VIDA` = 0,10).
  - Passou do penhasco: mais 10% de uma vez (`PERDA_RUINA`). Antes eram 3% até o penhasco e 60% da aderência na ruína.
- Medido em Melbourne com o médio: 0,4 de desgaste deixa a volta 3% mais lenta, e 0,79 deixa 7% mais lenta.
- `f1-pneus-tabela.js` refeito (`ferramentas/pneus-tabela.js`), para a estratégia dos robôs usar a degradação nova.

## MFD (item 5)
- A aba **Próximo pneu** só aparece quando a equipe sugere a parada. B, o pneu do Resumo e o Enter da sugestão levam aos Jogos de pneu.
- O pneu é sempre em % no Resumo e na página de pneus, nunca em voltas.

## Mônaco (item 6)
- O `cenario/monaco.json` estava sem a colisão pelas peças, e a física usava os muros antigos da pista.
  - Medido: em vários trechos o muro ficava mais de 10 u fora do guard-rail colocado no editor (dá para atravessar).
  - Em outros havia muro onde não tem peça nenhuma (o muro invisível).
- Agora `colisao: "pecas"` está ligado.
- A linha dos robôs (`Piloto.murosDasPecas`) e o teto do muro (`tetoDoMuro`) usam as mesmas barreiras.
- A correção de muro (`linha-correcao.json`) foi refeita para Mônaco (a linha de sempre, com os muros novos) e para Baku (a linha nova).

## Chuva (item 7)
- **Chance por lugar** (`CHUVA_LOCAL`):
  - média de 35% no calendário: Spa 69%, Interlagos e Silverstone 60%, os desertos e Las Vegas 8%;
  - medido em 24 pistas × 300 sementes: chove em 37,5% dos GPs;
  - de 65% para cima chove sempre, e abaixo de 10% nunca (eram 50% e 25%).
- **O céu fecha antes da chuva** (40 a 110 s) e segue fechado depois (50 a 140 s): o `nuvens` do roteiro, lido em `climaEm`.
  - Num GP que ameaçou e não choveu, às vezes o céu fecha um tempo sem gota.
- **Força:**
  - chuva forte;
  - garoa que vira forte;
  - forte que alivia para garoa (novo);
  - só garoa.
- **A chuva para mais:**
  - a garoa em 50% das vezes (era 25%), a forte em 65% (era 50%);
  - o que ela dura além do mínimo ficou 15% menor;
  - medido: 58% das chuvas param antes da bandeirada.
- **O Variável** não começa mais sempre na mesma volta: ele começa no começo, no meio ou no fim da corrida.
