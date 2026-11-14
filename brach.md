# Capacete em 3D, na carreira e no pódio

- **Prévia 3D (`capacete-3d.js`):** o editor mostra o capacete da pista (as geometrias e a viseira de `f1-piloto.js`, a pintura de `pintarFolha`) em 3D, com reflexos (`RoomEnvironment`), girando sozinho; arrastar gira na mão. Só desenha com o canvas visível. Sem WebGL, volta a folha aberta de antes.
- **Editor sem sala (`capacete-editor-ui.js`):** o cartão saiu de `capacete-editor.js` (que agora só liga com a sala: `mods.capacete` e `sincronizarCapacete`) para servir também à carreira. O CSS `.cp-*` foi de `sala-nova.css` para `capacete.css`, carregado pelas duas páginas.
- **Carreira:** a aba **Capacete** na Central (`temporada/central.js` + o módulo em `temporada/index.html`). É o mesmo capacete guardado (`corrida:capacete`), que vai para a sala do GP pelo `sincronizarCapacete`. O editor é montado uma vez e reaproveitado a cada repintura (um WebGL só).
- **Corrida rápida:** o capacete vai junto no `create` (ela larga direto, sem passar pela sala).
- **Pódio (`podio-pilotos.js`, `podio-3d.js`):** quem joga comemora com o próprio capacete (desenho, cores, bandeira, nome) e a cor da viseira dele.
- **Viseira (`f1-piloto.js`):** `MeshPhysicalMaterial` com metal 0,9, rugosidade 0,05 e verniz (item 2 de `docs/capacetes-guia.md`).
- **Conserto (`corrida.js`, `limparCapacete`):** a expressão que limpa o nome tinha perdido as barras (`[^p{L}p{N} .-]`) e apagava todas as letras: o nome do capacete chegava vazio para os outros. Agora é `[^\p{L}\p{N} .\-]`, igual à do editor.
- Os mecânicos do box continuam com o capacete genérico nas cores da equipe. A troca do modelo (o glTF do item 1 do guia) espera o arquivo do Thiago.
