# O fim do GP espera os robôs perto cruzarem a linha, e a volta do topo é a sua

O Thiago (2026-11-21), em Mônaco: "cheguei colado com o Norris, a menos de 3 s, e com a minha punição ele ainda ficou atrás". Também: "quando eu ainda estou atrás da linha, às vezes aparece uma volta a mais no HUD quando o primeiro já passou".

## O fim do GP (`corrida.js`)
- A chegada do último humano fechava o GP na hora (`estimarRobos` + `endRace`). Quem ainda estava na pista ganhava um tempo estimado, pela fração da volta que faltava e pelo tempo da última volta.
- No save dele, o Norris (a ~2 s na pista) ficou com o tempo 9 s atrás e "9 voltas" em Mônaco, assim como outros que ele não tinha ultrapassado.
- Agora quem está perto tem até `ESPERA_CHEGADA` (20 s) para cruzar a linha de verdade. A ordem final soma as punições de tempo, como antes (`F1.classificacaoFinal`). Só quem não cruzou até lá é estimado. Se todos cruzam antes, o GP fecha na hora.
- Não foi jogado.

## A volta no topo (`hud.js`)
- A torre mostrava a volta do líder, como na TV, e ela subia quando ele cruzava a linha antes de você.
- Agora, enquanto você corre, é a do seu carro. De quem só assiste, ou depois da sua chegada, continua a do líder (e "BANDEIRADA").
