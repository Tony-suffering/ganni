import { supabase } from '../lib/supabase';
import { activityScoringService } from './activityScoringService';

export interface RotationConfig {
  maxActiveUsers: number;
  targetActiveRatio: number;
  targetWatchRatio: number;
  targetRiskRatio: number;
  riskTierGracePeriodDays: number;
  warningPeriodDays: number;
}

export interface UserRotationStatus {
  userId: string;
  currentTier: 'active' | 'watch' | 'risk';
  healthScore: number;
  daysInCurrentTier: number;
  actionRequired: 'none' | 'send_warning' | 'move_to_waitlist' | 'monitor';
  nextEvaluationDate: Date;
}

export class UserRotationService {
  private config: RotationConfig = {
    maxActiveUsers: 1000,
    targetActiveRatio: 0.80, // 800人
    targetWatchRatio: 0.15,  // 150人
    targetRiskRatio: 0.05,   // 50人
    riskTierGracePeriodDays: 28, // 4週間
    warningPeriodDays: 14,   // 2週間で警告
  };

  /**
   * メイン入れ替えアルゴリズム実行
   */
  async executeRotationAlgorithm(): Promise<void> {
    console.log('🔄 Starting User Rotation Algorithm...');
    
    try {
      // 1. 全ユーザーのアクティビティスコアを更新
      await activityScoringService.updateAllUserScores();
      
      // 2. 現在のコミュニティ状態を評価
      const communityStatus = await this.evaluateCommunityStatus();
      console.log('📊 Community Status:', communityStatus);
      
      // 3. ユーザーローテーション状態を評価
      const rotationStatuses = await this.evaluateAllUsers();
      
      // 4. 必要なアクションを実行
      await this.executeRotationActions(rotationStatuses);
      
      // 5. コミュニティ管理データを更新
      await this.updateCommunityManagement(communityStatus);
      
      console.log('✅ User Rotation Algorithm completed successfully');
      
    } catch (error) {
      console.error('❌ Failed to execute rotation algorithm:', error);
    }
  }

  /**
   * コミュニティ全体の状態を評価
   */
  private async evaluateCommunityStatus() {
    const distribution = await activityScoringService.getTierDistribution();
    const totalUsers = distribution.active + distribution.watch + distribution.risk;
    
    return {
      totalUsers,
      activeUsers: distribution.active,
      watchUsers: distribution.watch,
      riskUsers: distribution.risk,
      activeRatio: totalUsers > 0 ? distribution.active / totalUsers : 0,
      watchRatio: totalUsers > 0 ? distribution.watch / totalUsers : 0,
      riskRatio: totalUsers > 0 ? distribution.risk / totalUsers : 0,
      isOverCapacity: totalUsers > this.config.maxActiveUsers,
      needsRebalancing: this.needsRebalancing(distribution, totalUsers)
    };
  }

  /**
   * リバランスが必要かどうか判定
   */
  private needsRebalancing(distribution: any, totalUsers: number): boolean {
    if (totalUsers === 0) return false;
    
    const currentRatios = {
      active: distribution.active / totalUsers,
      watch: distribution.watch / totalUsers,
      risk: distribution.risk / totalUsers
    };
    
    const { targetActiveRatio, targetWatchRatio, targetRiskRatio } = this.config;
    
    // 許容範囲を5%に設定
    const tolerance = 0.05;
    
    return (
      Math.abs(currentRatios.active - targetActiveRatio) > tolerance ||
      Math.abs(currentRatios.watch - targetWatchRatio) > tolerance ||
      Math.abs(currentRatios.risk - targetRiskRatio) > tolerance
    );
  }

  /**
   * 全ユーザーのローテーション状態を評価
   */
  private async evaluateAllUsers(): Promise<UserRotationStatus[]> {
    try {
      const { data: users, error } = await supabase
        .from('user_activity_stats')
        .select(`
          user_id,
          tier,
          overall_health_score,
          tier_updated_at,
          warning_sent_at,
          risk_tier_start_date
        `);

      if (error) throw error;

      const statuses: UserRotationStatus[] = [];

      for (const user of users || []) {
        const status = await this.evaluateUserStatus(user);
        statuses.push(status);
      }

      return statuses;

    } catch (error) {
      console.error('Failed to evaluate all users:', error);
      return [];
    }
  }

  /**
   * 個別ユーザーの状態を評価
   */
  private async evaluateUserStatus(userData: any): Promise<UserRotationStatus> {
    const tierUpdatedDate = new Date(userData.tier_updated_at);
    const today = new Date();
    const daysInCurrentTier = Math.floor(
      (today.getTime() - tierUpdatedDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    let actionRequired: UserRotationStatus['actionRequired'] = 'none';
    let nextEvaluationDate = new Date(today);
    nextEvaluationDate.setDate(today.getDate() + 7); // デフォルト1週間後

    // リスクティアの場合の特別処理
    if (userData.tier === 'risk') {
      const riskStartDate = userData.risk_tier_start_date ? 
        new Date(userData.risk_tier_start_date) : tierUpdatedDate;
      const daysInRisk = Math.floor(
        (today.getTime() - riskStartDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysInRisk >= this.config.riskTierGracePeriodDays) {
        actionRequired = 'move_to_waitlist';
      } else if (daysInRisk >= this.config.warningPeriodDays && !userData.warning_sent_at) {
        actionRequired = 'send_warning';
      } else {
        actionRequired = 'monitor';
        // 警告日またはリスク期限まで
        const warningDate = new Date(riskStartDate);
        warningDate.setDate(riskStartDate.getDate() + this.config.warningPeriodDays);
        const deadlineDate = new Date(riskStartDate);
        deadlineDate.setDate(riskStartDate.getDate() + this.config.riskTierGracePeriodDays);
        
        nextEvaluationDate = userData.warning_sent_at ? deadlineDate : warningDate;
      }
    }

    return {
      userId: userData.user_id,
      currentTier: userData.tier,
      healthScore: userData.overall_health_score,
      daysInCurrentTier,
      actionRequired,
      nextEvaluationDate
    };
  }

  /**
   * ローテーションアクションを実行
   */
  private async executeRotationActions(statuses: UserRotationStatus[]): Promise<void> {
    const actions = {
      warnings: statuses.filter(s => s.actionRequired === 'send_warning'),
      waitlistMoves: statuses.filter(s => s.actionRequired === 'move_to_waitlist'),
      monitoring: statuses.filter(s => s.actionRequired === 'monitor')
    };

    console.log(`📋 Rotation Actions:`, {
      warnings: actions.warnings.length,
      waitlistMoves: actions.waitlistMoves.length,
      monitoring: actions.monitoring.length
    });

    // 警告送信
    for (const user of actions.warnings) {
      await this.sendActivityWarning(user.userId);
    }

    // 待機リスト移動
    for (const user of actions.waitlistMoves) {
      await this.moveUserToWaitlist(user.userId, user.healthScore);
    }

    // 新規ユーザー招待 (待機リストから)
    if (actions.waitlistMoves.length > 0) {
      await this.inviteUsersFromWaitlist(actions.waitlistMoves.length);
    }
  }

  /**
   * ユーザーに活動警告を送信
   */
  private async sendActivityWarning(userId: string): Promise<void> {
    try {
      // 警告送信フラグを更新
      const { error: updateError } = await supabase
        .from('user_activity_stats')
        .update({ warning_sent_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // ローテーションログに記録
      await this.logRotationAction(userId, 'warning_sent', null, null, 
        'Low activity warning sent to user');

      // TODO: 実際の通知送信 (メール、アプリ内通知など)
      console.log(`⚠️ Warning sent to user ${userId}`);

    } catch (error) {
      console.error(`Failed to send warning to user ${userId}:`, error);
    }
  }

  /**
   * ユーザーを待機リストに移動
   */
  private async moveUserToWaitlist(userId: string, finalScore: number): Promise<void> {
    try {
      // トランザクション開始
      const { data: userData, error: fetchError } = await supabase
        .from('user_activity_stats')
        .select('tier')
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;

      // 待機リストに追加
      const reapplyDate = new Date();
      reapplyDate.setDate(reapplyDate.getDate() + 30); // 30日後に再申請可能

      const { error: waitlistError } = await supabase
        .from('waitlist_users')
        .insert({
          user_id: userId,
          reason_for_waitlist: 'Low activity score',
          score_when_moved: finalScore,
          can_reapply_after: reapplyDate.toISOString()
        });

      if (waitlistError) throw waitlistError;

      // アクティブユーザーから削除
      const { error: deleteError } = await supabase
        .from('user_activity_stats')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // プロファイルステータスを更新
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ status: 'waitlisted' })
        .eq('id', userId);

      if (profileError) throw profileError;

      // ローテーションログに記録
      await this.logRotationAction(userId, 'moved_to_waitlist', userData.tier, 'waitlist',
        `Moved to waitlist due to low activity (score: ${finalScore})`);

      console.log(`📤 User ${userId} moved to waitlist (score: ${finalScore})`);

    } catch (error) {
      console.error(`Failed to move user ${userId} to waitlist:`, error);
    }
  }

  /**
   * 待機リストから新規ユーザーを招待
   */
  private async inviteUsersFromWaitlist(count: number): Promise<void> {
    try {
      const { data: waitlistUsers, error } = await supabase
        .from('waitlist_users')
        .select('user_id, priority_score')
        .lte('can_reapply_after', new Date().toISOString())
        .order('priority_score', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(count);

      if (error) throw error;

      for (const waitlistUser of waitlistUsers || []) {
        await this.reactivateUser(waitlistUser.user_id);
      }

      console.log(`📥 Invited ${waitlistUsers?.length || 0} users from waitlist`);

    } catch (error) {
      console.error('Failed to invite users from waitlist:', error);
    }
  }

  /**
   * ユーザーを再アクティベート
   */
  private async reactivateUser(userId: string): Promise<void> {
    try {
      // プロファイルステータスを更新
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ status: 'active' })
        .eq('id', userId);

      if (profileError) throw profileError;

      // アクティビティ統計を初期化
      const { error: statsError } = await supabase
        .from('user_activity_stats')
        .insert({
          user_id: userId,
          tier: 'active',
          tier_updated_at: new Date().toISOString()
        });

      if (statsError) throw statsError;

      // 待機リストから削除
      const { error: waitlistError } = await supabase
        .from('waitlist_users')
        .delete()
        .eq('user_id', userId);

      if (waitlistError) throw waitlistError;

      // ローテーションログに記録
      await this.logRotationAction(userId, 'reactivated', 'waitlist', 'active',
        'User reactivated from waitlist');

      console.log(`🎉 User ${userId} reactivated from waitlist`);

    } catch (error) {
      console.error(`Failed to reactivate user ${userId}:`, error);
    }
  }

  /**
   * ローテーションアクションをログに記録
   */
  private async logRotationAction(
    userId: string,
    actionType: string,
    fromTier: string | null,
    toTier: string | null,
    reason: string,
    score?: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_rotation_logs')
        .insert({
          user_id: userId,
          action_type: actionType,
          from_tier: fromTier,
          to_tier: toTier,
          reason: reason,
          score_at_action: score,
          is_automated: true
        });

      if (error) throw error;

    } catch (error) {
      console.error('Failed to log rotation action:', error);
    }
  }

  /**
   * コミュニティ管理データを更新
   */
  private async updateCommunityManagement(status: any): Promise<void> {
    try {
      const nextEvaluation = new Date();
      nextEvaluation.setDate(nextEvaluation.getDate() + 7); // 1週間後

      const { error } = await supabase
        .from('community_management')
        .update({
          total_active_users: status.activeUsers,
          total_watch_users: status.watchUsers,
          total_risk_users: status.riskUsers,
          last_evaluation_at: new Date().toISOString(),
          next_evaluation_at: nextEvaluation.toISOString()
        })
        .eq('id', (await this.getCommunityManagementId()));

      if (error) throw error;

    } catch (error) {
      console.error('Failed to update community management:', error);
    }
  }

  /**
   * コミュニティ管理IDを取得
   */
  private async getCommunityManagementId(): Promise<string> {
    const { data, error } = await supabase
      .from('community_management')
      .select('id')
      .limit(1)
      .single();

    if (error || !data) {
      throw new Error('Community management record not found');
    }

    return data.id;
  }

  /**
   * 手動での緊急リバランス実行
   */
  async executeEmergencyRebalance(): Promise<void> {
    console.log('🚨 Executing emergency rebalance...');
    
    try {
      // 最も健康度の低いユーザーを取得
      const { data: lowScoreUsers, error } = await supabase
        .from('user_activity_stats')
        .select('user_id, overall_health_score, tier')
        .order('overall_health_score', { ascending: true })
        .limit(50);

      if (error) throw error;

      // スコアが極端に低いユーザーを即座に待機リストに移動
      const criticalUsers = lowScoreUsers?.filter(user => 
        user.overall_health_score < 10 && user.tier === 'risk'
      ) || [];

      for (const user of criticalUsers) {
        await this.moveUserToWaitlist(user.user_id, user.overall_health_score);
      }

      console.log(`🚨 Emergency rebalance completed: ${criticalUsers.length} users moved`);

    } catch (error) {
      console.error('Failed to execute emergency rebalance:', error);
    }
  }

  /**
   * ユーザーローテーション統計を取得
   */
  async getRotationStatistics(): Promise<any> {
    try {
      const [communityStats, recentActions] = await Promise.all([
        this.evaluateCommunityStatus(),
        this.getRecentRotationActions()
      ]);

      return {
        community: communityStats,
        recentActions,
        systemHealth: this.calculateSystemHealth(communityStats)
      };

    } catch (error) {
      console.error('Failed to get rotation statistics:', error);
      return null;
    }
  }

  /**
   * 最近のローテーションアクションを取得
   */
  private async getRecentRotationActions(): Promise<any[]> {
    const { data, error } = await supabase
      .from('user_rotation_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    return error ? [] : (data || []);
  }

  /**
   * システム健康度を計算
   */
  private calculateSystemHealth(stats: any): { score: number; status: string; issues: string[] } {
    let score = 100;
    const issues: string[] = [];

    // 容量チェック
    if (stats.isOverCapacity) {
      score -= 20;
      issues.push('Over capacity limit');
    }

    // バランスチェック
    if (stats.needsRebalancing) {
      score -= 15;
      issues.push('Tier distribution unbalanced');
    }

    // アクティビティ率チェック
    if (stats.activeRatio < 0.7) {
      score -= 25;
      issues.push('Low active user ratio');
    }

    let status = 'Excellent';
    if (score < 90) status = 'Good';
    if (score < 70) status = 'Warning';
    if (score < 50) status = 'Critical';

    return { score, status, issues };
  }
}

export const userRotationService = new UserRotationService();