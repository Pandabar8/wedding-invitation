-- Add the actual_guest_count column to existing table
ALTER TABLE rsvps ADD COLUMN actual_guest_count INTEGER;

-- Set default values for existing records (use their assigned guest_count)
UPDATE rsvps 
SET actual_guest_count = guest_count 
WHERE actual_guest_count IS NULL;

-- Add constraint to ensure actual count doesn't exceed assigned count
ALTER TABLE rsvps ADD CONSTRAINT check_actual_guest_count 
CHECK (actual_guest_count <= guest_count AND actual_guest_count >= 0);
