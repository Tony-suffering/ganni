import React from 'react';
import { motion } from 'framer-motion';
import { Star, Award, TrendingUp, Zap } from 'lucide-react';
import { UserPoints, LevelInfo } from '../../types';

interface UserPointsDisplayProps {
  userPoints: UserPoints;
  levelInfo: LevelInfo;
  variant?: 'full' | 'compact';
}

export const UserPointsDisplay: React.FC<UserPointsDisplayProps> = ({ 
  userPoints, 
  levelInfo, 
  variant = 'full' 
}) => {
  const isCompact = variant === 'compact';

  if (isCompact) {
    return (
      <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
        <div className="flex items-center space-x-1">
          <Star className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            Lv.{levelInfo.level}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <TrendingUp className="w-4 h-4 text-blue-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {userPoints.total_points}pt
          </span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
          <Award className="w-5 h-5 text-yellow-500" />
          <span>レベル・ポイント</span>
        </h3>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            Lv.{levelInfo.level}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {levelInfo.levelName}
          </div>
        </div>
      </div>

      {/* レベルプログレスバー */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            次のレベルまで
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {levelInfo.nextLevelPoints - levelInfo.currentPoints} pt
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${levelInfo.progressPercentage}%` }}
            transition={{ duration: 1, delay: 0.5 }}
            className="bg-gradient-to-r from-blue-500 to-gray-500 h-2 rounded-full"
          />
        </div>
      </div>

      {/* ポイント詳細 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full mx-auto mb-2">
            <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {userPoints.total_points}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            総合ポイント
          </div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full mx-auto mb-2">
            <Star className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {userPoints.learning_points}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            学習ポイント
          </div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-900 rounded-full mx-auto mb-2">
            <Zap className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {userPoints.influence_points}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            影響力ポイント
          </div>
        </div>
      </div>
    </motion.div>
  );
};