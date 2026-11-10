-- Corrida: Baku ficou em escala real (a cidade inteira, pista e cenário, na régua da física; a volta passou de 2 947 m para 5 872 m): as voltas,
-- os recordes e os melhores setores guardados são do traçado antigo, menor, e não valem mais. O quadro de Baku recomeça.
DELETE FROM corrida_voltas WHERE pista = 'baku';
DELETE FROM corrida_recordes WHERE pista = 'baku';
DELETE FROM corrida_voltas_piloto WHERE pista = 'baku';
DELETE FROM corrida_setores WHERE pista = 'baku';
