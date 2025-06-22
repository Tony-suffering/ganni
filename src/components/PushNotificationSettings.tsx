import React from 'react';
import { motion } from 'framer-motion';
import { Bell, BellOff, Smartphone, Send } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';

export const PushNotificationSettings: React.FC = () => {
  const {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    error,
    enablePushNotifications,
    disablePushNotifications,
    sendTestNotification
  } = usePushNotifications();

  const handleToggleNotifications = async () => {
    if (isSubscribed) {
      await disablePushNotifications();
    } else {
      await enablePushNotifications();
    }
  };

  const handleTestNotification = async () => {
    const success = await sendTestNotification();
    if (!success) {
      alert('テスト通知の送信に失敗しました');
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3 mb-4">
          <BellOff className="w-6 h-6 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            プッシュ通知
          </h3>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          お使いのブラウザはプッシュ通知をサポートしていません。
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${isSubscribed ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-700'}`}>
            {isSubscribed ? (
              <Bell className="w-6 h-6 text-green-600 dark:text-green-400" />
            ) : (
              <BellOff className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              プッシュ通知
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isSubscribed ? '有効' : '無効'} • ライクやコメントをリアルタイムでお知らせ
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleToggleNotifications}
          disabled={isLoading}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            ${isSubscribed 
              ? 'bg-green-600 dark:bg-green-500' 
              : 'bg-gray-200 dark:bg-gray-600'
            }
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <motion.span
            layout
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${isSubscribed ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </motion.button>
      </div>

      {/* 権限状態の表示 */}
      <div className="mb-4">
        <div className="flex items-center space-x-2 text-sm">
          <Smartphone className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600 dark:text-gray-400">
            ブラウザ権限: 
          </span>
          <span className={`font-medium ${
            permission === 'granted' 
              ? 'text-green-600 dark:text-green-400' 
              : permission === 'denied'
              ? 'text-red-600 dark:text-red-400'
              : 'text-orange-600 dark:text-orange-400'
          }`}>
            {permission === 'granted' ? '許可済み' : 
             permission === 'denied' ? '拒否' : '未設定'}
          </span>
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* 説明文 */}
      <div className="mb-4 space-y-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          プッシュ通知を有効にすると以下の場合にお知らせします：
        </p>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 pl-4">
          <li className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
            <span>あなたの投稿にライクがついた時</span>
          </li>
          <li className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
            <span>あなたの投稿にコメントがついた時</span>
          </li>
          <li className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
            <span>AIコメントが生成された時</span>
          </li>
        </ul>
      </div>

      {/* テスト通知ボタン */}
      {isSubscribed && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleTestNotification}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <Send className="w-4 h-4" />
          <span>テスト通知を送信</span>
        </motion.button>
      )}

      {/* ローディング状態 */}
      {isLoading && (
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mt-2">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>設定中...</span>
        </div>
      )}
    </div>
  );
};