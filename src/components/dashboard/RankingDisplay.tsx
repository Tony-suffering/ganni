import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Medal, 
  Crown, 
  TrendingUp, 
  TrendingDown,
  Minus,
  Star,
  Camera,
  BarChart3,
  Lightbulb,
  Users,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { 
  RankingService, 
  RankingEntry, 
  RankingStats, 
  RankingType, 
  RankingPeriod 
} from '../../services/rankingService';

interface RankingDisplayProps {
  userId: string;
  variant?: 'full' | 'compact' | 'mini';
}

export const RankingDisplay: React.FC<RankingDisplayProps> = ({ 
  userId, 
  variant = 'full' 
}) => {
  const [userRankings, setUserRankings] = useState<RankingStats | null>(null);
  const [topRankers, setTopRankers] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRankingType, setActiveRankingType] = useState<RankingType>('total_points');
  const [activePeriod, setActivePeriod] = useState<RankingPeriod>('all_time');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRankingData();
  }, [userId, activeRankingType, activePeriod]);

  const loadRankingData = async () => {
    try {
      setLoading(true);
      
      const [userRankingData, topRankerData] = await Promise.all([
        RankingService.getUserRankingInfo(userId),
        RankingService.getTopRankers(activeRankingType, activePeriod, 10)
      ]);

      setUserRankings(userRankingData);
      setTopRankers(topRankerData);
    } catch (error) {
      console.error('ランキングデータ読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await RankingService.updateAllRankings();
      await loadRankingData();
    } catch (error) {
      console.error('ランキング更新エラー:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600">ランキング情報を読み込み中...</span>
        </div>
      </div>
    );
  }

  if (variant === 'mini') {
    return <MiniRankingDisplay userRankings={userRankings} />;
  }

  if (variant === 'compact') {
    return <CompactRankingDisplay userRankings={userRankings} topRankers={topRankers} />;
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Trophy className="w-6 h-6 text-yellow-600" />
          <h3 className="text-xl font-bold text-gray-900">ランキング</h3>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>更新</span>
        </button>
      </div>

      {/* 自分のランキング概要 */}
      <UserRankingSummary userRankings={userRankings} />

      {/* ランキングタイプ選択 */}
      <RankingTypeSelector 
        activeType={activeRankingType}
        onTypeChange={setActiveRankingType}
      />

      {/* 期間選択 */}
      <PeriodSelector 
        activePeriod={activePeriod}
        onPeriodChange={setActivePeriod}
      />

      {/* リーダーボード */}
      <Leaderboard 
        entries={topRankers}
        rankingType={activeRankingType}
        period={activePeriod}
        currentUserId={userId}
      />
    </div>
  );
};

// 自分のランキング概要
const UserRankingSummary: React.FC<{ userRankings: RankingStats | null }> = ({ 
  userRankings 
}) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <RankingCard
      icon={Trophy}
      title="総合ランキング"
      rank={userRankings?.totalPoints?.rank_position}
      total={userRankings?.totalPoints?.total_users}
      score={userRankings?.totalPoints?.score}
      color="yellow"
    />
    <RankingCard
      icon={Camera}
      title="写真品質"
      rank={userRankings?.photoQuality?.rank_position}
      total={userRankings?.photoQuality?.total_users}
      score={userRankings?.photoQuality?.score}
      color="blue"
    />
    <RankingCard
      icon={BarChart3}
      title="投稿数"
      rank={userRankings?.postCount?.rank_position}
      total={userRankings?.postCount?.total_users}
      score={userRankings?.postCount?.score}
      color="green"
    />
    <RankingCard
      icon={Lightbulb}
      title="インスピレーション"
      rank={userRankings?.inspirationInfluence?.rank_position}
      total={userRankings?.inspirationInfluence?.total_users}
      score={userRankings?.inspirationInfluence?.score}
      color="purple"
    />
  </div>
);

// ランキングカード
const RankingCard: React.FC<{
  icon: React.ElementType;
  title: string;
  rank?: number;
  total?: number;
  score?: number;
  color: string;
}> = ({ icon: Icon, title, rank, total, score, color }) => {
  const getColorClasses = () => {
    switch (color) {
      case 'yellow': return 'from-yellow-50 to-orange-50 text-yellow-600 border-yellow-200';
      case 'blue': return 'from-blue-50 to-indigo-50 text-blue-600 border-blue-200';
      case 'green': return 'from-green-50 to-emerald-50 text-green-600 border-green-200';
      case 'purple': return 'from-purple-50 to-pink-50 text-purple-600 border-purple-200';
      default: return 'from-gray-50 to-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className={`bg-gradient-to-br rounded-lg p-4 border ${getColorClasses()}`}>
      <div className="flex items-center space-x-2 mb-2">
        <Icon className="w-5 h-5" />
        <h4 className="font-medium text-gray-900 text-sm">{title}</h4>
      </div>
      {rank ? (
        <div>
          <div className="text-2xl font-bold text-gray-900">
            {rank}位
          </div>
          <div className="text-sm text-gray-600">
            / {total}人
          </div>
          {score && (
            <div className="text-xs text-gray-500 mt-1">
              スコア: {Math.round(score)}
            </div>
          )}
        </div>
      ) : (
        <div className="text-gray-500 text-sm">
          ランキング外
        </div>
      )}
    </div>
  );
};

// ランキングタイプ選択
const RankingTypeSelector: React.FC<{
  activeType: RankingType;
  onTypeChange: (type: RankingType) => void;
}> = ({ activeType, onTypeChange }) => {
  const types: Array<{ key: RankingType; icon: React.ElementType; label: string }> = [
    { key: 'total_points', icon: Trophy, label: '総合' },
    { key: 'photo_quality', icon: Camera, label: '写真品質' },
    { key: 'post_count', icon: BarChart3, label: '投稿数' },
    { key: 'inspiration_influence', icon: Lightbulb, label: 'インスピレーション' },
  ];

  return (
    <div className="flex space-x-2 overflow-x-auto">
      {types.map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          onClick={() => onTypeChange(key)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
            activeType === key
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Icon className="w-4 h-4" />
          <span className="text-sm font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
};

// 期間選択
const PeriodSelector: React.FC<{
  activePeriod: RankingPeriod;
  onPeriodChange: (period: RankingPeriod) => void;
}> = ({ activePeriod, onPeriodChange }) => {
  const periods: Array<{ key: RankingPeriod; label: string }> = [
    { key: 'all_time', label: '全期間' },
    { key: 'monthly', label: '今月' },
    { key: 'weekly', label: '今週' },
  ];

  return (
    <div className="flex space-x-2">
      {periods.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onPeriodChange(key)}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            activePeriod === key
              ? 'bg-blue-100 text-blue-700 font-medium'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

// リーダーボード
const Leaderboard: React.FC<{
  entries: RankingEntry[];
  rankingType: RankingType;
  period: RankingPeriod;
  currentUserId: string;
}> = ({ entries, rankingType, period, currentUserId }) => (
  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
      <div className="flex items-center space-x-2">
        <Crown className="w-5 h-5 text-yellow-600" />
        <h4 className="font-semibold text-gray-900">
          {RankingService.getRankingInfo()[rankingType].name} - {RankingService.getPeriodInfo()[period].name}
        </h4>
      </div>
    </div>
    
    <div className="divide-y divide-gray-100">
      {entries.map((entry) => (
        <LeaderboardRow 
          key={entry.user_id}
          entry={entry}
          rankingType={rankingType}
          isCurrentUser={entry.user_id === currentUserId}
        />
      ))}
    </div>

    {entries.length === 0 && (
      <div className="text-center py-8 text-gray-500">
        <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>このランキングにはまだデータがありません</p>
      </div>
    )}
  </div>
);

// リーダーボード行
const LeaderboardRow: React.FC<{
  entry: RankingEntry;
  rankingType: RankingType;
  isCurrentUser: boolean;
}> = ({ entry, rankingType, isCurrentUser }) => {
  const getRankIcon = (position: number) => {
    switch (position) {
      case 1: return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400" />;
      case 3: return <Medal className="w-6 h-6 text-orange-600" />;
      default: return <span className="text-lg font-bold text-gray-600">{position}</span>;
    }
  };

  const getDisplayName = () => {
    return entry.user?.user_metadata?.name || 'ユーザー';
  };

  const getAvatarUrl = () => {
    const name = getDisplayName();
    return entry.user?.user_metadata?.avatar_url || 
           `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0072f5&color=fff`;
  };

  const formatScore = () => {
    switch (rankingType) {
      case 'total_points':
      case 'post_count':
      case 'inspiration_influence':
        return `${Math.round(entry.score)} pt`;
      case 'photo_quality':
        return `${entry.score.toFixed(1)}`;
      default:
        return entry.score.toString();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center space-x-4 p-4 hover:bg-gray-50 transition-colors ${
        isCurrentUser ? 'bg-blue-50 border-l-4 border-blue-500' : ''
      }`}
    >
      {/* 順位 */}
      <div className="flex-shrink-0 w-8 flex justify-center">
        {getRankIcon(entry.rank_position)}
      </div>

      {/* アバター */}
      <img
        src={getAvatarUrl()}
        alt={getDisplayName()}
        className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
      />

      {/* ユーザー情報 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <p className={`text-sm font-medium truncate ${
            isCurrentUser ? 'text-blue-900' : 'text-gray-900'
          }`}>
            {getDisplayName()}
          </p>
          {isCurrentUser && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
              あなた
            </span>
          )}
        </div>
        
        {/* メタデータ表示 */}
        {entry.metadata && (
          <div className="text-xs text-gray-500 mt-1">
            {rankingType === 'photo_quality' && (
              <span>平均: {entry.metadata.average_score?.toFixed(1)}点 • 投稿: {entry.metadata.total_posts}件</span>
            )}
            {rankingType === 'inspiration_influence' && (
              <span>
                与えた: {entry.metadata.inspiration_given} • 受けた: {entry.metadata.inspiration_received}
              </span>
            )}
          </div>
        )}
      </div>

      {/* スコア */}
      <div className="text-right">
        <div className={`text-lg font-bold ${
          isCurrentUser ? 'text-blue-900' : 'text-gray-900'
        }`}>
          {formatScore()}
        </div>
      </div>
    </motion.div>
  );
};

// ミニ表示
const MiniRankingDisplay: React.FC<{ userRankings: RankingStats | null }> = ({ 
  userRankings 
}) => (
  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4">
    <div className="flex items-center space-x-2 mb-3">
      <Trophy className="w-5 h-5 text-yellow-600" />
      <h4 className="text-lg font-semibold text-gray-900">あなたのランキング</h4>
    </div>
    <div className="grid grid-cols-2 gap-3 text-center">
      <div>
        <div className="text-2xl font-bold text-yellow-600">
          {userRankings?.totalPoints?.rank_position || '-'}位
        </div>
        <div className="text-sm text-gray-600">総合</div>
      </div>
      <div>
        <div className="text-2xl font-bold text-blue-600">
          {userRankings?.photoQuality?.rank_position || '-'}位
        </div>
        <div className="text-sm text-gray-600">写真品質</div>
      </div>
    </div>
  </div>
);

// コンパクト表示
const CompactRankingDisplay: React.FC<{ 
  userRankings: RankingStats | null;
  topRankers: RankingEntry[];
}> = ({ userRankings, topRankers }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <div className="flex items-center justify-between mb-4">
      <h4 className="text-sm font-medium text-gray-800 flex items-center space-x-1">
        <Trophy className="w-4 h-4" />
        <span>ランキング</span>
      </h4>
    </div>
    
    {/* 自分の順位 */}
    <div className="bg-gray-50 rounded-lg p-3 mb-4">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="text-center">
          <div className="font-medium">{userRankings?.totalPoints?.rank_position || '-'}</div>
          <div className="text-gray-500">総合</div>
        </div>
        <div className="text-center">
          <div className="font-medium">{userRankings?.photoQuality?.rank_position || '-'}</div>
          <div className="text-gray-500">写真品質</div>
        </div>
      </div>
    </div>

    {/* トップ3 */}
    <div className="space-y-2">
      {topRankers.slice(0, 3).map((entry) => (
        <div key={entry.user_id} className="flex items-center space-x-2 text-sm">
          <span className="w-6 text-center">
            {entry.rank_position === 1 ? '🥇' : 
             entry.rank_position === 2 ? '🥈' : '🥉'}
          </span>
          <span className="flex-1 truncate">
            {entry.user?.user_metadata?.name || 'ユーザー'}
          </span>
          <span className="text-gray-500">{Math.round(entry.score)}</span>
        </div>
      ))}
    </div>
  </div>
);