@echo off
title Livery Studio
rem Livery Studio: o editor de pinturas dos carros (irmao do TabbaTracks). Abre o servidor com o editor ligado e o navegador no estudio.
rem Salvar grava public\corrida\pinturas; o Publicar do TabbaTracks manda para o GitHub.
cd /d "%~dp0"
set CORRIDA_EDITOR=1
set PORT=3123
set DB_PATH=:memory:
start "" http://localhost:3123/corrida/livery.html
node server.js
