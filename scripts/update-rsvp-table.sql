-- Add column for actual seats that will be used
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS actual_guest_count INTEGER;

-- Set default values for existing records
UPDATE rsvps 
SET actual_guest_count = guest_count 
WHERE actual_guest_count IS NULL;

-- Add constraint to ensure actual count doesn't exceed assigned count
ALTER TABLE rsvps ADD CONSTRAINT check_actual_guest_count 
CHECK (actual_guest_count <= guest_count AND actual_guest_count >= 0);
