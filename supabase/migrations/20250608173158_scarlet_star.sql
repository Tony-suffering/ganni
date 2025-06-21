/*
  # データベース関数とビューの作成

  1. Functions
    - `get_post_with_details()` - 投稿の詳細情報を取得
    - `increment_post_view_count()` - 投稿閲覧数をインクリメント
    - `get_popular_tags()` - 人気タグを取得

  2. Views
    - `posts_with_stats` - 投稿統計情報付きビュー
    - `comments_with_author` - 著者情報付きコメントビュー

  3. Notes
    - パフォーマンス最適化のための関数とビュー
    - 統計情報の効率的な取得
*/

-- Function to increment post view count
CREATE OR REPLACE FUNCTION increment_post_view_count(post_uuid uuid)
RETURNS void AS $$
BEGIN
  UPDATE posts 
  SET view_count = view_count + 1 
  WHERE id = post_uuid AND published = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get popular tags
CREATE OR REPLACE FUNCTION get_popular_tags(limit_count integer DEFAULT 10)
RETURNS TABLE (
  tag_id uuid,
  tag_name text,
  tag_color text,
  post_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.color,
    COUNT(pt.post_id) as post_count
  FROM tags t
  LEFT JOIN post_tags pt ON t.id = pt.tag_id
  LEFT JOIN posts p ON pt.post_id = p.id AND p.published = true
  GROUP BY t.id, t.name, t.color
  ORDER BY post_count DESC, t.name
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for posts with statistics
CREATE OR REPLACE VIEW posts_with_stats AS
SELECT 
  p.*,
  u.name as author_name,
  u.avatar_url as author_avatar,
  c.name as category_name,
  c.color as category_color,
  COUNT(DISTINCT co.id) as comment_count,
  COUNT(DISTINCT pt.tag_id) as tag_count,
  ARRAY_AGG(
    DISTINCT jsonb_build_object(
      'id', t.id,
      'name', t.name,
      'color', t.color
    )
  ) FILTER (WHERE t.id IS NOT NULL) as tags
FROM posts p
LEFT JOIN users u ON p.author_id = u.id
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN comments co ON p.id = co.post_id AND co.published = true
LEFT JOIN post_tags pt ON p.id = pt.post_id
LEFT JOIN tags t ON pt.tag_id = t.id
GROUP BY p.id, u.name, u.avatar_url, c.name, c.color;

-- View for comments with author information
CREATE OR REPLACE VIEW comments_with_author AS
SELECT 
  c.*,
  u.name as author_name,
  u.avatar_url as author_avatar,
  p.title as post_title,
  p.published as post_published
FROM comments c
LEFT JOIN users u ON c.author_id = u.id
LEFT JOIN posts p ON c.post_id = p.id;

-- Grant access to views
GRANT SELECT ON posts_with_stats TO public;
GRANT SELECT ON comments_with_author TO public;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION increment_post_view_count(uuid) TO public;
GRANT EXECUTE ON FUNCTION get_popular_tags(integer) TO public;