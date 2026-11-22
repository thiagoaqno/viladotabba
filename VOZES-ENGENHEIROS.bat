@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0"
rem As vozes dos outros engenheiros do radio (Marcos, Bia, Rafa: public/corrida/radio.js ENGENHEIROS), com a ElevenLabs. Cada um tem as mesmas
rem falas do Jeff (ate 3 variacoes de cada, ~17 mil caracteres por engenheiro), na voz que voce escolher, em public\corrida\radio\<engenheiro>\. Gera so as que faltam: pode parar e rodar de novo.
rem A chave e pedida aqui, sem aparecer na tela, e vive so nesta janela: nunca vai para arquivo nem para log.
set "ELEVENLABS_API_KEY="
where node >nul 2>nul || (echo Node nao encontrado. Instale o Node 22 ou mais novo: https://nodejs.org & echo. & pause & exit /b 1)

echo ============================================================
echo   Vozes dos engenheiros (ElevenLabs)
echo ============================================================
echo.
echo Qual engenheiro?
echo   1) Marcos (veterano, calmo)
echo   2) Bia (empolgada)
echo   3) Rafa (tecnico, direto)
set "O="
set /p "O=Escolha 1, 2 ou 3: "
set "P="
if "%O%"=="1" set "P=marcos"
if "%O%"=="2" set "P=bia"
if "%O%"=="3" set "P=rafa"
if "%P%"=="" ( echo Opcao invalida. & pause & exit /b 1 )

echo.
node ferramentas\radio-engenheiro.js --estimar --pasta %P% --variacoes 3
echo.
set "VZ="
set /p "VZ=Voice ID da ElevenLabs para %P%: "
if "!VZ!"=="" ( echo Sem voz. Nada foi gerado. & pause & exit /b 1 )
set "GO=N"
set /p "GO=Gerar as que faltam usando creditos? s/N: "
if /i not "%GO%"=="s" ( echo Cancelado. Nada foi gerado. & pause & exit /b 0 )

echo.
for /f "usebackq delims=" %%k in (`powershell -NoProfile -ExecutionPolicy Bypass -File "ferramentas\ler-chave.ps1"`) do set "ELEVENLABS_API_KEY=%%k"
if "%ELEVENLABS_API_KEY%"=="" ( echo Sem chave. Nada foi gerado. & pause & exit /b 1 )

echo.
node ferramentas\radio-engenheiro.js --pasta %P% --variacoes 3 --voz "!VZ!"
set "RC=%ERRORLEVEL%"
set "ELEVENLABS_API_KEY="

echo.
set "r=0"
for %%f in (public\corrida\radio\%P%\*.mp3) do set /a r+=1
echo Arquivos de voz de %P%: %r%
if not "%RC%"=="0" echo Teve erro em alguma fala: rode de novo (so gera as que faltam) depois de conferir a chave e o limite da conta.
if "%RC%"=="0" echo Pronto. Avise o Claude para subir os mp3 (ficam em public\corrida\radio\%P%).
pause
exit /b %RC%
