# Tiro da Galera em português

O jogo agora abre em português. Os 1.616 textos do jogo estão traduzidos: menus, armas, acessórios, mapas, killstreaks,
avisos da partida, salão online, controles e opções.

## Como

- **`ferramentas/tiro-pt.json`** é o dicionário: o texto em francês do jogo (as chaves do `_t()` deles) e o português.
- **`ferramentas/tiro-frontline.js`** troca o dicionário de inglês da página por esse. O jogo só conhece `fr` e `en`, então
  o `en` virou o português e é o padrão. Em Opções > Jogo > Idioma aparecem "Português" e "Français".
- **Números e datas** seguem o formato pt-BR, e a colocação aparece como 1º, 2º...
- **Conferido:** cada tradução mantém os `{0}` e as tags HTML do original. A única que difere é a de propósito: o aviso
  "entre na conta para ganhar XP" saiu, porque aqui não tem contas.

## O que fica em outra língua

- **As vozes dos anúncios** (killstreaks, objetivos) continuam em inglês: são gravações.
- **O histórico de novidades do jogo** continua em inglês.
- **Telas de privacidade e termos:** traduzidas, mas são as do site deles.
