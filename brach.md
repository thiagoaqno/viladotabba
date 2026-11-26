# Tiro da Galera: peças de convés para o Navio

O editor ganha peças independentes inspiradas nas referências de convés de iate: ponte panorâmica, cabana com bancos e ducha, hidromassagem, balcão, banco, claraboia, armário, posto de comando, arco superior, caixa, corrimão e escada. Os nomes usam o prefixo `kcN` e entram automaticamente no grupo Navio do catálogo.

A ponte tem portas de 2,4 m e laje andável; seus vidros e os do corrimão são fixos. A escada é registrada para jogadores e bots. A documentação traz as medidas e o aviso de giro em múltiplos de 90 graus para a escada. Os mapas JSON não foram alterados.

Validação: `node --check ferramentas/tiro-editor/pecas.js` e remontagem do jogo com `tiro-frontline.js`. A aparência e a navegação precisam ser conferidas jogando. Os PRs #1032 e #1034 também acrescentam peças ao Navio e podem precisar de reconciliação caso sejam mesclados antes deste.
