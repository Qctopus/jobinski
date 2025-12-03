import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const sql = getDb();
    
    // Get total jobs count
    // Handle archived column potentially being TEXT or BOOLEAN
    const countResult = await sql`
      SELECT COUNT(*) as total FROM jobs 
      WHERE archived IS NULL OR archived::text = 'false' OR archived::text = '0'
    `;
    const totalJobs = parseInt(countResult[0]?.total || '0');
    
    return res.status(200).json({
      success: true,
      data: {
        hasData: totalJobs > 0,
        needsSync: false,
        last_sync_at: new Date().toISOString(),
        total_jobs: totalJobs,
        status: 'connected'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({
      success: false,
      error: 'Database connection failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}
