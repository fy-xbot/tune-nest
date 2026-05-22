import type { ExtensionMessage, ExtensionResponse, Settings } from '@/types'
import { DEFAULT_SETTINGS } from '@/types'
import {
  getLoginStatus,
  getUserPlaylists,
  getPlaylistDetail,
  getSongDetails,
  createPlaylist,
  addSongsToPlaylist,
} from '@/api/netease'
import { classifySongs, groupByDimension } from '@/classifier'

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse: (r: ExtensionResponse) => void) => {
    handleMessage(message)
      .then((data) => sendResponse({ success: true, data }))
      .catch((err) => sendResponse({ success: false, error: err.message }))
    return true // keep port open for async response
  }
)

async function handleMessage(message: ExtensionMessage): Promise<unknown> {
  switch (message.action) {
    case 'GET_LOGIN_STATUS':
      return getLoginStatus()

    case 'GET_USER_PLAYLISTS': {
      const { uid } = message.data as { uid: number }
      return getUserPlaylists(uid)
    }

    case 'GET_PLAYLIST_DETAIL': {
      const { id } = message.data as { id: number }
      return getPlaylistDetail(id)
    }

    case 'GET_SONG_DETAIL': {
      const { ids } = message.data as { ids: number[] }
      return getSongDetails(ids)
    }

    case 'CREATE_PLAYLIST': {
      const { name } = message.data as { name: string }
      return createPlaylist(name)
    }

    case 'ADD_SONGS_TO_PLAYLIST': {
      const { pid, trackIds } = message.data as { pid: number; trackIds: number[] }
      await addSongsToPlaylist(pid, trackIds)
      return { success: true }
    }

    case 'CLASSIFY_SONGS': {
      const { songs, dimensionSelection, tabId } = message.data as {
        songs: Parameters<typeof classifySongs>[0]
        dimensionSelection: Parameters<typeof classifySongs>[2]
        tabId?: number
      }
      const settings = await getSettings()
      const sendProgress = (p: import('@/classifier').ClassifyProgress) => {
        if (tabId) {
          chrome.tabs.sendMessage(tabId, { action: 'CLASSIFY_PROGRESS', data: p }).catch(() => {})
        }
      }
      const results = await classifySongs(songs, settings, dimensionSelection, sendProgress)
      const dims = Object.keys(dimensionSelection) as import('@/types').ClassifyDimension[]
      const grouped = dims.map((dim) => groupByDimension(results, dim))
      return { results, grouped: grouped.flat() }
    }

    default:
      throw new Error(`Unknown action: ${message.action}`)
  }
}

async function getSettings(): Promise<Settings> {
  const stored = await chrome.storage.sync.get('settings')
  return { ...DEFAULT_SETTINGS, ...stored.settings }
}
