-- Corrida: Silverstone ficou em escala real (a volta passou de 3038 m para os 5892 m do circuito): as voltas, os recordes e os melhores setores
-- guardados são do traçado antigo, menor, e não valem mais. O quadro de Silverstone recomeça.
DELETE FROM corrida_voltas WHERE pista = 'silverstone';
DELETE FROM corrida_recordes WHERE pista = 'silverstone';
DELETE FROM corrida_voltas_piloto WHERE pista = 'silverstone';
DELETE FROM corrida_setores WHERE pista = 'silverstone';
