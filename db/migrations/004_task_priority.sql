ALTER TABLE tasks ADD COLUMN priority text NOT NULL DEFAULT 'normal'
  CHECK (priority IN ('low', 'normal', 'high'));
