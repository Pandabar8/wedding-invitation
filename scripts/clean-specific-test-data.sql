-- Clean only specific test entries
-- This is safer - you can target specific test data

-- Option 1: Delete RSVPs by name pattern (test names)
DELETE FROM rsvps 
WHERE guest_name ILIKE '%test%' 
   OR guest_name ILIKE '%prueba%'
   OR guest_name ILIKE '%demo%';

-- Option 2: Delete RSVPs from specific date range (today's tests)
DELETE FROM rsvps 
WHERE created_at >= CURRENT_DATE;

-- Option 3: Delete RSVPs with specific messages (test messages)
DELETE FROM rsvps 
WHERE message ILIKE '%test%' 
   OR message ILIKE '%testing%'
   OR message IS NULL;

-- Option 4: Delete the last N entries (most recent tests)
DELETE FROM rsvps 
WHERE id IN (
  SELECT id FROM rsvps 
  ORDER BY created_at DESC 
  LIMIT 5  -- Change this number to how many recent entries to delete
);

-- Show remaining data
SELECT id, guest_name, attendance, created_at 
FROM rsvps 
ORDER BY created_at DESC;
