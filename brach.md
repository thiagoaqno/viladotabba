# A largada espera todos carregarem (a TV volta) e o médio no tempo do Thiago

O que ficou de fora do #620, que foi mesclado antes destes dois ajustes:

- **A largada espera todo mundo carregar:** a transmissão de TV volta na corrida avulsa (20 s; 25 s na carreira). Ela e as luzes só seguem quando todos os jogadores conectados já carregaram a pista: o navegador manda `carregou` quando a cena desenha, e a TV encurta para o tempo dela a partir dali, pelo mesmo caminho do pular. Ninguém trava a sala: a espera vai até no máximo 40 s (`CARGA_MAX_MS` em `corrida.js`). Testado no servidor com um cliente: a TV larga contando 60 s e, depois do `carregou`, acaba em 20 s, com as luzes 8 s depois. Não foi testado ainda com dois jogadores de verdade.
- **Níveis dos robôs, com o 1:04,5 do Thiago em Mônaco como a média do médio.** Em cada nível, a folga sobre o tempo ideal e a fração do limite nas curvas:
  - **difícil:** 0% e 96%, o médio de antes;
  - **médio:** 8% e 92%;
  - **fácil:** 13% e 85%.

  Medido em Mônaco, no seco, com 21 robôs, 2 voltas, a direção e a bateria novas. Todos terminaram e ninguém ficou preso. As melhores voltas:
  - **difícil:** 58,1 a 73,1 s (o 73 foi um robô atrasado numa disputa);
  - **médio:** 62,4 a 67,2 s, média de ~64,8 s;
  - **fácil:** 68,0 a 75,9 s.

Só `node --check` e as corridas no servidor; a suíte fica com o CI.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
