# As pinturas de 2026 refeitas pelas imagens do Thiago e os adesivos de baixo da asa atrás dela

Continuação do #865, que trouxe o mapa de visibilidade, a folha mais nítida e a Cadillac. O merge do #865 entrou antes do segundo commit dele, então a Red Bull e a asa vêm aqui. Tudo num PR só, a pedido do Thiago. As imagens de cada equipe estão em `Downloads\Carros F1\2026\<equipe>`.

## Os adesivos de baixo da asa traseira vão para trás dela
- As marcas de `ASA_BAIXO` passam a ser desenhadas na vista R, na face de trás do flap. Embaixo da asa fica só a cor.
- A face de trás foi medida nos modelos: y 0,66 a 0,84 e x ±0,46 no de 2026; y 0,68 a 0,78 e x ±0,37 no de 2022. As marcas ficam centradas em y 0,735, com no máximo 0,085 m de altura.
- Saíram as marcas repetidas que já estavam na vista R, mais altas que o flap. A zona "Asa traseira" do Studio, na vista R, começa em y 0,64.

## As equipes
- **Red Bull** (8 imagens):
  - a camuflagem digital;
  - o touro em vetor (marca `touro`; antes era um recorte borrado do logo de 512 px) na tampa, no bico e em cima;
  - o sol, o bico amarelo e o número no vermelho da barbatana;
  - o Red Bull de contorno branco, o ORACLE e os patrocínios de 2026;
  - as placas da asa traseira azuis com o Mobil 1 e a Heineken.
- **McLaren** (9):
  - o preto só na frente da tampa, descendo em diagonal pela caixa até o assoalho (OKX e Mastercard);
  - a traseira e a barbatana papaia, com a DELL e o número pretos;
  - o OKX em cima da asa traseira.
- **Mercedes** (9):
  - o PETRONAS branco no preto embaixo da caixa, com o filete verde-água;
  - o 63 na barbatana e o Petronas no bico;
  - Snapdragon, CROWDSTRIKE e PETRONAS PRIMAX nas placas.
- **Haas** (7), do zero:
  - a frente branca com o filete vermelho, em cunha até embaixo do halo;
  - a faixa branca da tampa com o MoneyGram e o MGM Rewards;
  - o HAAS na caixa e em cima, o 87 vermelho;
  - o TOYOTA GAZOO Racing nas asas.
- **Williams** (6), acertos:
  - o 55 na barbatana, o A da Atlassian, a entrada de ar cobre;
  - KOMATSU e brillio nas placas, ATLASSIAN em cima da asa;
  - a fila do bico como na foto.
- **Racing Bulls** (9), do zero:
  - branca, com as faixas azuis;
  - o touro rosa na tampa, a ponta do bico amarela;
  - o carbono embaixo e o VISA azul-marinho grande na caixa;
  - a asa traseira branca com TUDOR e Cash App, as placas pretas com o VISA e o RB.
- **Aston Martin** (5), acertos:
  - o verde-azulado mais vivo;
  - o painel preto da caixa com o aramco;
  - ASTON MARTIN, HRC e Valvoline na tampa;
  - a asa dianteira de carbono e o alto da traseira azul-claro;
  - atrás da asa, o aramco no degradê verde e azul.
- **Alpine** (6), do zero:
  - o marinho embaixo e o royal em cima;
  - o bico e o chassi rosa até o cockpit, com a fila de patrocínios;
  - o BWT rosa enorme de borda azul-marinho na caixa, o eni na tampa;
  - o bloco rosa com o "A" branco;
  - os painéis rosa da asa dianteira com o BWT de borda branca;
  - o BWT em cima da asa traseira e o ALPINE atrás dela.
- **Audi** (6), acertos:
  - o Revolut, o Castrol e o NEXO no lugar das fotos, o bp;
  - os anéis vermelhos grandes em cima da asa traseira;
  - a fila do bico: anéis, R, Libertex, visit QATAR, PIRELLI, perk+ e adidas;
  - o 5 na barbatana.

Nas McLaren e Mercedes, a fila do bico já está no atlas do nariz (`texturaDoCockpit`) e ficou como estava.

## Marcas novas (`f1-marcas.js`)
touro, onepassword, indeed, siemens, hexagon, clear, workday, deloitte, cisco, dewalt, rubrik, okta, primax, sap, akkodis, einhell, gazoo, mgm, haash, oakberry, playngo, brillio, reviva, ingenuity, confluent, octave, dynatrace, neft, mobil, hrc, vugo, binance, apecoin, modocasino, ada, changeworld, infinox, businessolver, mntn, brb, arcticwolf, mobilize, moserwatch, perk, libertex, bwtc e alpinea.

O touro do Studio, quando espelhado num lado, vira uma camada própria (`espelhar`). Saiu a função `meioTom`, que ficou sem uso.

Sem print: só `node --check` e as 11 folhas desenhadas num canvas de mentira no node, com todas as marcas aparecendo. O Thiago testa jogando.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
