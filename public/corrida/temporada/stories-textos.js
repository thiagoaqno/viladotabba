// Os textos dos stories (stories.js): para cada situação, títulos (`t`) e textos (`s`) que se combinam, então a mesma notícia sai de
// centenas de jeitos (`StoriesTextos.combinacoes()` conta). A escolha é fixa pela chave da notícia: o mesmo story não muda a cada
// redesenho, mas o próximo GP já sai diferente. Marcas: {gp} {pos} {pts} {vencedor} {lider} {segundo} {dif} {vant} {rival} {equipe}
// {etapa} {total} {previsao}.
(function (root) {
"use strict";
const T = {
  vitoria: {
    t: ["Vitória no {gp}!", "Você venceu o {gp}", "Ninguém segurou você no {gp}", "Bandeirada sua no {gp}", "O {gp} é seu", "Primeiro lugar no {gp}",
      "Que corrida! Vitória no {gp}", "Topo do pódio no {gp}", "O {gp} tem dono", "Champanhe no {gp}", "Show no {gp}: vitória", "Vencedor do {gp}"],
    s: ["Mais {pts} pontos na conta.", "A equipe inteira comemora no box.", "Os {pts} pontos entram direto no campeonato.", "Foi do começo ao fim.", "Os rivais só viram a sua asa traseira.",
      "O engenheiro ainda está gritando no rádio.", "A torcida não para de cantar o seu nome.", "{pts} pontos e muita moral para a próxima.", "Quem duvidava, agora assiste o replay.", "Uma das corridas da temporada."],
  },
  podio: {
    t: ["Pódio no {gp}", "{pos} no {gp}", "Você subiu ao pódio no {gp}", "Troféu na mão no {gp}", "{vencedor} vence, você no pódio", "Champanhe também para você",
      "Pódio garantido no {gp}", "{pos} lugar no {gp}", "Mais um troféu na estante", "No pódio do {gp}"],
    s: ["{vencedor} levou a vitória; você trouxe {pts} pontos.", "Faltou pouco para o topo.", "{pts} pontos que valem ouro no campeonato.", "A equipe sai do {gp} sorrindo.", "Na próxima, o degrau de cima.",
      "Corrida sólida, sem erros.", "O carro respondeu bem do começo ao fim.", "Resultado para ficar feliz.", "{vencedor} venceu, mas você esteve lá.", "Mais um passo na briga pelo título."],
  },
  pontos: {
    t: ["{pos} no {gp}", "Pontos no {gp}", "Você terminou em {pos} no {gp}", "{vencedor} vence o {gp}", "Corrida de pontos no {gp}", "Na zona de pontos no {gp}",
      "Saldo positivo no {gp}", "{pos} lugar e pontos no bolso", "Domingo de trabalho no {gp}", "{gp}: pontos garantidos"],
    s: ["Você somou {pts} {pontos_txt}.", "{vencedor} levou a vitória.", "Não foi o pódio, mas pontuou.", "Cada ponto conta no fim do ano.", "Dá para tirar mais do carro.",
      "{pts} {pontos_txt} que podem fazer falta lá na frente.", "Sem drama: pontos e segue o jogo.", "O ritmo existe; falta encaixar a corrida.", "A equipe já estuda os dados.", "Próxima corrida, mais para a frente."],
  },
  fora: {
    t: ["{vencedor} vence o {gp}", "Domingo difícil no {gp}", "{pos} no {gp}", "Sem pontos no {gp}", "O {gp} não foi seu dia", "Fora dos pontos no {gp}",
      "Corrida para esquecer no {gp}", "{gp}: faltou ritmo", "Dia duro no {gp}", "Nada de pontos no {gp}"],
    s: ["Você terminou em {pos}.", "{vencedor} levou a vitória; você ficou em {pos}.", "Hora de olhar o acerto do carro.", "A equipe promete reação.", "Ainda tem muita temporada pela frente.",
      "Um {pos} que dói.", "O próximo GP é a chance de virar a página.", "Nem tudo dá certo: segue o jogo.", "Os engenheiros já estão na garagem.", "Respira, ajusta e volta mais forte."],
  },
  abandono: {
    t: ["Abandono no {gp}", "Fim de corrida cedo no {gp}", "O {gp} acabou antes da hora", "DNF no {gp}", "Carro parado no {gp}", "Domingo amargo no {gp}",
      "{vencedor} vence, você abandona", "Sem bandeirada no {gp}", "Problema no {gp}", "O {gp} cobrou caro"],
    s: ["Você não terminou a corrida.", "{vencedor} levou a vitória.", "Zero pontos e muita coisa para rever.", "A equipe investiga o que aconteceu.", "Acontece até com os melhores.",
      "A próxima corrida é para descontar.", "O campeonato é longo.", "Respira: ainda dá tempo.", "O box já trabalha no carro.", "Volta mais forte no próximo GP."],
  },
  lider: {
    t: ["Você lidera o campeonato", "Líder do mundial", "No topo da tabela", "A liderança é sua", "Primeiro no campeonato", "Quem manda é você",
      "Você na frente de todos", "Ninguém tem mais pontos", "Líder com {pts} pontos", "O campeonato tem um líder: você"],
    s: ["{pts} pontos, {vant} à frente de {segundo}.", "{segundo} está a {vant} pontos.", "Agora é segurar.", "A vantagem é de {vant} pontos.", "Todo mundo está atrás de você.",
      "{segundo} vem caçando: {vant} pontos.", "Ritmo de campeão.", "Cada corrida é uma final daqui para a frente.", "A pressão agora é dos outros.", "{vant} pontos de folga sobre {segundo}."],
  },
  caca: {
    t: ["{lider} lidera o campeonato", "A caça ao líder", "{dif} pontos para o topo", "Você é o {pos}", "Na cola do líder", "A briga pelo título está aberta",
      "{lider} na frente, você logo atrás", "De olho no primeiro lugar", "Perto da liderança", "Só {dif} pontos"],
    s: ["Você é o {pos} com {pts} pontos, a {dif} do líder.", "{lider} está {dif} pontos à frente.", "Uma vitória muda tudo.", "Dá para virar.", "A liderança está ao alcance.",
      "{dif} pontos se tiram em uma corrida.", "{lider} já sente a pressão.", "Falta pouco.", "A próxima corrida pode mudar a tabela.", "A briga está só começando."],
  },
  longe: {
    t: ["{lider} lidera o campeonato", "Você é o {pos} no campeonato", "A tabela por enquanto", "{lider} dispara", "Campeonato: você em {pos}", "Hora de reagir",
      "Muita corrida pela frente", "O campeonato até aqui", "{dif} pontos para o líder", "A meta é subir na tabela"],
    s: ["Você tem {pts} pontos, a {dif} do líder.", "{lider} está {dif} pontos à frente.", "Ainda dá para subir algumas posições.", "Corrida a corrida.", "Foco nos pontos.",
      "Cada posição ganha vale dinheiro para a equipe.", "A temporada é longa.", "Pontuar sempre é o caminho.", "A equipe acredita na virada.", "Bora buscar."],
  },
  rival: {
    t: ["{rival} está logo à frente", "O alvo é {rival}", "De olho em {rival}", "{rival} na mira", "Duelo com {rival}", "O próximo da fila: {rival}",
      "{dif} pontos para passar {rival}", "{rival} que se cuide", "Caçando {rival}", "Rival à vista: {rival}"],
    s: ["{dif} {pontos_txt} separam vocês. {equipe}.", "Passar {rival} vale uma posição na tabela.", "{rival} corre pela {equipe}.", "Uma boa corrida e você passa.", "{dif} {pontos_txt}: dá para tirar já no próximo GP.",
      "{equipe} sabe que você está chegando.", "{rival} sente a pressão.", "A briga está boa.", "Ultrapassagem na pista e na tabela.", "Não deixa {rival} escapar."],
  },
  melhor: {
    t: ["{pos} no {gp}", "Seu melhor do ano: {pos}", "Lembra do {gp}?", "O melhor dia da temporada", "{gp}: o seu ponto alto", "Recorde pessoal do ano",
      "{pos} lugar no {gp}", "A corrida para mostrar a todos", "O dia em que tudo deu certo", "Melhor resultado: {gp}"],
    s: ["O seu melhor resultado da temporada {ano}.", "Dá para repetir.", "Aquele dia em que o carro voou.", "A referência da temporada.", "A equipe ainda fala dessa corrida.",
      "É esse o nível.", "Bora superar.", "Esse é o padrão.", "Um resultado para a estante.", "Quando encaixa, ninguém segura."],
  },
  proxima: {
    t: ["{gp}", "Próxima parada: {gp}", "Rumo ao {gp}", "Vem aí o {gp}", "Agenda: {gp}", "O {gp} é o próximo",
      "Preparando o {gp}", "Contagem para o {gp}", "Próximo desafio: {gp}", "{gp} na mira"],
    s: ["Etapa {etapa} de {total}{previsao}.", "Etapa {etapa} de {total}. Bora!{previsao}", "Mais uma chance de pontuar{previsao}.", "O carro já está a caminho{previsao}.", "Etapa {etapa} de {total}: hora de acelerar{previsao}.",
      "A equipe já estuda a pista{previsao}.", "Etapa {etapa}: tudo pronto{previsao}.", "Prepara o capacete{previsao}.", "Mais um GP, mais uma chance{previsao}.", "Faltam {faltam} etapas{previsao}."],
  },
};
// o mesmo número para a mesma chave (o story não muda a cada redesenho)
function hash(k) { let x = 2166136261; for (const c of String(k)) { x ^= c.charCodeAt(0); x = Math.imul(x, 16777619); } return x >>> 0; }
function preencher(txt, v) { return txt.replace(/\{(\w+)\}/g, (_, n) => (v[n] != null ? String(v[n]) : "")); }
function texto(situacao, chave, v) {
  const S = T[situacao]; if (!S) return { tit: "", sub: "" };
  const a = hash(chave + ":t"), b = hash(chave + ":s");
  return { tit: preencher(S.t[a % S.t.length], v), sub: preencher(S.s[b % S.s.length], v) };
}
const combinacoes = () => Object.values(T).reduce((n, S) => n + S.t.length * S.s.length, 0);
root.StoriesTextos = { texto, combinacoes, SITUACOES: Object.keys(T) };
})(window);
