// ============================================
// STYLE Backend Server
// Express + SSE for real-time AI fashion pipeline
// ============================================

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

import express from 'express';
import cors from 'cors';
import { logger } from './utils/logger.js';
import styleRouter from './routes/style.js';

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT || '3001', 10);

// ── Middleware ──
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// ── Request logging ──
app.use((req, _res, next) => {
  if (req.path !== '/health') {
    logger.info('HTTP', `${req.method} ${req.path}`);
  }
  next();
});

// ── Routes ──
app.use('/api/style', styleRouter);

// ── Health check ──
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'STYLE Backend',
    timestamp: new Date().toISOString(),
    env: {
      gemini: !!process.env.GEMINI_API_KEY,
      serpapi: !!process.env.SERPAPI_KEY,
    },
  });
});

// ── Root ──
app.get('/', (_req, res) => {
  res.json({
    message: '🎨 STYLE AI Fashion Backend Running',
    endpoints: {
      health: 'GET /health',
      analyze: 'POST /api/style/analyze (multipart/form-data)',
    },
  });
});

// ── Error handler ──
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('SERVER', 'Unhandled error', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ──
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log(`  ║  🎨 STYLE Backend running on port ${PORT}    ║`);
  console.log('  ╠══════════════════════════════════════════╣');
  console.log(`  ║  Gemini API Key: ${process.env.GEMINI_API_KEY ? '✓ configured' : '✖ missing'}        ║`);
  console.log(`  ║  ScrapingBee:    ${process.env.SCRAPINGBEE_KEY ? '✓ configured' : '✖ missing'}        ║`);
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('');
});
