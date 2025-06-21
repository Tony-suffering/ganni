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
  onLoginClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNewPost,
  onToggleFilter,
  searchQuery,
  onSearchChange,
  onLoginClick,
}) => {
  const { user, loading } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  
  const isDemo = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://demo.supabase.co';

  const handleNewPost = () => {
    if (!user && !isDemo) {
      onLoginClick();
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
        className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-neutral-200"
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          {/* --- Unified Header for All Devices --- */}
          <div className="flex items-center justify-between h-16">
            
            {/* Left Side: Logo and Title */}
            <div className="flex items-center space-x-3">
              <Link to="/" className="flex items-center space-x-3 group focus:outline-none">
                <img src="/iwasaki.png" alt="ロゴ" className="w-10 h-8 object-contain" />
                <div>
                  <h1 className="text-lg sm:text-xl font-display font-semibold text-neutral-800 group-hover:text-primary-600 transition-colors">
                    AIコメンテーター
                  </h1>
                  <p className="text-xs text-neutral-500 -mt-1 hidden sm:block">あなたの感想・体験にコメントします！</p>
                </div>
              </Link>
            </div>

            {/* --- Right Side: Actions --- */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Search Bar */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="検索..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-9 pr-3 py-2 w-32 lg:w-48 bg-neutral-100 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              
              {/* Filter Button */}
              <button
                onClick={onToggleFilter}
                className="hidden md:flex p-2 text-neutral-600 hover:text-primary-500 hover:bg-primary-50 rounded-full transition-all duration-200"
                aria-label="フィルター"
              >
                <Filter className="w-5 h-5" />
              </button>
              
              {/* New Post Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNewPost}
                className="hidden md:flex items-center justify-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200 text-sm font-semibold"
              >
                投稿
              </motion.button>
              
              {/* Auth Buttons / User Menu */}
              <div className="hidden md:block">
                {loading ? (
                  <div className="w-8 h-8 bg-neutral-200 rounded-full animate-pulse" />
                ) : user || isDemo ? (
                  <UserMenu />
                ) : (
                  <button
                    onClick={onLoginClick}
                    className="px-3 py-2 text-sm font-semibold text-neutral-600 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-all duration-200"
                  >
                    ログイン
                  </button>
                )}
              </div>
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