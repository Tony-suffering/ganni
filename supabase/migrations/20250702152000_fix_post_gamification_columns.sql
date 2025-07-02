-- =============================================
-- ゲーミフィケーション関数のカラム名修正
-- 作成日: 2025-07-02
-- 概要: postsテーブルのカラム名に合わせて関数を修正
-- =============================================

-- 1. いいね活動ログ更新関数の修正（postsテーブルのuser_idを正しく参照）
CREATE OR REPLACE FUNCTION update_like_activity_logs()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  today_date DATE := CURRENT_DATE;
BEGIN
  -- 投稿者のIDを取得（postsテーブルのuser_idカラムを使用）
  SELECT user_id INTO post_author_id FROM posts WHERE id = COALESCE(NEW.post_id, OLD.post_id);
  
  IF TG_OP = 'INSERT' THEN
    -- いいねを送った人の活動ログ更新
    INSERT INTO daily_activity_logs (user_id, activity_date, likes_given, posts_count, comments_count, likes_received)
    VALUES (NEW.user_id, today_date, 1, 0, 0, 0)
    ON CONFLICT (user_id, activity_date) 
    DO UPDATE SET likes_given = daily_activity_logs.likes_given + 1;
    
    -- いいねを受け取った人の活動ログ更新
    INSERT INTO daily_activity_logs (user_id, activity_date, likes_received, posts_count, comments_count, likes_given)
    VALUES (post_author_id, today_date, 1, 0, 0, 0)
    ON CONFLICT (user_id, activity_date)
    DO UPDATE SET likes_received = daily_activity_logs.likes_received + 1;
    
    RAISE LOG 'Like activity updated: user % gave like, user % received like', NEW.user_id, post_author_id;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- いいねを削除した人の活動ログ更新
    UPDATE daily_activity_logs 
    SET likes_given = GREATEST(0, likes_given - 1)
    WHERE user_id = OLD.user_id AND activity_date = today_date;
    
    -- いいねを削除された人の活動ログ更新
    UPDATE daily_activity_logs
    SET likes_received = GREATEST(0, likes_received - 1)
    WHERE user_id = post_author_id AND activity_date = today_date;
    
    RAISE LOG 'Like activity decreased: user % removed like from user %', OLD.user_id, post_author_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. いいねポイント付与関数の修正
CREATE OR REPLACE FUNCTION award_like_points()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  like_giver_points INTEGER := 1;  -- いいねを送った人のポイント
  like_receiver_points INTEGER := 2; -- いいねを受け取った人のポイント
BEGIN
  -- 投稿者のIDを取得（postsテーブルのuser_idカラムを使用）
  SELECT user_id INTO post_author_id FROM posts WHERE id = NEW.post_id;
  
  -- 自分の投稿に自分でいいねした場合はポイント付与しない
  IF NEW.user_id = post_author_id THEN
    RAISE LOG 'Self-like detected, no points awarded: user %', NEW.user_id;
    RETURN NEW;
  END IF;
  
  -- いいねを送った人にポイント付与（コミュニティ貢献）
  PERFORM update_user_points(
    NEW.user_id,
    'influence',
    like_giver_points,
    'like_given',
    NEW.id::text,
    'いいねを送りました (+' || like_giver_points || 'IP)'
  );
  
  -- いいねを受け取った人にポイント付与（エンゲージメント）
  PERFORM update_user_points(
    post_author_id,
    'learning',
    like_receiver_points,
    'like_received',
    NEW.id::text,
    'いいねを受け取りました (+' || like_receiver_points || 'LP)'
  );
  
  RAISE LOG 'Like points awarded: giver % (+%IP), receiver % (+%LP)', 
    NEW.user_id, like_giver_points, post_author_id, like_receiver_points;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. いいね削除時のポイント処理関数の修正
CREATE OR REPLACE FUNCTION handle_like_removal()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  like_giver_points INTEGER := 1;
  like_receiver_points INTEGER := 2;
BEGIN
  -- 投稿者のIDを取得（postsテーブルのuser_idカラムを使用）
  SELECT user_id INTO post_author_id FROM posts WHERE id = OLD.post_id;
  
  -- 自分の投稿に自分でいいねした場合は処理しない
  IF OLD.user_id = post_author_id THEN
    RETURN OLD;
  END IF;
  
  -- いいねを削除した人のポイント減少
  PERFORM update_user_points(
    OLD.user_id,
    'influence',
    -like_giver_points,
    'like_removed',
    OLD.id::text,
    'いいねを取り消しました (-' || like_giver_points || 'IP)'
  );
  
  -- いいねを削除された人のポイント減少
  PERFORM update_user_points(
    post_author_id,
    'learning',
    -like_receiver_points,
    'like_removed',
    OLD.id::text,
    'いいねが取り消されました (-' || like_receiver_points || 'LP)'
  );
  
  RAISE LOG 'Like points removed: giver % (-%IP), receiver % (-%LP)', 
    OLD.user_id, like_giver_points, post_author_id, like_receiver_points;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 既存のトリガーを削除して再作成（エラー回避のため）
DROP TRIGGER IF EXISTS trigger_update_like_activity_logs ON public.likes;
DROP TRIGGER IF EXISTS trigger_award_like_points ON public.likes;
DROP TRIGGER IF EXISTS trigger_handle_like_removal ON public.likes;

-- 5. 新しいトリガーの作成
CREATE TRIGGER trigger_update_like_activity_logs
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION update_like_activity_logs();

CREATE TRIGGER trigger_award_like_points
  AFTER INSERT ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION award_like_points();

CREATE TRIGGER trigger_handle_like_removal
  AFTER DELETE ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION handle_like_removal();

-- 6. 権限設定の再適用
GRANT EXECUTE ON FUNCTION update_like_activity_logs() TO authenticated;
GRANT EXECUTE ON FUNCTION award_like_points() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_like_removal() TO authenticated;

-- 7. postsテーブルのuser_idカラムが存在することを確認
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'user_id'
  ) THEN
    RAISE EXCEPTION 'postsテーブルにuser_idカラムが存在しません。テーブル構造を確認してください。';
  END IF;
  
  RAISE NOTICE '✅ postsテーブルのuser_idカラムが確認されました';
END $$;

-- 8. 動作確認用のテストクエリ（コメントアウト状態）
/*
-- テスト用: 実際のデータでカラム名を確認
SELECT 
  'Posts table structure' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'posts'
AND column_name IN ('user_id', 'author_id', 'id')
ORDER BY column_name;

-- テスト用: サンプル投稿データの確認
SELECT 
  id,
  user_id,
  title,
  created_at
FROM posts
LIMIT 3;
*/

RAISE NOTICE '✅ ゲーミフィケーション関数のカラム名修正が完了しました';
RAISE NOTICE '🔧 いいね機能のトリガーが再設定されました';
RAISE NOTICE '💡 postsテーブルのuser_idカラムを正しく参照するようになりました';