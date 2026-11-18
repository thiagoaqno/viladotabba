# Editor de pistas mais leve

O Thiago notou que a pista fica muito pesada no editor. No editor as malhas não são juntadas (para cada peça ficar clicável), e cada item tinha dezenas de pedaços: uma árvore ~15, um módulo de mureta com tela 9, uma fileira de barreiras centenas de módulos.

`cenario-pista.js`: `enxugar(raiz)` junta os pedaços de um item por material (materiais iguais em cor, textura e acabamento contam como um só, então os itens tingidos também juntam), já no lugar, e tira os grupos que ficaram vazios. Vale para as peças da biblioteca (`kit`), as fileiras (`linha`) e as áreas com peças espalhadas. O item continua um objeto só, clicável e movível; no jogo o `fundir.js` junta de novo o que puder. Ficam de fora InstancedMesh, malha de vários materiais, linha e sprite; os .glb do conversor não mudam.

Medido no Node, montando cada peça da biblioteca: **3.310 → 715 malhas** nas 207 peças, com a caixa exata de cada uma igual antes e depois; uma fileira curva de mureta com tela e faixa: **30 malhas**.

Conferido com `node --check`.
