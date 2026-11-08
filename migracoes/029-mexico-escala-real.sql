-- Corrida: a Cidade do México ficou em escala real (a volta passou de 2 675 m para os 4 304 m do autódromo, e a pista de 25 m para 14 m): as voltas, os recordes e os melhores
-- setores guardados são do traçado antigo, menor e mais largo, e não valem mais. O quadro da Cidade do México recomeça.
DELETE FROM corrida_voltas WHERE pista = 'mexico';
DELETE FROM corrida_recordes WHERE pista = 'mexico';
DELETE FROM corrida_voltas_piloto WHERE pista = 'mexico';
DELETE FROM corrida_setores WHERE pista = 'mexico';
