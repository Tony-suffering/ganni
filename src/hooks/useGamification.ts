import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import { UserPoints, UserBadge, Badge, UserInspirationStats, LevelInfo, RankingUser } from '../types';
import { UserPostService } from '../services/userPostService';

export const useGamification = () => {
  const { user } = useAuth();
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [previousPoints, setPreviousPoints] = useState<number | undefined>(undefined);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [availableBadges, setAvailableBadges] = useState<Badge[]>([]);
  const [userStats, setUserStats] = useState<UserInspirationStats | null>(null);
  const [photoStats, setPhotoStats] = useState<{
    averagePhotoScore: number;
    highestPhotoScore: number;
    totalPhotoScores: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentPointsGained, setRecentPointsGained] = useState<{
    points: number;
    type: 'learning' | 'influence';
    source: string;
    timestamp: Date;
  } | null>(null);
  const [isUpdatingPoints, setIsUpdatingPoints] = useState(false); // 重複更新防止フラグ

  // レベル計算関数
  const calculateLevelInfo = useCallback((totalPoints: number): LevelInfo => {
    const levelThresholds = [0, 100, 250, 500, 1000, 2000, 4000, 8000, 15000, 25000, 50000];
    const levelNames = [
      '初心者', '新人', '学習者', '愛好家', '熱心家', 
      '上級者', 'エキスパート', 'マスター', 'グランドマスター', '伝説'
    ];

    let level = 1;
    for (let i = levelThresholds.length - 1; i >= 0; i--) {
      if (totalPoints >= levelThresholds[i]) {
        level = i + 1;
        break;
      }
    }

    const currentLevelThreshold = levelThresholds[level - 1] || 0;
    const nextLevelThreshold = levelThresholds[level] || levelThresholds[levelThresholds.length - 1];
    const progressPoints = totalPoints - currentLevelThreshold;
    const requiredPoints = nextLevelThreshold - currentLevelThreshold;
    const progressPercentage = (progressPoints / requiredPoints) * 100;

    return {
      level,
      currentPoints: totalPoints,
      nextLevelPoints: nextLevelThreshold,
      progressPercentage: Math.min(progressPercentage, 100),
      levelName: levelNames[level - 1] || '伝説'
    };
  }, []);

  // ユーザーポイント取得
  const fetchUserPoints = useCallback(async () => {
    if (!user || isUpdatingPoints) {
      return;
    }

    setIsUpdatingPoints(true);

    try {
      // 現在のポイントを事前に保存
      const currentPoints = userPoints?.total_points;
      
      console.log('🎯 fetchUserPoints: 現在のポイント =', currentPoints);
      
      const { data, error } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // テーブルが存在しない場合やアクセス権限がない場合は無視
        if (error.code === 'PGRST116' || error.code === '42P01' || error.code === '406') {
          setIsUpdatingPoints(false);
          return;
        }
        
        setError(`ポイント取得エラー: ${error.message}`);
        setIsUpdatingPoints(false);
        return;
      }

      if (data) {
        console.log('🎯 fetchUserPoints: 新しいポイント =', data.total_points);
        
        // ポイントが増加した場合のみアニメーション用のpreviousPointsを設定
        if (currentPoints !== undefined && 
            currentPoints !== data.total_points && 
            currentPoints < data.total_points) {
          
          console.log('✨ ポイント増加を検知！アニメーション準備:', {
            previous: currentPoints,
            current: data.total_points,
            increase: data.total_points - currentPoints
          });
          
          // まずuserPointsを更新
          setUserPoints(data);
          
          // 短いディレイでpreviousPointsを設定
          setTimeout(() => {
            setPreviousPoints(currentPoints);
            console.log('🎬 previousPoints設定完了:', currentPoints);
            
            // 3秒後にpreviousPointsをクリアしてアニメーションを終了
            setTimeout(() => {
              setPreviousPoints(undefined);
              console.log('🎬 previousPointsクリア完了');
            }, 3000);
          }, 100);
        } else {
          // ポイントが変化していない場合は普通に更新
          setUserPoints(data);
        }
      } else {
        // ポイントデータが存在しない場合は初期化
        const { data: newPoints, error: insertError } = await supabase
          .from('user_points')
          .insert({
            user_id: user.id,
            learning_points: 0,
            influence_points: 0,
            total_points: 0,
            level: 1
          })
          .select()
          .single();

        if (!insertError && newPoints) {
          setUserPoints(newPoints);
        } else {
          setError(`ポイント初期化エラー: ${insertError?.message}`);
        }
      }
    } catch (error) {
      setError('ポイント情報の取得に失敗しました');
      console.error('❌ fetchUserPoints エラー:', error);
    } finally {
      setIsUpdatingPoints(false);
    }
  }, [user?.id, userPoints?.total_points, isUpdatingPoints]);

  // ユーザーバッジ取得
  const fetchUserBadges = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          *,
          badge:badges(*)
        `)
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (error) {
        console.warn('⚠️ バッジ取得エラー:', {
          code: error.code,
          message: error.message,
          details: error.details
        });
        
        // テーブルが存在しない場合やアクセス権限がない場合は無視
        if (error.code === 'PGRST116' || error.code === '42P01' || error.code === '406') {
          console.log('💡 user_badgesテーブルが利用できません。スキップします。');
          return;
        }
        
        console.error('❌ バッジ取得エラー:', error);
        return;
      }

      setUserBadges(data || []);
    } catch (error) {
      console.error('バッジ取得エラー:', error);
      setError('バッジ情報の取得に失敗しました');
    }
  }, [user?.id]);

  // 利用可能なバッジ取得
  const fetchAvailableBadges = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .eq('is_active', true)
        .order('requirement_value');

      if (error) {
        console.warn('⚠️ バッジ一覧取得エラー:', {
          code: error.code,
          message: error.message,
          details: error.details
        });
        
        // テーブルが存在しない場合やアクセス権限がない場合は無視
        if (error.code === 'PGRST116' || error.code === '42P01' || error.code === '406') {
          console.log('💡 badgesテーブルが利用できません。スキップします。');
          return;
        }
        
        console.error('❌ バッジ一覧取得エラー:', error);
        return;
      }

      setAvailableBadges(data || []);
    } catch (error) {
      console.error('バッジ一覧取得エラー:', error);
    }
  }, []);

  // ユーザー統計取得
  const fetchUserStats = useCallback(async () => {
    if (!user) return;

    try {
      
      const { data, error } = await supabase
        .from('user_inspiration_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.warn('⚠️ ユーザー統計取得エラー:', {
          code: error.code,
          message: error.message,
          details: error.details
        });
        
        // テーブルが存在しない場合やアクセス権限がない場合は無視
        if (error.code === 'PGRST116' || error.code === '42P01' || error.code === '406') {
          console.log('💡 user_inspiration_statsテーブルが利用できません。スキップします。');
          return;
        }
        
        setError('統計情報の取得に失敗しました');
        return;
      }

      if (data) {
        setUserStats(data);
      } else {
      }
    } catch (error) {
      console.error('❌ 統計取得エラー:', error);
      // エラーがあってもアプリケーションを停止させない
    }
  }, [user?.id]);

  // ランキング取得
  const fetchRanking = useCallback(async (type: 'learning' | 'influence' | 'total' = 'total', limit: number = 10): Promise<RankingUser[]> => {
    try {
      const orderColumn = type === 'learning' ? 'learning_points' : 
                         type === 'influence' ? 'influence_points' : 'total_points';

      const { data: pointsData, error } = await supabase
        .from('user_points')
        .select(`
          user_id,
          learning_points,
          influence_points,
          total_points,
          level
        `)
        .order(orderColumn, { ascending: false })
        .limit(limit);

      if (error) {
        console.error('ランキング取得エラー:', error);
        return [];
      }

      if (!pointsData || pointsData.length === 0) {
        return [];
      }

      // ユーザー情報を取得
      const userIds = pointsData.map(p => p.user_id);
      const { data: usersData } = await supabase
        .from('users')
        .select('id, name, avatar_url')
        .in('id', userIds);

      // プロフィールテーブルも試す
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', userIds);

      const userData = [...(usersData || []), ...(profilesData || [])];

      // バッジ情報を取得
      const { data: badgesData } = await supabase
        .from('user_badges')
        .select(`
          user_id,
          badge:badges(*)
        `)
        .in('user_id', userIds)
        .eq('is_displayed', true);

      const rankingUsers: RankingUser[] = pointsData.map((points, index) => {
        const userInfo = userData.find(u => u.id === points.user_id);
        const userBadges = badgesData?.filter(b => b.user_id === points.user_id).map(b => b.badge).filter(Boolean) || [];
        
        return {
          user_id: points.user_id,
          name: userInfo?.name || '匿名ユーザー',
          avatar: userInfo?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userInfo?.name || '匿名ユーザー')}&background=random`,
          points: type === 'learning' ? points.learning_points : 
                 type === 'influence' ? points.influence_points : points.total_points,
          level: points.level,
          rank: index + 1,
          badges: userBadges as Badge[]
        };
      });

      return rankingUsers;
    } catch (error) {
      console.error('ランキング取得エラー:', error);
      return [];
    }
  }, []);

  // 写真スコア統計取得
  const fetchPhotoStats = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      
      // まずテーブルの存在を確認
      const { data: testData, error: testError } = await supabase
        .from('posts')
        .select('id')
        .eq('author_id', user.id)
        .limit(1);
      
      if (testError) {
        console.warn('⚠️ posts テーブルにアクセスできません:', testError);
        setPhotoStats({
          averagePhotoScore: 0,
          highestPhotoScore: 0,
          totalPhotoScores: 0
        });
        return;
      }
      
      const userPostService = new UserPostService();
      const stats = await userPostService.getUserStats(user.id);
      
      setPhotoStats({
        averagePhotoScore: stats.averagePhotoScore,
        highestPhotoScore: stats.highestPhotoScore,
        totalPhotoScores: stats.totalPhotoScores
      });

    } catch (error) {
      console.error('❌ 写真スコア統計取得エラー:', error);
      // エラーがあってもアプリケーションを停止させない
      // デフォルト値を設定
      setPhotoStats({
        averagePhotoScore: 0,
        highestPhotoScore: 0,
        totalPhotoScores: 0
      });
    }
  }, [user?.id]);

  // バッジ表示切り替え
  const toggleBadgeDisplay = useCallback(async (badgeId: string, isDisplayed: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_badges')
        .update({ is_displayed: isDisplayed })
        .eq('user_id', user.id)
        .eq('badge_id', badgeId);

      if (error) {
        console.error('バッジ表示切り替えエラー:', error);
        return;
      }

      // バッジリストを更新
      await fetchUserBadges();
    } catch (error) {
      console.error('バッジ表示切り替えエラー:', error);
    }
  }, [user?.id, fetchUserBadges]);


  // 初期データ読み込み（遅延ロード）
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      // 基本的なポイントデータのみを同期的に読み込む
      setLoading(true);
      setError(null);
      
      try {
        
        // 最重要データのみを最初に読み込む
        await fetchUserPoints();
        setLoading(false);
        
        // 他のデータは非同期で順次読み込み
        setTimeout(() => {
          fetchUserBadges();
        }, 50);
        
        setTimeout(() => {
          fetchAvailableBadges();
        }, 100);
        
        setTimeout(() => {
          fetchUserStats();
        }, 150);
        
        setTimeout(() => {
          fetchPhotoStats();
        }, 200);
        
      } catch (error) {
        console.error('❌ データ読み込みエラー:', error);
        setError('データの読み込みに失敗しました');
        setLoading(false);
      }
    };

    // デバウンスして重複実行を防ぐ
    const timeoutId = setTimeout(loadData, 10);
    return () => clearTimeout(timeoutId);
  }, [user?.id]); // userオブジェクトではなくuser.idのみを依存関係に

  // リアルタイムポイント更新の処理（App.tsxから呼び出される）
  const handlePointsUpdate = useCallback((payload: any, addNotification?: any) => {
    console.log('🔥 リアルタイムポイント更新:', payload);
    
    if (payload.eventType === 'INSERT' && payload.new) {
      const newEntry = payload.new;
      
      // 通知システムに追加（addNotificationが渡された場合のみ）
      if (addNotification) {
        addNotification({
          points: newEntry.points,
          type: newEntry.point_type,
          source: newEntry.description || 'ポイント獲得',
          icon: newEntry.source_type === 'like_given' || newEntry.source_type === 'like_received' ? 'like' :
                newEntry.source_type === 'photo_quality' ? 'photo_quality' :
                newEntry.source_type === 'milestone' ? 'milestone' : 'default'
        });
      }

      // ポイントデータを再取得
      fetchUserPoints();
    }
  }, [fetchUserPoints]);

  // レベル情報を計算
  const levelInfo = userPoints ? calculateLevelInfo(userPoints.total_points) : null;

  // 表示用バッジを取得
  const displayBadges = userBadges.filter(ub => ub.is_displayed && ub.badge).map(ub => ub.badge!);

  return {
    userPoints,
    previousPoints,
    userBadges,
    availableBadges,
    userStats,
    photoStats,
    levelInfo,
    displayBadges,
    loading,
    error,
    recentPointsGained,
    fetchUserPoints,
    fetchUserBadges,
    fetchUserStats,
    fetchPhotoStats,
    fetchRanking,
    toggleBadgeDisplay,
    calculateLevelInfo,
    handlePointsUpdate
  };
};

export default useGamification;