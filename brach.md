# Noite de verdade e LEDs no TabbaTracks

- **Corridas noturnas:** saiu o `anoitecer.js` (o pôr do sol que virava noite em 2 voltas). A pista já era montada no modo noite (`useTrack`), então agora a corrida larga de noite fechada, como a classificação.
- **Luz · LED no TabbaTracks** (`luz-item.js`, `editor/luz-ui.js`): item do cenário ou peça da pista guarda `luz: { cor, forca, alvo? }`. O material vira um `MeshBasicMaterial` aceso (`toneMapped: false`) com `userData.bloom = forca`, o mesmo caminho do neon e das lâmpadas (`pos.js`, `preparar`): halo na Média e na Alta, só a cor acesa na Baixa. `alvo` acende só um material da peça (a lâmpada e não o poste). Vale no jogo por `montarItem` e `aplicarAjuste`.
- **Peças de LED** na biblioteca (grupo Luzes): faixa de 4 m, ponto, painel de 3 × 2 m e arco de 10 m; a cor do item tinge o LED.
- `enxugar`: a chave do material inclui `toneMapped` e `userData.bloom` (um LED não se junta a um material comum da mesma cor).
