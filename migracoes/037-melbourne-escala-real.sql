-- Corrida: Melbourne ficou em escala real (a volta passou de 2897 m para os 5278 m do circuito): as voltas, os recordes e os melhores setores
-- guardados são do traçado antigo, menor, e não valem mais. O quadro de Melbourne recomeça.
DELETE FROM corrida_voltas WHERE pista = 'melbourne';
DELETE FROM corrida_recordes WHERE pista = 'melbourne';
DELETE FROM corrida_voltas_piloto WHERE pista = 'melbourne';
DELETE FROM corrida_setores WHERE pista = 'melbourne';
