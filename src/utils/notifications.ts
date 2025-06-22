import { supabase } from '../supabase';

export interface CreateNotificationParams {
  recipientId: string;
  senderId: string;
  postId: string;
  type: 'like' | 'comment';
  content?: string;
}

// 通知を作成
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

    // 通知設定チェックは削除されました - 全ての通知が作成されます

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

    const { error } = await supabase
      .from('notifications')
      .insert({
        recipient_id: recipientId,
        sender_id: senderId,
        post_id: postId,
        type,
        content: content || null,
        is_read: false
      });

    if (error) {
      console.error('通知作成エラー:', error);
    } else {
      console.log(`通知作成成功: ${type} notification from ${senderId} to ${recipientId}`);
    }
  } catch (error) {
    console.error('通知作成の予期しないエラー:', error);
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
      console.error('通知削除エラー:', error);
    }
  } catch (error) {
    console.error('通知削除の予期しないエラー:', error);
  }
};