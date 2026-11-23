# Os robôs pilotam a classificação como fantasmas

Pedido do Thiago (2026-11-23): "faz o fantasma deles correndo no qualify". Também: "vamos manter só o Jeff mesmo, por enquanto".

## A classificação pilotada
- Antes, o robô não andava na classificação: o tempo saía de uma conta (`voltaLancada`) e aparecia na tabela numa hora sorteada.
- Agora, com gente jogando, os robôs da sessão saem do grid e pilotam com a física de verdade:
  - `corrida-robos.js prepararQuali`: o pneu da classificação pela água da abertura, a saída de um a cada 1 s e os eliminados fora da pista;
  - `passo`: na fase `quali`, só quem está na sessão aberta, sem ver os outros carros;
  - `corrida.js`: o relógio dos robôs na classificação, com os setores pela mesma conta de quem joga (`onSector` → `aoSetor`);
  - os robôs são fantasmas na classificação (o `fantasma` do estado público): aparecem transparentes e ninguém bate.
- O tempo de cada robô é a melhor volta que ele fez (`tabela`). Sem ninguém na pista, fica a conta rápida de antes.
- A sessão ganhou 21 s, a saída escalonada dos robôs (`duracaoDaClassificacao`).
- Medido com um Q1 simulado em Mônaco (`klk/medir/quali-pilotada.js`, 21 robôs, nível 100):

| | Seco | Chuva (água 0,6) |
|---|---|---|
| Robôs com tempo | 21 de 21, 4 voltas cada | 21 de 21, 3 a 4 voltas |
| Pole | 49,200 | 55,150 (+12%, a física) |
| 10º | 50,200 | 56,300 |
| Último | 53,200 | 57,650 |

- A conta de chuva de #902 fica só para a classificação sem ninguém.
- Não foi jogado.

## O rádio só com o Jeff
- `radio.js ENGENHEIROS`: só o Jeff. As vozes do Marcos e da Bia continuam em `radio/marcos` e `radio/bia`. A linha "Engenheiro" de Configurações só aparece com mais de um.
- As 24 falas novas do Jeff para a classificação (#903), geradas pelo Thiago.
