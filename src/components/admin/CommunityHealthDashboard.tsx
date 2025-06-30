import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  AlertCircle,
  Shield
} from 'lucide-react';
import { userRotationService } from '../../services/userRotationService';
import { activityScoringService } from '../../services/activityScoringService';

interface CommunityStats {
  totalUsers: number;
  activeUsers: number;
  watchUsers: number;
  riskUsers: number;
  activeRatio: number;
  watchRatio: number;
  riskRatio: number;
  isOverCapacity: boolean;
  needsRebalancing: boolean;
  systemHealth: {
    score: number;
    status: string;
    issues: string[];
  };
}

interface RecentAction {
  id: string;
  user_id: string;
  action_type: 'tier_change' | 'warning_sent' | 'moved_to_waitlist' | 'reactivated';
  from_tier?: string;
  to_tier?: string;
  reason: string;
  created_at: string;
}

export const CommunityHealthDashboard: React.FC = () => {
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [recentActions, setRecentActions] = useState<RecentAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExecutingRotation, setIsExecutingRotation] = useState(false);

  useEffect(() => {
    loadDashboardData();
    
    // 5分ごとに自動更新
    const interval = setInterval(loadDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const rotationStats = await userRotationService.getRotationStatistics();
      
      if (rotationStats) {
        setStats(rotationStats.community);
        setRecentActions(rotationStats.recentActions);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeRotation = async () => {
    setIsExecutingRotation(true);
    try {
      await userRotationService.executeRotationAlgorithm();
      await loadDashboardData(); // データを再読み込み
    } catch (error) {
      console.error('Failed to execute rotation:', error);
    } finally {
      setIsExecutingRotation(false);
    }
  };

  const executeEmergencyRebalance = async () => {
    if (!confirm('緊急リバランスを実行しますか？この操作は取り消せません。')) return;
    
    setIsExecutingRotation(true);
    try {
      await userRotationService.executeEmergencyRebalance();
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to execute emergency rebalance:', error);
    } finally {
      setIsExecutingRotation(false);
    }
  };

  if (loading) {
    return (
      <div className=\"min-h-screen bg-gray-50 p-6\">
        <div className=\"max-w-7xl mx-auto\">
          <div className=\"animate-pulse\">
            <div className=\"h-8 bg-gray-200 rounded w-1/3 mb-8\"></div>
            <div className=\"grid grid-cols-1 md:grid-cols-4 gap-6 mb-8\">
              {[...Array(4)].map((_, i) => (
                <div key={i} className=\"h-32 bg-gray-200 rounded-lg\"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'Excellent': return 'text-green-600 bg-green-50';
      case 'Good': return 'text-blue-600 bg-blue-50';
      case 'Warning': return 'text-yellow-600 bg-yellow-50';
      case 'Critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'tier_change': return <TrendingUp className=\"w-4 h-4\" />;
      case 'warning_sent': return <AlertTriangle className=\"w-4 h-4\" />;
      case 'moved_to_waitlist': return <TrendingDown className=\"w-4 h-4\" />;
      case 'reactivated': return <CheckCircle className=\"w-4 h-4\" />;
      default: return <Activity className=\"w-4 h-4\" />;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'tier_change': return 'text-blue-600';
      case 'warning_sent': return 'text-yellow-600';
      case 'moved_to_waitlist': return 'text-red-600';
      case 'reactivated': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className=\"min-h-screen bg-gray-50 p-6\">
      <div className=\"max-w-7xl mx-auto\">
        {/* ヘッダー */}
        <div className=\"flex justify-between items-center mb-8\">
          <div>
            <h1 className=\"text-3xl font-bold text-gray-900\">🏛️ コミュニティ健康ダッシュボード</h1>
            <p className=\"text-gray-600 mt-2\">1000人アクティブコミュニティ管理システム</p>
          </div>
          
          <div className=\"flex space-x-4\">
            <button
              onClick={loadDashboardData}
              disabled={loading}
              className=\"px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2\"
            >
              <RotateCcw className=\"w-4 h-4\" />
              <span>更新</span>
            </button>
            
            <button
              onClick={executeRotation}
              disabled={isExecutingRotation}
              className=\"px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50\"
            >
              <Activity className=\"w-4 h-4\" />
              <span>{isExecutingRotation ? '実行中...' : 'ローテーション実行'}</span>
            </button>
            
            <button
              onClick={executeEmergencyRebalance}
              disabled={isExecutingRotation}
              className=\"px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 disabled:opacity-50\"
            >
              <AlertCircle className=\"w-4 h-4\" />
              <span>緊急リバランス</span>
            </button>
          </div>
        </div>

        {stats && (
          <>
            {/* システム健康度 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl p-6 mb-8 ${getHealthColor(stats.systemHealth.status)}`}
            >
              <div className=\"flex items-center justify-between\">
                <div className=\"flex items-center space-x-4\">
                  <Shield className=\"w-8 h-8\" />
                  <div>
                    <h2 className=\"text-xl font-semibold\">システム健康度: {stats.systemHealth.status}</h2>
                    <p className=\"text-sm opacity-75\">スコア: {stats.systemHealth.score}/100</p>
                  </div>
                </div>
                
                {stats.systemHealth.issues.length > 0 && (
                  <div className=\"text-right\">
                    <p className=\"text-sm font-medium mb-1\">要注意事項:</p>
                    <ul className=\"text-xs space-y-1\">
                      {stats.systemHealth.issues.map((issue, index) => (
                        <li key={index}>• {issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>

            {/* メイン統計カード */}
            <div className=\"grid grid-cols-1 md:grid-cols-4 gap-6 mb-8\">
              <StatCard
                icon={Users}
                title=\"総ユーザー数\"
                value={stats.totalUsers}
                suffix=\"人\"
                limit={1000}
                color=\"bg-blue-500\"
                isOverLimit={stats.isOverCapacity}
              />
              
              <StatCard
                icon={CheckCircle}
                title=\"アクティブユーザー\"
                value={stats.activeUsers}
                suffix=\"人\"
                percentage={stats.activeRatio * 100}
                color=\"bg-green-500\"
                target={80}
              />
              
              <StatCard
                icon={Clock}
                title=\"ウォッチユーザー\"
                value={stats.watchUsers}
                suffix=\"人\"
                percentage={stats.watchRatio * 100}
                color=\"bg-yellow-500\"
                target={15}
              />
              
              <StatCard
                icon={AlertTriangle}
                title=\"リスクユーザー\"
                value={stats.riskUsers}
                suffix=\"人\"
                percentage={stats.riskRatio * 100}
                color=\"bg-red-500\"
                target={5}
              />
            </div>

            {/* ティア分布チャート */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className=\"bg-white rounded-xl p-6 mb-8\"
            >
              <h3 className=\"text-lg font-semibold text-gray-900 mb-4\">📊 ユーザーティア分布</h3>
              
              <div className=\"space-y-4\">
                <TierBar
                  label=\"Active Tier\"
                  current={stats.activeUsers}
                  total={stats.totalUsers}
                  color=\"bg-green-500\"
                  target={800}
                />
                
                <TierBar
                  label=\"Watch Tier\"
                  current={stats.watchUsers}
                  total={stats.totalUsers}
                  color=\"bg-yellow-500\"
                  target={150}
                />
                
                <TierBar
                  label=\"Risk Tier\"
                  current={stats.riskUsers}
                  total={stats.totalUsers}
                  color=\"bg-red-500\"
                  target={50}
                />
              </div>
            </motion.div>

            {/* 最近のアクション */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className=\"bg-white rounded-xl p-6\"
            >
              <h3 className=\"text-lg font-semibold text-gray-900 mb-4\">📋 最近のローテーションアクション</h3>
              
              {recentActions.length === 0 ? (
                <p className=\"text-gray-500 text-center py-8\">最近のアクションはありません</p>
              ) : (
                <div className=\"space-y-3\">
                  {recentActions.map((action) => (
                    <div key={action.id} className=\"flex items-center space-x-4 p-3 bg-gray-50 rounded-lg\">
                      <div className={`p-2 rounded-full ${getActionColor(action.action_type)}`}>
                        {getActionIcon(action.action_type)}
                      </div>
                      
                      <div className=\"flex-1\">
                        <p className=\"text-sm font-medium text-gray-900\">
                          {action.from_tier && action.to_tier 
                            ? `${action.from_tier} → ${action.to_tier}`
                            : action.action_type
                          }
                        </p>
                        <p className=\"text-xs text-gray-600\">{action.reason}</p>
                      </div>
                      
                      <div className=\"text-xs text-gray-500\">
                        {new Date(action.created_at).toLocaleString('ja-JP')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
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
  percentage?: number;
  target?: number;
  limit?: number;
  isOverLimit?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ 
  icon: Icon, 
  title, 
  value, 
  suffix, 
  color, 
  percentage, 
  target, 
  limit, 
  isOverLimit 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className=\"bg-white rounded-xl p-6 shadow-sm\"
  >
    <div className=\"flex items-center justify-between mb-4\">
      <div className={`p-3 rounded-lg ${color} text-white`}>
        <Icon className=\"w-6 h-6\" />
      </div>
      
      {isOverLimit && (
        <div className=\"px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full\">
          上限超過
        </div>
      )}
    </div>
    
    <div>
      <div className=\"text-2xl font-bold text-gray-900 mb-1\">
        {value.toLocaleString()}<span className=\"text-sm font-normal text-gray-500 ml-1\">{suffix}</span>
      </div>
      
      <div className=\"text-sm text-gray-600\">{title}</div>
      
      {percentage !== undefined && target && (
        <div className=\"mt-2\">
          <div className=\"flex justify-between text-xs text-gray-500 mb-1\">
            <span>{percentage.toFixed(1)}%</span>
            <span>目標: {target}%</span>
          </div>
          <div className=\"w-full bg-gray-200 rounded-full h-2\">
            <div 
              className={`h-2 rounded-full ${color}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {limit && (
        <div className=\"mt-2 text-xs text-gray-500\">
          上限: {limit.toLocaleString()}{suffix}
        </div>
      )}
    </div>
  </motion.div>
);

// ティア分布バーコンポーネント
interface TierBarProps {
  label: string;
  current: number;
  total: number;
  color: string;
  target: number;
}

const TierBar: React.FC<TierBarProps> = ({ label, current, total, color, target }) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  const targetPercentage = total > 0 ? (target / total) * 100 : 0;
  
  return (
    <div>
      <div className=\"flex justify-between text-sm text-gray-600 mb-2\">
        <span>{label}</span>
        <span>{current} / {target} (目標)</span>
      </div>
      
      <div className=\"relative w-full bg-gray-200 rounded-full h-4\">
        <div 
          className={`h-4 rounded-full ${color} transition-all duration-300`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
        
        {/* 目標ライン */}
        <div 
          className=\"absolute top-0 w-0.5 h-4 bg-gray-800\"
          style={{ left: `${Math.min(targetPercentage, 100)}%` }}
        ></div>
      </div>
      
      <div className=\"flex justify-between text-xs text-gray-500 mt-1\">
        <span>{percentage.toFixed(1)}%</span>
        <span className={percentage >= targetPercentage * 0.9 ? 'text-green-600' : 'text-red-600'}>
          {percentage >= targetPercentage * 0.9 ? '✅' : '⚠️'} 
          目標: {targetPercentage.toFixed(1)}%
        </span>
      </div>
    </div>
  );
};

export default CommunityHealthDashboard;