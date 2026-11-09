-- Corrida: Jeddah ficou em escala real (a volta passou de 3066 m para os 6174 m do circuito): as voltas, os recordes e os melhores setores
-- guardados são do traçado antigo, menor, e não valem mais. O quadro de Jeddah recomeça.
DELETE FROM corrida_voltas WHERE pista = 'jeddah';
DELETE FROM corrida_recordes WHERE pista = 'jeddah';
DELETE FROM corrida_voltas_piloto WHERE pista = 'jeddah';
DELETE FROM corrida_setores WHERE pista = 'jeddah';
