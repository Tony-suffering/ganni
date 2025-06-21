# ブログシステム Supabase データベース設計

## 📊 データベース概要

このブログシステムは、Supabaseを使用して設計されたフル機能のデータベースシステムです。AI生成コメント機能を含む現代的なブログプラットフォームに必要なすべての機能をサポートしています。

## 🗂️ テーブル構造

### 1. users（ユーザー）
```sql
- id (uuid, PK) - ユーザーID
- email (text, unique) - メールアドレス  
- name (text) - 表示名
- avatar_url (text) - プロフィール画像URL
- bio (text) - プロフィール説明
- role (text) - 役割 (admin, editor, user)
- created_at (timestamptz) - 作成日時
- updated_at (timestamptz) - 更新日時
```

### 2. categories（カテゴリー）
```sql
- id (uuid, PK) - カテゴリーID
- name (text, unique) - カテゴリー名
- description (text) - 説明
- color (text) - カラーコード
- slug (text, unique) - URL用スラッグ
- created_at (timestamptz) - 作成日時
- updated_at (timestamptz) - 更新日時
```

### 3. tags（タグ）
```sql
- id (uuid, PK) - タグID
- name (text, unique) - タグ名
- color (text) - カラーコード
- description (text) - 説明
- slug (text, unique) - URL用スラッグ
- created_by (uuid, FK) - 作成者ID
- created_at (timestamptz) - 作成日時
- updated_at (timestamptz) - 更新日時
```

### 4. posts（記事）
```sql
- id (uuid, PK) - 記事ID
- title (text) - タイトル
- content (text) - 本文
- excerpt (text) - 抜粋
- image_url (text) - メイン画像URL
- ai_description (text) - AI生成説明
- user_comment (text) - ユーザーコメント
- published (boolean) - 公開状態
- slug (text, unique) - URL用スラッグ
- author_id (uuid, FK) - 著者ID
- category_id (uuid, FK) - カテゴリーID
- view_count (integer) - 閲覧数
- created_at (timestamptz) - 作成日時
- updated_at (timestamptz) - 更新日時
```

### 5. post_tags（記事-タグ中間テーブル）
```sql
- id (uuid, PK) - ID
- post_id (uuid, FK) - 記事ID
- tag_id (uuid, FK) - タグID
- created_at (timestamptz) - 作成日時
```

### 6. comments（コメント）
```sql
- id (uuid, PK) - コメントID
- content (text) - 内容
- type (text) - タイプ (user, ai_comment, ai_question, ai_observation)
- author_id (uuid, FK) - 投稿者ID
- post_id (uuid, FK) - 記事ID
- parent_id (uuid, FK) - 親コメントID
- published (boolean) - 公開状態
- created_at (timestamptz) - 作成日時
- updated_at (timestamptz) - 更新日時
```

## 🔐 セキュリティ（RLS）ポリシー

### ユーザー権限
- **一般ユーザー**: 自分の投稿とコメントのみ編集可能
- **編集者**: 投稿作成・編集権限
- **管理者**: 全ての機能にアクセス可能

### データアクセス規則
- **公開データ**: すべてのユーザーが閲覧可能
- **下書き**: 作成者と管理者のみ閲覧可能
- **コメント**: 投稿者と記事作成者が管理可能

## 🚀 セットアップ手順

### 1. Supabaseプロジェクトの準備
```bash
# Supabaseプロジェクトに接続
# ダッシュボードで「Connect to Supabase」ボタンをクリック
```

### 2. マイグレーションの実行
```sql
-- 以下の順序でSQLファイルを実行
1. create_users_table.sql
2. create_categories_table.sql  
3. create_tags_table.sql
4. create_posts_table.sql
5. create_post_tags_table.sql
6. create_comments_table.sql
7. create_database_functions.sql
```

### 3. 初期データの投入（オプション）
```sql
-- デフォルトカテゴリーの作成
INSERT INTO categories (name, description, color, slug) VALUES
('空港', '空港に関する投稿', '#0072f5', 'airport'),
('旅行', '旅行体験や写真', '#efb23b', 'travel'),
('写真', '写真技術や作品', '#6366f1', 'photography');

-- デフォルトタグの作成
INSERT INTO tags (name, color, slug) VALUES
('国際線ターミナル', '#0072f5', 'international-terminal'),
('離陸', '#efb23b', 'takeoff'),
('建築美', '#36abff', 'architecture'),
('夕焼け', '#f2c464', 'sunset');
```

## 🔧 便利な関数とビュー

### 関数
- `increment_post_view_count(post_uuid)` - 閲覧数インクリメント
- `get_popular_tags(limit_count)` - 人気タグ取得

### ビュー
- `posts_with_stats` - 統計情報付き投稿一覧
- `comments_with_author` - 著者情報付きコメント

## 📝 使用例

### 投稿の作成
```sql
INSERT INTO posts (title, content, author_id, category_id, published)
VALUES ('新しい記事', '記事内容...', user_id, category_id, true);
```

### タグの関連付け
```sql
INSERT INTO post_tags (post_id, tag_id)
VALUES (post_id, tag_id);
```

### AIコメントの追加
```sql
INSERT INTO comments (content, type, post_id, published)
VALUES ('AI生成コメント', 'ai_comment', post_id, true);
```

## 🔍 パフォーマンス最適化

- 適切なインデックスの設定
- 複合インデックスによる検索最適化
- ビューを使用した複雑なクエリの簡素化
- RLSポリシーによる効率的なデータフィルタリング

## 🛠️ 拡張可能性

このスキーマは以下の機能拡張に対応できます：
- いいね機能（likes テーブル）
- ブックマーク機能（bookmarks テーブル）
- フォロー機能（follows テーブル）
- 通知システム（notifications テーブル）
- SEO機能（メタデータの追加）

---

このデータベース設計は、現代的なブログシステムに必要なすべての機能を提供し、将来の拡張にも柔軟に対応できる構造となっています。