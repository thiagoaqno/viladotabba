# Tiro da Galera: Iate Esmeralda desativado

O Thiago pediu para desativar o mapa do iate.

- **Fora da lista:** o `tiro-frontline.js` não coloca mais o mapa no jogo (`IATE_ATIVO = false`). Ele some da escolha de mapas
  no solo e no online.
- **Quem tinha o iate salvo:** cai no primeiro mapa da lista, o Deserto (`mapById` já faz isso).
- **Os arquivos ficam:** `ferramentas/tiro-mapas/iate.js` e `iate.svg` continuam no projeto, e a rodada 3 (centro elevado,
  camarotes, vidro espelhado), que não foi aprovada, ficou guardada no branch local `tiro-iate-rodada3`. Para religar o mapa,
  basta `IATE_ATIVO = true`.

Conferido no navegador: a lista de mapas tem os 9 de antes, sem o iate, e `mapById('iate')` dá no Deserto.
