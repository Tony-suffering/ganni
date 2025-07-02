-- =============================================
-- インスピレーション機能 RLS修正
-- 作成日: 2025-07-02
-- 概要: 重複ポリシーを削除して正しく動作させる
-- =============================================

-- 1. 既存のinspirationsテーブルのポリシーをすべて削除
DROP POLICY IF EXISTS "Anyone can view inspirations" ON inspirations;
DROP POLICY IF EXISTS "Authenticated users can create inspirations" ON inspirations;
DROP POLICY IF EXISTS "Users can create inspirations for their posts" ON inspirations;
DROP POLICY IF EXISTS "Users can update own inspirations" ON inspirations;
DROP POLICY IF EXISTS "Users can update their inspirations" ON inspirations;

-- 2. 新しい明確なポリシーを作成
CREATE POLICY "enable_read_inspirations" ON inspirations
    FOR SELECT USING (true);

CREATE POLICY "enable_insert_inspirations" ON inspirations
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "enable_update_inspirations" ON inspirations
    FOR UPDATE USING (auth.uid() = creator_id);

-- 3. point_historyのポリシー確認と修正
DROP POLICY IF EXISTS "Users can view own point history" ON point_history;
DROP POLICY IF EXISTS "enable_read_point_history" ON point_history;
DROP POLICY IF EXISTS "enable_insert_point_history" ON point_history;

CREATE POLICY "enable_read_point_history" ON point_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "enable_insert_point_history" ON point_history
    FOR INSERT WITH CHECK (true); -- システムが挿入するため制限なし

-- 4. user_pointsのポリシー確認と修正
DROP POLICY IF EXISTS "Users can view own points" ON user_points;
DROP POLICY IF EXISTS "Users can update own points" ON user_points;
DROP POLICY IF EXISTS "enable_read_user_points" ON user_points;
DROP POLICY IF EXISTS "enable_update_user_points" ON user_points;

CREATE POLICY "enable_read_user_points" ON user_points
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "enable_update_user_points" ON user_points
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "enable_insert_user_points" ON user_points
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. user_inspiration_statsのポリシー確認と修正
DROP POLICY IF EXISTS "Users can view own inspiration stats" ON user_inspiration_stats;
DROP POLICY IF EXISTS "enable_read_user_inspiration_stats" ON user_inspiration_stats;
DROP POLICY IF EXISTS "enable_update_user_inspiration_stats" ON user_inspiration_stats;

CREATE POLICY "enable_read_user_inspiration_stats" ON user_inspiration_stats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "enable_update_user_inspiration_stats" ON user_inspiration_stats
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "enable_insert_user_inspiration_stats" ON user_inspiration_stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. テスト用：権限チェック関数
CREATE OR REPLACE FUNCTION test_inspiration_permissions()
RETURNS TEXT AS $$
DECLARE
    current_user_id UUID;
    test_result TEXT;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN '❌ ユーザーが認証されていません';
    END IF;
    
    test_result := format('✅ 認証済みユーザー: %s', current_user_id);
    
    -- inspirationsテーブルへの挿入権限をテスト
    BEGIN
        INSERT INTO inspirations (
            source_post_id,
            inspired_post_id,
            creator_id,
            inspiration_type,
            inspiration_note
        ) VALUES (
            gen_random_uuid(), -- ダミーID
            gen_random_uuid(), -- ダミーID
            current_user_id,
            'test',
            'permission test'
        );
        
        -- 挿入できた場合は削除
        DELETE FROM inspirations 
        WHERE creator_id = current_user_id 
        AND inspiration_type = 'test';
        
        test_result := test_result || E'\n✅ inspirations INSERT: OK';
    EXCEPTION WHEN OTHERS THEN
        test_result := test_result || format(E'\n❌ inspirations INSERT: %s', SQLERRM);
    END;
    
    -- point_historyテーブルへの挿入権限をテスト
    BEGIN
        INSERT INTO point_history (
            user_id,
            point_type,
            points,
            source_type,
            description
        ) VALUES (
            current_user_id,
            'learning',
            1,
            'inspiration_test',
            'permission test'
        );
        
        -- 挿入できた場合は削除
        DELETE FROM point_history 
        WHERE user_id = current_user_id 
        AND source_type = 'inspiration_test';
        
        test_result := test_result || E'\n✅ point_history INSERT: OK';
    EXCEPTION WHEN OTHERS THEN
        test_result := test_result || format(E'\n❌ point_history INSERT: %s', SQLERRM);
    END;
    
    RETURN test_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 現在のポリシー状況を確認
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('inspirations', 'point_history', 'user_points', 'user_inspiration_stats')
ORDER BY tablename, cmd, policyname;

-- 完了メッセージ
DO $$
BEGIN
    RAISE NOTICE '🔧 RLS修正完了！';
    RAISE NOTICE '🧪 テスト方法:';
    RAISE NOTICE '   SELECT test_inspiration_permissions();';
    RAISE NOTICE '🎯 次にブラウザコンソールで以下を実行:';
    RAISE NOTICE '   runFullInspirationTest()';
END $$;