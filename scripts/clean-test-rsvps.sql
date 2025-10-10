-- Clean all test RSVP data
-- WARNING: This will delete ALL RSVPs - use carefully!

-- Option 1: Delete ALL RSVPs (complete reset)
DELETE FROM rsvps;

-- Reset the ID sequence to start from 1 again
ALTER SEQUENCE rsvps_id_seq RESTART WITH 1;

-- Verify the table is empty
SELECT COUNT(*) as remaining_rsvps FROM rsvps;
