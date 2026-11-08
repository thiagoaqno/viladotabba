# Cidade do México em escala real: volta de 4,3 km, pista de 14 m e relevo do SRTM

Teste do Thiago: a primeira pista do jogo com o tamanho de verdade. Antes, a volta tinha 12 841 u (2 675 m, 1,609 vez menor que a real) e a pista 120 u (25 m, quase o dobro da real). Agora o Autódromo Hermanos Rodríguez tem a volta e a largura reais, na mesma escala da física (1 u = 0,2083 m).

## O que mudou

| | Antes | Agora |
| --- | --- | --- |
| `scale` | 3,35 | 5,39 (3,35 × 1,609) |
| Volta (`Pistas.pontos(t, 6)`) | 12 841 u = 2 675 m | 20 662 u = **4 304 m** (a real) |
| `width` | 120 u (25 m) | 67 u (**14 m**) |
| `minLap` | 31 s | 50 s (31 × 1,609) |
| `flat` / `fall` | 40 / 220 | 64 / 354 (proporcionais) |
| Zebra `dentro` / `fora`, brita `britaCurvas` | 340 / 220, 420 | 547 / 354, 676 (× 1,609, para as mesmas curvas terem zebra e brita) |

- **Largura:** a única fonte que achei dá de 13 a 15 m (formulaf1.es, de uns 11 anos atrás); usei 14 m, o meio. Não confirmei com a FIA.
- **Relevo:** `node ferramentas/pista-real.js mx-1962 mexico --dem srtm30m --raio 14`. Com `--raio 4` o SRTM dava 19 m de desnível e 17% de inclinação (árvore e prédio contados como ladeira); com `--raio 14` são 8 m de desnível e no máximo 3,2%. Entrou `hills` de 100 pontos e `hillsSuave: true`.
- **Barreiras:** a ferramenta achou barreira mapeada no OpenStreetMap em só 53% de um dos lados (sem barreira em 47%, acima do corte de 30%), então não usei `muros`: vale a regra automática de antes.
- **Recordes:** a migração `029-mexico-escala-real.sql` zera voltas, recordes e melhores setores da Cidade do México, que eram da pista antiga.

## Cenário

Tudo estava em coordenada fixa da pista antiga (o Foro Sol, o Palácio, os lagos, as quadras e as árvores ficaram soltos ou em cima do asfalto). Foi reposto:

- **Foro Sol:** continua no miolo da alça do fim da volta, com a arquibancada em ferradura aberta onde a pista passa e colada nela. Agora tem 94 m de semieixo e 16 degraus; o estádio assenta no nível da arquibancada (com aterro por baixo), porque o chão ali sobe até uns 4 m perto da pista.
- **Campos e quadras:** 35 campos de futebol e quadras de basquete e de tênis nas posições reais do OpenStreetMap (© colaboradores do OpenStreetMap, ODbL; `kit/mexico/dados.js`), desenhados acompanhando o chão. 25 dos 60 foram descartados por cair em cima da pista ou de outra peça.
- **Palácio dos Esportes:** na posição do OpenStreetMap (a ~1,5 km a oeste da pista) e no tamanho de verdade (domo de 120 m).
- **Paddock:** o jogo já o achava a ~54 u do prédio `Paddock` do OpenStreetMap.
- **Lagos:** o OpenStreetMap só mapeia um laguinho (ao sul), que foi posto; os outros dois do miolo são enfeite do parque.
- **Árvores, cidade e vulcões:** as faixas de sorteio crescem com o mundo (~2 200 árvores, o anel de casas ×2,6).
- A conferência de invasão acusa 0 (nada sólido dentro da pista).

## Robôs

- Sozinho (`Robos.passo`, Cadillac, pneu médio, 3 voltas, sem batida e sem aviso de limite): **61,8 s** (difícil), 62,7 s (médio) e 68,5 s (fácil) por volta; o carro passa a no máximo 31 u do centro, com a meia largura em 33,5 u.
- Corrida no navegador com 21 robôs: nenhum abandonou, ninguém ficou preso (um deles ficou em modo fantasma por instantes, como previsto), mais de duas voltas cronometradas por carro. **Melhores voltas dos robôs: de 67,3 a 83,2 s (mediana 79,2 s).** Houve contato e penalidade em 9 carros, com no máximo 20% de dano.

## Medido

`node tests/ajuda-cena/medir.mjs mexico`: 402 malhas, 176 chamadas de desenho e ~457 mil triângulos na vista do jogo (antes ~145 e ~236 mil, com 2 200 árvores no lugar de 900).

Prints (largada, curva 1, Foro Sol, Peraltada, vista geral) estão fora do repositório, em `C:\Users\thiag\AppData\Local\Temp\claude\a43235fffb6a7cf2\549297c6-4103-4b30-bf0b-0bd22e30e397\scratchpad\prints-mexico\`.

## O que não foi conferido

- A suíte de testes não foi rodada (só `node --check` e as medidas acima); nenhum teste foi criado nem apagado. Confirmei só no código que o teste de `minLap` passa (teto de 67,5 s contra 50 s).
- **A posição do Foro Sol é aproximada.** O polígono do estádio no OpenStreetMap cai ao lado da curva 1, não na alça do fim da volta onde o jogo o põe (como diz a Wikipédia, curvas 12 a 15). Não consegui resolver essa diferença. O estádio também é menor que o de verdade, porque só cabe o miolo da alça. A Peraltada antiga também é só uma curva de concreto de raio grande, sem posição confirmada.
- Só uma corrida de robôs foi feita (a ~5 minutos de corrida), com o computador ocupado; não medi a volta de uma pessoa nem a sensação de pilotar uma pista de 14 m.
- O traçado foi mantido (vértices do bacinger); só a escala mudou. A posição da `largada` (0,134 da volta) não foi revisada na nova escala.
- O visual dos prints foi conferido por mim em câmeras fora do jogo (sem o efeito de pós-processamento), exceto a largada; a vista geral sem neblina mostra o anel de casas flutuando além do chão.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
