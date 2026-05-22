import type { MusicPlatformAdapter } from './types'
import type { Playlist, Song } from '@/types'
import {
  getLoginStatus,
  getUserPlaylists,
  getPlaylistDetail,
  createPlaylist,
  addSongsToPlaylist,
  delay,
} from '@/api/netease'

export class NeteaseAdapter implements MusicPlatformAdapter {
  readonly platform = 'netease'

  async getLoginStatus() {
    return getLoginStatus()
  }

  async getUserPlaylists(uid: number): Promise<Playlist[]> {
    return getUserPlaylists(uid)
  }

  async getPlaylistSongs(playlistId: number): Promise<Song[]> {
    return getPlaylistDetail(playlistId)
  }

  async createPlaylist(name: string): Promise<number> {
    return createPlaylist(name)
  }

  async addSongsToPlaylist(playlistId: number, songIds: number[]): Promise<void> {
    const BATCH = 100
    for (let i = 0; i < songIds.length; i += BATCH) {
      await addSongsToPlaylist(playlistId, songIds.slice(i, i + BATCH))
      if (i + BATCH < songIds.length) {
        await delay(800)
      }
    }
  }
}
