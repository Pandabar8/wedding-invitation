-- Simple cleanup of test data
DELETE FROM rsvps 
WHERE guest_name ILIKE '%test%' 
   OR guest_name ILIKE '%prueba%' 
   OR guest_name ILIKE '%demo%'
   OR created_at >= CURRENT_DATE;

-- Show remaining data
SELECT COUNT(*) as remaining_rsvps FROM rsvps;
