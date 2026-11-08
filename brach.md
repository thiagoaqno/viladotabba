# Só as pistas de GP de F1 na Corrida

Saem as dez pistas que não são do calendário da F1: Tóquio, Los Angeles, Rio de Janeiro, Serra Verde, Deserto Dourado, Nürburgring, Laguna Seca, Circuito do Luigi, Terra do Sorvete e Estrada Arco-íris. Ficam as 24 pistas de GP.

- Saíram dos traçados, das cores, dos céus, da tabela de pneus, da ficha dos GPs, da linha dos robôs e do texto "Como jogar".
- Os céus que pistas de F1 reaproveitam continuam (Tóquio, deserto, Los Angeles, Serra, Laguna e Nürburgring). Saíram só as imagens que ninguém mais usa: o céu do Arco-íris, do Luigi, do Rio e do Sorvete, e a foto do Nürburgring.
- A "Serra à Noite" do modo Drag é outra pista e continua.
- Testes que só existiam para as pistas antigas foram apagados ou tiveram essas pistas retiradas: o primeiro de `corrida-experiencia.test.js`, o da roda-gigante do Rio em `corrida-pistas-desempenho.test.js` e as linhas do Arco-íris e das antigas em `corrida-f1-box.test.js`.

## Verificação

- `node --check` em tudo que mudou; `pistas.js` carrega com as 24 pistas.
- Não testei no navegador. A suíte fica com o CI.
- Uma configuração antiga com uma pista apagada cai em Interlagos (`cleanConfig` em `corrida.js` já fazia isso).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
