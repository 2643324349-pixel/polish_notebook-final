-- Row-level marker color for sheet highlighting
ALTER TABLE rows
  ADD COLUMN IF NOT EXISTS marker_color TEXT;
