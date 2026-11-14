// Os textos dos stories (stories.js): para cada situação, títulos (`t`) e textos (`s`) que se combinam, então a mesma notícia sai de
// centenas de jeitos (`StoriesTextos.combinacoes()` conta). A escolha é fixa pela chave da notícia: o mesmo story não muda a cada
// redesenho, mas o próximo GP já sai diferente. Marcas: {gp} {pos} {pts} {vencedor} {lider} {segundo} {dif} {vant} {rival} {equipe}
// {etapa} {total} {previsao}; e as dos stories novos: {piloto} {n} {de} {ate} {tempo} {volta} {t} {terminaram} {comp} {eu} {ele}.
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
  // ---------- os stories novos (2026-11-14) ----------
  destaque_ult: {
    t: ["{piloto}: {n} ultrapassagens no {gp}", "O rei das ultrapassagens", "{piloto} não parou de passar", "Show de ultrapassagens no {gp}", "{n} vezes {piloto}", "Ninguém passou mais que {piloto}",
      "{piloto} fez a festa no {gp}", "Ultrapassagem atrás de ultrapassagem", "O destaque do {gp}: {piloto}", "{piloto} veio voando"],
    s: ["Foram {n} ultrapassagens na pista no {gp}.", "{n} carros ficaram para trás.", "Cada volta, um carro a menos na frente.", "A torcida não tirou o olho.", "Ninguém conseguiu segurar.",
      "{n} ultrapassagens: o maior número da corrida.", "Uma aula de corrida.", "O replay está cheio de manobras dele.", "Briga roda a roda o tempo todo.", "Vale rever no replay."],
  },
  destaque_ganho: {
    t: ["{piloto} ganhou {n} posições", "A escalada de {piloto}", "De {de} a {ate} no {gp}", "{piloto} subiu {n} lugares", "A corrida de recuperação de {piloto}", "O destaque do {gp}: {piloto}",
      "{piloto} veio de trás", "+{n} para {piloto}", "Que remontada no {gp}", "{piloto} não desistiu"],
    s: ["Largou em {de} e terminou em {ate}.", "{n} posições ganhas da largada à bandeirada.", "Uma corrida inteira de ataque.", "Ninguém ganhou mais lugares.", "Paciência e ritmo: a receita.",
      "De {de} para {ate}: corrida para guardar.", "Estratégia e coragem.", "O pelotão inteiro viu passar.", "A equipe comemora a remontada.", "Vale rever no replay."],
  },
  voltarapida: {
    t: ["{piloto} faz a volta mais rápida", "Volta mais rápida: {piloto}", "{tempo}: a melhor volta do {gp}", "Ninguém foi mais rápido que {piloto}", "O relógio é de {piloto}", "Ritmo de classificação no {gp}",
      "{piloto} cravou {tempo}", "A volta do dia", "Volta voadora de {piloto}", "O cronômetro parou para {piloto}"],
    s: ["{tempo} na volta {volta}.", "A melhor volta do {gp}, na volta {volta}.", "Ritmo que ninguém acompanhou.", "Pneu novo e pé embaixo.", "Uma volta para guardar.",
      "{tempo}: a referência da corrida.", "A pista estava no ponto.", "O setor mais rápido saiu dessa volta.", "Na volta {volta}, tudo encaixou.", "Os engenheiros vão estudar essa volta."],
  },
  voltarapida_eu: {
    t: ["Sua a volta mais rápida!", "Volta mais rápida: você", "{tempo}: ninguém foi mais rápido", "O relógio é seu no {gp}", "Volta voadora", "Você cravou {tempo}",
      "A melhor volta do {gp} é sua", "Ritmo de pole no {gp}", "O cronômetro parou para você", "Recorde do dia: você"],
    s: ["{tempo} na volta {volta}.", "Ninguém andou mais rápido no {gp}.", "Se terminou no top 10, vale ponto extra.", "O carro estava no ponto.", "Uma volta para a estante.",
      "{tempo}: a referência da corrida.", "Pneu novo e coragem.", "Os rivais viram o tempo e engoliram seco.", "Na volta {volta}, tudo encaixou.", "O engenheiro gritou no rádio."],
  },
  pitrapido: {
    t: ["Box mais rápido: {equipe}", "{t} s no box", "Os mecânicos da {equipe} voaram", "Pit stop relâmpago no {gp}", "{equipe} faz o melhor pit stop", "Troca de pneus em {t} s",
      "A parada do dia", "Ninguém parou tão rápido", "Box perfeito da {equipe}", "Mecânicos em dia de glória"],
    s: ["{piloto} ficou {t} s no box, na volta {volta}.", "{t} s do começo ao fim da parada.", "Treino de box que deu resultado.", "Pneus trocados num piscar de olhos.", "A equipe inteira comemora.",
      "Volta {volta}: entrou e saiu num instante.", "O tempo no box conta posições.", "Os rivais perderam tempo no box; eles, não.", "{piloto} agradece no rádio.", "Uma parada de manual."],
  },
  abandonos: {
    t: ["{n} abandonos no {gp}", "Corrida de sobreviventes", "O {gp} cobrou caro", "Só {terminaram} terminaram o {gp}", "Caos no {gp}", "Domingo de quebras e batidas",
      "{n} carros fora no {gp}", "Corrida dura no {gp}", "Quem terminou, pontuou", "O {gp} não perdoou"],
    s: ["{n} carros não viram a bandeirada.", "Terminar já foi uma vitória.", "Pista difícil e muita disputa.", "Os mecânicos vão trabalhar a noite toda.", "Cuidar do carro valeu ouro.",
      "{terminaram} chegaram ao fim.", "Uma corrida para quem teve paciência.", "Muro, batida e quebra: teve de tudo.", "A direção de prova trabalhou muito.", "Vale rever os momentos."],
  },
  companheiro_frente: {
    t: ["Você {eu} × {ele} {comp}", "Na frente do companheiro", "O duelo da {equipe} é seu", "{comp} atrás de você", "Primeiro piloto da {equipe}?", "Vencendo o duelo interno",
      "{eu} a {ele} contra {comp}", "Quem manda na {equipe}", "O placar interno", "Você leva a melhor"],
    s: ["Você chegou na frente de {comp} {eu} vezes; ele, {ele}.", "{comp} precisa reagir.", "O placar da equipe: {eu} × {ele}.", "O chefe da equipe está de olho.", "Mantém a pressão.",
      "Na garagem, o assunto é você.", "{comp} quer virar esse jogo.", "Duelo saudável, mas é seu.", "Contra o mesmo carro, você está na frente.", "Bom sinal para a renovação."],
  },
  companheiro_atras: {
    t: ["{comp} {ele} × {eu} você", "Atrás do companheiro", "{comp} vence o duelo interno", "O placar da {equipe}", "Hora de virar o duelo", "{comp} na frente",
      "{ele} a {eu} para {comp}", "O desafio é dentro de casa", "Duelo na {equipe}", "Recado dado por {comp}"],
    s: ["{comp} chegou na sua frente {ele} vezes; você, {eu}.", "Mesmo carro, resultado diferente.", "Dá para virar.", "O chefe da equipe está de olho.", "Hora de estudar a telemetria do {comp}.",
      "O placar interno: {ele} × {eu}.", "Cada GP conta nesse duelo.", "Os dados do companheiro estão na Análise.", "Bora mostrar quem é o primeiro piloto.", "A temporada é longa."],
  },
  companheiro_empate: {
    t: ["Empate na {equipe}", "{eu} × {ele} com {comp}", "Duelo equilibrado", "Ninguém manda na {equipe}", "Tudo igual com {comp}", "O duelo interno está aberto",
      "Empate técnico", "Quem desempata?", "{comp} e você, lado a lado", "A briga da garagem"],
    s: ["Cada um chegou na frente {eu} vezes.", "O próximo GP desempata.", "Mesmo carro, mesmo ritmo.", "O chefe da equipe adora isso.", "Duelo pegado.",
      "Placar: {eu} × {ele}.", "Ninguém dá trégua.", "O detalhe vai decidir.", "Os dados dos dois estão na Análise.", "Que vença o melhor."],
  },
  sequencia_podio: {
    t: ["{n} pódios seguidos", "Sequência de pódios", "Fase iluminada", "Pódio virou rotina", "{n} troféus seguidos", "Ninguém tira você do pódio",
      "Mais um pódio: são {n}", "Em alta", "A estante está ficando cheia", "Momento de ouro"],
    s: ["São {n} GPs seguidos no pódio.", "A equipe vive o melhor momento.", "Constância de campeão.", "Quem segura?", "O carro e você, em sintonia.",
      "{n} pódios seguidos e contando.", "Os rivais já sabem quem vigiar.", "Pódio atrás de pódio.", "Champanhe toda semana.", "Bora esticar a sequência."],
  },
  sequencia_pontos: {
    t: ["{n} GPs seguidos nos pontos", "Sequência nos pontos", "Sempre pontuando", "Constância é o nome", "{n} corridas pontuando", "Pontos toda semana",
      "A regularidade paga", "Mais uma nos pontos", "Sem zerar", "Pontos atrás de pontos"],
    s: ["São {n} GPs seguidos na zona de pontos.", "Constância vale campeonato.", "Cada ponto conta.", "A equipe agradece a regularidade.", "Sem erro, sem zero.",
      "{n} corridas pontuando.", "O próximo passo é o pódio.", "A tabela agradece.", "Regularidade de veterano.", "Bora manter."],
  },
  construtores: {
    t: ["{equipe} em {pos} nos construtores", "A tabela dos construtores", "{equipe}: {pts} pontos", "{lider} lidera os construtores", "A briga das equipes", "{equipe} na tabela",
      "{dif} pontos para o topo", "Construtores: {equipe} em {pos}", "Pontos para a equipe", "O campeonato das fábricas"],
    s: ["A {equipe} tem {pts} pontos, a {dif} da {lider}.", "{lider} lidera os construtores.", "Cada ponto vale dinheiro para a equipe.", "Os dois carros somam juntos.", "A fábrica acompanha cada corrida.",
      "{pts} pontos até aqui.", "Subir na tabela é verba para o carro.", "A {equipe} quer mais.", "A briga das equipes é longa.", "Bora somar."],
  },
  construtores_lider: {
    t: ["{equipe} lidera os construtores", "A {equipe} no topo", "Líder entre as equipes", "{pts} pontos e a liderança", "A melhor equipe do grid", "{equipe} na frente",
      "Construtores: {equipe} em 1º", "Ninguém somou mais", "O topo das equipes", "A fábrica comemora"],
    s: ["{vant} pontos à frente da {segundo}.", "A {segundo} vem atrás, a {vant} pontos.", "Os dois carros puxando junto.", "A fábrica está em festa.", "Agora é defender.",
      "{pts} pontos até aqui.", "O título de construtores está ao alcance.", "A {segundo} quer a liderança.", "Trabalho de equipe.", "Bora segurar."],
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
