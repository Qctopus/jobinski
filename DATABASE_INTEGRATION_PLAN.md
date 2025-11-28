# Database Integration Plan for Job Categorization

## Current State 
- ✅ Frontend-only system loading from CSV
- ✅ Categories computed in browser using `EnhancedJobClassifier`
- ✅ User corrections stored in `sessionStorage` (temporary)
- ❌ No backend persistence

## Target State (PostgreSQL Integration)

### 1. Database Schema Updates

```sql
-- Add categorization columns to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS primary_category VARCHAR(50);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS secondary_categories JSONB;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS classification_confidence DECIMAL(5,2);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS classification_reasoning JSONB;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_user_corrected BOOLEAN DEFAULT FALSE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS user_corrected_by VARCHAR(100);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS user_corrected_at TIMESTAMP;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS classified_at TIMESTAMP DEFAULT NOW();

-- Create index for efficient category queries
CREATE INDEX IF NOT EXISTS idx_jobs_primary_category ON jobs(primary_category);
CREATE INDEX IF NOT EXISTS idx_jobs_confidence ON jobs(classification_confidence);
CREATE INDEX IF NOT EXISTS idx_jobs_user_corrected ON jobs(is_user_corrected);
```

### 2. Backend API Endpoints Needed

```typescript
// API endpoints to implement
POST /api/jobs/classify          // Classify a single job
PUT  /api/jobs/:id/category      // Update job category (user correction)
GET  /api/jobs/unclassified      // Get jobs needing classification
GET  /api/jobs/low-confidence    // Get jobs with low confidence
POST /api/classification/feedback // Submit user feedback for learning
```

### 3. Classification Workflow

#### A. When New Jobs Enter Database:
```
1. Job inserted into database (without categories)
2. Backend classification service triggered
3. Use same EnhancedJobClassifier logic on backend
4. Save classification results to database
5. Job now has categories permanently stored
```

#### B. When User Makes Corrections:
```
1. User corrects category in frontend
2. POST to /api/jobs/:id/category
3. Update database with user correction
4. Mark is_user_corrected = true
5. Feed correction to learning engine
6. Frontend shows immediate update
```

### 4. Implementation Steps

#### Phase 1: Backend Classification Service
- Move `EnhancedJobClassifier` to backend (Node.js/Python)
- Create classification endpoint
- Implement batch classification for existing jobs

#### Phase 2: API for User Corrections  
- Create correction endpoint
- Update frontend to call API instead of sessionStorage
- Implement user authentication/tracking

#### Phase 3: Learning Pipeline
- Move `PatternLearningEngine` to backend
- Create feedback processing endpoint
- Implement dictionary updates via API

#### Phase 4: Real-time Classification
- Auto-classify jobs on insertion
- Background job for re-classification
- Webhook/trigger system for new jobs

### 5. Frontend Changes Required

#### Current Problem:
```typescript
// Currently: Categories computed in browser, lost on refresh
const enhancedJobs = useMemo(() => {
  return data.map(job => {
    const userCorrectedCategory = userCorrections.get(jobId);
    if (userCorrectedCategory) {
      return { ...job, primary_category: userCorrectedCategory }; // TEMPORARY
    }
    return job;
  });
}, [data, userCorrections]);
```

#### Solution: API Integration
```typescript
// Future: Categories come from database, corrections persist
const handleFeedbackSubmit = async (feedback: JobFeedback) => {
  // Instead of sessionStorage:
  const response = await fetch(`/api/jobs/${feedback.jobId}/category`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      primary_category: feedback.userCorrection.correctedPrimary,
      user_id: getCurrentUser().id,
      reason: 'user_correction'
    })
  });
  
  if (response.ok) {
    // Update local state AND refetch data
    await refetchJobs();
  }
};
```

### 6. Migration Strategy

#### Option A: Gradual Migration
1. Keep CSV loading while building API
2. Add API endpoints alongside current system
3. Gradually switch components to use API
4. Deprecate CSV loading

#### Option B: Big Bang Migration  
1. Build complete API backend
2. Migrate all data to PostgreSQL
3. Switch frontend to API in one go
4. Remove CSV loading entirely

### 7. Data Flow (Future State)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Job Source    │───▶│   PostgreSQL    │───▶│   Frontend      │
│  (CSV/Scraper)  │    │   Database      │    │   Dashboard     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        │
                       ┌─────────────────┐              │
                       │ Classification  │              │
                       │   Service       │              │
                       │ (Backend API)   │              │
                       └─────────────────┘              │
                                ▲                        │
                                │                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │ Learning Engine │◀───│ User Feedback   │
                       │   (Backend)     │    │   API           │
                       └─────────────────┘    └─────────────────┘
```

## Immediate Next Steps

1. **Quick Fix**: Restore secondary category quick-switch (✅ Done)
2. **Backend Setup**: Create Node.js/Express API with PostgreSQL
3. **Move Classifier**: Port `EnhancedJobClassifier` to backend
4. **API Integration**: Update frontend to use backend endpoints
5. **Migration**: Move existing CSV data to PostgreSQL

## Timeline Estimate
- Phase 1 (Backend Classification): 1-2 weeks
- Phase 2 (User Corrections API): 1 week  
- Phase 3 (Learning Pipeline): 1-2 weeks
- Phase 4 (Real-time): 1 week
- **Total**: 4-6 weeks for complete migration

