import { useEffect, useState } from 'react'
import type { Settings } from '@/types'
import { DEFAULT_SETTINGS } from '@/types'

export function OptionsApp() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  useEffect(() => {
    chrome.storage.sync.get('settings', (result) => {
      if (result.settings) {
        setSettings({ ...DEFAULT_SETTINGS, ...result.settings })
      }
    })
  }, [])

  const save = () => {
    chrome.storage.sync.set({ settings }, () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  const testConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.deepseekApiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 5,
        }),
      })
      if (res.ok) {
        setTestResult('✓ 连接成功')
      } else {
        const err = await res.text()
        setTestResult(`✗ 失败: ${res.status} ${err.slice(0, 100)}`)
      }
    } catch (err) {
      setTestResult(`✗ 网络错误: ${err instanceof Error ? err.message : '未知'}`)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto py-10 px-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">TuneNest 设置</h1>

      <div className="space-y-6">
        {/* DeepSeek API Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            DeepSeek API Key
          </label>
          <input
            type="password"
            value={settings.deepseekApiKey}
            onChange={(e) => setSettings({ ...settings, deepseekApiKey: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="sk-..."
          />
          <div className="flex items-center gap-2 mt-2">
            <button
              className="text-sm text-primary hover:underline"
              onClick={testConnection}
              disabled={testing || !settings.deepseekApiKey}
            >
              {testing ? '测试中...' : '测试连通性'}
            </button>
            {testResult && (
              <span className={`text-xs ${testResult.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>
                {testResult}
              </span>
            )}
          </div>

          <details className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-lg p-3 border border-gray-100">
            <summary className="cursor-pointer font-medium text-gray-600 select-none">
              如何获取 DeepSeek API Key？
            </summary>
            <ol className="mt-2 space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>
                打开{' '}
                <a href="https://platform.deepseek.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  platform.deepseek.com
                </a>
                {' '}并注册/登录
              </li>
              <li>进入控制台，点击左侧「API Keys」菜单</li>
              <li>点击「创建 API Key」，复制生成的密钥（以 sk- 开头）</li>
              <li>回到此页面粘贴到上方输入框，点击保存</li>
            </ol>
            <p className="mt-2 text-gray-400">
              新注册用户有免费额度，日常分类消耗极少（约几分钱/千首歌）。
              不配置 API Key 也可以使用，仅用规则分类（准确度稍低）。
            </p>
          </details>
        </div>

        {/* 启用 AI */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enableAI}
              onChange={(e) => setSettings({ ...settings, enableAI: e.target.checked })}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm text-gray-700">启用 AI 分类（规则无法判定时使用）</span>
          </label>
        </div>

        {/* 批量大小 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            AI 批量大小（每次发送歌曲数）
          </label>
          <input
            type="number"
            min={5}
            max={50}
            value={settings.batchSize}
            onChange={(e) => setSettings({ ...settings, batchSize: Number(e.target.value) })}
            className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* 请求延迟 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            请求间隔 (ms)
          </label>
          <input
            type="number"
            min={200}
            max={3000}
            step={100}
            value={settings.requestDelay}
            onChange={(e) => setSettings({ ...settings, requestDelay: Number(e.target.value) })}
            className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <p className="text-xs text-gray-400 mt-1">避免请求过快被网易云限流</p>
        </div>

        {/* 保存 */}
        <button className="tn-btn tn-btn-primary" onClick={save}>
          保存设置
        </button>
        {saved && <span className="text-sm text-green-600 ml-3">已保存</span>}
      </div>
    </div>
  )
}
