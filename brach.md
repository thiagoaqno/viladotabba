# Tiro: carros de F1 no Battle royale

O Battle royale passa a montar carros dirigíveis com quatro pinturas genéricas. Na Favela Grande são sorteados pontos candidatos na avenida, na estrada rural e no centro comercial; os demais mapas usam pontos de navegação livres. Os carros são removidos ao encerrar a partida e não alteram o JSON nem o gerador do mapa.

E ou o botão de usar entra e sai, com um ocupante. A direção usa W/S e A/D ou o joystick, a câmera acompanha por trás e o motorista não atira. A carroceria tem 300 de vida, explode ao ser destruída e mata o ocupante; uma parte da cabine fica aberta a tiros. Atropelamentos acima de 8 m/s causam dano, e a zona continua afetando o motorista. Os robôs não dirigem e tentam contornar carros parados.

Em salas, o anfitrião arbitra ocupação e vida; o motorista publica pose e velocidade, e os demais suavizam a movimentação. O anfitrião também envia periodicamente um resumo para recuperação após entrada tardia ou reconexão.

O modelo é uma malha simplificada montada para o Tiro, inspirada nas proporções do carro da Corrida; não copia o GLB nem as pinturas de equipe. Não há física da Corrida, piloto robô, passageiros ou novos marcadores no mapa. A negociação de compatibilidade para jogadores que tenham uma versão antiga do jogo aberta ainda não foi acrescentada.

Conferido com `node --check` em `tiro-br-carros.js`, `tiro-frontline.js` e no script extraído do jogo remontado. Não rodei a suíte nem criei testes. **Rascunho:** ainda é necessário conferir jogando a quantidade e as posições reais de carros, a dirigibilidade e as colisões, danos, controle no tablet e sincronização em um salão com mais de um jogador.
