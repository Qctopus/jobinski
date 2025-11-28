import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

async function runMigration(migrationFile: string) {
    console.log(`📝 Running migration: ${migrationFile}`);

    try {
        // Use absolute path relative to backend directory
        const migrationPath = path.join(process.cwd(), 'migrations', migrationFile);
        console.log(`Reading from: ${migrationPath}`);

        if (!fs.existsSync(migrationPath)) {
            throw new Error(`Migration file not found: ${migrationPath}`);
        }

        const sql = fs.readFileSync(migrationPath, 'utf-8');

        console.log(`Executing SQL from ${migrationFile}...`);
        await pool.query(sql);

        console.log(`✅ Migration ${migrationFile} completed successfully!`);
    } catch (error) {
        console.error(`❌ Migration ${migrationFile} failed:`, error);
        throw error;
    }
}

async function main() {
    try {
        console.log('🚀 Starting database migrations...\n');

        // Run migrations in order
        await runMigration('001_add_categorization_system.sql');

        console.log('\n✨ All migrations completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('\n💥 Migration failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

main();
