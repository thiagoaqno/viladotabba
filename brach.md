# Balanço da câmera e Mônaco mais leve

- `cameras.js`: `balanco()`, uma mola com amortecedor somada às câmeras de dentro (cockpit, T-cam, bico; 55%) e às de perseguição. Batida (`R.shake` subindo) dá um tranco para baixo e inclina 1–2°; zebra (`R.naZebra`) dá toquinhos curtos. Some com movimento reduzido ou tremor em 0%.
- `kit/monaco/predios.js`: as malhas dos prédios por célula de 700 u (era 1600), para a câmera e a sombra descartarem os quarteirões fora da vista. Ganho não medido.
