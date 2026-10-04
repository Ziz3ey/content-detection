const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS scans (
  id TEXT PRIMARY KEY NOT NULL,
  url TEXT NOT NULL,
  scanned_at TEXT NOT NULL,
  crawl_status TEXT NOT NULL CHECK (crawl_status IN ('success', 'failed')),
  http_status INTEGER,
  content_type TEXT,
  title TEXT,
  crawl_metadata TEXT,
  text_detection_status TEXT NOT NULL CHECK (text_detection_status IN ('success', 'failed', 'skipped')),
  text_detection_result TEXT,
  defacement_detection_status TEXT NOT NULL CHECK (defacement_detection_status IN ('success', 'failed', 'skipped')),
  defacement_detection_result TEXT,
  link_detection_status TEXT NOT NULL CHECK (link_detection_status IN ('success', 'failed', 'skipped')),
  link_detection_result TEXT
);

CREATE INDEX IF NOT EXISTS scans_scanned_at_idx ON scans(scanned_at DESC);
CREATE INDEX IF NOT EXISTS scans_url_idx ON scans(url);
`;

module.exports = { SCHEMA_SQL };
