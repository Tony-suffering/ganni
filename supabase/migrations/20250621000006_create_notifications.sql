-- Create notifications table for likes and comments

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL, -- 通知を受け取るユーザー（投稿者）
  sender_id uuid NOT NULL,    -- 通知を送るユーザー（いいねやコメントした人）
  post_id uuid NOT NULL,      -- 関連する投稿
  type text NOT NULL CHECK (type IN ('like', 'comment')), -- 通知の種類
  content text,               -- コメントの場合はコメント内容
  is_read boolean DEFAULT false, -- 既読フラグ
  created_at timestamptz DEFAULT now()
);

-- Disable RLS for now
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX notifications_recipient_id_idx ON notifications(recipient_id);
CREATE INDEX notifications_sender_id_idx ON notifications(sender_id);
CREATE INDEX notifications_post_id_idx ON notifications(post_id);
CREATE INDEX notifications_created_at_idx ON notifications(created_at DESC);
CREATE INDEX notifications_is_read_idx ON notifications(is_read);

-- Composite index for efficient queries
CREATE INDEX notifications_recipient_unread_idx ON notifications(recipient_id, is_read, created_at DESC);