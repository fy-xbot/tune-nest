// ===== 歌曲相关 =====

export interface Song {
  id: number
  name: string
  artists: Artist[]
  album: Album
  duration: number
  tags?: string[]
}

export interface Artist {
  id: number
  name: string
}

export interface Album {
  id: number
  name: string
  publishTime?: number
}

// ===== 歌单相关 =====

export interface Playlist {
  id: number
  name: string
  trackCount: number
  coverImgUrl: string
  creator: { userId: number; nickname: string }
}

// ===== 分类相关 =====

export type ClassifyDimension = 'mood' | 'language' | 'region' | 'era' | 'genre'

export type DimensionSelection = Partial<Record<ClassifyDimension, string[]>>

export const DIMENSION_META: Record<ClassifyDimension, { label: string; categories: string[] }> = {
  mood: { label: '情绪', categories: ['激情', '舒缓', '悲伤', '浪漫', '欢快'] },
  language: { label: '语种', categories: ['华语', '英语', '日语', '韩语', '粤语'] },
  region: { label: '地区', categories: ['华语', '欧美', '日本', '韩国'] },
  era: { label: '年代', categories: ['70s', '80s', '90s', '00s', '10s', '20s'] },
  genre: { label: '风格', categories: ['流行', '摇滚', 'R&B', '嘻哈', '电子', '民谣', '古典', '爵士', 'ACG', '国风'] },
}

export interface ClassifyResult {
  songId: number
  songName: string
  artists: string
  mood?: string
  language?: string
  region?: string
  era?: string
  genre?: string
  source: 'rule' | 'ai' | 'mixed'
}

export interface CategoryGroup {
  dimension: ClassifyDimension
  category: string
  songs: ClassifyResult[]
}

// ===== 消息通信 =====

export type MessageAction =
  | 'GET_USER_PLAYLISTS'
  | 'GET_PLAYLIST_DETAIL'
  | 'GET_SONG_DETAIL'
  | 'CREATE_PLAYLIST'
  | 'ADD_SONGS_TO_PLAYLIST'
  | 'CLASSIFY_SONGS'
  | 'GET_CSRF_TOKEN'
  | 'GET_LOGIN_STATUS'

export interface ExtensionMessage {
  action: MessageAction
  data?: unknown
}

export interface ExtensionResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// ===== 设置 =====

export interface Settings {
  deepseekApiKey: string
  enableAI: boolean
  batchSize: number
  requestDelay: number
}

export const DEFAULT_SETTINGS: Settings = {
  deepseekApiKey: '',
  enableAI: true,
  batchSize: 30,
  requestDelay: 500,
}
