-- Corrida: Monza ficou em escala real (traçado real de it-1922; a volta passou de 3100 m para os 5793 m do circuito): as voltas, os recordes e os melhores setores
-- guardados são do traçado antigo, menor, e não valem mais. O quadro de Monza recomeça.
DELETE FROM corrida_voltas WHERE pista = 'monza';
DELETE FROM corrida_recordes WHERE pista = 'monza';
DELETE FROM corrida_voltas_piloto WHERE pista = 'monza';
DELETE FROM corrida_setores WHERE pista = 'monza';
