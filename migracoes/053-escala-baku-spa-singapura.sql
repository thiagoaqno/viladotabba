-- Corrida: Spa e Singapura no meio-termo (2026-11-12), a proporção da Baku: 2,37 unidades por metro de pista real e largura 96.
-- Spa fica 5% mais curta e mais estreita (120 -> 96); Singapura, 38% mais curta e mais larga (84 -> 96). As voltas de antes não valem mais.
DELETE FROM corrida_voltas WHERE pista = 'spa';
DELETE FROM corrida_recordes WHERE pista = 'spa';
DELETE FROM corrida_voltas_piloto WHERE pista = 'spa';
DELETE FROM corrida_setores WHERE pista = 'spa';
DELETE FROM corrida_voltas WHERE pista = 'singapura';
DELETE FROM corrida_recordes WHERE pista = 'singapura';
DELETE FROM corrida_voltas_piloto WHERE pista = 'singapura';
DELETE FROM corrida_setores WHERE pista = 'singapura';
