import React, { useState } from 'react';
import { Plane, Search, Plus, Filter, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { AIStatusIndicator } from './AIStatusIndicator';
import { UserMenu } from './auth/UserMenu';
import { LoginModal } from './auth/LoginModal';
import { RegisterModal } from './auth/RegisterModal';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

interface HeaderProps {
  onNewPost: () => void;
  onToggleFilter: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNewPost,
  onToggleFilter,
  searchQuery,
  onSearchChange
}) => {
  const { user, loading } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  
  const isDemo = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://demo.supabase.co';

  const handleNewPost = () => {
    if (!user && !isDemo) {
      setShowLoginModal(true);
      return;
    }
    onNewPost();
  };

  const switchToRegister = () => {
    setShowLoginModal(false);
    setShowRegisterModal(true);
  };

  const switchToLogin = () => {
    setShowRegisterModal(false);
    setShowLoginModal(true);
  };

  return (
    <>
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-neutral-200"
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between h-auto sm:h-16 space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <Link to="/" className="flex items-center space-x-3 group focus:outline-none">
                <img src="/iwasaki.png" alt="ロゴ" className="w-10 h-8 object-contain" />
                <div>
                  <h1 className="text-xl font-display font-semibold text-neutral- group-hover:text-primary-600 transition-colors">
                    AIコメンテーター
                  </h1>
                  <p className="text-xs text-neutral-900 -mt-1">あなたの感想・体験にコメントします！</p>
                </div>
              </Link>
            </div>

            {/* --- スマホ用: 横並びボタンバー --- */}
            <div className="w-full flex sm:hidden mt-2 mb-1 gap-2">
              <button
                onClick={onToggleFilter}
                className="flex-1 flex flex-col items-center justify-center py-2 rounded-xl bg-neutral-100 hover:bg-primary-50 text-primary-600 text-xs font-semibold transition-all"
                style={{ minWidth: 0 }}
              >
                <Filter className="w-6 h-6 mb-0.5" />
                フィルター
              </button>
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex-1 flex flex-col items-center justify-center py-2 rounded-xl bg-neutral-100 hover:bg-primary-50 text-primary-600 text-xs font-semibold transition-all"
                style={{ minWidth: 0 }}
              >
                <LogIn className="w-6 h-6 mb-0.5" />
                ログイン
              </button>
              <button
                onClick={handleNewPost}
                className="flex-1 flex flex-col items-center justify-center py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold transition-all"
                style={{ minWidth: 0 }}
              >
                <Plus className="w-6 h-6 mb-0.5" />
                投稿
              </button>
            </div>

            {/* --- PC/タブレット用 --- */}
            <div className="hidden sm:flex flex-row items-center w-auto space-x-3">
              <div className="relative w-48">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="写真を検索..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <button
                onClick={onToggleFilter}
                className="p-2 text-neutral-600 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-all duration-200"
              >
                <Filter className="w-5 h-5" />
              </button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNewPost}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200"
              >
                <Plus className="w-4 h-4" />
                <span className="font-medium">投稿</span>
              </motion.button>
              {loading ? (
                <div className="w-8 h-8 bg-neutral-200 rounded-full animate-pulse" />
              ) : user || isDemo ? (
                <UserMenu />
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="flex items-center justify-center space-x-2 px-3 py-2 text-neutral-600 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-all duration-200"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="font-medium">ログイン</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Auth Modals */}
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
  );
};