import { supabase } from '../supabase';

export interface CreateNotificationParams {
  recipientId: string;
  senderId: string;
  postId: string;
  type: 'like' | 'comment';
  content?: string;
}

// 通知を作成（新しいスキーマに対応）
export const createNotification = async ({
  recipientId,
  senderId,
  postId,
  type,
  content
}: CreateNotificationParams) => {
  try {
    console.log('🔔 通知作成開始:', { recipientId, senderId, postId, type, content });
    
    // 自分自身への通知は作成しない
    if (recipientId === senderId) {
      console.log('🚫 自分自身への通知のためスキップ');
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
        console.log('🚫 既存のいいね通知があるためスキップ');
        return;
      }
    }

    // 新しいスキーマでの通知作成
    const templateKey = type === 'like' ? 'like_received' : 'comment_received';
    
    // create_notification関数を使用
    const { data, error } = await supabase
      .rpc('create_notification', {
        p_recipient_id: recipientId,
        p_sender_id: senderId,
        p_notification_type: type,
        p_template_key: templateKey,
        p_related_post_id: postId,
        p_metadata: content ? { comment_content: content } : {}
      });

    if (error) {
      console.error('🚨 create_notification関数でエラー:', error);
      
      // フォールバック: 直接テーブルに挿入（まず古いスキーマを試行）
      console.log('🔄 古いスキーマでフォールバック試行...');
      const { error: oldSchemaError } = await supabase
        .from('notifications')
        .insert({
          recipient_id: recipientId,
          sender_id: senderId,
          post_id: postId,
          type: type,
          content: content || null,
          is_read: false
        });

      if (oldSchemaError) {
        console.log('🔄 新しいスキーマでフォールバック試行...');
        // 新しいスキーマで試行
        const { error: newSchemaError } = await supabase
          .from('notifications')
          .insert({
            recipient_id: recipientId,
            sender_id: senderId,
            related_post_id: postId,
            notification_type: type,
            title: type === 'like' ? 'いいね！' : 'コメント',
            message: type === 'like' ? 'あなたの投稿にいいねしました' : 'あなたの投稿にコメントしました',
            metadata: content ? { comment_content: content } : {},
            is_read: false
          });

        if (newSchemaError) {
          console.error('🚨 全ての通知作成方法が失敗:', newSchemaError);
        } else {
          console.log(`✅ 新しいスキーマで通知作成成功: ${type} notification from ${senderId} to ${recipientId}`);
        }
      } else {
        console.log(`✅ 古いスキーマで通知作成成功: ${type} notification from ${senderId} to ${recipientId}`);
        console.log('📝 作成された通知の詳細:', {
          recipient_id: recipientId,
          sender_id: senderId,
          post_id: postId,
          type: type,
          content: content || null,
          is_read: false
        });
      }
    } else {
      console.log(`✅ create_notification関数で通知作成成功: ${type} notification from ${senderId} to ${recipientId}`);
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
    console.log('🗑️ 通知削除開始:', { recipientId, senderId, postId, type });
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('recipient_id', recipientId)
      .eq('sender_id', senderId)
      .eq('post_id', postId)
      .eq('type', type);

    if (error) {
      console.error('🚨 通知削除エラー:', error);
    } else {
      console.log('✅ 通知削除成功');
    }
  } catch (error) {
    console.error('通知削除の予期しないエラー:', error);
  }
};