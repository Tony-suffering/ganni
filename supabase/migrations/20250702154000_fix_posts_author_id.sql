-- =============================================
-- postsテーブルのauthor_idカラムに対応した修正
-- 作成日: 2025-07-02
-- 概要: postsテーブルがauthor_idを使用することが確認されたため修正
-- =============================================

-- 1. いいね活動ログ更新関数の修正（author_idを使用）
CREATE OR REPLACE FUNCTION update_like_activity_logs()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  today_date DATE := CURRENT_DATE;
BEGIN
  -- 投稿者のIDを取得（postsテーブルのauthor_idカラムを使用）
  SELECT author_id INTO post_author_id FROM posts WHERE id = COALESCE(NEW.post_id, OLD.post_id);
  
  IF post_author_id IS NULL THEN
    RAISE WARNING 'Could not find post author for post_id: %', COALESCE(NEW.post_id, OLD.post_id);
    RETURN COALESCE(NEW, OLD);
  END IF;
  
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

-- 2. いいねポイント付与関数の修正（author_idを使用）
CREATE OR REPLACE FUNCTION award_like_points()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  like_giver_points INTEGER := 1;  -- いいねを送った人のポイント
  like_receiver_points INTEGER := 2; -- いいねを受け取った人のポイント
BEGIN
  -- 投稿者のIDを取得（postsテーブルのauthor_idカラムを使用）
  SELECT author_id INTO post_author_id FROM posts WHERE id = NEW.post_id;
  
  IF post_author_id IS NULL THEN
    RAISE WARNING 'Could not find post author for post_id: %', NEW.post_id;
    RETURN NEW;
  END IF;
  
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

-- 3. いいね削除時のポイント処理関数の修正（author_idを使用）
CREATE OR REPLACE FUNCTION handle_like_removal()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  like_giver_points INTEGER := 1;
  like_receiver_points INTEGER := 2;
BEGIN
  -- 投稿者のIDを取得（postsテーブルのauthor_idカラムを使用）
  SELECT author_id INTO post_author_id FROM posts WHERE id = OLD.post_id;
  
  IF post_author_id IS NULL THEN
    RAISE WARNING 'Could not find post author for post_id: %', OLD.post_id;
    RETURN OLD;
  END IF;
  
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

-- 4. 既存のトリガーを削除して再作成
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

-- 6. 権限設定
GRANT EXECUTE ON FUNCTION update_like_activity_logs() TO authenticated;
GRANT EXECUTE ON FUNCTION award_like_points() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_like_removal() TO authenticated;

-- 7. 確認とログ
DO $$
BEGIN
  RAISE NOTICE '✅ ゲーミフィケーション関数がauthor_idカラムで修正されました';
  RAISE NOTICE '🔧 いいね機能のトリガーが再設定されました';
  RAISE NOTICE '💡 postsテーブルのauthor_idカラムを正しく参照するようになりました';
  RAISE NOTICE '🎮 いいね機能でポイント付与が正常に動作するはずです';
END $$;