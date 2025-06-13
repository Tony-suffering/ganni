import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Settings, LogOut, ChevronDown } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { user, signOut } = useAuth()
  
  const isDemo = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://demo.supabase.co';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    setIsOpen(false)
  }

  const getDisplayName = () => {
    if (isDemo) return 'デモユーザー'
    return user?.user_metadata?.name || user?.email?.split('@')[0] || 'ユーザー'
  }

  const getAvatarUrl = () => {
    if (isDemo) return 'https://ui-avatars.com/api/?name=Demo&background=ff6b35&color=fff'
    return user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(getDisplayName())}&background=0072f5&color=fff`
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-neutral-100 transition-colors"
      >
        <img
          src={getAvatarUrl()}
          alt={getDisplayName()}
          className="w-8 h-8 rounded-full object-cover border border-neutral-200"
        />
        <span className="text-sm font-medium text-neutral-700 hidden sm:inline">
          {getDisplayName()}
        </span>
        <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-neutral-200 py-2 z-50"
          >
            <div className="px-4 py-3 border-b border-neutral-100">
              <p className="text-sm font-medium text-neutral-900">{getDisplayName()}</p>
              <p className="text-xs text-neutral-500">{isDemo ? 'demo@example.com' : user?.email}</p>
            </div>

            <div className="py-1">
              <button
                className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <User className="w-4 h-4" />
                <span>プロフィール</span>
              </button>

              <button
                className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="w-4 h-4" />
                <span>設定</span>
              </button>

              <hr className="my-1 border-neutral-100" />

              {!isDemo && (
                <button
                  className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4" />
                  <span>ログアウト</span>
                </button>
              )}
              
              {isDemo && (
                <div className="px-4 py-2 text-xs text-orange-600 bg-orange-50">
                  デモモードで動作中
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}