import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, User, Check } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface RegisterModalProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToLogin: () => void
}

export function RegisterModal({ isOpen, onClose, onSwitchToLogin }: RegisterModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    special: false
  })

  const { signUp } = useAuth()

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password: string) => {
    const validation = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }
    setPasswordValidation(validation)
    return Object.values(validation).every(v => v)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    if (field === 'password') {
      validatePassword(value)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) {
      setError('名前を入力してください')
      return
    }

    if (!validateEmail(formData.email)) {
      setError('有効なメールアドレスを入力してください')
      return
    }

    if (!validatePassword(formData.password)) {
      setError('パスワードの要件を満たしていません')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('パスワードが一致しません')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await signUp(formData.email, formData.password, {
        name: formData.name
      })

      if (error) {
        if (error.message.includes('User already registered')) {
          setError('このメールアドレスは既に登録されています')
        } else if (error.message.includes('Invalid email')) {
          setError('有効なメールアドレスを入力してください')
        } else if (error.message.includes('Password')) {
          setError('パスワードは6文字以上で入力してください')
        } else {
          setError(error.message)
        }
      } else {
        // Success - show confirmation message
        setError('')
        alert('確認メールを送信しました。メールを確認して登録を完了してください。')
        onClose()
        resetForm()
      }
    } catch (error: any) {
      console.error('Registration error caught:', error);
      if (error.message) {
        setError(`登録エラー: ${error.message}`);
      } else {
        setError('ネットワークエラーが発生しました。インターネット接続を確認してください。');
      }
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    })
    setPasswordValidation({
      length: false,
      lowercase: false,
      uppercase: false,
      number: false,
      special: false
    })
    setError('')
  }

  const handleClose = () => {
    onClose()
    resetForm()
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
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-semibold text-neutral-900">
                新規登録
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
                  名前
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200"
                    placeholder="あなたの名前"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  メールアドレス
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-neutral-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200"
                    placeholder="your@email.com"
                    disabled={isLoading}
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
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200"
                    placeholder="パスワード"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-600"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Password validation indicators */}
                {formData.password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center space-x-2 text-xs">
                      <Check className={`w-3 h-3 ${passwordValidation.length ? 'text-green-500' : 'text-neutral-300'}`} />
                      <span className={passwordValidation.length ? 'text-green-700' : 'text-neutral-500'}>
                        8文字以上
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                      <Check className={`w-3 h-3 ${passwordValidation.lowercase ? 'text-green-500' : 'text-neutral-300'}`} />
                      <span className={passwordValidation.lowercase ? 'text-green-700' : 'text-neutral-500'}>
                        小文字を含む
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                      <Check className={`w-3 h-3 ${passwordValidation.uppercase ? 'text-green-500' : 'text-neutral-300'}`} />
                      <span className={passwordValidation.uppercase ? 'text-green-700' : 'text-neutral-500'}>
                        大文字を含む
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                      <Check className={`w-3 h-3 ${passwordValidation.number ? 'text-green-500' : 'text-neutral-300'}`} />
                      <span className={passwordValidation.number ? 'text-green-700' : 'text-neutral-500'}>
                        数字を含む
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                      <Check className={`w-3 h-3 ${passwordValidation.special ? 'text-green-500' : 'text-neutral-300'}`} />
                      <span className={passwordValidation.special ? 'text-green-700' : 'text-neutral-500'}>
                        特殊文字を含む
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  パスワード確認
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-neutral-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200"
                    placeholder="パスワードを再入力"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-600"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">パスワードが一致しません</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || !Object.values(passwordValidation).every(v => v) || formData.password !== formData.confirmPassword}
                className="w-full py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>登録中...</span>
                  </>
                ) : (
                  <span>新規登録</span>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-neutral-200">
              <p className="text-center text-sm text-neutral-600">
                既にアカウントをお持ちの方は{' '}
                <button
                  onClick={onSwitchToLogin}
                  className="text-primary-500 hover:text-primary-600 font-medium"
                >
                  ログイン
                </button>
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}