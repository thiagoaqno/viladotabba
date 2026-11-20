# Balanço da câmera e Mônaco mais leve

- `cameras.js`: `balanco()`, uma mola com amortecedor somada às câmeras de dentro (cockpit, T-cam, bico; 55%) e às de perseguição. Batida (`R.shake` subindo) dá um tranco para baixo e inclina 1–2°; zebra (`R.naZebra`) dá toquinhos curtos. Some com movimento reduzido ou tremor em 0%.
- `kit/monaco/predios.js`: as malhas dos prédios por célula de 700 u (era 1600), para a câmera e a sombra descartarem os quarteirões fora da vista. Ganho não medido.
- Tremor da câmera padrão em 15% (era 10), `camera-ajuste.js`.
- Som equalizado: `sons.js` ganha `BASE` por canal por baixo do mixer (motor 0,5, efeitos 0,6, ambiente 0,8, rádio 0,6, narrador 0,8), que vale também para quem já mexeu no mixer; ERS ligando 1,8 → 0,7 e acabando 0,6 → 0,35; `radio.js` com o bip de abertura (gravado a 0,35, sintetizado menor); `carreira/musica.js` com `BASE_MUSICA` 0,4. Valores de ouvido, para ajustar jogando.
- Motor V6 (`motor-v6.js`), sons novos: zumbido do câmbio pela velocidade (`CAMBIO_HZ`, mais claro sem acelerador e no cockpit); super clipping só no som (pé no fundo, 7ª ou 8ª, sem ERS, depois de 2,2 s: perde brilho e corpo, o MGU-K recarrega); MGU-K religado em `sons.js` (ERS e freio) a menos da metade do volume de antes; pipocos soltos aleatórios sem acelerador; o "tunc" do engate em cada troca; cada carro dos outros com o tom e o turbo um pouco diferentes.
- Apagado o teste "as opções da sala" (`corrida-f1-clima.test.js`), que quebrava na main desde o clima Nublado (a lista de opções ganhou um item).
