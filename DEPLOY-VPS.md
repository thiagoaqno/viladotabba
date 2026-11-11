# Deploy na VPS da Hostinger

Depois de configurado uma vez, **todo merge na `main` publica sozinho**: o GitHub entra na VPS por SSH, puxa a `main`, instala as dependências e reinicia o jogo (`.github/workflows/deploy-vps.yml`). Dá para ver cada deploy na aba **Actions** do GitHub, em "Deploy na VPS", e para rodar de novo à mão pelo botão **Run workflow**.

Enquanto os segredos do passo 4 não estiverem cadastrados, o deploy é pulado sem erro.

Tudo abaixo dá para fazer pelo **console web da VPS** (hPanel da Hostinger > VPS > o botão do terminal no navegador), sem instalar nada no PC.

## 1. Descobrir como a VPS está (uma vez)

Cole no console e veja o resultado (ou mande para o Claude):

```bash
whoami; hostname -I; node -v; (pm2 list || echo "sem pm2"); ls ~; find / -maxdepth 4 -name server.js -not -path "*/node_modules/*" 2>/dev/null
```

Isso mostra o usuário (vai em `VPS_USER`), o IP (vai em `VPS_HOST`; o primeiro número), a versão do Node, se o jogo já roda pelo pm2 e em que pasta está o `server.js` (vai em `VPS_PASTA`, se não for `~/viladotabba`).

## 2. A chave de deploy, criada na própria VPS (uma vez)

No console:

```bash
ssh-keygen -t ed25519 -C deploy-github -f ~/.ssh/deploy_github -N ""
mkdir -p ~/.ssh && cat ~/.ssh/deploy_github.pub >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys
cat ~/.ssh/deploy_github
```

O último comando mostra a chave **privada**, das linhas `-----BEGIN OPENSSH PRIVATE KEY-----` até `-----END OPENSSH PRIVATE KEY-----`. Selecione tudo, com essas duas linhas, e copie: ela vai no segredo `VPS_SSH_KEY` do passo 4. Não mande essa chave para ninguém.

## 3. O jogo rodando pelo pm2 (uma vez)

O deploy reinicia o jogo pelo **pm2** (o programa que mantém o Node ligado e o religa sozinho se cair ou se a VPS reiniciar). Na VPS, dentro da pasta do jogo (onde está o `server.js`):

```bash
node -v                          # precisa ser 22.13 ou mais novo
npm install -g pm2               # se ainda não tiver o pm2
pm2 list                         # se o jogo já aparece aqui, anote o nome dele e pule para o passo 4
```

Se o jogo **não** está no pm2 (estava rodando com `node server.js` ou `npm start` numa janela): pare esse jeito antigo (Ctrl+C na janela, ou `pkill -f server.js`) e ligue pelo pm2, com a mesma porta e o mesmo banco de antes:

```bash
PORT=3000 pm2 start server.js --name corrida    # troque 3000 pela porta que o Cloudflare/Nginx usa; ponha DB_PATH=... na frente se usava
pm2 save
pm2 startup                      # mostra um comando: copie e rode ele, para o jogo voltar sozinho se a VPS reiniciar
```

Confira que a pasta é um clone do GitHub: `git remote -v` deve mostrar `thiagoaqno/viladotabba` (ou o nome antigo, `leilao-de-times`). Se a VPS não consegue puxar do GitHub (repositório privado), a VPS também precisa de uma chave de leitura: crie uma com `ssh-keygen -t ed25519` **na VPS** e cadastre a pública dela no GitHub em **Settings > Deploy keys** (só leitura).

## 4. Os segredos no GitHub (uma vez)

No GitHub: repositório > **Settings > Secrets and variables > Actions**.

Aba **Secrets**, botão **New repository secret**:

| Nome | O que pôr |
|---|---|
| `VPS_HOST` | o IP da VPS (o do passo 1, ou o da página da VPS no hPanel) |
| `VPS_USER` | o usuário do passo 1 (muitas vezes `root`) |
| `VPS_SSH_KEY` | o conteúdo inteiro do arquivo `deploy_vps` (a chave **privada**; no PC: `Get-Content $HOME\.ssh\deploy_vps`), incluindo as linhas `-----BEGIN` e `-----END` |
| `VPS_PORT` | só se o SSH da VPS não for na porta 22 |

Aba **Variables**, botão **New repository variable** (só se for diferente do padrão):

| Nome | Padrão | O que é |
|---|---|---|
| `VPS_PASTA` | `~/viladotabba` | a pasta do jogo na VPS (onde está o `server.js`) |
| `VPS_PM2` | `corrida` | o nome do jogo no `pm2 list` |

## 5. Testar

Aba **Actions** > **Deploy na VPS** > **Run workflow**. O log mostra o commit de antes e o de agora, e o status do jogo no pm2. Se der erro, o log diz em qual passo parou.

## O que o deploy faz (e o que não faz)

- `git merge --ff-only`: só avança a pasta da VPS até a `main`. Se alguém mexeu em arquivos de código direto na VPS, ele **para com erro** em vez de apagar o que foi mexido. Arquivos fora do Git (o banco SQLite, `.env`) não são tocados.
- `npm ci --omit=dev`: instala as dependências exatas do `package-lock.json`, sem as de teste.
- `pm2 reload`: reinicia o jogo. As corridas que estiverem rodando na hora caem (como em qualquer deploy); o banco continua.
- O deploy antigo do Fly (`fly-deploy.yml`, `fly.toml`) continua no repositório, sem uso desde 2026-11-03.
