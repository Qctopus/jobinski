import pool from '../config/database';

const migrations = [
  {
    version: 1,
    name: 'Add classification columns to jobs table',
    sql: `
      -- Add categorization columns to existing jobs table
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS primary_category VARCHAR(100);
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS secondary_categories JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS classification_confidence DECIMAL(5,2);
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS classification_reasoning JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_user_corrected BOOLEAN DEFAULT FALSE;
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS user_corrected_by VARCHAR(100);
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS user_corrected_at TIMESTAMP;
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS classified_at TIMESTAMP;
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_ambiguous_category BOOLEAN DEFAULT FALSE;
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS emerging_terms_found JSONB DEFAULT '[]'::jsonb;
      
      -- Create indexes for efficient queries
      CREATE INDEX IF NOT EXISTS idx_jobs_primary_category ON jobs(primary_category);
      CREATE INDEX IF NOT EXISTS idx_jobs_confidence ON jobs(classification_confidence);
      CREATE INDEX IF NOT EXISTS idx_jobs_user_corrected ON jobs(is_user_corrected);
      CREATE INDEX IF NOT EXISTS idx_jobs_classified_at ON jobs(classified_at);
      CREATE INDEX IF NOT EXISTS idx_jobs_posting_date ON jobs(posting_date);
    `
  },
  {
    version: 2,
    name: 'Create user feedback table',
    sql: `
      CREATE TABLE IF NOT EXISTS user_feedback (
        id SERIAL PRIMARY KEY,
        job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
        original_category VARCHAR(100),
        corrected_category VARCHAR(100) NOT NULL,
        user_id VARCHAR(100),
        reason TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_feedback_job_id ON user_feedback(job_id);
      CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON user_feedback(user_id);
      CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON user_feedback(created_at);
    `
  },
  {
    version: 3,
    name: 'Create classification log table',
    sql: `
      CREATE TABLE IF NOT EXISTS classification_log (
        id SERIAL PRIMARY KEY,
        job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
        classification_type VARCHAR(50) NOT NULL, -- 'auto', 'user_correction', 'batch'
        primary_category VARCHAR(100),
        secondary_categories JSONB DEFAULT '[]'::jsonb,
        confidence DECIMAL(5,2),
        reasoning JSONB DEFAULT '[]'::jsonb,
        processing_time_ms INTEGER,
        classified_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_classification_log_job_id ON classification_log(job_id);
      CREATE INDEX IF NOT EXISTS idx_classification_log_type ON classification_log(classification_type);
      CREATE INDEX IF NOT EXISTS idx_classification_log_created_at ON classification_log(created_at);
    `
  },
  {
    version: 4,
    name: 'Create learned patterns table',
    sql: `
      CREATE TABLE IF NOT EXISTS learned_patterns (
        id SERIAL PRIMARY KEY,
        pattern_text VARCHAR(500) NOT NULL,
        category_id VARCHAR(100) NOT NULL,
        confidence DECIMAL(5,3) NOT NULL,
        occurrences INTEGER DEFAULT 1,
        last_seen TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(pattern_text, category_id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_learned_patterns_category ON learned_patterns(category_id);
      CREATE INDEX IF NOT EXISTS idx_learned_patterns_confidence ON learned_patterns(confidence);
      CREATE INDEX IF NOT EXISTS idx_learned_patterns_occurrences ON learned_patterns(occurrences);
    `
  },
  {
    version: 5,
    name: 'Create migrations tracking table',
    sql: `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP DEFAULT NOW()
      );
    `
  }
];

async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting database migrations...');
    
    // Ensure migrations tracking table exists first
    await client.query(migrations[4]?.sql || '');
    
    // Get applied migrations
    const { rows: appliedMigrations } = await client.query(
      'SELECT version FROM schema_migrations ORDER BY version'
    );
    const appliedVersions = new Set(appliedMigrations.map(row => row.version));
    
    // Run pending migrations
    for (const migration of migrations.slice(0, 4)) { // Skip the migrations table itself
      if (!appliedVersions.has(migration.version)) {
        console.log(`📄 Applying migration ${migration.version}: ${migration.name}`);
        
        await client.query('BEGIN');
        try {
          await client.query(migration.sql);
          await client.query(
            'INSERT INTO schema_migrations (version, name) VALUES ($1, $2)',
            [migration.version, migration.name]
          );
          await client.query('COMMIT');
          console.log(`✅ Migration ${migration.version} applied successfully`);
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        }
      } else {
        console.log(`⏭️  Migration ${migration.version} already applied`);
      }
    }
    
    console.log('🎉 All migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('✨ Database migration complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

export default runMigrations;





