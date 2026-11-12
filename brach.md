# Otimização: ensaio geral na carga + anoitecer nas corridas noturnas

- **Ensaio geral** (`jogo.js: ensaioGeral`): depois do aquecimento, com a tela de carregamento ainda por cima, desenha dois quadros de verdade (pós parado e em velocidade) com o safety car, os efeitos de batida e a chuva inteira (domo, gotas, respingos, borrifo, asfalto encharcado) diante da câmera, e cria os retrovisores. Antes só se compilava/desenhava fora da tela, e a primeira vez de cada coisa na tela ainda travava.
- `clima-visual.js`: `ligarChuvaDeEnsaio` (separado de `exercitarChuva`, que agora o usa).
- **Anoitecer** (`anoitecer.js`): corrida de F1 marcada "Noite" larga no fim de tarde e vira noite até 50% da prova (volta do líder). Só mexe em uniformes/cores/intensidades (sol, hemi, neblina, força dos postes, fundo pintado num canvas): nada recompila. A luz dos postes fica num mínimo de 0,0005 para materiais novos já nascerem com o sombreador dela. Classificação continua de noite.
- `pos.js`: `ehNoite` segue o anoitecer.
