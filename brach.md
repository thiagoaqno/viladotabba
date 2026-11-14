# Rodas presas na suspensão quando o carro baixa

Pelo print do Thiago (câmera de cockpit da Mercedes): quando o carro baixa, as rodas da frente saíam dos braços da suspensão.

**Por quê:** em `carros.js` (`poseKart`), só a carroceria descia, e com 3 × o curso calculado (`SUSP_VER = 3`); as rodas subiam o mesmo tanto para ficar no chão. Os braços da suspensão são da carroceria, então a roda se afastava deles. Pelas contas de `sim.js` (`afundaAero` até 0,045 × força da asa × 1,6, mais a pancada de 0,03 e a diferença de altura do acerto de 0,025 m), o desenho chegava a descer uns 37 cm.

**Agora:**
- o curso desenhado é o calculado (`SUSP_VER = 1`), no máximo 6 cm (`SUSP_MAX`);
- as rodas descem com o carro, presas nos braços: sobem em relação a ele no máximo 3 cm (`RODA_CURSO`, o curso que se vê);
- o que faltar o pneu amassa (escala vertical em volta do centro da roda, no mínimo 85 %), e a base fica no chão.

**E conserta o `novidades.json` da `main`:** o merge do #728 com o #729 juntou as duas entradas sem fechar a primeira (faltava o `]`, `},` e `{`), e o JSON não abria. Conferido com `JSON.parse`.

O raspar do assoalho, as faíscas e a pancada continuam com a conta de `sim.js`, sem mudança.

Conferido só com `node --check` (`carros.js`) e o `JSON.parse` do `novidades.json`. O teste jogando é do Thiago.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
