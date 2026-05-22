const CACHE_PREFIX = 'tn_cache_'
const DEFAULT_TTL = 30 * 60 * 1000 // 30 分钟

interface CacheEntry<T> {
  data: T
  expiry: number
}

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const result = await chrome.storage.local.get(CACHE_PREFIX + key)
    const entry = result[CACHE_PREFIX + key] as CacheEntry<T> | undefined
    if (!entry) return null
    if (Date.now() > entry.expiry) {
      await chrome.storage.local.remove(CACHE_PREFIX + key)
      return null
    }
    return entry.data
  } catch {
    return null
  }
}

export async function setCache<T>(key: string, data: T, ttl = DEFAULT_TTL): Promise<void> {
  try {
    const entry: CacheEntry<T> = {
      data,
      expiry: Date.now() + ttl,
    }
    await chrome.storage.local.set({ [CACHE_PREFIX + key]: entry })
  } catch {
    // storage full or error, silently fail
  }
}

export async function clearCache(): Promise<void> {
  const all = await chrome.storage.local.get(null)
  const cacheKeys = Object.keys(all).filter((k) => k.startsWith(CACHE_PREFIX))
  if (cacheKeys.length > 0) {
    await chrome.storage.local.remove(cacheKeys)
  }
}
