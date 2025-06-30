import { supabase } from '../lib/supabase';

// アクティビティスコア計算の重み配分
const SCORING_WEIGHTS = {
  dailyPost: {
    maxScore: 10,
    optimalPosts: 2.5, // 理想的な投稿数 (2-3回/日の中央値)
  },
  engagement: {
    maxScore: 10,
    likeWeight: 0.3,
    commentWeight: 0.7, // コメントを重視
  },
  communityContribution: {
    maxScore: 10,
    givingLikesWeight: 0.4,
    makingCommentsWeight: 0.6,
  },
  loginConsistency: {
    maxScore: 10,
    targetDays: 7, // 週7日ログインが理想
  }
};

export interface UserActivityData {
  userId: string;
  dailyPosts: number;
  likesReceived: number;
  commentsReceived: number;
  likesGiven: number;
  commentsMade: number;
  loginDays: number;
  profileViews: number;
  activeMinutes: number;
}

export interface ActivityScore {
  dailyPostScore: number;
  engagementScore: number;
  communityContributionScore: number;
  loginConsistencyScore: number;
  overallHealthScore: number;
}

export interface UserTier {
  tier: 'active' | 'watch' | 'risk';
  description: string;
  color: string;
  requirements: string[];
}

export class ActivityScoringService {
  
  /**
   * 包括的アクティビティスコアを計算
   */
  calculateActivityScore(data: UserActivityData): ActivityScore {
    const dailyPostScore = this.calculateDailyPostScore(data.dailyPosts);
    const engagementScore = this.calculateEngagementScore(
      data.likesReceived, 
      data.commentsReceived,
      data.profileViews
    );
    const communityContributionScore = this.calculateCommunityContributionScore(
      data.likesGiven, 
      data.commentsMade
    );
    const loginConsistencyScore = this.calculateLoginConsistencyScore(data.loginDays);
    
    const overallHealthScore = dailyPostScore + engagementScore + 
                              communityContributionScore + loginConsistencyScore;

    return {
      dailyPostScore,
      engagementScore,
      communityContributionScore,
      loginConsistencyScore,
      overallHealthScore
    };
  }

  /**
   * 日次投稿スコア計算 (0-10)
   * 理想的な投稿数（2-3回/日）を基準に計算
   */
  private calculateDailyPostScore(dailyPosts: number): number {
    const { maxScore, optimalPosts } = SCORING_WEIGHTS.dailyPost;
    
    if (dailyPosts === 0) return 0;
    
    // 理想値に近いほど高スコア、多すぎても減点
    if (dailyPosts <= optimalPosts) {
      return (dailyPosts / optimalPosts) * maxScore;
    } else {
      // 理想値を超えた場合の減点計算
      const excess = dailyPosts - optimalPosts;
      const penalty = Math.min(excess * 1.5, maxScore * 0.3); // 最大30%減点
      return Math.max(maxScore - penalty, maxScore * 0.5); // 最低50%は保証
    }
  }

  /**
   * エンゲージメントスコア計算 (0-10)
   */
  private calculateEngagementScore(
    likesReceived: number, 
    commentsReceived: number,
    profileViews: number
  ): number {
    const { maxScore, likeWeight, commentWeight } = SCORING_WEIGHTS.engagement;
    
    // 正規化 (週間平均値を基準)
    const normalizedLikes = Math.min(likesReceived / 10, 1); // 週10いいねで満点
    const normalizedComments = Math.min(commentsReceived / 5, 1); // 週5コメントで満点
    const normalizedViews = Math.min(profileViews / 20, 1); // 週20ビューで満点
    
    const likeScore = normalizedLikes * likeWeight * maxScore;
    const commentScore = normalizedComments * commentWeight * maxScore;
    const viewBonus = normalizedViews * 0.2 * maxScore; // ボーナス要素
    
    return Math.min(likeScore + commentScore + viewBonus, maxScore);
  }

  /**
   * コミュニティ貢献スコア計算 (0-10)
   */
  private calculateCommunityContributionScore(
    likesGiven: number, 
    commentsMade: number
  ): number {
    const { maxScore, givingLikesWeight, makingCommentsWeight } = SCORING_WEIGHTS.communityContribution;
    
    // 他ユーザーへの貢献を評価
    const normalizedGivingLikes = Math.min(likesGiven / 15, 1); // 週15いいねで満点
    const normalizedMakingComments = Math.min(commentsMade / 8, 1); // 週8コメントで満点
    
    const givingScore = normalizedGivingLikes * givingLikesWeight * maxScore;
    const commentingScore = normalizedMakingComments * makingCommentsWeight * maxScore;
    
    return givingScore + commentingScore;
  }

  /**
   * ログイン一貫性スコア計算 (0-10)
   */
  private calculateLoginConsistencyScore(loginDays: number): number {
    const { maxScore, targetDays } = SCORING_WEIGHTS.loginConsistency;
    
    // 週のうち何日ログインしたかで評価
    const consistencyRatio = Math.min(loginDays / targetDays, 1);
    
    // ボーナス: 毎日ログインの場合
    const bonus = loginDays === targetDays ? 0.1 : 0;
    
    return (consistencyRatio + bonus) * maxScore;
  }

  /**
   * スコアに基づくティア決定
   */
  determineUserTier(score: ActivityScore): UserTier {
    const { overallHealthScore } = score;
    
    if (overallHealthScore >= 30) {
      return {
        tier: 'active',
        description: 'アクティブユーザー',
        color: 'text-green-600',
        requirements: ['週5日以上投稿', '高エンゲージメント', 'コミュニティ貢献活発']
      };
    } else if (overallHealthScore >= 20) {
      return {
        tier: 'watch',
        description: 'ウォッチユーザー',
        color: 'text-yellow-600',
        requirements: ['週2-4日投稿', '中程度エンゲージメント', '改善支援対象']
      };
    } else {
      return {
        tier: 'risk',
        description: 'リスクユーザー',
        color: 'text-red-600',
        requirements: ['週1日以下投稿', '低エンゲージメント', '入れ替え候補']
      };
    }
  }

  /**
   * ユーザーアクティビティデータを取得
   */
  async getUserActivityData(userId: string, days: number = 7): Promise<UserActivityData | null> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      // 日次アクティビティログから集計
      const { data: dailyLogs, error: logsError } = await supabase
        .from('daily_activity_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('activity_date', startDate.toISOString().split('T')[0])
        .lte('activity_date', endDate.toISOString().split('T')[0]);

      if (logsError) throw logsError;

      if (!dailyLogs || dailyLogs.length === 0) {
        return null;
      }

      // データを集計
      const aggregatedData = dailyLogs.reduce((acc, log) => ({
        userId,
        dailyPosts: acc.dailyPosts + (log.posts_count || 0),
        likesReceived: acc.likesReceived + (log.likes_received || 0),
        commentsReceived: acc.commentsReceived + (log.comments_received || 0),
        likesGiven: acc.likesGiven + (log.likes_given || 0),
        commentsMade: acc.commentsMade + (log.comments_made || 0),
        loginDays: acc.loginDays + (log.login_count > 0 ? 1 : 0),
        profileViews: acc.profileViews + (log.profile_views || 0),
        activeMinutes: acc.activeMinutes + (log.active_minutes || 0),
      }), {
        userId,
        dailyPosts: 0,
        likesReceived: 0,
        commentsReceived: 0,
        likesGiven: 0,
        commentsMade: 0,
        loginDays: 0,
        profileViews: 0,
        activeMinutes: 0,
      });

      // 日平均に変換
      const avgData: UserActivityData = {
        ...aggregatedData,
        dailyPosts: aggregatedData.dailyPosts / days,
      };

      return avgData;

    } catch (error) {
      console.error('Failed to get user activity data:', error);
      return null;
    }
  }

  /**
   * アクティビティスコアを更新
   */
  async updateUserActivityScore(userId: string): Promise<boolean> {
    try {
      // アクティビティデータを取得
      const activityData = await this.getUserActivityData(userId);
      if (!activityData) return false;

      // スコアを計算
      const scores = this.calculateActivityScore(activityData);
      const tierInfo = this.determineUserTier(scores);

      // データベースを更新
      const { error } = await supabase
        .from('user_activity_stats')
        .upsert({
          user_id: userId,
          daily_post_score: scores.dailyPostScore,
          engagement_score: scores.engagementScore,
          community_contribution_score: scores.communityContributionScore,
          login_consistency_score: scores.loginConsistencyScore,
          overall_health_score: scores.overallHealthScore,
          tier: tierInfo.tier,
          tier_updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      console.log(`✅ Updated activity score for user ${userId}:`, {
        scores,
        tier: tierInfo.tier
      });

      return true;

    } catch (error) {
      console.error('Failed to update user activity score:', error);
      return false;
    }
  }

  /**
   * 全ユーザーのアクティビティスコアを一括更新
   */
  async updateAllUserScores(): Promise<void> {
    try {
      // アクティブなユーザー一覧を取得
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('status', 'active');

      if (error) throw error;

      console.log(`🔄 Updating activity scores for ${users?.length || 0} users...`);

      // 並列処理で全ユーザーのスコアを更新
      const promises = users?.map(user => this.updateUserActivityScore(user.id)) || [];
      await Promise.all(promises);

      console.log('✅ All user activity scores updated successfully');

    } catch (error) {
      console.error('Failed to update all user scores:', error);
    }
  }

  /**
   * ティア別ユーザー数を取得
   */
  async getTierDistribution(): Promise<{active: number, watch: number, risk: number}> {
    try {
      const { data, error } = await supabase
        .from('user_activity_stats')
        .select('tier');

      if (error) throw error;

      const distribution = {
        active: 0,
        watch: 0,
        risk: 0
      };

      data?.forEach(user => {
        if (user.tier in distribution) {
          distribution[user.tier as keyof typeof distribution]++;
        }
      });

      return distribution;

    } catch (error) {
      console.error('Failed to get tier distribution:', error);
      return { active: 0, watch: 0, risk: 0 };
    }
  }
}

export const activityScoringService = new ActivityScoringService();