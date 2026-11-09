-- Corrida: Spa-Francorchamps ficou em escala real (a volta passou de 3 634 m para os 6 977 m do circuito, e a pista de 25 m para 12 m): as voltas, os recordes e os melhores
-- setores guardados são do traçado antigo, menor e mais largo, e não valem mais. O quadro de Spa recomeça.
DELETE FROM corrida_voltas WHERE pista = 'spa';
DELETE FROM corrida_recordes WHERE pista = 'spa';
DELETE FROM corrida_voltas_piloto WHERE pista = 'spa';
DELETE FROM corrida_setores WHERE pista = 'spa';
