import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb, formatJob } from './db.js';

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
    const { page = '1', limit = '50000', status = 'all' } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 50000);
    const offset = (pageNum - 1) * limitNum;
    
    // Build query based on status
    let jobs;
    let countResult;
    
    if (status === 'active') {
      jobs = await sql`
        SELECT * FROM jobs
        WHERE (archived IS NULL OR archived::text NOT IN ('true', 'True', 'TRUE', '1'))
          AND NULLIF(NULLIF(apply_until, ''), 'N/A')::timestamp > NOW()
        ORDER BY posting_date DESC
        LIMIT ${limitNum} OFFSET ${offset}
      `;
      countResult = await sql`
        SELECT COUNT(*) as total FROM jobs
        WHERE (archived IS NULL OR archived::text NOT IN ('true', 'True', 'TRUE', '1'))
          AND NULLIF(NULLIF(apply_until, ''), 'N/A')::timestamp > NOW()
      `;
    } else {
      jobs = await sql`
        SELECT * FROM jobs
        WHERE (archived IS NULL OR archived::text NOT IN ('true', 'True', 'TRUE', '1'))
        ORDER BY posting_date DESC
        LIMIT ${limitNum} OFFSET ${offset}
      `;
      countResult = await sql`
        SELECT COUNT(*) as total FROM jobs
        WHERE (archived IS NULL OR archived::text NOT IN ('true', 'True', 'TRUE', '1'))
      `;
    }
    
    const total = parseInt(countResult[0]?.total || '0');
    const formattedJobs = jobs.map(formatJob);
    
    return res.status(200).json({
      success: true,
      data: formattedJobs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch jobs',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}
