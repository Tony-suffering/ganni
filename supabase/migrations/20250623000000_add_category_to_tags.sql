-- tagsテーブルにcategory列を追加
ALTER TABLE tags ADD COLUMN IF NOT EXISTS category text DEFAULT 'その他';