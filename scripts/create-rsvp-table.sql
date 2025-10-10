-- Create the RSVPs table
CREATE TABLE IF NOT EXISTS rsvps (
  id BIGSERIAL PRIMARY KEY,
  guest_name VARCHAR(255) NOT NULL,
  attendance VARCHAR(10) NOT NULL CHECK (attendance IN ('yes', 'no')),
  guest_count INTEGER DEFAULT 2,
  message TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_rsvps_email ON rsvps(email);
CREATE INDEX IF NOT EXISTS idx_rsvps_created_at ON rsvps(created_at);
CREATE INDEX IF NOT EXISTS idx_rsvps_attendance ON rsvps(attendance);

-- Add Row Level Security (RLS)
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts from anyone (for RSVP submissions)
CREATE POLICY "Allow public RSVP submissions" ON rsvps
  FOR INSERT WITH CHECK (true);

-- Create policy to allow reads for authenticated users only (for admin)
CREATE POLICY "Allow authenticated reads" ON rsvps
  FOR SELECT USING (auth.role() = 'authenticated');
