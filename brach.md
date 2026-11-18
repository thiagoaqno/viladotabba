# A torcida segue a arquibancada

O Thiago tirou arquibancadas da Cidade do México pelo editor e os torcedores ficaram flutuando: a torcida (`vida.js`) senta nos degraus de `tr.arqDegraus`, que guardavam só o trecho da pista, sem a peça.

- `kit/arquibancadas.js`: cada trecho guarda as peças que criou (`pecas`, a primeira são os assentos).
- `vida.js`: cada torcida de arquibancada sabe de qual trecho é; a nova `torcidaSegueArquibancadas(tr)` olha os assentos depois dos ajustes do editor: escondidos → a torcida some; movidos ou girados → cada pessoa vai junto (a mesma diferença entre a posição original e a nova).
- `pista.js`: chama logo depois de `aplicarAjustes(tr)`.

Vale para todas as pistas que usam as arquibancadas do kit (México, Interlagos, Mônaco, Silverstone, Suzuka, Xangai, Catar e as simples). No editor, a torcida acerta ao abrir de novo a pista; no jogo, já na largada.

Conferido com `node --check`.
