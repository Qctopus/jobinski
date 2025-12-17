/**
 * Push to Neon Script
 * Syncs data from local SQLite to Neon PostgreSQL
 * 
 * Usage: npm run push:neon
 */

import dotenv from 'dotenv';
// Load environment variables immediately
dotenv.config();

import { SyncService } from '../services/SyncService';
import { initializeDatabase } from '../config/sqlite';
import { neonPool, closeNeonPool } from '../config/neonDatabase'; // Ensure we can close the connection

async function pushToNeon() {
  console.log('═'.repeat(60));
  console.log('🚀 Push to Neon - Sync local SQLite to Neon PostgreSQL');
  console.log('   Using optimized bulk synchronization');
  console.log('═'.repeat(60));

  try {
    // 1. Initialize local database
    initializeDatabase();

    // 1.5 Ensure target table schema supports upsert
    if (neonPool) {
      console.log('🔧 Verifying Neon schema compatibility...');
      try {
        // Ensure unique index on id for ON CONFLICT support
        await neonPool.query('CREATE UNIQUE INDEX IF NOT EXISTS jobs_id_unique_idx ON jobs (id)');
        console.log('   ✅ Verified unique constraint on jobs(id)');
      } catch (e: any) {
        console.warn('   ⚠️ Could not verify/create unique index:', e.message);
      }
    }

    // 2. Initialize sync service
    const syncService = new SyncService();

    // 3. Perform sync
    const result = await syncService.syncToNeon();

    console.log('═'.repeat(60));
    if (result.success) {
      console.log('✅ Sync completed successfully!');
      console.log(`   Updated: ${result.updated}`);
      console.log(`   Inserted: ${result.inserted}`);
    } else {
      console.error('❌ Sync failed:', result.error);
      process.exit(1);
    }
    console.log('═'.repeat(60));

  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  } finally {
    // Clean up connections
    await closeNeonPool();
  }
}

pushToNeon();

