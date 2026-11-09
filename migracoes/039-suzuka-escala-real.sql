-- Corrida: Suzuka ficou em escala real (a volta passou de 2986 m para os 5808 m do circuito): as voltas, os recordes e os melhores setores
-- guardados são do traçado antigo, menor, e não valem mais. O quadro de Suzuka recomeça.
DELETE FROM corrida_voltas WHERE pista = 'suzuka';
DELETE FROM corrida_recordes WHERE pista = 'suzuka';
DELETE FROM corrida_voltas_piloto WHERE pista = 'suzuka';
DELETE FROM corrida_setores WHERE pista = 'suzuka';
