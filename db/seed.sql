-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  ts TIMESTAMP DEFAULT NOW(),
  type TEXT,
  severity TEXT,
  message TEXT,
  mitre_tags TEXT
);

-- App config key/value storage
CREATE TABLE IF NOT EXISTS app_config (
  k TEXT PRIMARY KEY,
  v TEXT
);
