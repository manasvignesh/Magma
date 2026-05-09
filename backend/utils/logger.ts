// ============================================
// Structured logger with timestamps and color coding
// ============================================

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
};

function timestamp(): string {
  return new Date().toISOString().split('T')[1].replace('Z', '');
}

export const logger = {
  info(tag: string, message: string, data?: any) {
    console.log(`${COLORS.dim}${timestamp()}${COLORS.reset} ${COLORS.cyan}[${tag}]${COLORS.reset} ${message}`, data ?? '');
  },

  success(tag: string, message: string, data?: any) {
    console.log(`${COLORS.dim}${timestamp()}${COLORS.reset} ${COLORS.green}✓ [${tag}]${COLORS.reset} ${message}`, data ?? '');
  },

  warn(tag: string, message: string, data?: any) {
    console.warn(`${COLORS.dim}${timestamp()}${COLORS.reset} ${COLORS.yellow}⚠ [${tag}]${COLORS.reset} ${message}`, data ?? '');
  },

  error(tag: string, message: string, data?: any) {
    console.error(`${COLORS.dim}${timestamp()}${COLORS.reset} ${COLORS.red}✖ [${tag}]${COLORS.reset} ${message}`, data ?? '');
  },

  stage(stage: string, message: string) {
    console.log(`${COLORS.dim}${timestamp()}${COLORS.reset} ${COLORS.magenta}${COLORS.bright}▸ ${stage}${COLORS.reset} ${message}`);
  },
};
