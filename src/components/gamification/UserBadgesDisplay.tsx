import React from 'react';
import { Award, Lock, Star } from 'lucide-react';
import { UserBadge, Badge } from '../../types';

interface UserBadgesDisplayProps {
  userBadges?: UserBadge[];
  badges?: UserBadge[];
  variant?: 'full' | 'compact' | 'inline';
  limit?: number;
}

export const UserBadgesDisplay: React.FC<UserBadgesDisplayProps> = ({
  userBadges,
  badges,
  variant = 'full',
  limit
}) => {
  const badgesToUse = userBadges || badges || [];
  const displayBadges = limit ? badgesToUse.slice(0, limit) : badgesToUse;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'border-gray-300 bg-gray-50 text-gray-700';
      case 'rare':
        return 'border-blue-300 bg-blue-50 text-blue-700';
      case 'epic':
        return 'border-purple-300 bg-purple-50 text-purple-700';
      case 'legendary':
        return 'border-yellow-300 bg-yellow-50 text-yellow-700';
      default:
        return 'border-gray-300 bg-gray-50 text-gray-700';
    }
  };

  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case 'rare':
        return 'shadow-blue-200';
      case 'epic':
        return 'shadow-purple-200';
      case 'legendary':
        return 'shadow-yellow-200 animate-pulse';
      default:
        return '';
    }
  };

  if (variant === 'inline') {
    return (
      <div className="flex items-center space-x-1">
        {displayBadges.map((userBadge) => (
          <div
            key={userBadge.id}
            className={`inline-flex items-center justify-center w-6 h-6 rounded-full border ${getRarityColor(userBadge.badge.rarity)} ${getRarityGlow(userBadge.badge.rarity)}`}
            title={`${userBadge.badge.display_name}: ${userBadge.badge.description}`}
          >
            <span className="text-xs">{userBadge.badge.icon}</span>
          </div>
        ))}
        {badgesToUse.length > (limit || badgesToUse.length) && (
          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-gray-300 bg-gray-50 text-gray-500">
            <span className="text-xs">+{badgesToUse.length - (limit || 0)}</span>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 flex items-center space-x-1">
            <Award className="w-4 h-4" />
            <span>バッジ ({badgesToUse.length})</span>
          </h4>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {displayBadges.map((userBadge) => (
            <div
              key={userBadge.id}
              className={`flex flex-col items-center p-2 rounded-lg border ${getRarityColor(userBadge.badge.rarity)} ${getRarityGlow(userBadge.badge.rarity)}`}
              title={`${userBadge.badge.display_name}: ${userBadge.badge.description}`}
            >
              <span className="text-lg mb-1">{userBadge.badge.icon}</span>
              <span className="text-xs text-center leading-tight">{userBadge.badge.display_name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center space-x-2">
          <Award className="w-5 h-5 text-yellow-500" />
          <span>獲得バッジ</span>
        </h3>
        <div className="flex items-center space-x-1">
          <Star className="w-4 h-4 text-yellow-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">{badgesToUse.length} 個</span>
        </div>
      </div>

      {badgesToUse.length === 0 ? (
        <div className="text-center py-8">
          <Lock className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 dark:text-gray-400">まだバッジを獲得していません</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            インスピレーションを与えたり受け取ったりしてバッジを獲得しよう！
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {badgesToUse.map((userBadge) => (
            <div
              key={userBadge.id}
              className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${getRarityColor(userBadge.badge.rarity)} ${getRarityGlow(userBadge.badge.rarity)}`}
            >
              <div className="text-3xl mb-2">{userBadge.badge.icon}</div>
              <h4 className="font-medium text-center text-sm mb-1">
                {userBadge.badge.display_name}
              </h4>
              <p className="text-xs text-center opacity-80 mb-2">
                {userBadge.badge.description}
              </p>
              <div className="flex items-center space-x-1">
                <span className={`text-xs px-2 py-1 rounded-full border ${getRarityColor(userBadge.badge.rarity)}`}>
                  {userBadge.badge.rarity}
                </span>
              </div>
              <div className="text-xs opacity-60 mt-1">
                {new Date(userBadge.earned_at).toLocaleDateString('ja-JP')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Badge Categories */}
      {badgesToUse.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {['learner', 'mentor', 'special', 'achievement'].map((category) => {
              const categoryBadges = badgesToUse.filter(b => b.badge.category === category);
              const categoryNames = {
                learner: '学習者',
                mentor: 'メンター',
                special: '特別',
                achievement: '達成'
              };
              return (
                <div key={category} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {categoryNames[category as keyof typeof categoryNames]}
                  </div>
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {categoryBadges.length}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};