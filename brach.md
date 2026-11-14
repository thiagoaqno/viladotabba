# Jeff: o engenheiro que ouve (comando de voz)

- **Como usa:** aperte e solte **Caps Lock** (ação "Falar com o Jeff" na tela Controles, remapeável; no controle, o botão que a pessoa escolher). O rádio apita, você fala, e o Jeff fecha sozinho depois de 3 s sem fala (no máximo 12 s; apertar de novo fecha na hora). Aí ele faz e responde no rádio e por escrito na tela. O reconhecimento é o do navegador (Web Speech API, `pt-BR`): Chrome, Edge e o programa de PC (que abre no Edge). Precisa de internet; o microfone é pedido na primeira vez. No Firefox avisa que não tem.
- **`voz.js` (novo):** abre o microfone com o apito do rádio (`Radio.bipe`, novo em `radio.js`), mostra o que está ouvindo e fecha depois de 3 s de silêncio; manda a frase ao Jeff.
- **`jeff-comandos.js` (novo, só a conta):** entende as frases do Thiago e jeitos parecidos de dizer, ignorando o "Jeff" no começo:
  - "ir para boxes nesta volta" / "box" / "boxes" / "quero ir para os boxes" → pede o box (com o pneu que estava escolhido; "box, macio" escolhe junto)
  - "colocar pneus macio / médio / duro / intermediário / chuva" → pede o box com esse pneu (o mesmo das teclas 1 a 5)
  - "atualização completa" → posição, voltas, pneu, dano, carros da frente e de trás e o tempo
  - "piloto na frente" / "quem tá na (minha) frente" e "piloto atrás" / "quem tá atrás de mim" → o nome, a diferença e o pneu
  - "status do pneu" / "como tá meu pneu" / "como estão meus pneus" e "condição do veículo" / "como tá meu carro"
  - "previsão do tempo" → o tempo agora e em que volta a chuva começa ou para (o estrategista fala a volta no rádio)
  - "diferença para frente" e "diferença para o companheiro de equipe"
- **`mfd.js` `executarJeff`:** faz o mesmo que o MFD e as teclas (pedido de box, rádio de pneus e carro, rivais) e responde num aviso "🎧 Jeff: …". `hud.js` ganhou `acoes.infoRival` e `acoes.infoCompanheiro` (o nome e a diferença pela cronometragem).
- **Variações:** cada resposta escrita do Jeff tem três ou quatro jeitos de dizer (sem repetir a última): box, pneus (por faixa de vida), carro (por faixa de dano), frente, trás, companheiro, tempo e radar, e quando não entende. No rádio, `jeffnaoentendi` tem 6 falas, o box de cada pneu tem 6 (3 novas) e o companheiro tem 4 aberturas de cada lado.
- **Falas novas (`radio/falas.js`):** `jeffnaoentendi` e os pedaços `companheirofrente` / `companheirotras`. **Os mp3 saem do `gerar-radio.bat`** (ele só gera o que falta); até lá essas respostas ficam só por escrito.
- **Conserto (`novidades.json`):** na `main` o arquivo estava quebrado: na junção dos PRs de 13/nov sumiram o `]` e o `},` entre quatro entradas, e o JSON não abria (a pergunta de atualização do programa de PC lê dele). Agora abre de novo, com as entradas de antes inteiras.
- **Conserto (`hud.js`):** o cartão do rádio cortava o nome do piloto na letra "s" (`split(/s+/)`, a barra tinha sumido); agora corta nos espaços (`split(/\s+/)`).
- Sem botão na tela do celular por enquanto (lá não há tecla para segurar).
