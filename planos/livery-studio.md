# Livery Studio: estudo do editor de pinturas dos carros (2026-11-18)

Pedido do Thiago: um programa como o TabbaTracks, mas para a pintura dos carros (cores, vinil, patrocinadores). Ele mandou uma imagem
de referência: árvore de peças à esquerda, o carro grande no meio com vistas Frente/Trás/Lado/Topo, Propriedades à direita (material:
cor, metálico, rugosidade, clearcoat; lista de decals com olho e lixeira; posição), e embaixo uma gaveta com abas Cores · Materiais ·
Patrocinadores · Grafismos · Texturas com os logos em grade.

## Dá para fazer? Sim, e a base já existe

- **A pintura já é uma textura de canvas.** `f1-pintura.js` desenha uma "folha" por equipe (`folhaDaEquipe`, canvas de 1024 × 1152 em
  pixels lógicos) com o carro planificado; o shader do carro lê essa folha. Um editor só precisa gerar essa mesma folha a partir de
  dados (camadas) em vez de código.
- **Os logos já existem.** `f1-marcas.js` / `PATROCINIOS` / `MARCAS_CAPACETE` desenham as marcas no canvas (`patrocinioEm`), as mesmas
  do capacete, do halo e das placas do TabbaTracks.
- **Já existem dois editores pequenos no mesmo molde:** `capacete-editor.js` e `halo-editor-ui.js`. O Livery Studio é a versão grande deles.
- **O layout do TabbaTracks** (faixa, navegador, Propriedades com prévia, status) serve de casca: mesmo CSS, mesmo jeito de salvar
  pelo servidor (`corrida-editor.js`) e publicar por PR.

## Como seria

1. **Dados:** `public/corrida/pinturas/<id>.json` com camadas, em ordem: `{ tipo: "cor"|"faixa"|"logo"|"forma"|"imagem", zona, x, y,
   escala, giro, cor, marca, espelhar }` e o material (cor base, metálico, rugosidade, clearcoat → `MeshPhysicalMaterial`).
2. **Zonas** = as peças da árvore da imagem (asa dianteira, bico, sidepod esq./dir., tampa do motor, asa traseira…): retângulos da folha
   que já existem implícitos no `f1-pintura.js`. Passo 1 do trabalho: medir e nomear esses retângulos.
3. **Pôr um decal clicando no carro:** raycast no modelo → coordenada UV → ponto na folha. Arrastar move a camada; a folha é
   redesenhada e o `CanvasTexture` atualiza (barato: um canvas de 1024).
4. **"Espelhar"**: o mesmo decal no lado oposto (os sidepods), que é o que mais se usa.
5. **No jogo:** `folhaDaEquipe` passa a aceitar uma pintura salva (das equipes ou do jogador). Assim a pintura própria de cada amigo pode
   aparecer no carro dele numa sala.

## O que é difícil

- **Cada decal precisa cair sem distorcer.** A UV do carro foi feita para pintar faixas, não logos em qualquer lugar: em áreas
  curvas o logo estica. Solução prática: decal só dentro das zonas planas da folha, ou `DecalGeometry` do Three.js (projetado, não
  distorce, mas é uma malha a mais por decal: tem custo com 20 carros).
- **"Renderizar imagem" bonita** como a da referência (chão refletindo, estúdio): dá com um ambiente HDR e `MeshPhysicalMaterial` só no
  estúdio; no jogo continua o material leve.
- **Logos importados (+ Importar):** upload de PNG pelo servidor, como os .glb do TabbaTracks.

## Ordem sugerida (PRs pequenos)

1. ✅ (2026-11-18) Mapa das zonas da folha + a casca do Livery Studio (`?livery=<equipe>`): carro girando, vistas, árvore de peças com olho.
2. ✅ (2026-11-18) Camadas de cor e faixas + material (Propriedades) + salvar o JSON. As zonas ficaram em `f1-pintura.js` (`ZONAS`, em metros, por vista) e a folha sai de `folhaDeCamadas(pintura)`; os arquivos em `public/corrida/pinturas/<id>.json`.
3. Patrocinadores: a gaveta de logos, clicar no carro para pôr, mover/escala/giro, espelhar.
4. A pintura salva entra no jogo (`folhaDaEquipe`) e a pintura do jogador vai para a sala.
5. Renderizar imagem (estúdio) e importar logo.

Estimativa grosseira: a casca e as cores saem rápido porque reaproveitam o TabbaTracks; o ponto que mais toma tempo é o 3 (decal no
lugar certo sem distorcer).

## O texto do ChatGPT (2026-11-18): o que entrou e o que não se aplica aqui

Entrou: os presets de acabamento (brilhante, fosca, acetinada, metálica, perolizada, cromada) com verniz, verniz fosco e perolizado
(`MeshPhysicalMaterial`: clearcoat, clearcoatRoughness, iridescence); clicar no carro escolhe a peça (raycast → zona da folha);
duplicar camada e "espelhar" (uma cópia no outro lado). Fica para os passos 3 a 5: importar PNG, decals por raycast com
mover/escala/giro/espelhar, exportar GLB com a pintura gravada na textura.

Não se aplica (ou não agora):
- **"Importar qualquer GLB" e a hierarquia tirada das malhas:** o carro de 2026 é UMA malha de carroceria; a pintura não vem do UV, é
  projetada pela posição de cada ponto (as 5 vistas da folha). Por isso as "peças" são as zonas da folha, não as malhas do arquivo.
  Um GLB qualquer não teria esse shader nem as zonas medidas.
- **Normal map, emissive e materiais por malha** (carbono, rodas): o carbono e as rodas são do jogo e iguais em toda equipe; mexer neles
  pesa nos 20 carros. Dá para abrir depois, se fizer falta.
- **Pintura por pincel no UV, como no Substance Painter:** pelo mesmo motivo do primeiro item (sem UV de pintura no modelo de 2026). As
  camadas por zona e os decals cobrem o que uma livery de F1 usa.
- **Projetos com Novo/Abrir e histórico salvo:** cada carro tem o seu JSON (`pinturas/<id>.json`), que já é o "projeto"; o histórico fica
  na sessão (Ctrl+Z).
