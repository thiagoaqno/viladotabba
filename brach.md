# Chuva, pneus, ERS e rádio (1º lote da lista de 13/nov)

- **ERS desligado na chuva:** com a pista molhada (água ≥ `AGUA_MOLHADA`, 0,15) o MGU-K não entrega; a bateria só recarrega (`F1.ersBloqueadoNaChuva`, em `sim.js` e `fisica.js`: vale para quem joga e para os robôs).
- **Pneus (`f1-regras.js`):** macio 1,38 → 1,40 e médio 1,35 → 1,36 de `pico`. No seco, intermediário e de chuva perdem menos pelo superaquecimento (`PERDA_ESQUENTA` 0,25 → 0,12) e o intermediário começa em 1,03 em vez de 0,97 na curva da água; o `derrete` (desgaste no seco) continua igual. O intermediário dura 5,5 voltas (eram 4) e ficou uns 5% acima do de chuva na garoa.
- **Garoa mais longa:** a garoa (sem virar chuva forte) dura no mínimo 240 s (eram 120) e só para em 25% das vezes (eram 50%).
- **Previsão confiável:** de 50% para cima chove sempre e abaixo de 25% nunca (`chanceReal`); só o "Possibilidade de chuva" sorteia. A largada molhada certa aparece como "Largada com chuva".
- **Robôs na chuva (`corrida-robos.js`):** cautela por pneu e condição (`cautelaPneu`): o quanto a água tira do composto (`F1.fatorAgua`) faz o robô frear antes e contornar mais devagar; com o pneu certo sobra só uma margem pequena.
- **Rádio:** a sugestão de box diz o pneu (`boxmacio`, `boxmedio`, `boxduro`, `boxintermediario`, `boxchuva`; até o mp3 existir, toca o "box" de sempre pela `reserva` nova de `Radio.dizer`) e, na penúltima volta, o engenheiro comenta o resultado contra a meta do GP ou o grid (`penultimaboa`, `penultimaok`, `penultimaruim`). **Os mp3 novos saem do `gerar-radio.bat`** (ele só gera o que falta).
- Os números são pedidos de ajuste do Thiago, não medidos: a sensação se confere jogando.
