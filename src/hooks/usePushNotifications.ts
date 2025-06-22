import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { pushNotificationService } from '../services/pushNotificationService';

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission;
  isLoading: boolean;
  error: string | null;
}

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    permission: 'default',
    isLoading: true,
    error: null
  });

  // 初期化
  useEffect(() => {
    const initialize = async () => {
      try {
        const isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
        const permission = isSupported ? Notification.permission : 'denied';
        
        setState(prev => ({
          ...prev,
          isSupported,
          permission,
          isLoading: false
        }));

        // ユーザーがログインしている場合、購読状況をチェック
        if (user && isSupported) {
          await checkSubscriptionStatus();
        }
      } catch (error) {
        console.error('プッシュ通知初期化エラー:', error);
        setState(prev => ({
          ...prev,
          error: '初期化に失敗しました',
          isLoading: false
        }));
      }
    };

    initialize();
  }, [user]);

  // 購読状況のチェック
  const checkSubscriptionStatus = useCallback(async () => {
    if (!user) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        setState(prev => ({
          ...prev,
          isSubscribed: !!subscription
        }));
      }
    } catch (error) {
      console.error('購読状況チェックエラー:', error);
    }
  }, [user]);

  // プッシュ通知を有効化
  const enablePushNotifications = useCallback(async (): Promise<boolean> => {
    if (!user || !state.isSupported) {
      setState(prev => ({ ...prev, error: 'プッシュ通知がサポートされていません' }));
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const success = await pushNotificationService.setupPushNotifications(user.id);
      
      if (success) {
        setState(prev => ({
          ...prev,
          isSubscribed: true,
          permission: 'granted',
          isLoading: false
        }));
        
        // テスト通知を送信
        await pushNotificationService.sendTestNotification(
          'プッシュ通知が有効になりました！',
          'これからライクやコメントの通知をお送りします'
        );
        
        return true;
      } else {
        setState(prev => ({
          ...prev,
          error: 'プッシュ通知の設定に失敗しました',
          isLoading: false
        }));
        return false;
      }
    } catch (error) {
      console.error('プッシュ通知有効化エラー:', error);
      setState(prev => ({
        ...prev,
        error: 'プッシュ通知の設定中にエラーが発生しました',
        isLoading: false
      }));
      return false;
    }
  }, [user, state.isSupported]);

  // プッシュ通知を無効化
  const disablePushNotifications = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const success = await pushNotificationService.unsubscribe(user.id);
      
      if (success) {
        setState(prev => ({
          ...prev,
          isSubscribed: false,
          isLoading: false
        }));
        return true;
      } else {
        setState(prev => ({
          ...prev,
          error: 'プッシュ通知の解除に失敗しました',
          isLoading: false
        }));
        return false;
      }
    } catch (error) {
      console.error('プッシュ通知無効化エラー:', error);
      setState(prev => ({
        ...prev,
        error: 'プッシュ通知の解除中にエラーが発生しました',
        isLoading: false
      }));
      return false;
    }
  }, [user]);

  // テスト通知の送信
  const sendTestNotification = useCallback(async (): Promise<boolean> => {
    if (!state.isSubscribed) return false;

    try {
      return await pushNotificationService.sendTestNotification(
        'テスト通知',
        'プッシュ通知が正常に動作しています！'
      );
    } catch (error) {
      console.error('テスト通知送信エラー:', error);
      return false;
    }
  }, [state.isSubscribed]);

  return {
    ...state,
    enablePushNotifications,
    disablePushNotifications,
    sendTestNotification,
    refresh: checkSubscriptionStatus
  };
};