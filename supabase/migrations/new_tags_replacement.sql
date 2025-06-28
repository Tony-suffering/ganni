-- 新しいタグシステム移行スクリプト
-- 10個の新しい楽しいタグに置き換え

-- 1. 新しいタグデータを追加
INSERT INTO tags (name, color, category) VALUES
  ('ワクワク系', '#ff6b6b', 'emotion'),
  ('癒し系', '#4ecdc4', 'emotion'),
  ('驚き発見', '#ffe66d', 'discovery'),
  ('笑顔になる', '#ff8b94', 'emotion'),
  ('挑戦中', '#a8e6cf', 'activity'),
  ('思い出キープ', '#d4a4eb', 'moment'),
  ('今この瞬間', '#ffd93d', 'moment'),
  ('自分らしさ', '#6c5ce7', 'self'),
  ('みんなで楽しむ', '#fd79a8', 'social'),
  ('ふとした瞬間', '#74b9ff', 'daily')
ON CONFLICT (name) DO NOTHING;

-- 2. 既存タグから新タグへのマッピング（概念的に近いものを選択）
-- 既存の投稿のタグを新しいタグに移行

-- 風景、自然 → 癒し系
UPDATE post_tags 
SET tag_id = (SELECT id FROM tags WHERE name = '癒し系')
WHERE tag_id IN (
  SELECT id FROM tags WHERE name IN ('風景', '自然', '夜景')
);

-- 人物、動物 → 笑顔になる
UPDATE post_tags 
SET tag_id = (SELECT id FROM tags WHERE name = '笑顔になる')
WHERE tag_id IN (
  SELECT id FROM tags WHERE name IN ('人物', '動物')
);

-- 食べ物 → ワクワク系
UPDATE post_tags 
SET tag_id = (SELECT id FROM tags WHERE name = 'ワクワク系')
WHERE tag_id IN (
  SELECT id FROM tags WHERE name = '食べ物'
);

-- 建築、建物 → 驚き発見
UPDATE post_tags 
SET tag_id = (SELECT id FROM tags WHERE name = '驚き発見')
WHERE tag_id IN (
  SELECT id FROM tags WHERE name IN ('建築', '建物')
);

-- 旅行、イベント → みんなで楽しむ
UPDATE post_tags 
SET tag_id = (SELECT id FROM tags WHERE name = 'みんなで楽しむ')
WHERE tag_id IN (
  SELECT id FROM tags WHERE name IN ('旅行', 'イベント')
);

-- アート → 自分らしさ
UPDATE post_tags 
SET tag_id = (SELECT id FROM tags WHERE name = '自分らしさ')
WHERE tag_id IN (
  SELECT id FROM tags WHERE name = 'アート'
);

-- スポーツ → 挑戦中
UPDATE post_tags 
SET tag_id = (SELECT id FROM tags WHERE name = '挑戦中')
WHERE tag_id IN (
  SELECT id FROM tags WHERE name = 'スポーツ'
);

-- 日常、街並み → ふとした瞬間
UPDATE post_tags 
SET tag_id = (SELECT id FROM tags WHERE name = 'ふとした瞬間')
WHERE tag_id IN (
  SELECT id FROM tags WHERE name IN ('日常', '街並み')
);

-- 乗り物 → 今この瞬間
UPDATE post_tags 
SET tag_id = (SELECT id FROM tags WHERE name = '今この瞬間')
WHERE tag_id IN (
  SELECT id FROM tags WHERE name = '乗り物'
);

-- 重複するpost_tagsエントリを削除（同じpost_idに同じtag_idが複数ある場合）
DELETE FROM post_tags a USING post_tags b
WHERE a.id > b.id 
AND a.post_id = b.post_id 
AND a.tag_id = b.tag_id;

-- 3. 古いタグを削除（使用されていないもの）
DELETE FROM tags 
WHERE name IN (
  '風景', '食べ物', '動物', '建築', '人物', 'アート', '自然', '街並み', '乗り物', 'スポーツ', '旅行', '夜景', '建物', 'イベント', '日常'
)
AND id NOT IN (
  SELECT DISTINCT tag_id FROM post_tags WHERE tag_id IS NOT NULL
);

-- 4. マイグレーション完了の確認用クエリ（実行時にコメントアウトを外して確認）
/*
-- 新しいタグの一覧確認
SELECT name, color, category, slug FROM tags ORDER BY name;

-- 各タグの使用回数確認
SELECT t.name, COUNT(pt.post_id) as post_count
FROM tags t
LEFT JOIN post_tags pt ON t.id = pt.tag_id
GROUP BY t.id, t.name
ORDER BY post_count DESC;
*/