# 🚀 PostgreSQL Backend Setup Guide

This guide will help you set up the PostgreSQL backend for persistent job categorization.

## 🎯 What This Achieves

✅ **Persistent Categories** - Job categories saved permanently in PostgreSQL  
✅ **User Corrections** - User feedback persisted across sessions  
✅ **Learning System** - Pattern detection and dictionary improvements  
✅ **API Integration** - RESTful API for all job operations  
✅ **Fallback Support** - Graceful fallback to CSV if backend unavailable  

## 📋 Prerequisites

- Node.js 16+ installed
- PostgreSQL database (your existing one with jobs table)
- Basic knowledge of environment variables

## 🛠️ Setup Steps

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Run Automated Setup
```bash
# Make setup script executable (Linux/Mac)
chmod +x setup.sh
./setup.sh

# Or run manually (Windows/if script fails)
npm install
cp env.example .env
# Edit .env with your database credentials
npm run build
npm run migrate
```

### 3. Configure Environment

Edit `backend/.env` with your PostgreSQL details:

```env
# Your existing PostgreSQL database
DATABASE_URL=postgresql://username:password@localhost:5432/your_database

# Or use individual parameters
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password

# Server configuration
PORT=5000
NODE_ENV=development
```

### 4. Test Database Connection
```bash
npm run build
node -e "const { testConnection } = require('./dist/config/database'); testConnection();"
```

### 5. Run Database Migration
```bash
npm run migrate
```

This adds classification columns to your existing `jobs` table:
- `primary_category`
- `secondary_categories` 
- `classification_confidence`
- `is_user_corrected`
- And more...

### 6. Classify Existing Jobs
```bash
npm run classify-all
```

This will automatically categorize all your existing jobs.

### 7. Start Backend Server
```bash
# Development mode (with hot reload)
npm run dev

# Or production mode
npm run build
npm start
```

Backend will be available at: `http://localhost:5000`

### 8. Update Frontend Environment

Create/update `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 9. Test Integration

Start both servers:
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend  
cd ..
npm start
```

## 🔍 Verification

### Backend Health Check
```bash
curl http://localhost:5000/health
```

### Get Jobs via API
```bash
curl "http://localhost:5000/api/jobs?limit=5"
```

### Frontend Integration
- Open `http://localhost:3000`
- Check browser console for: "✅ Backend API detected - using PostgreSQL data"
- User corrections should now persist across page refreshes

## 📊 Database Schema Changes

The migration adds these columns to your `jobs` table:

| Column | Type | Purpose |
|--------|------|---------|
| `primary_category` | VARCHAR(100) | Main job category |
| `secondary_categories` | JSONB | Alternative categories |
| `classification_confidence` | DECIMAL(5,2) | 0-100 confidence score |
| `classification_reasoning` | JSONB | Why this category was chosen |
| `is_user_corrected` | BOOLEAN | User manually corrected |
| `user_corrected_by` | VARCHAR(100) | Who corrected it |
| `user_corrected_at` | TIMESTAMP | When corrected |
| `classified_at` | TIMESTAMP | When auto-classified |

Additional tables created:
- `user_feedback` - User correction history
- `classification_log` - Audit trail
- `learned_patterns` - ML patterns
- `schema_migrations` - Migration tracking

## 🎮 Usage

### User Workflow
1. User opens job browser
2. Sees jobs with categories (from database)
3. Clicks "Edit" to reclassify a job
4. Correction saved to PostgreSQL immediately
5. Learning engine processes feedback
6. Future similar jobs classified better

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/jobs` | List jobs with filters |
| GET | `/api/jobs/:id` | Get specific job |
| PUT | `/api/jobs/:id/category` | Update job category |
| POST | `/api/jobs/classify` | Classify single job |
| POST | `/api/jobs/classify/batch` | Batch classify jobs |
| GET | `/api/jobs/stats/classification` | Get statistics |

## 🔧 Troubleshooting

### "Database connection failed"
1. Check PostgreSQL is running
2. Verify credentials in `.env`
3. Test connection: `psql -h localhost -U username -d database_name`

### "Migration failed" 
1. Ensure user has CREATE/ALTER permissions
2. Check if `jobs` table exists
3. Run migration manually: `npm run migrate`

### "Frontend still using CSV"
1. Check backend is running on port 5000
2. Verify `REACT_APP_API_URL` in frontend `.env`
3. Check browser console for connection errors

### "User corrections not persisting"
1. Check backend logs for API errors
2. Verify database write permissions
3. Test API directly: `curl -X PUT http://localhost:5000/api/jobs/1/category -H "Content-Type: application/json" -d '{"primary_category": "digital-technology"}'`

## 🚀 Production Deployment

### Backend
1. Set `NODE_ENV=production`
2. Use connection pooling
3. Enable SSL for database
4. Configure CORS for your domain
5. Set up monitoring/logging

### Database
1. Backup before migration
2. Index performance tuning
3. Regular maintenance
4. Monitor connection limits

## 📈 Monitoring

### Check Classification Stats
```bash
curl http://localhost:5000/api/jobs/stats/classification
```

### Monitor Logs
```bash
# Development
npm run dev

# Production  
pm2 logs your-app
```

## 🎉 Success Indicators

✅ Backend starts without errors  
✅ Database connection successful  
✅ Migration completes successfully  
✅ Existing jobs get classified  
✅ Frontend shows "Backend API detected"  
✅ User corrections persist across refreshes  
✅ API returns job data with categories  

## 🆘 Support

If you encounter issues:

1. **Check Logs**: Backend console shows detailed error messages
2. **Test Components**: Use curl to test API endpoints individually  
3. **Database Access**: Verify you can connect to PostgreSQL directly
4. **Permissions**: Ensure database user has required permissions
5. **Network**: Check firewall/port settings

## 🎯 Next Steps

Once setup is complete:

1. **Classify Jobs**: Run `npm run classify-all` to categorize existing jobs
2. **User Testing**: Have users correct some classifications to test learning
3. **Monitor Performance**: Watch classification accuracy improve over time
4. **Scale Up**: Adjust batch sizes and connection pools for larger datasets

Your job categorization system is now powered by PostgreSQL with persistent user feedback and continuous learning! 🚀









