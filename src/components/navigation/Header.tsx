import React, { useState } from 'react';
import { Search, Filter, BarChart3, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
// import { AIStatusIndicator } from './AIStatusIndicator';
import { UserMenu } from '../auth/UserMenu';
import { LoginModal } from '../auth/LoginModal';
import { RegisterModal } from '../auth/RegisterModal';
import { NotificationBell } from './NotificationBell';
import { HighlightSection } from '../layout/HighlightSection';
import { PersonalJourneyCTA } from '../cta/PersonalJourneyCTA';
import { useAuth } from '../../contexts/AuthContext';
import { useGamification } from '../../hooks/useGamification';
import { Link, useLocation } from 'react-router-dom';

interface HeaderProps {
  onNewPost: () => void;
  onToggleFilter?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onLoginClick: () => void;
  onPostClick?: (postId: string) => void;
  hasActiveFilters?: boolean;
  allPosts?: any[];
  onHighlightPostClick?: (post: any) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNewPost,
  onToggleFilter,
  searchQuery = '',
  onSearchChange = () => {},
  onLoginClick,
  onPostClick,
  hasActiveFilters = false,
  allPosts = [],
  onHighlightPostClick,
}) => {
  const { user, loading } = useAuth();
  const { photoStats } = useGamification();
  const location = useLocation();
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

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    console.log('Logo clicked, reloading page and navigating to home');
    window.location.href = '/';
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
        className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          {/* --- Unified Header for All Devices --- */}
          <div className="flex items-center justify-between h-16">
            
            {/* Left Side: Logo, Title and AI Pickup */}
            <div className="flex items-center space-x-4">
              <Link to="/" onClick={handleLogoClick} className="flex items-center space-x-4 group focus:outline-none touch-manipulation hover:bg-gray-50 rounded-xl p-3 -m-3 transition-all duration-300" style={{ minHeight: '44px' }}>
                <div className="relative">
                  <iframe
                    src="https://www.canva.com/design/DAGswnM4-Hs/Egh-nXxCRO4ZOXF3oOGdQA/watch?embed&autoplay=true&loop=true&mute=true"
                    width="40"
                    height="40"
                    className="w-10 h-10 transition-all duration-300 shadow-sm group-hover:shadow-lg transform group-hover:scale-110 rounded-lg overflow-hidden"
                    style={{ border: 'none', background: 'transparent' }}
                    title="AI日記ロゴ"
                    allow="autoplay; fullscreen"
                    allowFullScreen
                  />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl sm:text-2xl font-bold italic text-gray-900 group-hover:text-black transition-colors duration-300 tracking-tight transform group-hover:scale-105">
                    AI日記
                  </h1>
                  <p className="text-xs text-gray-500 -mt-1 font-medium tracking-wide">あなたの感想・体験にコメントします</p>
                </div>
              </Link>
              
              {/* Compact AI Highlight Section - Right of Title */}
              {!hasActiveFilters && allPosts.length > 0 && (
                <div className="flex items-center gap-3">
                  <HighlightSection
                    allPosts={allPosts}
                    onPostClick={onHighlightPostClick || (() => {})}
                    compact={true}
                  />
                  {/* 写真スコア表示をAI厳選の右に追加 */}
                  {photoStats && photoStats.totalPhotoScores > 0 && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span>📸</span>
                      <span>平均{photoStats.averagePhotoScore}点</span>
                      <span className="text-gray-400">|</span>
                      <span>最高{photoStats.highestPhotoScore}点</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* --- Right Side: Actions --- */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Search Bar - Desktop */}
              <div className="relative hidden md:block group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
                <input
                  type="text"
                  placeholder="検索..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-9 pr-4 py-2.5 w-32 lg:w-48 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 focus:bg-white hover:bg-white transition-all duration-200 placeholder-gray-400 text-sm"
                />
              </div>

              {/* Search Bar - Mobile */}
              <div className="relative block md:hidden group">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
                <input
                  type="text"
                  placeholder="検索"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-8 pr-3 py-2 w-24 sm:w-28 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 focus:bg-white hover:bg-white transition-all duration-200 placeholder-gray-400 text-sm"
                />
              </div>
              
              {/* Enhanced Dashboard CTA / Experience Button - スマホでは非表示 */}
              {(user || isDemo) && !loading ? (
                <div className="hidden md:block">
                  <PersonalJourneyCTA variant="header" />
                </div>
              ) : (
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="relative group hidden md:block"
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="relative overflow-hidden"
                  >
                    {/* 白い背景 */}
                    <div className="absolute inset-0 bg-white rounded-lg border border-gray-300 group-hover:border-gray-400 transition-all shadow-sm" />
                    
                    {/* 光るエフェクト */}
                    <motion.div
                      animate={{
                        x: [-100, 200],
                        opacity: [0, 0.3, 0]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatDelay: 4
                      }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
                    />

                    <div className="relative flex items-center space-x-2 px-4 py-2.5 text-black">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                      >
                        <img src="/analysis.png" alt="分析" className="w-6 h-6" />
                      </motion.div>
                      
                      <span className="font-medium text-sm whitespace-nowrap hidden sm:inline">
                        分析
                      </span>
                      
                      <ArrowRight className="w-4 h-4 text-black" />
                    </div>
                  </motion.div>
                </button>
              )}
              
              {/* New Post Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNewPost}
                className="hidden md:flex items-center justify-center px-4 py-2.5 bg-white border border-gray-300 text-black rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 text-sm font-semibold shadow-sm"
              >
                <img src="/tokou.svg" alt="投稿" className="w-5 h-5 mr-1.5" />
                投稿
              </motion.button>
              
              {/* Notification Bell (only for Desktop) */}
              {(user || isDemo) && !loading && (
                <div className="hidden md:block">
                  <NotificationBell onPostClick={onPostClick} />
                </div>
              )}

              {/* Auth Buttons / User Menu */}
              <div className="hidden md:block">
                {loading ? (
                  <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
                ) : user || isDemo ? (
                  <UserMenu />
                ) : (
                  <button
                    onClick={onLoginClick}
                    className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 border border-gray-200 hover:border-gray-300"
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