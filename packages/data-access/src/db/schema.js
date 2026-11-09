const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS sites (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  allowed_host TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  max_depth INTEGER NOT NULL DEFAULT 1,
  max_pages INTEGER NOT NULL DEFAULT 20,
  baseline_html TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS sites_status_idx ON sites(status);
CREATE INDEX IF NOT EXISTS sites_url_idx ON sites(url);

CREATE TABLE IF NOT EXISTS scans (
  id TEXT PRIMARY KEY NOT NULL,
  url TEXT NOT NULL,
  scanned_at TEXT NOT NULL,
  crawl_status TEXT NOT NULL CHECK (crawl_status IN ('success', 'failed')),
  http_status INTEGER,
  content_type TEXT,
  title TEXT,
  crawl_metadata TEXT,
  scan_source TEXT NOT NULL CHECK (scan_source IN ('MANUAL', 'SCHEDULED')) DEFAULT 'MANUAL',
  officer_email TEXT,
  text_detection_status TEXT NOT NULL CHECK (text_detection_status IN ('success', 'failed', 'skipped')),
  text_detection_result TEXT,
  defacement_detection_status TEXT NOT NULL CHECK (defacement_detection_status IN ('success', 'failed', 'skipped')),
  defacement_detection_result TEXT,
  link_detection_status TEXT NOT NULL CHECK (link_detection_status IN ('success', 'failed', 'skipped')),
  link_detection_result TEXT
);

CREATE INDEX IF NOT EXISTS scans_scanned_at_idx ON scans(scanned_at DESC);
CREATE INDEX IF NOT EXISTS scans_url_idx ON scans(url);

CREATE TABLE IF NOT EXISTS schedules (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('all_active', 'custom')) DEFAULT 'all_active',
  site_ids TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')) DEFAULT 'daily',
  time_of_day TEXT NOT NULL DEFAULT '02:00',
  day_of_week INTEGER,
  day_of_month INTEGER,
  timezone TEXT NOT NULL DEFAULT 'Asia/Makassar',
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  is_running INTEGER NOT NULL DEFAULT 0,
  last_run_at TEXT,
  last_run_status TEXT,
  last_run_message TEXT,
  next_run_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS schedules_status_idx ON schedules(status);
CREATE INDEX IF NOT EXISTS schedules_next_run_idx ON schedules(next_run_at);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY NOT NULL,
  scan_id TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  recipient TEXT,
  subject TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'not_configured')),
  error_message TEXT,
  sent_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS notifications_scan_channel_idx ON notifications(scan_id, channel);
CREATE INDEX IF NOT EXISTS notifications_status_idx ON notifications(status);

CREATE TABLE IF NOT EXISTS scan_jobs (
  id TEXT PRIMARY KEY NOT NULL,
  type TEXT NOT NULL DEFAULT 'single' CHECK (type IN ('single', 'batch')),
  target_url TEXT NOT NULL,
  officer_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  progress_scanned INTEGER NOT NULL DEFAULT 0,
  progress_total INTEGER NOT NULL DEFAULT 1,
  result_summary TEXT,
  error_message TEXT,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS scan_jobs_status_idx ON scan_jobs(status);
CREATE INDEX IF NOT EXISTS scan_jobs_officer_idx ON scan_jobs(officer_email);
CREATE INDEX IF NOT EXISTS scan_jobs_created_at_idx ON scan_jobs(created_at DESC);
`;

module.exports = { SCHEMA_SQL };
