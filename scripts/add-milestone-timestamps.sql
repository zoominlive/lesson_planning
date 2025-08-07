-- Add timestamp and status fields to milestones table
ALTER TABLE milestones 
ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'active' NOT NULL,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW() NOT NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Update existing records to have the default status and timestamps
UPDATE milestones 
SET 
  status = 'active',
  created_at = COALESCE(created_at, NOW()),
  updated_at = COALESCE(updated_at, NOW())
WHERE status IS NULL OR created_at IS NULL OR updated_at IS NULL;

-- Create an index for better performance on soft delete queries
CREATE INDEX IF NOT EXISTS idx_milestones_status_deleted ON milestones(status, deleted_at);
CREATE INDEX IF NOT EXISTS idx_milestones_tenant_status ON milestones(tenant_id, status);