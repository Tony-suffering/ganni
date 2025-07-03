import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Camera,
  Heart,
  TrendingUp,
  Calendar,
  Tag as TagIcon,
  Award
} from 'lucide-react';
import { Post } from '../../types';
import { UserPostService } from '../../services/userPostService';
import { GrowthTracker } from './GrowthTracker';
import { PersonalityAnalysis } from './PersonalityAnalysis';

interface UserStatsDisplayProps {
  posts: Post[];
  user: any;
}

export const UserStatsDisplay: React.FC<UserStatsDisplayProps> = ({ posts, user }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userPostService = new UserPostService();

  useEffect(() => {
    analyzeUserData();
  }, [posts]);

  const analyzeUserData = async () => {
    if (!user?.id) {
      setError('ユーザー情報が取得できませんでした');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // 基本統計を取得
      const userStats = await userPostService.getUserStats(user.id);
      setStats(userStats);
      console.log('✅ User stats loaded:', userStats);

    } catch (error) {
      console.error('❌ Failed to analyze user data:', error);
      setError('統計データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        {/* パーソナリティ分析スケルトン */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
        
        {/* 統計カードスケルトン */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="animate-pulse">
                <div className="h-12 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">⚠️ エラー</div>
          <div className="text-gray-600">{error}</div>
          <button 
            onClick={analyzeUserData}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  const getActivityLevel = (postCount: number): { level: string; color: string; description: string } => {
    if (postCount >= 50) return { level: 'エキスパート', color: 'text-gray-600', description: '非常に活発' };
    if (postCount >= 20) return { level: 'アクティブ', color: 'text-blue-600', description: '活発' };
    if (postCount >= 10) return { level: 'レギュラー', color: 'text-green-600', description: '定期的' };
    if (postCount >= 5) return { level: 'ビギナー', color: 'text-yellow-600', description: '初心者' };
    return { level: 'スターター', color: 'text-gray-600', description: '始めたばかり' };
  };

  const activityInfo = getActivityLevel(posts.length);

  return (
    <div className="space-y-6">
      {/* パーソナリティ分析 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <PersonalityAnalysis posts={posts} user={user} />
      </motion.div>

      {/* メイン統計ダッシュボード */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border border-gray-200 rounded-xl p-6"
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-6 hidden md:block">📊 あなたの活動サマリー</h3>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 md:hidden flex items-center">
          <svg className="w-5 h-5 mr-2 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
          </svg>
          活動サマリー
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左側: 基本統計 */}
          <div className="space-y-6">
            {/* 活動レベル */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`inline-flex items-center px-3 py-1 rounded-full bg-white shadow-sm ${activityInfo.color}`}>
                  <Award className="w-4 h-4 mr-2" />
                  <span className="font-semibold text-sm">{activityInfo.level}</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{posts.length}</div>
                  <div className="text-xs text-gray-500 hidden md:block">総投稿</div>
                  <svg className="w-4 h-4 text-gray-500 md:hidden" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>
              <div className="text-sm text-gray-600">{activityInfo.description}な投稿者です</div>
            </div>

            {/* キー統計 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-pink-50 rounded-lg p-4 text-center">
                <Heart className="w-6 h-6 text-pink-500 mx-auto mb-2" />
                <div className="text-xl font-bold text-gray-900">{stats?.totalLikes || 0}</div>
                <div className="text-xs text-gray-600 hidden md:block">総いいね数</div>
                <svg className="w-3 h-3 text-gray-500 md:hidden mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
                </svg>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <div className="text-xl font-bold text-gray-900">{stats?.averageLikes || 0}</div>
                <div className="text-xs text-gray-600 hidden md:block">平均いいね</div>
                <svg className="w-3 h-3 text-gray-500 md:hidden mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                </svg>
              </div>
            </div>

            {/* 投稿頻度 */}
            {stats?.postingFrequency && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-700 mb-3 hidden md:block">📅 投稿ペース</div>
                <div className="text-sm font-medium text-gray-700 mb-3 md:hidden flex items-center justify-center">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-600">{stats.postingFrequency.weekly}</div>
                    <div className="text-xs text-gray-500 hidden md:block">週間</div>
                    <div className="text-xs text-gray-500 md:hidden">週</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-600">{stats.postingFrequency.monthly}</div>
                    <div className="text-xs text-gray-500 hidden md:block">月間</div>
                    <div className="text-xs text-gray-500 md:hidden">月</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-600">
                      {stats?.firstPostDate ? 
                        Math.ceil((new Date().getTime() - new Date(stats.firstPostDate).getTime()) / (1000 * 60 * 60 * 24)) : 0}
                    </div>
                    <div className="text-xs text-gray-500 hidden md:block">継続日数</div>
                    <div className="text-xs text-gray-500 md:hidden">日</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 右側: よく使うタグ & 簡易チャート */}
          <div className="space-y-6">
            {/* よく使うタグ */}
            {stats?.mostUsedTags && stats.mostUsedTags.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <TagIcon className="w-4 h-4 mr-2 text-green-500" />
                  よく使うタグ
                </div>
                <div className="flex flex-wrap gap-2">
                  {stats.mostUsedTags.slice(0, 6).map((tag: string, index: number) => (
                    <span
                      key={tag}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        index === 0 ? 'bg-green-100 text-green-700' :
                        index === 1 ? 'bg-blue-100 text-blue-700' :
                        index === 2 ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700'
                      }`}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 簡易パフォーマンス */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-700 mb-3 hidden md:block">🎯 パフォーマンス</div>
              <div className="text-sm font-medium text-gray-700 mb-3 md:hidden flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">最高いいね数</span>
                  <span className="font-semibold text-yellow-700">
                    {posts.length > 0 ? Math.max(...posts.map(p => p.likeCount)) : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">いいね獲得率</span>
                  <span className="font-semibold text-yellow-700">
                    {posts.length > 0 ? Math.round((posts.filter(p => p.likeCount > 0).length / posts.length) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 成長トラッカー（簡潔版） */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <GrowthTracker posts={posts} user={user} />
      </motion.div>
    </div>
  );
};

// 統計カードコンポーネント
interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: number;
  suffix: string;
  color: string;
  delay: number;
  trend?: string | null;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, title, value, suffix, color, delay, trend }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105"
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-lg ${color} shadow-md`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {trend && (
        <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
          {trend}
        </div>
      )}
    </div>
    <div>
      <div className="text-2xl font-bold text-gray-900 mb-1">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.2 }}
        >
          {value.toLocaleString()}
        </motion.span>
        <span className="text-sm font-normal text-gray-500 ml-1">{suffix}</span>
      </div>
      <div className="text-sm text-gray-600">{title}</div>
    </div>
  </motion.div>
);

