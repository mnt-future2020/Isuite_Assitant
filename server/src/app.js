import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.js';
import path from 'path';
import os from 'os';
import fs from 'fs';

const app = express();

/**
 * Configure global middleware and routes
 */
function createApp() {
    // Middleware - Dynamic CORS based on environment
    const allowedOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',')
        : ['http://localhost:3000', 'http://127.0.0.1:3000']; // Default for development

    app.use(cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps or Postman)
            if (!origin) return callback(null, true);

            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true,
        optionsSuccessStatus: 200
    }));
    app.use(express.json({ limit: '25mb' })); // Reduced from 50mb to match new file limits

    // Mount API routes
    app.use('/api', apiRoutes);

    // Serve static files from persistent storage
    const storagePath = path.join(os.homedir(), 'Documents', 'ISuite_Images');
    if (!fs.existsSync(storagePath)) {
        fs.mkdirSync(storagePath, { recursive: true });
    }
    app.use('/images', express.static(storagePath));

    // Global Error Handler
    app.use((err, req, res, next) => {
        console.error('[SERVER ERROR]', err);
        res.status(500).json({ error: 'Internal Server Error', message: err.message });
    });

    return app;
}

export default createApp;
