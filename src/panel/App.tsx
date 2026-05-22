import { useState, useEffect } from 'react'
import { LoginCheck } from './pages/LoginCheck'
import { PlaylistSelect } from './pages/PlaylistSelect'
import { DimensionConfig } from './pages/DimensionConfig'
import { ClassifyProgress } from './pages/ClassifyProgress'
import { ResultPreview } from './pages/ResultPreview'
import { CreateConfirm } from './pages/CreateConfirm'
import { TopRecord } from './pages/TopRecord'
import { Home } from './pages/Home'
import type { Playlist, Song, DimensionSelection, ClassifyResult, CategoryGroup } from '@/types'

const CURRENT_VERSION = (() => {
  try { return chrome.runtime.getManifest().version } catch { return '0.1.0' }
})()
const GITHUB_REPO = 'fy-xbot/tune-nest'

export type Step = 'login' | 'home' | 'select' | 'dimensions' | 'progress' | 'result' | 'create' | 'top-record'

export interface AppState {
  uid: number | null
  selectedPlaylists: Playlist[]
  songs: Song[]
  dimensionSelection: DimensionSelection
  results: ClassifyResult[]
  grouped: CategoryGroup[]
}

export function PanelApp() {
  const [open, setOpen] = useState(false)
  const [showLoginHint, setShowLoginHint] = useState(true)
  const [step, setStep] = useState<Step>('login')
  const [prevStep, setPrevStep] = useState<Step>('login')
  const [latestVersion, setLatestVersion] = useState<string | null>(null)
  const [state, setState] = useState<AppState>({
    uid: null,
    selectedPlaylists: [],
    songs: [],
    dimensionSelection: { mood: ['激情', '舒缓', '悲伤', '浪漫', '欢快'] },
    results: [],
    grouped: [],
  })

  useEffect(() => {
    checkUpdate()
  }, [])

  const checkUpdate = async () => {
    try {
      const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`)
      if (!res.ok) return
      const data = await res.json()
      const tag = (data.tag_name || '').replace(/^v/, '')
      if (tag && tag !== CURRENT_VERSION) {
        setLatestVersion(tag)
      }
    } catch { /* ignore */ }
  }

  const updateState = (partial: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...partial }))
  }

  const renderStep = () => {
    switch (step) {
      case 'login':
        return (
          <LoginCheck
            onSuccess={(uid) => {
              updateState({ uid })
              setStep('home')
            }}
          />
        )
      case 'home':
        return (
          <Home
            onNavigate={(target) => {
              setPrevStep('home')
              setStep(target as Step)
            }}
          />
        )
      case 'select':
        return (
          <PlaylistSelect
            uid={state.uid!}
            onConfirm={(playlists, songs) => {
              updateState({ selectedPlaylists: playlists, songs })
              setStep('dimensions')
            }}
          />
        )
      case 'dimensions':
        return (
          <DimensionConfig
            selection={state.dimensionSelection}
            onChange={(sel) => updateState({ dimensionSelection: sel })}
            onConfirm={() => setStep('progress')}
            onBack={() => setStep('select')}
          />
        )
      case 'progress':
        return (
          <ClassifyProgress
            songs={state.songs}
            dimensionSelection={state.dimensionSelection}
            onComplete={(results, grouped) => {
              updateState({ results, grouped })
              setStep('result')
            }}
          />
        )
      case 'result':
        return (
          <ResultPreview
            grouped={state.grouped}
            onConfirm={() => setStep('create')}
            onBack={() => setStep('dimensions')}
            onReassign={(songId, dimension, newCategory) => {
              const newGrouped = state.grouped.map((g) => {
                if (g.dimension !== dimension) return g
                return {
                  ...g,
                  songs: g.songs.filter((s) => s.songId !== songId),
                }
              }).filter((g) => g.songs.length > 0)

              const song = state.grouped
                .flatMap((g) => g.songs)
                .find((s) => s.songId === songId)

              if (song) {
                const updatedSong = { ...song, [dimension]: newCategory }
                const existing = newGrouped.find(
                  (g) => g.dimension === dimension && g.category === newCategory
                )
                if (existing) {
                  existing.songs.push(updatedSong)
                } else {
                  newGrouped.push({ dimension, category: newCategory, songs: [updatedSong] })
                }
              }

              updateState({ grouped: newGrouped })
            }}
          />
        )
      case 'create':
        return (
          <CreateConfirm
            uid={state.uid!}
            grouped={state.grouped}
            onDone={() => {
              setStep('login')
              setOpen(false)
            }}
          />
        )
      case 'top-record':
        return (
          <TopRecord
            uid={state.uid!}
            onBack={() => setStep(prevStep)}
          />
        )
    }
  }

  return (
    <>
      {/* 悬浮按钮 */}
      <div className="tn-fab-wrap">
        {showLoginHint && step === 'login' && !open && (
          <div className="tn-login-hint">
            未登录？点击这里开始检测
          </div>
        )}
        <button
          className="tn-fab"
          onClick={() => {
            setOpen(!open)
            setShowLoginHint(false)
          }}
          title="TuneNest 智能分类"
        >
          <img src={chrome.runtime.getURL('public/icons/icon128.png')} alt="TuneNest" className="w-7 h-7 rounded-full" />
        </button>
      </div>

      {/* 侧边面板 */}
      <div className={`tn-panel ${open ? 'open' : 'closed'}`}>
        <div className="tn-panel-header">
          <div className="flex items-center gap-2">
            <h2>TuneNest</h2>
            <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">v{CURRENT_VERSION}</span>
          </div>
          <div className="flex items-center gap-2">
            {state.uid && step !== 'home' && step !== 'login' && (
              <button
                className="text-gray-400 hover:text-gray-600 text-sm cursor-pointer transition-colors"
                onClick={() => setStep('home')}
                title="返回主页"
              >
                ⊞
              </button>
            )}
            <button
              className="text-gray-400 hover:text-gray-600 text-xl cursor-pointer"
              onClick={() => setOpen(false)}
            >
              ✕
            </button>
          </div>
        </div>
        {latestVersion && (
          <div className="flex items-center justify-between px-4 py-2 bg-amber-50 border-b border-amber-100 text-xs">
            <span className="text-amber-700">🎉 新版本 v{latestVersion} 可用</span>
            <a
              href={`https://github.com/${GITHUB_REPO}/releases/latest`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-semibold hover:underline"
            >
              前往更新
            </a>
          </div>
        )}
        <div className="tn-panel-body">
          {renderStep()}
        </div>
      </div>
    </>
  )
}
