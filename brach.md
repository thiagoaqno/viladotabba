# Tiro da Galera: M1014 com cadência menor

O Thiago achou a M1014 roubada: "cadência muito alta".

- **Antes:** 240 tiros por minuto, ou 0,25 s entre tiros. A arma é semiautomática, com 8 chumbos de 22 de dano por tiro, e
  derruba de perto com um tiro só, então dava para apertar quatro vezes por segundo.
- **Agora:** 150 tiros por minuto, ou 0,4 s entre tiros. Ela continua mais rápida que a Remington 870, de bomba (75), e mais
  lenta que a AA-12, automática e com dano menor (300).
- A barra de cadência no menu das armas foi de 0,4 para 0,25, para acompanhar.
- A troca é feita pelo `ferramentas/tiro-frontline.js`, na seção nova "equilíbrio das armas". Os bots que usam a M1014
  também ficam com a cadência nova.

Conferido no navegador: `WEAPONS.m1014.rpm` = 150 (0,40 s entre tiros) e a barra em 0,25. Falta o Thiago sentir na partida.
