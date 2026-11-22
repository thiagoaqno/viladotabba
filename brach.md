# Ver a batida dos muros do editor, e emendas mais perto do desenho

O Thiago (2026-11-22): "a hitbox de Mônaco não é condizente com as barreiras e o fim das zebras que coloquei".

- A conta do muro bate com o carro: ele tem 16 u de largura (`sim.js DIMENSOES`), e a folga de Mônaco (9) faz o lado dele encostar na linha da barreira.
- Onde ela se afasta do desenho:
  - as peças soltas (placas e kits) viram muro pelo ponto central delas, esticado alguns pontos para cada lado;
  - o alisamento de #900 deixava o muro mais longe por até 8 pontos nas emendas.
- `pistas.js MURO_RAMPA` 6 → 18: o muro mais longe nas emendas agora vai por 2 a 3 pontos. O teleporte continua evitado pelo empurrão de no máximo 10 u por passo (`sim.js EMPURRAO_MURO`, #900). Medido em Mônaco: o maior salto entre vizinhos ficou em 18 u (eram 48 antes de #900).
- `cenario-pista.js` e `configuracoes.js`: Configurações, Geral, Pistas do editor, "Ver a batida dos muros". Desenha na pista uma linha vermelha onde o lado do carro encosta no muro do editor, para conferir com as barreiras e acertar no editor. Vale na próxima pista que abrir.
- Não foi visto na tela.
