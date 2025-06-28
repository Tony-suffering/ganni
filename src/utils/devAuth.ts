import { DevAuthConfig } from '../types';

// 開発者専用機能のアクセス制御
export class DevAuthService {
  private static readonly DEV_EMAILS = [
    'developer@example.com', // 実際の開発者メールアドレスに変更
    'admin@example.com'
  ];
  
  private static readonly DEV_SECRET_KEY = '0529';
  
  /**
   * 現在のユーザーが開発者かどうかチェック
   */
  static isDeveloper(userEmail?: string): boolean {
    if (!userEmail) return false;
    return this.DEV_EMAILS.includes(userEmail.toLowerCase());
  }
  
  /**
   * 開発者認証コンフィグを取得
   */
  static getDevConfig(userEmail?: string): DevAuthConfig {
    const isDev = this.isDeveloper(userEmail);
    
    return {
      isDeveloper: isDev,
      accessLevel: isDev ? 'full' : 'basic',
      features: isDev ? [
        'detailed_scoring_v2',
        'advanced_analytics',
        'debug_mode',
        'api_testing',
        'performance_metrics'
      ] : []
    };
  }
  
  /**
   * 機能へのアクセス権限をチェック
   */
  static hasFeatureAccess(feature: string, userEmail?: string): boolean {
    const config = this.getDevConfig(userEmail);
    return config.features.includes(feature);
  }
  
  /**
   * シークレットキーによる一時的な開発者アクセス
   */
  static authenticateWithSecret(secretKey: string): boolean {
    return secretKey === this.DEV_SECRET_KEY;
  }
  
  /**
   * ローカルストレージから開発者認証状態を取得
   */
  static getStoredDevAuth(): { authenticated: boolean; timestamp: number } {
    try {
      const stored = localStorage.getItem('dev_auth_v2');
      if (!stored) return { authenticated: false, timestamp: 0 };
      
      const parsed = JSON.parse(stored);
      const now = Date.now();
      
      // 24時間で期限切れ
      if (now - parsed.timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem('dev_auth_v2');
        return { authenticated: false, timestamp: 0 };
      }
      
      return parsed;
    } catch {
      return { authenticated: false, timestamp: 0 };
    }
  }
  
  /**
   * 開発者認証状態をローカルストレージに保存
   */
  static storeDevAuth(): void {
    const authData = {
      authenticated: true,
      timestamp: Date.now()
    };
    localStorage.setItem('dev_auth_v2', JSON.stringify(authData));
  }
  
  /**
   * 開発者認証をクリア
   */
  static clearDevAuth(): void {
    localStorage.removeItem('dev_auth_v2');
  }
}

// 開発者専用ログ
export const devLog = {
  info: (message: string, data?: any) => {
    if (DevAuthService.getStoredDevAuth().authenticated) {
      console.log(`🔧 [DEV] ${message}`, data);
    }
  },
  
  warn: (message: string, data?: any) => {
    if (DevAuthService.getStoredDevAuth().authenticated) {
      console.warn(`⚠️ [DEV] ${message}`, data);
    }
  },
  
  error: (message: string, data?: any) => {
    if (DevAuthService.getStoredDevAuth().authenticated) {
      console.error(`❌ [DEV] ${message}`, data);
    }
  },
  
  performance: (label: string, startTime: number) => {
    if (DevAuthService.getStoredDevAuth().authenticated) {
      const duration = Date.now() - startTime;
      console.log(`⏱️ [DEV PERF] ${label}: ${duration}ms`);
    }
  }
};