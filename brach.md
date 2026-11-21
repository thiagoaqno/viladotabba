# Linha dos robôs sem as curvas desnecessárias (a chicane do fim de Suzuka e as outras)

Pedido do Thiago de 2026-11-21: "essa última curva que o bot faz em Suzuka me incomoda muito: dava para só passar reto, mas ele sempre freia MUITO para fazer umas curvas que não precisava. Deve acontecer em outras pistas."

## O que era
- Na chicane do fim da volta de Suzuka (88% a 91%), a linha dos robôs fazia um "S": ia para dentro (−34 → −15), voltava para fora (−30) e entrava de novo (−11). Isso dava raio de 107 a 193 u, num trecho em que o eixo da pista tem 330 a 460 u e a pista tem 120 u de largura. O robô freava para essa onda.
- Não vinha da correção de muro (Suzuka não tem) nem dos limites (a pista inteira, −56 a 56, nesse trecho).
- Vinha da busca da linha (`linhaDeCorrida`): ela mexe um nó por vez e só aceita o que baixa o tempo de volta. Desfazer o "S" de uma chicane pede mexer vários nós juntos, e ela empacava.

## O que mudou
- **`esticarLinha` (`corrida-piloto.js`):** em cada janela de 4 a 25 nós, experimenta trocar o miolo pela **reta de verdade, no mundo**, entre o carro nas duas pontas (inteira ou até a metade) e fica com o que baixa o tempo de volta do mesmo modelo.
  - A primeira versão usava a reta no lateral, e numa chicane ela ainda é curva: o eixo vira para um lado e para o outro. Assim Suzuka ganhava só 0,23 s e o "S" continuava.
- **`ferramentas/esticar-linhas-f1.js`:** passa isso nas linhas salvas em `corrida-linhas-f1.json` e guarda só onde a volta ficou mais rápida. Mônaco ficou de fora (a linha antiga dela é de propósito, do #868).

## Medido
- **A volta do modelo** ficou mais rápida em todas as pistas. Exemplos:
  - Montreal −1,38 s; Suzuka −0,95 s; Jeddah −0,94 s; Monza −0,58 s; Singapura −0,60 s;
  - Madri −0,48 s; Spa −0,46 s; México −0,45 s; Baku −0,42 s.
  - As de menos ganho: Miami −0,03 s, Barcelona −0,03 s, Tokyo −0,05 s e Bahrein −0,05 s.
- **Suzuka:** o raio mais fechado da chicane passou de 107 para 196 u.
- **Um robô sozinho, nível 100, 3 voltas, sem batida:**
  - Suzuka 43,05 → **42,55 s**;
  - Montreal 39,15 → **37,8 s**.
- **No pelotão (21 robôs, 5 voltas, 4 sementes, média da volta e batidas fortes):**
  - Suzuka: 51,81 s e 34 → 51,87 s e 34 (igual: no pelotão manda o trânsito);
  - Jeddah: 50,98 s e 70 → 51,23 s e **44**;
  - Montreal: 47,60 s e 64 → **46,60 s** e 98. Com outras 4 sementes, 72 → 76. Nas 8 sementes, 136 → 174 fortes, e 0 → 11 no muro (só uma forte). **Montreal piorou nas batidas.**

Não foi testado jogando (regra do projeto: só `node --check` e o medidor sem tela, `klk/medir`).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
