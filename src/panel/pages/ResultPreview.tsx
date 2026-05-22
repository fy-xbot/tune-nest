import { useState } from 'react'
import type { CategoryGroup, ClassifyDimension } from '@/types'
import { DIMENSION_META } from '@/types'

interface Props {
  grouped: CategoryGroup[]
  onConfirm: () => void
  onBack: () => void
  onReassign?: (songId: number, dimension: ClassifyDimension, newCategory: string) => void
}

const DIMENSION_LABELS: Record<string, string> = {
  mood: '情绪',
  language: '语种',
  region: '地区',
  era: '年代',
  genre: '风格',
}

export function ResultPreview({ grouped, onConfirm, onBack, onReassign }: Props) {
  const dimensions = [...new Set(grouped.map((g) => g.dimension))]
  const [editing, setEditing] = useState<{ songId: number; dim: ClassifyDimension } | null>(null)

  const handleReassign = (songId: number, dim: ClassifyDimension, newCat: string) => {
    onReassign?.(songId, dim, newCat)
    setEditing(null)
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        分类完成，共 {grouped.reduce((sum, g) => sum + g.songs.length, 0)} 首歌曲
        {onReassign && <span className="text-gray-400 ml-1">（点击歌曲可修正分类）</span>}
      </p>

      {dimensions.map((dim) => (
        <div key={dim} className="mb-6">
          <h3 className="text-sm font-bold text-gray-700 mb-2 border-b border-gray-100 pb-1">
            按{DIMENSION_LABELS[dim] || dim}
          </h3>
          {grouped
            .filter((g) => g.dimension === dim)
            .map((group) => (
              <div key={`${dim}-${group.category}`} className="tn-category-card">
                <h4>
                  {group.category}
                  <span className="ml-2 text-xs text-gray-400">
                    ({group.songs.length} 首)
                  </span>
                </h4>
                <div className="max-h-32 overflow-y-auto">
                  {group.songs.slice(0, 10).map((s) => (
                    <div key={s.songId} className="tn-song-item relative group/song">
                      {editing?.songId === s.songId && editing?.dim === dim ? (
                        <div className="flex items-center gap-1 py-0.5">
                          <span className="text-xs text-gray-500 truncate max-w-[100px]">{s.songName}</span>
                          <span className="text-xs text-gray-400">→</span>
                          <select
                            className="text-xs border border-gray-200 rounded px-1 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                            defaultValue=""
                            onChange={(e) => handleReassign(s.songId, dim, e.target.value)}
                            autoFocus
                            onBlur={() => setEditing(null)}
                          >
                            <option value="" disabled>选择类目</option>
                            {DIMENSION_META[dim].categories.map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <span
                          className={onReassign ? 'cursor-pointer hover:text-primary transition-colors' : ''}
                          onClick={() => onReassign && setEditing({ songId: s.songId, dim })}
                        >
                          {s.songName} - {s.artists}
                        </span>
                      )}
                    </div>
                  ))}
                  {group.songs.length > 10 && (
                    <p className="text-xs text-gray-400 mt-1">
                      ...还有 {group.songs.length - 10} 首
                    </p>
                  )}
                </div>
              </div>
            ))}
        </div>
      ))}

      <div className="flex gap-3 mt-4 sticky bottom-0 bg-white py-3">
        <button className="tn-btn tn-btn-secondary flex-1" onClick={onBack}>
          重新配置
        </button>
        <button className="tn-btn tn-btn-primary flex-1" onClick={onConfirm}>
          创建歌单
        </button>
      </div>
    </div>
  )
}
