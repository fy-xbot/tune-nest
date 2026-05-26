import type { Playlist, Song, Artist, Album } from '@/types'

const BASE_URL = 'https://music.163.com'

async function neteaseRequest<T>(
  path: string,
  params: Record<string, string | number> = {},
  method: 'GET' | 'POST' = 'POST'
): Promise<T> {
  const csrf = await getCsrfToken()
  const url = new URL(`${BASE_URL}${path}`)

  if (csrf) {
    params['csrf_token'] = csrf
  }

  const options: RequestInit = {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Referer': BASE_URL,
    },
  }

  if (method === 'POST') {
    options.body = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    ).toString()
  } else {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))
  }

  const res = await fetch(url.toString(), options)
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

async function getCsrfToken(): Promise<string> {
  const cookie = await chrome.cookies.get({
    url: BASE_URL,
    name: '__csrf',
  })
  return cookie?.value || ''
}

// ===== 登录状态 =====

interface LoginStatusResponse {
  data: {
    code: number
    profile?: { userId: number; nickname: string; avatarUrl: string }
  }
}

export async function getLoginStatus() {
  const res = await neteaseRequest<LoginStatusResponse>('/api/w/nuser/account/get')
  const profile = res.data?.profile
  if (!profile) return null
  return profile
}

// ===== 用户歌单 =====

interface PlaylistResponse {
  playlist: Array<{
    id: number
    name: string
    trackCount: number
    coverImgUrl: string
    creator: { userId: number; nickname: string }
  }>
}

export async function getUserPlaylists(uid: number): Promise<Playlist[]> {
  const res = await neteaseRequest<PlaylistResponse>(
    '/api/user/playlist',
    { uid, limit: 1000, offset: 0 }
  )
  return res.playlist || []
}

// ===== 歌单详情 =====

interface PlaylistDetailResponse {
  playlist: {
    trackIds: Array<{ id: number }>
    tracks: Array<{
      id: number
      name: string
      ar: Array<{ id: number; name: string }>
      al: { id: number; name: string; publishTime?: number }
      dt: number
    }>
  }
}

export async function getPlaylistDetail(id: number): Promise<Song[]> {
  const res = await neteaseRequest<PlaylistDetailResponse>(
    '/api/v6/playlist/detail',
    { id, n: 100000 }
  )

  let tracks = res.playlist?.tracks || []

  // 歌单超过 1000 首时 tracks 为空，需用 trackIds 批量获取
  if (tracks.length === 0 && res.playlist?.trackIds?.length > 0) {
    const ids = res.playlist.trackIds.map((t) => t.id)
    const BATCH = 1000
    const batched: Song[] = []
    for (let i = 0; i < ids.length; i += BATCH) {
      const part = await getSongDetails(ids.slice(i, i + BATCH))
      batched.push(...part)
      if (i + BATCH < ids.length) await delay(500)
    }
    return batched
  }

  return tracks.map((t) => ({
    id: t.id,
    name: t.name,
    artists: t.ar.map((a): Artist => ({ id: a.id, name: a.name })),
    album: {
      id: t.al.id,
      name: t.al.name,
      publishTime: t.al.publishTime,
    } as Album,
    duration: t.dt,
  }))
}

// ===== 批量获取歌曲详情 =====

interface SongDetailResponse {
  songs: Array<{
    id: number
    name: string
    ar: Array<{ id: number; name: string }>
    al: { id: number; name: string; publishTime?: number }
    dt: number
  }>
}

export async function getSongDetails(ids: number[]): Promise<Song[]> {
  const c = JSON.stringify(ids.map((id) => ({ id })))
  const res = await neteaseRequest<SongDetailResponse>(
    '/api/v3/song/detail',
    { c }
  )
  return (res.songs || []).map((t) => ({
    id: t.id,
    name: t.name,
    artists: t.ar.map((a): Artist => ({ id: a.id, name: a.name })),
    album: {
      id: t.al.id,
      name: t.al.name,
      publishTime: t.al.publishTime,
    } as Album,
    duration: t.dt,
  }))
}

// ===== 创建歌单 =====

interface CreatePlaylistResponse {
  id: number
  playlist: { id: number; name: string }
}

export async function createPlaylist(name: string): Promise<number> {
  const res = await neteaseRequest<CreatePlaylistResponse>(
    '/api/playlist/create',
    { name, privacy: 0, type: 'NORMAL' }
  )
  return res.id || res.playlist?.id
}

// ===== 添加歌曲到歌单 =====

export async function addSongsToPlaylist(
  pid: number,
  trackIds: number[]
): Promise<void> {
  await neteaseRequest('/api/playlist/manipulate/tracks', {
    op: 'add',
    pid,
    trackIds: JSON.stringify(trackIds),
    imme: 'true',
  })
}

// ===== 获取歌曲标签（用于情绪分类降级） =====

interface SongTagResponse {
  data: {
    songId: number
    tags: string[]
  }[]
}

export async function getSongTags(ids: number[]): Promise<Map<number, string[]>> {
  const result = new Map<number, string[]>()
  try {
    const res = await neteaseRequest<SongTagResponse>(
      '/api/song/tags',
      { ids: JSON.stringify(ids) }
    )
    if (res.data) {
      for (const item of res.data) {
        result.set(item.songId, item.tags || [])
      }
    }
  } catch {
    // 接口可能不存在或无权限，静默失败
  }
  return result
}

// ===== 工具函数 =====

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
