-- notificationsテーブルのRLS設定
-- Supabaseの「SQL Editor」で実行してください

-- 1. RLSを有効化
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 2. 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Users can create notifications for others" ON notifications;
DROP POLICY IF EXISTS "Users can read their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete notifications they created" ON notifications;

-- 3. 新しいポリシーを作成

-- 通知作成: 認証されたユーザーが自分名義で他人に通知を送信可能
CREATE POLICY "Users can create notifications for others" ON notifications
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = sender_id);

-- 通知読み取り: 受信者または送信者のみが通知を読み取り可能
CREATE POLICY "Users can read their own notifications" ON notifications
FOR SELECT 
TO authenticated
USING (auth.uid() = recipient_id OR auth.uid() = sender_id);

-- 通知削除: 送信者のみが自分の送信した通知を削除可能
CREATE POLICY "Users can delete notifications they created" ON notifications
FOR DELETE 
TO authenticated
USING (auth.uid() = sender_id);

-- 4. 通知更新: 受信者が既読状態を更新可能
CREATE POLICY "Users can update their received notifications" ON notifications
FOR UPDATE 
TO authenticated
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);