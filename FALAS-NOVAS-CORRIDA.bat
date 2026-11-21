@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0"
rem Gera so as falas do radio que ainda nao tem mp3 (as novas: eventos da carreira, pista comprida ou curta e as variacoes),
rem com a voz do engenheiro na ElevenLabs. As que ja existem ficam como estao.
rem A chave e pedida aqui, sem aparecer na tela, e vive so nesta janela: nunca vai para arquivo nem para log.
set "ELEVENLABS_API_KEY="
where node >nul 2>nul || (echo Node nao encontrado. Instale o Node 22 ou mais novo: https://nodejs.org & echo. & pause & exit /b 1)

set "VOZ_ENGENHEIRO_PADRAO=oCWW6YTSEVFt26dBO8vU"

echo ============================================================
echo   Falas novas do radio (ElevenLabs)
echo ============================================================
echo.
node ferramentas\radio-engenheiro.js --estimar
echo.
set "GO=N"
set /p "GO=Gerar as que faltam usando creditos? s/N: "
if /i not "%GO%"=="s" ( echo Cancelado. Nada foi gerado. & pause & exit /b 0 )

set "VE=%VOZ_ENGENHEIRO_PADRAO%"
set /p "VE=Voice ID do ENGENHEIRO (Enter = padrao %VOZ_ENGENHEIRO_PADRAO%): "
if "!VE!"=="" set "VE=%VOZ_ENGENHEIRO_PADRAO%"

echo.
for /f "usebackq delims=" %%k in (`powershell -NoProfile -ExecutionPolicy Bypass -File "ferramentas\ler-chave.ps1"`) do set "ELEVENLABS_API_KEY=%%k"
if "%ELEVENLABS_API_KEY%"=="" ( echo Sem chave. Nada foi gerado. & pause & exit /b 1 )

echo.
node ferramentas\radio-engenheiro.js --voz "%VE%"
set "RC=%ERRORLEVEL%"
set "ELEVENLABS_API_KEY="

echo.
set "r=0"
for %%f in (public\corrida\radio\*.mp3) do set /a r+=1
echo Arquivos de voz do radio: %r%
if not "%RC%"=="0" echo Teve erro em alguma fala: rode de novo (so gera as que faltam) depois de conferir a chave e o limite da conta.
if "%RC%"=="0" echo Pronto. Os mp3 novos estao em public\corrida\radio (o .gitignore esconde os mp3: para subir, git add -f).
pause
exit /b %RC%
