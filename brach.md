# Derrapagem: perde 20% menos velocidade e desliza 10% mais

O Thiago achou que derrapar tirava velocidade demais. Pediu que o carro perdesse 20% menos do que perde hoje e, em troca, deslizasse 10% a mais.

## `dinamica.js`

- **Modelo físico** (médio, duro e chuva):
  - **Desliza mais:** depois do pico de aderência, a força lateral do pneu cai suavemente até 1/1,1 do que era (`DERRAPA_DESLIZA`), e o carro escorrega mais.
  - **Perde menos:** derrapando (pneu da frente ou de trás além do pico), 20% da parte das forças de lado que freia o carro na direção em que ele anda é devolvida (`DERRAPA_PERDA` = 0,8).
  - **Antes do pico** (a curva no limite, sem escorregar), nada muda.
- **Modelo arcade** (o macio dentro da vida útil): no escorregão, a correção de lado fica em 1/1,1 e a perda pelo `scrub` em 80%.
- **Robôs:** usam a mesma física, então também derrapam assim.

## Programa de PC

O `PROTOCOLO` subiu de 2 para 3 (`corrida-pc.js`), porque a física mudou: o programa velho preveria errado e passa a pedir a atualização antes de jogar no site.

## Não conferido

Não rodei a suíte. A CI diz se algum teste de física depende do escorregão antigo.
