-- Corrida: Barcelona ficou em escala real (traçado real de es-1991, layout atual sem chicane; a volta passou de 2890 m para os 4657 m do circuito): as voltas, os recordes e os
-- melhores setores guardados são do traçado antigo, menor, e não valem mais. O quadro de Barcelona recomeça.
DELETE FROM corrida_voltas WHERE pista = 'barcelona';
DELETE FROM corrida_recordes WHERE pista = 'barcelona';
DELETE FROM corrida_voltas_piloto WHERE pista = 'barcelona';
DELETE FROM corrida_setores WHERE pista = 'barcelona';
