import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Eye, EyeOff, Info } from 'lucide-react';
import { UserBadge, Badge } from '../../types';

interface UserBadgesDisplayProps {
  userBadges: UserBadge[];
  onToggleDisplay?: (badgeId: string, isDisplayed: boolean) => void;
  variant?: 'full' | 'compact' | 'inline';
}

export const UserBadgesDisplay: React.FC<UserBadgesDisplayProps> = ({ 
  userBadges, 
  onToggleDisplay,
  variant = 'full'
}) => {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  const displayedBadges = userBadges.filter(ub => ub.is_displayed && ub.badge);
  const allBadges = userBadges.filter(ub => ub.badge);

  // インライン表示（PostCardなどで使用）
  if (variant === 'inline') {
    return (
      <div className="flex items-center space-x-1">
        {displayedBadges.slice(0, 3).map((userBadge) => (
          <span
            key={userBadge.id}
            className="text-lg"
            title={userBadge.badge?.display_name}
          >
            {userBadge.badge?.icon}
          </span>
        ))}
        {displayedBadges.length > 3 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            +{displayedBadges.length - 3}
          </span>
        )}
      </div>
    );
  }

  // コンパクト表示
  if (variant === 'compact') {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
        <div className="flex items-center space-x-2 mb-2">
          <Award className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            バッジ ({allBadges.length}個)
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {displayedBadges.map((userBadge) => (
            <span
              key={userBadge.id}
              className="text-xl cursor-pointer hover:scale-110 transition-transform"
              title={userBadge.badge?.display_name}
              onClick={() => setSelectedBadge(userBadge.badge!)}
            >
              {userBadge.badge?.icon}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // フル表示
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
            <Award className="w-5 h-5 text-yellow-500" />
            <span>獲得バッジ ({allBadges.length}個)</span>
          </h3>
        </div>

        {allBadges.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              まだバッジを獲得していません
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              インスピレーション活動を続けてバッジを集めよう！
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {allBadges.map((userBadge) => {
              const badge = userBadge.badge!;
              const rarityColors = {
                common: 'border-gray-300 bg-gray-50',
                rare: 'border-blue-300 bg-blue-50',
                epic: 'border-gray-300 bg-gray-50',
                legendary: 'border-yellow-300 bg-yellow-50'
              };

              return (
                <motion.div
                  key={userBadge.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`relative p-3 rounded-lg border-2 cursor-pointer transition-all hover:scale-105 ${
                    rarityColors[badge.rarity as keyof typeof rarityColors]
                  } ${
                    !userBadge.is_displayed ? 'opacity-60' : ''
                  }`}
                  onClick={() => setSelectedBadge(badge)}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">{badge.icon}</div>
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                      {badge.display_name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(userBadge.earned_at).toLocaleDateString('ja-JP')}
                    </div>
                  </div>

                  {/* 表示切り替えボタン */}
                  {onToggleDisplay && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleDisplay(badge.id, !userBadge.is_displayed);
                      }}
                      className="absolute top-1 right-1 p-1 bg-white dark:bg-gray-700 rounded-full shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      title={userBadge.is_displayed ? 'プロフィールから非表示' : 'プロフィールに表示'}
                    >
                      {userBadge.is_displayed ? (
                        <Eye className="w-3 h-3 text-green-600" />
                      ) : (
                        <EyeOff className="w-3 h-3 text-gray-400" />
                      )}
                    </button>
                  )}

                  {/* レアリティ表示 */}
                  {badge.rarity !== 'common' && (
                    <div className={`absolute top-1 left-1 px-1 py-0.5 text-xs rounded ${
                      badge.rarity === 'rare' ? 'bg-blue-200 text-blue-800' :
                      badge.rarity === 'epic' ? 'bg-gray-200 text-gray-800' :
                      'bg-yellow-200 text-yellow-800'
                    }`}>
                      {badge.rarity === 'rare' ? 'R' : badge.rarity === 'epic' ? 'E' : 'L'}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* バッジ詳細モーダル */}
      <AnimatePresence>
        {selectedBadge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedBadge(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="text-6xl mb-4">{selectedBadge.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {selectedBadge.display_name}
                </h3>
                <div className={`inline-block px-3 py-1 rounded-full text-sm mb-4 ${
                  selectedBadge.rarity === 'common' ? 'bg-gray-200 text-gray-800' :
                  selectedBadge.rarity === 'rare' ? 'bg-blue-200 text-blue-800' :
                  selectedBadge.rarity === 'epic' ? 'bg-gray-200 text-gray-800' :
                  'bg-yellow-200 text-yellow-800'
                }`}>
                  {selectedBadge.rarity === 'common' ? 'コモン' :
                   selectedBadge.rarity === 'rare' ? 'レア' :
                   selectedBadge.rarity === 'epic' ? 'エピック' : 'レジェンダリー'}
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {selectedBadge.description}
                </p>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  達成条件: {selectedBadge.requirement_value}回の
                  {selectedBadge.requirement_type === 'inspiration_count' ? 'インスピレーション作成' :
                   selectedBadge.requirement_type === 'inspired_count' ? 'インスピレーション提供' :
                   selectedBadge.requirement_type === 'chain_level' ? 'チェーンレベル達成' :
                   selectedBadge.requirement_type === 'different_types_used' ? '異なるタイプ使用' :
                   '特別な活動'}
                </div>
              </div>
              <button
                onClick={() => setSelectedBadge(null)}
                className="w-full mt-6 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                閉じる
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};