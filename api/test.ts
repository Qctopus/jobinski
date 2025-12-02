import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    env_vars: Object.keys(process.env).filter(k => 
      k.includes('STORAGE') || k.includes('DATABASE') || k.includes('POSTGRES') || k.includes('NEON')
    )
  });
}

