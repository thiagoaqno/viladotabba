# Mônaco: o carro para de raspar na subida depois da Sainte-Dévote

O Thiago contou que, em Mônaco, o carro ainda raspava tudo na subida depois da primeira curva.

- **A causa (`carros.js` `poseKart`):** a pancada da suspensão (`bate`) vinha da derivada crua do caimento, sem suavizar. O relevo da subida tem degrauzinhos: cada um virava uma pancada, o carro afundava, a folga do assoalho zerava e saíam faíscas.
- **Agora:** a pancada vem da compressão, a mesma conta que já decidia as faíscas: o caimento de agora contra a média dos últimos 0,4 s. Numa rampa de inclinação constante, ela vai a zero.
- **O mínimo (`COMPRESSAO_MIN` = 0,012 rad):** abaixo dele, a mudança de caimento conta como relevo serrilhado e não como compressão. O som da pancada passa a sair só numa compressão forte de verdade.
- **O que não muda:** a raspada da zebra e a da asa alta demais para a altura escolhida no acerto.

**Não medido:** o 0,012 rad é um ponto de partida, para o Thiago conferir jogando em Mônaco. Se ainda raspar, ou se as compressões de verdade (como a do fim da reta) sumirem, é ele que se ajusta.
