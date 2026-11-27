# Tiro: modo tablet (menos trabalho para o processador a 120 fps)

No Mi Pad, pelo Chrome: "começa a 120 e depois fica em 60", mesmo com a qualidade no mínimo.

**Por quê:** pelo relatório de desempenho dele, o gargalo é o processador, não a placa de vídeo. Nos quadros que travaram, o jogo gastou de 6 a 16 ms, e os 120 fps pedem no máximo 8,3 ms:
- o "render" (o Chrome entregando 140 a 230 desenhos por quadro) levou de 3,5 a 8 ms;
- os bots, de 1 a 3 ms;
- o "prep", até 2,7 ms.

Baixar a resolução não ajuda nisso.

**O que mudou** (em `ferramentas/tiro-frontline.js`). Só vale em aparelho de toque com tela de 90 Hz ou mais, enquanto o jogo ainda mira a taxa da tela:
- **Bots:** pensam a cada dois quadros, o que o jogo já fazia acima de 175 fps. A 120 fps, isso dá 60 vezes por segundo. Se cair abaixo de 70 fps, volta ao normal, para os bots não andarem aos trancos.
- **Detalhes do mapa:** somem mais perto (75% da distância; os espalhados, 70%). A conta de quem aparece passa a ser a cada 4 quadros.
- **Soldados longe:** passam para o modelo simples mais cedo (1,4 vez antes), o que também tira a simulação do pano deles.

PC e telas de 60 Hz ficam iguais.

**Conferido no navegador**, forçando o modo tablet: a 115 fps os bots passam a pensar a cada dois quadros e a 60 voltam ao normal, e a partida segue rodando. Falta o amigo jogar no tablet.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
