# Editor do capacete: os capacetes em pixel art como "Padrões"

O Thiago pediu que os capacetes das folhas de pixel art entrassem no editor de capacete como padrões.

- **`f1-capacetes-padroes.js` (novo):** são 30 padrões, os 22 pilotos do grid e 8 extras que sobraram das folhas. Cada um tem:
  - o desenho do editor. Os 22 pilotos usam o desenho deles em `f1-capacetes.js`; os extras usam um rodízio de desenhos do editor. Todos estão na lista do servidor (`DESENHOS_CAPACETE`);
  - as três cores principais, tiradas da imagem em pixel por ferramenta: k-médias no casco, sem o visor e o que é quase preto, em ordem de quanto aparecem;
  - a viseira escura.
- **A aba "Padrões" (`capacete-editor-ui.js`):** é a primeira do menu. Mostra a grade com as miniaturas em pixel art e o nome de cada um, e a grade rola. O clique aplica o desenho, as cores e a viseira e volta ao primeiro "Padrão" (variante 0). Depois dá para ajustar à vontade nas outras abas.
- **Onde aparece:** o editor é o mesmo da sala e da aba Capacete da carreira, então os padrões aparecem nos dois lugares.
- **Conferido:** num servidor de teste, montei o editor, abri a aba e cliquei no padrão do Norris. Ficaram 30 padrões, e o capacete guardado ficou com o desenho "faixa" e o verde-neon. A página não teve erros.
