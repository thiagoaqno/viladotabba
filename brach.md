# Tiro: dá para ver os inimigos no Tephra

Os amigos não enxergavam ninguém a média distância no Tephra. O mapa é uma noite de erupção (`ATMO_TEPHRA`): sol a 0,5 (padrão 2,9), luz ambiente a 0,15 (padrão 0,62) e névoa marrom-escura, então um inimigo escuro sumia contra o chão e a névoa. Os grãos no ar só aparecem de 2,5 a 9 m e são fracos, não eram o problema.

Duas `troca` novas em `ferramentas/tiro-frontline.js` (o `public/tiro` foi remontado pelo script):
- luz ambiente 0,15 → 0,4 e sol 0,5 → 0,9; luz rebatida um pouco mais forte;
- exposição 1,2 → 1,3, pretos um pouco erguidos (lift 0,06 → 0,08);
- névoa mais rala (0,0062 → 0,0042): a 60 m ela esconde 6 % em vez de 13 %, a 100 m 16 % em vez de 32 %; e um pouco mais clara, para a silhueta destacar.

O céu de cinza, a luz vermelha do vulcão, a cinza no cenário e os relâmpagos continuam iguais.
