-- Fix RLS policies: remove dependency on unset session variable app.region
-- The client already scopes queries by region column; auth.uid() is sufficient for MVP.

DROP POLICY IF EXISTS user_notebooks ON notebooks;
DROP POLICY IF EXISTS user_sheets ON sheets;
DROP POLICY IF EXISTS user_rows ON rows;

CREATE POLICY user_notebooks ON notebooks
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_sheets ON sheets
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM notebooks
      WHERE id = sheets.notebook_id
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM notebooks
      WHERE id = sheets.notebook_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY user_rows ON rows
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sheets
      JOIN notebooks ON notebooks.id = sheets.notebook_id
      WHERE sheets.id = rows.sheet_id
      AND notebooks.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sheets
      JOIN notebooks ON notebooks.id = sheets.notebook_id
      WHERE sheets.id = rows.sheet_id
      AND notebooks.user_id = auth.uid()
    )
  );
