import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Award,
  Target,
  Star,
  Camera,
  Heart,
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
  progress?: number;
  target?: number;
  color: string;
}

export const GrowthTracker: React.FC<GrowthTrackerProps> = ({ posts, user }) => {
  // 簡潔な実績システム
  const calculateAchievements = (): Achievement[] => {
    const totalPosts = posts.length;
    const totalLikes = posts.reduce((sum, post) => sum + (post.likeCount || 0), 0);
    
    return [
      {
        id: 'first_post',
        title: 'ファーストステップ',
        description: '初めての投稿をしました',
        icon: Camera,
        unlocked: totalPosts >= 1,
        color: 'bg-blue-500',
        progress: Math.min(totalPosts, 1),
        target: 1
      },
      {
        id: 'active_poster',
        title: 'アクティブ投稿者',
        description: '10枚の写真を投稿',
        icon: TrendingUp,
        unlocked: totalPosts >= 10,
        color: 'bg-green-500',
        progress: Math.min(totalPosts, 10),
        target: 10
      },
      {
        id: 'popular_creator',
        title: '人気クリエイター',
        description: '総いいね数100達成',
        icon: Heart,
        unlocked: totalLikes >= 100,
        color: 'bg-pink-500',
        progress: Math.min(totalLikes, 100),
        target: 100
      },
      {
        id: 'consistent_creator',
        title: '継続クリエイター',
        description: '50枚の写真を投稿',
        icon: Award,
        unlocked: totalPosts >= 50,
        color: 'bg-gray-500',
        progress: Math.min(totalPosts, 50),
        target: 50
      }
    ];
  };

  const achievements = calculateAchievements();
  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const nextAchievements = achievements.filter(a => !a.unlocked).slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-xl p-6"
    >
      <h3 className="text-xl font-semibold text-gray-900 mb-6">🏆 あなたの成長</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 達成済み実績 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-4">✅ 達成済み実績</h4>
          {unlockedAchievements.length > 0 ? (
            <div className="space-y-3">
              {unlockedAchievements.slice(0, 4).map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className={`p-2 rounded-lg ${achievement.color} mr-3`}>
                    <achievement.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 text-sm">{achievement.title}</div>
                    <div className="text-xs text-gray-600">{achievement.description}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Award className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <div className="text-sm">最初の投稿で実績を獲得しよう！</div>
            </div>
          )}
        </div>
        
        {/* 次の目標 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-4">🎯 次の目標</h4>
          {nextAchievements.length > 0 ? (
            <div className="space-y-3">
              {nextAchievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="p-3 bg-gray-50 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center mb-2">
                    <div className="p-2 rounded-lg bg-gray-400 mr-3">
                      <achievement.icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm">{achievement.title}</div>
                      <div className="text-xs text-gray-600">{achievement.description}</div>
                    </div>
                    {achievement.progress !== undefined && achievement.target && (
                      <div className="text-xs text-gray-500">
                        {achievement.progress}/{achievement.target}
                      </div>
                    )}
                  </div>
                  {achievement.progress !== undefined && achievement.target && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((achievement.progress / achievement.target) * 100, 100)}%` }}
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <div className="text-sm">全ての実績を達成しました！</div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};