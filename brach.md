# Mecânicos e pódio com o mesmo capacete da pista

O Thiago pediu que a equipe dos boxes e os bonecos da comemoração usem o mesmo capacete do piloto. O boneco (`f1/podio/piloto.glb`) tinha um capacete próprio (`casco`, `vedacao`, `viseira`), diferente do da pista.

- **`capacete-boneco.js` (novo), `vestirCapacete`:** esconde o capacete do boneco e prende no osso da cabeça (`Head`) o capacete de `f1-piloto.js`, com a mesma forma, a mesma pintura (`pintarFolha`, via `materialDoCapacete`, agora exportado) e a mesma viseira (`materialDaViseira`). O tamanho e o lugar saem do capacete original, medido no repouso: a mesma altura e o mesmo centro, virado para a frente do boneco (+z). Como está preso no osso, segue a cabeça em toda pose do pit stop e em toda comemoração.
- **Mecânicos (`mecanicos.js`):** o capacete da pista nas cores da equipe (o desenho genérico, igual ao dos carros sem desenho próprio).
- **Pódio (`podio-pilotos.js`):** o de quem joga (o do editor: desenho, cores, bandeira, nome e viseira), o do piloto robô (`capacetePorSigla`) ou o genérico da equipe, sempre com o número.
- Os materiais são os mesmos da pista (o cache de `f1-piloto.js`): nada novo para compilar.
- Conferido só com `node --check`: o encaixe na cabeça precisa ser visto jogando (o pódio e uma parada no box). Se ficar alto, baixo ou grande, me mandem print.
