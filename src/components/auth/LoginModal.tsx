import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToRegister: () => void
}

export function LoginModal({ isOpen, onClose, onSwitchToRegister }: LoginModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)

  const { signIn } = useAuth()

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password: string) => {
    return password.length >= 8
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Check if we're in demo mode
    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://demo.supabase.co') {
      setError('デモモードではログイン機能は利用できません。実際のSupabaseプロジェクトに接続するには、画面右上の「Connect to Supabase」ボタンをクリックしてください。')
      return
    }
    if (isLocked) {
      setError('アカウントがロックされています。しばらく時間をおいてから再試行してください。')
      return
    }

    if (!validateEmail(email)) {
      setError('有効なメールアドレスを入力してください')
      return
    }

    if (!validatePassword(password)) {
      setError('パスワードは8文字以上である必要があります')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await signIn(email, password)

      if (error) {
        const newAttempts = attempts + 1
        setAttempts(newAttempts)

        if (newAttempts >= 5) {
          setIsLocked(true)
          setError('5回連続でログインに失敗しました。アカウントが30分間ロックされました。')
          setTimeout(() => {
            setIsLocked(false)
            setAttempts(0)
          }, 30 * 60 * 1000) // 30 minutes
        } else {
          setError(`ログインに失敗しました。残り試行回数: ${5 - newAttempts}回`)
        }
      } else {
        // Success
        setAttempts(0)
        onClose()
        setEmail('')
        setPassword('')
      }
    } catch (error) {
      setError('予期しないエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    onClose()
    setEmail('')
    setPassword('')
    setError('')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-semibold text-neutral-900">
                ログイン
              </h2>
              <button
                onClick={handleClose}
                className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2"
              >
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className="text-sm text-red-700">{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  メールアドレス
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-neutral-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200"
                    placeholder="your@email.com"
                    disabled={isLoading || isLocked}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  パスワード
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-neutral-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200"
                    placeholder="パスワード（8文字以上）"
                    disabled={isLoading || isLocked}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-600"
                    disabled={isLoading || isLocked}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || isLocked || !email || !password}
                className="w-full py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>ログイン中...</span>
                  </>
                ) : (
                  <span>ログイン</span>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-neutral-200">
              <p className="text-center text-sm text-neutral-600">
                アカウントをお持ちでない方は{' '}
                <button
                  onClick={onSwitchToRegister}
                  className="text-primary-500 hover:text-primary-600 font-medium"
                >
                  新規登録
                </button>
              </p>
            </div>

            {attempts > 0 && attempts < 5 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  警告: {attempts}/5回のログイン試行が失敗しました。
                  5回失敗するとアカウントがロックされます。
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}