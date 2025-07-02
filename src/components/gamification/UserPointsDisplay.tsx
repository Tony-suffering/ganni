import React from 'react';
import { Trophy, Star, TrendingUp } from 'lucide-react';
import { UserPoints, LevelInfo } from '../../types';

interface UserPointsDisplayProps {
  userPoints: UserPoints;
  levelInfo: LevelInfo;
  variant?: 'full' | 'compact' | 'inline';
}

export const UserPointsDisplay: React.FC<UserPointsDisplayProps> = ({
  userPoints,
  levelInfo,
  variant = 'full'
}) => {
  if (variant === 'inline') {
    return (
      <div className="flex items-center space-x-2 text-sm">
        <div className="flex items-center space-x-1">
          <Star className="w-4 h-4 text-yellow-500" />
          <span className="font-medium">{userPoints.total_points}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Trophy className="w-4 h-4 text-blue-500" />
          <span className="text-blue-600 font-medium">Lv.{levelInfo.level}</span>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-blue-500" />
            <div>
              <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                Lv.{levelInfo.level} {levelInfo.levelName}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {userPoints.total_points} ポイント
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              次のレベルまで
            </div>
            <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {levelInfo.nextLevelPoints - levelInfo.currentPoints}
            </div>
          </div>
        </div>
        <div className="mt-2">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${levelInfo.progressPercentage}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-blue-500" />
          <span>レベル・ポイント</span>
        </h3>
        <div className="flex items-center space-x-1">
          <TrendingUp className="w-4 h-4 text-green-500" />
          <span className="text-sm text-green-600 dark:text-green-400">成長中</span>
        </div>
      </div>

      {/* Level Display */}
      <div className="text-center mb-6">
        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
          Lv.{levelInfo.level}
        </div>
        <div className="text-lg text-gray-600 dark:text-gray-400 mb-2">
          {levelInfo.levelName}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-500">
          総ポイント: {userPoints.total_points}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
          <span>現在のレベル</span>
          <span>次のレベル</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${levelInfo.progressPercentage}%` }}
          />
        </div>
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          あと {levelInfo.nextLevelPoints - levelInfo.currentPoints} ポイントで次のレベル
        </div>
      </div>

      {/* Point Breakdown */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">学習ポイント</div>
          <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
            {userPoints.learning_points}
          </div>
          <div className="text-xs text-blue-500 dark:text-blue-400">
            インスピレーション受領
          </div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
          <div className="text-sm text-purple-600 dark:text-purple-400 mb-1">影響ポイント</div>
          <div className="text-xl font-bold text-purple-700 dark:text-purple-300">
            {userPoints.influence_points}
          </div>
          <div className="text-xs text-purple-500 dark:text-purple-400">
            インスピレーション提供
          </div>
        </div>
      </div>
    </div>
  );
};