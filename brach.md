# Tiro da Galera: modo de teste das camuflagens

O Thiago queria ver as camuflagens novas e as skins da faca, mas ainda não tem nível nas armas para equipá-las.

## Como usa

- Abrir o jogo com `?camos=todas` (por exemplo `https://viladotabba.com/tiro/?camos=todas`) liga o modo de teste **neste
  aparelho**. Ele fica ligado nas próximas vezes, até desligar.
- `?camos=normal` desliga.

## O que o modo de teste faz

- **Camuflagens de arma:** todas aparecem livres em todas as armas, do Deserto ao Holo, incluindo as 9 novas.
- **Skins da faca:** todas livres.
- **Classe personalizada:** a primeira abre já no nível 1 do jogador (normalmente no 3), porque a camuflagem só se põe numa
  classe personalizada.

## O que ele não faz

- Não mexe no XP nem no nível de ninguém. Só as travas deixam de valer naquele aparelho.
- Em outro aparelho sem o modo, uma camuflagem ainda presa volta ao Standard, como já acontecia.
- Qualquer um que abrir o link também liga o modo, mas só no próprio aparelho.

O código fica no fim de `ferramentas/tiro-camos/camuflagens.js`, e as skins da faca respeitam o modo pelo `faca.js`.

## Conferido no navegador

- Com `?camos=todas`, o Holo e o Cromado ficam livres.
- A skin Holo da faca fica livre.
- A primeira classe personalizada abre no nível 1.
