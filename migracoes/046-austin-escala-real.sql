-- Corrida: Austin ficou em escala real (a volta passou de 3388 m para os 5513 m do circuito): as voltas, os recordes e os melhores setores
-- guardados são do traçado antigo, menor, e não valem mais. O quadro de Austin recomeça.
DELETE FROM corrida_voltas WHERE pista = 'austin';
DELETE FROM corrida_recordes WHERE pista = 'austin';
DELETE FROM corrida_voltas_piloto WHERE pista = 'austin';
DELETE FROM corrida_setores WHERE pista = 'austin';
