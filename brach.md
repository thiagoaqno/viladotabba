# Robôs montando o carro direito, e o nível de 0 a 150

O Thiago (2026-11-21): "eu to amassando de Racing Bulls". Lido no banco do programa dele: no Difícil, a melhor volta dele foi 0,8 a 2,4 s mais rápida que a do melhor robô nos 5 GPs, vencendo todos, quatro deles com "Jogar seguro".

## O carro dos robôs (`temporada/regras.js`)
- **O carro dele era mais rápido.** Medido com o piloto ideal (`ferramentas/pneus-fisica.js voltaFixa`), o Racing Bulls dele (asa 6, motor 5) era 0,9 s mais rápido que o melhor rival em Bahrein e 1,3 s em Melbourne. Os rivais punham quase tudo no motor, com a asa em 1 a 3, e 3 níveis em freios e confiabilidade.
- **O ganho de cada nível**, medido igual em Bahrein, Monza e Hungaroring: asa −0,41 a −0,58 s, motor −0,30 a −0,35, chassi −0,12 a −0,16, suspensão −0,11 a −0,14, freios ~0, confiabilidade 0.
- **O rival agora monta do zero**, com o orçamento inteiro, como quem joga. Antes partia do padrão da equipe e só punha os pontos novos por cima.
- **Escolhe pelo ganho dividido pelo custo** (`GANHO_PECA`), com as travas de `specDaMontagem`. Perto da trava, a peça que segura ganha o valor da que destrava. Cada equipe mantém um pouco do estilo dela.
- **Resultado**, medido: o McLaren dos robôs fica a −0,12 s (Bahrein) e +0,07 s (Melbourne) do carro dele no GP 5. Antes, +0,88 e +1,25 s.

## O nível de 0 a 150 (`corrida-robos.js`, carreira e salas)
- A régua vai até 150 (pedido dele: "o nível é uma escala... até na carreira"). Até 100, o de antes. De 100 a 150:
  - a folga do ritmo vai de +0,5% a −1%;
  - o acerto vai para o ideal e os erros caem;
  - o carro do robô ganha até +5% de aderência e +6% de potência (`reforcoDoNivel`, pelo `gpMods` do `sim.js`).
- Só pedir ritmo não bastava, porque no Difícil o robô já anda no limite do carro. Medido com um robô sozinho em Bahrein (`klk/medir/voltas.js`):

  | Nível | Voltas 2 e 3 |
  |---|---|
  | 100 | 45,45 / 45,95 |
  | 100 com folga de −1%, sem o carro a mais | 45,15 / 45,70 |
  | 150 | 44,40 / 44,85 |

- A carreira aceita o número (`nivelValido`). Os nomes dos saves antigos seguem valendo.
- A tela de criar e o ajuste da Central viraram régua. As salas (`menu.js`, `menus.js`) vão até 150.
- A temporada com os amigos continua com os nomes.

## Vozes
- As 18 que o Thiago gerou: os planos novos de #875 e as respostas do Jeff de #879.
