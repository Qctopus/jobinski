"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./config/database");
const sqlite_1 = require("./config/sqlite");
const readonly_jobs_1 = __importDefault(require("./routes/readonly-jobs"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const reports_1 = __importDefault(require("./routes/reports"));
dotenv_1.default.config();
const app = (0, express_1.default)();
exports.app = app;
const PORT = process.env.PORT || 5000;
const API_PREFIX = process.env.API_PREFIX || '/api';
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false
}));
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://yourdomain.com']
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: {
        success: false,
        error: 'Too many requests',
        message: 'Too many requests from this IP, please try again later.',
        timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false
});
app.use(limiter);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Jobs Analytics API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});
try {
    (0, sqlite_1.initializeDatabase)();
    console.log('✅ SQLite local cache initialized');
}
catch (err) {
    console.warn('⚠️ SQLite initialization warning:', err);
}
app.use(`${API_PREFIX}/jobs`, readonly_jobs_1.default);
app.use(`${API_PREFIX}/dashboard`, dashboard_1.default);
app.use(`${API_PREFIX}/reports`, reports_1.default);
app.get(`${API_PREFIX}/health`, (req, res) => {
    res.json({
        success: true,
        message: 'Jobs Analytics API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});
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
            },
            reports: {
                generate: `${API_PREFIX}/reports/generate`,
                list: `${API_PREFIX}/reports/list`,
                agencies: `${API_PREFIX}/reports/agencies`,
                preview: `${API_PREFIX}/reports/preview/:agency`,
                download: `${API_PREFIX}/reports/download/:reportId`
            }
        },
        timestamp: new Date().toISOString()
    });
});
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
        timestamp: new Date().toISOString()
    });
});
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production'
            ? 'Something went wrong!'
            : error.message,
        timestamp: new Date().toISOString()
    });
});
const gracefulShutdown = async (signal) => {
    console.log(`\\n📡 Received ${signal}. Starting graceful shutdown...`);
    server.close(async () => {
        console.log('🔒 HTTP server closed.');
        try {
            await (0, database_1.closeDatabase)();
            (0, sqlite_1.closeDb)();
            console.log('✅ Graceful shutdown completed.');
            process.exit(0);
        }
        catch (error) {
            console.error('❌ Error during shutdown:', error);
            process.exit(1);
        }
    });
    setTimeout(() => {
        console.error('❌ Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 30000);
};
const startServer = async () => {
    try {
        console.log('🔍 Testing database connection...');
        const dbConnected = await (0, database_1.testConnection)();
        if (!dbConnected) {
            console.error('❌ Failed to connect to database. Please check your .env file.');
            console.error('Make sure DB_USER, DB_PASSWORD, and other credentials are correct.');
            process.exit(1);
        }
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
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        return server;
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
let server;
if (require.main === module) {
    startServer().then((s) => { server = s; });
}
//# sourceMappingURL=server.js.map