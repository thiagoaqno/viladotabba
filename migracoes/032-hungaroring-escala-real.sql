-- Corrida: o Hungaroring ficou em escala real (a volta passou de 2 722 m para os 4 381 m do circuito, e a pista de 25 m para 12 m): as voltas, os recordes e os melhores
-- setores guardados são do traçado antigo, menor e mais largo, e não valem mais. O quadro do Hungaroring recomeça.
DELETE FROM corrida_voltas WHERE pista = 'hungaroring';
DELETE FROM corrida_recordes WHERE pista = 'hungaroring';
DELETE FROM corrida_voltas_piloto WHERE pista = 'hungaroring';
DELETE FROM corrida_setores WHERE pista = 'hungaroring';
