# Tiro da Galera: trocar de equipe direto no salão

O Thiago pediu para dar para trocar de equipe no salão. O jogo já deixava, mas o botão ficava escondido: era preciso clicar no
próprio nome na lista de jogadores.

## O que mudou

- **Botão "Trocar de equipe" à vista no salão,** logo abaixo de "Editar a classe". Ele diz em que equipe você está ("Você está
  na Alpha. Passa você para a Bravo").
  - Vale para quem criou o salão e para quem entrou.
  - Aparece só em modo de equipe (mata-mata em equipe e dominação) e enquanto o salão espera a partida.
  - O dono continua podendo mudar os outros pelo nome deles na lista.
  - É feito por `ferramentas/tiro-frontline.js`, só no salão de amigos.
- **Entrar pelo código ficou mais rápido.** O jogo tenta primeiro um "salão permanente" do servidor original
  (`/tiro/rele/serveur/...`), que aqui não existe, e esperava ~1 s até desistir. Agora o relé responde "não existe" (4004) na
  hora, e o jogo cai direto no salão de amigos.

## Conferido no navegador, com dois jogadores pelo relé

- O dono criou o salão, viu o botão e passou da Alpha para a Bravo.
- O convidado entrou pelo código, pelo relé do nosso servidor: é o primeiro teste do online de ponta a ponta no jogo de verdade.
- O convidado trocou da Alpha para a Bravo, e o dono viu os dois na Bravo.
- Depois do ajuste no relé, o convidado entra em 77 ms.
