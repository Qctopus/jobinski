"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const SyncService_1 = require("../services/SyncService");
const database_1 = require("../config/database");
const sqlite_1 = require("../config/sqlite");
async function main() {
    console.log('='.repeat(60));
    console.log('🔄 UN Jobs Analytics - Data Sync Tool');
    console.log('='.repeat(60));
    console.log(`📅 Started at: ${new Date().toISOString()}`);
    console.log('');
    const syncService = new SyncService_1.SyncService();
    try {
        const result = await syncService.fullSync();
        console.log('');
        console.log('='.repeat(60));
        if (result.success) {
            console.log('✅ SYNC COMPLETED SUCCESSFULLY');
            console.log(`📊 Total jobs synced: ${result.totalJobs}`);
            console.log(`⚙️ Jobs processed: ${result.processedJobs}`);
            console.log(`⏱️ Duration: ${result.duration}ms (${(result.duration / 1000).toFixed(1)}s)`);
        }
        else {
            console.log('❌ SYNC FAILED');
            console.log(`Error: ${result.error}`);
        }
        console.log('='.repeat(60));
    }
    catch (error) {
        console.error('');
        console.error('❌ Fatal error during sync:', error);
        process.exit(1);
    }
    finally {
        try {
            await (0, database_1.closeDatabase)();
            (0, sqlite_1.closeDb)();
        }
        catch (e) {
        }
    }
    process.exit(0);
}
main();
//# sourceMappingURL=syncFromPostgres.js.map