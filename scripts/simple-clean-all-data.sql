-- WARNING: This deletes ALL RSVP data
-- Only run this if you want to start fresh

DELETE FROM rsvps;

-- Reset the ID counter
ALTER SEQUENCE rsvps_id_seq RESTART WITH 1;

-- Verify table is empty
SELECT COUNT(*) as total_rsvps FROM rsvps;
