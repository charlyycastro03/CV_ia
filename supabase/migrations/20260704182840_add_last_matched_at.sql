ALTER TABLE profiles
ADD COLUMN last_matched_at TIMESTAMP DEFAULT '2000-01-01 00:00:00'; -- default to old date so everyone gets processed

CREATE INDEX idx_profiles_last_matched_at ON profiles(last_matched_at);
