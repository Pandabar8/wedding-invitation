-- Simple RSVP table creation (no RLS complications)
CREATE TABLE IF NOT EXISTS rsvps (
  id BIGSERIAL PRIMARY KEY,
  guest_name TEXT NOT NULL,
  attendance TEXT NOT NULL CHECK (attendance IN ('yes', 'no')),
  guest_count INTEGER DEFAULT 2,
  actual_guest_count INTEGER,
  message TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create basic indexes for performance
CREATE INDEX IF NOT EXISTS idx_rsvps_created_at ON rsvps(created_at);
CREATE INDEX IF NOT EXISTS idx_rsvps_attendance ON rsvps(attendance);
CREATE INDEX IF NOT EXISTS idx_rsvps_guest_name ON rsvps(guest_name);

-- Add constraint for actual guest count
ALTER TABLE rsvps ADD CONSTRAINT IF NOT EXISTS check_actual_guest_count 
CHECK (actual_guest_count IS NULL OR (actual_guest_count <= guest_count AND actual_guest_count >= 0));
