-- Migration: Create app_reports table for bug/feedback reporting from Tabi OS apps
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE app_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique report ID
    app_id text NOT NULL, -- App identifier (e.g., 'bookmarks')
    app_version text NOT NULL, -- App version string
    type text NOT NULL CHECK (type IN ('bug', 'feedback')), -- Report type
    description text NOT NULL CHECK (char_length(description) >= 10 AND char_length(description) <= 300), -- User's report/feedback
    email text, -- Optional user email
    screenshot text, -- Optional screenshot (URL or base64)
    created_at timestamptz NOT NULL DEFAULT now(), -- Submission time
    user_id uuid REFERENCES auth.users (id), -- Optional user ID (if logged in)
    status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'closed')), -- Report status
    ip_address text, -- Optional IP address
    user_agent text, -- Optional user agent string
    website text, -- Honeypot field for spam detection
    CONSTRAINT app_reports_description_length CHECK (char_length(description) >= 10 AND char_length(description) <= 300)
);

-- Index for fast lookup by app and recency
CREATE INDEX idx_app_reports_app_id_created_at ON app_reports (app_id, created_at DESC);

-- Comments for documentation
COMMENT ON TABLE app_reports IS 'User-submitted bug reports and feedback for Tabi OS apps.';
COMMENT ON COLUMN app_reports.id IS 'Unique report ID (UUID).';
COMMENT ON COLUMN app_reports.app_id IS 'App identifier (e.g., bookmarks, notepad).';
COMMENT ON COLUMN app_reports.app_version IS 'App version string.';
COMMENT ON COLUMN app_reports.type IS 'Type of report: bug or feedback.';
COMMENT ON COLUMN app_reports.description IS 'User-submitted description (10-300 chars).';
COMMENT ON COLUMN app_reports.email IS 'Optional user email.';
COMMENT ON COLUMN app_reports.screenshot IS 'Optional screenshot (URL or base64).';
COMMENT ON COLUMN app_reports.created_at IS 'Timestamp of submission.';
COMMENT ON COLUMN app_reports.user_id IS 'User ID from auth.users, if available.';
COMMENT ON COLUMN app_reports.status IS 'Status: new, reviewed, or closed.';
COMMENT ON COLUMN app_reports.ip_address IS 'Optional IP address.';
COMMENT ON COLUMN app_reports.user_agent IS 'Optional user agent string.';
COMMENT ON COLUMN app_reports.website IS 'Honeypot field for spam detection.';

-- RLS: Only allow inserts, no select/update/delete for normal users
ALTER TABLE app_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow insert for all" ON app_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "No select for users" ON app_reports FOR SELECT USING (false);
CREATE POLICY "No update for users" ON app_reports FOR UPDATE USING (false);
CREATE POLICY "No delete for users" ON app_reports FOR DELETE USING (false); 