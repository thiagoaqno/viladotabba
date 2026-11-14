# Carreiras guardadas por 3 dias sem ninguém entrar; salas rápidas vazias somem

**Carreiras (3 dias sem entrar):**
- **GP da carreira (`corrida.js`):** a sala do GP da carreira (solo e em grupo) sumia depois de 12 horas parada. Agora fica 3 dias (`HORAS_CARREIRA = 72`, pelo `horasDe` novo de `limparSalasParadas` em `salas.js`); as outras salas seguem com 12 horas.
- **O GP que sumiu não trava mais a carreira:** quando a sala do GP já não existia, a carreira solo (`corrida-temporada.js`) e a em grupo (`corrida-temporada-grupo.js`) continuavam achando o GP aberto e mandavam para uma sala inexistente ("Sala não encontrada"). Agora, sem a sala, ela abre o GP de novo.
- **Temporada em grupo:** já guardava 72 h, mas contava da última MUDANÇA na sala: quem só entrava para olhar não segurava nada. Agora entrar conta (`ligar` → `guardar`, também no banco, para valer depois de um reinício), e com alguém conectado o relógio não anda (`cadaVolta`). A carreira solo fica no banco sem prazo (não mudou).

**Salas rápidas sem humanos (`corrida.js`):** antes, quando todos saíam, os robôs seguiam correndo sozinhos (física, IA, rede) por até 12 horas. Agora a sala fora da carreira sem nenhuma conexão (de quem joga ou de quem assiste) some depois de 2 min (`SALA_VAZIA_MS`, ajustável por `CORRIDA_SALA_VAZIA_MS`); a espera cobre quem só recarregou a página. Os relógios dela param no mesmo `apagarSala` da limpeza de sempre.

Conferido com `node --check`. Sem entrada no `novidades.json` (está quebrado na `main`; o conserto está no #717).
