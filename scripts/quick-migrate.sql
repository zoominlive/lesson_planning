-- Add new columns to activities table if they don't exist
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS age_group_ids JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Drop teaching_objectives column if it exists (we're using milestones now)
ALTER TABLE activities 
DROP COLUMN IF EXISTS teaching_objectives;

-- Create new tables for activity tracking
CREATE TABLE IF NOT EXISTS activity_usage (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id),
  activity_id VARCHAR NOT NULL REFERENCES activities(id),
  teacher_id VARCHAR NOT NULL REFERENCES users(id),
  room_id VARCHAR NOT NULL REFERENCES rooms(id),
  used_at TIMESTAMP DEFAULT NOW() NOT NULL,
  duration INTEGER,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS activity_reviews (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id),
  activity_id VARCHAR NOT NULL REFERENCES activities(id),
  teacher_id VARCHAR NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL,
  comment TEXT,
  engagement_level INTEGER,
  difficulty_level INTEGER,
  would_recommend BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Migrate existing age range data to age_group_ids (set a default for now)
UPDATE activities 
SET age_group_ids = '[]'::jsonb
WHERE age_group_ids IS NULL;

-- Convert existing string instructions to new format
UPDATE activities 
SET instructions = 
  CASE 
    WHEN instructions IS NULL THEN '[]'::jsonb
    WHEN jsonb_typeof(instructions) = 'array' AND jsonb_array_length(instructions) > 0 AND jsonb_typeof(instructions->0) = 'string' THEN
      (SELECT jsonb_agg(jsonb_build_object('text', elem))
       FROM jsonb_array_elements_text(instructions) AS elem)
    ELSE instructions
  END;