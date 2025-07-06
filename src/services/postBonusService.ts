import { supabase } from '../supabase';

export interface PostBonus {
  id: string;
  post_id: string;
  user_id: string;
  base_bonus: number;
  quality_bonus: number;
  engagement_bonus: number;
  streak_bonus: number;
  milestone_bonus: number;
  total_bonus: number;
  photo_score?: number;
  post_count_at_time: number;
  streak_days: number;
  created_at: string;
  updated_at: string;
}

export interface UserPostStats {
  id: string;
  user_id: string;
  total_posts: number;
  posts_this_week: number;
  posts_this_month: number;
  current_streak_days: number;
  longest_streak_days: number;
  last_post_date?: string;
  average_photo_score: number;
  highest_photo_score: number;
  total_likes_received: number;
  total_comments_received: number;
  total_bookmarks_received: number;
  created_at: string;
  updated_at: string;
}

export class PostBonusService {
  /**
   * 投稿ボーナスを計算・付与する
   */
  static async calculateAndAwardPostBonus(
    postId: string,
    userId: string,
    photoScore?: number
  ): Promise<number> {
    try {
      console.log('🎯 投稿ボーナスを計算中...', { postId, userId, photoScore });

      // まずRPC関数を呼び出し
      const { data, error } = await supabase.rpc('calculate_post_bonus', {
        p_post_id: postId,
        p_user_id: userId,
        p_photo_score: photoScore || 0
      });

      if (error) {
        console.error('❌ 投稿ボーナス計算エラー:', error);
        throw error;
      }

      const totalBonus = data || 0;
      console.log('✅ 投稿ボーナス計算完了:', totalBonus);

      // リアルタイム更新を確実にトリガーするため、追加でポイント履歴を挿入
      if (totalBonus > 0) {
        console.log('🔔 リアルタイム更新用のポイント履歴を挿入中...');
        const { error: historyError } = await supabase
          .from('point_history')
          .insert({
            user_id: userId,
            point_type: 'learning',
            points: totalBonus,
            source_type: 'post_creation',
            source_id: postId,
            description: `投稿ボーナス: ${totalBonus}ポイント`
          });

        if (historyError) {
          console.warn('⚠️ リアルタイム更新用履歴挿入エラー:', historyError);
        } else {
          console.log('✅ リアルタイム更新用履歴挿入完了');
        }
      }

      return totalBonus;
    } catch (error) {
      console.error('❌ PostBonusService.calculateAndAwardPostBonus エラー:', error);
      throw error;
    }
  }

  /**
   * エンゲージメントボーナスを更新
   */
  static async updateEngagementBonus(
    postId: string,
    engagementType: 'like' | 'comment' | 'bookmark',
    increment: number = 1
  ): Promise<void> {
    try {
      console.log('💫 エンゲージメントボーナス更新中...', { postId, engagementType, increment });

      const { error } = await supabase.rpc('update_engagement_bonus', {
        p_post_id: postId,
        p_engagement_type: engagementType,
        p_increment: increment
      });

      if (error) {
        console.error('❌ エンゲージメントボーナス更新エラー:', error);
        throw error;
      }

      console.log('✅ エンゲージメントボーナス更新完了');
    } catch (error) {
      console.error('❌ PostBonusService.updateEngagementBonus エラー:', error);
      throw error;
    }
  }

  /**
   * ユーザーの投稿ボーナス履歴を取得
   */
  static async getUserPostBonuses(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<PostBonus[]> {
    try {
      const { data, error } = await supabase
        .from('post_bonuses')
        .select(`
          *,
          posts:post_id (
            title,
            image_url,
            created_at
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ 投稿ボーナス履歴取得エラー:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ PostBonusService.getUserPostBonuses エラー:', error);
      throw error;
    }
  }

  /**
   * ユーザーの投稿統計を取得
   */
  static async getUserPostStats(userId: string): Promise<UserPostStats | null> {
    try {
      const { data, error } = await supabase
        .from('user_post_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
        console.error('❌ 投稿統計取得エラー:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ PostBonusService.getUserPostStats エラー:', error);
      throw error;
    }
  }

  /**
   * 投稿のボーナス詳細を取得
   */
  static async getPostBonusDetails(postId: string): Promise<PostBonus | null> {
    try {
      const { data, error } = await supabase
        .from('post_bonuses')
        .select('*')
        .eq('post_id', postId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ 投稿ボーナス詳細取得エラー:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ PostBonusService.getPostBonusDetails エラー:', error);
      throw error;
    }
  }

  /**
   * 今月の投稿ボーナス合計を取得
   */
  static async getMonthlyBonusTotal(userId: string): Promise<{
    totalBonus: number;
    baseBonus: number;
    qualityBonus: number;
    engagementBonus: number;
    streakBonus: number;
    milestoneBonus: number;
  }> {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('post_bonuses')
        .select('base_bonus, quality_bonus, engagement_bonus, streak_bonus, milestone_bonus, total_bonus')
        .eq('user_id', userId)
        .gte('created_at', startOfMonth.toISOString());

      if (error) {
        console.error('❌ 月間ボーナス合計取得エラー:', error);
        throw error;
      }

      const totals = (data || []).reduce(
        (acc, bonus) => ({
          totalBonus: acc.totalBonus + bonus.total_bonus,
          baseBonus: acc.baseBonus + bonus.base_bonus,
          qualityBonus: acc.qualityBonus + bonus.quality_bonus,
          engagementBonus: acc.engagementBonus + bonus.engagement_bonus,
          streakBonus: acc.streakBonus + bonus.streak_bonus,
          milestoneBonus: acc.milestoneBonus + bonus.milestone_bonus,
        }),
        {
          totalBonus: 0,
          baseBonus: 0,
          qualityBonus: 0,
          engagementBonus: 0,
          streakBonus: 0,
          milestoneBonus: 0,
        }
      );

      return totals;
    } catch (error) {
      console.error('❌ PostBonusService.getMonthlyBonusTotal エラー:', error);
      throw error;
    }
  }

  /**
   * 連続投稿ストリーク情報を取得
   */
  static async getStreakInfo(userId: string): Promise<{
    currentStreak: number;
    longestStreak: number;
    lastPostDate?: string;
    nextStreakBonus: number;
  }> {
    try {
      const stats = await this.getUserPostStats(userId);
      
      if (!stats) {
        return {
          currentStreak: 0,
          longestStreak: 0,
          nextStreakBonus: 10, // 3日連続で最初のボーナス
        };
      }

      // 次のストリークボーナスまでの日数を計算
      const getNextStreakBonus = (currentStreak: number): number => {
        if (currentStreak < 3) return 10;
        if (currentStreak < 7) return 15;
        if (currentStreak < 14) return 25;
        if (currentStreak < 30) return 50;
        return 50; // 30日以上は最大ボーナス
      };

      return {
        currentStreak: stats.current_streak_days,
        longestStreak: stats.longest_streak_days,
        lastPostDate: stats.last_post_date,
        nextStreakBonus: getNextStreakBonus(stats.current_streak_days),
      };
    } catch (error) {
      console.error('❌ PostBonusService.getStreakInfo エラー:', error);
      throw error;
    }
  }

  /**
   * 品質ボーナス基準を取得
   */
  static getQualityBonusInfo(): Array<{
    minScore: number;
    maxScore: number;
    bonus: number;
    label: string;
  }> {
    return [
      { minScore: 90, maxScore: 100, bonus: 30, label: '完璧な一枚' },
      { minScore: 80, maxScore: 89, bonus: 20, label: '素晴らしい写真' },
      { minScore: 70, maxScore: 79, bonus: 10, label: '良い写真' },
      { minScore: 60, maxScore: 69, bonus: 5, label: '成長中' },
      { minScore: 0, maxScore: 59, bonus: 0, label: '基本' },
    ];
  }

  /**
   * マイルストーンボーナス情報を取得
   */
  static getMilestoneInfo(): Array<{
    postCount: number;
    bonus: number;
    label: string;
  }> {
    return [
      { postCount: 1, bonus: 20, label: '初投稿記念！' },
      { postCount: 10, bonus: 25, label: '10投稿達成！' },
      { postCount: 50, bonus: 50, label: '50投稿達成！' },
      { postCount: 100, bonus: 100, label: '100投稿達成！' },
      { postCount: 500, bonus: 200, label: '500投稿達成！' },
    ];
  }
}