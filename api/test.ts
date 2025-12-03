import type { VercelRequest, VercelResponse } from '@vercel/node';
// We import dynamically to prevent top-level crashes
// import { getDb } from './db'; 

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 1. DEBUG: List ALL environment variable keys (not values) to see what's present
    const allEnvKeys = Object.keys(process.env);
    const dbEnvKeys = allEnvKeys.filter(k => 
      k.includes('STORAGE') || 
      k.includes('DATABASE') || 
      k.includes('POSTGRES') || 
      k.includes('NEON') ||
      k.includes('VERCEL')
    );

    // 2. Check specific expected variables
    const hasStorageUrl = !!process.env.STORAGE_URL;
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
    const hasNeonUrl = !!process.env.NEON_DATABASE_URL;

    // 3. Attempt to load the DB module dynamically
    let dbStatus = 'Not attempted';
    let connectionResult = null;
    
    try {
      // Dynamic import to catch errors during module load
      // In ESM mode on Vercel, we must import the compiled .js file
      const dbModule = await import('./db.js');
      dbStatus = 'Module loaded';
      
      const sql = dbModule.getDb();
      dbStatus = 'Client initialized';
      
      const startTime = Date.now();
      const result = await sql`SELECT 1 as connected, current_database() as db_name, version()`;
      const duration = Date.now() - startTime;
      
      connectionResult = {
        success: true,
        duration: `${duration}ms`,
        data: result
      };
    } catch (dbError) {
      console.error('DB Connection Error:', dbError);
      connectionResult = {
        success: false,
        error: dbError instanceof Error ? dbError.message : String(dbError),
        stack: dbError instanceof Error ? dbError.stack : undefined
      };
    }

    res.status(200).json({
      status: 'diagnostics',
      timestamp: new Date().toISOString(),
      environment: {
        node_version: process.version,
        has_storage_url: hasStorageUrl,
        has_database_url: hasDatabaseUrl,
        has_neon_url: hasNeonUrl,
        relevant_keys: dbEnvKeys
      },
      database_connection: {
        status: dbStatus,
        result: connectionResult
      }
    });
  } catch (fatalError) {
    console.error('Fatal Error:', fatalError);
    res.status(500).json({
      status: 'fatal_error',
      message: fatalError instanceof Error ? fatalError.message : String(fatalError)
    });
  }
}
