import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean | { rejectUnauthorized: boolean } | any;
  max: number;
  min?: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
  query_timeout?: number;
  statement_timeout?: number;
  keepAlive?: boolean;
  keepAliveInitialDelayMillis?: number;
}

const createDatabaseConfig = (): DatabaseConfig => {
  // Support both DATABASE_URL and individual connection parameters
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    return {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.slice(1),
      user: url.username,
      password: url.password,
      ssl: process.env.DB_SSL === 'true' ? { 
        rejectUnauthorized: false,
        require: true 
      } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'jobs_analytics',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true' ? { 
      rejectUnauthorized: false,
      require: true 
    } : false,
    max: 10, // Reduce max connections for Azure
    min: 2, // Keep minimum connections
    idleTimeoutMillis: 60000, // Increase idle timeout
    connectionTimeoutMillis: 30000, // Increase connection timeout for large queries
    query_timeout: 30000, // Set query timeout
    statement_timeout: 30000, // Set statement timeout
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  };
};

const config = createDatabaseConfig();

// Create connection pool
export const pool = new Pool(config);

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Graceful shutdown
export const closeDatabase = async (): Promise<void> => {
  try {
    await pool.end();
    console.log('📦 Database connection pool closed');
  } catch (error) {
    console.error('Error closing database pool:', error);
  }
};

// Error handling for pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;

