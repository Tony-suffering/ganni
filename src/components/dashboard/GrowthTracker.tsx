import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Award,
  Calendar,
  Target,
  Star,
  Camera,
  Heart,
  Users,
  BarChart3,
  CheckCircle
} from 'lucide-react';
import { Post } from '../../types';

interface GrowthTrackerProps {
  posts: Post[];
  user: any;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  target?: number;
  color: string;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'post_count' | 'likes' | 'engagement' | 'diversity' | 'consistency';
  value: number;
  icon: React.ElementType;
}

export const GrowthTracker: React.FC<GrowthTrackerProps> = ({ posts, user }) => {
  const calculateGrowthMetrics = () => {
    const totalPosts = posts.length;
    const totalLikes = posts.reduce((sum, post) => sum + (post.likeCount || 0), 0);
    const avgLikes = totalPosts > 0 ? totalLikes / totalPosts : 0;
    
    // 時系列での成長分析
    const sortedPosts = [...posts].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    // 月ごとの投稿数推移
    const monthlyStats: Record<string, { posts: number; likes: number }> = {};
    sortedPosts.forEach(post => {
      const date = new Date(post.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { posts: 0, likes: 0 };
      }
      monthlyStats[monthKey].posts++;
      monthlyStats[monthKey].likes += post.likeCount || 0;
    });

    // 直近3ヶ月の平均と前3ヶ月の平均を比較
    const monthKeys = Object.keys(monthlyStats).sort();
    const recentMonths = monthKeys.slice(-3);
    const previousMonths = monthKeys.slice(-6, -3);
    
    const recentAvgPosts = recentMonths.length > 0 ? 
      recentMonths.reduce((sum, month) => sum + monthlyStats[month].posts, 0) / recentMonths.length : 0;
    const previousAvgPosts = previousMonths.length > 0 ? 
      previousMonths.reduce((sum, month) => sum + monthlyStats[month].posts, 0) / previousMonths.length : 0;
    
    const recentAvgLikes = recentMonths.length > 0 ? 
      recentMonths.reduce((sum, month) => sum + monthlyStats[month].likes, 0) / recentMonths.length : 0;
    const previousAvgLikes = previousMonths.length > 0 ? 
      previousMonths.reduce((sum, month) => sum + monthlyStats[month].likes, 0) / previousMonths.length : 0;

    const postGrowthRate = previousAvgPosts > 0 ? ((recentAvgPosts - previousAvgPosts) / previousAvgPosts) * 100 : 0;
    const likeGrowthRate = previousAvgLikes > 0 ? ((recentAvgLikes - previousAvgLikes) / previousAvgLikes) * 100 : 0;

    return {
      totalPosts,
      totalLikes,
      avgLikes,
      postGrowthRate,
      likeGrowthRate,
      recentAvgPosts,
      recentAvgLikes,
      monthlyStats
    };
  };

  const generateAchievements = (): Achievement[] => {
    const metrics = calculateGrowthMetrics();
    
    return [
      {
        id: 'first_post',
        title: 'はじめの一歩',
        description: '初めての投稿を完了',
        icon: Camera,
        unlocked: metrics.totalPosts >= 1,
        unlockedAt: posts.length > 0 ? posts[0]?.createdAt : undefined,
        color: 'bg-blue-500'
      },
      {
        id: 'posts_10',
        title: '継続の力',
        description: '10件の投稿を達成',
        icon: Target,
        unlocked: metrics.totalPosts >= 10,
        progress: Math.min(metrics.totalPosts, 10),
        target: 10,
        color: 'bg-green-500'
      },
      {
        id: 'posts_50',
        title: '熱心な投稿者',
        description: '50件の投稿を達成',
        icon: Star,
        unlocked: metrics.totalPosts >= 50,
        progress: Math.min(metrics.totalPosts, 50),
        target: 50,
        color: 'bg-purple-500'
      },
      {
        id: 'likes_100',
        title: '人気の写真家',
        description: '累計100いいねを獲得',
        icon: Heart,
        unlocked: metrics.totalLikes >= 100,
        progress: Math.min(metrics.totalLikes, 100),
        target: 100,
        color: 'bg-pink-500'
      },
      {
        id: 'avg_likes_5',
        title: '品質の向上',
        description: '平均5いいね/投稿を達成',
        icon: TrendingUp,
        unlocked: metrics.avgLikes >= 5,
        progress: Math.min(metrics.avgLikes, 5),
        target: 5,
        color: 'bg-orange-500'
      },
      {
        id: 'growth_positive',
        title: '成長の証',
        description: '直近3ヶ月で投稿数が増加',
        icon: BarChart3,
        unlocked: metrics.postGrowthRate > 0,
        color: 'bg-indigo-500'
      }
    ];
  };

  const generateMilestones = (): Milestone[] => {
    const milestones: Milestone[] = [];
    
    // 投稿数のマイルストーン
    const postMilestones = [1, 5, 10, 25, 50, 100];
    postMilestones.forEach(target => {
      const relevantPost = posts
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .find((_, index) => index + 1 === target);
      
      if (relevantPost) {
        milestones.push({
          id: `post_milestone_${target}`,
          title: `投稿数 ${target}件達成`,
          description: `${target}件目の投稿を完了しました`,
          date: relevantPost.createdAt,
          type: 'post_count',
          value: target,
          icon: Camera
        });
      }
    });

    // いいね数のマイルストーン
    let cumulativeLikes = 0;
    const likeMilestones = [10, 50, 100, 250, 500];
    const sortedPosts = [...posts].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    for (const post of sortedPosts) {
      cumulativeLikes += post.likeCount || 0;
      
      for (const target of likeMilestones) {
        if (cumulativeLikes >= target && !milestones.some(m => m.id === `like_milestone_${target}`)) {
          milestones.push({
            id: `like_milestone_${target}`,
            title: `累計いいね ${target}件達成`,
            description: `累計で${target}いいねを獲得しました`,
            date: post.createdAt,
            type: 'likes',
            value: target,
            icon: Heart
          });
        }
      }
    }

    return milestones.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const achievements = generateAchievements();
  const milestones = generateMilestones();
  const metrics = calculateGrowthMetrics();
  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const nextAchievement = achievements.find(a => !a.unlocked);

  const formatGrowthRate = (rate: number) => {
    if (rate > 0) return `+${rate.toFixed(1)}%`;
    if (rate < 0) return `${rate.toFixed(1)}%`;
    return '0%';
  };

  const getGrowthTrend = (rate: number) => {
    if (rate > 10) return { text: '急成長', color: 'text-green-600', icon: '📈' };
    if (rate > 0) return { text: '成長中', color: 'text-blue-600', icon: '📊' };
    if (rate > -10) return { text: '安定', color: 'text-gray-600', icon: '➡️' };
    return { text: '改善の余地', color: 'text-orange-600', icon: '💪' };
  };

  const postTrend = getGrowthTrend(metrics.postGrowthRate);
  const likeTrend = getGrowthTrend(metrics.likeGrowthRate);

  if (posts.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">成長トラッキング</h3>
        <div className="text-center text-gray-500 py-8">
          投稿を開始すると成長を追跡できます
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-6">成長トラッキング</h3>
        
        {/* 成長サマリー */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8"
        >
          <h4 className="text-lg font-semibold text-gray-900 mb-4">あなたの成長サマリー</h4>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">{achievements.filter(a => a.unlocked).length}</div>
              <div className="text-sm text-gray-600">獲得した実績</div>
              <div className="text-xs text-gray-500">/ {achievements.length} 個</div>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold mb-2 ${postTrend.color}`}>
                {formatGrowthRate(metrics.postGrowthRate)}
              </div>
              <div className="text-sm text-gray-600">投稿数の変化</div>
              <div className="text-xs text-gray-500 flex items-center justify-center">
                <span className="mr-1">{postTrend.icon}</span>
                {postTrend.text}
              </div>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold mb-2 ${likeTrend.color}`}>
                {formatGrowthRate(metrics.likeGrowthRate)}
              </div>
              <div className="text-sm text-gray-600">いいね数の変化</div>
              <div className="text-xs text-gray-500 flex items-center justify-center">
                <span className="mr-1">{likeTrend.icon}</span>
                {likeTrend.text}
              </div>
            </div>
          </div>
        </motion.div>

        {/* 次の目標 */}
        {nextAchievement && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border border-gray-200 rounded-xl p-6 mb-8"
          >
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-orange-500" />
              次の目標
            </h4>
            
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-lg ${nextAchievement.color}`}>
                <nextAchievement.icon className="w-6 h-6 text-white" />
              </div>
              
              <div className="flex-1">
                <h5 className="font-semibold text-gray-900">{nextAchievement.title}</h5>
                <p className="text-sm text-gray-600">{nextAchievement.description}</p>
                
                {nextAchievement.progress !== undefined && nextAchievement.target && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                      <span>進捗</span>
                      <span>{nextAchievement.progress} / {nextAchievement.target}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${(nextAchievement.progress / nextAchievement.target) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* 実績一覧 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-gray-200 rounded-xl p-6 mb-8"
        >
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2 text-purple-500" />
            実績バッジ
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  achievement.unlocked
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-gray-50 opacity-60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${achievement.unlocked ? achievement.color : 'bg-gray-400'}`}>
                    <achievement.icon className="w-5 h-5 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h5 className={`font-medium text-sm ${achievement.unlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                      {achievement.title}
                    </h5>
                    <p className={`text-xs ${achievement.unlocked ? 'text-gray-600' : 'text-gray-400'}`}>
                      {achievement.description}
                    </p>
                    
                    {achievement.unlockedAt && (
                      <p className="text-xs text-green-600 mt-1">
                        {new Date(achievement.unlockedAt).toLocaleDateString('ja-JP')} 達成
                      </p>
                    )}
                  </div>
                  
                  {achievement.unlocked && (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  )}
                </div>
                
                {!achievement.unlocked && achievement.progress !== undefined && achievement.target && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div
                        className="bg-gray-400 h-1 rounded-full transition-all duration-1000"
                        style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* マイルストーン */}
        {milestones.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white border border-gray-200 rounded-xl p-6"
          >
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-500" />
              マイルストーン
            </h4>
            
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {milestones.slice(0, 10).map((milestone, index) => (
                <motion.div
                  key={milestone.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <milestone.icon className="w-4 h-4 text-blue-600" />
                  </div>
                  
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 text-sm">{milestone.title}</h5>
                    <p className="text-xs text-gray-600">{milestone.description}</p>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {new Date(milestone.date).toLocaleDateString('ja-JP')}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};