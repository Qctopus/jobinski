-- Migration: Add categorization and learning system tables
-- Phase 1: Backend Categorization System

-- Add categorization columns to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS computed_category VARCHAR(100);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS computed_confidence DECIMAL(5,2);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS computed_secondary JSONB;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS computed_reasoning JSONB;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS computed_flags JSONB;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS categorized_at TIMESTAMP;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS needs_recategorization BOOLEAN DEFAULT false;

-- Create user_corrections table for tracking feedback
CREATE TABLE IF NOT EXISTS user_corrections (
  id SERIAL PRIMARY KEY,
  job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
  original_category VARCHAR(100),
  corrected_category VARCHAR(100) NOT NULL,
  user_id VARCHAR(100),
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create learned_patterns table for keyword learning
CREATE TABLE IF NOT EXISTS learned_patterns (
  id SERIAL PRIMARY KEY,
  keyword VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  confidence_boost DECIMAL(5,2) DEFAULT 0,
  occurrence_count INTEGER DEFAULT 1,
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(keyword, category)
);

CREATE TABLE IF NOT EXISTS sync_status (
  id SERIAL PRIMARY KEY,
  last_sync_at TIMESTAMP,
  jobs_synced INTEGER DEFAULT 0,
  jobs_updated INTEGER DEFAULT 0,
  jobs_categorized INTEGER DEFAULT 0,
  errors INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'idle',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_computed_category ON jobs(computed_category);
CREATE INDEX IF NOT EXISTS idx_jobs_short_agency ON jobs(short_agency);
CREATE INDEX IF NOT EXISTS idx_jobs_up_grade ON jobs(up_grade);
CREATE INDEX IF NOT EXISTS idx_jobs_posting_date ON jobs(posting_date);
CREATE INDEX IF NOT EXISTS idx_jobs_needs_recategorization ON jobs(needs_recategorization) WHERE needs_recategorization = true;

CREATE INDEX IF NOT EXISTS idx_user_corrections_job_id ON user_corrections(job_id);
CREATE INDEX IF NOT EXISTS idx_user_corrections_category ON user_corrections(corrected_category);
CREATE INDEX IF NOT EXISTS idx_user_corrections_created_at ON user_corrections(created_at);

CREATE INDEX IF NOT EXISTS idx_learned_patterns_keyword ON learned_patterns(keyword);
CREATE INDEX IF NOT EXISTS idx_learned_patterns_category ON learned_patterns(category);
CREATE INDEX IF NOT EXISTS idx_learned_patterns_keyword_category ON learned_patterns(keyword, category);
