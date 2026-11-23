@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0"
rem Gera os sons da pista com os efeitos sonoros da ElevenLabs: o pneu na zebra, a torcida da arquibancada, o "uuuh" e a buzina.
rem Os arquivos vao para public\corrida\sons\. A chave e pedida aqui, sem aparecer na tela, e vive so nesta janela.
set "ELEVENLABS_API_KEY="
where node >nul 2>nul || (echo Node nao encontrado. Instale o Node 22 ou mais novo: https://nodejs.org & echo. & pause & exit /b 1)

echo ============================================================
echo   Sons da pista (ElevenLabs)
echo ============================================================
echo.
echo   Cada som tem 2 ou 3 versoes (o jogo sorteia uma a cada vez) e as batidas tem leve, media e forte.
echo   As descricoes nao falam de carro nem de motor: so do som isolado.
echo.
echo   zebra (3)            borracha batendo nas listras de concreto
echo   torcida (2)          rumor da arquibancada, em laco
echo   torcida-uau (3)      a galera vibrando quando o carro passa
echo   buzina (2)           buzina de ar da torcida
echo   pistola (3)          pistola pneumatica da troca de pneu
echo   macaco (2)           macaco hidraulico subindo e descendo
echo   chiado (2)           pneu chiando (freada travada e derrapagem), em laco
echo   drs (2)              a asa abrindo
echo   batida-muro-leve, -media, -forte (3 cada)
echo   batida-carro-leve, -media, -forte (3 cada)
echo   chegada (2)          a festa da bandeirada
echo   ers-liga (2)         o ERS ligando na tecla (o overtake)
echo   radio-bip (2)        os bipes do radio da equipe antes da voz
echo   raspa (2)            o assoalho raspando no chao (acerto do carro), em laco
echo   fundo (3)            a suspensao batendo no fundo nas compressoes
echo   brita (2)            o pneu na brita, em laco
echo   grama (2)            o pneu na grama, em laco
echo   ers-fim (2)          a bateria acabando no meio da reta
echo   limitador (1)        o bipe do limitador do box
echo.
echo   O CLIMA (muitas versoes, cada uma com uma descricao diferente):
echo   trovao-perto (8), trovao-medio (8), trovao-longe (8)
echo   chuva-fraca (4), chuva (6), chuva-forte (5), em laco
echo   chuva-capacete (4)   a chuva batendo no capacete, na camera de dentro
echo   vento (6)            o vento no cockpit, em laco
echo   vento-rajada (6)     rajadas de vento na chuva forte
echo.
echo   O AMBIENTE DE CADA PISTA (2 versoes de cada, em laco): amb-monaco (mar), amb-spa (passaros),
echo   amb-silverstone (aviao) e as outras 21 pistas
echo   OS FOGOS das pistas de noite: fogos-estouro (6), fogos-longe (5), fogos-crepitar (5), fogos-assobio (4)
echo.
echo O que gerar?
echo   1) So os que faltam
echo   2) Refazer todos
echo   3) Refazer so alguns (voce digita os nomes)
set "M=1"
set /p "M=Escolha 1, 2 ou 3 (Enter = 1): "
set "ARGS="
if "%M%"=="2" set "ARGS=--refazer"
if "%M%"=="3" (
  set "QUAIS="
  set /p "QUAIS=Quais? separados por virgula, ex.: zebra,pistola : "
  if "!QUAIS!"=="" ( echo Nada escolhido. & pause & exit /b 0 )
  set "ARGS=--so !QUAIS!"
)

echo.
echo Cada som gasta creditos de efeitos sonoros da sua conta (sao muitos arquivos curtos; com a opcao 1 so os que faltam).
set "GO=N"
set /p "GO=Continuar e gerar? s/N: "
if /i not "!GO!"=="s" ( echo Cancelado. Nada foi gerado. & pause & exit /b 0 )

echo.
for /f "usebackq delims=" %%k in (`powershell -NoProfile -ExecutionPolicy Bypass -File "ferramentas\ler-chave.ps1"`) do set "ELEVENLABS_API_KEY=%%k"
if "%ELEVENLABS_API_KEY%"=="" ( echo Sem chave. Nada foi gerado. & pause & exit /b 1 )

echo.
node ferramentas\sons-pista.js %ARGS%
set "RC=%ERRORLEVEL%"
set "ELEVENLABS_API_KEY="

echo.
if "%RC%"=="0" (
  echo Pronto. Abra a Corrida, recarregue com Ctrl+Shift+R e passe numa zebra e por uma arquibancada.
  echo Se algum som nao ficou bom, rode de novo com a opcao 3 so com ele.
) else (
  echo Teve erro em algum som: confira a chave e o limite da conta e rode de novo.
)
pause
exit /b %RC%
