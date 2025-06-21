import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserMenu } from './auth/UserMenu';

interface BottomNavBarProps {
  onNewPostClick: () => void;
  onLoginClick: () => void;
  onToggleFilter: () => void;
}

const BottomNavBar = ({ onNewPostClick, onLoginClick, onToggleFilter }: BottomNavBarProps) => {
  const { user } = useAuth();
  const location = useLocation();

  const iconStyle = "w-7 h-7 transition-transform duration-200 ease-in-out group-hover:scale-110";
  const activeIconStyle = "text-blue-500 dark:text-blue-400";
  const inactiveIconStyle = "text-gray-600 dark:text-gray-400";

  const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // If not on home, the Link component will handle navigation automatically.
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
      <div className="grid h-full max-w-lg grid-cols-4 mx-auto font-medium">
        {/* Home */}
        <Link to="/" onClick={handleHomeClick} className="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-700 group">
          <svg className={`${iconStyle} ${location.pathname === '/' ? activeIconStyle : inactiveIconStyle}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
              <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z"/>
          </svg>
          <span className="sr-only">Home</span>
        </Link>
        {/* Search */}
        <button onClick={onToggleFilter} type="button" className="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-700 group">
          <svg className={`${iconStyle} ${inactiveIconStyle}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
          </svg>
          <span className="sr-only">Search</span>
        </button>
        {/* New Post */}
        <button onClick={handleNewPostClick} type="button" className="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-700 group">
          <svg className={`${iconStyle} ${inactiveIconStyle}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 1v16M1 9h16"/>
          </svg>
          <span className="sr-only">New post</span>
        </button>
        {/* Profile / Login */}
        <div className="inline-flex flex-col items-center justify-center px-5 group">
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