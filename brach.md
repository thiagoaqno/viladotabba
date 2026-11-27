# Tiro: caixas de colete e de cura no Battle royale

No Battle royale, além das armas, o chão agora tem caixas (umas 35% de colete e 45% de cura em relação ao número de armas do mapa), nos pontos de passagem e com a mesma semente das armas.

- **Colete** (caixa azul com um escudo): +50 de colete, até 100. O colete segura **60% de cada dano** de tiro, grenada ou faca até acabar. A zona passa direto por ele. Aparece como uma **barra azul** embaixo da barra de vida, que agora também aparece com a vida cheia quando você tem colete.
- **Cura** (caixa branca com cruz vermelha): **+50 de vida**, até 100.
- Pega-se **passando por cima**, só quando precisa: com a vida cheia a cura fica no chão; com 100 de colete, o colete também.
- **Robôs** também pegam. Machucados (vida abaixo de 60), vão atrás de cura perto; sem colete, às vezes vão atrás de um.
- Morreu, o colete some.

**Em rede:** como as armas do chão, as caixas não vão pela rede. A caixa que outro jogador pisa some na sua tela também, mas o efeito é só na máquina dele. Como quem atira não sabe o colete do outro, no Battle royale a morte não é mais "prevista" na hora do tiro: ela aparece quando chega o aviso de quem morreu (uma fração de segundo depois, conforme o ping).

Feito em `ferramentas/tiro-br.js`; em `ferramentas/tiro-frontline.js`, só a troca que deixa a barra de vida aparecer com colete.

Conferido só com `node --check` (os arquivos e o script do jogo montado); não joguei.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
