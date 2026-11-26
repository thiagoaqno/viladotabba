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
- **`poi`:** os pontos que os bots visitam, `[x, y, z]` ou `[x, y, z, 1]` (com o 1, o bot para e segura a posição: laje,
  janela, canto). É opcional.
- **Outros campos opcionais:** `zonas` (`[nome, x0, x1, z0, z1]`, o nome da área no mapinho), `sniper` (`[x, y, z]`, onde o
  sniper segura) e `som` (o som dos passos: `concrete`, `wood`, `metal`, `dirt`, `grass`). O editor não mexe neles, mas
  guarda os que vierem no `.json`.
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
