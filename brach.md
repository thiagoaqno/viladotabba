# Pintura dos carros de 2026: cada vista só pinta o que enxerga, folha mais nítida e a Cadillac nova

O Thiago mandou o print da Cadillac na garagem: resolução baixa, partes borradas e o adesivo de trás da asa "indo pra baixo da asa toda vez".

**A causa:** a pintura não fica no carro. Ela é uma folha com cinco vistas planas (os lados, de cima, de frente e de trás) projetada pela posição de cada ponto. Tudo o que está na mesma coluna pega o mesmo desenho: a vista de cima pintava a asa traseira e também a beam wing e o difusor embaixo dela, e a de lado pintava a placa de fora e a de dentro. O UV do modelo não resolve sozinho: medido no carro.glb, a tampa do motor e a asa traseira são em boa parte "carbono" sem UV que o jogo pinta por cima (1.586 e 337 vértices pintados).

**O que mudou:**
- `f1-2026.js` `visibilidade`: uma vez por modelo, o corpo (com o flap) é rasterizado nas cinco vistas, na metade da resolução lógica da folha (512 × 576). Cada célula guarda a superfície mais de fora. No carro de 2026 leva ~0,4 s no node para o modelo completo e ~0,2 s para o leve. `f1.js` faz isso na primeira vez e passa o mapa para o material do corpo (vale também para o de 2022 projetado).
- `f1-pintura.js` LIV_FRAG_MAIN (só com `NOVO`): cada vista só conta onde o ponto é o de fora (folga de 3 cm, maior na superfície inclinada). O que nenhuma vista vê fica no carbono, como no carro de verdade. Isso substitui o borrão de mipmap (`fcar`) das camadas escondidas. A vista de baixo da asa (U) continua igual.
  - Conferido no node com o modelo: nada que olha para cima embaixo do plano da asa recebe mais a vista de cima (0 de 23 pontos no completo e 0 de 9 no leve). A placa da asa traseira por dentro fica escondida (3%) e por fora continua visível (91%). A caixa lateral por fora continua visível (92%).
- A folha passou de 2× para 3× no carro do jogador e na garagem, e de 1× para 1,5× nos outros (uma folha por equipe).
- Cadillac redesenhada pela imagem do Thiago:
  - preta brilhante;
  - CADILLAC largo em prata na tampa e na asa traseira;
  - o brasão (marca nova `crest`) no airbox, na placa da asa traseira, na asa dianteira e no bico;
  - as faixas prata e grafite na caixa;
  - o Mobil 1 e o número na caixa.
- `f1-marcas.js`: as marcas `crest` e `cadillacw`.

Sem print (só `node --check`): o Thiago testa jogando.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
