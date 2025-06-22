import { supabase } from '../supabase';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  user_id: string;
  device_type: 'desktop' | 'mobile';
  user_agent: string;
}

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;

  // VAPID公開鍵（本番環境では実際の鍵に置き換える）
  private readonly VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'YOUR_GENERATED_VAPID_PUBLIC_KEY_HERE';

  constructor() {
    this.initializeServiceWorker();
  }

  // Service Workerの初期化
  async initializeServiceWorker(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('このブラウザはプッシュ通知をサポートしていません');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker登録成功:', this.registration);
      return true;
    } catch (error) {
      console.error('Service Worker登録失敗:', error);
      return false;
    }
  }

  // 通知許可の確認と要求
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('このブラウザは通知をサポートしていません');
      return 'denied';
    }

    let permission = Notification.permission;

    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    return permission;
  }

  // プッシュ購読の作成
  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.registration) {
      console.error('Service Workerが登録されていません');
      return null;
    }

    const permission = await this.requestPermission();
    if (permission !== 'granted') {
      console.warn('通知許可が拒否されました');
      return null;
    }

    try {
      // 既存の購読があるかチェック
      let subscription = await this.registration.pushManager.getSubscription();
      
      if (!subscription) {
        // 新しい購読を作成
        subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.VAPID_PUBLIC_KEY)
        });
      }

      return subscription;
    } catch (error) {
      console.error('プッシュ購読の作成に失敗:', error);
      return null;
    }
  }

  // 購読情報をサーバーに保存
  async saveSubscription(subscription: PushSubscription, userId: string): Promise<boolean> {
    try {
      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
        },
        user_id: userId,
        device_type: this.isMobile() ? 'mobile' : 'desktop',
        user_agent: navigator.userAgent
      };

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert([{
          user_id: userId,
          endpoint: subscriptionData.endpoint,
          p256dh_key: subscriptionData.keys.p256dh,
          auth_key: subscriptionData.keys.auth,
          device_type: subscriptionData.device_type,
          user_agent: subscriptionData.user_agent,
          is_active: true
        }], {
          onConflict: 'user_id,endpoint'
        });

      if (error) {
        console.error('購読情報の保存に失敗:', error);
        return false;
      }

      console.log('購読情報を保存しました');
      return true;
    } catch (error) {
      console.error('購読情報保存エラー:', error);
      return false;
    }
  }

  // 購読解除
  async unsubscribe(userId: string): Promise<boolean> {
    try {
      if (this.registration) {
        const subscription = await this.registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
      }

      // サーバーからも削除
      const { error } = await supabase
        .from('push_subscriptions')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (error) {
        console.error('購読解除エラー:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('購読解除に失敗:', error);
      return false;
    }
  }

  // ユーザーのプッシュ通知設定
  async setupPushNotifications(userId: string): Promise<boolean> {
    try {
      const isInitialized = await this.initializeServiceWorker();
      if (!isInitialized) return false;

      const subscription = await this.subscribeToPush();
      if (!subscription) return false;

      return await this.saveSubscription(subscription, userId);
    } catch (error) {
      console.error('プッシュ通知セットアップエラー:', error);
      return false;
    }
  }

  // テスト通知の送信
  async sendTestNotification(title: string = 'テスト通知', body: string = 'プッシュ通知が正常に動作しています'): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !this.registration) {
      return false;
    }

    try {
      await this.registration.showNotification(title, {
        body,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: 'test-notification',
        requireInteraction: false
      });
      return true;
    } catch (error) {
      console.error('テスト通知の送信に失敗:', error);
      return false;
    }
  }

  // ユーティリティ関数
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach(byte => binary += String.fromCharCode(byte));
    return window.btoa(binary);
  }

  private isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
}

export const pushNotificationService = new PushNotificationService();