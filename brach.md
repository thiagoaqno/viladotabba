# Tiro: Aeroporto, primeira versão do Thiago com texturas novas e pontos refeitos

O `ferramentas/tiro-mapas/editor/aeroporto.json` agora é o mapa que o Thiago montou no editor (277 peças), com três mudanças:

**Texturas novas** (desenhadas por shader em `ferramentas/tiro-editor/texturas.js`, na galeria do editor):
- **Porcelanato polido:** placas de 1,2 m que refletem. Agora é o piso do terminal e da plataforma.
- **Concreto do pátio:** placas de 5 m com junta, mancha de óleo e marca de pneu. Agora é o chão do pátio inteiro.
- **Painel de alumínio:** fachada, paredes de fora, vigas, colunas e o telhado sobre a rampa.
- **Forro de placas:** teto do terminal, em placas de 0,6 m.
- **Carpete:** só na galeria, para usar onde quiser.

As paredes do salão da segurança passaram a usar o reboco (foto), e a base do terminal ficou num concreto mais claro. Cada uma dessas texturas só é desenhada nos mapas que a usam.

**Pontos dos robôs:**
- 17 dos 208 estavam dentro das peças novas. Foram todos refeitos pelo caminho dos robôs: 193 pontos, em grade de 7 m no pátio e 6 m no terminal.
- Os 6 pontos de espera dentro do avião continuam.

**Dominação:**
- **B** estava 16 m mais perto do Alfa. Foi para o topo da rampa (-34,5; -0,5, no piso de 4,5 m), que fica a 65 m de caminho dos dois lados.
- **A** (terminal) fica a 21 m do Alfa, e **C** (pátio, aberto) a 20 m do Bravo.
- O C saiu de um canto apertado.

**Conferido no navegador:**
- As cinco texturas carregam.
- Em 720 renascimentos simulados na dominação, ninguém nasceu perto de ponto de domínio nem fora do caminho.
- O Alfa nasce no terminal e o Bravo no pátio.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
