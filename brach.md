# Tiro da Galera: cada um escolhe a voz do narrador

O Thiago preferiu que cada jogador escolha a voz do narrador, em vez de ela depender da classe.

## O que mudou

- **Opções > Áudio > "Voz do narrador"**, logo acima de "Volume da voz do rádio": Narrador 1, 2, 3 ou 4, ou "Pela classe da
  arma", que é o jeito de antes. O padrão é o Narrador 1.
- **Os nomes** vêm do campo `nome` de `ferramentas/tiro-vozes/vozes.json`: dá para trocar ali e rodar o
  `ferramentas/tiro-frontline.js` de novo.
- **O pacote da voz escolhida** só é baixado quando ela é escolhida (ou ao nascer, no modo "pela classe"). Até chegar, o anúncio
  sai no Narrador 1.
- **A escolha fica nos ajustes** (`dc_settings.vozNarr`), então vai junto com o perfil da Vila.

## Conferido no navegador

- O seletor apareceu na aba Áudio, começando no Narrador 1.
- Escolhendo o Narrador 3, o pacote dele carregou e o anúncio passou a sair nele (`vp_uav_on`).
- O Narrador 1 usa a voz padrão (`v_uav_on`).
- "Pela classe" com a classe Assalto (M4) cai na voz padrão, como antes.
