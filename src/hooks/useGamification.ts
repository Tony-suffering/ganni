import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import { UserPoints, UserBadge, Badge, UserInspirationStats, LevelInfo, RankingUser } from '../types';

export const useGamification = () => {
  const { user } = useAuth();
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [availableBadges, setAvailableBadges] = useState<Badge[]>([]);
  const [userStats, setUserStats] = useState<UserInspirationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    if (!user) {
      console.log('🔍 useGamification: ユーザーが未ログイン');
      return;
    }

    console.log('🔍 useGamification: ポイント取得開始 - ユーザーID:', user.id);

    try {
      const { data, error } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', user.id)
        .single();

      console.log('🔍 useGamification: ポイント取得結果', { data, error });

      if (error && error.code !== 'PGRST116') {
        console.error('❌ ポイント取得エラー:', error);
        setError(`ポイント取得エラー: ${error.message}`);
        return;
      }

      if (data) {
        console.log('✅ ポイントデータ取得成功:', data);
        setUserPoints(data);
      } else {
        console.log('📝 ポイントデータが存在しないため初期化します');
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

        console.log('🔍 ポイント初期化結果:', { newPoints, insertError });

        if (!insertError && newPoints) {
          console.log('✅ ポイント初期化成功:', newPoints);
          setUserPoints(newPoints);
        } else {
          console.error('❌ ポイント初期化エラー:', insertError);
          setError(`ポイント初期化エラー: ${insertError?.message}`);
        }
      }
    } catch (error) {
      console.error('❌ ポイント取得エラー:', error);
      setError('ポイント情報の取得に失敗しました');
    }
  }, [user]);

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
        console.error('バッジ取得エラー:', error);
        return;
      }

      setUserBadges(data || []);
    } catch (error) {
      console.error('バッジ取得エラー:', error);
      setError('バッジ情報の取得に失敗しました');
    }
  }, [user]);

  // 利用可能なバッジ取得
  const fetchAvailableBadges = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .eq('is_active', true)
        .order('requirement_value');

      if (error) {
        console.error('バッジ一覧取得エラー:', error);
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

      if (error && error.code !== 'PGRST116') {
        console.error('統計取得エラー:', error);
        return;
      }

      if (data) {
        setUserStats(data);
      }
    } catch (error) {
      console.error('統計取得エラー:', error);
    }
  }, [user]);

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
  }, [user, fetchUserBadges]);

  // 初期データ読み込み
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        await Promise.all([
          fetchUserPoints(),
          fetchUserBadges(),
          fetchAvailableBadges(),
          fetchUserStats()
        ]);
      } catch (error) {
        console.error('データ読み込みエラー:', error);
        setError('データの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, fetchUserPoints, fetchUserBadges, fetchAvailableBadges, fetchUserStats]);

  // レベル情報を計算
  const levelInfo = userPoints ? calculateLevelInfo(userPoints.total_points) : null;

  // 表示用バッジを取得
  const displayBadges = userBadges.filter(ub => ub.is_displayed && ub.badge).map(ub => ub.badge!);

  return {
    userPoints,
    userBadges,
    availableBadges,
    userStats,
    levelInfo,
    displayBadges,
    loading,
    error,
    fetchUserPoints,
    fetchUserBadges,
    fetchUserStats,
    fetchRanking,
    toggleBadgeDisplay,
    calculateLevelInfo
  };
};

export default useGamification;