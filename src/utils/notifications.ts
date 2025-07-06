import { supabase } from '../supabase';

export interface CreateNotificationParams {
  recipientId: string;
  senderId: string;
  postId: string;
  type: 'like' | 'comment';
  content?: string;
}

// 通知を作成（シンプルな直接挿入）
export const createNotification = async ({
  recipientId,
  senderId,
  postId,
  type,
  content
}: CreateNotificationParams) => {
  try {
    // 自分自身への通知は作成しない
    if (recipientId === senderId) {
      return;
    }

    // 既存の同じ通知があるかチェック（いいねの場合）
    if (type === 'like') {
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('recipient_id', recipientId)
        .eq('sender_id', senderId)
        .eq('post_id', postId)
        .eq('type', 'like')
        .single();

      // 既に同じいいね通知が存在する場合は作成しない
      if (existing) {
        return;
      }
    }

    // 直接notificationsテーブルに挿入
    const { error } = await supabase
      .from('notifications')
      .insert({
        recipient_id: recipientId,
        sender_id: senderId,
        post_id: postId,
        type: type,
        content: content || `新しい${type === 'like' ? 'いいね' : 'コメント'}を受信しました`,
        is_read: false
      });

    if (error) {
      throw error;
    }
  } catch (error) {
    // エラーを隠す（メイン機能に影響させない）
  }
};

// いいね取り消し時に通知を削除
export const deleteNotification = async ({
  recipientId,
  senderId,
  postId,
  type
}: Omit<CreateNotificationParams, 'content'>) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('recipient_id', recipientId)
      .eq('sender_id', senderId)
      .eq('post_id', postId)
      .eq('type', type);

    if (error) {
      throw error;
    }
  } catch (error) {
    // エラーを隠す（メイン機能に影響させない）
  }
};