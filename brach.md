# Vila: a Base do Tiro, prédio novo do Tiro da Galera

O tiro deixou de ser um hangar igual aos outros e ganhou um prédio próprio, quase o dobro do tamanho (11 × 12 casas), na
faixa dos hangares a leste da pista, logo abaixo do F1 parado.

## O desenho (`drawBaseTiro`, estilo `base` em `public/vila/gp-desenho.js`)

Um estande de tiro visto de cima:
- o pátio de terra batida cercado por um muro de sacos de areia;
- o barracão do fundo com cobertura camuflada e o letreiro "TIRO";
- a torre de vigia no canto, com a guarita e o refletor;
- cinco raias com os alvos e o talude de grama atrás deles, e o balcão de tiro com a turma mirando;
- na frente, um bunker de concreto com o portão de aço, as faixas de aviso, as seteiras e os sacos de areia.

## O resto

- **`public/vila/gp-mapa.js`:** `tiro` passa para `[186, 95, 11, 12, "base"]`. O lugar do hangar antigo fica livre.
- **`public/index.html`:** o card passa a se chamar "Base do Tiro", com as cores do jogo novo.
- **Conferido no mapa de verdade** (rodando o `gp-mapa.js` no Node): embaixo do prédio só tem asfalto, sem poste, caixa ou
  F1 dentro; sobra uma casa livre de cada lado para passar, e o capacho dá para a rua.
