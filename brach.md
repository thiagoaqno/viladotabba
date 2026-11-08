# Spa-Francorchamps em escala real

Segunda pista levada ao tamanho de verdade, seguindo a receita de Interlagos e da Cidade do México (`planos/escala-real.md`). Este PR já inclui o carro real (#603) e a chave de escala do cenário (#605), porque nasce em cima deles.

## O que mudou

| | Antes | Agora | Real |
| --- | --- | --- | --- |
| Volta (`Pistas.pontos(t, 6)`) | 17.446 u = 3.634 m | 33.497 u = **6.977 m** | 6.978 m |
| Largura da pista | 120 u = 25 m | 58 u = **12,1 m** | veja abaixo |
| `scale` / `minLap` | 4 / 41 s | 7,68 / 79 s | |
| `flat` / `fall` | 60 / 380 | 115 / 730 | |
| Zebra (`dentro` / `fora`) | 340 / 220 | 653 / 422 | |
| Desnível da volta | 55 m | **105 m** | 105 m (EU-DEM) |

- **Traçado:** é o mesmo (a linha central real de bacinger, be-1925). As frações da volta, as curvas e a linha de chegada não mudaram.
- **Largura:** não achei a largura de Spa publicada em nenhuma fonte. Usei 12 m, o mínimo que a FIA pede a uma pista de grau 1 (o das de F1; é o resumo que a imprensa faz do regulamento, não o texto dele), que também cabe nos 10 a 14 m do pedido. Se alguém tiver a largura medida, é só trocar `width` (metros ÷ 0,2083).
- **Relevo e barreiras:** `node ferramentas/pista-real.js be-1925 spa --dem eudem25m --raio 3 --meia 6`. Eau Rouge e Raidillon ficaram a 13,1% (antes 14,6%), a pior descida a 17,3% e a maior quebra de inclinação a 0,34% a cada 6 u (antes 0,81%): a crista do Raidillon ficou mais suave, então o carro não decola. Com `--raio 2` o Raidillon sobe a 14,2%, mas a descida depois de Bruxelles chega a 20%, por isso fiquei no 3 do pedido. A ferramenta achou barreira mapeada em quase toda a volta (lado 1 sem barreira em 3%, o outro em 2%), então valem os 77 trechos de `muros` dela.

## Cenário

`gps/spa.js` ganhou `escala: 0.4` e `escalaGente: 0.69`, as mesmas de Interlagos (as peças do kit são as mesmas, então o real ÷ medido é o mesmo). As peças que só Spa tem também leem `tr.escala`:

| Peça | Antes | Agora |
| --- | --- | --- |
| Degrau das tribunas cobertas (principal e Raidillon) | 1,1 × 1,7 m, 12 fileiras | 0,45 × 0,68 m, 30 fileiras (mesma altura e mesma profundidade de antes) |
| Degrau das arquibancadas de curva (kit) | 1,25 × 1,87 m | 0,5 × 0,75 m |
| Pneu do muro | 2,1 m | 0,85 m (e a pilha vem a cada ponto) |
| Placas com o nome da curva | 20 × 7,5 m | 8 × 3 m |
| Torcida das encostas (de pé) | 2,17 m | 1,75 m (fator 8,4 ÷ 10,4 = 0,81); bandeiras e hastes junto |
| Barreira do escape (kit) | 1,77 m | 0,71 m |

As posições ao longo da volta não mudaram (são frações). Todas as peças continuam sendo colocadas (`faltouSpa` vazio, 19 peças).

**Medido e deixado como está:** prédio dos boxes e torre de controle, tendas, fiscais e torres de TV (35 m). **Acima do real e não mexidos:** a casa de enxaimel (andar de 5 m, cumeeira a 17 m; a de verdade tem uns 3 m por andar), as carretas do paddock (7 m de largura) e as árvores (35 a 62 m). Ficam para uma próxima.

## Robôs e recordes

- `corrida-linhas-f1.json`: linha de Spa refeita (5.583 pontos, 38 s).
- `migracoes/030-spa-escala-real.sql` zera voltas, recordes e setores de Spa, como a `029` fez com o México.
- Corrida com robôs no navegador (22 carros, 5 voltas, clima variável: choveu da 2ª à 4ª volta). Os 21 robôs correram, **nenhum abandonou nem quebrou e ninguém ficou preso**. Primeira volta (com a largada, no seco) de 98,2 a 113,5 s; no total, as voltas foram de 92,0 a 159 s, as mais lentas na chuva; a mais rápida no seco, na última volta (Russell, 92,0 s). 8 completaram as 5 voltas e os outros 13 foram classificados com 4. Na última volta, na chuva, cinco carros se bateram juntos. O piloto humano do teste ficou parado no grid de propósito.
- Desempenho (`node tests/ajuda-cena/medir.mjs spa`): 275 chamadas de desenho e 888 mil triângulos na vista (antes 204 e 566 mil); 1,64 milhão na cena inteira (antes 951 mil). A volta tem o dobro do comprimento (o dobro de árvores e de pneus) e as tribunas têm 2,5 vezes mais gente.

## Conferido no navegador

Prints com o Playwright, com o carro à vista: largada, La Source, Eau Rouge, Raidillon, Kemmel, Pouhon e duas vistas gerais (pasta `spa-prints`, fora do repositório).

Não rodei os testes (o CI roda). Nenhum teste foi criado nem apagado.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
