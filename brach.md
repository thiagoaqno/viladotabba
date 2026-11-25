# O montador do seu piloto em pixel art

O Thiago pediu um espaço para montar o próprio piloto em pixel art, com as mesmas peças dos retratos.

**Entra depois do #959.** Este branch traz o gerador novo dele (grade de 48×48, olhos refeitos), e o montador usa esse gerador.

## A tela (`piloto-pixel-editor.js`)

- Fica na gaveta da sala, que agora se chama "Peças, pintura, capacete e piloto", logo abaixo do capacete (`#pilotoPixelCartao`).
- A prévia grande, em 144 px, mostra o piloto com o macacão na cor da sua equipe e muda a cada clique.
- Ao lado, uma linha "‹ valor ›" para cada peça: pele, cabelo, cor do cabelo, risca, barba, olhos, sobrancelha, rosto, nariz, sorriso, óculos e brinco.
- O botão 🎲 Sortear monta um piloto aleatório.
- Na primeira vez, o piloto vem sorteado pelo seu nome, sempre o mesmo para o mesmo nome.

## Onde fica guardado e quem vê

- **Guardado neste navegador:** em `corrida:piloto-pixel`.
- **Na sala:** vai em `mods.pixel`, do mesmo jeito que o capacete. É enviado 1,2 s depois do último clique e uma vez em cada sala em que você entra (`sincronizarPixel`, em `menus.js` e `rede.js`).
- **Na corrida rápida:** vai junto com o pedido de criar a sala (`menu.js`), porque ela larga direto, sem passar pela sala de espera.
- **No servidor:** `limparPixel`, em `corrida-base.js`, só deixa passar o que o montador oferece. Ele é chamado em `corrida-conexao.js`, na criação da sala e no `act "mods"`.
- **No jogo:** `retratoDoJogador` (`pixel-piloto.js`) usa o seu `mods.pixel`. Assim a galera vê o seu piloto no cartão do HUD de transmissão.

## Conferido

Subi um servidor de teste (`DB_PATH=:memory:`) e abri `/corrida/` no Edge sem tela. A página carrega sem nenhum erro no console. O montador monta as 12 linhas, e o clique troca o valor e redesenha a prévia.
