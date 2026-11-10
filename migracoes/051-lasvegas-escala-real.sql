-- Corrida: Las Vegas ficou em escala real (a cidade inteira, pista e cenário, na régua da física; a volta passou de 3 091 m para 6 195 m): as
-- voltas, os recordes e os melhores setores guardados são do traçado antigo, menor, e não valem mais. O quadro de Las Vegas recomeça.
DELETE FROM corrida_voltas WHERE pista = 'lasvegas';
DELETE FROM corrida_recordes WHERE pista = 'lasvegas';
DELETE FROM corrida_voltas_piloto WHERE pista = 'lasvegas';
DELETE FROM corrida_setores WHERE pista = 'lasvegas';
