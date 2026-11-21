// Falas do engenheiro de equipe no rádio (português do Brasil). UMD: window.RadioFalas no navegador, require() no Node.
// Cada fala vira public/corrida/radio/<id>.mp3 (ferramentas/radio-engenheiro.js, com a voz da ElevenLabs). Sem o mp3, o
// rádio não toca nada. Sem nome de pista nas falas: o mesmo áudio serve para qualquer GP.
(function (root) {
// só o que um engenheiro diria NO MEIO da corrida (e no fim dela), em tom sério; várias variações por situação
const SITUACOES = {
  // o observador (spotter): outra voz (ferramentas/radio-engenheiro.js, ELEVENLABS_VOICE_SPOTTER), só o carro ao lado e a pista livre
  spotesq: ["Carro à esquerda.", "À esquerda.", "Esquerda, esquerda."],
  spotdir: ["Carro à direita.", "À direita.", "Direita, direita."],
  spotlivre: ["Livre.", "Pista livre.", "Passou. Livre."],
  largada: ["Luzes se apagando. Largada limpa.", "Atenção na primeira curva. Sem riscos.", "Boa largada. Agora encontre o ritmo.", "Cuidado com o tráfego na primeira volta.", "Largada feita. Proteja a posição."],
  voltarapida: ["Volta mais rápida da corrida. Bom ritmo.", "Melhor volta registrada. Mantenha assim.", "Esse é o ritmo que precisamos.", "Volta mais rápida. Continue consistente.", "Bom setor final. Volta mais rápida."],
  ganhou: ["Posição ganha. Mantenha o ritmo.", "Boa manobra. Agora consolide.", "Ganhamos a posição. Foco no próximo.", "Limpo. Abra uma margem agora.", "Boa. Próximo carro a um segundo."],
  perdeu: ["Perdemos a posição. Mantenha a calma.", "Ele passou. Fique próximo e aguarde.", "Sem problema. A corrida é longa.", "Perdemos uma posição. Proteja os pneus.", "Mantenha o ritmo. Vamos recuperar."],
  pneu: ["Os pneus estão no limite. Cuidado nas curvas.", "A aderência caiu. Estamos avaliando a parada.", "Degradação alta no traseiro. Administre.", "Pneus no fim. Evite travar as rodas.", "Temperatura dos pneus subindo. Alivie um pouco."],
  box: ["Box, box. Entre nesta volta.", "Box nesta volta. Box, box.", "Confirmado, box nesta volta.", "Prepare para entrar. Box, box.", "Entre nos boxes agora. Box, box."],
  safety: ["Safety car na pista. Reduza e mantenha o delta.", "Safety car acionado. Sem ultrapassagens.", "Safety car. Mantenha os pneus aquecidos.", "Neutralização. Siga o delta positivo.", "Safety car na pista. Estamos avaliando a parada."],
  amarela: ["Bandeira amarela no setor. Reduza.", "Amarela à frente. Sem ultrapassagens.", "Carro parado à frente. Cuidado.", "Amarela no próximo setor. Atenção.", "Incidente à frente. Reduza a velocidade."],
  dano: ["Detectamos dano no carro. Vamos monitorar.", "Temos um problema. Poupe o equipamento.", "Dano na asa. Ajuste as frenagens.", "Perda de rendimento. Estamos analisando.", "Problema confirmado. Leve o carro com cuidado."],
  ultima: ["Última volta. Traga o carro para casa.", "Última volta. Concentração até a bandeirada.", "Última volta. Sem riscos agora.", "Bandeira branca. Última volta.", "Última volta. Mantenha a posição."],
  vitoria: ["Vencemos a corrida. Excelente trabalho.", "Vitória. Trabalho muito bem feito.", "P1. Corrida impecável. Obrigado.", "Vitória confirmada. Grande trabalho da equipe."],
  podio: ["Pódio confirmado. Bom resultado.", "Terminamos no pódio. Bom trabalho.", "Pódio. Pontos importantes para a equipe.", "Bom trabalho. Pódio garantido."],
  pontos: ["Terminamos nos pontos. Resultado importante.", "Pontos garantidos. Seguimos evoluindo.", "Bons pontos hoje. Obrigado pelo esforço.", "Nos pontos. Vamos construir a partir daqui."],
  foradospontos: ["Fora dos pontos hoje. Vamos analisar os dados.", "Não foi o resultado esperado. Vamos trabalhar.", "Corrida difícil. Vamos entender o que faltou.", "Sem pontos hoje. Próxima corrida é outra história."],
  chuvachegando: ["Chuva chegando em uma volta. Prepare o pneu de chuva.", "O radar mostra chuva em uma volta. Considere o box.", "Chuva a caminho. Falta uma volta para ela chegar.", "Vai chover em uma volta. Fique atento ao box."],
  chuvaparando: ["A chuva está parando. A pista vai secar.", "A chuva diminui. A pista deve secar em breve.", "O radar está limpando. Pense nos pneus secos.", "Chuva parando. Avalie voltar para o pneu seco."],
  // (estas o rádio já pedia em radio.js, mas não tinham fala: ficavam mudas)
  boasvindas: ["Rádio funcionando. Estamos prontos quando você estiver.", "Bem-vindo de volta. O carro está pronto.", "Comunicação ok. Vamos fazer um bom fim de semana.", "Tudo certo por aqui. Escolha bem o pneu."],
  classboa: ["Boa classificação. Largamos lá na frente.", "Ótima volta. Posição forte para a corrida.", "Excelente. Grid muito bom para amanhã.", "Classificação limpa. Agora é transformar em pontos."],
  classruim: ["Classificação difícil. Vamos recuperar na corrida.", "Não foi a volta que queríamos. A corrida é longa.", "Largamos de trás. Paciência e estratégia.", "Tempo abaixo do esperado. Vamos atacar amanhã."],
  drs: ["DRS disponível. Use na reta.", "Você está a menos de um segundo. DRS liberado.", "Zona de DRS à frente. Ataque.", "DRS ativo. É a sua chance."],
  punicao: ["Recebemos uma punição. Se for stop-and-go, entre no box em até três voltas.", "A direção de prova nos puniu. Vamos compensar na pista.", "Punição confirmada. Evite novos contatos.", "Cuidado nas disputas. A décima segunda batida proposital é bandeira preta."],
  abandono: ["Precisamos abandonar. Leve o carro para os boxes.", "Fim de corrida para nós. Pare com segurança.", "Vamos recolher o carro. Desculpe.", "Abandono. Pare o carro em local seguro."],
  diagnosticobom: ["Diagnóstico concluído. O carro está sem danos relevantes.", "Tudo certo com o carro. Não vemos danos importantes."],
  diagnosticomedio: ["Detectamos dano no carro. O desempenho pode estar comprometido.", "Há dano no carro. Cuidado nas próximas disputas."],
  diagnosticograve: ["O carro está muito danificado. Reduza os riscos.", "Dano grave no carro. Precisamos evitar outro impacto."],
  pneusbons: ["Os pneus estão em boas condições. Continue assim.", "Os pneus ainda estão em boas condições."],
  pneusgastos: ["Os pneus estão desgastados. Avalie uma parada.", "A vida dos pneus está baixa. Fique atento à aderência."],
  corridachuva: ["A pista está molhada. Atenção à aderência.", "Temos água na pista. Cuidado com a tração."],
  corridaseca: ["A pista está seca no momento.", "Condições de pista seca por enquanto."],
  // antes de apagarem as luzes: a regra de 2026 do ERS na largada (o MGU-K só entrega depois de 50 km/h; sim.js e f1-regras.js)
  erslargada: ["Lembrete: o ERS só entra depois dos cinquenta por hora. A largada é no motor.", "Na largada o elétrico fica travado até cinquenta por hora. Cuidado com a patinada.", "ERS bloqueado até os cinquenta. Solte a embreagem com calma.", "Arrancada só no motor. O ERS libera a partir de cinquenta por hora."],
};
// Variações a mais: entram DEPOIS das de cada situação, para os números dos mp3 que já existem não mudarem.
const MAIS = {
  spotesq: ["Ele está na sua esquerda.", "Atenção, esquerda.", "Carro por dentro, à esquerda.", "Lado a lado, esquerda.", "Tem carro na esquerda.", "Cuidado na esquerda."],
  spotdir: ["Ele está na sua direita.", "Atenção, direita.", "Carro por dentro, à direita.", "Lado a lado, direita.", "Tem carro na direita.", "Cuidado na direita."],
  spotlivre: ["Tudo livre.", "Limpo.", "Livre dos dois lados.", "Ele ficou para trás. Livre.", "Pode voltar para a linha.", "Sem ninguém ao lado."],
  largada: ["Luzes apagadas. Vamos embora.", "Olho nos carros à frente. Sem pressa na primeira curva.", "Largada feita. Agora é ritmo.", "Cuidado com os lados na primeira freada.", "Pneus ainda frios. Freie com margem.", "Mantenha a linha limpa na primeira volta.", "Muito carro junto. Fique atento.", "Primeira volta é para sobreviver. Calma.", "Boa saída. Foco na primeira curva.", "Evite contato agora. A corrida é longa."],
  voltarapida: ["Roxo. Volta mais rápida.", "Excelente volta. A melhor até aqui.", "Você acabou de marcar a mais rápida.", "Tempo muito forte. Melhor da corrida.", "Volta perfeita. Repita isso.", "Ninguém andou nesse tempo ainda.", "O carro está vivo. Volta mais rápida.", "Grande volta. Cuide dos pneus agora.", "Melhor tempo da pista. Muito bom."],
  ganhou: ["Boa ultrapassagem. Limpa.", "Mais uma posição. Continue.", "Foi bonito. Agora abra distância.", "Passou. Olhe para o próximo.", "Excelente manobra. Siga firme.", "Posição nossa. Mantenha a cabeça.", "Boa freada. Ganhamos uma.", "Isso. Agora proteja a linha.", "Subimos uma posição. Bom trabalho.", "Grande movimento. Sem relaxar."],
  perdeu: ["Ele passou. Fique no vácuo dele.", "Tudo bem. Ainda dá para devolver.", "Perdemos uma. Respire e reorganize.", "Não brigue agora. Espere a chance.", "Fique perto. Ele vai gastar os pneus.", "Sem desespero. O ritmo é bom.", "Perdemos a posição. Foco na próxima freada.", "Deixa ir. Vamos atacar mais à frente.", "Calma. Nada está perdido.", "Mantenha a pressão. A chance vem."],
  pneu: ["Pouca aderência agora. Cuide da tração.", "O pneu está caindo. Freie mais cedo.", "Os pneus estão pedindo ajuda.", "Cuidado na saída das curvas. A traseira está solta.", "Estamos perdendo tempo com os pneus.", "Pneu no limite. Sem travar a frente.", "A borracha está acabando. Administre.", "O desgaste passou do esperado.", "Alivie nas curvas rápidas. Pneus sofrendo.", "Estamos no fim da vida desse pneu."],
  box: ["Box agora. Box agora.", "Esta volta é box. Confirme.", "Venha para os boxes nesta volta.", "A equipe está pronta. Box, box.", "Box, box, box. Esta volta.", "Hora de parar. Entre nos boxes.", "É agora. Box nesta volta.", "Janela aberta. Box, box."],
  safety: ["Safety car. Sem ultrapassar.", "Safety car na pista. Respeite o delta.", "Corrida neutralizada. Reduza agora.", "Safety car. Cuidado ao alcançar o pelotão.", "Vai embolar tudo. Safety car na pista.", "Safety car. Aqueça os freios e os pneus.", "Neutralizada. Mantenha a concentração.", "Safety car. Janela de box aberta, estamos olhando.", "Atenção ao delta. Safety car."],
  amarela: ["Amarela. Tire o pé.", "Bandeira amarela. Nada de ultrapassar.", "Setor em amarela. Reduza agora.", "Cuidado. Carro na pista à frente.", "Amarela no setor. Olhos abertos.", "Tem detritos à frente. Vá com cuidado.", "Amarela. Sem riscos aqui.", "Incidente no próximo trecho. Atenção."],
  dano: ["Vimos o toque. Estamos checando o carro.", "O carro sentiu a batida. Vá com calma.", "Telemetria mostra dano. Cuide do carro.", "Perdemos desempenho na batida.", "Ainda dá para seguir. Evite as zebras.", "Tem dano, mas o carro continua. Siga.", "Estamos olhando os dados. Sem riscos agora.", "O carro está diferente depois do toque. Adapte.", "Dano leve, mas custa tempo. Continue."],
  ultima: ["Última volta. É agora.", "Última volta. Tudo o que tiver.", "Falta só uma. Sem erros.", "Última volta. Olho no retrovisor.", "Última volta. Vamos para casa.", "Só mais uma volta. Foco total.", "Última volta. Cuidado com as zebras.", "Falta pouco. Última volta.", "Última volta. Termine o trabalho."],
  vitoria: ["Vencemos! Que corrida.", "É nossa! Vitória!", "Primeiro lugar. Obrigado pelo trabalho.", "Vitória! A equipe inteira está em festa.", "Você venceu. Corrida fantástica.", "P1! Grande domingo para nós.", "Isso é vitória. Muito bem.", "Que pilotagem. Vencemos essa.", "Ninguém segurou. Vitória nossa."],
  podio: ["No pódio. Muito bem.", "Pódio merecido. Grande corrida.", "Top três. Ótimo trabalho.", "Pódio para a equipe. Obrigado.", "Subimos no pódio. Dia bom.", "Boa corrida. Vá comemorar no pódio.", "Pódio. O carro e você foram muito bem.", "Terminamos entre os três. Excelente."],
  pontos: ["Pontos para a equipe. Boa corrida.", "Terminamos nos pontos. Bom trabalho.", "Pontuamos. Isso conta no fim do ano.", "Corrida sólida. Pontos na conta.", "Bom trabalho. Saímos com pontos.", "Pontos importantes hoje.", "Resultado útil. Levamos pontos.", "Missão cumprida. Pontuamos."],
  foradospontos: ["Ficamos fora dos pontos. Vamos revisar tudo.", "Hoje não deu. Cabeça na próxima.", "Faltou pouco. Vamos melhorar.", "Corrida complicada. Obrigado pelo esforço.", "Não pontuamos. Vamos olhar os dados juntos.", "Dia difícil. Voltamos mais fortes.", "Sem pontos hoje. Seguimos trabalhando.", "Não foi o nosso dia."],
  chuvachegando: ["Falta uma volta para a chuva.", "Em uma volta começa a chover. Decida o pneu.", "Chuva em uma volta. Cuidado na freada.", "Nuvem chegando. Uma volta para a chuva.", "O radar confirma: chuva na próxima volta.", "Prepare-se. Chove em uma volta.", "Uma volta até a água. Fique pronto para o box."],
  chuvaparando: ["A chuva está acabando.", "Parou de chover. Traçado vai aparecer.", "A pista começa a secar.", "O traçado está secando. Olho no tempo de volta.", "Chuva indo embora. Pense no pneu seco.", "Quase sem chuva agora.", "O radar está limpo. Vamos avaliar o box."],
  boasvindas: ["Rádio ok. Bom te ouvir.", "Aqui é o seu engenheiro. Tudo pronto.", "Boa tarde. O carro está no ponto.", "Estamos conectados. Vamos trabalhar.", "Tudo verificado por aqui.", "Equipe pronta. Quando quiser.", "Bem-vindo à garagem. Vamos andar.", "Sistemas ok. Bom fim de semana para nós."],
  classboa: ["Grande volta. Largada forte.", "Classificação muito boa. Parabéns.", "Lugar excelente no grid.", "Volta limpa. Estamos bem colocados.", "Ótimo trabalho. Temos posição.", "Grid muito bom. A corrida começa bem.", "Saímos na frente de muita gente. Boa.", "Classificação de respeito."],
  classruim: ["Longe do que queríamos. Vamos virar a chave.", "Grid difícil. A corrida é outra coisa.", "Faltou volta hoje. Amanhã tem mais.", "Largamos atrás, mas temos estratégia.", "Vamos ter que ultrapassar. Sem pânico.", "Não encaixou a volta. Vamos para a corrida.", "Posição ruim. Tudo pode mudar na largada.", "Não foi o que esperávamos. Cabeça erguida."],
  drs: ["DRS aberto. Vai.", "DRS liberado. Use agora.", "Você tem DRS na reta.", "Menos de um segundo. Abra o DRS.", "Reta à frente. DRS disponível.", "Use o DRS e ataque na freada.", "DRS pronto. Ele está ao seu alcance.", "Aproveite o DRS nesta reta."],
  punicao: ["Punição confirmada. Mantenha a calma.", "Tomamos uma punição. Foco no ritmo.", "A direção de prova puniu aquele toque.", "Punição na conta. Vamos descontar na pista.", "Cuidado agora. Mais um toque custa caro.", "Recebemos tempo de punição. Ande forte.", "A direção anotou. Evite o contato.", "Punição aplicada. Siga em frente."],
  abandono: ["Acabou para nós. Leve o carro para os boxes.", "Vamos parar. Obrigado pelo esforço.", "Não dá para continuar. Recolha o carro.", "Fim da linha hoje. Pare em segurança.", "Infelizmente, abandono. Desligue o carro.", "Carro sem condições. Vamos encerrar.", "Sentimos muito. Corrida encerrada."],
  diagnosticobom: ["Carro em ordem. Pode forçar.", "Checagem feita. Nada de grave.", "Sem danos. Siga no ataque.", "Dados limpos. O carro está bem.", "Tudo normal na telemetria.", "Carro inteiro. Continue."],
  diagnosticomedio: ["Temos dano. Ainda dá para seguir.", "O carro está ferido. Vá com calma.", "Perdemos rendimento com o dano.", "Dano moderado. Evite as zebras.", "Tem dano, mas não é o fim.", "Cuidado. O carro já sentiu."],
  diagnosticograve: ["Dano sério. Mais uma batida e acabou.", "O carro está no limite. Sem contato.", "Dano muito alto. Traga o carro com cuidado.", "Estado crítico. Evite qualquer toque.", "O carro não aguenta outro impacto.", "Situação grave. Vá com muito cuidado."],
  pneusbons: ["Pneus ótimos. Pode atacar.", "Ainda temos muito pneu.", "Desgaste dentro do plano.", "A borracha está aguentando bem.", "Pneus em dia. Mantenha o ritmo.", "Vida de pneu boa. Sem preocupação."],
  pneusgastos: ["Pneus bem gastos. Vamos pensar em parar.", "Pouca borracha sobrando.", "O desgaste está alto. Cuide do pneu.", "Esse jogo está acabando. Avalie o box.", "Pneus no fim. Cuidado nas freadas.", "A aderência vai cair em breve."],
  corridachuva: ["Pista molhada. Freie mais cedo.", "Muita água. Suave no acelerador.", "Está escorregando. Cuidado na tração.", "Asfalto molhado. Evite as faixas pintadas.", "Pista úmida. Vá com margem.", "Chuva na pista. Sem movimentos bruscos."],
  corridaseca: ["Pista seca. Pode confiar na aderência.", "Asfalto seco por enquanto.", "Sem água. Condição boa.", "Pista seca. Ande forte.", "O radar não mostra chuva agora.", "Condição seca. Siga o plano."],
};
for (const [q, textos] of Object.entries(MAIS)) { if (!SITUACOES[q]) throw new Error("situação desconhecida: " + q); SITUACOES[q].push(...textos); }
// As falas de cada TEMPORADA (f1-temporadas.js): "<situação>-<ano>". O rádio (radio.js `escolher`) junta as do ano em uso às de sempre;
// em SO_DO_ANO, nos anos que têm fala própria, só valem as do ano (o aviso do ERS na largada é regra de 2026: antes dela a largada é livre).
const POR_ANO = {
  "boasvindas-2023": ["Temporada dois mil e vinte e três. O efeito solo está no auge.", "Regulamento estável e carro rápido. Vamos buscar pontos grandes.", "Este ano tem um carro dominando o grid. Vamos ver o quanto chegamos perto."],
  "boasvindas-2024": ["Temporada dois mil e vinte e quatro. O grid está mais apertado do que nunca.", "Este ano muita gente vence corrida. Cada décimo conta.", "Carros muito próximos este ano. A classificação vai decidir muito."],
  "boasvindas-2025": ["Temporada dois mil e vinte e cinco. Último ano deste regulamento.", "Último ano do efeito solo. Vamos fechar bem.", "Ano de briga pelo título até o fim. Cada ponto pesa."],
  "erslargada-2023": ["Largada com potência total. Cuidado com a patinada.", "O elétrico está liberado desde a largada. Dose o acelerador."],
  "erslargada-2024": ["Largada com potência total. Cuidado com a patinada.", "Embreagem no ponto e potência cheia na largada."],
  "erslargada-2025": ["Largada com potência total. Cuidado com a patinada.", "Último ano com o elétrico cheio na largada. Aproveite a tração."],
  "voltarapida-2023": ["Volta mais rápida. Terminando entre os dez, vale um ponto extra.", "Melhor volta. Segure ela até o fim para o ponto extra."],
  "voltarapida-2024": ["Volta mais rápida. Terminando entre os dez, vale um ponto extra.", "Melhor volta. Segure ela até o fim para o ponto extra."],
  "vitoria-2023": ["Mais uma vitória. Que temporada estamos fazendo.", "Vitória. Num ano de domínio, essa tem gosto especial."],
  "vitoria-2024": ["Vitória! Num ano em que todo mundo vence, essa vale ouro.", "P1. Com o grid tão apertado, isso é enorme."],
  "vitoria-2025": ["Vitória! No ano da briga pelo título, isso pesa muito.", "P1. Pontos enormes na disputa do campeonato."],
  "drs-2025": ["DRS aberto. É o último ano dele, aproveite.", "Menos de um segundo. Asa aberta na reta."],
};
for (const [q, textos] of Object.entries(POR_ANO)) SITUACOES[q] = textos;
const SO_DO_ANO = ["erslargada"];
// (2026-11-13) O box sugerido com o nome do pneu (mfd.js: "box" + composto) e o balanço do engenheiro na penúltima volta (hud.js
// `balancoDaCorrida`: acima, na meta ou abaixo do esperado). Situações novas: os mp3 saem do gerar-radio.bat, que só gera o que falta.
const NOVAS = {
  boxmacio: ["Box, box. Vamos de pneu macio.", "Box nesta volta. Pneu macio pronto.", "Entre nos boxes. Colocamos o macio."],
  boxmedio: ["Box, box. Vamos de pneu médio.", "Box nesta volta. Pneu médio pronto.", "Entre nos boxes. Colocamos o médio."],
  boxduro: ["Box, box. Vamos de pneu duro.", "Box nesta volta. Pneu duro pronto.", "Entre nos boxes. Colocamos o duro."],
  boxintermediario: ["Box, box. Vamos de intermediário.", "Box nesta volta. Intermediário pronto.", "Entre nos boxes. Colocamos o intermediário."],
  boxchuva: ["Box, box. Vamos de pneu de chuva.", "Box nesta volta. Pneu de chuva pronto.", "Entre nos boxes. Colocamos o pneu de chuva."],
  // (2026-11-16, o Thiago: "falas na metade da corrida de acordo com as nossas decisões") na metade da prova, pelo Paddock da carreira (hud.js, meioDaCorrida)
  meioultimatook: ["Metade da corrida. Estamos dentro do que a diretoria pediu. Segure isso.", "Meio da prova. Por enquanto o ultimato está cumprido. Sem erros.", "Metade feita. A diretoria está olhando, e o resultado está aí. Mantenha."],
  meioultimatoruim: ["Metade da corrida. Ainda estamos fora do alvo da diretoria. Precisamos de posições.", "Meio da prova. O ultimato não está cumprido. É agora ou nunca.", "Metade feita. A diretoria quer mais. Ataque com cabeça."],
  meiopromessaok: ["Metade da corrida. A promessa ao patrocinador está de pé. Continue assim.", "Meio da prova. Estamos na meta que prometemos à marca.", "Metade feita. O patrocinador está satisfeito com o que vê."],
  meiopromessaruim: ["Metade da corrida. Prometemos a meta ao patrocinador e ainda não estamos lá.", "Meio da prova. A promessa à marca está em risco. Precisamos subir.", "Metade feita. O patrocinador cobra a meta. Vamos buscar."],
  meiocompanheirotenso: ["O clima com o seu companheiro está pesado. Não espere ajuda dele hoje.", "Atenção ao seu companheiro. Ele está irritado com a equipe e não vai facilitar.", "Seu companheiro não está feliz. Cuidado se ele vier por dentro."],
  meiocompanheirofiel: ["Seu companheiro está correndo para a equipe. Se ele estiver na frente, abre caminho.", "Boa notícia: seu companheiro joga junto hoje. Use isso.", "O seu companheiro confia em você. Ele não vai atrapalhar a sua corrida."],
  meioataque: ["Metade da prova. A ordem continua a mesma: atacar.", "Meio da corrida. Como combinamos, busque as ultrapassagens.", "Metade feita. O plano é agressivo. Vá para cima."],
  meiolimpa: ["Metade da prova. Plano mantido: corrida limpa, carro inteiro.", "Meio da corrida. Sem riscos desnecessários, como combinamos.", "Metade feita. Leve o carro até o fim, esse é o plano."],
  meiotorcida: ["A torcida está em peso hoje. Dê um show para eles.", "Metade da corrida. As arquibancadas estão com você.", "Meio da prova. A torcida está vibrando a cada volta."],
  meiopatrocinio: ["Metade da corrida. O patrocinador está acompanhando de perto.", "Meio da prova. A marca está muito animada com a nossa corrida.", "Metade feita. Bom momento para aparecer para o patrocinador."],
  penultimaboa: ["Penúltima volta. A equipe está muito feliz com essa corrida.", "Faltam duas. Corrida excelente, a garagem inteira está vibrando.", "Penúltima volta. Resultado acima do que esperávamos. Traga para casa.", "Duas voltas. Trabalho fantástico hoje, estamos muito satisfeitos."],
  penultimaok: ["Penúltima volta. Estamos dentro do objetivo. Mantenha.", "Faltam duas. Resultado sólido, a equipe está satisfeita.", "Penúltima volta. Corrida consistente. Sem riscos agora.", "Duas voltas. É o resultado que viemos buscar."],
  penultimaruim: ["Penúltima volta. Não é o que queríamos, mas tudo vale até a bandeirada.", "Faltam duas. Corrida difícil hoje. Vamos buscar o que der.", "Penúltima volta. Abaixo do esperado. Ataque se tiver chance.", "Duas voltas. Vamos aprender com essa. Dê tudo até o fim."],
};
// (2026-11-13) o Jeff, o engenheiro que ouve os comandos de voz (voz.js): quando não entende
NOVAS.jeffnaoentendi = ["Não entendi. Pode repetir?", "Rádio cortado. Repete?", "Não peguei essa. De novo?", "Chiado no rádio. Fala de novo?", "Não ficou claro. Repete devagar?", "Perdi o começo. Pode falar de novo?"];
// mais jeitos do Jeff confirmar o box com o pneu (entram depois dos três primeiros: os números dos mp3 que já existem não mudam)
NOVAS.boxmacio.push("Copiado. Macio na próxima parada. Box nesta volta.", "Pode vir. Os macios estão prontos.", "Box, box. Jogo de macios esperando.");
NOVAS.boxmedio.push("Copiado. Médio na próxima parada. Box nesta volta.", "Pode vir. Os médios estão prontos.", "Box, box. Jogo de médios esperando.");
NOVAS.boxduro.push("Copiado. Duro na próxima parada. Box nesta volta.", "Pode vir. Os duros estão prontos.", "Box, box. Jogo de duros esperando.");
NOVAS.boxintermediario.push("Copiado. Intermediário na próxima parada. Box nesta volta.", "Pode vir. Os intermediários estão prontos.", "Box, box. Intermediários esperando.");
NOVAS.boxchuva.push("Copiado. Pneu de chuva na próxima parada. Box nesta volta.", "Pode vir. Os de chuva estão prontos.", "Box, box. Pneus de chuva esperando.");
for (const [q, textos] of Object.entries(NOVAS)) SITUACOES[q] = textos;
// (2026-11-16, o Thiago: "eu quero muito mais áudios com variantes") Mais frases para as situações que já existem (entram no FIM de cada lista,
// então os mp3 de antes continuam com o mesmo número) e as situações novas da carreira: o companheiro na pista, a escolha de risco antes da
// largada, o box pelos mecânicos e a memória do que foi dito no Paddock. O GERAR-VOZES-CORRIDA.bat (opção 2, "só as que faltam") gera só estas.
const MAIS_2026_11_16 = {
  largada: ["Luzes apagadas. Vamos lá.", "Largada boa. Respire e encontre o ritmo.", "Primeira volta é para sobreviver. Calma.", "Boa reação. Agora segure a posição.", "Largamos. Atenção aos carros dos lados.", "Saímos bem. Cuidado com os pneus frios.", "Tudo limpo na largada. Vamos construir a corrida."],
  voltarapida: ["Volta mais rápida. O carro está voando.", "Roxo no cronômetro. Excelente volta.", "Essa foi a mais rápida da pista até agora.", "Volta rápida. É isso, continue assim.", "Tempo impressionante. Volta mais rápida para nós.", "Belíssima volta. Ninguém foi tão rápido hoje."],
  ganhou: ["Ultrapassagem feita. Muito bem.", "Boa! Mais uma posição.", "Passou limpo. Agora abra distância.", "Ganhou a posição. O próximo está ao alcance.", "Manobra perfeita. Siga atacando.", "Posição ganha. O ritmo está bom.", "Boa leitura. Ganhamos mais uma."],
  perdeu: ["Ele passou. Responda na próxima reta.", "Perdemos a posição. Fique no vácuo dele.", "Não lute demais agora. Proteja o carro.", "Posição perdida. Ainda tem corrida pela frente.", "Ele estava mais rápido nessa. Vamos devolver.", "Calma. Ele vai gastar os pneus primeiro.", "Perdemos uma. Mantenha a cabeça fria."],
  pneu: ["Os pneus estão acabando. Cuidado na frenagem.", "Aderência caindo rápido. Pense no box.", "Os traseiros estão sofrendo. Seja gentil na tração.", "Os pneus pedem socorro. Fique atento.", "O desgaste está alto. Vamos ter que parar em breve.", "Cuidado. Os pneus estão no fim da vida."],
  box: ["Box, box. Agora.", "Box nesta volta, confirmado.", "Venha para os boxes. Estamos prontos.", "Box, box. Garagem preparada.", "Esta volta. Box, box, box."],
  safety: ["Safety car. Tire o pé e siga o delta.", "Safety car na pista. Mantenha a temperatura dos pneus.", "Neutralizada. Ninguém ultrapassa agora.", "Safety car. Vamos pensar na estratégia.", "Safety car acionado. Fique atrás e espere a relargada."],
  amarela: ["Amarela. Tire o pé.", "Bandeira amarela. Nada de ultrapassagem.", "Cuidado, amarela no setor.", "Incidente à frente. Reduza e fique atento.", "Amarela agora. Paciência."],
  dano: ["O carro está danificado. Leve com cuidado.", "Temos dano. Vamos ver se dá para continuar.", "Dano confirmado. Evite as zebras.", "O carro perdeu rendimento com a batida.", "Estrago no carro. Pilote com cuidado."],
  ultima: ["Última volta. Sem erros agora.", "Última. Traga para casa.", "Bandeira branca. Última volta, vamos.", "Última volta. Tudo o que temos.", "Uma volta. Concentração total."],
  vitoria: ["Vitória! Que corrida!", "Ganhamos! A equipe inteira está pulando aqui.", "P1! Você foi perfeito hoje.", "Vencemos! Que trabalho incrível.", "Vitória! Leva a bandeira para casa."],
  podio: ["Pódio! Belo trabalho hoje.", "No pódio! A equipe está orgulhosa.", "Pódio garantido. Que corrida.", "Terminamos no pódio. Muito bem.", "Pódio! Pontos de ouro para a equipe."],
  pontos: ["Pontos na conta. Bom trabalho.", "Somamos pontos. Isso conta no fim do ano.", "Nos pontos. Foi uma corrida sólida.", "Pontuamos. Seguimos crescendo.", "Bons pontos. A equipe agradece."],
  foradospontos: ["Ficamos fora dos pontos. Vamos melhorar.", "Não pontuamos hoje. Vamos estudar os dados.", "Dia difícil. Cabeça erguida para a próxima.", "Sem pontos. Vamos entender onde perdemos tempo.", "Hoje não deu. A próxima é nossa."],
  chuvachegando: ["Chuva a uma volta. Fique pronto para o box.", "A chuva está chegando. Pense no pneu certo.", "Nuvens carregadas. Chuva na próxima volta.", "Chuva vindo aí. Cuidado com a aderência."],
  chuvaparando: ["A chuva parou. A pista vai secar.", "Pista secando. Prepare-se para o pneu seco.", "Sem chuva agora. A linha seca vai aparecer.", "Chuva acabando. Fique de olho no box."],
  boasvindas: ["Rádio ok. Bom fim de semana para nós.", "Ouvindo bem. O carro está pronto.", "Tudo pronto aqui. Vamos com tudo.", "Rádio funcionando. Boa sorte hoje."],
  classboa: ["Grande volta. Largamos bem posicionados.", "Classificação muito boa. Orgulho da equipe.", "Excelente. Agora é transformar em pontos.", "Boa posição de largada. Bom trabalho."],
  classruim: ["Não foi a classificação que queríamos. A corrida é amanhã.", "Largada de trás. Vamos de estratégia.", "Classificação difícil. Muita coisa pode acontecer.", "Grid ruim, mas a corrida é longa."],
  drs: ["DRS aberto. Ataque.", "Asa móvel liberada. Vá para cima.", "DRS disponível. Aproveite a reta.", "Pode abrir o DRS."],
  punicao: ["Recebemos uma punição. Mantenha a calma.", "Punição confirmada. Vamos recuperar na pista.", "Os comissários nos puniram. Siga pilotando.", "Temos uma punição. Foco no ritmo."],
  abandono: ["Temos que parar o carro. Sinto muito.", "Fim de corrida para nós. Traga o carro para os boxes.", "Abandono. Não foi culpa sua.", "Vamos ter que abandonar. Desculpe."],
  penultimaboa: ["Penúltima volta. Que corrida, continue assim.", "Faltam duas. A equipe inteira está de pé.", "Duas voltas. Resultado excelente, traga para casa."],
  penultimaok: ["Penúltima volta. Dentro do plano. Sem riscos.", "Faltam duas. Corrida correta. Mantenha.", "Duas voltas. Estamos onde queríamos."],
  penultimaruim: ["Penúltima volta. Ainda dá para ganhar alguma coisa.", "Faltam duas. Não desista, qualquer posição conta.", "Duas voltas. Ataque se aparecer chance."],
  meioultimatook: ["Metade da corrida. O alvo da diretoria está garantido por enquanto.", "Meio da prova. Do jeito que está, o ultimato está cumprido.", "Metade feita. Continue assim e a diretoria fica satisfeita."],
  meioultimatoruim: ["Metade da corrida. A diretoria está esperando mais. Vamos atacar.", "Meio da prova. Estamos abaixo do alvo do ultimato.", "Metade feita. Precisamos de posições para salvar o contrato."],
  meiopromessaok: ["Metade da corrida. A marca vai ficar feliz com isso.", "Meio da prova. Cumprindo o que prometemos.", "Metade feita. Patrocinador sorrindo, continue."],
  meiopromessaruim: ["Metade da corrida. A promessa à marca está escapando.", "Meio da prova. O patrocinador quer a meta. Vamos subir.", "Metade feita. Ainda dá tempo de cumprir a promessa."],
  meiocompanheirotenso: ["O seu companheiro está nervoso hoje. Cuidado com ele.", "O clima na garagem não está bom. Ele vai correr para ele mesmo.", "Atenção: o seu companheiro não vai abrir espaço."],
  meiocompanheirofiel: ["O seu companheiro está do seu lado hoje.", "Ele sabe que você está mais rápido. Vai ajudar.", "Bom clima na garagem. Ele corre pela equipe."],
  meioataque: ["Metade da prova. Mantenha o ataque.", "Meio da corrida. Ataque, como combinamos.", "Metade feita. Pressão nos carros da frente."],
  meiolimpa: ["Metade da prova. Corrida limpa, como combinamos.", "Meio da corrida. Cuide do carro e dos pneus.", "Metade feita. Sem riscos, carro inteiro no fim."],
  meiotorcida: ["As arquibancadas estão gritando seu nome.", "A torcida está enorme hoje. Dê um show.", "Metade da corrida. O público está com você."],
  meiopatrocinio: ["O patrocinador está de olho. Boa hora para brilhar.", "A marca está acompanhando cada volta.", "Metade da corrida. O patrocinador adora o que vê."],
};
const NOVAS_CARREIRA = {
  // o companheiro na pista (corrida-robos.js, a ordem de equipe pela relação: paddock.js)
  compabre: ["O seu companheiro vai te deixar passar nesta volta.", "Pedimos para ele abrir. Ele vai dar passagem.", "Ele sabe que você está mais rápido. Vai abrir na próxima reta.", "Ordem de equipe: ele te deixa passar.", "O seu companheiro vai facilitar. Pode vir."],
  compsegura: ["O seu companheiro está segurando quem vem atrás de você.", "Ele está fazendo o trabalho de equipe. Segurando o carro de trás.", "Bom trabalho dele. Está protegendo a sua posição.", "O seu companheiro está tampando o carro de trás para você."],
  compbriga: ["Pedimos para ele abrir, mas ele recusou.", "O seu companheiro não vai obedecer. Você vai ter que passar na pista.", "Ele ignorou a ordem de equipe. Cuidado com ele.", "Sem ajuda do seu companheiro hoje. Ele vai brigar.", "O clima está ruim. Ele não vai te deixar passar."],
  // a escolha de risco antes da largada (Central: arriscar ou jogar seguro)
  riscoarriscar: ["Plano agressivo confirmado. Vamos com tudo hoje.", "Hoje é para arriscar. Os pneus vão sofrer, mas vamos atacar.", "Modo ataque. Mais ritmo, mais desgaste. Você escolheu, vamos.", "Corrida de risco. Cada posição importa hoje."],
  riscoseguro: ["Plano conservador. Vamos levar o carro até o fim.", "Hoje é jogar seguro. Pneus e carro inteiros.", "Sem riscos. Ritmo constante e pontos no fim.", "Corrida controlada. Paciência é a nossa arma hoje."],
  // o box pelos mecânicos (o aumento ou a saída do chefe dos mecânicos)
  boxrapido: ["Parada muito rápida! Ótimo trabalho dos mecânicos.", "Que pit stop! Os mecânicos foram perfeitos.", "Parada excelente. Ganhamos tempo no box.", "Parada relâmpago. A equipe voou."],
  boxlento: ["Parada lenta. Perdemos tempo no box.", "Problema na parada. Desculpe, perdemos segundos.", "Pit stop ruim. Os mecânicos vão rever isso.", "Demoramos no box. Vamos recuperar na pista."],
  // a memória do Paddock (o que você disse antes volta na corrida)
  memcarro: ["Você disse que o problema era o carro. Hoje ele está te deixando na mão mesmo.", "Lembra quando você culpou o carro? Pois é, ele está sofrendo hoje.", "O carro está mostrando os problemas que você apontou."],
  memequipe: ["Você defendeu a equipe na imprensa. A garagem está dando tudo hoje.", "A equipe não esqueceu que você nos defendeu. Estamos com você.", "Depois do que você disse por nós, a garagem está motivada."],
  memfoco: ["Você disse que o foco é você. Então é com você agora.", "A equipe apostou em você, como você pediu. Mostre resultado.", "O foco da equipe é você hoje. Responda na pista."],
};
for (const [q, textos] of Object.entries(MAIS_2026_11_16)) if (SITUACOES[q]) SITUACOES[q].push(...textos);
// (2026-11-16, a rivalidade) o rival da temporada na pista (corrida-robos.js rivalNaPista, corrida.js anotarRixa, hud.js na largada)
Object.assign(SITUACOES, {
  rivalfrente: ["O seu rival está logo à frente. É ele que temos que pegar.", "Olha quem está na sua frente: o rival do campeonato.", "Rival à frente, menos de um segundo. Vá buscar.", "É o nosso rival ali na frente. Pressione.", "O rival está ao alcance. Essa disputa vale muito."],
  rivalatras: ["O seu rival está colado atrás. Defenda.", "Atenção, o rival está no seu retrovisor.", "Ele está vindo. O rival está logo atrás de você.", "Proteja a posição. É o rival do campeonato atrás.", "O rival está pressionando. Sem erros agora."],
  rivalpassou: ["Passou o rival! Isso vale muito no campeonato.", "Grande manobra! O rival ficou para trás.", "Na frente do rival agora. Abra distância.", "É isso! Passamos o nosso rival.", "Rival superado. Agora segure ele."],
  rivalperdeu: ["O rival passou. Fique no vácuo e responda.", "Ele passou. Não deixe o rival fugir.", "Perdemos a posição para o rival. Vamos devolver.", "O rival está na frente de novo. Paciência e ataque.", "Ele passou. Essa briga ainda não acabou."],
  rivalbatida: ["Contato com o rival! Confere o carro.", "Vocês dois se tocaram. Isso vai dar o que falar.", "Batida com o rival. Mantenha a cabeça fria.", "Encostou no rival. Cuidado com a punição.", "Toque com o rival. A rixa continua."],
  rivalrixa: ["Lembre-se: hoje tem o nosso rival na pista. Vocês já se pegaram antes.", "O rival vai vir com tudo hoje, depois do que aconteceu entre vocês.", "Cuidado com o rival. A rixa entre vocês está quente.", "A imprensa está de olho no duelo com o rival. Corrida limpa e forte."],
});
Object.assign(SITUACOES, NOVAS_CARREIRA);
// (2026-11-21, o Thiago: "novas falas... dar uma variada com base em tudo que criamos") os eventos do fim de semana (paddock.js, hud.js na
// largada), o pneu por distância (a pista comprida ou curta) e mais jeitos de dizer as de sempre. Gere com FALAS-NOVAS-CORRIDA.bat.
Object.assign(SITUACOES, {
  evpacoteok: ["O pacote novo está funcionando. O carro tem mais aderência hoje.", "Os dados do assoalho novo são bons. Pode confiar nas curvas rápidas.", "A peça nova correlacionou. Temos mais carro hoje.", "Assoalho novo aprovado. Aproveite a aderência extra."],
  evpacoteruim: ["Má notícia: o pacote novo não está funcionando como no túnel.", "O assoalho novo não correlacionou. O carro está com menos aderência.", "A peça nova está pior que a antiga. Vamos ter que administrar.", "Os dados do pacote novo são ruins. Cuidado nas curvas rápidas."],
  evmotornovo: ["Motor novo instalado. Largamos atrás, mas temos potência para subir.", "Perdemos posições no grid, mas o motor novo é forte. Vá buscar.", "Unidade nova no carro. Use essa potência nas retas.", "Cinco posições a menos no grid. Agora é recuperar com o motor novo."],
  evmotorvelho: ["O motor está cansado. Vamos perder um pouco nas retas.", "Estamos com o motor velho. Defenda nas freadas, não nas retas.", "Potência abaixo do normal hoje. Ganhe tempo nas curvas.", "O motor está no limite. Cuidado com o giro alto."],
  evchassi: ["Estamos com o chassi reserva. O carro está um pouco pior, faça o que der.", "Chassi reserva hoje. Menos aderência, então seja paciente.", "O carro reserva é mais velho. Vamos trazer pontos mesmo assim.", "Chassi reserva no lugar do titular. Sem riscos desnecessários."],
  evcalorpoupar: ["Acerto para o calor. O pneu vai durar mais, aproveite.", "Mudamos o carro por causa do calor. Menos aderência, mais pneu.", "Asfalto muito quente. O acerto está protegendo a borracha.", "O calor está forte, mas o carro está preparado para poupar os pneus."],
  evcalormanter: ["Asfalto fervendo e acerto normal. Os pneus vão sofrer.", "Com esse calor os pneus vão cair rápido. Fique atento ao box.", "Muito calor hoje. Esperamos mais desgaste que o normal.", "Pneus vão superaquecer com esse asfalto. Administre."],
  evdesafio: ["Lembra do desafio na imprensa? Hoje é chegar na frente dele.", "O rival está na pista. O desafio vale muito para a torcida.", "Todo mundo viu o desafio. Agora é provar na pista.", "Hoje é você contra ele. Não deixe o rival na frente."],
  evaposta: ["O patrocinador apostou em você hoje. Cinco milhões se batermos a meta.", "A marca está de olho. A aposta só vale com o resultado.", "Tem bônus em jogo hoje. Vamos buscar a meta.", "O patrocinador quer resultado. A aposta está de pé."],
  pistalonga: ["Pista comprida. O pneu dura menos voltas aqui.", "Volta longa nesta pista. Cuide do pneu desde o começo.", "Aqui o pneu gasta mais por volta. Pense numa parada a mais.", "Circuito longo. A estratégia vai ter mais paradas."],
  pistacurta: ["Pista curta. O pneu aguenta mais voltas aqui.", "Volta curta nesta pista. Dá para esticar o stint.", "Aqui o pneu dura mais. Talvez dê para parar menos.", "Circuito curto. O pneu rende mais voltas."],
});
for (const [q, textos] of Object.entries({
  riscoarriscar: ["Motor no modo ataque. Muita potência, mas vamos parar mais.", "Plano agressivo. Use a potência extra e cuide da borracha.", "Modo ataque ligado. Cada volta conta hoje."],
  riscoseguro: ["Motor poupado e pneus protegidos. Paciência hoje.", "Ritmo controlado. A gente ganha no fim da corrida."],
  largada: ["Bom pulo. Agora segure a linha.", "Largada boa. Cuidado com quem vem por dentro.", "Primeira volta é sobrevivência. Traga o carro inteiro."],
  ganhou: ["Belo ataque. Mais uma posição.", "Passou bonito. Agora feche a porta.", "Isso! Continue nesse ritmo."],
  perdeu: ["Ele passou com o vácuo. Responda na próxima reta.", "Perdemos essa. Ainda tem corrida.", "Deixe ele ir se o pneu pedir. Pense no fim."],
  pneu: ["O pneu está acabando. A próxima volta pode ser a última dele.", "Borracha no fim. Vamos chamar o box em breve."],
  voltarapida: ["Volta mais rápida. A garagem inteira comemorou.", "Que volta! Melhor tempo da corrida."],
  ultima: ["Última volta. Tudo que você tiver agora.", "Última volta. Cuide do carro e traga para casa."],
  vitoria: ["Vencemos! Que corrida, que corrida!", "É vitória! A equipe inteira está gritando aqui."],
  podio: ["Pódio! Grande corrida, obrigado.", "No pódio! A garagem está em festa."],
})) if (SITUACOES[q]) SITUACOES[q].push(...textos);

// situações que passam na frente do intervalo mínimo entre falas
const URGENTES = ["box", "boxmacio", "boxmedio", "boxduro", "boxintermediario", "boxchuva", "safety", "spotesq", "spotdir", "spotlivre"];
const lista = [];
for (const [quando, textos] of Object.entries(SITUACOES)) textos.forEach((texto, i) => lista.push({ id: `${quando}-${i + 1}`, texto, quando }));

// ---------- as falas montadas em pedaços (o rádio emenda os mp3: radio.js `frase`) ----------
// "À sua frente, Verstappen, a um segundo e meio. Os pneus dele estão no fim. Ataque." = abertura + nome + distância + comentário.
// Cada pedaço vira radio/<id>.mp3 como as falas. Os nomes: os pilotos de 2026 (o id de f1-pilotos-2026.js) e os de 2023 a 2025 (f1-temporadas.js) e a galera que joga.
const NOMES = {
  norris: "Norris", piastri: "Piastri", leclerc: "Leclerc", hamilton: "Hamilton", russell: "Russell", antonelli: "Antonelli", verstappen: "Verstappen",
  hadjar: "Hadjar", lawson: "Lawson", lindblad: "Lindblad", alonso: "Alonso", stroll: "Stroll", albon: "Albon", sainz: "Sainz", hulkenberg: "Hülkenberg",
  bortoleto: "Bortoleto", gasly: "Gasly", colapinto: "Colapinto", camara: "Câmara", bearman: "Bearman", perez: "Pérez", bottas: "Bottas",
  // os das temporadas 2023 a 2025 (f1-temporadas.js)
  ricciardo: "Ricciardo", tsunoda: "Tsunoda", magnussen: "Magnussen", zhou: "Zhou", sargeant: "Sargeant", ocon: "Ocon",
  // a galera (o nome que a pessoa usa na sala, sem acento e em minúsculas, vira o id)
  tabba: "Tabba", kizzy: "Kizzy", "1kizzy": "Kizzy", notizin: "Notizin", sho: "Shô", dollyin: "Dollyin", dolllyin: "Dollyin", atrox: "Átrox", jv: "Jota Vê", verago: "Verago", nikao: "Nikão",
};
const PECAS_TEXTO = {
  // as aberturas
  frente: ["À sua frente,", "O carro da frente é", "Logo à frente,", "Na sua frente,"],
  tras: ["Atrás de você,", "Vindo atrás,", "Logo atrás,", "No seu retrovisor,"],
  // a distância (`gap-<décimos>`): a escolhida é a mais perto da real
  gap: { 3: "a três décimos.", 5: "a meio segundo.", 8: "a oito décimos.", 10: "a um segundo.", 15: "a um segundo e meio.", 20: "a dois segundos.",
    25: "a dois segundos e meio.", 30: "a três segundos.", 40: "a quatro segundos.", 50: "a cinco segundos.", 70: "a sete segundos.", 100: "a dez segundos.",
    150: "a quinze segundos.", 200: "a mais de vinte segundos." },
  // o pneu do carro da frente
  rivalgasto: ["Os pneus dele estão no fim. Ataque agora.", "Ele está com os pneus gastos. É a sua chance.", "Ele está sofrendo com os pneus. Pressione.", "Os pneus dele já caíram. Vá pra cima."],
  rivalnovo: ["Ele está de pneus novos. Cuidado com o ritmo dele.", "Ele acabou de trocar os pneus. Vai vir rápido.", "Pneus novos no carro dele. Não force agora."],
  rivalmacio: ["Ele está de macio.", "Ele usa o pneu macio."], rivalmedio: ["Ele está de médio.", "Ele usa o pneu médio."],
  rivalduro: ["Ele está de duro.", "Ele usa o pneu duro."], rivalchuva: ["Ele está de pneu de chuva."],
  // quem vem atrás
  chegando: ["Ele está chegando. Defenda a posição.", "Ele está mais rápido. Proteja a linha de dentro.", "Pressão atrás. Cuidado na freada.", "Ele vem forte. Não deixe espaço."],
  margem: ["Você tem margem. Administre os pneus.", "Distância confortável. Mantenha o ritmo.", "Ele não está ganhando tempo. Siga assim."],
  // a distância para o da frente mudando
  alcancando: ["Estamos chegando nele.", "Você está tirando a diferença.", "Ganhando tempo nele a cada volta."],
  afastando: ["Ele está abrindo.", "Ele está mais rápido agora.", "Estamos perdendo tempo para ele."],
  lider: ["Você está liderando.", "P1. Ninguém à frente.", "Pista livre. Você é o líder."],
  // o companheiro de equipe (o pedido de voz "diferença para o companheiro", mfd.js executarJeff): abertura + nome + distância
  companheirofrente: ["Seu companheiro de equipe está à frente,", "O seu companheiro vai à frente,", "O outro carro da equipe está à frente,", "Seu parceiro de equipe vai na frente,"],
  companheirotras: ["Seu companheiro de equipe está atrás,", "O seu companheiro vem atrás,", "O outro carro da equipe vem atrás,", "Seu parceiro de equipe está atrás de você,"],
};
// o estrategista (a volta da chuva) e o engenheiro (o objetivo desta corrida): abertura + número
const VOLTAS_PECA = 60, TOPS_PECA = 20;
const PECAS = [{ id: "chuvavolta", texto: "Aqui é o estrategista. A previsão é de chuva na" }, { id: "secavolta", texto: "Aqui é o estrategista. A chuva deve parar na" },
  { id: "objetivo", texto: "O objetivo desta corrida: terminar entre os" }, { id: "objetivovencer", texto: "O objetivo desta corrida é vencer. Vamos buscar." }, { id: "objetivofim", texto: "Vamos em frente." }];
for (let v = 1; v <= VOLTAS_PECA; v++) PECAS.push({ id: `volta-${v}`, texto: `volta ${v}.` });
for (let n = 2; n <= TOPS_PECA; n++) PECAS.push({ id: `top-${n}`, texto: `${n} primeiros.` });
for (const [id, texto] of Object.entries(NOMES)) PECAS.push({ id: `nome-${id}`, texto });
for (const [k, texto] of Object.entries(PECAS_TEXTO.gap)) PECAS.push({ id: `gap-${k}`, texto });
for (const [quando, textos] of Object.entries(PECAS_TEXTO)) if (Array.isArray(textos)) textos.forEach((texto, i) => PECAS.push({ id: `${quando}-${i + 1}`, texto, quando }));
const GAPS = Object.keys(PECAS_TEXTO.gap).map(Number);
// o pedaço da distância mais perto de `seg` segundos
const pecaDoGap = (seg) => { const d = seg * 10; let m = GAPS[0]; for (const g of GAPS) if (Math.abs(g - d) < Math.abs(m - d)) m = g; return `gap-${m}`; };
// o id do nome de um piloto: o id dele em f1-pilotos-2026, ou o nome da pessoa sem acento (se a galera tiver o mp3); null se não houver
const semAcento = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
function pecaDoNome(nome, pilotoId) { const id = pilotoId && NOMES[pilotoId] ? pilotoId : semAcento(nome); return NOMES[id] ? `nome-${id}` : null; }
const pecasDe = (quando) => PECAS.filter((p) => p.quando === quando);

const api = { SO_DO_ANO, SITUACOES, URGENTES, FALAS: lista, porSituacao: (q) => lista.filter((f) => f.quando === q), PECAS, NOMES, pecaDoGap, pecaDoNome, pecasDe };
if (typeof module !== "undefined" && module.exports) module.exports = api; else root.RadioFalas = api;
})(typeof self !== "undefined" ? self : this);
