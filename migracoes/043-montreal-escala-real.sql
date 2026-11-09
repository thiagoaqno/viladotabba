-- Corrida: Montreal ficou em escala real (a volta passou de 2708 m para os 4361 m do circuito): as voltas, os recordes e os melhores setores
-- guardados são do traçado antigo, menor, e não valem mais. O quadro de Montreal recomeça.
DELETE FROM corrida_voltas WHERE pista = 'montreal';
DELETE FROM corrida_recordes WHERE pista = 'montreal';
DELETE FROM corrida_voltas_piloto WHERE pista = 'montreal';
DELETE FROM corrida_setores WHERE pista = 'montreal';
