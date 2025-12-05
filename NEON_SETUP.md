# Neon PostgreSQL Setup for Vercel Deployment

This app uses Neon (serverless PostgreSQL) for the Vercel production deployment.

## Setup Steps

### 1. Create a Neon Account & Database

1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project
3. Copy the connection string (it looks like `postgresql://user:password@host/database?sslmode=require`)

### 2. Migrate Your Data to Neon

You need to export your existing PostgreSQL data and import it to Neon:

```bash
# Export from your existing database
pg_dump -h your-current-host -U your-user -d your-database > backup.sql

# Import to Neon (use the connection string from Neon dashboard)
psql "postgresql://user:password@host/database?sslmode=require" < backup.sql
```

Or use Neon's import feature in their dashboard.

### 3. Configure Vercel Environment Variables

In your Vercel project settings, add the following environment variable:

- **Name:** `DATABASE_URL`
- **Value:** Your Neon connection string (e.g., `postgresql://user:password@host/database?sslmode=require`)

Make sure to add this for all environments (Production, Preview, Development).

### 4. Deploy

Push to your GitHub repository. Vercel will automatically:
1. Build the React frontend
2. Deploy the API serverless functions
3. The functions will connect to Neon using the `DATABASE_URL` environment variable

## Testing Locally

To test the Neon connection locally:

```bash
# Set the environment variable
export DATABASE_URL="your-neon-connection-string"

# Or create a .env file in the root
echo 'DATABASE_URL=your-neon-connection-string' > .env
```

Then run the development server.

## Architecture

```
Browser → Vercel CDN → React App
                    → /api/* → Vercel Serverless Functions → Neon PostgreSQL
```

- Frontend: Static React build served from Vercel CDN
- API: Serverless functions in `/api/` folder
- Database: Neon PostgreSQL (serverless, scales to zero)

## Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/dashboard/sync-status` | Database connection status |
| `/api/dashboard/jobs` | Get all jobs (paginated) |
| `/api/dashboard/all` | Get dashboard analytics |

## Troubleshooting

### "DATABASE_URL environment variable is not set"
Make sure you've added the `DATABASE_URL` variable in Vercel project settings.

### "Database connection failed"
- Check if your Neon database is active (not suspended)
- Verify the connection string is correct
- Ensure SSL is enabled (add `?sslmode=require` to connection string if not present)

### API returns HTML instead of JSON
The Vercel routing may be misconfigured. Check `vercel.json` rewrites.





