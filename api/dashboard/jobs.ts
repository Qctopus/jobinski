import type { VercelRequest, VercelResponse } from '@vercel/node';
import jobsData from '../jobs-data.json';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const jobs = jobsData as any[];
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

