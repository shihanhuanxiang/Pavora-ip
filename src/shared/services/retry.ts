// 尊重 Retry-After；若無則 3s→6s→12s→24s，最多 4 次；之後 60–120s 斷路器冷卻。
function parseRetryAfter(e: any): number | null {
  try {
    const h = e?.response?.headers || e?.headers;
    const ra = (h?.['retry-after'] || h?.['Retry-After']);
    if (!ra) return null;
    const v = Number(ra);
    return Number.isFinite(v) ? v * 1000 : null;
  } catch { return null; }
}

let circuitOpenUntil = 0;

export async function withBackoff<T>(
  fn: () => Promise<T>,
  onRetry?: (delay: number) => void
): Promise<T> {
  const now = Date.now();
  if (now < circuitOpenUntil) {
    const wait = circuitOpenUntil - now;
    await new Promise(r => setTimeout(r, wait));
  }

  const maxRetries = 4; // 1 initial attempt + 4 retries = 5 total attempts
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (e: any) {
      const msg = String(e?.message || e || '').toLowerCase();
      const isRetriable = 
        msg.includes('429') || 
        msg.includes('too many') || 
        msg.includes('resource_exhausted') ||
        msg.includes('503') || 
        msg.includes('unavailable') || 
        msg.includes('overloaded') ||
        msg.includes('500') || // ADDED: Internal Server Error
        msg.includes('internal'); // ADDED: Internal Error
        
      if (!isRetriable || i === maxRetries) {
        // If not a retriable error or if we've exhausted retries, open circuit and throw
        circuitOpenUntil = Date.now() + 60_000 + Math.floor(Math.random() * 60_000); // 60–120s cooldown
        throw e;
      }
      
      const retryAfter = parseRetryAfter(e);
      // Increased backoff for better resilience against temporary overload (503/500 errors).
      // New logic: 3s, 6s, 12s, 24s intervals.
      const backoffDelay = Math.pow(2, i) * 3000;
      const jitter = Math.random() * 1000; // Add some randomness to avoid thundering herd
      const wait = retryAfter ?? (backoffDelay + jitter);
      
      onRetry?.(wait);
      await new Promise(r => setTimeout(r, wait));
    }
  }
  // This part should not be reachable.
  throw new Error('Retry logic failed unexpectedly.');
}