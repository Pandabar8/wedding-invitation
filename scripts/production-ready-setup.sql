-- Prepare database for production use
-- Run this after cleaning test data

-- 1. Clean all test data
DELETE FROM rsvps;

-- 2. Reset ID sequence
ALTER SEQUENCE rsvps_id_seq RESTART WITH 1;

-- 3. Add any production-specific constraints or indexes
CREATE INDEX IF NOT EXISTS idx_rsvps_guest_name ON rsvps(guest_name);
CREATE INDEX IF NOT EXISTS idx_rsvps_attendance_created ON rsvps(attendance, created_at);

-- 4. Update table statistics
ANALYZE rsvps;

-- 5. Verify clean state
SELECT 
  COUNT(*) as total_rsvps,
  COUNT(CASE WHEN attendance = 'yes' THEN 1 END) as attending,
  COUNT(CASE WHEN attendance = 'no' THEN 1 END) as not_attending
FROM rsvps;
