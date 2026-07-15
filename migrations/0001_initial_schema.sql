-- Migration: 0001_initial_schema.sql
-- Create AppOS production tables for Neon PostgreSQL database layer with standard Better Auth schema

-- 1. "user" Table (escaped due to reserved keyword)
CREATE TABLE IF NOT EXISTS "user" (
  id VARCHAR(255) PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  email_verified BOOLEAN NOT NULL,
  profile_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 2. "session" Table
CREATE TABLE IF NOT EXISTS "session" (
  id VARCHAR(255) PRIMARY KEY,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

-- 3. "account" Table
CREATE TABLE IF NOT EXISTS "account" (
  id VARCHAR(255) PRIMARY KEY,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  access_token_expires_at TIMESTAMP WITH TIME ZONE,
  refresh_token_expires_at TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  password TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 4. "verification" Table
CREATE TABLE IF NOT EXISTS "verification" (
  id VARCHAR(255) PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- 5. workspaces Table
CREATE TABLE IF NOT EXISTS workspaces (
  id VARCHAR(255) PRIMARY KEY,
  owner_id VARCHAR(255) NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. workspace_members Table
CREATE TABLE IF NOT EXISTS workspace_members (
  id VARCHAR(255) PRIMARY KEY,
  workspace_id VARCHAR(255) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member', -- owner, admin, member, viewer
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(workspace_id, user_id)
);

-- 7. applications Table
CREATE TABLE IF NOT EXISTS applications (
  id VARCHAR(255) PRIMARY KEY,
  workspace_id VARCHAR(255) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  website_url TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, analyzing, generated, failed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. assets Table
CREATE TABLE IF NOT EXISTS assets (
  id VARCHAR(255) PRIMARY KEY,
  application_id VARCHAR(255) NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  cloudinary_url TEXT NOT NULL,
  asset_type VARCHAR(100) NOT NULL, -- logo, screenshot, icon, splash, raw
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. audit_logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(255) PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  ip_address VARCHAR(100) NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
