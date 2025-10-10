-- Drop existing table
DROP TABLE IF EXISTS rsvps;

-- Create new table without RLS complications
CREATE TABLE rsvps (
  id BIGSERIAL PRIMARY KEY,
  guest_name TEXT NOT NULL,
  attendance TEXT NOT NULL,
  guest_count INTEGER DEFAULT 2,
  message TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add basic constraint
ALTER TABLE rsvps ADD CONSTRAINT check_attendance CHECK (attendance IN ('yes', 'no'));

-- Don't enable RLS for now - keep it simple
-- We can add security later if needed
