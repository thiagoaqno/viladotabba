# Tiro: motos no Battle royale (os únicos veículos)

Pedido do Thiago: "os únicos veículos para andar serem motos", aproveitando o rascunho dos carros de F1 (#1082, que continua como rascunho e fica de fora) e cuidando do hitbox das motos.

**Do rascunho, ficou** (`ferramentas/tiro-br-motos.js`, novo, injetado depois do `tiro-br-dupla.js`): subir e descer com E (ou o botão de usar no tablet), uma pessoa por moto; a câmera atrás; o piloto não atira, não joga granada nem troca de arma; atropelar acima de 8 m/s machuca; a moto leva tiro, explode quando acaba a vida e mata quem estiver nela; a zona continua pegando o piloto; os robôs desviam de moto parada; e a rede do rascunho (o host decide quem está em cada moto e a vida dela, o piloto manda a pose, quem entra tarde recebe um resumo a cada 2 s).

**O que mudou para moto:**
- **modelo:** moto de 2,1 x 1,1 x 0,7 m (duas rodas, quadro, tanque, banco, garfo, guidão, farol, escapamento), quatro cores sem marca;
- **hitbox de quem anda:** a moto é uma **cápsula fina** no comprimento dela (1,24 m de eixo e 0,42 m de raio). A pessoa encosta na moto pela forma dela, e não por um círculo de 2 m como o carro;
- **hitbox da física da moto:** três círculos de 0,42 m no eixo dela (frente, meio e traseira), contra as paredes do mapa. Passa em beco onde o carro não passava;
- **hitbox de tiro:** uma caixa baixa (0,76 x 0,88 x 1,96 m, de 0,12 a 1 m de altura) só para a moto. **O piloto fica sentado e exposto** por cima dela e leva tiro normal;
- **direção:** até **24 m/s** (o carro ia a 30), ré de 4 m/s, freio forte, curva mais fechada, e **a moto inclina na curva**;
- **vida:** 150 (o carro tinha 300). A explosão é menor: 3,5 m e 70 de dano;
- **atropelar:** precisa encostar a menos de 1,3 m (era 2,1), com até 110 de dano;
- **lugares:** até 10 motos na Favela Grande (272 x 212 m), sorteadas entre a avenida, as ruas de divisa, a rua do Comércio, a do Campinho e a frente da Rodoviária, alternando as áreas. Nos outros mapas, 6 em pontos livres da malha dos robôs.

**Ainda não tem:** garupa, robô pilotando, e moto empinando ou rampa.

Conferido só com `node --check` (o arquivo e o script do jogo montado); não joguei. O rascunho também não tinha sido jogado: dirigir, as colisões, o tablet e o salão com mais gente são o primeiro teste.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
