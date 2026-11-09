-- Corrida: Catar ficou em escala real (a volta passou de 2933 m para os 5419 m do circuito): as voltas, os recordes e os melhores setores
-- guardados são do traçado antigo, menor, e não valem mais. O quadro de Catar recomeça.
DELETE FROM corrida_voltas WHERE pista = 'catar';
DELETE FROM corrida_recordes WHERE pista = 'catar';
DELETE FROM corrida_voltas_piloto WHERE pista = 'catar';
DELETE FROM corrida_setores WHERE pista = 'catar';
