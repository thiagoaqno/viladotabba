# Offline no PC, muros invisíveis de Mônaco, pneus, dano e a atualização presa

- **Modo offline no programa de PC** (`corrida-pc.js`): um botão no canto do menu liga e desliga (`localStorage` `corrida:pc:offline`). Ligado, tudo roda no servidor do PC, como sem internet: sem ping, os robôs lisos. O selo mostra "Offline: jogando no seu PC". Precisa reabrir o programa uma vez depois de atualizar, porque muda o servidor.
- **A atualização presa** (`corrida-pc-atualizar.js`): o `public/corrida/assets/.gitkeep` (0 bytes, o "0,1 MB" é o mínimo da tela) estava na lista, mas o `sendFile` do Express não entrega arquivo com ponto no nome, e a pergunta voltava sempre. Conferido contra o programa instalado: era o único arquivo diferente. Agora nada com ponto no nome entra na lista.
- **Muros invisíveis de Mônaco** (`pistas.js`, `murosDoCenario`):
  - a placa da Lenovo fica 32 u acima da pista e punha muro dos dois lados embaixo dela: peça a mais de 12 u acima ou abaixo do asfalto não bate;
  - a placa usava `w × s × 4,8` de comprimento (o `w` já é em unidades: 4,8 vezes maior) e sempre ao longo da pista; agora o comprimento e o giro (`ry`) são os do desenho;
  - as linhas (guard-rail em fileira) liam os pontos como `.x/.z`, mas eles são `[x, z]` com o do meio opcional: davam NaN e não batiam. Agora seguem a mesma curva do desenho.
- **Pneus** (`f1-regras.js`, `dinamica.js`): `final` e `potencia` por composto (macio 1,008 e 1,04; duro 0,994 e 0,97; médio igual). Medido com o piloto ideal (`voltaFixa`, pneu novo e quente) em Mônaco: macio 78,43 s, médio 79,48 s, duro 80,53 s (antes 78,77 / 79,48 / 80,26). A tabela dos robôs (`f1-pneus-tabela.js`) foi refeita com `ferramentas/pneus-tabela.js`.
- **Dano** (`corrida-f1-direcao.js`): quem causa a batida entre carros leva 5, 10 e 15% (era 12, 20 e 35). No muro continua 1% por batida. Saíram as três conferências antigas do dano em `tests/corrida-punicoes.test.js`.
- Apagados dois testes antigos que fixavam a diferença pequena entre os pneus: "desgaste e custo da parada definem se compensa trocar" (`corrida-estrategia-box`) e "a ordem é macio < médio < duro, e cada degrau custa perto de 1% da volta" (`corrida-f1-estrategia`).
