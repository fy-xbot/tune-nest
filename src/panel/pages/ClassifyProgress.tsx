import { useEffect, useState } from 'react'
import type { Song, DimensionSelection, ClassifyResult, CategoryGroup, ExtensionResponse } from '@/types'

interface Props {
  songs: Song[]
  dimensionSelection: DimensionSelection
  onComplete: (results: ClassifyResult[], grouped: CategoryGroup[]) => void
}

export function ClassifyProgress({ songs, dimensionSelection, onComplete }: Props) {
  const [phase, setPhase] = useState<'rule' | 'ai' | 'done'>('rule')
  const [progress, setProgress] = useState(0)
  const [total, setTotal] = useState(songs.length)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handler = (msg: any) => {
      if (msg?.action === 'CLASSIFY_PROGRESS' && msg.data) {
        setPhase(msg.data.phase)
        setProgress(msg.data.current)
        setTotal(msg.data.total)
      }
    }
    chrome.runtime.onMessage.addListener(handler)
    runClassification()
    return () => chrome.runtime.onMessage.removeListener(handler)
  }, [])

  const runClassification = async () => {
    try {
      const res: ExtensionResponse = await chrome.runtime.sendMessage({
        action: 'CLASSIFY_SONGS',
        data: { songs, dimensionSelection },
      })

      if (res.success && res.data) {
        const { results, grouped } = res.data as {
          results: ClassifyResult[]
          grouped: CategoryGroup[]
        }
        setPhase('done')
        setProgress(total)
        onComplete(results, grouped)
      } else {
        setError(res.error || '分类失败')
      }
    } catch (err) {
      setError('分类过程出错，请重试')
    }
  }

  const phaseLabel = {
    rule: '规则分类中',
    ai: 'AI 分类中',
    done: '完成',
  }

  const percent = total > 0 ? Math.round((progress / total) * 100) : 0

  return (
    <div className="flex flex-col items-center py-12">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6" />

      <p className="text-base font-medium text-gray-800 mb-2">{phaseLabel[phase]}</p>
      <p className="text-sm text-gray-500 mb-6">
        共 {songs.length} 首歌曲
      </p>

      <div className="w-full max-w-xs">
        <div className="tn-progress-bar">
          <div
            className="tn-progress-bar-fill"
            style={{ width: `${phase === 'done' ? 100 : Math.max(percent, 10)}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          {phase === 'done' ? '分类完成' : '处理中，请稍候...'}
        </p>
      </div>

      {error && (
        <p className="text-red-500 text-sm mt-4">{error}</p>
      )}
    </div>
  )
}
