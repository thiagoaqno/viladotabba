# Tiro da Galera: skins da faca

O Thiago pediu skins para a faca.

## As skins

A faca não tem nível como as armas. Por isso as skins se liberam por **abates com a faca** (o golpe e a faca de arremesso contam):

| Abates | Skin | Como é |
|---|---|---|
| 0 | Padrão | A faca de sempre |
| 1 | Tática | Lâmina preta fosca e cabo verde-oliva |
| 5 | Damasco | Aço de Damasco ondulado, guarda de latão e cabo de madeira |
| 10 | Onça | Lâmina com a pintura da onça-pintada |
| 15 | Carbono | Lâmina e cabo de fibra de carbono |
| 25 | Ouro | Lâmina dourada e guarda de ouro |
| 40 | Rubi | Lâmina de rubi lapidado e cabo vinho |
| 60 | Galáxia | Lâmina de nebulosa estrelada e guarda prateada |
| 100 | Holo | A película holográfica do Holo na lâmina e cabo branco |

- **Onde escolher:** em **Opções > Jogo**, no grupo Interface, no botão **"Skins da faca"**. A tela mostra quantos abates com a
  faca você tem, e as skins ainda presas dizem quantos faltam.
- **Aviso de skin nova:** quando um abate libera uma skin, aparece um aviso na partida.
- **Na partida:** a skin aparece na faca em primeira pessoa e troca na hora, até com o jogo pausado.

## Como entrou

- O código fica em `ferramentas/tiro-camos/faca.js`. O `tiro-frontline.js` coloca ele depois das camuflagens novas, porque ele
  usa os desenhos delas.
- Cada skin troca as matérias da lâmina, da guarda e do cabo da faca. Os desenhos vêm das camuflagens, projetados na faca.
- A contagem fica no aparelho (`localStorage` `tiro_faca`). Ela ainda não vai para o perfil da Vila no servidor.

## Conferido no navegador

- As 9 skins montam as matérias e os shaders compilam sem erro.
- O botão aparece nas opções, e a tela de escolha prende e solta as skins pelo número de abates.
- Um abate com a faca soma 1 na contagem e fica guardado.

Falta o Thiago ver as skins na mão jogando.
