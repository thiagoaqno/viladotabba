# Balanço da câmera e Mônaco mais leve

- `cameras.js`: `balanco()`, uma mola com amortecedor somada às câmeras de dentro (cockpit, T-cam, bico; 55%) e às de perseguição. Batida (`R.shake` subindo) dá um tranco para baixo e inclina 1–2°; zebra (`R.naZebra`) dá toquinhos curtos. Some com movimento reduzido ou tremor em 0%.
- `kit/monaco/predios.js`: as malhas dos prédios por célula de 700 u (era 1600), para a câmera e a sombra descartarem os quarteirões fora da vista. Ganho não medido.
- Tremor da câmera padrão em 15% (era 10), `camera-ajuste.js`.
- Som equalizado: `sons.js` ganha `BASE` por canal por baixo do mixer (motor 0,5, efeitos 0,6, ambiente 0,8, rádio 0,6, narrador 0,8), que vale também para quem já mexeu no mixer; ERS ligando 1,8 → 0,7 e acabando 0,6 → 0,35; `radio.js` com o bip de abertura (gravado a 0,35, sintetizado menor); `carreira/musica.js` com `BASE_MUSICA` 0,4. Valores de ouvido, para ajustar jogando.
