import React, { ReactNode } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { LoginModal } from './auth/LoginModal'
import { RegisterModal } from './auth/RegisterModal'

interface ProtectedRouteProps {
  children: ReactNode
  fallback?: ReactNode
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const [showLoginModal, setShowLoginModal] = React.useState(false)
  const [showRegisterModal, setShowRegisterModal] = React.useState(false)

  const switchToRegister = () => {
    setShowLoginModal(false)
    setShowRegisterModal(true)
  }

  const switchToLogin = () => {
    setShowRegisterModal(false)
    setShowLoginModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="w-12 h-12 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <>
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-display font-semibold text-neutral-900 mb-4">
              ログインが必要です
            </h2>
            <p className="text-neutral-600 mb-6">
              この機能を使用するにはログインしてください
            </p>
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              ログイン
            </button>
          </div>
        </div>

        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSwitchToRegister={switchToRegister}
        />

        <RegisterModal
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
          onSwitchToLogin={switchToLogin}
        />
      </>
    )
  }

  return <>{children}</>
}