-- Add AI-generated fields to activities table
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS objectives JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS preparation_time INTEGER,
ADD COLUMN IF NOT EXISTS safety_considerations JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS space_required TEXT,
ADD COLUMN IF NOT EXISTS group_size TEXT,
ADD COLUMN IF NOT EXISTS mess_level TEXT,
ADD COLUMN IF NOT EXISTS variations JSONB DEFAULT '[]';

-- Update any existing activities to have empty arrays for the JSON fields
UPDATE activities 
SET 
  objectives = COALESCE(objectives, '[]'::jsonb),
  safety_considerations = COALESCE(safety_considerations, '[]'::jsonb),
  variations = COALESCE(variations, '[]'::jsonb)
WHERE objectives IS NULL OR safety_considerations IS NULL OR variations IS NULL;