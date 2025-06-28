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

  const userPostService = new UserPostService();

  useEffect(() => {
    analyzeUserData();
  }, [posts]);

  const analyzeUserData = async () => {
    setLoading(true);
    
    try {
      // 基本統計を取得
      const userStats = await userPostService.getUserStats(user.id);
      setStats(userStats);

    } catch (error) {
      console.error('Failed to analyze user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600">統計データを分析中...</span>
        </div>
      </div>
    );
  }

  const getActivityLevel = (postCount: number): { level: string; color: string; description: string } => {
    if (postCount >= 50) return { level: 'エキスパート', color: 'text-purple-600', description: '非常に活発' };
    if (postCount >= 20) return { level: 'アクティブ', color: 'text-blue-600', description: '活発' };
    if (postCount >= 10) return { level: 'レギュラー', color: 'text-green-600', description: '定期的' };
    if (postCount >= 5) return { level: 'ビギナー', color: 'text-yellow-600', description: '初心者' };
    return { level: 'スターター', color: 'text-gray-600', description: '始めたばかり' };
  };

  const activityInfo = getActivityLevel(posts.length);

  return (
    <div className="space-y-8">
      {/* パーソナリティ分析（メイン） */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <PersonalityAnalysis posts={posts} user={user} />
      </motion.div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-6">活動統計</h3>
        
        {/* 基本統計カード */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Camera}
            title="総投稿数"
            value={stats?.totalPosts || 0}
            suffix="枚"
            color="bg-blue-500"
            delay={0}
          />
          <StatCard
            icon={Heart}
            title="総いいね数"
            value={stats?.totalLikes || 0}
            suffix="回"
            color="bg-pink-500"
            delay={0.1}
          />
          <StatCard
            icon={TrendingUp}
            title="平均いいね数"
            value={stats?.averageLikes || 0}
            suffix="回"
            color="bg-green-500"
            delay={0.2}
          />
          <StatCard
            icon={Calendar}
            title="活動期間"
            value={stats?.firstPostDate ? 
              Math.ceil((new Date().getTime() - new Date(stats.firstPostDate).getTime()) / (1000 * 60 * 60 * 24)) : 0}
            suffix="日"
            color="bg-purple-500"
            delay={0.3}
          />
        </div>

        {/* 活動レベル */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">あなたの活動レベル</h4>
              <div className="flex items-center space-x-3">
                <div className={`inline-flex items-center px-4 py-2 rounded-full bg-white shadow-sm ${activityInfo.color}`}>
                  <Award className="w-5 h-5 mr-2" />
                  <span className="font-semibold">{activityInfo.level}</span>
                </div>
                <span className="text-gray-600">{activityInfo.description}な投稿者です</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{posts.length}</div>
              <div className="text-sm text-gray-500">総投稿数</div>
            </div>
          </div>
        </motion.div>



        {/* よく使うタグ */}
        {stats?.mostUsedTags && stats.mostUsedTags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white border border-gray-200 rounded-xl p-6 mb-8"
          >
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TagIcon className="w-5 h-5 mr-2 text-green-500" />
              よく使うタグ
            </h4>
            <div className="flex flex-wrap gap-2">
              {stats.mostUsedTags.map((tag: string, index: number) => (
                <span
                  key={tag}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
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
          </motion.div>
        )}

        {/* 成長トラッカー */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-8"
        >
          <GrowthTracker posts={posts} user={user} />
        </motion.div>
      </div>
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
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, title, value, suffix, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
    <div>
      <div className="text-2xl font-bold text-gray-900 mb-1">
        {value.toLocaleString()}<span className="text-sm font-normal text-gray-500 ml-1">{suffix}</span>
      </div>
      <div className="text-sm text-gray-600">{title}</div>
    </div>
  </motion.div>
);

