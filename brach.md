# Tiro: a faca acerta de verdade, e o 3 saca a faca sem atacar

Os amigos do Thiago: "a faca funcionava só quando queria". E: "apertando 3, deve ser possível segurar a faca na mão sem dar facada, andando um pouco mais rápido".

**Por que falhava:**
- **F segurado mais de 0,3 s sacava a faca em vez de dar a facada.** Quem segurava o F um pouquinho mais não dava golpe nenhum;
- o alvo era escolhido **no aperto**, num cone estreito e até 4,2 m, e só levava o golpe se ainda estivesse **a menos de 2,2 m** quando a lâmina chegava. Se ele se mexia, a facada errava; e quem entrasse na frente depois do aperto não contava.

**Agora:**
- **F é sempre facada**, na hora;
- **3 saca a faca e guarda de novo** (com a faca na mão o clique dá a facada, como antes). A tecla aparece na lista de teclas como "Faca na mão (sem atacar)";
- **na hora do golpe**, se o alvo do aperto já saiu, vale o inimigo mais perto **na frente** (cone de uns 60°), a **até 2,5 m**, sem parede no meio (`facaAlvo`, em `ferramentas/tiro-br.js`). Vale em todos os modos;
- com a faca na mão a pessoa já anda 1,15 vez a velocidade normal, um pouco mais rápido que com as pistolas (1,04 a 1,09). Ficou como estava.

Conferido só com `node --check` (os arquivos e o script do jogo montado); não joguei.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
