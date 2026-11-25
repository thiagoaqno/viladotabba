# Tiro da Galera: perfil de cada um no banco da Vila

O jogo guarda o progresso no navegador: o nível, o XP de cada arma, as classes personalizadas (que liberam com o nível), os
desafios, as roupas e os ajustes. Trocar de aparelho ou limpar o navegador zerava tudo. Agora isso fica num perfil no banco da
Vila, no mesmo esquema da Carreira: um token no navegador e um código de 12 letras para entrar em outro aparelho. O banco
guarda só o hash dos dois.

## Como

- **`migracoes/056-tiro-perfis.sql`:**
  - `tiro_perfis` guarda o nome, os hashes e os dados (as chaves do navegador);
  - `tiro_perfis_aparelhos` guarda um token para cada aparelho a mais, para PC e celular continuarem conectados juntos.
- **`servidor/comum/bd.js`:** `criarPerfilTiro`, `perfilTiroPorToken`, `recuperarPerfilTiro`, `salvarPerfilTiro`,
  `novoCodigoTiro` e `placarTiro`.
- **`servidor/jogos/tiro-perfil.js`:** as rotas em `/tiro/perfil`: `criar`, ler, `salvar`, `entrar`, `codigo` e `placar`.
  - O token vai no cabeçalho `X-Tiro-Token`, nunca na URL.
  - Só aceita as chaves do jogo (`cod_arsenal`, `dc_settings`, `cod_nick`, `dc_grenade`, `dc_couteau`), até 200 KB.
- **`ferramentas/tiro-perfil-cliente.js` → `public/tiro/perfil-galera.js`,** carregado antes de qualquer script do jogo:
  1. ao abrir a página, puxa o perfil do servidor e escreve as chaves antes de o jogo lê-las;
  2. cada vez que o jogo grava uma dessas chaves, manda uma cópia para o servidor (no máximo uma a cada 4 s, e a que faltar ao
     fechar a aba);
  3. nos menus, mostra o botão "👤 Nome · nível N". Ele serve para criar o perfil, entrar com o código, gerar um código para
     outro aparelho, sair deste aparelho e ver o placar da galera (top 10 por XP).
- **Na primeira visita sem perfil,** a janela aparece sozinha uma vez. O que já estava no aparelho vai junto para o perfil
  novo. Quem clica em "Agora não" só é perguntado de novo depois de 3 dias.

## Conferido

Rodei um servidor local com banco em memória e testei:
- criar, ler, salvar (também pelo caminho do `sendBeacon`) e entrar com o código com traço;
- o segundo aparelho com token próprio, sem derrubar o primeiro;
- o código novo invalidando o velho, e o placar;
- a página e o `perfil-galera.js` servidos (200).
