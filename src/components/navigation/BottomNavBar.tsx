import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserMenu } from '../auth/UserMenu';
import { NotificationBell } from './NotificationBell';
import { PersonalJourneyCTA } from '../cta/PersonalJourneyCTA';
import { LoginModal } from '../auth/LoginModal';
import { RegisterModal } from '../auth/RegisterModal';

interface BottomNavBarProps {
  onNewPostClick: () => void;
  onLoginClick: () => void;
  onToggleFilter?: () => void;
  onPostClick?: (postId: string) => void;
  hasActiveFilters?: boolean;
  // App.tsxから渡されるゲーミフィケーション状態
  userPoints?: any;
  levelInfo?: any;
  previousPoints?: number;
}

const BottomNavBar = ({ 
  onNewPostClick, 
  onLoginClick, 
  onToggleFilter, 
  onPostClick, 
  hasActiveFilters = false,
  userPoints: propUserPoints,
  levelInfo: propLevelInfo,
  previousPoints: propPreviousPoints
}: BottomNavBarProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  
  // App.tsxから渡されたpropsを使用（重複したhook呼び出しを削除）
  const userPoints = propUserPoints;
  const levelInfo = propLevelInfo;
  const previousPoints = propPreviousPoints;
  

  const iconStyle = "w-7 h-7 transition-transform duration-200 ease-in-out group-hover:scale-110";
  const activeIconStyle = "text-blue-500 dark:text-blue-400";
  const inactiveIconStyle = "text-gray-600 dark:text-gray-400";

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🏠 Home button clicked - navigating to home');
    
    // ページリロードではなく、正常なナビゲーションを使用
    if (location.pathname !== '/') {
      navigate('/');
    } else {
      // 既にホームページにいる場合は、ページトップにスクロール
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNewPostClick = () => {
    if (user) {
      onNewPostClick();
    } else {
      onLoginClick();
    }
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="grid h-full max-w-lg grid-cols-5 mx-auto font-medium">
        {/* Home */}
        <button 
          type="button" 
          onClick={handleHomeClick}
          className="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-700 group touch-manipulation active:bg-gray-100" 
          style={{ minWidth: '60px', minHeight: '60px' }}
        >
          <svg className={`${iconStyle} ${location.pathname === '/' ? activeIconStyle : inactiveIconStyle}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
              <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z"/>
          </svg>
          <span className="sr-only">Home</span>
        </button>
        {/* Enhanced Dashboard CTA / Experience Button */}
        {user ? (
          <div className="inline-flex flex-col items-center justify-center px-1">
            <PersonalJourneyCTA 
              variant="mobile" 
              userPoints={userPoints}
              levelInfo={levelInfo}
              previousPoints={previousPoints}
            />
          </div>
        ) : (
          <button 
            onClick={() => setShowRegisterModal(true)} 
            type="button" 
            className="inline-flex flex-col items-center justify-center px-1 hover:bg-gray-50 dark:hover:bg-gray-700 group"
          >
            <PersonalJourneyCTA 
              variant="mobile" 
              userPoints={userPoints}
              levelInfo={levelInfo}
              previousPoints={previousPoints}
            />
          </button>
        )}
        {/* New Post */}
        <button onClick={handleNewPostClick} type="button" className="inline-flex flex-col items-center justify-center px-2 hover:bg-gray-50 dark:hover:bg-gray-700 group">
          <svg className={`${iconStyle} ${inactiveIconStyle}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 1v16M1 9h16"/>
          </svg>
          <span className="sr-only">New post</span>
        </button>
        
        {/* Notifications (only for logged-in users) */}
        {user ? (
          <div 
            className="inline-flex flex-col items-center justify-center px-1 hover:bg-gray-50 dark:hover:bg-gray-700 group touch-manipulation relative" 
            style={{ minWidth: '60px', minHeight: '60px', zIndex: 20 }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <NotificationBell onPostClick={onPostClick} />
          </div>
        ) : (
          <div className="inline-flex flex-col items-center justify-center px-3"></div>
        )}
        {/* Profile / Login */}
        <div className="inline-flex flex-col items-center justify-center px-2 group">
            {user ? (
                <UserMenu direction="up" />
            ) : (
              <button onClick={onLoginClick} type="button" className="inline-flex flex-col items-center justify-center h-full">
                <svg className={`${iconStyle} ${inactiveIconStyle}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </button>
            )}
        </div>
      </div>
      
      {/* Auth Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToRegister={() => {
          setShowLoginModal(false);
          setShowRegisterModal(true);
        }}
      />

      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSwitchToLogin={() => {
          setShowRegisterModal(false);
          setShowLoginModal(true);
        }}
      />
    </div>
  );
};

export default BottomNavBar; 