export interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000, maxDelay = 10000 } = options
  let lastError: Error | undefined

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))

      if (attempt === maxRetries) break

      // 指数退避 + 随机抖动
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
      const jitter = delay * 0.2 * Math.random()
      await new Promise((r) => setTimeout(r, delay + jitter))

      console.warn(
        `[TuneNest] Retry ${attempt + 1}/${maxRetries}: ${lastError.message}`
      )
    }
  }

  throw lastError
}
