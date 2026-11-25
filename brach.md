# Tiro da Galera sem internet, no programa de PC, com o perfil subindo depois

## Jogar sem internet

O programa de PC da Corrida já leva a pasta `public/` inteira e roda o servidor no próprio PC, então o tiro já vinha junto.
Faltava um jeito de chegar nele, porque a janela do programa não tem barra de endereço:

- **`public/corrida/index.html` + `menu.js`:** no programa de PC, o menu da Corrida ganha o item "Tiro da Galera" (`/tiro/`).
  No site, o item fica escondido.
- **No tiro, dentro do programa,** aparece o botão "🏁 Corrida" para voltar.
- **Contra os bots, tudo roda no PC.** O online continua precisando de internet, porque passa pelo relé da VPS.

## O perfil é o do site, também no programa

- **`servidor/jogos/tiro-perfil.js`:**
  - `GET /tiro/perfil/site` diz o endereço do site (o `CORRIDA_SITE` do programa; no site, vazio);
  - o CORS do perfil vale só para a origem do programa (`http://127.0.0.1:<porta>`), com o preflight do `X-Tiro-Token`.
- **`perfil-galera.js`:** em 127.0.0.1, ele fala com o perfil do site.
  - Sem internet, o jogo usa o que está no aparelho, e o que for jogado fica marcado como pendente (`tiro_perfil_pend`, com ⏳
    no botão do perfil).
  - Esse progresso sobe quando a internet volta: na hora, pelo evento `online`, ou na próxima abertura.
  - Se, ao abrir, o site tiver algo diferente (jogado em outro aparelho), a página recarrega com o que está no site.
- **O progresso nunca volta para trás:** o `salvar` recusa um `cod_arsenal` com XP total (`px`) menor que o guardado e responde
  com os dados do servidor, que o aparelho então adota. Os ajustes seguem a última gravação.

## Conferido

Rodei dois servidores locais, um fazendo o papel do site e outro o do programa apontando para ele:
- o programa descobre o endereço do site;
- o preflight do CORS responde 204 para a origem do programa, e uma origem qualquer não recebe a liberação;
- um XP menor não apaga o maior, e o aparelho recebe os dados do servidor;
- o item do tiro aparece no menu da Corrida;
- o `/tiro/` abre no "programa".

Também entrou uma linha em `public/corrida/novidades.json`, conferida com `JSON.parse`.
