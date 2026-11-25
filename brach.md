# Tiro da Galera: rádio em português, e uma voz para cada tipo de classe

## O que entra agora

- **Os 69 áudios que o Thiago gerou** (23 anúncios × 3 variações) estão no jogo, no lugar das vozes em inglês. Ficam em
  `ferramentas/tiro-vozes/`. O motor de som sorteia uma variação a cada anúncio.

## Vozes por classe (prontas para gerar)

A voz do rádio depende da arma principal da classe, então as classes personalizadas também ganham voz:

| Arma principal | Classe pronta | Voz |
| --- | --- | --- |
| Fuzil de assalto (e o resto) | Assalto | `oCWW6YTSEVFt26dBO8vU` (a que já foi gerada) |
| Submetralhadora | Faxineiro | `cPoqAvGWCPfCfyPMwe4z` |
| Fuzil de precisão | Atirador | `Bj9UqZbhQsanLzgalpEG` |
| Escopeta | Arrombador | `jqcCZkN6Knx8BJ5TBdYR` |

- **`ferramentas/tiro-vozes/vozes.json`** define as vozes. O `tiro-vozes.js` e o `VOZES-TIRO.bat` geram as 4 (só o que falta)
  e salvam cada voz nova em `tiro-vozes/<grupo>/`. Faltam 207 falas, 5.556 caracteres.
- **No jogo:** cada voz nova vira um pacote próprio (`sfx/voix_smg.js`, etc.), que só é baixado quando alguém nasce com
  aquela classe. Até o pacote chegar, e para qualquer voz que ainda não foi gerada, o anúncio sai na voz padrão.
- **Conferido:** fiz uma montagem de teste com uma pasta falsa de submetralhadora. O pacote, a lista do jogo e a troca de voz
  entraram, e a página continua sem erro de sintaxe.
