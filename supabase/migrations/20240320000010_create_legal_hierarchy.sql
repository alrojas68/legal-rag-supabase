-- Crear tabla para la jerarquía legal
CREATE TABLE legal_hierarchy (
  hierarchy_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(document_id) ON DELETE CASCADE,
  hierarchy_level INTEGER NOT NULL CHECK (hierarchy_level BETWEEN 1 AND 7),
  hierarchy_name VARCHAR(255) NOT NULL,
  legal_document_name VARCHAR(500) NOT NULL,
  legal_document_short_name VARCHAR(100),
  legal_document_code VARCHAR(50),
  parent_hierarchy_id UUID REFERENCES legal_hierarchy(hierarchy_id),
  jurisdiction VARCHAR(100) CHECK (jurisdiction IN ('Federal', 'Estatal', 'Municipal', 'Internacional')),
  effective_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para optimizar búsquedas
CREATE INDEX idx_legal_hierarchy_level ON legal_hierarchy(hierarchy_level);
CREATE INDEX idx_legal_hierarchy_document ON legal_hierarchy(document_id);
CREATE INDEX idx_legal_hierarchy_code ON legal_hierarchy(legal_document_code);
CREATE INDEX idx_legal_hierarchy_name ON legal_hierarchy(legal_document_name);
CREATE INDEX idx_legal_hierarchy_jurisdiction ON legal_hierarchy(jurisdiction);

-- Agregar campos a la tabla chunks para referencias legales
ALTER TABLE chunks ADD COLUMN hierarchy_id UUID REFERENCES legal_hierarchy(hierarchy_id) ON DELETE CASCADE;
ALTER TABLE chunks ADD COLUMN legal_document_name VARCHAR(500);
ALTER TABLE chunks ADD COLUMN legal_document_code VARCHAR(50);
ALTER TABLE chunks ADD COLUMN article_number VARCHAR(50);
ALTER TABLE chunks ADD COLUMN section_number VARCHAR(50);
ALTER TABLE chunks ADD COLUMN paragraph_number VARCHAR(50);

-- Crear índices para los nuevos campos en chunks
CREATE INDEX idx_chunks_hierarchy ON chunks(hierarchy_id);
CREATE INDEX idx_chunks_document_code ON chunks(legal_document_code);
CREATE INDEX idx_chunks_article ON chunks(article_number);
CREATE INDEX idx_chunks_document_name ON chunks(legal_document_name);

-- Crear tabla de mapeo de niveles jerárquicos
CREATE TABLE hierarchy_levels (
  level_id INTEGER PRIMARY KEY,
  level_name VARCHAR(100) NOT NULL,
  level_description TEXT,
  priority_weight DECIMAL(3,2) DEFAULT 1.00
);

-- Insertar los niveles jerárquicos definidos
INSERT INTO hierarchy_levels (level_id, level_name, level_description, priority_weight) VALUES
(1, 'Constitución Política', 'Constitución Política de los Estados Unidos Mexicanos (Ley Suprema)', 1.00),
(2, 'Tratados Internacionales', 'Tratados Internacionales (especialmente de derechos humanos, rango cuasi-constitucional)', 0.95),
(3, 'Leyes Federales', 'Código Civil Federal y otras leyes federales', 0.90),
(4, 'Códigos Estatales', 'Códigos Civiles Estatales (uno por cada estado)', 0.85),
(5, 'Reglamentos', 'Reglamentos (como el Reglamento del Registro Civil)', 0.80),
(6, 'Normas Oficiales Mexicanas', 'NOMs (relevancia limitada en derecho civil)', 0.70),
(7, 'Normas Individualizadas', 'Sentencias, contratos, testamentos', 0.60);

-- Crear función para actualizar el timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar updated_at
CREATE TRIGGER update_legal_hierarchy_updated_at 
    BEFORE UPDATE ON legal_hierarchy 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Crear vista para facilitar consultas jerárquicas
CREATE VIEW legal_documents_hierarchy AS
SELECT 
  d.document_id,
  d.source,
  d.created_at as document_created,
  lh.hierarchy_id,
  lh.hierarchy_level,
  hl.level_name,
  hl.priority_weight,
  lh.legal_document_name,
  lh.legal_document_short_name,
  lh.legal_document_code,
  lh.jurisdiction,
  lh.effective_date,
  lh.is_active,
  COUNT(c.chunk_id) as total_chunks
FROM documents d
LEFT JOIN legal_hierarchy lh ON d.document_id = lh.document_id
LEFT JOIN hierarchy_levels hl ON lh.hierarchy_level = hl.level_id
LEFT JOIN chunks c ON lh.hierarchy_id = c.hierarchy_id
GROUP BY d.document_id, d.source, d.created_at, lh.hierarchy_id, lh.hierarchy_level, 
         hl.level_name, hl.priority_weight, lh.legal_document_name, lh.legal_document_short_name, 
         lh.legal_document_code, lh.jurisdiction, lh.effective_date, lh.is_active; 