-- =============================================
-- postsテーブルのカラム名を正しく修正
-- 作成日: 2025-07-02
-- 概要: postsテーブルの実際のカラム名に合わせて修正
-- =============================================

-- 1. まず、postsテーブルの構造を確認
DO $$
DECLARE
  post_user_column TEXT;
  found_columns TEXT[];
BEGIN
  -- postsテーブルのユーザー関連カラムを検索
  SELECT array_agg(column_name) INTO found_columns
  FROM information_schema.columns
  WHERE table_name = 'posts'
    AND column_name IN ('user_id', 'author_id', 'created_by', 'owner_id');
  
  RAISE NOTICE '🔍 postsテーブルで見つかったユーザー関連カラム: %', found_columns;
  
  -- 最も可能性の高いカラム名を特定
  IF 'author_id' = ANY(found_columns) THEN
    post_user_column := 'author_id';
  ELSIF 'user_id' = ANY(found_columns) THEN
    post_user_column := 'user_id';
  ELSIF 'created_by' = ANY(found_columns) THEN
    post_user_column := 'created_by';
  ELSIF 'owner_id' = ANY(found_columns) THEN
    post_user_column := 'owner_id';
  ELSE
    RAISE EXCEPTION 'postsテーブルにユーザー参照カラムが見つかりません。テーブル構造: %', found_columns;
  END IF;
  
  RAISE NOTICE '✅ 使用するカラム名: %', post_user_column;
  
  -- グローバル変数として設定（後で関数で使用）
  PERFORM set_config('app.posts_user_column', post_user_column, false);
END $$;

-- 2. 動的に正しいカラム名を使用する関数を作成

-- いいね活動ログ更新関数（動的カラム名対応）
CREATE OR REPLACE FUNCTION update_like_activity_logs()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  today_date DATE := CURRENT_DATE;
  user_column TEXT;
  query_text TEXT;
BEGIN
  -- 設定からカラム名を取得、デフォルトは author_id
  user_column := COALESCE(current_setting('app.posts_user_column', true), 'author_id');
  
  -- 動的クエリでpost_author_idを取得
  query_text := format('SELECT %I FROM posts WHERE id = $1', user_column);
  EXECUTE query_text INTO post_author_id USING COALESCE(NEW.post_id, OLD.post_id);
  
  IF post_author_id IS NULL THEN
    RAISE WARNING 'Could not find post author for post_id: %, using column: %', COALESCE(NEW.post_id, OLD.post_id), user_column;
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
    
    RAISE LOG 'Like activity updated: user % gave like, user % received like (using column: %)', NEW.user_id, post_author_id, user_column;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- いいねを削除した人の活動ログ更新
    UPDATE daily_activity_logs 
    SET likes_given = GREATEST(0, likes_given - 1)
    WHERE user_id = OLD.user_id AND activity_date = today_date;
    
    -- いいねを削除された人の活動ログ更新
    UPDATE daily_activity_logs
    SET likes_received = GREATEST(0, likes_received - 1)
    WHERE user_id = post_author_id AND activity_date = today_date;
    
    RAISE LOG 'Like activity decreased: user % removed like from user % (using column: %)', OLD.user_id, post_author_id, user_column;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- いいねポイント付与関数（動的カラム名対応）
CREATE OR REPLACE FUNCTION award_like_points()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  like_giver_points INTEGER := 1;
  like_receiver_points INTEGER := 2;
  user_column TEXT;
  query_text TEXT;
BEGIN
  -- 設定からカラム名を取得、デフォルトは author_id
  user_column := COALESCE(current_setting('app.posts_user_column', true), 'author_id');
  
  -- 動的クエリでpost_author_idを取得
  query_text := format('SELECT %I FROM posts WHERE id = $1', user_column);
  EXECUTE query_text INTO post_author_id USING NEW.post_id;
  
  IF post_author_id IS NULL THEN
    RAISE WARNING 'Could not find post author for post_id: %, using column: %', NEW.post_id, user_column;
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
  
  RAISE LOG 'Like points awarded: giver % (+%IP), receiver % (+%LP) using column: %', 
    NEW.user_id, like_giver_points, post_author_id, like_receiver_points, user_column;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- いいね削除時のポイント処理関数（動的カラム名対応）
CREATE OR REPLACE FUNCTION handle_like_removal()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  like_giver_points INTEGER := 1;
  like_receiver_points INTEGER := 2;
  user_column TEXT;
  query_text TEXT;
BEGIN
  -- 設定からカラム名を取得、デフォルトは author_id
  user_column := COALESCE(current_setting('app.posts_user_column', true), 'author_id');
  
  -- 動的クエリでpost_author_idを取得
  query_text := format('SELECT %I FROM posts WHERE id = $1', user_column);
  EXECUTE query_text INTO post_author_id USING OLD.post_id;
  
  IF post_author_id IS NULL THEN
    RAISE WARNING 'Could not find post author for post_id: %, using column: %', OLD.post_id, user_column;
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
  
  RAISE LOG 'Like points removed: giver % (-%IP), receiver % (-%LP) using column: %', 
    OLD.user_id, like_giver_points, post_author_id, like_receiver_points, user_column;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 既存のトリガーを削除して再作成
DROP TRIGGER IF EXISTS trigger_update_like_activity_logs ON public.likes;
DROP TRIGGER IF EXISTS trigger_award_like_points ON public.likes;
DROP TRIGGER IF EXISTS trigger_handle_like_removal ON public.likes;

-- 4. 新しいトリガーの作成
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

-- 5. 権限設定
GRANT EXECUTE ON FUNCTION update_like_activity_logs() TO authenticated;
GRANT EXECUTE ON FUNCTION award_like_points() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_like_removal() TO authenticated;

-- 6. 最終確認
DO $$
DECLARE
  user_column TEXT;
BEGIN
  user_column := COALESCE(current_setting('app.posts_user_column', true), 'author_id');
  RAISE NOTICE '✅ ゲーミフィケーション関数が正しいカラム名で修正されました: %', user_column;
  RAISE NOTICE '🔧 いいね機能のトリガーが再設定されました';
  RAISE NOTICE '💡 動的カラム名検出により、データベース構造の変更に対応できます';
END $$;