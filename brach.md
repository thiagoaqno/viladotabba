# McLaren e Mercedes de 2026 refeitas pelas imagens do Thiago

Feito em cima do #865 (o mapa de visibilidade da pintura). O merge do #865 entrou antes do segundo commit dele, então este PR também traz:

**Os adesivos de baixo da asa traseira vão para trás dela** (pedido do Thiago). As marcas de `ASA_BAIXO` passam a ser desenhadas na vista R, na face de trás do flap, e embaixo fica só a cor. A face de trás foi medida nos modelos: y 0,66 a 0,84 e x ±0,46 no de 2026; y 0,68 a 0,78 e x ±0,37 no de 2022. As marcas ficam centradas em y 0,735, com no máximo 0,085 m de altura.
- Saíram as marcas repetidas que já estavam na vista R, mais altas que o flap: McLaren, Ferrari, Mercedes, Racing Bulls, Aston Martin, Williams e Audi.
- A zona "Asa traseira" do Studio, na vista R, agora começa em y 0,64.

**Red Bull refeita pelas oito imagens** de `Carros F1/2026/Redbull`:
- a camuflagem digital;
- o touro em vetor (marca `touro`; antes era um recorte borrado do logo de 512 px) na tampa, no bico e em cima;
- o sol e o bico amarelos, o número no vermelho da barbatana;
- o Red Bull de contorno branco, o ORACLE;
- CARLYLE, 1Password, ROKT, indeed, Clear, Siemens, Hexagon e a Ford Racing;
- as placas da asa traseira azuis com o Mobil 1 e a Heineken.

**McLaren**, pelas nove imagens de `Carros F1/2026/Mclaren`:
- O preto agora fica só na frente da tampa, de trás do cockpit até a barbatana, onde vai o Gemini com a estrela. Dali ele desce em diagonal pela caixa lateral até o assoalho, com o OKX e o Mastercard nele. Antes a tampa era preta até a asa.
- A traseira da tampa e a barbatana ficam papaia, com a DELL preta e o número preto. A frente da caixa, embaixo, é escura.
- Cockpit e lateral: o RICHARD MILLE em cima do painel do DP WORLD, o okta e o CISCO perto do halo, o VELO preto.
- Asas: a diagonal preta no alto das caixas (vista de cima), o OKX preto em cima da asa traseira e o workday na ponta da asa dianteira.

**Mercedes**, pelas nove imagens de `Carros F1/2026/Mercedes`:
- A parte de baixo da caixa lateral fica preta, com o filete verde-água em cima e o PETRONAS branco. Antes era um PETRONAS preto no prata.
- O 63 verde-água vai na barbatana.
- O Petronas verde-água vai no bico.
- As placas da asa traseira levam a Snapdragon, o CROWDSTRIKE e o PETRONAS PRIMAX, com a gota mais embaixo.

As filas de patrocínios do bico das duas já estão no atlas do nariz (`texturaDoCockpit`), em alta resolução, e ficam como estavam.

Marcas novas em `f1-marcas.js`: workday, deloitte, cisco, dewalt, rubrik, okta, primax, sap, akkodis e einhell.

Sem print (só `node --check` e o desenho rodado num canvas de mentira no node): o Thiago testa jogando.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
