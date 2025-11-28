"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
exports.getDb = getDb;
exports.closeDb = closeDb;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const DB_PATH = process.env.SQLITE_DB_PATH || path_1.default.join(__dirname, '../../data/jobs_cache.db');
const dataDir = path_1.default.dirname(DB_PATH);
if (!fs_1.default.existsSync(dataDir)) {
    fs_1.default.mkdirSync(dataDir, { recursive: true });
}
const db = new better_sqlite3_1.default(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = -64000');
db.pragma('temp_store = MEMORY');
function initializeDatabase() {
    console.log('🗄️ Initializing SQLite database...');
    db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY,
      title TEXT,
      description TEXT,
      job_labels TEXT,
      short_agency TEXT,
      long_agency TEXT,
      duty_station TEXT,
      duty_country TEXT,
      duty_continent TEXT,
      country_code TEXT,
      eligible_nationality TEXT,
      hs_min_exp INTEGER,
      bachelor_min_exp INTEGER,
      master_min_exp INTEGER,
      up_grade TEXT,
      pipeline TEXT,
      department TEXT,
      posting_date TEXT,
      apply_until TEXT,
      url TEXT,
      languages TEXT,
      uniquecode TEXT,
      ideal_candidate TEXT,
      sectoral_category TEXT,
      archived INTEGER DEFAULT 0,
      created_at TEXT,
      updated_at TEXT,
      
      -- Processed/computed fields
      primary_category TEXT,
      secondary_categories TEXT,
      classification_confidence REAL,
      classification_reasoning TEXT,
      seniority_level TEXT,
      location_type TEXT,
      skill_domains TEXT,
      status TEXT,
      is_active INTEGER,
      is_expired INTEGER,
      days_remaining INTEGER,
      urgency TEXT,
      application_window_days INTEGER,
      formatted_posting_date TEXT,
      formatted_apply_until TEXT,
      processed_at TEXT
    )
  `);
    db.exec(`
    CREATE INDEX IF NOT EXISTS idx_jobs_agency ON jobs(short_agency);
    CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(primary_category);
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
    CREATE INDEX IF NOT EXISTS idx_jobs_posting_date ON jobs(posting_date);
    CREATE INDEX IF NOT EXISTS idx_jobs_country ON jobs(duty_country);
    CREATE INDEX IF NOT EXISTS idx_jobs_grade ON jobs(up_grade);
  `);
    db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_url_unique ON jobs(url) WHERE url IS NOT NULL AND url != '';
  `);
    db.exec(`
    CREATE TABLE IF NOT EXISTS analytics_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cache_key TEXT UNIQUE NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT
    )
  `);
    db.exec(`
    CREATE INDEX IF NOT EXISTS idx_analytics_key ON analytics_cache(cache_key);
  `);
    db.exec(`
    CREATE TABLE IF NOT EXISTS sync_metadata (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      last_sync_at TEXT,
      total_jobs INTEGER,
      sync_duration_ms INTEGER,
      status TEXT
    )
  `);
    const existing = db.prepare('SELECT id FROM sync_metadata WHERE id = 1').get();
    if (!existing) {
        db.prepare('INSERT INTO sync_metadata (id, status) VALUES (1, ?)').run('never_synced');
    }
    console.log('✅ SQLite database initialized');
}
function getDb() {
    return db;
}
function closeDb() {
    db.close();
    console.log('📦 SQLite database connection closed');
}
exports.default = db;
//# sourceMappingURL=sqlite.js.map