# Tiro: animação do elo no fim da partida

Quando a partida conta, a caixa do elo no fim agora é animada:
- **A caixa** entra subindo.
- **O número** conta de 0 até o ganho (+25) ou a perda (-13), com um tique a cada poucos pontos.
- **A barra da divisão** anda ponto a ponto entre o antes e o depois. Na vitória ela brilha; na derrota fica avermelhada.
- **Subiu de divisão no caminho:** a barra zera, o ícone troca de cor e pula, e a caixa brilha em dourado, com o aviso **"SUBIU PARA OURO 1!"** e o som de desbloqueio.
- **Caiu de divisão:** o ícone treme, com o aviso **"CAIU PARA PRATA 3"** em vermelho.
- **No fim:** o som de confirmar (vitória) ou de voltar (derrota).

A duração cresce com os pontos, entre 0,7 e 2,6 s. Fica tudo em `ferramentas/tiro-perfil-cliente.js` (copiado para `public/tiro/perfil-galera.js`).

**Conferido no navegador**, com a resposta do servidor simulada:
- 288 → 313 passa de Prata 3 para Ouro 1 no meio da conta;
- 305 → 292 cai de Ouro 1 para Prata 3.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
