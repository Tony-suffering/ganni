-- =============================================
-- いいね機能のゲーミフィケーション統合
-- 作成日: 2025-07-02
-- 概要: いいね機能とポイントシステムを連携
-- =============================================

-- 1. いいね活動ログ更新関数
CREATE OR REPLACE FUNCTION update_like_activity_logs()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  today_date DATE := CURRENT_DATE;
BEGIN
  -- 投稿者のIDを取得
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

-- 2. いいねポイント付与関数
CREATE OR REPLACE FUNCTION award_like_points()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  like_giver_points INTEGER := 1;  -- いいねを送った人のポイント
  like_receiver_points INTEGER := 2; -- いいねを受け取った人のポイント
BEGIN
  -- 投稿者のIDを取得
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

-- 3. いいね削除時のポイント処理関数
CREATE OR REPLACE FUNCTION handle_like_removal()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  like_giver_points INTEGER := 1;
  like_receiver_points INTEGER := 2;
BEGIN
  -- 投稿者のIDを取得
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

-- 4. トリガーの作成

-- いいね活動ログトリガー
DROP TRIGGER IF EXISTS trigger_update_like_activity_logs ON public.likes;
CREATE TRIGGER trigger_update_like_activity_logs
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION update_like_activity_logs();

-- いいねポイント付与トリガー
DROP TRIGGER IF EXISTS trigger_award_like_points ON public.likes;
CREATE TRIGGER trigger_award_like_points
  AFTER INSERT ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION award_like_points();

-- いいね削除時のポイント処理トリガー
DROP TRIGGER IF EXISTS trigger_handle_like_removal ON public.likes;
CREATE TRIGGER trigger_handle_like_removal
  AFTER DELETE ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION handle_like_removal();

-- 5. 既存データの補正（オプション）
-- 注意: 既存のいいねデータに対してポイントを付与したい場合は以下のコメントを外してください
-- 大量のデータがある場合は段階的に実行することを推奨します

/*
DO $$
DECLARE
  like_record RECORD;
  post_author_id UUID;
  processed_count INTEGER := 0;
BEGIN
  RAISE NOTICE '既存いいねデータの補正を開始...';
  
  FOR like_record IN 
    SELECT l.id, l.user_id, l.post_id, l.created_at
    FROM likes l
    ORDER BY l.created_at DESC
    LIMIT 1000  -- 最新1000件のみ処理
  LOOP
    -- 投稿者ID取得
    SELECT user_id INTO post_author_id FROM posts WHERE id = like_record.post_id;
    
    -- 自分へのいいねはスキップ
    IF like_record.user_id != post_author_id THEN
      -- ポイント付与
      PERFORM update_user_points(
        like_record.user_id, 'influence', 1, 'like_given_retroactive', 
        like_record.id::text, '過去のいいね補正 (+1IP)'
      );
      
      PERFORM update_user_points(
        post_author_id, 'learning', 2, 'like_received_retroactive',
        like_record.id::text, '過去のいいね補正 (+2LP)'
      );
      
      processed_count := processed_count + 1;
    END IF;
  END LOOP;
  
  RAISE NOTICE '既存いいねデータ補正完了: %件処理', processed_count;
END $$;
*/

-- 6. 権限設定
GRANT EXECUTE ON FUNCTION update_like_activity_logs() TO authenticated;
GRANT EXECUTE ON FUNCTION award_like_points() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_like_removal() TO authenticated;

-- 7. 動作確認用クエリ
-- 実行後、以下のクエリで動作確認できます:
--
-- SELECT 
--   u.email,
--   up.learning_points,
--   up.influence_points,
--   up.total_points
-- FROM auth.users u
-- LEFT JOIN user_points up ON up.user_id = u.id
-- ORDER BY up.total_points DESC NULLS LAST
-- LIMIT 10;
--
-- SELECT 
--   source_type,
--   COUNT(*) as count,
--   SUM(points) as total_points
-- FROM point_history 
-- WHERE source_type IN ('like_given', 'like_received')
-- GROUP BY source_type
-- ORDER BY count DESC;

RAISE NOTICE '✅ いいね機能のゲーミフィケーション統合が完了しました';
RAISE NOTICE '💡 いいねを送ると +1 IP、受け取ると +2 LP が付与されます';
RAISE NOTICE '🔄 いいねを取り消すとポイントも減少します';