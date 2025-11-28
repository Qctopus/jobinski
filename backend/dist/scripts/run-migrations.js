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
const pg_1 = require("pg");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const pool = new pg_1.Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});
async function runMigration(migrationFile) {
    console.log(`📝 Running migration: ${migrationFile}`);
    try {
        const migrationPath = path.join(process.cwd(), 'migrations', migrationFile);
        console.log(`Reading from: ${migrationPath}`);
        if (!fs.existsSync(migrationPath)) {
            throw new Error(`Migration file not found: ${migrationPath}`);
        }
        const sql = fs.readFileSync(migrationPath, 'utf-8');
        console.log(`Executing SQL from ${migrationFile}...`);
        await pool.query(sql);
        console.log(`✅ Migration ${migrationFile} completed successfully!`);
    }
    catch (error) {
        console.error(`❌ Migration ${migrationFile} failed:`, error);
        throw error;
    }
}
async function main() {
    try {
        console.log('🚀 Starting database migrations...\n');
        await runMigration('001_add_categorization_system.sql');
        console.log('\n✨ All migrations completed successfully!');
        process.exit(0);
    }
    catch (error) {
        console.error('\n💥 Migration failed:', error);
        process.exit(1);
    }
    finally {
        await pool.end();
    }
}
main();
//# sourceMappingURL=run-migrations.js.map