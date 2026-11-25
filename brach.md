# Torre: o cartão só no TOP 3 e a faixa da bandeira amarela com o setor

O Thiago pediu duas coisas: que o cartão do piloto parasse de aparecer nas ultrapassagens e aparecesse só quando alguém conquista uma posição do TOP 3; e a faixa "bandeira amarela" com o setor, como na transmissão.

- **O cartão (`hud-tv.js`):** abre só quando um piloto ganha uma posição e fica entre os 3 primeiros, a liderança incluída. Vale na corrida, depois da primeira volta dele. Perder posição, ou ganhar fora do top 3, não abre nada. Ao expandir a torre, o seu continua abrindo.
- **A faixa (`hud.js`, `hud-f1.css`):** embaixo da volta, o amarelo com "BANDEIRA AMARELA" e, embaixo dele, "SETOR N" em amarelo sobre o escuro. O setor vem da direção de prova (`E.S.direcao.amarelo`). Com o safety car, a faixa mostra "SAFETY CAR / MANTENHA A POSIÇÃO". Some quando a pista é liberada. Vale em todos os estilos de HUD.
