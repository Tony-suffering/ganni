import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera,
  Calendar,
  TrendingUp,
  Heart,
  MapPin,
  Clock,
  Grid3X3,
  List,
  BarChart3,
  Sparkles,
  User,
  Award,
  Trophy,
  BookmarkedIcon,
  FolderOpen,
  Settings,
  Music
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Post } from '../types';
import { UserPostService } from '../services/userPostService';
import { UserStatsDisplay } from '../components/dashboard/UserStatsDisplay';
import { PostGallery } from '../components/dashboard/PostGallery';
import { PersonalCuratorDisplay } from '../components/curator/PersonalCuratorDisplay';
import { GamificationTab } from '../components/dashboard/GamificationTab';
import { CollectionTab } from '../components/dashboard/CollectionTab';
import { ProfileEditTab } from '../components/dashboard/ProfileEditTab';
import { SpotifyIntegration } from '../components/dashboard/SpotifyIntegration';
import { SpotifyMoodSync } from '../components/dashboard/SpotifyMoodSync';

export const PersonalDashboard: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'gallery' | 'stats' | 'gamification' | 'suggestions' | 'collection' | 'profile' | 'spotify'>('gallery');
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');

  useEffect(() => {
    if (user) {
      loadUserPosts();
    }
  }, [user]);

  const loadUserPosts = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('📊 Loading user posts for dashboard...');
      const userPostService = new UserPostService();
      const userPosts = await userPostService.getUserPosts(user.id);
      
      setPosts(userPosts);
      console.log(`✅ Loaded ${userPosts.length} posts`);
    } catch (err: any) {
      console.error('❌ Failed to load user posts:', err);
      setError(err.message || '投稿の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            ログインが必要です
          </h2>
          <p className="text-gray-600">
            エクスペリエンス画面を利用するにはログインしてください
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader user={user} isLoading={true} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-lg text-gray-600">あなたのエクスペリエンスを分析中...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader user={user} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={loadUserPosts}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                再試行
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <DashboardHeader user={user} postsCount={posts.length} />

      {/* メインコンテンツ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* タブナビゲーション */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-2 md:space-x-8 px-2 md:px-6 overflow-x-auto">
              <TabButton
                icon={Grid3X3}
                label="投稿ギャラリー"
                mobileLabel="ギャラリー"
                count={posts.length}
                isActive={activeTab === 'gallery'}
                onClick={() => setActiveTab('gallery')}
              />
              <TabButton
                icon={BarChart3}
                label="統計情報"
                mobileLabel="統計"
                isActive={activeTab === 'stats'}
                onClick={() => setActiveTab('stats')}
              />
              <TabButton
                icon={Trophy}
                label="ゲーミフィケーション"
                mobileLabel="ゲーム"
                count={undefined}
                isActive={activeTab === 'gamification'}
                onClick={() => setActiveTab('gamification')}
              />
              <TabButton
                icon={Sparkles}
                label="AI提案"
                mobileLabel="AI"
                isActive={activeTab === 'suggestions'}
                onClick={() => setActiveTab('suggestions')}
              />
              <TabButton
                icon={FolderOpen}
                label="コレクション"
                mobileLabel="コレクション"
                isActive={activeTab === 'collection'}
                onClick={() => setActiveTab('collection')}
              />
              <TabButton
                icon={Settings}
                label="プロフィール設定"
                mobileLabel="設定"
                isActive={activeTab === 'profile'}
                onClick={() => setActiveTab('profile')}
              />
              <TabButton
                icon={Music}
                label="Spotify"
                isActive={activeTab === 'spotify'}
                onClick={() => setActiveTab('spotify')}
              />
            </nav>
          </div>

          {/* タブコンテンツ */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'gallery' && (
                <motion.div
                  key="gallery"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 hidden md:block">
                      あなたの投稿ギャラリー
                    </h3>
                    <h3 className="text-base font-semibold text-gray-900 md:hidden flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
                      </svg>
                      ギャラリー
                    </h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-colors ${
                          viewMode === 'grid'
                            ? 'bg-gray-100 text-gray-700'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        <Grid3X3 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setViewMode('timeline')}
                        className={`p-2 rounded-lg transition-colors ${
                          viewMode === 'timeline'
                            ? 'bg-gray-100 text-gray-700'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        <List className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <PostGallery posts={posts} viewMode={viewMode} />
                </motion.div>
              )}

              {activeTab === 'stats' && (
                <motion.div
                  key="stats"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <UserStatsDisplay posts={posts} user={user} />
                </motion.div>
              )}

              {activeTab === 'gamification' && (
                <motion.div
                  key="gamification"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <GamificationTab userId={user.id} />
                </motion.div>
              )}

              {activeTab === 'suggestions' && (
                <motion.div
                  key="suggestions"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <PersonalCuratorDisplay 
                    postId={posts[0]?.id || 'dashboard'}
                    userId={user.id}
                    userPosts={posts}
                    userLocation={undefined}
                  />
                </motion.div>
              )}

              {activeTab === 'collection' && (
                <motion.div
                  key="collection"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <CollectionTab userId={user.id} />
                </motion.div>
              )}

              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <ProfileEditTab userId={user.id} user={user} />
                </motion.div>
              )}

              {activeTab === 'spotify' && (
                <motion.div
                  key="spotify"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <SpotifyIntegration />
                  {posts.length > 0 ? (
                    <SpotifyMoodSync posts={posts} />
                  ) : (
                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-700">
                        音楽推薦を表示するには、まず写真を投稿してください。
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

// ダッシュボードヘッダーコンポーネント
interface DashboardHeaderProps {
  user: any;
  postsCount?: number;
  isLoading?: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  user, 
  postsCount = 0, 
  isLoading = false 
}) => {
  const getUserDisplayName = () => {
    return user?.user_metadata?.name || user?.email?.split('@')[0] || 'ユーザー';
  };

  const getActivityPeriod = () => {
    // 実際の実装では最初の投稿日から計算
    const months = Math.max(1, Math.floor(postsCount / 10));
    return `${months}ヶ月`;
  };

  const getUserLevel = () => {
    if (postsCount >= 100) return 'エキスパート写真家';
    if (postsCount >= 50) return '上級写真愛好家';
    if (postsCount >= 20) return '写真愛好家';
    if (postsCount >= 5) return 'アマチュア写真家';
    return '写真初心者';
  };

  return (
    <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              {user?.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="プロフィール"
                  className="w-14 h-14 rounded-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                ✨ {getUserDisplayName()}のエクスペリエンス
              </h1>
              {!isLoading && (
                <div className="flex items-center space-x-6 mt-2 text-gray-200">
                  <div className="flex items-center space-x-2">
                    <Camera className="w-4 h-4" />
                    <span className="hidden md:inline">総投稿数: {postsCount}</span>
                    <span className="md:hidden">{postsCount}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span className="hidden md:inline">活動期間: {getActivityPeriod()}</span>
                    <span className="md:hidden">{getActivityPeriod()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Award className="w-4 h-4" />
                    <span className="hidden md:inline">レベル: {getUserLevel()}</span>
                    <span className="md:hidden text-xs">{getUserLevel().split('写真')[1] || getUserLevel()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="hidden md:block">
            <div className="text-right">
              <p className="text-sm text-gray-200">最終更新</p>
              <p className="text-lg font-semibold">
                {new Date().toLocaleDateString('ja-JP')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// タブボタンコンポーネント
interface TabButtonProps {
  icon: React.ElementType;
  label: string;
  mobileLabel?: string;
  count?: number;
  isActive: boolean;
  onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ 
  icon: Icon, 
  label, 
  mobileLabel,
  count, 
  isActive, 
  onClick 
}) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-1 md:space-x-2 py-4 px-2 md:px-0 border-b-2 transition-colors ${
      isActive
        ? 'border-gray-800 text-gray-800'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`}
  >
    <Icon className="w-4 h-4 md:w-5 md:h-5" />
    <span className="font-medium text-xs md:text-sm">
      <span className="hidden md:inline">{label}</span>
      <span className="md:hidden">{mobileLabel || label}</span>
    </span>
    {count !== undefined && (
      <span className={`px-1 md:px-2 py-1 text-xs rounded-full ${
        isActive 
          ? 'bg-gray-100 text-gray-800' 
          : 'bg-gray-100 text-gray-600'
      }`}>
        {count}
      </span>
    )}
  </button>
);