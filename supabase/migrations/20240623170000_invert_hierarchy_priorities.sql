-- INVERTIR LA JERARQUÍA LEGAL: Códigos Estatales tendrán prioridad máxima, Constitución prioridad mínima

-- Actualizar los pesos de prioridad (INVERTIDOS)
UPDATE hierarchy_levels SET priority_weight = 0.60 WHERE level_id = 1; -- Constitución Política (prioridad mínima)
UPDATE hierarchy_levels SET priority_weight = 0.65 WHERE level_id = 2; -- Tratados Internacionales
UPDATE hierarchy_levels SET priority_weight = 0.70 WHERE level_id = 3; -- Leyes Federales
UPDATE hierarchy_levels SET priority_weight = 1.00 WHERE level_id = 4; -- Códigos Estatales (prioridad máxima)
UPDATE hierarchy_levels SET priority_weight = 0.95 WHERE level_id = 5; -- Reglamentos
UPDATE hierarchy_levels SET priority_weight = 0.80 WHERE level_id = 6; -- Normas Oficiales Mexicanas
UPDATE hierarchy_levels SET priority_weight = 0.75 WHERE level_id = 7; -- Normas Individualizadas

-- Crear una función para obtener la prioridad correcta basada en el tipo de documento
CREATE OR REPLACE FUNCTION get_document_priority(source_name TEXT)
RETURNS DECIMAL(3,2) AS $$
BEGIN
    -- PRIORIDAD MÁXIMA: Leyes Estatales y Códigos Civiles Estatales
    IF source_name ILIKE '%ley-%' AND (source_name ILIKE '%ciudad-de-mexico%' OR source_name ILIKE '%distrito-federal%') THEN
        RETURN 1.00;
    ELSIF source_name ILIKE '%codigo-civil%' AND (source_name ILIKE '%distrito-federal%' OR source_name ILIKE '%ciudad-de-mexico%') THEN
        RETURN 1.00;
    ELSIF source_name ILIKE '%codigo-civil-para-el-distrito-federal%' THEN
        RETURN 1.00;
    
    -- PRIORIDAD ALTA: Constitución Local
    ELSIF source_name ILIKE '%constitucion-politica-de-la-ciudad-de-mexico%' THEN
        RETURN 0.95;
    
    -- PRIORIDAD MEDIA: Leyes Federales
    ELSIF source_name ILIKE '%codigo-civil-federal%' OR source_name ILIKE '%codigo-nacional%' OR source_name ILIKE '%codigo-federal%' THEN
        RETURN 0.70;
    
    -- PRIORIDAD BAJA: Constitución Federal
    ELSIF source_name ILIKE '%constitucion-politica-estados-unidos-mexicanos%' THEN
        RETURN 0.60;
    
    -- PRIORIDAD MÍNIMA: Otros documentos
    ELSE
        RETURN 0.50;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Crear un índice para optimizar las búsquedas por prioridad
CREATE INDEX IF NOT EXISTS idx_documents_priority ON documents(source) WHERE source IS NOT NULL; 