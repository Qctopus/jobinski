import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  try {
    // 1. Check environment variables
    const envVars = Object.keys(process.env).filter(k => 
      k.includes('STORAGE') || k.includes('DATABASE') || k.includes('POSTGRES') || k.includes('NEON')
    );
    
    // 2. Try connecting
    const sql = getDb();
    const startTime = Date.now();
    const result = await sql`SELECT 1 as connected`;
    const duration = Date.now() - startTime;

    res.status(200).json({
      status: 'success',
      message: 'Database connection successful',
      duration: `${duration}ms`,
      env_vars_found: envVars,
      connection_result: result
    });
  } catch (error) {
    console.error('Database connection error:', error);
    
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error_name: error instanceof Error ? error.name : 'Unknown',
      error_message: error instanceof Error ? error.message : String(error),
      env_vars_available: Object.keys(process.env).filter(k => 
        k.includes('STORAGE') || k.includes('DATABASE') || k.includes('POSTGRES') || k.includes('NEON')
      )
    });
  }
}
