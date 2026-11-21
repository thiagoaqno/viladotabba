# Carreira com um piloto de verdade

Pedido do Thiago (2026-11-21): "escolher ir com o nosso nick ou jogar a carreira com um piloto já existente".

- **Criar** (`entrada.js`, `corrida-temporada.js`, `regras.js criar`): "Quem pilota" mostra "Eu, com o meu nome" ou os dois pilotos da equipe escolhida, do ano escolhido. A lista muda com a equipe e com o ano. Com um piloto de verdade, o campo do nome some e o nome é o dele. O save guarda `pilotoReal`.
- **A vaga** (`vagaDe`): com o piloto real na equipe dele, você ocupa o lugar dele e o outro titular é o companheiro. Sem ele, continua o segundo titular, como antes. O grid (`pilotosNoGrid`), o mercado (`contratarPiloto`), o substituto do Paddock e a troca de equipe usam isso.
- **O piloto real nunca aparece como robô nem na tabela** (`tabelas`): ele é o "voce". Se ele troca de equipe, quem você tirou da equipe nova ocupa a vaga dele na antiga.
- **No carro** (`corrida.js abrirGP`, `jogo.js`): o número, a sigla (o capacete dele, `f1-capacetes.js`) e o nome completo dele.
- Conferido na memória (`pilotosNoGrid`): Leclerc na Ferrari, Hamilton na Ferrari, nick na Ferrari e Leclerc depois de ir para a Williams. Sempre 21 robôs, nenhum repetido, o piloto real fora do grid e da tabela, e cada equipe com dois carros. Criar Norris na Ferrari dá erro; contratar a si mesmo também.
