-- Agregar campo document_type a la tabla legal_hierarchy
ALTER TABLE legal_hierarchy 
ADD COLUMN document_type VARCHAR(100) CHECK (
  document_type IN (
    'Constitución',
    'Tratado Internacional', 
    'Ley Federal',
    'Constitución Local',
    'Ley Estatal',
    'Reglamento',
    'Norma Oficial Mexicana',
    'Decretos, Acuerdos y Circular Administrativa',
    'Jurisprudencia',
    'Acto Jurídico',
    'Norma Consuetudinaria'
  )
);

-- Crear índice para optimizar búsquedas por tipo de documento
CREATE INDEX idx_legal_hierarchy_document_type ON legal_hierarchy(document_type);

-- Crear tabla de mapeo de tipos de documento con sus niveles jerárquicos
CREATE TABLE document_type_hierarchy (
  document_type VARCHAR(100) PRIMARY KEY,
  hierarchy_level INTEGER NOT NULL,
  description TEXT,
  examples TEXT,
  priority_weight DECIMAL(3,2) DEFAULT 1.00
);

-- Insertar los tipos de documento con su jerarquía
INSERT INTO document_type_hierarchy (document_type, hierarchy_level, description, examples, priority_weight) VALUES
('Constitución', 1, 'Constitución Política de los Estados Unidos Mexicanos - Ley Suprema', 'CPEUM', 1.00),
('Tratado Internacional', 2, 'Tratados Internacionales con rango cuasi-constitucional', 'Convención Americana de Derechos Humanos, Pacto Internacional de Derechos Civiles y Políticos', 0.95),
('Ley Federal', 3, 'Códigos Federales y Leyes Generales', 'Código Civil Federal, Ley Federal del Trabajo, Código Penal Federal', 0.90),
('Constitución Local', 4, 'Constituciones de los Estados y CDMX', 'Constitución Política de la Ciudad de México', 0.85),
('Ley Estatal', 5, 'Códigos y Leyes Estatales', 'Código Civil de la CDMX, Código Civil del Estado de México', 0.80),
('Reglamento', 6, 'Reglamentos Federales y Estatales', 'Reglamento del Registro Civil, Reglamento de Notarías', 0.75),
('Norma Oficial Mexicana', 7, 'NOMs emitidas por dependencias federales', 'NOM-001-SSA3-2012, NOM-006-SCFI-2014', 0.70),
('Decretos, Acuerdos y Circular Administrativa', 8, 'Instrumentos administrativos de aplicación', 'Decretos presidenciales, Acuerdos de la SCJN, Circulares administrativas', 0.65),
('Jurisprudencia', 9, 'Precedentes judiciales obligatorios', 'Jurisprudencia de la SCJN, Tesis aisladas', 0.60),
('Acto Jurídico', 10, 'Documentos particulares con efectos legales', 'Contratos, testamentos, convenios', 0.55),
('Norma Consuetudinaria', 11, 'Usos y costumbres reconocidos legalmente', 'Costumbres mercantiles, usos locales', 0.50);

-- Eliminar la vista existente antes de recrearla
DROP VIEW IF EXISTS legal_documents_hierarchy;

-- Crear vista actualizada que incluya el tipo de documento
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
  lh.document_type,
  dth.description as document_type_description,
  dth.examples as document_type_examples,
  lh.jurisdiction,
  lh.effective_date,
  lh.is_active,
  COUNT(c.chunk_id) as total_chunks
FROM documents d
LEFT JOIN legal_hierarchy lh ON d.document_id = lh.document_id
LEFT JOIN hierarchy_levels hl ON lh.hierarchy_level = hl.level_id
LEFT JOIN document_type_hierarchy dth ON lh.document_type = dth.document_type
LEFT JOIN chunks c ON lh.hierarchy_id = c.hierarchy_id
GROUP BY d.document_id, d.source, d.created_at, lh.hierarchy_id, lh.hierarchy_level, 
         hl.level_name, hl.priority_weight, lh.legal_document_name, lh.legal_document_short_name, 
         lh.legal_document_code, lh.document_type, dth.description, dth.examples,
         lh.jurisdiction, lh.effective_date, lh.is_active; 