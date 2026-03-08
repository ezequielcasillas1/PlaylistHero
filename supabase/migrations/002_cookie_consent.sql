-- Add cookie consent column to anonymous_usage table
ALTER TABLE anonymous_usage 
ADD COLUMN IF NOT EXISTS cookies_accepted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS consent_accepted_at TIMESTAMPTZ;

-- Index for consent lookups
CREATE INDEX IF NOT EXISTS idx_anonymous_usage_consent ON anonymous_usage(fingerprint, ip_address, cookies_accepted);
