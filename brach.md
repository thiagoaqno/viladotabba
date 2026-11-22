# Quatro engenheiros no rádio, para escolher a voz

Pedido do Thiago (2026-11-21): "e se a gente criasse 4 tipos de treinadores? aí podemos escolher a voz; posso gerar com a ElevenLabs".

- `radio.js`: `ENGENHEIROS` são Jeff (o de sempre, `radio/<fala>.mp3`), Marcos (veterano, calmo), Bia (empolgada) e Rafa (técnico, direto), em `radio/<engenheiro>/<fala>.mp3`.
  - As falas são as mesmas: a personalidade é a voz que o Thiago escolher.
  - A fala que o escolhido ainda não tem toca com o Jeff. O observador (`spot*`) é sempre a voz dele.
  - A escolha fica no navegador (`corrida:engenheiro`).
- `configuracoes.js` (Áudio, Rádio): "Engenheiro", com os quatro. Ao trocar, toca uma fala de boas-vindas para ouvir a voz.
- `ferramentas/radio-engenheiro.js --pasta <engenheiro>`: grava em `radio/<engenheiro>/`, sem as falas do observador. São 957 falas, ~35,5 mil caracteres por engenheiro.
- `VOZES-ENGENHEIROS.bat` (CRLF): escolhe o engenheiro, mostra quanto vai gastar, pede o Voice ID e a chave (sem mostrar) e gera só as que faltam. O atalho fica fora do repositório: `Downloads\lts\Vozes dos engenheiros.bat`, em `klk\falas`.
- Não foi ouvido: as vozes ainda não existem.
