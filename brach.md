# Tiro da Galera: a Narradora é a voz padrão

O Thiago pediu para a voz de começo do narrador ser a 4, que é a única voz de mulher (as outras três são de homem).

## O que mudou

- **A voz de começo** agora é a da Narradora (o pacote `shotgun`). Ela fica em `NARRADOR_PADRAO`, no `ferramentas/tiro-frontline.js`.
- **Nas Opções > Áudio > Voz do narrador,** ela aparece como "Narradora". Os outros nomes continuam Narrador 1, 2 e 3.
- **O ajuste mudou de nome,** de `vozNarr` para `narrador`. O jogo salva todos os ajustes a cada partida, então quem já tinha
  jogado estava com a voz antiga gravada e nunca veria o padrão novo. Com o nome novo, o padrão vale para todo mundo. Quem tinha
  escolhido outra voz (a opção existe há uma hora) escolhe de novo.
- **A explicação do `vozes.json`** agora diz que a voz de começo é a `NARRADOR_PADRAO`, e que a "padrao" é a que toca enquanto o
  pacote da escolhida não chega.

## Conferido no navegador

Num navegador que já tinha ajustes salvos com a voz antiga (`vozNarr: "padrao"`):
- o jogo começou na Narradora, e o pacote que vai ser baixado é o dela (`voix_shotgun`);
- o seletor mostrou Narrador 1, 2, 3, **Narradora** (marcada) e "Pela classe da arma".
