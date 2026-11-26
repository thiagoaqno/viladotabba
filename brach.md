# Tiro da Galera: mapa Aeroporto e as peças do aeroporto

**Mapa Aeroporto** (`aeroporto.json`, gerado por `aeroporto-gerar.js`), pelo desenho do Thiago:
- **Terminal:** fica no piso de cima, a 4,5 m e maciço por baixo. No meio, o salão da segurança (paredes em colchete, com raio-x, pórticos, cadeiras e painel de voos); dos lados, a loja e o café fechados. Na frente, check-in e cadeiras, com guarda-corpo de vidro olhando o pátio; teto, colunas e luzes.
- **Oeste:** plataforma alta e rampa larga até o pátio.
- **Pátio:** fica embaixo, com o avião (cabine andável a 4,5 m), a escada do avião e a ponte de embarque em L até o terminal; carrinhos de bagagem, contêineres, cones e barreiras.
- **Times:** o Alpha nasce no fundo do terminal, o Bravo no fundo do pátio. A dominação fica no salão (A), na plataforma (B) e no pátio (C).
- **Bots:** 208 pontos tirados da rede de caminhos.

**Peças novas** (grupo Aeroporto no editor): avião, balcão de check-in, cadeiras, raio-x, pórtico, carrinho de bagagem, painel de voos, esteira de bagagem.

**Conserto: nascer num piso alto** (`tiro-frontline.js`):
- **O problema:** o jogo procurava o ponto de caminho perto da altura 0. No terminal não achava, punha o soldado dentro do bloco, e a colisão empurrava para fora do mapa.
- **Agora:** quando não há ponto no chão, ele procura de cima para baixo (até 8 m) o primeiro piso com 1,8 m livres. Mapas com chão em y = 0 continuam iguais.

Conferido no navegador:
- todas as áreas (pátio, rampa, plataforma, terminal, salão, escada, cabine e ponte) estão ligadas para os bots;
- a largada e 66 renascimentos põem o Alpha em cima do terminal (y 4,5) e o Bravo no pátio, ninguém fora do mapa;
- foram 1.100 renascimentos no modo dominação, nenhum dentro de uma área (o mais perto a 12,5 m);
- na Favela, o nascer continua igual.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
