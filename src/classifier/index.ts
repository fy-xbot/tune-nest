import type { Song, ClassifyResult, ClassifyDimension, DimensionSelection, CategoryGroup, Settings } from '@/types'
import { classifyByRules } from './rule-classifier'
import { classifyByAI } from './ai-classifier'
import { getCache, setCache } from '@/utils/cache'

const ALL_DIMENSIONS: ClassifyDimension[] = ['mood', 'language', 'region', 'era', 'genre']
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 天

export interface ClassifyProgress {
  phase: 'rule' | 'ai' | 'done'
  current: number
  total: number
}

export async function classifySongs(
  songs: Song[],
  settings: Settings,
  dimensionSelection: DimensionSelection,
  onProgress?: (p: ClassifyProgress) => void,
): Promise<ClassifyResult[]> {
  const selectedDimensions = Object.keys(dimensionSelection) as ClassifyDimension[]
  const results = new Map<number, ClassifyResult>()

  // Step 0: 从缓存加载已分类结果
  const uncachedSongs: Song[] = []
  for (const song of songs) {
    const cached = await getCache<ClassifyResult>(`classify_${song.id}`)
    if (cached) {
      results.set(song.id, cached)
    } else {
      uncachedSongs.push(song)
    }
  }

  // Step 1: 对未缓存歌曲进行规则分类
  for (let i = 0; i < uncachedSongs.length; i++) {
    const result = classifyByRules(uncachedSongs[i])
    results.set(uncachedSongs[i].id, result)
    onProgress?.({ phase: 'rule', current: i + 1, total: uncachedSongs.length })
  }

  // Step 2: AI 补充分类（如果启用且有 API Key）
  if (settings.enableAI && settings.deepseekApiKey) {
    const needsAI = songs.filter((s) => {
      const r = results.get(s.id)!
      return selectedDimensions.some((d) => !r[d])
    })

    if (needsAI.length > 0) {
      const batchSize = settings.batchSize || 30
      for (let i = 0; i < needsAI.length; i += batchSize) {
        const batch = needsAI.slice(i, i + batchSize)
        const inputs = batch.map((s) => ({
          id: s.id,
          name: s.name,
          artists: s.artists.map((a) => a.name).join(' / '),
          album: s.album.name,
        }))

        try {
          const aiResults = await classifyByAI(inputs, settings.deepseekApiKey, dimensionSelection, results)

          for (const [songId, aiResult] of aiResults) {
            const existing = results.get(songId)
            if (existing) {
              for (const dim of ALL_DIMENSIONS) {
                if (!existing[dim] && aiResult[dim]) {
                  (existing as unknown as Record<string, unknown>)[dim] = aiResult[dim]
                  existing.source = existing.source === 'rule' ? 'mixed' : 'ai'
                }
              }
            }
          }
        } catch (err) {
          console.error('[TuneNest] AI classification batch failed:', err)
        }

        onProgress?.({
          phase: 'ai',
          current: Math.min(i + batchSize, needsAI.length),
          total: needsAI.length,
        })

        if (i + batchSize < needsAI.length) {
          await new Promise((r) => setTimeout(r, settings.requestDelay || 500))
        }
      }
    }
  }

  // Step 3: 过滤未选中的子类目 → 未分类
  for (const r of results.values()) {
    for (const dim of selectedDimensions) {
      const allowedCats = dimensionSelection[dim]
      if (allowedCats && r[dim] && !allowedCats.includes(r[dim]!)) {
        (r as unknown as Record<string, unknown>)[dim] = undefined
      }
    }
  }

  // Step 4: 缓存新分类的结果
  for (const song of uncachedSongs) {
    const r = results.get(song.id)
    if (r) {
      await setCache(`classify_${song.id}`, r, CACHE_TTL)
    }
  }

  onProgress?.({ phase: 'done', current: songs.length, total: songs.length })
  return Array.from(results.values())
}

// ===== 按维度分组 =====

export function groupByDimension(
  results: ClassifyResult[],
  dimension: ClassifyDimension,
): CategoryGroup[] {
  const groups = new Map<string, ClassifyResult[]>()

  for (const r of results) {
    const value = r[dimension] || '未分类'
    if (!groups.has(value)) {
      groups.set(value, [])
    }
    groups.get(value)!.push(r)
  }

  return Array.from(groups.entries())
    .map(([category, songs]) => ({
      dimension,
      category,
      songs,
    }))
    .sort((a, b) => b.songs.length - a.songs.length)
}
