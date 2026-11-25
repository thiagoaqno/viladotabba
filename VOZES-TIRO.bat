@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0"
rem Gera as falas do radio do Tiro da Galera na ElevenLabs: os textos em ferramentas\tiro-vozes\falas.json e uma voz por tipo de
rem arma da classe em ferramentas\tiro-vozes\vozes.json. So gera as que ainda nao tem mp3.
rem A chave e pedida aqui, sem aparecer na tela, e vive so nesta janela: nunca vai para arquivo nem para log.
set "ELEVENLABS_API_KEY="
where node >nul 2>nul || (echo Node nao encontrado. Instale o Node 22 ou mais novo: https://nodejs.org & echo. & pause & exit /b 1)

echo ============================================================
echo   Falas do radio do Tiro da Galera (ElevenLabs)
echo ============================================================
echo.
node ferramentas\tiro-vozes.js --estimar
echo.
set "GO=N"
set /p "GO=Gerar as que faltam usando creditos? s/N: "
if /i not "%GO%"=="s" ( echo Cancelado. Nada foi gerado. & pause & exit /b 0 )

echo.
for /f "usebackq delims=" %%k in (`powershell -NoProfile -ExecutionPolicy Bypass -File "ferramentas\ler-chave.ps1"`) do set "ELEVENLABS_API_KEY=%%k"
if "%ELEVENLABS_API_KEY%"=="" ( echo Sem chave. Nada foi gerado. & pause & exit /b 1 )

echo.
node ferramentas\tiro-vozes.js
set "RC=%ERRORLEVEL%"
set "ELEVENLABS_API_KEY="

echo.
if not "%RC%"=="0" echo Teve erro em alguma fala: rode de novo (so gera as que faltam) depois de conferir a chave e o limite da conta.
if "%RC%"=="0" echo Pronto. Os mp3 estao em %~dp0ferramentas\tiro-vozes. Agora e so avisar o Claude, que monta no jogo.
pause
exit /b %RC%
