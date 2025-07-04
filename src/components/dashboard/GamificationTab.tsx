import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Star, 
  TrendingUp, 
  History,
  Target,
  Award,
  Zap,
  Calendar,
  Gift
} from 'lucide-react';
import { useGamification } from '../../hooks/useGamification';
import { UserPointsDisplay } from '../gamification/UserPointsDisplay';
import { UserBadgesDisplay } from '../gamification/UserBadgesDisplay';
import { PostBonusDisplay } from './PostBonusDisplay';
import { RankingDisplay } from './RankingDisplay';

interface GamificationTabProps {
  userId: string;
}

export const GamificationTab: React.FC<GamificationTabProps> = ({ userId }) => {
  const { 
    userPoints, 
    userBadges, 
    levelInfo,
    loading,
    error,
    fetchRanking
  } = useGamification();
  
  // モックデータ（実際の実装では適切なデータを取得）
  const pointHistory: any[] = [];
  const rankings: any[] = [];

  const [activeSection, setActiveSection] = useState<'overview' | 'bonuses' | 'history' | 'achievements' | 'ranking'>('overview');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600">ゲーミフィケーション情報を読み込み中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-gray-500 text-sm">ゲーミフィケーション機能は準備中です</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* セクションナビゲーション */}
      <div className="flex space-x-1 md:space-x-4 border-b border-gray-200 overflow-x-auto">
        <SectionButton
          icon={Trophy}
          label="概要"
          mobileLabel="概要"
          isActive={activeSection === 'overview'}
          onClick={() => setActiveSection('overview')}
        />
        <SectionButton
          icon={Gift}
          label="投稿ボーナス"
          mobileLabel="ボーナス"
          isActive={activeSection === 'bonuses'}
          onClick={() => setActiveSection('bonuses')}
        />
        <SectionButton
          icon={History}
          label="履歴"
          mobileLabel="履歴"
          isActive={activeSection === 'history'}
          onClick={() => setActiveSection('history')}
        />
        <SectionButton
          icon={Award}
          label="達成"
          mobileLabel="達成"
          isActive={activeSection === 'achievements'}
          onClick={() => setActiveSection('achievements')}
        />
        <SectionButton
          icon={TrendingUp}
          label="ランキング"
          mobileLabel="順位"
          isActive={activeSection === 'ranking'}
          onClick={() => setActiveSection('ranking')}
        />
      </div>

      {/* セクションコンテンツ */}
      <motion.div
        key={activeSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeSection === 'overview' && (
          <OverviewSection 
            userPoints={userPoints}
            userBadges={userBadges}
            levelInfo={levelInfo}
          />
        )}
        
        {activeSection === 'bonuses' && (
          <PostBonusDisplay userId={userId} variant="full" />
        )}
        
        {activeSection === 'history' && (
          <HistorySection pointHistory={pointHistory} />
        )}
        
        {activeSection === 'achievements' && (
          <AchievementsSection userBadges={userBadges} />
        )}
        
        {activeSection === 'ranking' && (
          <RankingDisplay userId={userId} variant="full" />
        )}
      </motion.div>
    </div>
  );
};

// セクションボタンコンポーネント
interface SectionButtonProps {
  icon: React.ElementType;
  label: string;
  mobileLabel?: string;
  isActive: boolean;
  onClick: () => void;
}

const SectionButton: React.FC<SectionButtonProps> = ({ 
  icon: Icon, 
  label, 
  mobileLabel,
  isActive, 
  onClick 
}) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 py-3 px-2 md:px-4 border-b-2 transition-colors ${
      isActive
        ? 'border-gray-800 text-gray-800'
        : 'border-transparent text-gray-500 hover:text-gray-700'
    }`}
  >
    <Icon className="w-4 h-4" />
    <span className="font-medium text-xs md:text-sm">
      <span className="hidden md:inline">{label}</span>
      <span className="md:hidden">{mobileLabel || label}</span>
    </span>
  </button>
);

// 概要セクション
const OverviewSection: React.FC<{
  userPoints: any;
  userBadges: any[];
  levelInfo: any;
}> = ({ userPoints, userBadges, levelInfo }) => (
  <div className="space-y-6">
    {/* 上段: ポイント・バッジ */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <UserPointsDisplay 
        userPoints={userPoints}
        levelInfo={levelInfo}
        variant="full"
      />
      <UserBadgesDisplay 
        userBadges={userBadges}
        variant="compact"
      />
    </div>

    {/* 中段: 成果・目標・ランキング */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 今週の成果 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Zap className="w-5 h-5 text-blue-600" />
          <h4 className="text-lg font-semibold text-gray-900">今週の成果</h4>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">+{userPoints?.learning_points || 0}</div>
            <div className="text-sm text-gray-600">学習ポイント</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">+{userPoints?.influence_points || 0}</div>
            <div className="text-sm text-gray-600">影響力ポイント</div>
          </div>
        </div>
      </div>

      {/* 次の目標 */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Target className="w-5 h-5 text-green-600" />
          <h4 className="text-lg font-semibold text-gray-900">次の目標</h4>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">次のレベルまで</span>
            <span className="text-sm font-medium text-green-600">
              {levelInfo?.nextLevelPoints - levelInfo?.currentPoints || 0} ポイント
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">次のバッジまで</span>
            <span className="text-sm font-medium text-green-600">インスピレーション 3回</span>
          </div>
        </div>
      </div>

      {/* ランキング概要 */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Trophy className="w-5 h-5 text-yellow-600" />
          <h4 className="text-lg font-semibold text-gray-900">ランキング</h4>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">総合順位</span>
            <span className="text-sm font-medium text-yellow-600">-位</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">写真品質</span>
            <span className="text-sm font-medium text-yellow-600">-位</span>
          </div>
          <div className="text-center mt-3">
            <p className="text-xs text-gray-500">詳細はランキングタブで確認</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// 履歴セクション
const HistorySection: React.FC<{ pointHistory: any[] }> = ({ pointHistory }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <div className="flex items-center space-x-2 mb-6">
      <History className="w-5 h-5 text-gray-600" />
      <h4 className="text-lg font-semibold text-gray-900">ポイント履歴</h4>
    </div>
    
    {pointHistory && pointHistory.length > 0 ? (
      <div className="space-y-4">
        {pointHistory.slice(0, 10).map((history, index) => (
          <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                history.point_type === 'learning' ? 'bg-blue-100' : 'bg-purple-100'
              }`}>
                {history.point_type === 'learning' ? 
                  <Star className="w-4 h-4 text-blue-600" /> : 
                  <Trophy className="w-4 h-4 text-purple-600" />
                }
              </div>
              <div>
                <div className="font-medium text-gray-900">{history.description || 'ポイント獲得'}</div>
                <div className="text-sm text-gray-500">
                  {new Date(history.created_at).toLocaleDateString('ja-JP')}
                </div>
              </div>
            </div>
            <div className={`font-semibold ${
              history.points > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {history.points > 0 ? '+' : ''}{history.points}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-8 text-gray-500">
        <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>まだポイント履歴がありません</p>
        <p className="text-sm mt-1">インスピレーションを与えたり受け取ったりしてポイントを獲得しよう！</p>
      </div>
    )}
  </div>
);

// 達成セクション
const AchievementsSection: React.FC<{ userBadges: any[] }> = ({ userBadges }) => (
  <div>
    <UserBadgesDisplay 
      userBadges={userBadges}
      variant="full"
    />
  </div>
);

