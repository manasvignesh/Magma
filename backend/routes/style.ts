// ============================================
// Style Analysis Pipeline Route
// POST /api/style/analyze
// Streams progress via SSE (Server-Sent Events)
// ============================================

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { validateImage, validateInputs } from '../utils/validation.js';
import { logger } from '../utils/logger.js';
import { analyzeBody, generateOutfits, FALLBACK_BODY_ANALYSIS, FALLBACK_OUTFITS } from '../services/gemini.js';
import { searchProducts } from '../services/serpapi.js';
import { compressImage } from '../utils/image.js';
import type { SSEEvent, BodyAnalysis, Outfit, Product } from '../types.js';

const router = Router();

// Multer: store file in memory (we need the buffer for base64)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// ============================================
// Helper: Send SSE event to client
// ============================================
function sendSSE(res: Response, event: SSEEvent) {
  if (res.writableEnded) return;
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

// ============================================
// POST /api/style/analyze
// ============================================
router.post('/analyze', upload.single('image'), async (req: Request, res: Response): Promise<void> => {
  const requestId = Date.now().toString(36);
  logger.info('PIPELINE', `Request ${requestId} started`);

  const debugInfo: any = {
    geminiAnalysis: 'pending',
    outfitGeneration: 'pending',
    productSearch: 'pending'
  };

  // ── Validate inputs ──
  const imageFile = req.file;
  const occasion = req.body?.occasion as string;
  const style = req.body?.style as string;
  const preferences = (req.body?.preferences as string) || '';

  if (!imageFile) {
    logger.error('PIPELINE', `Request ${requestId} failed: No image uploaded`);
    res.status(400).json({ error: 'No image uploaded' });
    return;
  }

  const imgValidation = validateImage(imageFile);
  if (!imgValidation.valid) {
    logger.error('PIPELINE', `Request ${requestId} failed: ${imgValidation.error}`);
    res.status(400).json({ error: imgValidation.error });
    return;
  }

  const inputValidation = validateInputs(occasion, style);
  if (!inputValidation.valid) {
    logger.error('PIPELINE', `Request ${requestId} failed: ${inputValidation.error}`);
    res.status(400).json({ error: inputValidation.error });
    return;
  }

  // ── Setup SSE stream ──
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable nginx buffering
  });

  // Heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    if (!res.writableEnded) res.write(': heartbeat\n\n');
  }, 15_000);

  // Global timeout: kill pipeline after 90 seconds
  const globalTimeout = setTimeout(() => {
    logger.error('PIPELINE', `Request ${requestId} timed out after 90 seconds`);
    sendSSE(res, {
      stage: 'error',
      message: 'Pipeline timed out after 90 seconds',
      error: 'GLOBAL_TIMEOUT',
      data: { debug: debugInfo }
    });
    cleanup();
  }, 90_000);

  function cleanup() {
    clearInterval(heartbeat);
    clearTimeout(globalTimeout);
    if (!res.writableEnded) res.end();
  }

  // Handle client disconnect
  req.on('close', () => {
    logger.warn('PIPELINE', `Client disconnected (${requestId})`);
    cleanup();
  });

  try {
    // ── Step 1: Upload / Process Image ──
    logger.info('PIPELINE', `[${requestId}] Image upload started`);
    sendSSE(res, { stage: 'uploading_photo', message: 'Processing your photo...' });

    const { buffer: compressedBuffer, mimeType: compressedMimeType } = await compressImage(imageFile.buffer);
    const imageBase64 = compressedBuffer.toString('base64');
    const mimeType = compressedMimeType;

    logger.success('PIPELINE', `[${requestId}] Image upload success: ${(compressedBuffer.length / 1024).toFixed(0)}KB, ${mimeType}`);

    // ── Step 2: Body Analysis ──
    logger.info('PIPELINE', `[${requestId}] Gemini analysis started`);
    sendSSE(res, { stage: 'analyzing_body', message: 'Analyzing your body structure...' });

    const analysis = await analyzeBody(imageBase64, mimeType, occasion, style, preferences);
    
    if (analysis === FALLBACK_BODY_ANALYSIS) {
      debugInfo.geminiAnalysis = 'fallback';
      logger.warn('PIPELINE', `[${requestId}] Gemini analysis returned fallback`);
    } else {
      debugInfo.geminiAnalysis = 'success';
      logger.success('PIPELINE', `[${requestId}] Gemini analysis response success`);
    }

    // ── Step 3: Stream partial results (analysis) ──
    sendSSE(res, {
      stage: 'understanding_style',
      message: 'Understanding your style vibe...',
      data: { analysis },
    });

    // ── Step 4: Generate Outfits ──
    logger.info('PIPELINE', `[${requestId}] Outfit generation started`);
    sendSSE(res, { stage: 'generating_outfits', message: 'Curating outfit recommendations...' });

    const outfits = await generateOutfits(analysis, imageBase64, mimeType, occasion, style, preferences);
    
    if (outfits === FALLBACK_OUTFITS) {
      debugInfo.outfitGeneration = 'fallback';
      logger.warn('PIPELINE', `[${requestId}] Outfit generation returned fallback`);
    } else {
      debugInfo.outfitGeneration = 'success';
      logger.success('PIPELINE', `[${requestId}] Outfit generation success`);
    }

    // Stream outfits immediately (before products)
    sendSSE(res, {
      stage: 'searching_products',
      message: 'Searching for matching products...',
      data: { analysis, outfits },
    });

    // ── Step 5: Product Search ──
    logger.info('PIPELINE', `[${requestId}] SerpAPI search started`);
    let products: Record<string, Product[]> = {};
    try {
      const allKeywords = outfits.flatMap((o) => o.keywords || []);
      products = await searchProducts(allKeywords);
      
      const foundCount = Object.keys(products).length;
      if (foundCount === 0) {
        debugInfo.productSearch = 'failed';
        logger.warn('PIPELINE', `[${requestId}] SerpAPI search failed to find products`);
      } else if (foundCount < allKeywords.length) {
        debugInfo.productSearch = 'partial_success';
        logger.success('PIPELINE', `[${requestId}] SerpAPI search partial success`);
      } else {
        debugInfo.productSearch = 'success';
        logger.success('PIPELINE', `[${requestId}] SerpAPI search success`);
      }
    } catch (err: any) {
      debugInfo.productSearch = 'failed';
      logger.error('PIPELINE', `[${requestId}] SerpAPI search completely failed`, err.message);
    }

    // ── Step 6: Complete ──
    logger.info('PIPELINE', `[${requestId}] Final response sent`);
    sendSSE(res, {
      stage: 'completed',
      message: 'Your style suggestions are ready!',
      data: { analysis, outfits, products, debug: debugInfo },
    });

    logger.success('PIPELINE', `Request ${requestId} completed successfully`);
  } catch (err: any) {
    logger.error('PIPELINE', `Unexpected error in ${requestId}`, err.message);
    // Even if totally broken, try to send a fallback response to prevent a blank screen
    sendSSE(res, {
      stage: 'completed',
      message: 'Recovered from an unexpected error',
      data: { 
        analysis: FALLBACK_BODY_ANALYSIS, 
        outfits: FALLBACK_OUTFITS, 
        products: {}, 
        debug: { ...debugInfo, unexpectedError: err.message } 
      },
    });
  } finally {
    cleanup();
  }
});

export default router;
