-- Agregar columnas para guardar el tipo seleccionado por el usuario y el sugerido por la IA
ALTER TABLE legal_hierarchy
  ADD COLUMN user_selected_type VARCHAR(100),
  ADD COLUMN ia_suggested_type VARCHAR(100);

-- Opcional: crear índices para búsquedas futuras
CREATE INDEX IF NOT EXISTS idx_legal_hierarchy_user_selected_type ON legal_hierarchy(user_selected_type);
CREATE INDEX IF NOT EXISTS idx_legal_hierarchy_ia_suggested_type ON legal_hierarchy(ia_suggested_type); 