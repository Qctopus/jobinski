# Database Schema & Backend Optimization Summary

## Issue Identified
The PostgreSQL error `operator does not exist: text > timestamp with time zone` was occurring because the `apply_until` column in the `jobs` table is stored as TEXT, but the query was comparing it directly to `NOW()` (which returns a timestamp).

## Fix Applied
Added explicit type casting in `ReadOnlyJobService.ts`:
- `apply_until > NOW()` → `apply_until::timestamp > NOW()`
- `apply_until <= NOW()` → `apply_until::timestamp <= NOW()`
- All timestamp comparisons now use `::timestamp` casting

## Database Schema Overview

### Jobs Table Structure
The `jobs` table contains the following key columns:

**Core Fields:**
- `id` (integer, primary key)
- `title`, `description`, `job_labels` (text)
- `short_agency`, `long_agency` (text)
- `duty_station`, `duty_country`, `duty_continent` (text)
- `up_grade`, `pipeline`, `department` (text)
- `posting_date`, `apply_until` (text - stored as text, not timestamp!)
- `url` (text)
- `archived` (boolean)

**Classification Fields (added via migrations):**
- `primary_category` (varchar(100))
- `secondary_categories` (jsonb)
- `classification_confidence` (decimal(5,2))
- `classification_reasoning` (jsonb)
- `is_user_corrected` (boolean)
- `user_corrected_by` (varchar(100))
- `user_corrected_at` (timestamp)
- `classified_at` (timestamp)
- `is_ambiguous_category` (boolean)
- `emerging_terms_found` (jsonb)

**Sectoral Category:**
- `sectoral_category` (text) - Pre-existing category field in the database

## Backend Services

### ReadOnlyJobService (FAST - No Classification)
- **Purpose**: Read-only access to existing data
- **Used by**: `/api/jobs` endpoint
- **Performance**: Fast - just queries the database
- **Returns**: All data including pre-existing `sectoral_category` and classification fields
- **No heavy processing**: Does NOT perform in-memory classification

### JobService (SLOW - With Classification)
- **Purpose**: Full CRUD operations with classification
- **Performance**: Slow when fetching many jobs
- **Issue**: Lines 100-114 perform in-memory classification for EVERY job returned
- **Problem**: When fetching 10,000 jobs, it classifies all 10,000 in-memory!

## Recommendations

### 1. Use Pre-existing Categories
The database already has a `sectoral_category` field that contains categorization data. The backend should:
- Return this field directly without re-classification
- Only classify jobs that don't have a category yet
- Use batch classification for uncategorized jobs

### 2. Optimize ReadOnlyJobService
The `ReadOnlyJobService` is already optimized and should be used for frontend data loading. It:
- Uses `SELECT *` to get all columns including categories
- Does NOT perform in-memory classification
- Returns data quickly

### 3. Frontend Data Flow
Current flow (CORRECT):
1. Frontend calls `/api/jobs?status=active&limit=10000`
2. Backend uses `ReadOnlyJobService.getJobs()`
3. Query filters by `apply_until::timestamp > NOW()` and `archived = false`
4. Returns all jobs with existing categories
5. Frontend processes data through `JobAnalyticsService` for additional metrics

### 4. Performance Expectations
With the fix applied:
- **Before**: 150+ seconds (failing queries, retries)
- **After**: Should be < 5 seconds for 10,000 jobs
- **Bottleneck**: If still slow, check:
  - Database indexes on `apply_until`, `posting_date`, `archived`
  - Network latency
  - Frontend processing in `JobAnalyticsService`

## Next Steps

1. ✅ Fixed type casting in `ReadOnlyJobService.ts`
2. ✅ Rebuilt TypeScript backend
3. ✅ Restarted backend server
4. ⏳ Monitor performance - should now load in < 5 seconds
5. 📊 If still slow, investigate:
   - Add database indexes
   - Optimize `JobAnalyticsService.processJobData()`
   - Consider pagination for very large datasets

## Database Indexes Recommended
```sql
CREATE INDEX IF NOT EXISTS idx_jobs_apply_until ON jobs(apply_until);
CREATE INDEX IF NOT EXISTS idx_jobs_archived ON jobs(archived);
CREATE INDEX IF NOT EXISTS idx_jobs_posting_date ON jobs(posting_date);
CREATE INDEX IF NOT EXISTS idx_jobs_sectoral_category ON jobs(sectoral_category);
```

These indexes already exist for classification fields but may be missing for the core date/status fields.
