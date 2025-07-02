-- =============================================
-- postsテーブル構造確認
-- 作成日: 2025-07-02
-- 概要: postsテーブルの実際の構造を確認
-- =============================================

-- 1. postsテーブルのカラム構造確認
SELECT 
  'Posts table columns' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'posts'
ORDER BY ordinal_position;

-- 2. postsテーブルのサンプルデータ確認（カラム名特定のため）
SELECT *
FROM posts
LIMIT 3;

-- 3. postsテーブルの外部キー制約確認
SELECT
  'Foreign key constraints' as info,
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM
  information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'posts';

-- 4. postsテーブルの主キー確認
SELECT
  'Primary key' as info,
  column_name
FROM information_schema.key_column_usage
WHERE table_name = 'posts'
  AND constraint_name IN (
    SELECT constraint_name
    FROM information_schema.table_constraints
    WHERE table_name = 'posts'
      AND constraint_type = 'PRIMARY KEY'
  );

-- 5. postsテーブルの作成文確認（可能であれば）
SELECT
  'Table definition' as info,
  pg_get_constraintdef(c.oid) as constraint_def
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'posts';

RAISE NOTICE '✅ postsテーブル構造確認完了';
RAISE NOTICE '💡 上記の結果を確認して正しいカラム名を特定してください';