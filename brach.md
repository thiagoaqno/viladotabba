# Tiro da Galera: faca nerfada; Favela versão 6 com capa nova

- **Faca (pedido do Thiago):**
  - de frente, a facada tira 50 (metade da vida); pelas costas continua matando (200);
  - conta como "costas" quando quem ataca está atrás do alvo, fora de um cone de ~110° na frente dele;
  - entre uma facada e outra, 0,35 s a mais (o ciclo passa de 0,42 s para 0,77 s);
  - são quatro trocas em `tiro-frontline.js` (`knifeDano`, `KNIFE_CD`).
- **Favela:** a versão nova do editor, com 182 pontos dos bots refeitos e a capa nova, em `maps/favela-2.webp`; a antiga saiu, e o nome novo evita que o navegador mostre a capa velha guardada.

Conferido no navegador:
- a facada de frente e de lado tira 50, e por trás e na diagonal de trás tira 200;
- os nascer dos dois times, os 3 pontos de dominação e os do mecha estão na rede de caminhos dos bots;
- a capa nova aparece.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
