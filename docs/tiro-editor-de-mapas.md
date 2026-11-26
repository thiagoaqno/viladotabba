# Editor de mapas do Tiro da Galera

O editor monta mapas novos para o Tiro sem mexer em código. Ele roda dentro do próprio jogo, então as peças são as do jogo. O
botão **Jogar** monta o mapa de verdade e começa uma partida solo com bots.

## Como abrir

- **No PC, para gravar:** rode `Editor de mapas do Tiro.bat`, em `Downloads\lts`. Ele sobe o servidor do jogo com o editor
  ligado e abre `http://localhost:3125/tiro/?editor=1`. O botão **Salvar** grava em `ferramentas/tiro-mapas/editor/<id>.json`.
- **No site (`/tiro/?editor=1`):** o editor abre do mesmo jeito, mas não grava no projeto. O **Salvar** baixa o `.json`.
- **Rascunho:** fica guardado no navegador. Fechar e abrir de novo volta onde parou.

## Controles

| O quê | Como |
|---|---|
| Olhar | botão direito arrastado |
| Andar | W A S D (Shift corre), Q desce, E sobe |
| Velocidade da câmera | roda do mouse |
| Colocar peça | escolha no catálogo (esquerda, cada peça com uma prévia 3D vista de frente) e clique na cena; Esc para de colocar |
| Selecionar | clique na peça |
| Mover | arraste a peça; as setas empurram 25 cm (Shift: 1 m), relativas à câmera; PgUp/PgDn sobem e descem |
| Girar | R (90°); Shift+R gira 15° (só prefab e objeto) |
| Duplicar / apagar / desfazer | Ctrl+D / Delete / Ctrl+Z |
| Focar na peça | F |

O painel da direita mostra a posição, o tamanho, o giro, a matéria, a cor e a colisão da peça selecionada.

## Regras para o mapa funcionar

Estas regras garantem que os bots andem, que os jogadores nasçam no lugar certo e que ninguém caia por engano.

- **O chão das aparições fica em y = 0.** O jogo põe os soldados nessa altura.
- **O time Bravo nasce espelhado.** Cada "Nascer" (time Alpha) em (x, z) vira um Bravo em (x, -z). Faça a base do Alpha num
  lado do eixo z e deixe o outro lado parecido.
- **O mapa não tem chão próprio.** Só existe o que foi colocado, e quem cai no vazio morre. Feche as bordas com mureta ou com
  a "Parede invisível 4 x 4".
- **Escadas e rampas sobem no máximo 0,62 m por metro.** É o limite dos bots. A "Escada (sobe 3 m)" tem 5,5 m de comprimento;
  uma escada mais curta para a mesma altura, os bots não usam.
- **Nada de passagem embaixo de escada.** O jogo não faz rota por baixo de uma rampa.
- **Passagens com pelo menos 1,5 m.** O bot precisa de uns 42 cm de folga de cada lado. Porta estreita, corredor de 1 m e
  objetos colados uns nos outros fecham a rota.
- **Paredes e caixas giram só de 90 em 90 graus**, porque as colisões do jogo são alinhadas aos eixos. Prefabs e objetos giram
  livre.
- **Pontos de dominação são 3 (A, B, C).** Sem os 3, o modo dominação fica desligado no mapa. A "Queda do mecha" também tem 3
  pontos; sem eles, o mecha cai nos pontos de dominação.
- **Pontos dos bots:** se o mapa não tiver `poi`, o jogo usa o topo de cada chão grande, os pontos de dominação e as bases.

## Do editor para o site

1. Salve no editor. Isso grava `ferramentas/tiro-mapas/editor/<id>.json`.
2. Rode `node ferramentas/tiro-frontline.js ../_riposte/src-rip/dist`. Ele monta o jogo com o mapa novo, que entra na lista
   de mapas.
3. Abra um PR para a `main` com o `.json` e o `public/tiro/index.html` remontado.

## Formato do `.json`

```
{
  "id": "galpao", "nome": "Galpão", "tag": "Galpão do porto", "desc": "texto do cartão do mapa",
  "ceu": "meltem",
  "mar": { "y": -4 },
  "pecas": [
    { "t": "caixa",  "p": [0, -0.3, 0], "s": [8, 0.3, 8], "r": 0, "m": "concrete", "cor": [0.75, 0.74, 0.72] },
    { "t": "escada", "p": [0, 0, 6], "s": [2, 3, 5.5], "r": 180, "m": "wood", "cor": [0.66, 0.46, 0.3] },
    { "t": "prefab", "nome": "container", "p": [5, 0, -4], "r": 30, "e": 1 },
    { "t": "prop",   "nome": "barrel", "p": [2, 0, 3], "r": 0 },
    { "t": "luz",    "p": [0, 3, 0], "forca": 1.4, "raio": 7, "cor": [1, 0.85, 0.65] }
  ],
  "nascer": [[-3, 16], [0, 16], [3, 16]],
  "dom": [[-5, 0], [0, -10], [5, 0]],
  "mecha": [[0, 12], [0, 0], [0, -12]],
  "poi": [[0, 0, 10]]
}
```

- **`ceu`:** o céu e a luz de um mapa do jogo. Valem `sable`, `givre`, `embruns`, `floreal`, `meltem`, `tephra`, `stratus`,
  `simoun` e `lotissement`.
- **`mar`:** a altura da água, ou `null` para não ter mar.
- **`p`, `s` e `r`:** `p` é o **centro de baixo** da peça (x, y, z), em metros. `s` é a largura (x), a altura (y) e a
  profundidade (z). `r` é o giro em graus. A escada sobe para +z com `r` 0 (90: +x, 180: -z, 270: -x).
- **Superfície de caixa e escada (`m`):** escolhida na galeria do painel, com miniaturas. A cor (`cor`) multiplica a textura:
  muitas fotos são acinzentadas e ganham a cor por ela (tijolo, por exemplo, pede uma cor de barro). `"col": false` faz a caixa
  não colidir. `tx` é o tamanho da textura (1 = normal, 2 = o dobro, 0,5 = a metade). Valem:
  - **Parede:** `plaster` (reboco), `plaster2` (reboco gasto), `brick` (tijolo), `ashlar` (pedra talhada), `stone`, `drystone`
    (pedra seca), `adobe`, `pise` (taipa), `concrete`, `slate` (ardósia), `rock`, `strata` (rocha em camadas).
  - **Chão:** `asphalt`, `pavers` (lajota), `cobble` (paralelepípedo), `flagstone` (laje de pedra), `tiles` (ladrilho),
    `edAzulejo`, `edXadrez` (piso xadrez), `boards` (tábuas), `rug` (tapete), `galets` (seixos), `pathgravel` (cascalho), `sand`,
    `dirt`, `humus` (terra escura), `lawn` (grama), `snow`, `snowpack` (neve batida), `ash` (cinza).
  - **Madeira:** `wood`, `timber` (viga), `paintwood` (madeira pintada), `crate` (caixote), `shutter` (veneziana), `bark`
    (casca de árvore).
  - **Metal:** `steel`, `rust` (ferrugem), `edChapa` (chapa xadrez), `edListras` (faixa de perigo amarela e preta),
    `rollshutter` (porta de enrolar), `corrugated` (chapa ondulada), `paint` (pintura), `carpaint` (pintura brilhante).
  - **Outros:** `rooftiles` (telhas), `canvas` (lona), `burlap` (juta), `cardboard` (papelão), `plastic`, `rubber`, `glass`,
    `dark`.
  - Cada mapa carrega só as fotos que usa. As que começam com `ed` são desenhadas pelo jogo (as nossas).
- **`prop` e `prefab`:** `prop` é objeto solto, que voa com tiro e explosão (barril, cadeira, garrafa...). `prefab` é cenário
  fixo, com colisão.
- **`e`:** a escala do prefab ou do objeto.
- **`grafite`:** texto pintado com spray numa parede, em `{ "t": "grafite", "p": [x, y, z], "r": graus, "s": [largura, altura], "texto": "...", "estilo": "bomb", "cor": [r, g, b], "borda": [r, g, b] }`.
  - O texto tem até 40 letras.
  - O estilo pode ser `bomb` (letra gorda com contorno), `pixo` (pichação reta), `escorre` (com tinta escorrendo) ou `tag` (assinatura).
  - A pintura fica na frente da peça (+z), a 2 cm de `p`. Ela não colide nem segura bala.
  - No editor, fica no fim da aba Básico ("Grafite").
- **`poi`:** os pontos que os bots visitam, `[x, y, z]` ou `[x, y, z, 1]` (com o 1, o bot para e segura a posição: laje,
  janela, canto). É opcional.
- **Outros campos opcionais:** `zonas` (`[nome, x0, x1, z0, z1]`, o nome da área no mapinho), `sniper` (`[x, y, z]`, onde o
  sniper segura) e `som` (o som dos passos: `concrete`, `wood`, `metal`, `dirt`, `grass`). O editor não mexe neles, mas
  guarda os que vierem no `.json`.
- **`ambiente`:** o som ambiente, separado do céu. Os valores são `amb_floreal` (bairro), `amb_sable`, `amb_givre`, `amb_tephra`, `amb_stratus`, `amb_meltem` e `amb_embruns`; os dois últimos têm ondas. Sem esse campo, o mapa usa o som do mapa do céu, e num mapa sem mar o som de beira-mar vira o de bairro.
- **Parede invisível:** uma caixa com `"inv": true` segura gente e não aparece no jogo (no editor, fica meio transparente).

## Para o Codex (ou quem montar o mapa direto no `.json`)

- **Siga as regras acima,** principalmente a altura das aparições, o espelho do Bravo, a inclinação das escadas e a largura das
  passagens.
- **Use só os nomes das tabelas abaixo.** Um nome que não existe é pulado sem erro, e a peça some.
- **Teste no editor:** depois de mexer, abra o mapa no editor (**Abrir mapa…**) e aperte **Jogar** para ver os bots andando.
- **Peça nova** (que não está nas tabelas): descreva o nome, o tamanho em metros, a forma, as cores, se colide e se é objeto
  solto. Ela entra como prefab novo em código, como os do Iate em `ferramentas/tiro-mapas/iate.js`, e aparece no catálogo do
  editor.

## Peças de cobertura, cidade e fábrica (prefixo `kc`)

Feitas para mapas de tiro, em `ferramentas/tiro-editor/pecas.js`. Todas colidem (seguram gente e bala), o comprimento fica em x
e a origem é o centro de baixo.

| Nome | Tamanho (larg x alt x prof, m) | O que é |
|---|---|---|
| `kcJersey` | 3 x 0,85 x 0,6 | barreira New Jersey de concreto (cobre agachado) |
| `kcSacos` | 2,4 x 1,2 x 0,6 | muro de sacos de areia (cobre de pé) |
| `kcSacosBaixo` | 2,4 x 0,6 x 0,6 | sacos de areia baixos (cobre agachado) |
| `kcGabiao` | 2,1 x 1,4 x 1,05 | dois cestos de tela cheios de terra |
| `kcMuroQuebrado` | 4 x 1,3 a 2,6 x 0,3 | muro de concreto com o topo quebrado e ferros para fora |
| `kcPilar` | 0,8 x 3,1 x 0,8 | pilar de concreto quebrado no alto |
| `kcCarretel` | 1,3 x 1,9 x 1,6 | carretel de cabo grande, deitado |
| `kcGuarita` | 2,4 x 2,7 x 2,4 | guarita fechada com janelas escuras |
| `kcTanque` | 5,5 x 2,55 x 2,2 | tanque de combustível deitado em berços |
| `kcTapume` | 3 x 2,2 x 0,1 | chapa de aço ondulado entre postes |
| `kcPaletes` | 1,2 x 1,6 x 1 | dois paletes de carga embrulhada |
| `kcBarreiraAgua` | 2 x 0,8 x 0,5 | barreira plástica vermelha e branca |
| `kcConteinerAberto` | 6,1 x 2,6 x 2,4 | contêiner sem as portas: dá para entrar e atirar de dentro |
| `kcPontoOnibus` | 3,5 x 2,6 x 1,55 | ponto de ônibus com vidro atrás e nas laterais; dá para entrar pela frente |
| `kcBanca` | 2,9 x 2,5 x 2,1 | banca de jornal fechada |
| `kcCarroQueimado` | 1,9 x 1,25 x 4,4 | carcaça de carro queimado (comprido em z) |
| `kcCavalete` | 2 x 1,1 x 0,2 | cavalete de obra listrado (cobre agachado) |
| `kcEntulho` | 3 x 1,3 x 2,4 | monte de entulho com ferros |
| `kcManilhas` | 2,4 x 2,2 x 2,2 | três manilhas de concreto empilhadas |
| `kcPrateleira` | 3 x 3 x 1,2 | prateleira de galpão com caixas |
| `kcTambores` | 1,2 x 1,05 x 1,2 | quatro tambores num palete |
| `kcVigas` | 4 x 0,9 x 1,2 | pilha de vigas de aço |
| `kcAlambrado` | 3 x 2,2 x 0,1 | cerca de tela de arame (vê através, mas segura bala) |
| `kcArmarioEletrico` | 1,6 x 1,6 x 0,8 | armário elétrico de rua |

### Favela e casas

A frente (porta, portão, placa) olha +z com `r` 0. As casas térreas dão para entrar: a porta tem 1,5 a 1,6 m, e os bots passam.
A laje e o telhado não têm escada: para fazer rota de telhado, encoste uma **Escada** do editor e ligue as lajes com caixas
(passarelas), seguindo as regras de inclinação e largura acima.

| Nome | Tamanho (larg x alt x prof, m) | O que é |
|---|---|---|
| `kcCasaTijolo` | 5,2 x 3,7 x 5,2 | casa de tijolo térrea, dá para entrar; janelas com grade; laje a 2,95 m com ferros, caixa d'água e antena |
| `kcCasaTelhado` | 5,5 x 3,2 x 5,6 | a mesma casa com telhado de fibrocimento caindo para trás |
| `kcSobrado` | 6,2 x 6,4 x 5,2 | sobrado fechado: dois portões de enrolar vermelhos, janelas em cima, laje a 5,75 m com mureta de 0,5 m |
| `kcCasaObra` | 6,3 x 5,5 x 5,9 | casa em obra: térreo de tijolo com vãos (dá para entrar), laje a 2,94 m, pilares e paredes de cima pela metade |
| `kcCasaConcreto` | 5,5 x 3,7 x 5 | casa de reboco cor de areia, dá para entrar; laje a 3,2 m com platibanda de 0,5 m |
| `kcCasaConcreto2` | 5,5 x 6,3 x 5 | a mesma com um segundo volume fechado no fundo e terraço na frente |
| `kcPredioVelho` | 8,6 x 11,4 x 7,6 | prédio velho de três andares, fechado: loja com porta de enrolar, janelas com veneziana, sacada, telhado escuro |
| `kcLanchonete` | 4,6 x 3,9 x 4,7 | lanchonete com balcão aberto na frente, placa amarela, toldo listrado, porta do lado (-x); laje a 2,95 m |
| `kcPortaoGaragem` | 3,4 x 2,9 x 0,35 | parede de tijolo com portão de enrolar vermelho e pilares amarelos (a frente em z = 0, a parede atrás) |
| `kcMuroPortao` | 6 x 2,35 x 0,3 | muro chapiscado com vão de 1,6 m e portão de grade aberto para -z |
| `kcPuxadinho` | 3,7 x 2,8 x 2,8 | telhado de zinco enferrujado em quatro esteios (sombra no beco) |
| `kcCaixaDagua` | 1,5 x 1 x 1,5 | caixa d'água azul de 1000 litros |
| `kcPoste` | 2 x 9 x 2 | poste de concreto com cruzeta, transformador, luminária e fios |
| `kcArCondicionado` | 0,8 x 0,5 x 0,35 | ar-condicionado: as costas em z = 0 (encoste na parede) e suba com PgUp |
| `kcAntena` | 0,6 x 0,8 x 0,6 | antena parabólica (sem colisão) |
| `kcGuardaSol` | 2,4 x 2,45 x 2,4 | guarda-sol amarelo e branco com mesa de plástico e duas cadeiras vermelhas |
| `kcBananeira` | 3 x 2,6 x 3 | bananeira (só o tronco colide) |
| `kcBarraca` | 3,2 x 2,4 x 1,9 | barraca de feira com lona amarela, mesa e caixotes de fruta |
| `kcBarracaAzul` | 3,2 x 2,4 x 1,9 | a mesma barraca com lona azul |
| `kcArvoreCanteiro` | 4,8 x 6 x 4,8 | árvore num canteiro octogonal de concreto (o canteiro cobre agachado) |
| `kcPredioFavela3` | 6,8 x 9,3 x 5,7 | prédio de favela de três andares, fechado: o primeiro andar avança sobre a rua (fachada azul), o segundo recua e deixa um terraço a 5,9 m |
| `kcPredioFavela4` | 4,7 x 12,3 x 5,9 | prédio estreito de quatro andares, fechado: cada andar de uma cor, sacada no terceiro, o último pela metade (laje aberta a 8,85 m) |
| `kcPredioFavelaEsquina` | 6,2 x 9,3 x 6,2 | prédio de esquina em L, fechado: loja verde, terraço a 5,9 m e um canto aberto coberto pela laje (a 2,95 m) |

### Kit da favela

A frente olha +z com `r` 0. As peças "de parede" (quadro de luz, cartazes, bandeira, placa de bar, ar-condicionado) têm as
costas em z = 0: encoste na parede e suba com PgUp. Os módulos têm 3 x 3 m e a laje deles colide, então dá para empilhar: o de
cima vai em y = 2,95. A cor de cada parede vem pronta; para outra cor, use uma caixa com a superfície e o campo **Cor**.

| Nome | Tamanho (larg x alt x prof, m) | O que é |
|---|---|---|
| `kcCasaAmarela` | 6,4 x 5,9 x 6,1 | casa amarela de dois andares: térreo fechado, varanda em cima (laje a 2,95 m) com mureta, esteios e telhado |
| `kcCasaAzul` | 6,5 x 3,4 x 7 | casa azul térrea, fechada, com alpendre de grade na frente (entrada de 1,6 m) e telhado de zinco |
| `kcCasaVerde` | 6,2 x 6,3 x 5,2 | casa verde de dois andares, fechada, base cinza, laje a 5,9 m com mureta e caixa d'água |
| `kcModuloPorta` | 3,2 x 2,95 x 3,2 | módulo de tijolo com porta de ferro |
| `kcModuloGaragem` | 3,2 x 2,95 x 3,2 | módulo de reboco com porta de enrolar |
| `kcModuloAberto` | 3,2 x 2,95 x 3,2 | módulo de reboco aberto na frente (dá para entrar) |
| `kcModuloJanela` | 3,2 x 2,95 x 3,2 | módulo de reboco com janela de grade |
| `kcModuloPortaMadeira` | 3,2 x 2,95 x 3,2 | módulo de reboco com porta de madeira e relógio de luz |
| `kcPilarTijolo` | 0,9 x 1,26 x 0,7 | pilar de tijolo com vão (caixa de passagem na laje) |
| `kcTijolos` | 1,1 x 0,6 x 0,8 | pilha de tijolos de oito furos |
| `kcAntenaTV` | 1,1 x 2,2 x 1,8 | antena de TV espinha de peixe num mastro |
| `kcVaral` | 3,1 x 1,9 x 0,1 | varal entre dois postes, com roupa pendurada |
| `kcBlocos` | 1,2 x 0,95 x 0,8 | blocos de concreto empilhados (cobre agachado) |
| `kcPaleteEmPe` | 1,2 x 1,2 x 0,3 | palete de madeira em pé, encostado |
| `kcTamboresAzuis` | 1,25 x 0,95 x 0,6 | dois tambores azuis de plástico |
| `kcIBC` | 1,2 x 1,15 x 1 | contêiner de água de 1000 litros na gaiola de ferro |
| `kcPneus` | 0,7 x 0,96 x 0,7 | pilha de pneus velhos |
| `kcCarroVelho` | 1,7 x 1,42 x 4 | carro velho de quatro portas (comprido em z) |
| `kcVan` | 1,9 x 1,95 x 4,6 | van velha de passageiros (comprida em z) |
| `kcMoto` | 0,8 x 1,05 x 2 | moto de rua (comprida em z) |
| `kcCacamba` | 1,3 x 1,3 x 1,3 | caçamba de lixo verde de rodinhas |
| `kcCone` | 0,4 x 0,73 x 0,4 | cone de trânsito |
| `kcEngradados` | 0,9 x 0,56 x 0,45 | engradados de plástico vermelho e amarelo |
| `kcSacoLixo` | 0,65 x 0,65 x 0,65 | saco de lixo preto (não colide) |
| `kcQuadroLuz` | 1 x 2 x 0,2 | quadro de luz com três relógios e fios subindo (de parede) |
| `kcCartazes` | 1,4 x 1 x 0 | cartazes colados (de parede) |
| `kcVasoPlanta` | 0,6 x 0,9 x 0,6 | planta num vaso de barro |
| `kcArbusto` | 1,6 x 0,8 x 1,6 | arbusto/samambaia no chão (não colide) |
| `kcBandeira` | 1,5 x 2,07 x 0,05 | bandeira do Brasil pendurada (de parede; a bandeira vai de 1 a 2,05 m) |
| `kcBandeirinhas` | 6 x 3,4 x 0 | bandeirinhas num cordão de 6 m, presas a 3,4 m nas pontas |
| `kcLonaAzul` | 3,4 x 2,4 x 2,6 | lona azul em quatro esteios (passa gente por baixo) |
| `kcPlacaBar` | 0,15 x 1,75 x 1,35 | placa vertical "BAR" num braço (de parede) |
| `kcCobogo` | 2 x 2 x 0,15 | parede de cobogó: vê através, segura gente e bala |

### Prédios de favela com escada

Três destes prédios trazem escada de verdade: o jogo transforma a escada da peça em rampa, e o jogador e os bots sobem. As
escadas têm 2,4 m de largura (os bots passam em qualquer posição do mapa), sobem 0,59 m por metro e são maciças por baixo. Um
prédio com escada **só gira de 90 em 90 graus**; girado de outro jeito, a escada some.

| Nome | Tamanho (larg x alt x prof, m) | O que é |
|---|---|---|
| `kcFavelaTorre` | 4,7 x 15,3 x 4,7 | torre de cinco andares, fechada: cada andar de uma cor, o terceiro e o quarto avançam, duas sacadinhas |
| `kcFavelaComercio` | 9,2 x 6,4 x 5,2 | comércio largo de dois andares, fechado: três portas de enrolar coloridas, fachada rosa em cima, laje com mureta |
| `kcFavelaEscadaLado` | 8,6 x 6,9 x 7,7 | **com escada**: a escada sobe pelo lado +x até um terraço grande a 2,95 m (um quarto fechado no fundo) |
| `kcFavelaEscadaTelhado` | 9,7 x 6,8 x 10,1 | **com escada**: dois lances (frente e lado +x) até a laje do telhado a 5,9 m, com mureta: vista do alto |
| `kcFavelaEscadaFundos` | 7,6 x 6,4 x 7,6 | **com escada**: a escada sobe atrás até um terraço a 2,95 m no fundo (o quarto fica na frente) |

### Quadra

| Nome | Tamanho (larg x alt x prof, m) | O que é |
|---|---|---|
| `kcQuadra` | 30 x 2 x 18 | quadra de futsal de cimento pintado (jogo de 28 x 16), linhas brancas e duas traves com rede (só os postes colidem) |

### Navio

| Nome | Tamanho (larg x alt x prof, m) | O que é |
|---|---|---|
| `kcNavio` | 20,4 x 10,6 x 106 | casco de iate (proa em +z, popa em -z) com o convés principal andável em y = 0, borda falsa sólida de 1,05 m e parede invisível em cima até 4,5 m. A linha d'água fica em y = -4,3: use o mar em -4,3. A meia-largura do convés acompanha o casco (10 m no meio, afinando para a proa a partir de z = 25) |
| `kcNPontePanoramica` | 10 x 3 x 8 | salão ou ponte com vidros fixos, portas de 2,4 m e laje em y = 3 |
| `kcNCabanaConves` | 6 x 2,8 x 4 | cabana aberta com ripas de madeira, ducha e bancos estofados |
| `kcNHidroConves` | 5 x 0,95 x 5 | hidromassagem elevada, borda sólida e água visual |
| `kcNBarConves` | 4,8 x 1,05 x 1,28 | balcão baixo com tampo de teca e frente segmentada |
| `kcNBancoConves` | 2,6 x 0,94 x 0,96 | banco de convés com almofadas claras |
| `kcNClaraboiaConves` | 3 x 0,14 x 3 | claraboia circular baixa com vidro fixo e aro de inox |
| `kcNArmarioLateral` | 5 x 1,12 x 1,21 | armário de convés baixo, com tampo de teca |
| `kcNPostoComando` | 3,4 x 1,55 x 1,1 | console branco com tela escura para a ponte |
| `kcNEscadaConves` | 2,46 x 2,25 x 4,5 | **com escada**: lance de 1,2 m até patamar de 2,4 m; girar de 90 em 90 graus |
| `kcNCorrimaoConves` | 4,08 x 1,08 x 0,08 | corrimão de inox com vidro fixo |
| `kcNArcoSuperior` | 8 x 4,45 x 0,62 | arco estrutural branco para o alto da ponte |
| `kcNCaixaBordo` | 1,3 x 0,56 x 0,81 | caixa de bordo amarela, baixa e com tiras metálicas |
| `kcNSalao` | 11 x 2,95 x 14 | salão com portas de 2,4 m, vidros quebráveis e laje andável |
| `kcNPonte` | 8 x 2,95 x 6 | ponte de comando envidraçada com painel, leme e laje; pode ficar sobre o salão |
| `kcNCassino` | 11 x 2,95 x 16 | cassino com portas, mesas de jogo e laje andável |
| `kcNEscada` | 2,46 x 3,95 x 7,5 | **com escada**: lance externo e patamar até a laje em y = 2,95 |
| `kcNPiscina` | 6 x 0,85 x 4 | piscina elevada com borda sólida e água visual |
| `kcNEspreguicadeira` | 0,8 x 0,85 x 2 | espreguiçadeira de madeira e lona |
| `kcNGuardaSol` | 2,6 x 2,5 x 2,6 | guarda-sol branco |
| `kcNBar` | 3,8 x 1,42 x 1,2 | bar de convés com balcão de madeira |
| `kcNSofa` | 2,6 x 0,95 x 0,9 | sofá de convés branco |
| `kcNMesaCadeiras` | 3,2 x 0,8 x 1,3 | mesa com duas cadeiras |
| `kcNBoia` | 1 x 1 x 0,2 | boia salva-vidas |
| `kcNArmario` | 2,08 x 1,18 x 1,18 | armário de convés baixo |
| `kcNHeliponto` | 12 x 0,025 x 12 | marcação visual de heliponto, para colocar sobre o convés |
| `kcNLancha` | 6 x 2,15 x 2,3 | lancha de apoio sobre berços |
| `kcNGuindaste` | 3,35 x 3,8 x 0,7 | guindaste para lancha, com cabo visual |
| `kcNCaixaEquipamento` | 2 x 1,15 x 1,2 | caixa de equipamento para cobertura |
| `kcNRoloCabo` | 1,2 x 1,27 x 1 | rolo de cabo em suporte |
| `kcNCabeco` | 0,9 x 0,72 x 0,6 | cabeço de amarração |
| `kcNBoteSalvaVidas` | 4,4 x 1,65 x 1,9 | bote salva-vidas sobre suportes |
| `kcNMangueira` | 1,1 x 1,05 x 0,53 | cesto de mangueira de incêndio |
| `kcNConteiner` | 4 x 2 x 2,02 | contêiner de bordo |
| `kcNMastroRadar` | 2,2 x 5,05 x 0,4 | mastro com radar |
| `kcNSatelite` | 1,2 x 1,35 x 1,2 | domo de antena de satélite |
| `kcNFarol` | 0,44 x 1,95 x 0,34 | farol de navegação vermelho e verde |
| `kcNEscotilha` | 1,6 x 0,21 x 1,6 | escotilha fechada no convés |
| `kcNCorrimao` | 4,08 x 1,08 x 0,08 | corrimão de inox com parede invisível para pessoas |
| `kcNExtintor` | 0,35 x 0,7 x 0,26 | extintor com mangueira visual |
| `kcNPlacaSaida` | 1 x 0,3 x 0,09 | placa verde de saída com seta |

#### Módulos de arquitetura do navio

O y da peça é o nível do piso: 0 no convés, 3 ou 6 nos andares superiores e -3 no subsolo. Os pisos têm 0,15 m abaixo desse nível; as lajes das salas terminam exatamente 3 m acima dele. Vidros das salas, do canto e da parede com janela quebram com tiros. As peças com escada ou parede invisível devem ser giradas apenas de 90 em 90 graus e usadas na escala 1.

| Nome | Tamanho (larg x alt x prof, m) | Y de colocação | O que é |
|---|---|---|---|
| `kcNavioComAbertura` | 20,4 x 10,6 x 106 | 0 | casco alternativo com vão central no convés e abertura inferior na popa |
| `kcNModuloSala6x8` | 6 x 3,15 x 8 | 0, 3 ou 6 | sala com portas de 2,4 m, vidros quebráveis, piso e laje |
| `kcNModuloSala8x12` | 8 x 3,15 x 12 | 0, 3 ou 6 | sala envidraçada maior, com portas de 2,4 m e laje |
| `kcNModuloFechado6x6` | 6 x 3,15 x 6 | 0, 3 ou 6 | sala fechada com portas e laje |
| `kcNModuloCanto` | 8 x 3,15 x 4 | 0, 3 ou 6 | extremidade semicircular envidraçada, com porta na face reta |
| `kcNVaranda6` | 6 x 1,2 x 2,5 | 3 ou 6 | varanda de teca com guarda-corpo, aberta para a parede do prédio |
| `kcNVaranda10` | 10 x 1,2 x 2,5 | 3 ou 6 | varanda maior com guarda-corpo |
| `kcNDequeSolario` | 10 x 1,2 x 12 | 3 ou 6 | deque aberto com espreguiçadeiras e acessos laterais de 2,4 m |
| `kcNDequePopa` | 10 x 2,4 x 6 | -1,2 | **com escada**: plataforma de banho, degraus laterais e patamar no convés |
| `kcNEscadaInterna` | 2,8 x 3 x 7,5 | -3 | **com escada**: poço de 6 m com lance e patamar que avança sobre o convés |
| `kcNEscadaExterna` | 2,46 x 4,05 x 7,5 | 0 ou 3 | **com escada**: lance externo e patamar para subir 3 m |
| `kcNEscadaCaracol` | 2,1 x 3 x 2,1 | 0 ou 3 | escada de cenário, fechada para passagem, sem rota para subir |
| `kcNCorredor` | 3 x 3,15 x 6 | -3 | corredor com 2,6 m livres e paredes de 0,2 m |
| `kcNCabine` | 4 x 3,15 x 6 | -3 | camarote com porta de 2,4 m, cama e armário |
| `kcNGaragemLanchas` | 10 x 3,15 x 12 | -3 | garagem aberta na popa, com berços e parede invisível na abertura |
| `kcNSalaMaquinas` | 8 x 3,15 x 8 | -3 | sala fechada com motores e duas portas |
| `kcNConvesBuraco` | 6 x 0,15 x 6 | 0 | tampo de teca com vão central de 2,6 x 6 m |
| `kcNBordaVidro` | 4 x 1,05 x 0,14 | 0, 3 ou 6 | borda de vidro fixo com corrimão de inox |
| `kcNPortaCorrer` | 4 x 2,8 x 0,2 | 0, 3 ou 6 | porta aberta com passagem de 2,4 m |
| `kcNParedeJanela4` | 4 x 2,85 x 0,2 | 0, 3 ou 6 | parede com janelas quebráveis |
| `kcNParedeLisa4` | 4 x 2,85 x 0,2 | 0, 3 ou 6 | parede lisa |

Para descer ao subsolo, no editor substitua o `kcNavio` do mapa por `kcNavioComAbertura`, na mesma posição e giro. Ele tem um vão em x = -1,3 a 1,3 e z = -3 a 3. Encaixe `kcNEscadaInterna` em x = 0, y = -3, z = 0, sem giro; o patamar de 2,4 m avança em +z além do vão. O `kcNConvesBuraco` é opcional e pode ser colocado no mesmo centro: sozinho, não corta o convés maciço do casco original. As paredes do poço avançam 0,1 m além de cada lado do vão para conservar 2,4 m livres com paredes de 0,2 m. O teto desenhado pelo casco alternativo fica abaixo do convés, para não tapar visualmente a abertura.

O mapa `navio.json` é a base pronta: o mar, o `kcNavio` no centro, os pontos de nascer na proa (o Bravo nasce na popa) e a
dominação no eixo do navio. Os prefabs podem trazer paredes invisíveis próprias (`KC_INVIS[nome]`, como o `KC_ESCADAS`), e o
limite do mapa agora usa o tamanho de verdade de cada prefab.

O salão e a ponte têm painéis de vidro que quebram com tiro. Para alcançar uma laje, encoste o topo do patamar de `kcNEscada`
na borda dela; a escada e o corrimão com parede invisível devem ser girados somente de 90 em 90 graus e usados na escala 1.

### Mapa Maré Alta

`mare-alta.json` é um mapa independente do Navio-base: um iate de luxo com dois salões, piscina central, heliponto na popa e
passagens pelos dois lados. As escadas levam do convés em y = 0 aos salões e varandas em y = 3, e daí aos terraços em y = 6.
Os times nascem nas extremidades; as bases Bravo são espelhadas pelo jogo. Os três pontos de dominação ficam na proa, junto à
piscina e na popa. O arquivo pode ser aberto e alterado no editor como qualquer mapa do projeto.

### Aeroporto (prefixo `kcA`)

| Nome | Tamanho (larg x alt x prof, m) | O que é |
|---|---|---|
| `kcAAviao` | 34 x 13 x 46 | avião com a cabine andável: o piso da cabine fica no `y` da peça (no mapa, 4,5; o trem de pouso desce 4,5 m). Comprido em z, nariz em +z. Portas de 3 m: direita (+x) em z 12 a 15, esquerda (-x) em z -13 a -10. Corredor de 2,6 m |
| `kcABalcao` | 2,6 x 2,4 x 1,5 | balcão de check-in com balança e painel da companhia |
| `kcACadeiras` | 3 x 0,9 x 0,7 | fileira de cinco cadeiras de espera (cobre agachado) |
| `kcARaioX` | 4,4 x 1,5 x 1,1 | raio-x de bagagem com esteiras (comprido em x) |
| `kcAPortico` | 1,5 x 2,3 x 0,6 | pórtico detector de metal (só os postes colidem) |
| `kcACarrinhoBagagem` | 9 x 1,95 x 1,6 | trator com duas carretas de malas (comprido em x) |
| `kcAPainelVoos` | 3 x 3,4 x 0,25 | painel de voos num pé (só os pés colidem) |
| `kcAEsteira` | 8,2 x 0,9 x 3,2 | esteira de bagagem oval com malas |

O mapa `aeroporto.json` é gerado por `node ferramentas/tiro-mapas/aeroporto-gerar.js`, a partir do desenho do Thiago:
- o terminal no alto (y 4,5), com o salão da segurança, a loja e o café;
- a plataforma e a rampa a oeste;
- o pátio embaixo, com o avião, a escada dele e a ponte de embarque.

Os pontos de nascer e dos bots vieram da rede de caminhos. Depois de mexer no editor, não rode o gerador: ele sobrescreve.

### Passarelas

O topo do piso fica no `y` da peça. Ponha o `y` igual à altura da laje que ela liga: 3,15 nas lajes do mapa Favela, 2,95 nas
casas. O comprimento fica em x e a largura é de 2 m, com 1,9 m entre os corrimãos (os bots passam). Entra-se pelas pontas. Para
subir de verdade até a laje, use a **Escada** do editor: os terraços dos prédios fechados só se alcançam assim, ou por uma
passarela.

| Nome | Tamanho (larg x alt x prof, m) | O que é |
|---|---|---|
| `kcPassarela4` | 4 x 1,06 x 2 | passarela de tábuas com corrimão de madeira |
| `kcPassarela8` | 8 x 1,06 x 2 | a mesma, com 8 m |
| `kcPassarelaFerro4` | 4 x 1,06 x 2 | passarela de chapa de aço com corrimão amarelo |
| `kcPassarelaFerro8` | 8 x 1,06 x 2 | a mesma, com 8 m |
| `kcPassarelaPostes` | 4 x 4,06 x 2 | passarela de madeira em quatro esteios, com o piso a 3 m do chão (fica de pé sozinha; passa gente por baixo) |

## Mapa Favela (exemplo pronto)

O `favela.json`, em `ferramentas/tiro-mapas/editor/`, é um mapa inteiro feito com estas peças e serve de exemplo. É gerado por
`node ferramentas/tiro-mapas/favela-gerar.js`, que monta a metade sul e espelha o norte. Depois de mexer no mapa pelo editor,
não rode o gerador de novo: ele sobrescreve o `.json`.

- **Tamanho:** 60 x 88 m jogáveis, com parede invisível em volta e casas de cenário do lado de fora.
- **Três rotas:** o beco oeste com o mercado, a praça central com a árvore e o beco leste com a casa em obra.
- **Por cima:** a laje dos Telhados, a 3 m, com escada na base e passagem por baixo. Uma passarela liga essa laje à do bloco
  leste, que tem escada pelo beco.
- **Pontos de dominação:** A no mercado, B na árvore e C no beco leste, todos em z = 0.

## Praças pequenas

Cada praça é um prefab completo, com piso de 10 x 8 m e frente para +z. Posicione a peça sobre o terreno do mapa; bancos, canteiros e demais estruturas colidem, enquanto a folhagem é visual.

| Nome | Tamanho (larg x alt x prof, m) | O que é |
|---|---|---|
| `kcPracaArvore` | 10 x 4,2 x 8 | Praça com árvore central, canteiros, bancos e luminárias |
| `kcPracaFonte` | 10,4 x 4,2 x 8 | Praça com fonte, duas árvores, bancos e luminárias |
| `kcPracaConvivio` | 10,4 x 4,2 x 8 | Praça com mesa de dominó, bancos, árvores e luminárias |
| `kcPracaParquinho` | 10,4 x 4,2 x 8 | Praça com balanço, bancos, árvores e luminárias |

## Campo de várzea e peças de rua

As medidas incluem os elementos que avançam para fora do corpo principal. A arquibancada tem escada: gire essa peça somente de 90 em 90 graus.

| Nome | Tamanho (larg x alt x prof, m) | O que é |
|---|---|---|
| `kcCampoFutebol` | 40,08 x 7 x 26,2 | Campo de terra 40 x 22 m, traves, alambrado com dois portões, refletores e bancos cobertos |
| `kcArquibancadaConcreto` | 10,4 x 1,2 x 6 | Arquibancada de três degraus largos, com escada e patamar |
| `kcQuiosqueAcai` | 3,2 x 2,35 x 1,7 | Quiosque de açaí com balcão e cobertura |
| `kcChurrasquinho` | 3,2 x 2,35 x 1,7 | Barraca de churrasquinho com grelha e espetos |
| `kcMototaxi` | 3,3 x 2,35 x 1,7 | Ponto de mototáxi com toldo e banco |
| `kcOrelhao` | 0,9 x 2,15 x 0,57 | Telefone público com cobertura |
| `kcLixeiraRua` | 0,7 x 1,25 x 0,6 | Lixeira de rua em poste |
| `kcBancoPraca` | 2 x 0,9 x 0,53 | Banco de praça de madeira e ferro |
| `kcPosteGato` | 1,8 x 7 x 0,6 | Poste com emaranhado de fios |
| `kcMesaDomino` | 1,4 x 0,82 x 2,4 | Mesa de dominó com dois bancos |
| `kcCarrinhoPipoca` | 1,54 x 1,9 x 1 | Carrinho de pipoca com rodas e vitrine |
| `kcFliperamaBar` | 3,4 x 1,8 x 0,9 | Balcão de bar e máquina de fliperama |

## Catálogo: prefabs (cenário fixo)

Estes prefabs precisam de parâmetros e ainda não entram pelo editor: `cyClimber`, `fdTri`, `fishBinStackDyn`, `fruitCrate`, `jersey`, `lobsterPots`, `rack`, `stTent`, `stall`, `trawler`, `tree`, `truss`.

| Nome | Tamanho (larg x alt x prof, m) |
|---|---|
| `acUnit` | 0.8x1.1x0.4 |
| `antenna` | 1.6x3.2x1.7 |
| `bamboo` | 3.1x8.1x3.1 |
| `banana` | 4.3x4.3x4.6 |
| `barque` | 1.3x0.8x3.4 |
| `barrel` | 0.6x0.9x0.6 |
| `bicycle` | 0.5x1.0x1.7 |
| `bitt` | 0.6x0.6x0.6 |
| `blocks` | 1.2x0.6x0.2 |
| `bollard` | 0.2x0.9x0.2 |
| `bottle` | 0.1x0.3x0.1 |
| `bougainvillea` | 1.7x2.5x0.2 |
| `boulder` | 5.1x5.0x4.9 |
| `boxcar` | 3.1x3.7x13.3 |
| `brick` | 0.2x0.1x0.1 |
| `brickPile` | 0.4x0.1x0.2 |
| `buoy` | 0.6x0.6x0.6 |
| `busWreck` | 2.5x3.1x11.1 |
| `bush` | 1.5x1.1x1.6 |
| `cadran` | 3.2x5.0x0.5 |
| `cafeTable` | 0.7x0.7x0.7 |
| `canot` | 2.3x1.9x6.1 |
| `car` | 2.0x1.4x4.6 |
| `cardboard` | 0.5x0.4x0.4 |
| `carrot` | 0.1x0.1x0.2 |
| `castColumn` | 0.4x3.6x1.8 |
| `chair` | 0.6x0.9x0.6 |
| `chunk` | 0.2x0.1x0.2 |
| `clump` | 0.8x0.6x0.8 |
| `coldRoom` | 4.1x3.6x3.2 |
| `column` | 0.8x0.4x0.8 |
| `container` | 2.5x2.6x6.1 |
| `conveyor` | 10.0x1.0x1.4 |
| `counter` | 1.7x1.0x2.5 |
| `crate` | 1.1x1.1x1.1 |
| `cyAgave` | 1.8x1.3x1.9 |
| `cyBush` | 1.3x0.9x1.3 |
| `cyCat` | 0.3x0.5x0.3 |
| `cyCypress` | 2.6x8.2x2.8 |
| `cyFig` | 6.2x4.9x5.6 |
| `cyGrass` | 1.0x0.6x1.0 |
| `cyJasmine` | 2.2x2.4x0.4 |
| `cyKaiki` | 2.9x4.0x7.7 |
| `cyOlive` | 5.8x5.4x5.3 |
| `cyOpuntia` | 1.6x1.5x1.7 |
| `cyPlane` | 12.6x11.7x12.5 |
| `cyPot` | 0.7x0.7x0.7 |
| `cyTamarisk` | 3.7x3.4x4.6 |
| `cyUmbrella` | 0.1x2.3x0.0 |
| `dish` | 0.9x1.3x0.7 |
| `drain` | 0.6x0.0x0.4 |
| `dumpster` | 2.2x2.1x1.4 |
| `etal` | 2.4x1.4x1.1 |
| `farLamp` | 1.3x5.3x0.3 |
| `fdBallon` | 0.2x0.2x0.2 |
| `fdBbq` | 0.6x1.2x0.5 |
| `fdBin` | 0.7x1.0x0.8 |
| `fdBlockPallet` | 1.2x1.0x1.0 |
| `fdBrouette` | 0.7x0.7x1.9 |
| `fdCaravan` | 2.2x2.5x6.8 |
| `fdChaise` | 0.6x0.9x0.5 |
| `fdDryer` | 2.5x1.8x2.5 |
| `fdLamp` | 0.3x4.6x1.0 |
| `fdMailbox` | 0.4x1.3x0.4 |
| `fdMixer` | 1.0x1.5x1.1 |
| `fdMupi` | 1.4x2.5x0.3 |
| `fdNain` | 0.3x0.5x0.2 |
| `fdPool` | 4.5x2.7x5.0 |
| `fdShed` | 2.4x2.3x2.2 |
| `fdSkip` | 4.0x1.5x1.9 |
| `fdSlide` | 1.9x1.7x3.3 |
| `fdSofa` | 2.0x0.9x0.9 |
| `fdSwing` | 3.4x2.2x1.6 |
| `fdTableJardin` | 1.0x2.1x1.0 |
| `fdTrampoline` | 3.7x2.5x3.7 |
| `fdTransfo` | 2.7x2.5x2.1 |
| `fence` | 4.1x1.2x0.2 |
| `fern` | 1.5x0.5x1.5 |
| `fishBin` | 0.9x0.3x0.5 |
| `fishBinIce` | 0.9x0.3x0.5 |
| `fishBinSolid` | 0.9x0.3x0.5 |
| `fishBinStack` | 0.9x0.6x0.6 |
| `fishOne` | 0.0x0.1x0.3 |
| `flatcar` | 2.7x2.7x13.1 |
| `forklift` | 1.3x2.3x3.3 |
| `fountain` | 2.7x1.7x2.7 |
| `fruitBall` | 0.1x0.1x0.1 |
| `fruitBox` | 0.6x0.2x0.4 |
| `gardenLamp` | 0.6x4.3x0.6 |
| `gasBottle` | 0.3x0.7x0.3 |
| `gateLeaf` | 0.3x3.5x2.0 |
| `gbench` | 1.7x0.9x0.5 |
| `generator` | 1.9x1.7x1.1 |
| `grass` | 0.9x0.6x0.9 |
| `gravel` | 0.3x0.1x0.3 |
| `hangLamp` | 0.5x1.0x0.5 |
| `hanging` | 1.0x2.4x0.0 |
| `hayBale` | 1.0x0.5x0.5 |
| `iBeam` | 0.3x0.0x0.3 |
| `iceMachine` | 2.6x3.2x2.1 |
| `icePallet` | 1.2x0.9x0.8 |
| `jar` | 0.5x0.7x0.5 |
| `jerrycan` | 0.2x0.5x0.4 |
| `lampPost` | 1.6x6.1x0.5 |
| `lantern` | 0.3x1.4x0.3 |
| `liana` | 1.4x2.6x0.0 |
| `lifeRing` | 0.7x0.7x0.1 |
| `lifeRingStand` | 0.8x1.5x0.3 |
| `lilies` | 3.3x0.0x3.1 |
| `litter` | 0.1x0.1x0.2 |
| `lobsterPot` | 0.6x0.4x0.6 |
| `luggageCart` | 1.2x1.2x2.7 |
| `manhole` | 0.7x0.0x0.7 |
| `moped` | 0.6x1.0x1.6 |
| `morris` | 1.2x3.0x1.2 |
| `netPile` | 2.6x1.0x1.7 |
| `pallet` | 1.2x0.1x0.8 |
| `palm` | 6.4x9.1x6.4 |
| `palmG` | 4.3x7.4x5.0 |
| `papyrus` | 2.6x2.6x2.5 |
| `pebbles` | 1.6x0.1x1.5 |
| `pine` | 4.9x3.8x4.4 |
| `plankStack` | 1.2x1.1x4.0 |
| `platformBench` | 2.0x0.9x0.5 |
| `pole` | 1.8x8.5x0.3 |
| `portique` | 12.2x11.3x27.2 |
| `pot` | 0.6x0.8x0.6 |
| `potShard` | 0.1x0.0x0.1 |
| `quayCrane` | 2.2x9.7x11.5 |
| `quayLadder` | 0.5x2.5x0.4 |
| `railSignal` | 1.0x4.7x0.7 |
| `reeds` | 1.1x2.0x1.1 |
| `reel` | 0.8x1.1x1.5 |
| `relayCabinet` | 1.4x1.8x0.8 |
| `rockG` | 2.3x1.8x2.4 |
| `roofHut` | 2.4x2.6x2.0 |
| `ropeCoil` | 0.7x0.2x0.7 |
| `rosette` | 1.5x0.9x1.6 |
| `rubble` | 2.3x0.3x2.3 |
| `rugFloor` | 2.4x0.0x1.6 |
| `sailboat` | 3.2x12.4x9.1 |
| `sandbag` | 0.6x0.2x0.3 |
| `sandbagFat` | 0.6x0.2x0.4 |
| `sandbagHalf` | 0.3x0.2x0.4 |
| `scarf` | 0.4x0.1x0.4 |
| `shard` | 0.1x0.0x0.1 |
| `skiOne` | 0.1x1.8x0.1 |
| `skiPole` | 0.1x1.3x0.1 |
| `skiRack` | 2.3x2.0x0.2 |
| `sled` | 0.4x0.2x1.0 |
| `sleeperStack` | 1.6x1.6x2.7 |
| `smAcacia` | 6.6x4.7x6.3 |
| `smBedouin` | 7.6x2.1x5.9 |
| `smCart` | 1.9x0.9x3.6 |
| `smFire` | 1.4x0.7x1.4 |
| `smJetEngine` | 4.6x2.4x2.1 |
| `smPalmFar` | 6.8x10.8x6.5 |
| `smPilotSeat` | 0.7x1.4x0.6 |
| `smReeds` | 0.8x2.1x1.0 |
| `smRock` | 1.7x1.3x1.4 |
| `smScree` | 0.8x0.2x0.5 |
| `smSeats3` | 0.6x1.2x1.3 |
| `snowBush` | 1.4x1.1x1.5 |
| `snowHat` | 0.4x0.3x0.4 |
| `snowMound` | 2.1x0.8x1.4 |
| `snowball` | 2.0x2.0x1.9 |
| `snowman` | 1.3x1.8x0.8 |
| `snowplow` | 3.8x5.4x13.7 |
| `solarHeater` | 2.1x1.6x1.2 |
| `spiceSack` | 0.5x0.4x0.5 |
| `spruce` | 7.2x9.5x7.3 |
| `stBlock` | 1.4x0.9x0.8 |
| `stColumn` | 1.0x4.0x1.0 |
| `stCrateStack` | 2.3x2.1x1.2 |
| `stCrystals` | 0.9x1.7x1.2 |
| `stMenhir` | 1.3x3.6x0.8 |
| `stRock` | 1.7x1.4x1.7 |
| `stSpire` | 3.2x5.7x2.6 |
| `stStele` | 5.0x3.6x1.3 |
| `stTrilithon` | 4.2x4.0x0.8 |
| `stationClock` | 0.2x0.9x1.3 |
| `stone` | 0.2x0.1x0.1 |
| `table` | 2.0x0.8x1.0 |
| `tankcar` | 2.8x4.1x11.3 |
| `tent` | 7.1x3.4x7.0 |
| `tire` | 0.8x0.2x0.8 |
| `topiary` | 1.0x2.6x1.0 |
| `toro` | 0.8x1.6x0.8 |
| `tpBench` | 2.9x2.0x1.4 |
| `tpBunk` | 2.0x1.8x1.0 |
| `tpConsole` | 0.0x0.0x0.0 |
| `tpDrums` | 1.8x1.1x0.7 |
| `tpGas` | 0.6x2.4x0.6 |
| `tpGps` | 1.0x1.3x0.4 |
| `tpHeli` | 9.3x3.3x10.2 |
| `tpHood` | 1.6x3.0x0.9 |
| `tpRack` | 0.6x2.1x0.7 |
| `tpWeather` | 2.6x6.2x2.3 |
| `trashBag` | 0.5x0.6x0.4 |
| `treeFern` | 3.9x3.6x3.8 |
| `truck` | 3.1x3.1x7.6 |
| `twig` | 0.6x0.0x0.1 |
| `urn` | 1.0x1.8x1.1 |
| `waterTank` | 1.3x1.4x1.1 |
| `weed` | 0.4x0.2x0.4 |
| `wheelbarrow` | 0.7x0.6x1.7 |
| `willow` | 7.0x5.6x7.8 |
| `woodpile` | 2.6x1.3x0.8 |
| `xmasTree` | 4.7x6.6x4.8 |

## Catálogo: objetos soltos (`prop`)

| Nome | Tamanho (larg x alt x prof, m) |
|---|---|
| `barque` | 1.3x0.8x3.4 |
| `barrel` | 0.6x0.9x0.6 |
| `bicycle` | 0.5x1.0x1.7 |
| `bottle` | 0.1x0.3x0.1 |
| `buoy` | 0.6x0.6x0.6 |
| `cafeTable` | 0.7x0.7x0.7 |
| `cardboard` | 0.5x0.4x0.4 |
| `carrot` | 0.1x0.1x0.2 |
| `chair` | 0.6x0.9x0.6 |
| `crate` | 1.1x1.1x1.1 |
| `cyPot` | 0.7x0.7x0.7 |
| `fdBallon` | 0.2x0.2x0.2 |
| `fdBbq` | 0.6x1.2x0.5 |
| `fdBin` | 0.7x1.0x0.8 |
| `fdBrouette` | 0.7x0.7x1.9 |
| `fdChaise` | 0.6x0.9x0.5 |
| `fdMixer` | 1.0x1.5x1.1 |
| `fdNain` | 0.3x0.5x0.2 |
| `fdTableJardin` | 1.0x2.1x1.0 |
| `fish` | 0.0x0.1x0.3 |
| `fishBin` | 0.9x0.3x0.5 |
| `fishBinIce` | 0.9x0.3x0.5 |
| `fruit` | 0.1x0.1x0.1 |
| `fruitBox` | 0.6x0.2x0.4 |
| `gasBottle` | 0.3x0.7x0.3 |
| `hayBale` | 1.0x0.5x0.5 |
| `jar` | 0.5x0.7x0.5 |
| `jerrycan` | 0.2x0.5x0.4 |
| `lobsterPot` | 0.6x0.4x0.6 |
| `pot` | 0.6x0.8x0.6 |
| `ropeCoil` | 0.7x0.2x0.7 |
| `sandbag` | 0.6x0.2x0.4 |
| `sandbagHalf` | 0.3x0.2x0.4 |
| `sandbagLow` | 0.6x0.2x0.3 |
| `scarf` | 0.4x0.1x0.4 |
| `shard` | 0.1x0.0x0.1 |
| `ski` | 0.1x1.8x0.1 |
| `skiPole` | 0.1x1.3x0.1 |
| `sled` | 0.4x0.2x1.0 |
| `snowHat` | 0.4x0.3x0.4 |
| `snowball` | 2.0x2.0x1.9 |
| `snowman` | 1.3x1.8x0.8 |
| `spiceSack` | 0.5x0.4x0.5 |
| `table` | 2.0x0.8x1.0 |
| `tire` | 0.8x0.2x0.8 |
| `trashBag` | 0.5x0.6x0.4 |
| `twig` | 0.6x0.0x0.1 |
