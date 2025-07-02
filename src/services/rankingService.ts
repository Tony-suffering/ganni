import { supabase } from '../supabase';

export interface RankingEntry {
  rank_position: number;
  user_id: string;
  score: number;
  metadata?: any;
  user?: {
    email?: string;
    user_metadata?: {
      name?: string;
      avatar_url?: string;
    };
  };
}

export interface UserRankingInfo {
  ranking_type: string;
  period: string;
  rank_position: number;
  score: number;
  total_users: number;
  metadata?: any;
}

export interface RankingStats {
  totalPoints: UserRankingInfo | null;
  photoQuality: UserRankingInfo | null;
  postCount: UserRankingInfo | null;
  inspirationInfluence: UserRankingInfo | null;
}

export type RankingType = 'total_points' | 'photo_quality' | 'post_count' | 'inspiration_influence';
export type RankingPeriod = 'all_time' | 'monthly' | 'weekly' | 'daily';

export class RankingService {
  /**
   * ユーザーのランキング情報を取得
   */
  static async getUserRankingInfo(userId: string): Promise<RankingStats> {
    try {
      console.log('📊 ユーザーランキング情報を取得中...', userId);

      const { data, error } = await supabase.rpc('get_user_ranking_info', {
        p_user_id: userId
      });

      if (error) {
        console.error('❌ ユーザーランキング情報取得エラー:', error);
        throw error;
      }

      // データを整理してRankingStatsに変換
      const rankings = data || [];
      
      const stats: RankingStats = {
        totalPoints: rankings.find((r: any) => r.ranking_type === 'total_points' && r.period === 'all_time') || null,
        photoQuality: rankings.find((r: any) => r.ranking_type === 'photo_quality' && r.period === 'all_time') || null,
        postCount: rankings.find((r: any) => r.ranking_type === 'post_count' && r.period === 'all_time') || null,
        inspirationInfluence: rankings.find((r: any) => r.ranking_type === 'inspiration_influence' && r.period === 'all_time') || null,
      };

      console.log('✅ ユーザーランキング情報取得完了:', stats);
      return stats;
    } catch (error) {
      console.error('❌ RankingService.getUserRankingInfo エラー:', error);
      throw error;
    }
  }

  /**
   * トップランカーを取得
   */
  static async getTopRankers(
    rankingType: RankingType = 'total_points',
    period: RankingPeriod = 'all_time',
    limit: number = 10
  ): Promise<RankingEntry[]> {
    try {
      console.log('🏆 トップランカー取得中...', { rankingType, period, limit });

      const { data, error } = await supabase.rpc('get_top_rankers', {
        p_ranking_type: rankingType,
        p_period: period,
        p_limit: limit
      });

      if (error) {
        console.error('❌ トップランカー取得エラー:', error);
        throw error;
      }

      // ユーザー情報を追加で取得
      const rankingEntries = data || [];
      const userIds = rankingEntries.map((entry: any) => entry.user_id);

      if (userIds.length > 0) {
        const { data: userProfiles, error: profileError } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', userIds);

        if (!profileError && userProfiles) {
          // ユーザー情報をマージ
          return rankingEntries.map((entry: any) => {
            const profile = userProfiles.find(p => p.user_id === entry.user_id);
            return {
              ...entry,
              user: {
                user_metadata: {
                  name: profile?.display_name || 'ユーザー',
                  avatar_url: profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.display_name || 'User')}&background=0072f5&color=fff`
                }
              }
            };
          });
        }
      }

      console.log('✅ トップランカー取得完了:', rankingEntries.length);
      return rankingEntries;
    } catch (error) {
      console.error('❌ RankingService.getTopRankers エラー:', error);
      throw error;
    }
  }

  /**
   * 全ランキングを更新（管理者用）
   */
  static async updateAllRankings(): Promise<void> {
    try {
      console.log('🔄 全ランキング更新中...');

      const { error } = await supabase.rpc('update_all_rankings');

      if (error) {
        console.error('❌ ランキング更新エラー:', error);
        throw error;
      }

      console.log('✅ 全ランキング更新完了');
    } catch (error) {
      console.error('❌ RankingService.updateAllRankings エラー:', error);
      throw error;
    }
  }

  /**
   * 特定のランキングタイプを更新
   */
  static async updateSpecificRanking(
    rankingType: RankingType,
    period: RankingPeriod = 'all_time'
  ): Promise<void> {
    try {
      console.log('🔄 特定ランキング更新中...', { rankingType, period });

      let functionName: string;
      switch (rankingType) {
        case 'total_points':
          functionName = 'update_total_points_ranking';
          break;
        case 'photo_quality':
          functionName = 'update_photo_quality_ranking';
          break;
        case 'post_count':
          functionName = 'update_post_count_ranking';
          break;
        case 'inspiration_influence':
          functionName = 'update_inspiration_ranking';
          break;
        default:
          throw new Error(`Unsupported ranking type: ${rankingType}`);
      }

      const { error } = await supabase.rpc(functionName, {
        p_period: period
      });

      if (error) {
        console.error('❌ 特定ランキング更新エラー:', error);
        throw error;
      }

      console.log('✅ 特定ランキング更新完了');
    } catch (error) {
      console.error('❌ RankingService.updateSpecificRanking エラー:', error);
      throw error;
    }
  }

  /**
   * ユーザーの順位変動履歴を取得
   */
  static async getUserRankingHistory(
    userId: string,
    rankingType: RankingType = 'total_points',
    period: RankingPeriod = 'all_time',
    limit: number = 30
  ): Promise<Array<{
    rank_date: string;
    rank_position: number;
    score: number;
    rank_change: number;
  }>> {
    try {
      const { data, error } = await supabase
        .from('ranking_history')
        .select('rank_date, rank_position, score, rank_change')
        .eq('user_id', userId)
        .eq('ranking_type', rankingType)
        .eq('period', period)
        .order('rank_date', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ ランキング履歴取得エラー:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ RankingService.getUserRankingHistory エラー:', error);
      throw error;
    }
  }

  /**
   * ランキングの説明情報を取得
   */
  static getRankingInfo(): Record<RankingType, {
    name: string;
    description: string;
    calculation: string;
    icon: string;
  }> {
    return {
      total_points: {
        name: '総合ランキング',
        description: '学習ポイントと影響力ポイントの合計',
        calculation: '学習ポイント + 影響力ポイント + ボーナスポイント',
        icon: '🏆'
      },
      photo_quality: {
        name: '写真品質ランキング',
        description: '写真の平均AIスコアと投稿数の重み付け評価',
        calculation: '平均写真スコア × log(投稿数 + 1)',
        icon: '📸'
      },
      post_count: {
        name: '投稿数ランキング',
        description: '期間内の投稿数によるランキング',
        calculation: '期間内の投稿数',
        icon: '📊'
      },
      inspiration_influence: {
        name: 'インスピレーション影響力',
        description: 'インスピレーション活動の総合評価',
        calculation: '与えたインスピレーション×2 + 受けたインスピレーション + チェーンレベル×5',
        icon: '💡'
      }
    };
  }

  /**
   * 期間情報を取得
   */
  static getPeriodInfo(): Record<RankingPeriod, {
    name: string;
    description: string;
  }> {
    return {
      all_time: {
        name: '全期間',
        description: '開始から現在まで'
      },
      monthly: {
        name: '今月',
        description: '今月1日から現在まで'
      },
      weekly: {
        name: '今週',
        description: '過去7日間'
      },
      daily: {
        name: '今日',
        description: '本日のみ'
      }
    };
  }

  /**
   * ランキング統計情報を取得
   */
  static async getRankingStatistics(): Promise<{
    totalUsers: number;
    totalPointsLeader: number;
    photoQualityLeader: number;
    mostActiveUser: string;
    lastUpdated: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('ranking_cache')
        .select('ranking_type, score, calculated_at')
        .order('score', { ascending: false });

      if (error) {
        console.error('❌ ランキング統計取得エラー:', error);
        throw error;
      }

      const totalUsers = new Set(data?.map((r: any) => r.user_id)).size;
      const totalPointsLeader = data?.find((r: any) => r.ranking_type === 'total_points')?.score || 0;
      const photoQualityLeader = data?.find((r: any) => r.ranking_type === 'photo_quality')?.score || 0;
      const lastUpdated = data?.[0]?.calculated_at || new Date().toISOString();

      return {
        totalUsers,
        totalPointsLeader,
        photoQualityLeader,
        mostActiveUser: 'データ取得中...',
        lastUpdated
      };
    } catch (error) {
      console.error('❌ RankingService.getRankingStatistics エラー:', error);
      throw error;
    }
  }

  /**
   * ユーザーの周辺順位を取得（自分の前後のユーザー）
   */
  static async getNearbyRankers(
    userId: string,
    rankingType: RankingType = 'total_points',
    period: RankingPeriod = 'all_time',
    range: number = 5
  ): Promise<RankingEntry[]> {
    try {
      // まずユーザーの順位を取得
      const userRanking = await this.getUserRankingInfo(userId);
      const userRank = userRanking.totalPoints?.rank_position;

      if (!userRank) {
        return [];
      }

      // 前後のランキングを取得
      const startRank = Math.max(1, userRank - range);
      const endRank = userRank + range;

      const { data, error } = await supabase
        .from('ranking_cache')
        .select('rank_position, user_id, score, metadata')
        .eq('ranking_type', rankingType)
        .eq('period', period)
        .gte('rank_position', startRank)
        .lte('rank_position', endRank)
        .order('rank_position');

      if (error) {
        console.error('❌ 周辺ランキング取得エラー:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ RankingService.getNearbyRankers エラー:', error);
      throw error;
    }
  }
}