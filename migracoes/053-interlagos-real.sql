-- Corrida: Interlagos troca o desenho à mão (que andava no sentido errado) pelo traçado real, anti-horário, na escala antiga (2026-11-12).
-- As voltas, os recordes e os setores do traçado velho não valem no novo.
DELETE FROM corrida_voltas WHERE pista = 'interlagos';
DELETE FROM corrida_recordes WHERE pista = 'interlagos';
DELETE FROM corrida_voltas_piloto WHERE pista = 'interlagos';
DELETE FROM corrida_setores WHERE pista = 'interlagos';
