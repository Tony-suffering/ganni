# タグのセットアップ手順

## 1. Supabaseダッシュボードでタグを追加

### 手順1: SQLエディタを開く
1. [Supabaseダッシュボード](https://supabase.com/dashboard) にログイン
2. プロジェクトを選択
3. 左側メニューから「SQL Editor」をクリック

### 手順2: スキーマ更新（category列の追加）
以下のSQLを実行：

```sql
-- tagsテーブルにcategory列を追加
ALTER TABLE tags ADD COLUMN IF NOT EXISTS category text DEFAULT 'その他';
```

### 手順3: 初期タグデータの挿入

**STEP 1: テーブル構造を確認**
```sql
-- テーブルの列を確認
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'tags' 
ORDER BY ordinal_position;
```

**STEP 2: 最小限の必須列でタグを挿入**
```sql
-- 基本的なタグの初期データを挿入（name と color のみ）
INSERT INTO tags (name, color) VALUES
  ('風景', '#10b981'),
  ('食べ物', '#f59e0b'),
  ('動物', '#8b5cf6'),
  ('建築', '#3b82f6'),
  ('人物', '#ec4899'),
  ('アート', '#f43f5e'),
  ('自然', '#22c55e'),
  ('街並み', '#6366f1'),
  ('乗り物', '#06b6d4'),
  ('スポーツ', '#ef4444');
```

**重複エラーが出た場合は、一つずつ挿入：**
```sql
-- 一つずつ挿入（重複があってもエラーにならない）
INSERT INTO tags (name, color) SELECT '風景', '#10b981' WHERE NOT EXISTS (SELECT 1 FROM tags WHERE name = '風景');
INSERT INTO tags (name, color) SELECT '食べ物', '#f59e0b' WHERE NOT EXISTS (SELECT 1 FROM tags WHERE name = '食べ物');
INSERT INTO tags (name, color) SELECT '動物', '#8b5cf6' WHERE NOT EXISTS (SELECT 1 FROM tags WHERE name = '動物');
INSERT INTO tags (name, color) SELECT '建築', '#3b82f6' WHERE NOT EXISTS (SELECT 1 FROM tags WHERE name = '建築');
INSERT INTO tags (name, color) SELECT '人物', '#ec4899' WHERE NOT EXISTS (SELECT 1 FROM tags WHERE name = '人物');
INSERT INTO tags (name, color) SELECT 'アート', '#f43f5e' WHERE NOT EXISTS (SELECT 1 FROM tags WHERE name = 'アート');
INSERT INTO tags (name, color) SELECT '自然', '#22c55e' WHERE NOT EXISTS (SELECT 1 FROM tags WHERE name = '自然');
INSERT INTO tags (name, color) SELECT '街並み', '#6366f1' WHERE NOT EXISTS (SELECT 1 FROM tags WHERE name = '街並み');
INSERT INTO tags (name, color) SELECT '乗り物', '#06b6d4' WHERE NOT EXISTS (SELECT 1 FROM tags WHERE name = '乗り物');
INSERT INTO tags (name, color) SELECT 'スポーツ', '#ef4444' WHERE NOT EXISTS (SELECT 1 FROM tags WHERE name = 'スポーツ');
```

**STEP 3: テーブルの内容を確認**
```sql
-- 挿入されたタグを確認
SELECT * FROM tags ORDER BY name;
```

## 2. ローカル環境でのテスト

### 開発サーバーを再起動
```bash
npm run dev
```

### 確認項目
1. 新規投稿モーダルでタグが表示されるか確認
2. タグを選択して投稿を作成
3. 投稿詳細でタグが表示されるか確認
4. フィルターパネルでタグフィルタリングが機能するか確認

## トラブルシューティング

### タグが表示されない場合
1. ブラウザの開発者ツールでコンソールエラーを確認
2. Network タブで tags テーブルへのリクエストが成功しているか確認
3. Supabase の Table Editor で tags テーブルにデータが存在するか確認

### フィルタリングが機能しない場合
1. 投稿に正しくタグが紐付けられているか確認
   - Supabase Table Editor で `post_tags` テーブルを確認
2. `usePosts.ts` の `filterPosts` 関数が正しく実装されているか確認

## 追加のタグを作成する場合

新しいタグを追加するSQL例：

```sql
INSERT INTO tags (name, color, description, slug, category) VALUES
  ('夜景', '#1e293b', '美しい夜の風景', 'nightscape', '場所'),
  ('モノクロ', '#6b7280', 'モノクロ写真', 'monochrome', 'クリエイティブ'),
  ('ポートレート', '#dc2626', '人物のポートレート', 'portrait', '人物');
```

色のコードは Tailwind CSS のカラーパレットを参考にしています。