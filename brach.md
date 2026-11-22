# Os bônus dos planos e dos eventos com um quarto do efeito

O Thiago (2026-11-21): "essas decisões que afetam quebram um pouco o game... dosar para serem bem menores". Lido no banco do programa dele (Haas, nível 150): em Melbourne e em Xangai, os dois GPs com "Ataque total", ele deu volta no grid (10 voltas contra 9 do 2º colocado, ~3 s por volta mais rápido). Com "Esticar os pneus" ficou em 7º em Montreal (com chuva) e com "Guardar para o fim", em 6º em Mônaco.

- `f1-regras.js PLANOS_DOMINGO`:
  - ataque: potência 1,12 → 1,025, aderência 1,03 → 1,005, pneu 1,15 → 1,1, dano 1,5 → 1,3;
  - seguro: 0,97 → 0,99, aderência 0,985 → 0,997, pneu 0,85 → 0,9, dano 0,6 → 0,7;
  - largada forte e guardar para o fim: +15% / +4% → +3% / +0,8% na fase de ataque;
  - esticar os pneus: pneu 0,75 → 0,85, sem a potência a mais.
  - O pneu somado com os eventos fica entre 0,85 e 1,25 (era 0,8 a 1,4).
- `temporada/paddock.js modificadores`: cada efeito do fim de semana caiu para um quarto (o pacote ±0,6%/−0,4%, o motor +1,2%/−0,8%, o chassi reserva, o conserto, a corrida limpa, a revisão rápida). Os textos das opções dizem os números novos.
- `corrida-f1-direcao.js`: o dano pelo plano lê a tabela (`PLANOS_DOMINGO[...].dano`), em vez dos números soltos.
- As punições de tempo estão valendo: em Mônaco ele levou 3 s, e o tempo final conta. Nos outros GPs os toques não deram punição porque a culpa não era clara.
