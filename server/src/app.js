import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.js';
import path from 'path';
import os from 'os';
import fs from 'fs';

const app = express();

// ============================================================
// Simple in-memory rate limiter (no external dependency)
// ============================================================
const rateLimitStore = new Map();

// Clean up expired entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of rateLimitStore) {
        if (now - data.windowStart > 60000) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

function rateLimit({ maxRequests = 20, windowMs = 60000 } = {}) {
    return (req, res, next) => {
        const clientId = req.ip || req.connection.remoteAddress || 'unknown';
        const now = Date.now();
        const record = rateLimitStore.get(clientId);

        if (!record || (now - record.windowStart > windowMs)) {
            rateLimitStore.set(clientId, { windowStart: now, count: 1 });
            return next();
        }

        record.count++;
        if (record.count > maxRequests) {
            return res.status(429).json({
                error: 'Too many requests. Please wait a moment before trying again.',
            });
        }
        return next();
    };
}

/**
 * Configure global middleware and routes
 */
function createApp() {
    // ---- Security Headers ----
    app.use((req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        next();
    });

    // ---- CORS ----
    const allowedOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',')
        : ['http://localhost:3000', 'http://127.0.0.1:3000'];

    app.use(cors({
        origin: (origin, callback) => {
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
    app.use(express.json({ limit: '25mb' }));

    // ---- Rate limiting on expensive endpoints ----
    app.use('/api/chat', rateLimit({ maxRequests: 15, windowMs: 60000 }));
    app.use('/api/upload', rateLimit({ maxRequests: 20, windowMs: 60000 }));
    app.use('/api/generate-title', rateLimit({ maxRequests: 20, windowMs: 60000 }));

    // ---- API Routes ----
    app.use('/api', apiRoutes);

    // ---- Static file serving ----
    const storagePath = path.join(os.homedir(), 'Documents', 'ISuite_Images');
    if (!fs.existsSync(storagePath)) {
        fs.mkdirSync(storagePath, { recursive: true });
    }
    app.use('/images', express.static(storagePath));

    // ---- Global Error Handler (never leak internal details) ----
    app.use((err, req, res, next) => {
        console.error('[SERVER ERROR]', err);
        const isProduction = process.env.NODE_ENV === 'production';
        res.status(500).json({
            error: 'Internal Server Error',
            message: isProduction ? 'Something went wrong. Please try again.' : err.message,
        });
    });

    return app;
}

export default createApp;

