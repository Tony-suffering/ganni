-- 不足している関数を追加

-- チェーンレベル計算関数
CREATE OR REPLACE FUNCTION calculate_inspiration_chain_level(source_post_id UUID)
RETURNS INTEGER AS $$
DECLARE
    max_level INTEGER;
BEGIN
    -- 元投稿から派生したインスピレーションの最大レベルを取得
    SELECT COALESCE(MAX(chain_level), 0) INTO max_level
    FROM inspirations
    WHERE source_post_id = $1;
    
    -- 新しいチェーンレベルは最大レベル + 1
    RETURN max_level + 1;
END;
$$ LANGUAGE plpgsql;

-- getInspirationTypeLabel関数を追加（PostCard.tsxで使用）
CREATE OR REPLACE FUNCTION get_inspiration_type_label(inspiration_type TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN CASE inspiration_type
        WHEN 'direct' THEN '直接的'
        WHEN 'style' THEN 'スタイル'
        WHEN 'concept' THEN 'コンセプト'
        WHEN 'technique' THEN '技法'
        WHEN 'composition' THEN '構図'
        WHEN 'mood' THEN 'ムード'
        ELSE inspiration_type
    END;
END;
$$ LANGUAGE plpgsql;