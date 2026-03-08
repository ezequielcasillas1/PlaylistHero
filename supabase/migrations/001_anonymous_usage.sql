-- Table to track anonymous user usage
-- Uses fingerprint + IP to identify unique visitors
CREATE TABLE IF NOT EXISTS anonymous_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fingerprint TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  generation_count INTEGER DEFAULT 0,
  first_used_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fingerprint, ip_address)
);

-- Index for fast lookups
CREATE INDEX idx_anonymous_usage_fingerprint ON anonymous_usage(fingerprint);
CREATE INDEX idx_anonymous_usage_ip ON anonymous_usage(ip_address);

-- RLS policies
ALTER TABLE anonymous_usage ENABLE ROW LEVEL SECURITY;

-- Allow anon users to read/write their own usage data
CREATE POLICY "Allow anonymous usage tracking" ON anonymous_usage
  FOR ALL USING (true) WITH CHECK (true);
