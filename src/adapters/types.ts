import type { Playlist, Song } from '@/types'

export interface MusicPlatformAdapter {
  readonly platform: string

  getLoginStatus(): Promise<{ userId: number; nickname: string } | null>

  getUserPlaylists(uid: number): Promise<Playlist[]>

  getPlaylistSongs(playlistId: number): Promise<Song[]>

  createPlaylist(name: string): Promise<number>

  addSongsToPlaylist(playlistId: number, songIds: number[]): Promise<void>
}
