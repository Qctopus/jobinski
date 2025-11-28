import { pool } from '../config/database';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
    console.log('🚀 Running database migration...\n');

    try {
        // Read migration file
        const migrationPath = path.join(__dirname, '../../migrations/001_add_categorization_system.sql');
        console.log(`📄 Reading: ${migrationPath}`);

        const sql = fs.readFileSync(migrationPath, 'utf-8');

        // Execute migration
        console.log('⚡ Executing SQL...');
        await pool.query(sql);

        console.log('\n✅ Migration completed successfully!');
        console.log('\nAdded:');
        console.log('  - Categorization columns to jobs table');
        console.log('  - user_corrections table');
        console.log('  - learned_patterns table');
        console.log('  - sync_status table');
        console.log('  - Performance indexes');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
