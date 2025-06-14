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

  // 認証状態に関係なくコンテンツを表示
  return (
    <>
      {children}
      {!user && (
        <>
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
      )}
    </>
  )
}