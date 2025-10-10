-- Create a backup of current data
CREATE TABLE IF NOT EXISTS rsvps_backup AS 
SELECT * FROM rsvps WHERE 1=0; -- Create structure only

-- Insert current data into backup
INSERT INTO rsvps_backup SELECT * FROM rsvps;

-- Verify backup
SELECT 
  (SELECT COUNT(*) FROM rsvps) as original_count,
  (SELECT COUNT(*) FROM rsvps_backup) as backup_count;
