// ============================================
// ScrapingBee Google Shopping Service
// Product search with timeout, fallback, and parallel execution
// ============================================

import { withTimeout } from '../utils/timeout.js';
import { logger } from '../utils/logger.js';
import type { Product } from '../types.js';

const SCRAPINGBEE_KEY = process.env.SCRAPINGBEE_KEY || process.env.SEARCHAPI_KEY || process.env.SERPAPI_KEY;

if (!SCRAPINGBEE_KEY) {
  logger.warn('SCRAPINGBEE', 'API Key is not configured in .env.local');
} else {
  logger.info('SCRAPINGBEE', `API Key loaded: ${SCRAPINGBEE_KEY.substring(0, 5)}...`);
}

const SEARCH_TIMEOUT = 10_000; // 10 seconds per search
const MAX_PRODUCTS_PER_QUERY = 5;

// ============================================
// Fallback: generate placeholder products
// ============================================
function generateFallbackProducts(query: string): Product[] {
  logger.info('SCRAPINGBEE', `Generating fallbacks for: ${query}`);
  const stores = ['Amazon.in', 'Myntra', 'Ajio', 'Flipkart'];
  const basePrices = [799, 999, 1299, 1499, 1799, 2199, 2499];

  return Array.from({ length: 3 }, (_, i) => ({
    title: query.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    image: `https://image.pollinations.ai/prompt/${encodeURIComponent(`product photo: ${query}, clean white background, fashion catalog, high quality`)}?width=300&height=400&nologo=true`,
    price: `₹${basePrices[Math.floor(Math.random() * basePrices.length)]}`,
    store: stores[i % stores.length],
    link: `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query)}`,
  }));
}

// ============================================
// Main: Search products for all keywords
// Uses Promise.allSettled so failures don't block others
// ============================================
export async function searchProducts(keywords: string[]): Promise<Record<string, Product[]>> {
  if (!SCRAPINGBEE_KEY) {
    logger.error('SCRAPINGBEE', 'Missing API key, cannot search products');
    const fallbackResults: Record<string, Product[]> = {};
    keywords.forEach(kw => {
      fallbackResults[kw.trim().toLowerCase()] = generateFallbackProducts(kw);
    });
    return fallbackResults;
  }

  logger.info('SCRAPINGBEE', `Starting search for keywords: ${keywords.join(', ')}`);
  
  // Deduplicate keywords
  const uniqueKeywords = [...new Set(keywords.map(k => k.trim().toLowerCase()))];
  const results: Record<string, Product[]> = {};

  const searchPromises = uniqueKeywords.map(async (keyword) => {
    try {
      logger.info('SCRAPINGBEE', `Fetching products for: "${keyword}"`);
      
      const params = new URLSearchParams({
        search_type: 'shopping',
        search: keyword,
        gl: 'in', // Geolocation India
        hl: 'en',
        api_key: SCRAPINGBEE_KEY,
        nb_results: String(15) 
      });

      const url = `https://app.scrapingbee.com/api/v1/google?${params.toString()}`;

      const resp = await withTimeout(
        fetch(url),
        SEARCH_TIMEOUT,
        `ScrapingBee: "${keyword}"`
      );

      if (!resp.ok) {
        throw new Error(`ScrapingBee returned ${resp.status}: ${resp.statusText}`);
      }

      const data = await resp.json();
      const shoppingResults = data.organic_results; 
      
      if (!shoppingResults || !Array.isArray(shoppingResults) || shoppingResults.length === 0) {
        logger.warn('SCRAPINGBEE', `Empty results for "${keyword}"`);
        results[keyword] = generateFallbackProducts(keyword);
        return;
      }

      logger.info('SCRAPINGBEE', `Found ${shoppingResults.length} raw items for "${keyword}"`);

      const products: Product[] = shoppingResults
        .slice(0, MAX_PRODUCTS_PER_QUERY)
        .map((item: any) => {
          const fallbackImage = `https://image.pollinations.ai/prompt/${encodeURIComponent(item.title || keyword)}?width=300&height=300&nologo=true`;
          
          return {
            title: item.title || 'Unknown Product',
            price: item.price_str || (item.price ? `₹${item.price}` : 'Check site'),
            image: item.thumbnail || item.thumbnail_url || item.image || fallbackImage,
            link: item.merchant?.url || item.url || item.link || `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(keyword)}`,
            store: item.merchant?.name || item.seller || item.source || 'Retailer'
          };
        })
        .filter((p: Product) => p.title !== 'Unknown Product');

      logger.success('SCRAPINGBEE', `Mapped ${products.length} products for "${keyword}"`);
      results[keyword] = products;

    } catch (error: any) {
      logger.warn('SCRAPINGBEE', `Failed for "${keyword}": ${error.message}. Using fallbacks.`);
      results[keyword] = generateFallbackProducts(keyword);
    }
  });

  await Promise.allSettled(searchPromises);
  
  logger.info('SCRAPINGBEE', `Total keywords searched: ${Object.keys(results).length}`);
  return results;
}
