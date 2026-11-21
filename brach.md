# Sala nova no estilo do jogo da F1 e o nível dos robôs de 0 a 100

Pelas telas que o Thiago gerou (2026-11-21).

**As etapas da sala:** GP → Configurações → Carro → Piloto → Grid. As abas ficam no alto, com ícone. Embaixo ficam as dicas do controle e o Continuar (no Grid, o LARGAR).
- **GP:** a grade dos circuitos, com a foto, o traçado, a bandeira e o seu recorde. Ao lado, a ficha do escolhido:
  - o comprimento, as curvas, as zonas de DRS e o horário;
  - o mapa com os 3 setores coloridos e o DRS, e o perfil de altura (sem metros: o relevo está em unidades do jogo);
  - **Mais rápidos**: o recorde de cada setor e o da volta, do placar do servidor;
  - **Você**: os seus melhores setores, a melhor volta e a **volta ideal** (a soma dos setores);
  - a previsão do tempo;
  - LB/RB trocam de GP.
- **Configurações:** um painel por cima da escolha do GP, com um resumo de uma linha. Temporada, regras, voltas, horário, clima, robôs, nível e fim de semana. O Avançado guarda o câmbio e o ERS (ou os itens e o equilíbrio, fora da F1). As descrições saíram da tela e foram para o hover.
- **Carro:** as etapas Equipe e Carro e pneu viraram uma só.
  - À esquerda, a ficha da equipe: a nota com as 6 barras, o orçamento, os pilotos do ano e quem da galera está nela.
  - No meio, o carro girando. Embaixo, a faixa dos 11 logos (as lotadas com cadeado).
  - À direita, o pneu da largada, a previsão e os atalhos Acerto, Peças, Pintura e Capacete. O capacete foi para a gaveta, junto com as peças e a pintura.
- **Piloto:** a câmera e o estilo do HUD em botões, com a prévia ao vivo à esquerda.
- **Grid:** a lista no estilo da torre da TV (equipe, sigla, piloto, pneu e status). Com o grid completo, os robôs aparecem com o nome real: é a mesma conta do servidor, `F1Pilotos.escolher`. Com menos robôs, o servidor sorteia na largada e a lista mostra só quantos são. Ao lado: o resumo do GP com o mini mapa, o código da sala com o botão Copiar e **Quem anda mais aqui** (os 3 melhores tempos da pista).
- **O mouse:** tudo o que é clicável reage. Cartões e botões sobem um pouco, a borda acende na cor da equipe e o fundo clareia. As linhas das tabelas e das listas acendem, e as barras brilham.
- Visual em `sala-f1.css` (novo, carregado por último). A sala fica sempre no tema escuro.

**Os seus melhores setores:** `hud-painel.js` guarda o melhor tempo de cada setor por pista neste aparelho (`corrida:setores:<pista>`), nas regras de F1 e fora da classificação, como o recorde da volta.

**Acerto do carro** (a tela 4): o painel da tecla P (`acerto.js`) foi reescrito com classes e ganhou dois jeitos.
- **Na corrida**, compacto no canto, como antes.
- **Aberto da sala, do menu ou da pausa da classificação**, grande no meio da tela:
  - o carro da equipe de lado (a sala passa o desenho: `acerto.js` não pode importar `carros.js`);
  - a asa e a altura em barras largas, com o valor grande;
  - o engenheiro e o estrategista em balões, com o "Usar";
  - o gráfico **carga na curva × arrasto na reta** nas 5 posições da asa, em % do carro padrão, com a altura de agora. É a mesma conta da física (`AcertoSugestao.numeros`), não km/h inventado. Clicar numa coluna põe aquela asa.
  - O acerto da direção ficou num "mostrar mais", e o Esc fecha.

**O nível dos robôs de 0 a 100** (pedido do Thiago):
- Na sala e na corrida rápida do menu, uma barra com o número.
- No servidor (`corrida-robos.js`), cada tabela por nível continua com as três marcas de antes, e o número mistura as duas vizinhas: Fácil = 60, Médio = 92 (o de sempre, padrão) e Difícil = 100. Abaixo de 60, a reta continua, mais fácil.
- Os nomes antigos continuam valendo (a carreira usa). O plano de box, que só tem as três, pega a mais perto (`nomeDoNivel`).
- `cleanConfig` aceita o número de 0 a 100.

Conferido no navegador do app, sem erros no console nem no servidor: as 5 etapas, a barra do nível (o servidor guardou 70), a troca de pista e a troca de câmera. O e2e (que não roda no CI) foi posto na ordem nova.

**Pós-corrida** no mesmo estilo:
- No alto, as abas Pós-corrida, Replay e Análise. As duas últimas abrem a aba certa da análise e rolam até ela.
- À esquerda, o pódio e a classificação com as colunas da transmissão à vista: posição, equipe com a sigla, piloto, tempo/diferença, pit stops, melhor volta (roxo na mais rápida), punição e dano. O grid de largada e os pneus de cada parada aparecem no hover.
- À direita, a análise.
- Embaixo, "Correr de novo", "Voltar à sala" e "Voltar ao menu" (o menu da Corrida, não a Vila).
- A análise ganhou a aba **Setores**: os 3 setores da melhor volta de você e do piloto comparado, em roxo (melhor da corrida), verde (melhor dele) ou amarelo, e embaixo a faixa de setores de cada volta.
- Conferido com o resultado de exemplo (`#debug`, `resultadoFalso`), sem erros. A análise só aparece numa corrida de verdade.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
