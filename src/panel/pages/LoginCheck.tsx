import { useEffect, useState } from 'react'
import { getLoginStatusDirect } from '@/api/netease-direct'

interface Props {
  onSuccess: (uid: number) => void
}

export function LoginCheck({ onSuccess }: Props) {
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkLogin()
  }, [])

  const checkLogin = async () => {
    setChecking(true)
    setError(null)
    try {
      const profile = await getLoginStatusDirect()
      if (profile) {
        onSuccess(profile.userId)
      } else {
        setError('请先登录网易云音乐')
      }
    } catch (err) {
      setError('检测登录状态失败，请刷新页面重试')
    } finally {
      setChecking(false)
    }
  }

  if (checking) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 text-sm">检测登录状态...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-red-500 text-sm mb-4">{error}</p>
        <button className="tn-btn tn-btn-primary" onClick={checkLogin}>
          重新检测
        </button>
      </div>
    )
  }

  return null
}
