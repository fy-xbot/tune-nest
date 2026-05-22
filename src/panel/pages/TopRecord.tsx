import { useEffect, useState } from 'react'
import { getPlayRecordDirect, type PlayRecordItem } from '@/api/netease-direct'

interface Props {
  uid: number
  onBack: () => void
}

export function TopRecord({ uid, onBack }: Props) {
  const [records, setRecords] = useState<PlayRecordItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<0 | 1>(0)

  useEffect(() => {
    loadRecords(tab)
  }, [tab])

  const loadRecords = async (type: 0 | 1) => {
    setLoading(true)
    setError(null)
    try {
      const data = await getPlayRecordDirect(uid, type)
      setRecords(data)
    } catch {
      setError('获取听歌排行失败，可能对方设置了隐私')
    } finally {
      setLoading(false)
    }
  }

  const formatCount = (n: number) => {
    if (n >= 10000) return `${(n / 10000).toFixed(1)}万`
    return String(n)
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button
          className="text-gray-400 hover:text-gray-600 text-sm cursor-pointer"
          onClick={onBack}
        >
          ← 返回
        </button>
        <h3 className="text-sm font-bold text-gray-800 flex-1 text-center">🏆 听歌排行</h3>
        <div className="w-10" />
      </div>

      <div className="flex gap-2 mb-4">
        <button
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
            tab === 0
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
          onClick={() => setTab(0)}
        >
          所有时间
        </button>
        <button
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
            tab === 1
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
          onClick={() => setTab(1)}
        >
          最近一周
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center py-12">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-500 text-sm">加载中...</p>
        </div>
      )}

      {error && <p className="text-red-500 text-sm text-center py-8">{error}</p>}

      {!loading && !error && records.length === 0 && (
        <p className="text-gray-400 text-sm text-center py-8">暂无听歌记录</p>
      )}

      {!loading && !error && records.length > 0 && (
        <div className="space-y-0.5">
          <p className="text-xs text-gray-400 mb-2">共 {records.length} 首</p>
          {records.map((item, idx) => (
            <div
              key={item.song.id}
              className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span
                className={`w-5 text-center text-xs font-bold shrink-0 ${
                  idx < 3 ? 'text-primary' : 'text-gray-400'
                }`}
              >
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate leading-tight">
                  {item.song.name}
                </p>
                <p className="text-[11px] text-gray-400 truncate leading-tight">
                  {item.song.artists.map((a) => a.name).join(' / ')}
                </p>
              </div>
              <span className="text-[11px] text-gray-400 whitespace-nowrap shrink-0">
                {formatCount(item.playCount)}次
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
