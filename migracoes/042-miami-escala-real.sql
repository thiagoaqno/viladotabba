-- Corrida: Miami ficou em escala real (a volta passou de 2895 m para os 5412 m do circuito): as voltas, os recordes e os melhores setores
-- guardados são do traçado antigo, menor, e não valem mais. O quadro de Miami recomeça.
DELETE FROM corrida_voltas WHERE pista = 'miami';
DELETE FROM corrida_recordes WHERE pista = 'miami';
DELETE FROM corrida_voltas_piloto WHERE pista = 'miami';
DELETE FROM corrida_setores WHERE pista = 'miami';
