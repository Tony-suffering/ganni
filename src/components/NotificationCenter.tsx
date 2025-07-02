import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Heart, MessageCircle, Users, Lightbulb, Trophy, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

interface Notification {
  id: string;
  recipient_id: string;
  sender_id: string;
  post_id?: string;
  type: string;
  content?: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationClick?: (notification: Notification) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  onNotificationClick
}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'inspiration'>('all');

  useEffect(() => {
    if (user && isOpen) {
      fetchNotifications();
      subscribeToNotifications();
    }
  }, [user, isOpen, filter]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (filter === 'unread') {
        query = query.eq('is_read', false);
      } else if (filter === 'inspiration') {
        query = query.in('type', ['inspiration_received', 'inspiration_given']);
      }

      const { data, error } = await query;

      if (error) {
        console.error('通知取得エラー:', error);
        return;
      }

      // 古いスキーマの通知データを表示用に整形
      const formattedNotifications = await Promise.all((data || []).map(async (n) => {
        // 送信者の情報を取得
        const { data: senderData } = await supabase
          .from('profiles')
          .select('name, avatar_url')
          .eq('id', n.sender_id)
          .single();

        return {
          ...n,
          title: n.type === 'like' ? 'いいね！' : 'コメント',
          message: n.type === 'like' 
            ? `${senderData?.name || '誰か'}があなたの投稿にいいねしました` 
            : `${senderData?.name || '誰か'}がコメントしました: ${n.content || ''}`,
          notification_type: n.type,
          senderName: senderData?.name || '名無しさん',
          senderAvatar: senderData?.avatar_url
        };
      }));

      setNotifications(formattedNotifications);

      
      // 未読数を計算
      const unread = (data || []).filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('通知取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNotifications = () => {
    if (!user) return;

    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as any;
          
          // 送信者情報を非同期で取得
          supabase
            .from('profiles')
            .select('name, avatar_url')
            .eq('id', newNotification.sender_id)
            .single()
            .then(({ data: senderData }) => {
          
              // 古いスキーマの通知データを整形
              const formattedNotification = {
                ...newNotification,
                title: newNotification.type === 'like' ? 'いいね！' : 'コメント',
                message: newNotification.type === 'like' 
                  ? `${senderData?.name || '誰か'}があなたの投稿にいいねしました` 
                  : `${senderData?.name || '誰か'}がコメントしました: ${newNotification.content || ''}`,
                notification_type: newNotification.type,
                senderName: senderData?.name || '名無しさん',
                senderAvatar: senderData?.avatar_url
              };
              setNotifications(prev => [formattedNotification, ...prev]);
              setUnreadCount(prev => prev + 1);
              
              // ブラウザ通知を表示
              if (Notification.permission === 'granted') {
                new Notification(formattedNotification.title, {
                  body: formattedNotification.message,
                  icon: '/icon-192x192.png'
                });
              }
            });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) {
        console.error('既読更新エラー:', error);
        return;
      }

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('既読更新エラー:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('recipient_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('全件既読更新エラー:', error);
        return;
      }

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('全件既読更新エラー:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-gray-600" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-gray-600" />;
      case 'inspiration_received':
      case 'inspiration_given':
        return <Lightbulb className="w-5 h-5 text-gray-600" />;
      case 'follow':
        return <Users className="w-5 h-5 text-gray-600" />;
      case 'achievement_unlocked':
        return <Trophy className="w-5 h-5 text-gray-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPriorityStyles = (priority: string, isRead: boolean) => {
    const baseStyles = isRead 
      ? 'bg-gray-50 dark:bg-gray-800' 
      : 'bg-white dark:bg-gray-700';
    
    switch (priority) {
      case 'urgent':
        return `${baseStyles} border-l-4 border-red-500`;
      case 'high':
        return `${baseStyles} border-l-4 border-orange-400`;
      default:
        return `${baseStyles} border-l-4 ${isRead ? 'border-gray-200' : 'border-gray-400'}`;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    if (onNotificationClick) {
      onNotificationClick(notification);
    } else {
      // デフォルトの動作: 関連投稿に移動
      if (notification.post_id) {
        window.location.href = `/post/${notification.post_id}`;
      }
    }
  };

  const filteredNotifications = notifications.filter(n => {
    switch (filter) {
      case 'unread':
        return !n.is_read;
      case 'inspiration':
        return ['inspiration_received', 'inspiration_given'].includes(n.type)
      default:
        return true;
    }
  });

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-20"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black bg-opacity-25"
        onClick={onClose}
      />

      {/* Notification Panel */}
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-h-[80vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Bell className="w-6 h-6 text-gray-800 dark:text-gray-200" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                通知
              </h2>
              {unreadCount > 0 && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {unreadCount}件の未読
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center border-b border-gray-200 dark:border-gray-700">
          {[
            { key: 'all', label: 'すべて' },
            { key: 'unread', label: '未読' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'text-gray-900 dark:text-white border-b-2 border-gray-800 dark:border-gray-200'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Actions */}
        {unreadCount > 0 && (
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700">
            <button
              onClick={markAllAsRead}
              className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              すべて既読にする
            </button>
          </div>
        )}

        {/* Notification List */}
        <div className="overflow-y-auto max-h-96">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center p-8">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {filter === 'unread' ? '未読の通知はありません' : '通知はありません'}
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredNotifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`${getPriorityStyles('normal', notification.is_read)} cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-sm font-medium ${notification.is_read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
                            {(notification as any).title || (notification.type === 'like' ? 'いいね！' : 'コメント')}
                          </h4>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-gray-600 rounded-full ml-2"></div>
                          )}
                        </div>
                        <p className={`text-sm mt-1 ${notification.is_read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                          {(notification as any).message || (notification.type === 'like' ? 'あなたの投稿にいいねしました' : `コメント: ${notification.content || ''}`)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          {formatDistanceToNow(new Date(notification.created_at), { 
                            addSuffix: true, 
                            locale: ja 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};