# Tiro da Galera: menos brilho no Holo e no Cromado

O Thiago achou o bloom do Holo forte demais.

- O brilho próprio das camuflagens (o que acende sozinho e vira bloom) entra agora com **30% da força**. É uma troca só no
  shader das camuflagens (`totalEmissiveRadiance += camoGlow * 0.3`), feita pelo `tiro-frontline.js`.
- Vale para o **Holo**, o **Cromado** e a **skin Holo da faca**, as únicas que têm brilho próprio. As outras camuflagens não
  mudam.
- As faixas de luz, o brilho das bordas e as paillettes continuam, só mais fracas. O reflexo do metal segue igual.

Conferido no navegador: a M4 com Holo e com Cromado é desenhada sem erro de shader. Falta o Thiago ver em partida se ficou na
medida.
