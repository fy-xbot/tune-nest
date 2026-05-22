import { useEffect, useState } from 'react'
import type { Playlist, Song } from '@/types'
import { getUserPlaylistsDirect, getPlaylistDetailDirect } from '@/api/netease-direct'

interface Props {
  uid: number
  onConfirm: (playlists: Playlist[], songs: Song[]) => void
}

export function PlaylistSelect({ uid, onConfirm }: Props) {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPlaylists()
  }, [uid])

  const loadPlaylists = async () => {
    setLoading(true)
    try {
      const list = await getUserPlaylistsDirect(uid)
      setPlaylists(list.filter((p) => p.creator.userId === uid))
    } catch (err) {
      setError('获取歌单失败')
    } finally {
      setLoading(false)
    }
  }

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleConfirm = async () => {
    setFetching(true)
    const selectedPlaylists = playlists.filter((p) => selected.has(p.id))
    const allSongs: Song[] = []

    try {
      for (const pl of selectedPlaylists) {
        const songs = await getPlaylistDetailDirect(pl.id)
        allSongs.push(...songs)
      }
      const unique = Array.from(new Map(allSongs.map((s) => [s.id, s])).values())
      onConfirm(selectedPlaylists, unique)
    } catch (err) {
      setError('获取歌曲详情失败')
    } finally {
      setFetching(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center py-12">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 text-sm">加载歌单中...</p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        选择要分类的歌单（已选 {selected.size} 个）
      </p>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      <div className="space-y-1 max-h-[400px] overflow-y-auto">
        {playlists.map((pl) => (
          <label key={pl.id} className="tn-checkbox-item">
            <input
              type="checkbox"
              checked={selected.has(pl.id)}
              onChange={() => toggleSelect(pl.id)}
              className="w-4 h-4 accent-primary"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{pl.name}</p>
              <p className="text-xs text-gray-400">{pl.trackCount} 首</p>
            </div>
          </label>
        ))}
      </div>

      <button
        className="tn-btn tn-btn-primary w-full mt-4"
        disabled={selected.size === 0 || fetching}
        onClick={handleConfirm}
      >
        {fetching ? '获取歌曲中...' : `确认 (${selected.size} 个歌单)`}
      </button>
    </div>
  )
}
