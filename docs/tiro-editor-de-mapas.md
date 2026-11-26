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
| Colocar peça | escolha no catálogo (esquerda) e clique na cena; Esc para de colocar |
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
- **Matérias de caixa e escada:** `paint`, `wood`, `steel`, `concrete`, `plaster`, `stone`, `timber`, `paintwood`, `pavers`,
  `tiles`, `canvas`, `carpaint`, `glass`, `rug`, `plastic`, `rubber` e `dark`. A cor multiplica a matéria. `"col": false`
  faz a caixa não colidir.
- **`prop` e `prefab`:** `prop` é objeto solto, que voa com tiro e explosão (barril, cadeira, garrafa...). `prefab` é cenário
  fixo, com colisão.
- **`e`:** a escala do prefab ou do objeto.
- **`poi`:** os pontos que os bots visitam. É opcional.

## Para o Codex (ou quem montar o mapa direto no `.json`)

- **Siga as regras acima,** principalmente a altura das aparições, o espelho do Bravo, a inclinação das escadas e a largura das
  passagens.
- **Use só os nomes das tabelas abaixo.** Um nome que não existe é pulado sem erro, e a peça some.
- **Teste no editor:** depois de mexer, abra o mapa no editor (**Abrir mapa…**) e aperte **Jogar** para ver os bots andando.
- **Peça nova** (que não está nas tabelas): descreva o nome, o tamanho em metros, a forma, as cores, se colide e se é objeto
  solto. Ela entra como prefab novo em código, como os do Iate em `ferramentas/tiro-mapas/iate.js`, e aparece no catálogo do
  editor.

## Peças de cobertura (prefixo `kc`)

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
