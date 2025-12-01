import type { VercelRequest, VercelResponse } from '@vercel/node';
import jobsData from '../jobs-data.json';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const jobs = jobsData as any[];
  
  res.status(200).json({
    success: true,
    data: {
      hasData: jobs.length > 0,
      needsSync: false,
      last_sync_at: new Date().toISOString(),
      total_jobs: jobs.length,
      status: 'completed'
    },
    timestamp: new Date().toISOString()
  });
}

