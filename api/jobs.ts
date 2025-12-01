import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as fs from 'fs';
import * as path from 'path';

function loadJobs(): any[] {
  try {
    const dataPath = path.join(process.cwd(), 'api', 'jobs-data.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    return JSON.parse(rawData);
  } catch {
    return [];
  }
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const jobs = loadJobs();
  const { page = 1, limit = 50000 } = req.query;
  
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const start = (pageNum - 1) * limitNum;
  const paginatedJobs = jobs.slice(start, start + limitNum);
  
  res.status(200).json({
    success: true,
    data: paginatedJobs,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: jobs.length,
      totalPages: Math.ceil(jobs.length / limitNum)
    },
    timestamp: new Date().toISOString()
  });
}

