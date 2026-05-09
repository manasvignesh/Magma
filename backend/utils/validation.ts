// ============================================
// Input validation for the style pipeline
// ============================================

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImage(file: Express.Multer.File): ValidationResult {
  if (!file) {
    return { valid: false, error: 'No image file provided' };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return { valid: false, error: `Invalid image type: ${file.mimetype}. Accepted: JPEG, PNG, WebP, HEIC` };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `Image too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 10MB` };
  }

  return { valid: true };
}

export function validateInputs(occasion?: string, style?: string): ValidationResult {
  if (!occasion || occasion.trim().length === 0) {
    return { valid: false, error: 'Occasion is required' };
  }
  if (!style || style.trim().length === 0) {
    return { valid: false, error: 'Style preference is required' };
  }
  if (occasion.length > 100) {
    return { valid: false, error: 'Occasion text too long (max 100 chars)' };
  }
  if (style.length > 100) {
    return { valid: false, error: 'Style text too long (max 100 chars)' };
  }
  return { valid: true };
}
