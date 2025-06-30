import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Heart, MessageCircle, X, Lightbulb, Users, Trophy } from 'lucide-react';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

interface Notification {
  id: string;
  recipient_id: string;
  sender_id?: string;
  notification_type: string;
  title: string;
  message: string;
  related_post_id?: string;
  related_inspiration_id?: string;
  related_user_id?: string;
  metadata: Record<string, any>;
  is_read: boolean;
  is_archived: boolean;
  priority: string;
  created_at: string;
  updated_at: string;
  sender_name?: string;
  sender_avatar?: string;
  post_title?: string;
}

interface NotificationBellProps {
  onPostClick?: (postId: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onPostClick = () => {} }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);
  const userIdRef = useRef<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isMountedRef = useRef(true);
  const isInitializedRef = useRef(false);

  // 通知を取得
  const fetchNotifications = useCallback(async () => {
    if (!user || !user.id) return;
    
    // 一時的に通知機能を無効化（デバッグ用）
    console.log('⚠️ 通知機能は一時的に無効化されています（デバッグ用）');
    setLoading(false);
    return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('通知取得エラー:', error);
        return;
      }

      if (data) {
        // ユーザー情報と投稿情報を取得
        const senderIds = [...new Set(data.map(n => n.sender_id).filter(Boolean))];
        const postIds = [...new Set(data.map(n => n.related_post_id).filter(Boolean))];

        // ユーザー情報を取得（空の配列チェック付き）
        let usersData = null;
        if (senderIds.length > 0) {
          const usersResult = await supabase.from('users').select('id, name, avatar_url').in('id', senderIds);
          
          if (usersResult.error) {
            console.log('usersテーブルから取得失敗、profilesテーブルを試行');
            const profilesResult = await supabase.from('profiles').select('id, name, avatar_url').in('id', senderIds);
            usersData = profilesResult.data;
          } else {
            usersData = usersResult.data;
          }
        }

        // 投稿情報を取得（空の配列チェック付き）
        let postsResult = { data: [] };
        if (postIds.length > 0) {
          postsResult = await supabase.from('posts').select('id, title').in('id', postIds);
        }

        const usersMap = new Map(usersData?.map(u => [u.id, u]) || []);
        const postsMap = new Map(postsResult.data?.map(p => [p.id, p]) || []);
        
        // 現在のユーザー情報も追加
        if (user && !usersMap.has(user.id)) {
          usersMap.set(user.id, {
            id: user.id,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'ユーザー',
            avatar_url: user.user_metadata?.avatar_url
          });
        }

        const enrichedNotifications: Notification[] = data.map(notification => {
          const senderUser = usersMap.get(notification.sender_id);
          return {
            ...notification,
            sender_name: senderUser?.name || notification.metadata?.sender_name || 'システム',
            sender_avatar: senderUser?.avatar_url,
            post_title: postsMap.get(notification.related_post_id)?.title || '投稿'
          };
        });

        setNotifications(enrichedNotifications);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    } catch (error) {
      console.error('通知取得エラー:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 通知を既読にする
  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('既読マークエラー:', error);
    }
  };

  // 全通知を既読にする
  const markAllAsRead = async () => {
    if (!user || unreadCount === 0) return;

    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false);

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('全既読マークエラー:', error);
    }
  };

  // リアルタイム通知の購読
  useEffect(() => {
    const currentUserId = user?.id;
    
    // ユーザーがいない、または既に初期化済みの場合は何もしない
    if (!currentUserId || isInitializedRef.current) {
      return;
    }

    // 既存のチャンネルをクリーンアップ
    const cleanup = () => {
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current);
          console.log('チャンネルを削除しました');
        } catch (error) {
          console.warn('チャンネル削除エラー:', error);
        }
        channelRef.current = null;
      }
      isSubscribedRef.current = false;
      userIdRef.current = null;
    };

    // 前のユーザーのチャンネルがあればクリーンアップ
    if (userIdRef.current !== currentUserId) {
      cleanup();
    }

    // 初回データ取得
    fetchNotifications();

    // 新しいチャンネルを作成
    const channelName = `notifications_${currentUserId}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('新しいチャンネルを作成:', channelName);
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${currentUserId}`
        },
        (payload) => {
          console.log('新しい通知受信:', payload);
          if (payload.new && isMountedRef.current) {
            setNotifications(prev => [payload.new as Notification, ...prev]);
            setUnreadCount(prev => prev + 1);
          }
        }
      );

    // 購読を開始
    channel.subscribe((status) => {
      console.log('購読状態変更:', status, 'for user:', currentUserId);
      if (status === 'SUBSCRIBED') {
        isSubscribedRef.current = true;
        userIdRef.current = currentUserId;
        channelRef.current = channel;
        isInitializedRef.current = true;
        console.log('購読完了:', channelName);
      } else if (status === 'CHANNEL_ERROR') {
        console.error('チャンネルエラー:', channelName);
        cleanup();
      }
    });

    // クリーンアップ関数
    return () => {
      console.log('useEffectクリーンアップ実行');
      isMountedRef.current = false;
      cleanup();
    };
  }, [user?.id]);

  // コンポーネントアンマウント時のクリーンアップ
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current);
        } catch (error) {
          console.warn('コンポーネントアンマウント時のクリーンアップエラー:', error);
        }
      }
    };
  }, []);

  // 通知タイプに応じたアイコンを取得
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'inspiration_received':
      case 'inspiration_given':
        return <Lightbulb className="w-3 h-3 md:w-4 md:h-4 text-gray-600 flex-shrink-0" />;
      case 'like':
        return <Heart className="w-3 h-3 md:w-4 md:h-4 text-gray-600 flex-shrink-0" />;
      case 'comment':
        return <MessageCircle className="w-3 h-3 md:w-4 md:h-4 text-gray-600 flex-shrink-0" />;
      case 'follow':
        return <Users className="w-3 h-3 md:w-4 md:h-4 text-gray-600 flex-shrink-0" />;
      case 'achievement_unlocked':
        return <Trophy className="w-3 h-3 md:w-4 md:h-4 text-gray-600 flex-shrink-0" />;
      default:
        return <Bell className="w-3 h-3 md:w-4 md:h-4 text-gray-600 flex-shrink-0" />;
    }
  };

  // 通知クリック時の処理
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    // インスピレーション関連の通知の場合はインスピレーション・ラボに移動
    if (notification.notification_type === 'inspiration_received' && notification.related_post_id) {
      window.location.href = `/inspiration/${notification.related_post_id}`;
    } else if (notification.related_post_id && onPostClick) {
      onPostClick(notification.related_post_id);
    }
    setIsOpen(false);
  };

  if (!user) return null;

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* 通知ベル */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          
          if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const dropdownHeight = 400; // 想定されるドロップダウンの高さ
            
            // 画面下端に近い場合は上に表示
            if (rect.bottom + dropdownHeight > viewportHeight) {
              setDropdownStyle({
                bottom: '100%',
                top: 'auto',
                marginBottom: '8px',
                marginTop: '0'
              });
            } else {
              setDropdownStyle({
                top: '100%',
                bottom: 'auto',
                marginTop: '8px',
                marginBottom: '0'
              });
            }
          }
          
          setIsOpen(!isOpen);
        }}
        ref={buttonRef}
        className="relative p-3 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors touch-manipulation active:bg-gray-100 dark:active:bg-gray-600 rounded-full"
        style={{ minWidth: '48px', minHeight: '48px', zIndex: 10 }}
      >
        <Bell className="w-7 h-7" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center pointer-events-none z-20">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* オーバーレイ（モバイル用） */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-[90] md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 通知ドロップダウン */}
      {isOpen && (
        <div 
          className="fixed md:absolute inset-x-4 top-20 md:inset-x-auto md:right-0 w-auto md:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-[100] md:max-w-[400px]" 
          style={{
            ...dropdownStyle,
            // モバイルでは固定位置
            ...(window.innerWidth < 768 ? {
              top: '80px',
              bottom: 'auto',
              marginTop: '0',
              marginBottom: '0'
            } : {})
          }}
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">通知</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
                  >
                    全て既読
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">読み込み中...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">通知はありません</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 md:p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-2 md:space-x-3">
                    <img
                      src={
                        notification.sender_avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(notification.sender_name || 'システム')}&background=random&size=32`
                      }
                      alt={notification.sender_name}
                      className="w-7 h-7 md:w-8 md:h-8 rounded-full flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        {getNotificationIcon(notification.notification_type)}
                        <span className="text-xs md:text-sm font-medium text-gray-900 dark:text-white truncate">
                          {notification.title}
                        </span>
                      </div>
                      <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1 leading-tight">
                        {notification.message}
                      </p>
                      {notification.metadata?.inspiration_note && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic line-clamp-2">
                          「{notification.metadata.inspiration_note}」
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: ja
                          })}
                        </p>
                        {notification.priority === 'high' && (
                          <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded">
                            重要
                          </span>
                        )}
                      </div>
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-gray-600 rounded-full flex-shrink-0 mt-1"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;