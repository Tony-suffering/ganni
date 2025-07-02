import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, LogOut, ChevronDown, Sparkles, Trophy } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

// Supabaseのuser.user_metadataの型を定義しておくと、コードが安全で分かりやすくなります
interface CustomUserMetadata {
  name?: string;
  avatar_url?: string;
}

export function UserMenu({ direction = 'down' }: { direction?: 'up' | 'down' }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();

  // Viteの環境変数をチェックして、デモモードかどうかを判定します
  const isDemo = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://demo.supabase.co';

  // メニューの外側をクリックしたときにメニューを閉じるエフェクト
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ログアウト処理
  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false); // メニューを閉じる
  };

  // 型安全にユーザーメタデータを取得
  const userMetadata = user?.user_metadata as CustomUserMetadata | undefined;

  // 表示名を取得する関数
  const getDisplayName = (): string => {
    if (isDemo) return 'デモユーザー';
    return userMetadata?.name || user?.email?.split('@')[0] || 'ユーザー';
  };

  // アバター画像のURLを取得する関数
  const getAvatarUrl = (): string => {
    if (isDemo) return 'https://ui-avatars.com/api/?name=Demo&background=ff6b35&color=fff';
    const displayName = getDisplayName();
    // ui-avatars.comは日本語も扱えるようにエンコードします
    return userMetadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0072f5&color=fff`;
  };

  // ログインしていない場合（かつデモモードでない場合）は何も表示しない
  if (!user && !isDemo) {
    return null;
  }

  const menuPositionClass = direction === 'up'
    ? "absolute right-0 bottom-full mb-2 w-56 bg-white rounded-xl shadow-lg border border-neutral-200/70 py-1 z-50"
    : "absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-neutral-200/70 py-1 z-50";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2.5 rounded-lg hover:bg-gray-100 transition-all duration-200 border border-gray-200 hover:border-gray-300"
      >
        <img
          src={getAvatarUrl()}
          alt={getDisplayName()}
          className="w-8 h-8 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600 shadow-sm"
        />
        <span className="text-sm font-semibold text-gray-700 hidden sm:inline">
          {getDisplayName()}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: direction === 'up' ? 10 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: direction === 'up' ? 10 : -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={menuPositionClass}
          >
            <div className="px-3 py-2 border-b border-neutral-100">
              <p className="text-sm font-semibold text-neutral-900 truncate">{getDisplayName()}</p>
              <p className="text-xs text-neutral-500 truncate">{isDemo ? 'demo@example.com' : user?.email}</p>
            </div>
            
            <div className="py-1">
              <Link
                to="/dashboard"
                className="flex items-center space-x-3 w-full px-3 py-2 text-sm text-neutral-700 hover:bg-blue-50 transition-colors group"
                onClick={() => setIsOpen(false)}
              >
                <Trophy className="w-4 h-4 text-blue-600 group-hover:text-blue-700" />
                <span>エクスペリエンス</span>
              </Link>
              
              
              
              <Link
                to="/settings"
                className="flex items-center space-x-3 w-full px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="w-4 h-4 text-neutral-500" />
                <span>設定</span>
              </Link>
            </div>

            <hr className="border-neutral-100" />

            {!isDemo ? (
              <div className="py-1">
                <button
                  className="flex items-center space-x-3 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4" />
                  <span>ログアウト</span>
                </button>
              </div>
            ) : (
              <div className="px-3 py-2 text-xs text-orange-600 bg-orange-50">
                デモモードではログアウトできません
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
