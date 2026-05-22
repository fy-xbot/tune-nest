import type { Playlist, Song, Artist, Album } from '@/types'

const BASE_URL = 'https://music.163.com'

function getCsrf(): string {
  const match = document.cookie.match(/(?:^|;\s*)__csrf=([^;]+)/)
  return match?.[1] || ''
}

async function req<T>(
  path: string,
  params: Record<string, string | number> = {},
  method: 'GET' | 'POST' = 'POST'
): Promise<T> {
  const csrf = getCsrf()
  if (csrf) params['csrf_token'] = csrf

  const url = new URL(`${BASE_URL}${path}`)
  const opts: RequestInit = {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  }

  if (method === 'POST') {
    opts.body = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    ).toString()
  } else {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))
  }

  const res = await fetch(url.toString(), opts)
  if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`)
  return res.json()
}

export async function getLoginStatusDirect(): Promise<{ userId: number; nickname: string } | null> {
  try {
    console.info('[TuneNest] checking login, cookie:', document.cookie.substring(0, 100))
    const res = await req<Record<string, unknown>>('/api/w/nuser/account/get')
    console.info('[TuneNest] login API response:', JSON.stringify(res).substring(0, 500))
    // 尝试多种响应格式
    const profile = (res as any)?.data?.profile || (res as any)?.profile || null
    console.info('[TuneNest] parsed profile:', profile)
    return profile
  } catch (err) {
    console.error('[TuneNest] login check error:', err)
    return null
  }
}

export async function getUserPlaylistsDirect(uid: number): Promise<Playlist[]> {
  const res = await req<{ playlist?: Playlist[] }>(
    '/api/user/playlist',
    { uid, limit: 1000, offset: 0 }
  )
  return res.playlist || []
}

export async function getPlaylistDetailDirect(id: number): Promise<Song[]> {
  const res = await req<{
    playlist?: {
      trackIds?: Array<{ id: number }>
      tracks?: Array<{
        id: number; name: string
        ar: Array<{ id: number; name: string }>
        al: { id: number; name: string; publishTime?: number }
        dt: number
      }>
    }
  }>('/api/v6/playlist/detail', { id, n: 100000 })

  const tracks = res.playlist?.tracks || []

  if (tracks.length === 0 && (res.playlist?.trackIds?.length ?? 0) > 0) {
    const ids = res.playlist!.trackIds!.map((t) => t.id)
    const batched: Song[] = []
    for (let i = 0; i < ids.length; i += 1000) {
      const part = await getSongDetailsDirect(ids.slice(i, i + 1000))
      batched.push(...part)
      if (i + 1000 < ids.length) await new Promise((r) => setTimeout(r, 500))
    }
    return batched
  }

  return tracks.map((t) => ({
    id: t.id,
    name: t.name,
    artists: t.ar.map((a): Artist => ({ id: a.id, name: a.name })),
    album: { id: t.al.id, name: t.al.name, publishTime: t.al.publishTime } as Album,
    duration: t.dt,
  }))
}

export async function getSongDetailsDirect(ids: number[]): Promise<Song[]> {
  const c = JSON.stringify(ids.map((id) => ({ id })))
  const res = await req<{
    songs?: Array<{
      id: number; name: string
      ar: Array<{ id: number; name: string }>
      al: { id: number; name: string; publishTime?: number }
      dt: number
    }>
  }>('/api/v3/song/detail', { c })
  return (res.songs || []).map((t) => ({
    id: t.id,
    name: t.name,
    artists: t.ar.map((a): Artist => ({ id: a.id, name: a.name })),
    album: { id: t.al.id, name: t.al.name, publishTime: t.al.publishTime } as Album,
    duration: t.dt,
  }))
}

export async function createPlaylistDirect(name: string): Promise<number> {
  const res = await req<Record<string, any>>(
    '/api/playlist/create',
    { name, privacy: 0, type: 'NORMAL' }
  )
  console.info('[TuneNest] createPlaylist response:', JSON.stringify(res).substring(0, 300))
  const pid = res.id || res.playlist?.id
  if (!pid) {
    throw new Error(`创建歌单失败: ${res.code || res.message || JSON.stringify(res).substring(0, 100)}`)
  }
  return pid
}

export async function findPlaylistByName(
  uid: number,
  name: string
): Promise<{ id: number; trackCount: number } | null> {
  const playlists = await getUserPlaylistsDirect(uid)
  const found = playlists.find((p) => p.name === name && p.creator.userId === uid)
  return found ? { id: found.id, trackCount: found.trackCount } : null
}

export async function clearPlaylistTracks(pid: number, trackIds: number[]): Promise<void> {
  if (trackIds.length === 0) return
  for (let i = 0; i < trackIds.length; i += 100) {
    await req('/api/playlist/manipulate/tracks', {
      op: 'del',
      pid,
      trackIds: JSON.stringify(trackIds.slice(i, i + 100)),
      imme: 'true',
    })
    if (i + 100 < trackIds.length) await new Promise((r) => setTimeout(r, 500))
  }
}

export async function getPlaylistTrackIds(pid: number): Promise<number[]> {
  const res = await req<{
    playlist?: { trackIds?: Array<{ id: number }> }
  }>('/api/v6/playlist/detail', { id: pid, n: 0 })
  return res.playlist?.trackIds?.map((t) => t.id) || []
}

export async function addSongsToPlaylistDirect(pid: number, trackIds: number[]): Promise<void> {
  await req('/api/playlist/manipulate/tracks', {
    op: 'add',
    pid,
    trackIds: JSON.stringify(trackIds),
    imme: 'true',
  })
}

export interface PlayRecordItem {
  playCount: number
  score: number
  song: Song
}

export async function getPlayRecordDirect(
  uid: number,
  type: 0 | 1 = 0
): Promise<PlayRecordItem[]> {
  const res = await req<Record<string, any>>(
    '/api/v1/play/record',
    { uid, type }
  )

  const rawList: Array<{ playCount: number; score: number; song: any }> =
    type === 0 ? res.allData || [] : res.weekData || []

  return rawList.map((item) => ({
    playCount: item.playCount,
    score: item.score,
    song: {
      id: item.song.id,
      name: item.song.name,
      artists: (item.song.ar || []).map((a: any): Artist => ({ id: a.id, name: a.name })),
      album: {
        id: item.song.al?.id,
        name: item.song.al?.name,
        publishTime: item.song.al?.publishTime,
      } as Album,
      duration: item.song.dt,
    },
  }))
}
