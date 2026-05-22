interface FeatureItem {
  icon: string
  title: string
  desc: string
  action: () => void
}

interface Props {
  onNavigate: (target: string) => void
}

export function Home({ onNavigate }: Props) {
  const features: FeatureItem[] = [
    {
      icon: '🎯',
      title: '智能歌单分类',
      desc: '按情绪、语种、风格等维度自动整理歌单',
      action: () => onNavigate('select'),
    },
    {
      icon: '🏆',
      title: '听歌排行 Top100',
      desc: '查看你播放最多的歌曲排行榜',
      action: () => onNavigate('top-record'),
    },
  ]

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">选择要使用的功能</p>
      <div className="space-y-2">
        {features.map((f) => (
          <button
            key={f.title}
            className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-primary hover:bg-red-50 text-left transition-all cursor-pointer group"
            onClick={f.action}
          >
            <span className="text-2xl shrink-0">{f.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 group-hover:text-primary transition-colors">
                {f.title}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{f.desc}</p>
            </div>
            <span className="text-gray-300 group-hover:text-primary transition-colors text-sm">›</span>
          </button>
        ))}
      </div>
    </div>
  )
}
