// ============================================
// Promise timeout wrapper
// Races any promise against a timer to prevent infinite hangs
// ============================================

export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Operation timed out after ${ms}ms`);
    this.name = 'TimeoutError';
  }
}

export function withTimeout<T>(promise: Promise<T>, ms: number, label = 'Operation'): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new TimeoutError(ms)), ms)
    ),
  ]).catch((err) => {
    if (err instanceof TimeoutError) {
      console.error(`⏱️  ${label} timed out after ${ms}ms`);
    }
    throw err;
  });
}
