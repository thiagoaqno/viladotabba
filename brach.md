# MFD: o pedido de voz entendido fica verde e o MFD fecha

O Thiago pediu: ao falar com o engenheiro, a opção que ele entendeu fica verde no MFD por 2 s, e depois o MFD fecha.

- **`mfd.js` (`confirmarPedido`, chamado no começo de `executarJeff`):**
  - acha na aba Pedidos o botão do comando entendido, pelo tipo e pelo composto do pneu quando há;
  - acende o botão em verde;
  - 2 s depois tira o verde e, se o MFD ainda está nos Pedidos, faz ele descer.
  - Um comando novo antes dos 2 s troca a opção acesa.
- **`hud-mfd.css`:** o verde, com brilho e um pulinho na entrada. Vale nos dois tipos de MFD.
- **Pedido não entendido:** nada acende, e o engenheiro continua dizendo que não entendeu.
