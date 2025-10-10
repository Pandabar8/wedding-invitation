-- Create a backup of your data before cleaning
-- This creates a backup table with all current data

-- Create backup table
CREATE TABLE rsvps_backup AS 
SELECT * FROM rsvps;

-- Verify backup was created
SELECT COUNT(*) as backup_count FROM rsvps_backup;
SELECT COUNT(*) as original_count FROM rsvps;

-- To restore from backup later (if needed):
-- DELETE FROM rsvps;
-- INSERT INTO rsvps SELECT * FROM rsvps_backup;
