import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserMenu } from './auth/UserMenu';
import { NotificationBell } from './NotificationBell';
import { PersonalJourneyCTA } from './cta/PersonalJourneyCTA';

interface BottomNavBarProps {
  onNewPostClick: () => void;
  onLoginClick: () => void;
  onToggleFilter: () => void;
  onPostClick?: (postId: string) => void;
  hasActiveFilters?: boolean;
}

const BottomNavBar = ({ onNewPostClick, onLoginClick, onToggleFilter, onPostClick, hasActiveFilters = false }: BottomNavBarProps) => {
  const { user } = useAuth();
  const location = useLocation();

  const iconStyle = "w-7 h-7 transition-transform duration-200 ease-in-out group-hover:scale-110";
  const activeIconStyle = "text-blue-500 dark:text-blue-400";
  const inactiveIconStyle = "text-gray-600 dark:text-gray-400";

  const handleHomeClick = () => {
    console.log('🔥 FIXED VERSION: Home button clicked, reloading page and navigating to home');
    // 確実にリロードする
    setTimeout(() => {
      window.location.reload();
    }, 0);
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
          onClick={() => {
            console.log('🚀 DIRECT INLINE: Reloading page now!');
            window.location.reload();
          }}
          className="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-700 group touch-manipulation active:bg-gray-100" 
          style={{ minWidth: '60px', minHeight: '60px' }}
        >
          <svg className={`${iconStyle} ${location.pathname === '/' ? activeIconStyle : inactiveIconStyle}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
              <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z"/>
          </svg>
          <span className="sr-only">Home</span>
        </button>
        {/* Enhanced Dashboard CTA / Filter */}
        {user ? (
          <div className="inline-flex flex-col items-center justify-center px-1">
            <PersonalJourneyCTA variant="mobile" />
          </div>
        ) : (
          <button onClick={onToggleFilter} type="button" className={`inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-700 group relative ${hasActiveFilters ? 'bg-blue-50' : ''}`}>
            <svg className={`${iconStyle} ${hasActiveFilters ? activeIconStyle : inactiveIconStyle}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2 4.5A2.5 2.5 0 014.5 2h11A2.5 2.5 0 0118 4.5v2a2.5 2.5 0 01-.73 1.77L14 11.54V17a1 1 0 01-.6.9l-2 .67A1 1 0 0110 17.67V11.54L6.73 8.27A2.5 2.5 0 016 6.5v-2z"/>
            </svg>
            {hasActiveFilters && (
              <div className="absolute top-2 right-3 w-2 h-2 bg-blue-500 rounded-full"></div>
            )}
            <span className="sr-only">Filter</span>
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
                <span className="text-xs text-gray-600 dark:text-gray-400">Login</span>
              </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default BottomNavBar; 