-- Corrida: Red Bull Ring ficou em escala real (a volta passou de 2693 m para os 4318 m do circuito): as voltas, os recordes e os melhores setores
-- guardados são do traçado antigo, menor, e não valem mais. O quadro de Red Bull Ring recomeça.
DELETE FROM corrida_voltas WHERE pista = 'redbullring';
DELETE FROM corrida_recordes WHERE pista = 'redbullring';
DELETE FROM corrida_voltas_piloto WHERE pista = 'redbullring';
DELETE FROM corrida_setores WHERE pista = 'redbullring';
