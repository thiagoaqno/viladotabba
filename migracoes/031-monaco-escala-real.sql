-- Corrida: Mônaco ficou em escala real (a volta passou de 3 169 m para os 3 337 m do circuito, e a pista de 17,5 m para 9,2 m entre as bordas do asfalto): as voltas, os recordes e os melhores
-- setores guardados são do traçado antigo, menor e mais largo, e não valem mais. O quadro de Mônaco recomeça.
DELETE FROM corrida_voltas WHERE pista = 'monaco';
DELETE FROM corrida_recordes WHERE pista = 'monaco';
DELETE FROM corrida_voltas_piloto WHERE pista = 'monaco';
DELETE FROM corrida_setores WHERE pista = 'monaco';
