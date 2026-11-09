-- Corrida: Madri ficou em escala real (a volta passou de 2897 m para os 5470 m do circuito): as voltas, os recordes e os melhores setores
-- guardados são do traçado antigo, menor, e não valem mais. O quadro de Madri recomeça.
DELETE FROM corrida_voltas WHERE pista = 'madri';
DELETE FROM corrida_recordes WHERE pista = 'madri';
DELETE FROM corrida_voltas_piloto WHERE pista = 'madri';
DELETE FROM corrida_setores WHERE pista = 'madri';
