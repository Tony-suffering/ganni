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
                <div className="p-2 bg-primary-500 rounded-xl group-hover:bg-primary-600 transition-colors">
                  <Plane className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-display font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
                    AIツッコミ芸人
                  </h1>
                  <p className="text-xs text-neutral-500 -mt-1">笑わしたる！</p>
                </div>
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row items-center w-full sm:w-auto space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="写真を検索..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full sm:w-64 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <button
                onClick={onToggleFilter}
                className="p-2 text-neutral-600 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-all duration-200 w-full sm:w-auto"
              >
                <Filter className="w-5 h-5" />
              </button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNewPost}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                <span className="font-medium">投稿</span>
              </motion.button>

              {/* Auth Section */}
              {loading ? (
                <div className="w-8 h-8 bg-neutral-200 rounded-full animate-pulse" />
              ) : user || isDemo ? (
                <UserMenu />
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="flex items-center justify-center space-x-2 px-3 py-2 text-neutral-600 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-all duration-200 w-full sm:w-auto"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="font-medium hidden sm:inline">ログイン</span>
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