// Corrida da Galera — o guia de cada GP (gp-guia.js): um pouco da história do circuito e as curvas famosas. Só fatos conhecidos, sem
// recorde de volta nem número que mude a cada ano (os recordes que aparecem na ficha são os do próprio jogo, medidos no servidor).
// `curvas`: o nome tem de bater com o de gp-info.js (é por ele que o card acha a curva no mapa e leva a câmera até lá).
export const CURIOSIDADES = {
  monaco: {
    historia: [
      "O primeiro Grande Prêmio de Mônaco foi em 1929, organizado por Antony Noghès, que dá nome à última curva.",
      "É o circuito mais lento e mais estreito do calendário, e o único com um túnel.",
      "Ayrton Senna venceu em Mônaco seis vezes, cinco delas seguidas, de 1989 a 1993.",
    ],
    curvas: {
      "Sainte Dévote": "A primeira curva leva o nome da capela da padroeira de Mônaco, que fica bem ali, na saída.",
      "Grand Hotel (Fairmont)": "O grampo do hotel é a curva mais lenta de toda a temporada: os carros passam quase parando.",
      "Túnel": "O único túnel do calendário: o piloto sai da sombra direto para a luz, a toda velocidade, rumo à chicane do porto.",
      "Piscine": "O S rápido que contorna a piscina pública do porto.",
      "La Rascasse": "Leva o nome do bar que fica na curva.",
      "Antony Noghès": "Homenagem ao criador do GP de Mônaco.",
    },
  },
  interlagos: {
    historia: [
      "O nome vem da posição do autódromo, entre duas represas da zona sul de São Paulo: Guarapiranga e Billings.",
      "O nome oficial homenageia José Carlos Pace, o Moco, que venceu ali o GP do Brasil de 1975.",
      "A pista roda no sentido anti-horário, o que cansa o pescoço dos pilotos para o outro lado.",
      "Em 1991, Ayrton Senna venceu em casa com o câmbio preso na sexta marcha nas últimas voltas.",
    ],
    curvas: {
      "S do Senna": "A descida logo depois da largada leva o nome do Senna e é o ponto preferido para ultrapassar na primeira volta.",
      "Descida do Lago": "A curva que desce em direção à represa, no fim da reta oposta.",
      "Junção": "A última curva antes da subida dos boxes; nela Lewis Hamilton passou Timo Glock e virou campeão em 2008.",
      "Subida dos Boxes": "A longa subida até a linha de chegada, onde o vácuo decide muita disputa.",
    },
  },
  monza: {
    historia: [
      "Inaugurado em 1922, é o 'Templo da Velocidade': o circuito com as médias mais altas do calendário.",
      "A antiga curva inclinada de concreto, a sopraelevata, ainda está lá, dentro do parque.",
      "O pódio fica por cima da reta, e a torcida da Ferrari, os tifosi, invade a pista depois da corrida.",
    ],
    curvas: {
      "Variante del Rettifilo": "A primeira chicane, no fim da reta, onde a largada costuma embolar.",
      "Variante Ascari": "Leva o nome de Alberto Ascari, bicampeão, que morreu num teste em Monza em 1955.",
      "Parabolica (Curva Alboreto)": "Em 2021 ganhou o nome de Michele Alboreto. A saída dela decide a velocidade na reta inteira.",
      "Curva Grande": "Feita de pé embaixo, logo depois da primeira chicane.",
    },
  },
  silverstone: {
    historia: [
      "Foi palco da primeira corrida do Campeonato Mundial de F1, em 13 de maio de 1950.",
      "O circuito nasceu numa antiga base aérea da Segunda Guerra Mundial, e as retas vêm das pistas de pouso.",
      "É a casa de boa parte das equipes, que ficam a poucos quilômetros dali.",
    ],
    curvas: {
      "Copse": "Uma das curvas mais rápidas do campeonato, feita quase de pé embaixo.",
      "Maggotts": "Começa aqui a sequência Maggotts, Becketts e Chapel: o trecho de troca de direção mais famoso da F1.",
      "Becketts": "O meio da sequência, onde o carro muda de lado sem tirar o pé.",
      "Stowe": "O nome vem da escola de Stowe, vizinha do circuito.",
    },
  },
  spa: {
    historia: [
      "Com 7 km, é o circuito mais longo do calendário; o traçado original, em estradas públicas, tinha mais de 14 km.",
      "Nas Ardenas, pode chover numa parte da pista e estar seco na outra.",
    ],
    curvas: {
      "La Source": "O grampo da largada, a curva mais lenta da volta.",
      "Eau Rouge": "O nome é do riacho que passa por baixo. A compressão no fundo do vale é uma das mais fortes do mundo.",
      "Raidillon": "A subida cega depois da Eau Rouge: o piloto não vê a pista quando vira o volante.",
      "Pouhon": "Uma esquerda dupla, longa e rápida, descendo o vale.",
      "Blanchimont": "Uma esquerda de pé embaixo antes da última chicane.",
      "Bus Stop": "A chicane final, que no passado era mesmo um ponto de ônibus.",
    },
  },
  suzuka: {
    historia: [
      "É a única pista em forma de oito do calendário: a pista passa por cima de si mesma numa ponte.",
      "Foi construída pela Honda em 1962 para servir de pista de testes.",
      "Senna e Prost decidiram o título batendo ali duas vezes, em 1989 e em 1990.",
    ],
    curvas: {
      "S Curves": "Os S do primeiro setor: errar uma tira o ritmo de todas as seguintes.",
      "Degner 1": "Leva o nome de Ernst Degner, piloto de motos que caiu ali.",
      "Spoon": "A curva dupla em forma de colher, que leva à reta mais longa.",
      "130R": "Uma das curvas mais rápidas e temidas da F1; o nome vem do raio, de 130 metros.",
    },
  },
  barcelona: {
    historia: [
      "Recebe o GP da Espanha desde 1991 e é uma das pistas mais usadas pelas equipes nos testes.",
      "Como as equipes conhecem cada metro dela, um carro bom em Barcelona costuma ser bom em quase todo lugar.",
    ],
    curvas: {
      "Campsa": "Uma direita cega no alto do morro, feita em alta velocidade.",
      "La Caixa": "O grampo depois da reta oposta, um dos poucos pontos de ultrapassagem.",
    },
  },
  montreal: {
    historia: [
      "Fica na ilha de Notre-Dame, uma ilha artificial construída para a Expo 67.",
      "Leva o nome de Gilles Villeneuve, que venceu a primeira corrida ali, em 1978.",
      "As marmotas que vivem na ilha às vezes atravessam a pista durante o fim de semana.",
    ],
    curvas: {
      "Virage Senna": "A primeira curva, um grampo que costuma embolar o pelotão na largada.",
      "L'Épingle": "O grampo no fim da ilha.",
    },
  },
  zandvoort: {
    historia: [
      "Fica no meio das dunas, à beira do Mar do Norte, e o vento joga areia na pista.",
      "Voltou ao calendário em 2021, depois de 36 anos fora, com duas curvas inclinadas novas.",
    ],
    curvas: {
      "Tarzanbocht": "O nome vem de um morador apelidado de Tarzan, que cedeu o terreno da horta com a condição de a curva levar o seu apelido.",
      "Hugenholtz": "A curva inclinada que leva o nome do criador do circuito, John Hugenholtz.",
      "Arie Luyendyk": "A curva inclinada final, em homenagem ao holandês que venceu duas vezes as 500 Milhas de Indianápolis.",
    },
  },
  redbullring: {
    historia: [
      "Já se chamou Österreichring e A1-Ring; a Red Bull reformou o circuito e o trouxe de volta à F1 em 2014.",
      "É uma das voltas mais curtas do calendário, nas montanhas da Estíria.",
    ],
    curvas: {
      "Niki Lauda": "Homenagem ao tricampeão austríaco.",
      "Rindt": "Homenagem a Jochen Rindt, o único campeão póstumo da F1, em 1970.",
    },
  },
  hungaroring: {
    historia: [
      "Em 1986 foi a primeira corrida de F1 atrás da Cortina de Ferro.",
      "Estreita e cheia de curvas, é chamada de 'Mônaco sem muros': ultrapassar ali é difícil.",
    ],
    curvas: {},
  },
  baku: {
    historia: [
      "Mistura uma das retas mais longas do calendário, à beira do Mar Cáspio, com o trecho estreitíssimo da cidade velha.",
      "A cidade velha, cercada por muralhas medievais, é Patrimônio Mundial da Unesco.",
    ],
    curvas: {},
  },
  singapura: {
    historia: [
      "Em 2008 foi a primeira corrida noturna da história da F1.",
      "O calor e a umidade fazem dela uma das corridas mais cansativas do ano.",
    ],
    curvas: {},
  },
  lasvegas: {
    historia: [
      "A pista passa pela Las Vegas Strip, a avenida dos cassinos, e a corrida é à noite.",
      "Nos anos 1980, Las Vegas já tinha recebido a F1 num circuito montado no estacionamento do Caesars Palace.",
    ],
    curvas: {
      "Sphere": "A curva em volta da Sphere, a esfera gigante de telas de LED.",
      "Las Vegas Blvd": "A reta da Strip, entre os cassinos.",
    },
  },
  mexico: {
    historia: [
      "Fica a mais de 2 mil metros de altitude: o ar rarefeito tira pressão aerodinâmica e dificulta resfriar freios e motor.",
      "O nome homenageia os irmãos Ricardo e Pedro Rodríguez, pilotos mexicanos.",
      "O trecho do estádio passa por dentro de uma arquibancada lotada.",
    ],
    curvas: {},
  },
  austin: {
    historia: [
      "O Circuito das Américas foi o primeiro construído nos Estados Unidos especialmente para a F1, em 2012.",
      "Roda no sentido anti-horário, e a primeira curva fica no alto de uma subida muito íngreme.",
      "Os S do primeiro setor foram inspirados em Maggotts e Becketts, de Silverstone.",
    ],
    curvas: {},
  },
  melbourne: {
    historia: [
      "A pista contorna o lago do Albert Park, um parque público que vira circuito uma vez por ano.",
      "Recebe a F1 desde 1996, quando o GP da Austrália saiu de Adelaide.",
    ],
    curvas: {},
  },
  bahrein: {
    historia: [
      "Em 2004 foi o primeiro GP de F1 no Oriente Médio.",
      "No meio do deserto, o vento joga areia na pista; desde 2014 a corrida é à noite.",
    ],
    curvas: {},
  },
  jeddah: {
    historia: [
      "Estreou em 2021 à beira do Mar Vermelho e é um dos circuitos de rua mais rápidos já feitos.",
      "As curvas rápidas e cegas entre os muros pedem precisão o tempo todo.",
    ],
    curvas: {},
  },
  miami: {
    historia: [
      "A pista contorna o estádio Hard Rock, a casa do Miami Dolphins, e estreou em 2022.",
      "A famosa 'marina' do circuito é de mentira: os barcos ficam em cima de um chão pintado de azul.",
    ],
    curvas: {},
  },
  abudhabi: {
    historia: [
      "Estreou em 2009 e a corrida começa de dia e termina de noite.",
      "A pista passa por baixo do hotel que cruza o circuito, e muitas vezes ali se decide o campeonato.",
    ],
    curvas: {},
  },
  catar: {
    historia: [
      "O circuito de Lusail foi construído em 2004 para a MotoGP; a F1 chegou em 2021.",
      "A corrida é à noite, sob luzes, por causa do calor do deserto.",
    ],
    curvas: {},
  },
  xangai: {
    historia: [
      "O traçado tem a forma do caractere chinês 上 (shang), a primeira sílaba de Xangai.",
      "As duas primeiras curvas formam um caracol que vai fechando, um dos trechos mais difíceis de acertar.",
    ],
    curvas: {},
  },
  madri: {
    historia: [
      "O Madring é um circuito novo, montado em volta do centro de feiras IFEMA, em Madri.",
    ],
    curvas: {
      "La Monumental": "A grande curva inclinada do circuito.",
    },
  },
  nurburgring: {
    historia: [
      "Jackie Stewart apelidou o Nordschleife de 'Inferno Verde': mais de 20 km de curvas no meio da floresta.",
      "Em 1976, Niki Lauda sofreu ali o acidente que quase o matou; foi a última corrida da F1 no traçado longo.",
    ],
    curvas: {
      "Karussell": "A curva inclinada de concreto, em que os pilotos mergulham o carro na canaleta.",
      "Flugplatz": "O nome quer dizer 'aeródromo'. A pista dá um salto, e os carros chegam a tirar as rodas do chão.",
      "Bergwerk": "A região do acidente de Niki Lauda em 1976.",
    },
  },
};
