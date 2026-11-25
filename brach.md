# Torre: o cartão do piloto em todo estilo e os retratos no card de distância

O Thiago pediu que o card do piloto aparecesse na torre quando ela é expandida, e que a imagem do piloto aparecesse no card que abre sobre a torre.

- **Cartão do piloto (`hud-tv.js`):** antes só existia no HUD "Transmissão (TV)". Agora também vale nos outros estilos, com a torre completa (`compacta: false`, passado por `hud.js`). Nesses estilos entra só o cartão: a batalha dentro da torre, o aviso de novo líder e a caixa de marcha continuam só no estilo TV.
- **Quando o cartão abre:** quando você ganha ou perde posição, e agora também no momento em que você expande a torre. Fica 6 s.
- **Card de distância (`hud.js`, `htmlCard` "batalha"):** o card que abre sobre o cabeçalho da torre mostra o retrato em pixel art de cada piloto em cima do logo da equipe. O retrato vem de `retratoDoJogador`, buscando o piloto pela sigla. Os pilotos do grid usam o retrato desenhado e os jogadores, o do montador.
- Conferido: a página carrega sem erros num servidor de teste (Edge sem tela).
