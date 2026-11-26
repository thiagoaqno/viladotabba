# Tiro da Galera: prévia temporária das skins

O modo `?camos=todas` ficava gravado no navegador e continuava liberando todas as camuflagens e skins da faca nas aberturas seguintes. Agora a prévia vale apenas para aquela abertura do jogo, remove a antiga preferência persistente e retira o parâmetro do endereço para que uma atualização volte ao modo normal.

As travas voltam a seguir o nível da arma e os abates com a faca, sem alterar XP ou progresso. Validação: `node --check` e remontagem do jogo com `tiro-frontline.js`.
