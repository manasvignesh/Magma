import sharp from 'sharp';
import { logger } from './logger.js';

/**
 * Compresses and resizes an image buffer to a max width of 1024px,
 * converting it to a JPEG with 70% quality.
 *
 * @param buffer The original image buffer.
 * @returns A promise that resolves to the compressed image buffer.
 */
export async function compressImage(buffer: Buffer): Promise<{ buffer: Buffer; mimeType: string }> {
  try {
    const compressedBuffer = await sharp(buffer)
      .resize({ width: 1024, withoutEnlargement: true }) // max width 1024px
      .jpeg({ quality: 70 }) // convert to JPEG at 70% quality
      .toBuffer();

    return { buffer: compressedBuffer, mimeType: 'image/jpeg' };
  } catch (error: any) {
    logger.error('IMAGE', 'Failed to compress image', error.message);
    // On failure, return the original to not break the pipeline
    // Validation already limits files to 10MB
    return { buffer, mimeType: 'image/jpeg' }; // Defaulting to jpeg for downstream processing although it might be png
  }
}
