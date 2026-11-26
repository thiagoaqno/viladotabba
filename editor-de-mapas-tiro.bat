@echo off
title Editor de mapas do Tiro
rem O editor de mapas do Tiro da Galera: abre o servidor do jogo com o editor ligado e o navegador no editor.
rem Os mapas salvos vao para ferramentas\tiro-mapas\editor\<id>.json. Guia: docs\tiro-editor-de-mapas.md
cd /d "%~dp0"
set CORRIDA_EDITOR=1
set PORT=3125
set DB_PATH=:memory:
start "" http://localhost:3125/tiro/?editor=1
node server.js
