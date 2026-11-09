-- Corrida: Bahrein ficou em escala real (a volta passou de 2900 m para os 5413 m do circuito): as voltas, os recordes e os melhores setores
-- guardados são do traçado antigo, menor, e não valem mais. O quadro de Bahrein recomeça.
DELETE FROM corrida_voltas WHERE pista = 'bahrein';
DELETE FROM corrida_recordes WHERE pista = 'bahrein';
DELETE FROM corrida_voltas_piloto WHERE pista = 'bahrein';
DELETE FROM corrida_setores WHERE pista = 'bahrein';
