@echo off
rem O editor de cenario das pistas: abre o servidor do jogo com o editor ligado e o navegador na pista.
rem Ponha os .glb originais em assets-originais. Os convertidos vao para public/corrida/assets e o cenario para public/corrida/cenario.
cd /d "%~dp0"
set CORRIDA_EDITOR=1
set PORT=3123
set DB_PATH=:memory:
if not exist assets-originais mkdir assets-originais
start "" http://localhost:3123/corrida/?editor=interlagos
node server.js
