/**
 * Sync Script - Pulls data from remote PostgreSQL and processes it locally
 * Run with: npm run sync:dev (development) or npm run sync (production)
 */

import dotenv from 'dotenv';
dotenv.config();

import { SyncService } from '../services/SyncService';
import { closeDatabase } from '../config/database';
import { closeDb } from '../config/sqlite';

async function main() {
  console.log('='.repeat(60));
  console.log('🔄 UN Jobs Analytics - Data Sync Tool');
  console.log('='.repeat(60));
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  console.log('');

  const syncService = new SyncService();

  try {
    const result = await syncService.fullSync();

    console.log('');
    console.log('='.repeat(60));
    if (result.success) {
      console.log('✅ SYNC COMPLETED SUCCESSFULLY');
      console.log(`📊 Total jobs synced: ${result.totalJobs}`);
      console.log(`⚙️ Jobs processed: ${result.processedJobs}`);
      console.log(`⏱️ Duration: ${result.duration}ms (${(result.duration / 1000).toFixed(1)}s)`);
    } else {
      console.log('❌ SYNC FAILED');
      console.log(`Error: ${result.error}`);
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('');
    console.error('❌ Fatal error during sync:', error);
    process.exit(1);
  } finally {
    // Clean up connections
    try {
      await closeDatabase();
      closeDb();
    } catch (e) {
      // Ignore cleanup errors
    }
  }

  process.exit(0);
}

main();
















