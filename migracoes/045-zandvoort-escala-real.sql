-- Corrida: Zandvoort ficou em escala real (a volta passou de 2691 m para os 4259 m do circuito): as voltas, os recordes e os melhores setores
-- guardados são do traçado antigo, menor, e não valem mais. O quadro de Zandvoort recomeça.
DELETE FROM corrida_voltas WHERE pista = 'zandvoort';
DELETE FROM corrida_recordes WHERE pista = 'zandvoort';
DELETE FROM corrida_voltas_piloto WHERE pista = 'zandvoort';
DELETE FROM corrida_setores WHERE pista = 'zandvoort';
