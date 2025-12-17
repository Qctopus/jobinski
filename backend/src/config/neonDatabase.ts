import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Neon Database Connection
 * This is the production database that powers the Vercel deployment
 * 
 * Data flow:
 * 1. Azure PostgreSQL (source) → Local SQLite (via fullSync)
 * 2. Local SQLite → Neon PostgreSQL (via syncToNeon)
 */

const createNeonPool = (): Pool | null => {
  const neonUrl = process.env.NEON_DATABASE_URL;
  
  if (!neonUrl) {
    console.warn('⚠️ NEON_DATABASE_URL not configured - Neon sync will be skipped');
    return null;
  }

  try {
    const url = new URL(neonUrl);
    
    return new Pool({
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.slice(1),
      user: url.username,
      password: url.password,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  } catch (error) {
    console.error('❌ Failed to parse NEON_DATABASE_URL:', error);
    return null;
  }
};

export const neonPool = createNeonPool();

export const testNeonConnection = async (): Promise<boolean> => {
  if (!neonPool) {
    console.log('⚠️ Neon pool not configured');
    return false;
  }
  
  try {
    const client = await neonPool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Neon database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Neon database connection failed:', error);
    return false;
  }
};

export const closeNeonPool = async (): Promise<void> => {
  if (neonPool) {
    await neonPool.end();
    console.log('📦 Neon connection pool closed');
  }
};

export default neonPool;



