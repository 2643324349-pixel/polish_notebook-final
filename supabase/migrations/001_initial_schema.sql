-- ============================================
-- Polish Notebook - Initial Schema
-- Based on docs/02_data_model.md
-- ============================================

-- --------------------------------------------
-- 1. Notebooks
-- --------------------------------------------
CREATE TABLE notebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  region TEXT NOT NULL CHECK (region IN ('global', 'cn')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notebooks_user_id ON notebooks(user_id);
CREATE INDEX idx_notebooks_region ON notebooks(region);

-- --------------------------------------------
-- 2. Sheets
-- --------------------------------------------
CREATE TABLE sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notebook_id UUID NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
  title TEXT DEFAULT '无标题页',
  columns_config JSONB NOT NULL,
  rows_order UUID[] DEFAULT '{}',
  frozen_config JSONB DEFAULT '{"freeze_rows": 1, "freeze_cols": 1}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sheets_notebook_id ON sheets(notebook_id);

-- --------------------------------------------
-- 3. Rows
-- --------------------------------------------
CREATE TABLE rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id UUID NOT NULL REFERENCES sheets(id) ON DELETE CASCADE,
  cells_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_rows_sheet_id ON rows(sheet_id);

-- --------------------------------------------
-- 4. updated_at 自动更新触发器
-- --------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notebooks_updated_at
  BEFORE UPDATE ON notebooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_sheets_updated_at
  BEFORE UPDATE ON sheets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_rows_updated_at
  BEFORE UPDATE ON rows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- --------------------------------------------
-- 5. Row Level Security (RLS)
-- --------------------------------------------
ALTER TABLE notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE rows ENABLE ROW LEVEL SECURITY;

-- Notebooks: 用户只能访问自己的笔记本，且只能访问本区域数据
CREATE POLICY user_notebooks ON notebooks
  FOR ALL USING (
    auth.uid() = user_id
    AND region = current_setting('app.region', true)
  );

-- Sheets: 通过 notebook_id 关联用户
CREATE POLICY user_sheets ON sheets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM notebooks
      WHERE id = sheets.notebook_id
      AND user_id = auth.uid()
      AND region = current_setting('app.region', true)
    )
  );

-- Rows: 通过 sheet_id 关联用户
CREATE POLICY user_rows ON rows
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sheets
      JOIN notebooks ON notebooks.id = sheets.notebook_id
      WHERE sheets.id = rows.sheet_id
      AND notebooks.user_id = auth.uid()
      AND notebooks.region = current_setting('app.region', true)
    )
  );
