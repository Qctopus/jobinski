"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function runMigration() {
    console.log('🚀 Running database migration...\n');
    try {
        const migrationPath = path.join(__dirname, '../../migrations/001_add_categorization_system.sql');
        console.log(`📄 Reading: ${migrationPath}`);
        const sql = fs.readFileSync(migrationPath, 'utf-8');
        console.log('⚡ Executing SQL...');
        await database_1.pool.query(sql);
        console.log('\n✅ Migration completed successfully!');
        console.log('\nAdded:');
        console.log('  - Categorization columns to jobs table');
        console.log('  - user_corrections table');
        console.log('  - learned_patterns table');
        console.log('  - sync_status table');
        console.log('  - Performance indexes');
        process.exit(0);
    }
    catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    }
}
runMigration();
//# sourceMappingURL=run-migration.js.map