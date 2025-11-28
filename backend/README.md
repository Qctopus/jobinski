# Jobs Analytics Backend API

A Node.js + Express + PostgreSQL backend for the UN Jobs Analytics Dashboard with intelligent job classification capabilities.

## Features

- 🏗️ **PostgreSQL Integration** - Direct connection to your existing jobs database
- 🤖 **Intelligent Classification** - Advanced job categorization using keyword analysis
- 👤 **User Corrections** - Support for user feedback and learning
- 📊 **Analytics API** - Comprehensive job statistics and insights
- 🚀 **High Performance** - Optimized for large datasets
- 🔒 **Secure** - Rate limiting, CORS, and security headers
- 📝 **TypeScript** - Full type safety and developer experience

## Quick Start

### 1. Installation

```bash
cd backend
npm install
```

### 2. Environment Setup

Copy `env.example` to `.env` and configure your database:

```bash
cp env.example .env
```

Edit `.env` with your PostgreSQL connection details:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/your_database
PORT=5000
NODE_ENV=development
```

### 3. Database Migration

Run the migration to add classification columns to your existing jobs table:

```bash
npm run build
npm run migrate
```

### 4. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Jobs Management

- `GET /api/jobs` - Get jobs with filtering and pagination
- `GET /api/jobs/:id` - Get specific job by ID
- `PUT /api/jobs/:id/category` - Update job category (user correction)

### Classification

- `POST /api/jobs/classify` - Classify a single job
- `POST /api/jobs/classify/batch` - Batch classify multiple jobs

### Statistics

- `GET /api/jobs/stats/classification` - Get classification statistics

### Health & Info

- `GET /health` - Health check endpoint
- `GET /` - API information and endpoints

## Database Schema

The backend adds these columns to your existing `jobs` table:

```sql
-- Classification fields
primary_category VARCHAR(100)
secondary_categories JSONB DEFAULT '[]'::jsonb
classification_confidence DECIMAL(5,2)
classification_reasoning JSONB DEFAULT '[]'::jsonb

-- User correction tracking
is_user_corrected BOOLEAN DEFAULT FALSE
user_corrected_by VARCHAR(100)
user_corrected_at TIMESTAMP

-- Metadata
classified_at TIMESTAMP
is_ambiguous_category BOOLEAN DEFAULT FALSE
emerging_terms_found JSONB DEFAULT '[]'::jsonb
```

Additional tables are created for:
- `user_feedback` - Track user corrections
- `classification_log` - Audit trail of classifications
- `learned_patterns` - Machine learning patterns
- `schema_migrations` - Migration tracking

## Usage Examples

### Get Jobs with Filtering

```bash
curl "http://localhost:5000/api/jobs?category=digital-technology&confidence_min=70&limit=10"
```

### Classify Existing Jobs

```bash
# Classify all unclassified jobs
npm run classify-all

# Or classify in batches via API
curl -X POST http://localhost:5000/api/jobs/classify/batch \\
  -H "Content-Type: application/json" \\
  -d '{"limit": 50}'
```

### Update Job Category

```bash
curl -X PUT http://localhost:5000/api/jobs/123/category \\
  -H "Content-Type: application/json" \\
  -d '{
    "primary_category": "climate-environment",
    "user_id": "user123",
    "reason": "More relevant to climate work"
  }'
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment mode | development |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 900000 (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |
| `CLASSIFICATION_BATCH_SIZE` | Batch classification size | 100 |

### Classification Categories

The system includes 13 job categories:

1. **Digital & Technology** - IT, software, data science
2. **Climate & Environment** - Sustainability, green energy
3. **Health & Medical** - Healthcare, public health
4. **Education & Training** - Learning, capacity building
5. **Gender & Social Inclusion** - Equality, human rights
6. **Emergency & Humanitarian** - Crisis response, relief
7. **Peace & Security** - Peacekeeping, political affairs
8. **Governance & Policy** - Public administration, policy
9. **Economic Development** - Finance, trade, poverty reduction
10. **Communication & Advocacy** - Media, outreach, partnerships
11. **Legal & Compliance** - Legal affairs, regulatory
12. **Operations & Logistics** - Administration, supply chain
13. **Translation & Interpretation** - Language services

## Deployment

### Production Build

```bash
npm run build
npm start
```

### Database Connection

For production, ensure your PostgreSQL database:
- Has SSL enabled (if required)
- Allows connections from your server
- Has sufficient connection limits
- Is properly backed up

### Security Considerations

- Configure CORS origins for your frontend domain
- Set strong rate limits for production
- Use environment variables for all secrets
- Enable SSL for database connections
- Consider using a reverse proxy (nginx)

## Monitoring

### Health Check

```bash
curl http://localhost:5000/health
```

### Classification Statistics

```bash
curl http://localhost:5000/api/jobs/stats/classification
```

Returns:
```json
{
  "success": true,
  "data": {
    "total_jobs": 5000,
    "classified_jobs": 4950,
    "user_corrected_jobs": 150,
    "avg_confidence": 78.5,
    "low_confidence_count": 200,
    "category_distribution": {
      "operations-logistics": 800,
      "governance-policy": 600,
      "digital-technology": 500
    }
  }
}
```

## Development

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run build:watch` - Build with watch mode
- `npm run migrate` - Run database migrations
- `npm run classify-all` - Classify all existing jobs

### Project Structure

```
backend/
├── src/
│   ├── config/          # Database and configuration
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic services
│   ├── scripts/         # Utility scripts
│   ├── types/           # TypeScript type definitions
│   └── server.ts        # Main server file
├── dist/                # Compiled JavaScript (generated)
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── README.md           # This file
```

## Troubleshooting

### Database Connection Issues

1. Check PostgreSQL is running
2. Verify connection credentials in `.env`
3. Ensure database exists
4. Check firewall/network settings

### Classification Performance

- Increase `CLASSIFICATION_BATCH_SIZE` for faster processing
- Monitor database performance during batch operations
- Consider running classification during off-peak hours

### API Errors

- Check server logs for detailed error messages
- Verify request format matches API documentation
- Test with curl or Postman for debugging

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review server logs for error details
3. Verify database connection and migrations
4. Test individual API endpoints

## License

MIT License - see LICENSE file for details









