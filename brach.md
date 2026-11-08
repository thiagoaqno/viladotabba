# Cenário de Interlagos no tamanho real

O carro e a pista de Interlagos já estavam no tamanho de verdade, mas o cenário em volta tinha sido desenhado para o carro antigo, quase o dobro. Na largada, uma pessoa da arquibancada era do tamanho do carro e a placa de DRS era maior que ele. Este PR cria uma chave `escala` na configuração do GP, com padrão 1, e liga ela em Interlagos. Ele inclui o #603 (carro) e o #601 (pista).

## Como funciona

- `escala` (e `escalaGente`, só para a torcida) fica em `gps/interlagos.js` e vira `tr.escala` em `pista.js`. As peças do kit e as de `pista.js` multiplicam o **tamanho** por ela. A posição ao longo da pista e o recuo da beira não mudam.
- Sem a chave, vale 1 e nada muda. A Monza (outra pista) saiu igual nos prints de antes e depois.

## O fator, pelo tamanho real (1 u = 0,2083 m, ou 4,8 u por metro)

| Peça | Antes | Real | Depois |
| --- | --- | --- | --- |
| Degrau da arquibancada, altura | 1,25 m | 0,4 m | 0,50 m |
| Degrau, fundo | 1,87 m | 0,8 m | 0,75 m |
| Barreira do escape | 1,77 m | 0,75 m | 0,71 m |
| Pessoa na arquibancada | 2,54 m | 1,75 m | 1,75 m |

As razões real ÷ antes são 0,32, 0,43 e 0,42 para as peças de estrutura (média geométrica 0,39, então `escala: 0.4`) e 0,69 para a pessoa (`escalaGente: 0.69`), porque uma pessoa não encolhe como um degrau.

Outras peças que seguem o fator (sem um valor real medido por mim, só seguiram a escala): pilha de pneus 2,1 m de diâmetro para 0,85 m; painéis de patrocínio 6,2 × 1,9 m para 2,5 × 0,75 m; placas de frenagem 2,7 × 1,9 m para 1,1 × 0,75 m; vão livre sob a passarela 15,4 m para 6,2 m; pórtico da largada 12,9 m para 5,2 m; placa de DRS 6,9 × 2,7 m para 2,75 × 1,1 m; setas de curva 2,9 × 2,2 m para 1,2 × 0,9 m; placa PIT ENTRY 11,5 × 3,5 m para 4,6 × 1,4 m; linha de chegada 2,5 m de espessura para 1 m; colchete do grid 6,25 m de largura para 2,5 m (o carro tem 1,9 m).

**Já estavam em tamanho real e não mudaram:** prédio dos boxes (3 pavimentos), São Paulo em volta (andar de 3 m), árvores (6,7 a 12 m), cerca de 5 m, mastros de bandeira, postos de fiscal, mecânicos (em metros × o fator do carro), mureta do box (0,75 m) e garagens. A faixa dos boxes (54 u) fica como está porque é da física.

## O que foi conferido no navegador

Prints com o Playwright, com o carro à vista, antes e depois: largada com o grid, reta dos boxes, S do Senna, vista geral de cima, a Ferradura (setas, pneus, brita), a passarela e as garagens com a equipe fazendo a troca de pneus. Uma pista antiga (Monza) antes e depois, igual.

Corrida curta com robôs em Interlagos, no navegador: 21 robôs, 2 voltas. Os 21 terminaram, nenhum abandonou, nenhum quebrou, ninguém ficou preso. Melhores voltas de 65,8 a 81,3 s (contam a largada). O único parado foi o piloto humano do teste, que não saiu do grid de propósito.

## O que não foi conferido ou ficou de fora

- Os mecânicos aparecem só durante uma parada real. No print forcei, só no script de teste, uma equipe fazendo a troca; uma parada de verdade com o carro não foi vista.
- Não vi a pista de noite nem na chuva, nem a câmera de cockpit.
- Ficaram como estão: outdoors (13 × 5,8 m), cata-ventos, trem, avião, balão, helicóptero, o lago e a caixa-d'água, as bandeiras de checkpoint (marcadores do jogo) e as zebras (1,5 m). Não tenho um tamanho real confirmado para elas.
- Outras pistas não ganharam `escala`: ficam com o cenário grande até alguém medir e escolher o fator de cada uma (`planos/escala-real.md`).
- Nenhum teste criado ou apagado. Só `node --check`; a suíte fica com o CI.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
