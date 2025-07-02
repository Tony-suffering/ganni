import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Gift, 
  Star, 
  TrendingUp, 
  Flame, 
  Trophy,
  Calendar,
  Target,
  Zap,
  Award
} from 'lucide-react';
import { PostBonusService, PostBonus, UserPostStats } from '../../services/postBonusService';

interface PostBonusDisplayProps {
  userId: string;
  variant?: 'full' | 'compact' | 'summary';
}

export const PostBonusDisplay: React.FC<PostBonusDisplayProps> = ({ 
  userId, 
  variant = 'full' 
}) => {
  const [bonuses, setBonuses] = useState<PostBonus[]>([]);
  const [stats, setStats] = useState<UserPostStats | null>(null);
  const [monthlyTotal, setMonthlyTotal] = useState<any>(null);
  const [streakInfo, setStreakInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'info'>('overview');

  useEffect(() => {
    if (userId) {
      loadBonusData();
    }
  }, [userId]);

  const loadBonusData = async () => {
    try {
      setLoading(true);
      
      const [bonusData, statsData, monthlyData, streakData] = await Promise.all([
        PostBonusService.getUserPostBonuses(userId, 10),
        PostBonusService.getUserPostStats(userId),
        PostBonusService.getMonthlyBonusTotal(userId),
        PostBonusService.getStreakInfo(userId)
      ]);

      setBonuses(bonusData);
      setStats(statsData);
      setMonthlyTotal(monthlyData);
      setStreakInfo(streakData);
    } catch (error) {
      console.error('ボーナスデータ読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600">投稿ボーナス情報を読み込み中...</span>
        </div>
      </div>
    );
  }

  if (variant === 'summary') {
    return <BonusSummary monthlyTotal={monthlyTotal} streakInfo={streakInfo} />;
  }

  if (variant === 'compact') {
    return <CompactBonusDisplay monthlyTotal={monthlyTotal} stats={stats} />;
  }

  return (
    <div className="space-y-6">
      {/* タブナビゲーション */}
      <div className="flex space-x-4 border-b border-gray-200">
        <TabButton
          icon={Trophy}
          label="概要"
          isActive={activeTab === 'overview'}
          onClick={() => setActiveTab('overview')}
        />
        <TabButton
          icon={Calendar}
          label="履歴"
          isActive={activeTab === 'history'}
          onClick={() => setActiveTab('history')}
        />
        <TabButton
          icon={Target}
          label="ボーナス情報"
          isActive={activeTab === 'info'}
          onClick={() => setActiveTab('info')}
        />
      </div>

      {/* タブコンテンツ */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'overview' && (
          <OverviewSection 
            monthlyTotal={monthlyTotal}
            stats={stats}
            streakInfo={streakInfo}
          />
        )}
        
        {activeTab === 'history' && (
          <HistorySection bonuses={bonuses} />
        )}
        
        {activeTab === 'info' && (
          <InfoSection />
        )}
      </motion.div>
    </div>
  );
};

// タブボタンコンポーネント
const TabButton: React.FC<{
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon: Icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 py-3 px-4 border-b-2 transition-colors ${
      isActive
        ? 'border-gray-800 text-gray-800'
        : 'border-transparent text-gray-500 hover:text-gray-700'
    }`}
  >
    <Icon className="w-4 h-4" />
    <span className="font-medium">{label}</span>
  </button>
);

// 概要セクション
const OverviewSection: React.FC<{
  monthlyTotal: any;
  stats: UserPostStats | null;
  streakInfo: any;
}> = ({ monthlyTotal, stats, streakInfo }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* 今月の獲得ボーナス */}
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Gift className="w-5 h-5 text-blue-600" />
        <h4 className="text-lg font-semibold text-gray-900">今月の獲得ボーナス</h4>
      </div>
      <div className="text-3xl font-bold text-blue-600 mb-4">
        {monthlyTotal?.totalBonus || 0} ポイント
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">基本:</span>
          <span className="font-medium">{monthlyTotal?.baseBonus || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">品質:</span>
          <span className="font-medium">{monthlyTotal?.qualityBonus || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">連続:</span>
          <span className="font-medium">{monthlyTotal?.streakBonus || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">記念:</span>
          <span className="font-medium">{monthlyTotal?.milestoneBonus || 0}</span>
        </div>
      </div>
    </div>

    {/* 連続投稿ストリーク */}
    <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Flame className="w-5 h-5 text-orange-600" />
        <h4 className="text-lg font-semibold text-gray-900">連続投稿ストリーク</h4>
      </div>
      <div className="text-3xl font-bold text-orange-600 mb-2">
        {streakInfo?.currentStreak || 0} 日
      </div>
      <div className="text-sm text-gray-600 mb-3">
        最長記録: {streakInfo?.longestStreak || 0} 日
      </div>
      <div className="bg-white/60 rounded-lg p-3">
        <div className="text-sm text-gray-600">次のボーナス</div>
        <div className="text-lg font-semibold text-orange-600">
          +{streakInfo?.nextStreakBonus || 10} ポイント
        </div>
      </div>
    </div>

    {/* 投稿統計 */}
    {stats && (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <h4 className="text-lg font-semibold text-gray-900">投稿統計</h4>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.total_posts}</div>
            <div className="text-sm text-gray-600">総投稿数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats.average_photo_score.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">平均スコア</div>
          </div>
        </div>
      </div>
    )}

    {/* エンゲージメント統計 */}
    {stats && (
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Zap className="w-5 h-5 text-purple-600" />
          <h4 className="text-lg font-semibold text-gray-900">エンゲージメント</h4>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="text-center">
            <div className="text-xl font-bold text-purple-600">{stats.total_likes_received}</div>
            <div className="text-gray-600">いいね</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-purple-600">{stats.total_comments_received}</div>
            <div className="text-gray-600">コメント</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-purple-600">{stats.total_bookmarks_received}</div>
            <div className="text-gray-600">ブックマーク</div>
          </div>
        </div>
      </div>
    )}
  </div>
);

// 履歴セクション
const HistorySection: React.FC<{ bonuses: PostBonus[] }> = ({ bonuses }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <div className="flex items-center space-x-2 mb-6">
      <Calendar className="w-5 h-5 text-gray-600" />
      <h4 className="text-lg font-semibold text-gray-900">投稿ボーナス履歴</h4>
    </div>
    
    {bonuses.length > 0 ? (
      <div className="space-y-4">
        {bonuses.map((bonus) => (
          <BonusHistoryItem key={bonus.id} bonus={bonus} />
        ))}
      </div>
    ) : (
      <div className="text-center py-8 text-gray-500">
        <Gift className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>まだ投稿ボーナスがありません</p>
        <p className="text-sm mt-1">投稿を作成してボーナスを獲得しよう！</p>
      </div>
    )}
  </div>
);

// ボーナス履歴アイテム
const BonusHistoryItem: React.FC<{ bonus: PostBonus }> = ({ bonus }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
        <Gift className="w-5 h-5 text-white" />
      </div>
      <div>
        <div className="font-medium text-gray-900">
          投稿ボーナス #{bonus.post_count_at_time}
        </div>
        <div className="text-sm text-gray-500">
          {new Date(bonus.created_at).toLocaleDateString('ja-JP')}
        </div>
        {bonus.photo_score && (
          <div className="text-xs text-purple-600">
            写真スコア: {bonus.photo_score}点
          </div>
        )}
      </div>
    </div>
    <div className="text-right">
      <div className="text-lg font-bold text-green-600">
        +{bonus.total_bonus}
      </div>
      <div className="text-xs text-gray-500">
        基本{bonus.base_bonus} + 品質{bonus.quality_bonus} + 連続{bonus.streak_bonus}
      </div>
    </div>
  </div>
);

// ボーナス情報セクション
const InfoSection: React.FC = () => {
  const qualityBonuses = PostBonusService.getQualityBonusInfo();
  const milestones = PostBonusService.getMilestoneInfo();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 品質ボーナス表 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Star className="w-5 h-5 text-yellow-600" />
          <h4 className="text-lg font-semibold text-gray-900">品質ボーナス</h4>
        </div>
        <div className="space-y-3">
          {qualityBonuses.map((item, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
              <div>
                <div className="font-medium text-gray-900">{item.label}</div>
                <div className="text-sm text-gray-500">{item.minScore}-{item.maxScore}点</div>
              </div>
              <div className="text-lg font-bold text-blue-600">
                +{item.bonus}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* マイルストーンボーナス */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Award className="w-5 h-5 text-purple-600" />
          <h4 className="text-lg font-semibold text-gray-900">マイルストーンボーナス</h4>
        </div>
        <div className="space-y-3">
          {milestones.map((item, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
              <div>
                <div className="font-medium text-gray-900">{item.label}</div>
                <div className="text-sm text-gray-500">{item.postCount}投稿目</div>
              </div>
              <div className="text-lg font-bold text-purple-600">
                +{item.bonus}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* その他のボーナス */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 lg:col-span-2">
        <div className="flex items-center space-x-2 mb-4">
          <Zap className="w-5 h-5 text-orange-600" />
          <h4 className="text-lg font-semibold text-gray-900">その他のボーナス</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">エンゲージメントボーナス</div>
            <div className="text-lg font-semibold text-gray-900">いいね +2pt</div>
            <div className="text-lg font-semibold text-gray-900">コメント +5pt</div>
            <div className="text-lg font-semibold text-gray-900">ブックマーク +3pt</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">連続投稿ボーナス</div>
            <div className="text-sm text-gray-700">3日連続: +10pt</div>
            <div className="text-sm text-gray-700">7日連続: +15pt</div>
            <div className="text-sm text-gray-700">14日連続: +25pt</div>
            <div className="text-sm text-gray-700">30日連続: +50pt</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">基本ボーナス</div>
            <div className="text-lg font-semibold text-gray-900">投稿作成 +5pt</div>
            <div className="text-sm text-gray-700">すべての投稿で獲得</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// サマリー表示
const BonusSummary: React.FC<{ 
  monthlyTotal: any; 
  streakInfo: any; 
}> = ({ monthlyTotal, streakInfo }) => (
  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
    <div className="flex items-center space-x-2 mb-3">
      <Gift className="w-5 h-5 text-blue-600" />
      <h4 className="text-lg font-semibold text-gray-900">投稿ボーナス</h4>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <div className="text-2xl font-bold text-blue-600">
          {monthlyTotal?.totalBonus || 0}
        </div>
        <div className="text-sm text-gray-600">今月の獲得</div>
      </div>
      <div>
        <div className="text-2xl font-bold text-orange-600">
          {streakInfo?.currentStreak || 0}
        </div>
        <div className="text-sm text-gray-600">連続投稿日数</div>
      </div>
    </div>
  </div>
);

// コンパクト表示
const CompactBonusDisplay: React.FC<{ 
  monthlyTotal: any; 
  stats: UserPostStats | null; 
}> = ({ monthlyTotal, stats }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4">
    <div className="flex items-center justify-between mb-4">
      <h4 className="text-sm font-medium text-gray-800 flex items-center space-x-1">
        <Gift className="w-4 h-4" />
        <span>投稿ボーナス</span>
      </h4>
      <div className="text-lg font-bold text-blue-600">
        {monthlyTotal?.totalBonus || 0}pt
      </div>
    </div>
    <div className="grid grid-cols-4 gap-2 text-xs">
      <div className="text-center">
        <div className="font-medium">{monthlyTotal?.baseBonus || 0}</div>
        <div className="text-gray-500">基本</div>
      </div>
      <div className="text-center">
        <div className="font-medium">{monthlyTotal?.qualityBonus || 0}</div>
        <div className="text-gray-500">品質</div>
      </div>
      <div className="text-center">
        <div className="font-medium">{monthlyTotal?.streakBonus || 0}</div>
        <div className="text-gray-500">連続</div>
      </div>
      <div className="text-center">
        <div className="font-medium">{stats?.total_posts || 0}</div>
        <div className="text-gray-500">投稿数</div>
      </div>
    </div>
  </div>
);