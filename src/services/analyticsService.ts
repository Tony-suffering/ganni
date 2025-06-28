/**
 * アナリティクス・コンバージョン追跡サービス
 * マネタイズ効果の測定とユーザー行動分析
 */

interface AnalyticsEvent {
  event: string;
  category: string;
  label?: string;
  value?: number;
  userId?: string;
  personalityType?: string;
  timestamp: number;
  sessionId: string;
  metadata?: Record<string, any>;
}

interface ConversionData {
  userId: string;
  personalityType: string;
  recommendationType: string;
  itemClicked: string;
  clickTimestamp: number;
  conversionTimestamp?: number;
  conversionValue?: number;
  affiliatePartner: string;
}

interface UserSession {
  sessionId: string;
  userId?: string;
  startTime: number;
  lastActivity: number;
  pageViews: string[];
  events: AnalyticsEvent[];
  personalityAnalyzed: boolean;
  recommendationsShown: string[];
  conversions: ConversionData[];
}

export class AnalyticsService {
  private sessionId: string;
  private session: UserSession;
  private userId?: string;
  private personalityType?: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.session = this.initializeSession();
    this.loadSession();
  }

  /**
   * セッション初期化
   */
  private initializeSession(): UserSession {
    return {
      sessionId: this.sessionId,
      startTime: Date.now(),
      lastActivity: Date.now(),
      pageViews: [],
      events: [],
      personalityAnalyzed: false,
      recommendationsShown: [],
      conversions: []
    };
  }

  /**
   * セッションID生成
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * ローカルストレージからセッション復元
   */
  private loadSession(): void {
    try {
      const saved = localStorage.getItem('analytics_session');
      if (saved) {
        const parsedSession = JSON.parse(saved);
        // 24時間以内のセッションのみ復元
        if (Date.now() - parsedSession.startTime < 24 * 60 * 60 * 1000) {
          this.session = { ...this.session, ...parsedSession };
          this.sessionId = parsedSession.sessionId;
        }
      }
    } catch (error) {
      console.warn('Failed to load analytics session:', error);
    }
  }

  /**
   * セッション保存
   */
  private saveSession(): void {
    try {
      this.session.lastActivity = Date.now();
      localStorage.setItem('analytics_session', JSON.stringify(this.session));
    } catch (error) {
      console.warn('Failed to save analytics session:', error);
    }
  }

  /**
   * ユーザー設定
   */
  setUser(userId: string, personalityType?: string): void {
    this.userId = userId;
    this.personalityType = personalityType;
    this.session.userId = userId;
    this.saveSession();
  }

  /**
   * パーソナリティタイプ設定
   */
  setPersonalityType(type: string): void {
    this.personalityType = type;
    this.session.personalityAnalyzed = true;
    this.trackEvent('personality_analyzed', 'analysis', type);
  }

  /**
   * イベント追跡
   */
  trackEvent(
    event: string, 
    category: string, 
    label?: string, 
    value?: number, 
    metadata?: Record<string, any>
  ): void {
    const eventData: AnalyticsEvent = {
      event,
      category,
      label,
      value,
      userId: this.userId,
      personalityType: this.personalityType,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      metadata
    };

    this.session.events.push(eventData);
    this.saveSession();

    // Google Analytics に送信
    this.sendToGA(eventData);

    // 独自分析用にサーバーに送信
    this.sendToServer(eventData);
  }

  /**
   * ページビュー追跡
   */
  trackPageView(path: string): void {
    this.session.pageViews.push(path);
    this.trackEvent('page_view', 'navigation', path);
  }

  /**
   * 推薦表示追跡
   */
  trackRecommendationShown(recommendationType: string, items: string[]): void {
    this.session.recommendationsShown.push(recommendationType);
    this.trackEvent('recommendation_shown', 'monetization', recommendationType, items.length, {
      items,
      personalityType: this.personalityType
    });
  }

  /**
   * アフィリエイトクリック追跡
   */
  trackAffiliateClick(category: string, item: string, url: string, partner: string): void {
    const conversionData: ConversionData = {
      userId: this.userId || 'anonymous',
      personalityType: this.personalityType || 'unknown',
      recommendationType: category,
      itemClicked: item,
      clickTimestamp: Date.now(),
      affiliatePartner: partner
    };

    this.session.conversions.push(conversionData);
    
    this.trackEvent('affiliate_click', 'monetization', item, undefined, {
      category,
      url,
      partner,
      personalityType: this.personalityType
    });

    // コンバージョン候補として記録
    this.storeConversionCandidate(conversionData);
  }

  /**
   * コンバージョン完了追跡
   */
  trackConversion(itemId: string, value: number, partner: string): void {
    // 対応するクリックイベントを検索
    const candidate = this.findConversionCandidate(itemId);
    
    if (candidate) {
      candidate.conversionTimestamp = Date.now();
      candidate.conversionValue = value;
      
      this.trackEvent('conversion', 'monetization', itemId, value, {
        partner,
        personalityType: this.personalityType,
        timeToConversion: candidate.conversionTimestamp - candidate.clickTimestamp
      });
    }
  }

  /**
   * プレミアムアップグレード追跡
   */
  trackPremiumUpgrade(plan: string, price: number): void {
    this.trackEvent('premium_upgrade', 'subscription', plan, price, {
      personalityType: this.personalityType,
      sessionDuration: Date.now() - this.session.startTime
    });
  }

  /**
   * A/Bテスト参加記録
   */
  trackABTestParticipation(testName: string, variant: string): void {
    this.trackEvent('ab_test_participation', 'experiment', `${testName}_${variant}`, undefined, {
      testName,
      variant,
      personalityType: this.personalityType
    });
  }

  /**
   * Google Analytics への送信
   */
  private sendToGA(event: AnalyticsEvent): void {
    if (typeof gtag !== 'undefined') {
      gtag('event', event.event, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        custom_parameter_personality_type: event.personalityType,
        custom_parameter_session_id: event.sessionId
      });
    }
  }

  /**
   * サーバーへの送信
   */
  private async sendToServer(event: AnalyticsEvent): Promise<void> {
    try {
      // 実際の本番環境では適切なエンドポイントに送信
      const endpoint = '/api/analytics/events';
      
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      });
    } catch (error) {
      // サーバー送信失敗時はローカルに蓄積
      console.warn('Failed to send analytics to server:', error);
      this.queueOfflineEvent(event);
    }
  }

  /**
   * オフライン時のイベント蓄積
   */
  private queueOfflineEvent(event: AnalyticsEvent): void {
    try {
      const queue = JSON.parse(localStorage.getItem('analytics_queue') || '[]');
      queue.push(event);
      
      // 最大100件まで保持
      if (queue.length > 100) {
        queue.splice(0, queue.length - 100);
      }
      
      localStorage.setItem('analytics_queue', JSON.stringify(queue));
    } catch (error) {
      console.warn('Failed to queue offline event:', error);
    }
  }

  /**
   * コンバージョン候補保存
   */
  private storeConversionCandidate(data: ConversionData): void {
    try {
      const candidates = JSON.parse(localStorage.getItem('conversion_candidates') || '[]');
      candidates.push(data);
      
      // 7日以上古いものは削除
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const filtered = candidates.filter((c: ConversionData) => c.clickTimestamp > cutoff);
      
      localStorage.setItem('conversion_candidates', JSON.stringify(filtered));
    } catch (error) {
      console.warn('Failed to store conversion candidate:', error);
    }
  }

  /**
   * コンバージョン候補検索
   */
  private findConversionCandidate(itemId: string): ConversionData | null {
    try {
      const candidates = JSON.parse(localStorage.getItem('conversion_candidates') || '[]');
      return candidates.find((c: ConversionData) => 
        c.itemClicked.includes(itemId) && !c.conversionTimestamp
      ) || null;
    } catch (error) {
      console.warn('Failed to find conversion candidate:', error);
      return null;
    }
  }

  /**
   * セッション統計取得
   */
  getSessionStats(): {
    duration: number;
    pageViews: number;
    events: number;
    conversions: number;
    personalityAnalyzed: boolean;
  } {
    return {
      duration: Date.now() - this.session.startTime,
      pageViews: this.session.pageViews.length,
      events: this.session.events.length,
      conversions: this.session.conversions.filter(c => c.conversionTimestamp).length,
      personalityAnalyzed: this.session.personalityAnalyzed
    };
  }

  /**
   * パーソナリティ別コンバージョン率計算
   */
  getPersonalityConversionRate(personalityType: string): number {
    const personalityEvents = this.session.events.filter(e => 
      e.personalityType === personalityType
    );
    
    const clicks = personalityEvents.filter(e => e.event === 'affiliate_click').length;
    const conversions = personalityEvents.filter(e => e.event === 'conversion').length;
    
    return clicks > 0 ? (conversions / clicks) * 100 : 0;
  }

  /**
   * オフラインキューの送信
   */
  async flushOfflineQueue(): Promise<void> {
    try {
      const queue = JSON.parse(localStorage.getItem('analytics_queue') || '[]');
      
      if (queue.length > 0) {
        await fetch('/api/analytics/events/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(queue)
        });
        
        localStorage.removeItem('analytics_queue');
      }
    } catch (error) {
      console.warn('Failed to flush offline queue:', error);
    }
  }

  /**
   * 熱力図データ取得（将来の機能拡張用）
   */
  getHeatmapData(): Record<string, number> {
    const clickEvents = this.session.events.filter(e => 
      e.event === 'affiliate_click'
    );
    
    const heatmap: Record<string, number> = {};
    clickEvents.forEach(event => {
      const key = event.label || 'unknown';
      heatmap[key] = (heatmap[key] || 0) + 1;
    });
    
    return heatmap;
  }

  /**
   * セッション終了処理
   */
  endSession(): void {
    this.trackEvent('session_end', 'session', undefined, Date.now() - this.session.startTime);
    this.flushOfflineQueue();
  }
}

// グローバルインスタンス
export const analyticsService = new AnalyticsService();

// ページ離脱時の処理
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    analyticsService.endSession();
  });
}