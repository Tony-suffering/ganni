-- タグの初期データを挿入
INSERT INTO tags (name, color, description, slug) VALUES
  ('風景', '#10b981', '美しい風景写真', 'landscape'),
  ('食べ物', '#f59e0b', '美味しそうな食べ物の写真', 'food'),
  ('動物', '#8b5cf6', '可愛い動物の写真', 'animals'),
  ('建築', '#3b82f6', '印象的な建築物', 'architecture'),
  ('人物', '#ec4899', '人物写真', 'people'),
  ('アート', '#f43f5e', 'アート作品', 'art'),
  ('自然', '#22c55e', '自然の写真', 'nature'),
  ('街並み', '#6366f1', '街の風景', 'cityscape'),
  ('乗り物', '#06b6d4', '車や電車などの乗り物', 'vehicles'),
  ('スポーツ', '#ef4444', 'スポーツ関連', 'sports')
ON CONFLICT (slug) DO NOTHING;