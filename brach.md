# Interlagos de verdade: traçado real, na escala real e com o relevo real

Teste do Thiago: a pista de casa dele, do tamanho de verdade. O GP de São Paulo deixou de ser um desenho à mão (23 vértices, volta de 13.002 unidades, com ~26 m de largura) e passou a ser a linha central real do autódromo.

## O que mudou

- **Traçado real.** A linha central é a do bacinger/f1-circuits (`br-1940`, licença MIT), convertida por `ferramentas/circuitos-f1.js`: 129 vértices, no sentido anti-horário da corrida real, com a chegada na reta dos boxes. A reta desce para o sul e o S do Senna vem uns 300 m depois da linha. A ordem do resto conferi pelas curvas numeradas do OpenStreetMap: Curva do Sol, Descida do Lago, Ferradura, Laranjinha, Pinheirinho, Bico de Pato, Mergulho, Junção, Café, subida dos boxes e Arquibancadas.
- **Escala real.** A volta medida por `Pistas.pontos(t, 6)` é de 20.688 unidades, que na escala da física (0,2083 m por unidade) dão 4.310 m (a volta oficial tem 4.309 m). Antes eram 13.002 unidades, ou 2.708 m. `scale` foi de 2,72 para 3,9 e `minLap` de 25 para 40, na proporção da volta.
- **Largura.** `width: 72` (15 m). A prefeitura de São Paulo diz que a pista varia de 12 a 15 m, e 15 m é a largura da reta; usei o máximo. Antes eram 124 (uns 26 m).
- **Relevo.** Saiu de `ferramentas/pista-real.js br-1940 interlagos --dem srtm30m --raio 4`: 43 m de desnível na volta (745 a 788 m), com a reta de chegada até a Descida do Lago caindo uns 42 m e a subida dos boxes marcada no fim. Inclinação máxima de 10%, perto da Ferradura (com `--raio 6` seria 9,1%, com 8, 8,2%; ficou o 4 do pedido). `hillsSuave: true`, `flat: 80` e `fall: 480`, proporcionais à altura nova.
- **Barreiras.** O OpenStreetMap tem barreira mapeada em 98% da volta de um lado e em 74% do outro, ou seja, faltava em menos de 30% em cada lado: os `muros` da ferramenta entraram.
- **Cenário no lugar de verdade.** As posições vêm do OpenStreetMap, convertidas para o mundo do jogo pela mesma conversão do traçado (a linha do bacinger fica a no máximo 7 unidades, 1,4 m, da pista do jogo): as três arquibancadas da reta dos boxes (do lado de fora, onde elas estão, com o setor M), as dos setores do S do Senna, da Curva do Sol, da Reta Oposta, do Lago, do Laranjinha, do Pinheirinho e do Café, o prédio dos boxes com a torre do lado de dentro, o lago a nordeste da Junção (o polígono do OSM, em 38 pontos), a caixa-d'água da Sabesp a noroeste da subida e a cidade em volta (casas e prédios de 3 a 14 andares, fora do lago e a mais de uns 70 m da pista). Zebras amarelas, escape listrado, brita, pneus, SC, DRS, passarelas e as curvas de `gp-info.js` (15 curvas, numeração do OSM) foram refeitos nas frações novas.
- **Boxes.** O prédio fica do lado de dentro, que com o sentido anti-horário agora é o lado -1 (`boxes.lado`). O corredor segue com 504 unidades em volta da linha (entra em 0,9878, sai em 0,0122), o mesmo tamanho de antes, então a parada continua custando 6,3 a 7,6 s.
- **Linha dos robôs.** `corrida-linhas-f1.json` teve só a linha de Interlagos refeita (`node ferramentas/gerar-linhas-f1.js interlagos`, 48 s).

## O que conferi

- **Robôs (corrida simulada no servidor, tempo de mentira, mesma conta do teste de IA):** 10 robôs em 2 voltas: todos terminam, sem abandono nem batida no muro, 6 batidas entre carros (dano de 1%), melhor volta 60,3 s e mediana 65,4 s. 19 robôs em 3 voltas: todos terminam, sem abandono e sem batida, melhor volta 59,5 s, mediana 64,4 s, pior 74,0 s.
- **Robôs no navegador (servidor de verdade):** 7 robôs, 2 voltas, o meu carro parado no grid. Ninguém abandonou. A volta lançada (a 2ª, medida pelo servidor) de cinco deles: 64,6 s, 65,1 s, 70,7 s, 72,0 s e 74,6 s. Os outros dois não fecharam a 2ª volta nos 7 minutos que esperei. A 1ª volta de todos ficou em 4 a 5 minutos; não investiguei, mas desconfio do meu carro parado no grid (direção de prova) e não da pista, porque na simulação sem carro parado a 1ª volta é de 60 a 70 s.
- **Prints** com o Chrome (Playwright), conferidos um a um: largada, S do Senna, Descida do Lago, Junção e vista geral de cima, com o norte para cima. Além deles, olhei a Ferradura, o Bico de Pato e a subida.
- `node --check` em tudo que mudou.

## O que não conferi

- **Os testes não rodaram aqui** (o CI roda). Um teste antigo quebraria só porque Interlagos mudou: `tests/corrida-f1-box.test.js` afirmava `c.lado === 1` para o corredor dos boxes de Interlagos; troquei por `-1`, em vez de apagar o teste inteiro (o resto dele, de tempo de parada, segue valendo). Não criei teste nenhum.
- A 1ª volta de 4 a 5 minutos no navegador (acima).
- Chuva, noite e o modo de câmeras de TV em Interlagos; só vi a pista de dia, seca.
- As peças do kit (arquibancada de 6 e 8 fileiras, placas, passarelas) têm tamanho fixo em unidades e não foram redimensionadas; a pista mais estreita faz o conjunto parecer um pouco mais apertado.
- A curva 8 (a de 129° antes do Pinheirinho) ficou sem nome em `gp-info.js`: o OSM a chama de "Esse", que não confirmei em outra fonte.
- O corredor dos boxes continua com 504 unidades (105 m); o real tem uns 400 m.
- A altitude é a do SRTM de 30 m: a copa das árvores pode somar alguns metros em trechos de mata.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
