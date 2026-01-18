// Database schema version and table definitions
export const SCHEMA_VERSION = 5;

export const CREATE_TABLES = `
  -- User profiles for data isolation
  CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    is_secured INTEGER NOT NULL DEFAULT 0,
    auth_password_hash TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Allowance sources (salary, side income, etc.) per year per profile
  CREATE TABLE IF NOT EXISTS allowance_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL DEFAULT 1,
    year INTEGER NOT NULL,
    name TEXT NOT NULL,
    amount_cents INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
  );

  -- Categories for expenses (global, not profile-bound)
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    icon TEXT,
    color TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
  );

  -- Months with optional allowance override per profile
  CREATE TABLE IF NOT EXISTS months (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL DEFAULT 1,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK(month >= 1 AND month <= 12),
    allowance_override_cents INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(profile_id, year, month),
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
  );

  -- Individual expenses
  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    month_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    amount_cents INTEGER NOT NULL CHECK(amount_cents > 0),
    note TEXT,
    expense_date TEXT NOT NULL DEFAULT (date('now')),
    is_paid INTEGER NOT NULL DEFAULT 0,
    is_verified INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    FOREIGN KEY (month_id) REFERENCES months(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  -- App settings and metadata (global)
  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Create indexes for performance
  CREATE INDEX IF NOT EXISTS idx_allowance_sources_year ON allowance_sources(year);
  CREATE INDEX IF NOT EXISTS idx_allowance_sources_profile ON allowance_sources(profile_id);
  CREATE INDEX IF NOT EXISTS idx_expenses_month_id ON expenses(month_id);
  CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
  CREATE INDEX IF NOT EXISTS idx_months_year ON months(year);
  CREATE INDEX IF NOT EXISTS idx_months_profile ON months(profile_id);
`;
