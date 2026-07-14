-- Migration: 0003_add_auth_handoff_codes.sql
-- Create auth_handoff_codes table and performance indexes safely

CREATE TABLE IF NOT EXISTS auth_handoff_codes (
  id VARCHAR(255) PRIMARY KEY,
  code_hash VARCHAR(255) UNIQUE NOT NULL,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose VARCHAR(50) NOT NULL,
  expires_at VARCHAR(50) NOT NULL,
  used_at VARCHAR(50),
  created_at VARCHAR(50) NOT NULL,
  request_id VARCHAR(255) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_handoff_codes_expires_at ON auth_handoff_codes (expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_handoff_codes_user_id ON auth_handoff_codes (user_id);
