# Tiro da Galera: o "Perfil" do menu do jogo abre o perfil da Vila

O Thiago clicou em Perfil no menu do jogo e caiu na tela de contas do site original, que aqui dizia "Aqui o jogo não tem
contas". O perfil da Vila (#995) estava num botão separado, no canto de baixo.

## O que mudou

- **O cartão "Perfil" do menu do jogo agora é o perfil da Vila.** Ele mostra o nome e o nível ("Thiago · Nível 7 · ver meu
  perfil"), ou "Criar perfil" para quem ainda não tem. Clicar nele abre a janela do perfil (criar, entrar com o código, código
  para outro aparelho, placar) no lugar da tela de contas.
  - `ferramentas/tiro-frontline.js` faz o `uiGo('profile')` e o `acctChip` do jogo perguntarem ao `window.tiroPerfil`.
  - O `perfil-galera.js` atualiza o cartão quando o nome ou o nível mudam.
- **O botão separado do canto** só aparece se o cartão do jogo não estiver na tela. O "🏁 Corrida" do programa de PC continua.
- **Saiu o script de estatísticas de visita do Vercel** (`/_vercel/insights`), do site original. Aqui ele dava 404, e assim
  nada de visita sai para fora.

## Conferido no navegador

Num servidor local:
- o cartão mostrava "Criar perfil", e clicar nele abriu a janela do perfil, com o jogo parado no menu principal;
- o perfil foi criado e o código apareceu;
- o cartão passou a mostrar "Teste · Nível 1 · ver meu perfil";
- no console, nenhum erro de script.
