# Carreira: as equipes da máquina evoluem como quem joga

O Thiago achou que só os humanos melhoravam o carro. A máquina já evoluía (`desenvolvimentoRivais`), mas com três desequilíbrios. Os três foram corrigidos (`temporada/regras.js`, `corrida.js`, `corrida-temporada-grupo.js`, `grupo-regras.js`):

1. **O carro dos rivais vem montado para a pista.** Antes era o padrão da equipe mais peças sorteadas, igual em toda pista, enquanto quem joga redistribui tudo a cada GP. Agora o acerto ideal medido de cada pista (`acerto-ideal.json`, `asa`) puxa até 2 pontos do motor para a asa nas pistas de curva (asa ideal ≥ 0,75, como Mônaco) ou da asa para o motor nas de reta (≤ 0,25, como Monza). A soma não muda. Exemplo, a McLaren em Monza: motor 4 → 6, asa 4 → 2.
2. **Os rivais têm engenheiros.** O bônus de box (mecânico × 0,5 + estrategista × 0,25 s por parada, a mesma conta de quem joga) só valia para a equipe humana. Agora as equipes grandes começam com um mecânico e um estrategista, e todas sobem um nível por temporada (cada uma no seu ritmo), até o nível 2. Vai em `bonusBoxEquipes`, na carreira solo e na com os amigos.
3. **A evolução continua todo ano, para todos.** Era +4 para sempre: da 2ª temporada em diante ninguém evoluía. Agora cada equipe soma até 4 pontos por temporada, que se acumulam, até +24 (`BONUS_POR_TEMPORADA`, `BONUS_MAX` em `f1-equipes.js`; `limiteDoAno` em `regras.js`). Quem joga paga 12, 18, 24 e 30 pela evolução de cada ano (o preço recomeça a cada temporada); os rivais chegam lá no ritmo deles. O ponto que caía numa peça já no máximo agora vai para a seguinte (antes ele se perdia).

Telas: a Central (solo) e a tela da temporada em grupo mostram "x/limite do ano" e o preço novo. `validar` (`f1-equipes.js`) e `f1-pecas.js` aceitam o bônus até 24.

Conferido em node: McLaren +2 no meio do 1º ano, +4 no fim, +6 no meio do 2º, +12 no fim do 3º; a montagem sempre válida, e os engenheiros sobem com as temporadas. Os testes antigos (+1 ponto no 1º ano) seguem valendo.

Sem entrada no `novidades.json`: o arquivo está quebrado na `main`, e o conserto está no #717.
