# Database Location & Access Guide

## Your Database Setup

**Type:** PostgreSQL  
**Name:** `baro_jobs`  
**Location:** Separate PostgreSQL server (not in your project folder)

## Where is PostgreSQL running?

Check your `.env` file to see the connection:
- If `DB_HOST=localhost` → It's running on your local machine
- If `DB_HOST` has an Azure URL → It's in Azure cloud

## How to Access Your Database

### Option 1: pgAdmin (Recommended ✅)
1. Download from: https://www.pgadmin.org/download/
2. Install and open pgAdmin
3. Right-click "Servers" → "Create" → "Server"
4. Enter your connection details from `.env`:
   - Host: check `DB_HOST`
   - Port: usually `5432`
   - Database: `baro_jobs`
   - Username: check `DB_USER`
   - Password: check `DB_PASSWORD`

### Option 2: Install psql Command Line
1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. During installation, select "Command Line Tools"
3. Then run: `psql -U your_username -d baro_jobs`

### Option 3: Azure Data Studio (if cloud-hosted)
https://azure.microsoft.com/en-us/products/data-studio/

## Running the Migration

Once you have access tool installed:

**In pgAdmin:**
1. Connect to `baro_jobs` database
2. Click Tools → Query Tool
3. Open this file: `backend/migrations/001_add_categorization_system.sql`
4. Click Execute (⚡ button)

**In psql:**
```bash
psql -U postgres -d baro_jobs -f backend/migrations/001_add_categorization_system.sql
```

## After Migration Succeeds

Let me know and I'll continue building the categorization backend!
