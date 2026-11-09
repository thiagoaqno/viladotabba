-- Corrida: Xangai ficou em escala real (a volta passou de 3347 m para os 5452 m do circuito): as voltas, os recordes e os melhores setores
-- guardados são do traçado antigo, menor, e não valem mais. O quadro de Xangai recomeça.
DELETE FROM corrida_voltas WHERE pista = 'xangai';
DELETE FROM corrida_recordes WHERE pista = 'xangai';
DELETE FROM corrida_voltas_piloto WHERE pista = 'xangai';
DELETE FROM corrida_setores WHERE pista = 'xangai';
