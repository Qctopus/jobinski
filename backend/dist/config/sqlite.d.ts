import Database, { Database as DatabaseType } from 'better-sqlite3';
declare const db: DatabaseType;
export declare function initializeDatabase(): void;
export declare function getDb(): Database.Database;
export declare function closeDb(): void;
export default db;
//# sourceMappingURL=sqlite.d.ts.map