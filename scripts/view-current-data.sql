-- View current RSVP data
SELECT 
  id,
  guest_name,
  attendance,
  guest_count,
  actual_guest_count,
  message,
  created_at
FROM rsvps 
ORDER BY created_at DESC
LIMIT 20;

-- Summary statistics
SELECT 
  COUNT(*) as total_rsvps,
  COUNT(CASE WHEN attendance = 'yes' THEN 1 END) as attending,
  COUNT(CASE WHEN attendance = 'no' THEN 1 END) as not_attending,
  SUM(CASE WHEN attendance = 'yes' THEN guest_count ELSE 0 END) as total_guests_assigned,
  SUM(CASE WHEN attendance = 'yes' THEN COALESCE(actual_guest_count, guest_count) ELSE 0 END) as total_guests_actual
FROM rsvps;
