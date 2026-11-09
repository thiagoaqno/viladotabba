-- Corrida: Abu Dhabi ficou em escala real (a volta passou de 2888 m para os 5280 m do circuito): as voltas, os recordes e os melhores setores
-- guardados são do traçado antigo, menor, e não valem mais. O quadro de Abu Dhabi recomeça.
DELETE FROM corrida_voltas WHERE pista = 'abudhabi';
DELETE FROM corrida_recordes WHERE pista = 'abudhabi';
DELETE FROM corrida_voltas_piloto WHERE pista = 'abudhabi';
DELETE FROM corrida_setores WHERE pista = 'abudhabi';
