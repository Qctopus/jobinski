import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { testConnection, closeDatabase } from './config/database';
import { initializeDatabase, closeDb } from './config/sqlite';
import readonlyJobsRouter from './routes/readonly-jobs';
import dashboardRouter from './routes/dashboard';
import { ApiResponse } from './types';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const API_PREFIX = process.env.API_PREFIX || '/api';

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false // Disable for development, configure properly for production
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] // Replace with your production frontend URL
    : ['http://localhost:3000', 'http://127.0.0.1:3000'], // Development origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later.',
    timestamp: new Date().toISOString()
  } as ApiResponse,
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Jobs Analytics API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  } as ApiResponse);
});

// Initialize SQLite for local caching
try {
  initializeDatabase();
  console.log('✅ SQLite local cache initialized');
} catch (err) {
  console.warn('⚠️ SQLite initialization warning:', err);
}

// API routes
app.use(`${API_PREFIX}/jobs`, readonlyJobsRouter);
app.use(`${API_PREFIX}/dashboard`, dashboardRouter);

// API Health check endpoint
app.get(`${API_PREFIX}/health`, (req, res) => {
  res.json({
    success: true,
    message: 'Jobs Analytics API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  } as ApiResponse);
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Jobs Analytics API v2.0',
    version: '2.0.0',
    endpoints: {
      health: '/health',
      jobs: `${API_PREFIX}/jobs`,
      dashboard: {
        all: `${API_PREFIX}/dashboard/all`,
        overview: `${API_PREFIX}/dashboard/overview`,
        categories: `${API_PREFIX}/dashboard/categories`,
        agencies: `${API_PREFIX}/dashboard/agencies`,
        temporal: `${API_PREFIX}/dashboard/temporal`,
        workforce: `${API_PREFIX}/dashboard/workforce`,
        skills: `${API_PREFIX}/dashboard/skills`,
        competitive: `${API_PREFIX}/dashboard/competitive`,
        jobs: `${API_PREFIX}/dashboard/jobs`,
        filters: `${API_PREFIX}/dashboard/filters`,
        syncStatus: `${API_PREFIX}/dashboard/sync-status`
      }
    },
    timestamp: new Date().toISOString()
  } as ApiResponse);
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  } as ApiResponse);
});

// Global error handler
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', error);
  
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : error.message,
    timestamp: new Date().toISOString()
  } as ApiResponse);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\\n📡 Received ${signal}. Starting graceful shutdown...`);
  
  server.close(async () => {
    console.log('🔒 HTTP server closed.');
    
    try {
      await closeDatabase();
      closeDb(); // Close SQLite
      console.log('✅ Graceful shutdown completed.');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  });

  // Force close after 30 seconds
  setTimeout(() => {
    console.error('❌ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

// Start server
const startServer = async () => {
  try {
    // Test database connection
    console.log('🔍 Testing database connection...');
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Please check your .env file.');
      console.error('Make sure DB_USER, DB_PASSWORD, and other credentials are correct.');
      process.exit(1);
    }

    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log('\\n🚀 Jobs Analytics API Server v2.0 Started!');
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📡 Server: http://localhost:${PORT}`);
      console.log(`🔗 API Base: http://localhost:${PORT}${API_PREFIX}`);
      console.log('');
      console.log('📊 Dashboard Endpoints (fast, pre-computed):');
      console.log(`   All Data: http://localhost:${PORT}${API_PREFIX}/dashboard/all`);
      console.log(`   Overview: http://localhost:${PORT}${API_PREFIX}/dashboard/overview`);
      console.log(`   Jobs: http://localhost:${PORT}${API_PREFIX}/dashboard/jobs`);
      console.log(`   Sync Status: http://localhost:${PORT}${API_PREFIX}/dashboard/sync-status`);
      console.log('');
      console.log('📋 Legacy Endpoints (direct PostgreSQL):');
      console.log(`   Jobs API: http://localhost:${PORT}${API_PREFIX}/jobs`);
      console.log('');
      console.log('🔄 To sync data from PostgreSQL, run: npm run sync:dev');
      console.log('\\n✨ Ready to serve requests!\\n');
    });

    // Graceful shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Export for testing
export { app };

// Start server if this file is run directly
let server: any;
if (require.main === module) {
  startServer().then((s) => { server = s; });
}





