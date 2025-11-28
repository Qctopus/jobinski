import { Pool } from 'pg';
export declare const pool: Pool;
export declare const testConnection: () => Promise<boolean>;
export declare const closeDatabase: () => Promise<void>;
export default pool;
//# sourceMappingURL=database.d.ts.map