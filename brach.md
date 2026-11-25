# Tiro da Galera: falas do rádio em português (ElevenLabs), com variações

O jogo tem 23 anúncios de rádio: UAV, satélite, PEM, bombardeio, helicóptero, drone kamikaze e mecha (pronto, no ar e
inimigo), mais ponto capturado e ponto perdido. Até agora eles eram em inglês. Este PR prepara tudo para que fiquem em
português, com 3 variações cada (69 áudios, 1.852 caracteres na ElevenLabs).

## Como

- **`ferramentas/tiro-vozes/falas.json`:** os textos, três por anúncio.
- **`ferramentas/tiro-vozes.js` + `VOZES-TIRO.bat`:** geram os mp3 na ElevenLabs. Seguem o mesmo esquema das falas da
  Corrida: a chave é pedida na janela e nunca é gravada, e só são geradas as falas que ainda não têm mp3. O atalho fica em
  `Downloads\lts\Vozes do Tiro (ElevenLabs).bat`, que roda na pasta `klk\falas`.
- **`ferramentas/tiro-frontline.js`:** quando os 23 anúncios têm mp3, ele troca o pacote de voz do jogo pelo nosso.
  - Cada variação entra como `v_<fala>-N`. O motor de som do jogo já junta os `-N` de um mesmo som e sorteia um a cada
    anúncio; no celular, ele usa só as duas primeiras variações.
  - A duração de cada fala é contada pelos quadros do mp3, com uma pequena folga, para o jogo não cortar o fim.
- **Enquanto faltar algum mp3,** a voz continua a em inglês.
