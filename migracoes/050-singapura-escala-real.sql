-- Corrida: Singapura ficou em escala real (a cidade inteira, pista e cenário, na régua da física; a volta passou de 3877 m para 4 920 m): as
-- voltas, os recordes e os melhores setores guardados são do traçado antigo, menor, e não valem mais. O quadro de Singapura recomeça.
DELETE FROM corrida_voltas WHERE pista = 'singapura';
DELETE FROM corrida_recordes WHERE pista = 'singapura';
DELETE FROM corrida_voltas_piloto WHERE pista = 'singapura';
DELETE FROM corrida_setores WHERE pista = 'singapura';
