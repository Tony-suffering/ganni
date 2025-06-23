-- Create photo_scores table
CREATE TABLE IF NOT EXISTS public.photo_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  
  -- スコア詳細
  technical_score INTEGER NOT NULL CHECK (technical_score >= 0 AND technical_score <= 25),
  composition_score INTEGER NOT NULL CHECK (composition_score >= 0 AND composition_score <= 25),
  creativity_score INTEGER NOT NULL CHECK (creativity_score >= 0 AND creativity_score <= 25),
  engagement_score INTEGER NOT NULL CHECK (engagement_score >= 0 AND engagement_score <= 25),
  total_score INTEGER NOT NULL CHECK (total_score >= 0 AND total_score <= 100),
  
  -- レベル情報
  score_level VARCHAR(1) NOT NULL,
  level_description VARCHAR(50) NOT NULL,
  
  -- 詳細フィードバック
  ai_comment TEXT NOT NULL,
  
  -- タイムスタンプ
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 各投稿につき1つの採点結果のみ
  UNIQUE(post_id)
);

-- Enable RLS
ALTER TABLE public.photo_scores ENABLE ROW LEVEL SECURITY;

-- Create policies for photo_scores
CREATE POLICY "Allow public read access to photo scores"
  ON public.photo_scores
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to create photo scores"
  ON public.photo_scores
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update their own photo scores"
  ON public.photo_scores
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.posts 
      WHERE posts.id = photo_scores.post_id 
      AND posts.author_id = auth.uid()
    )
  );

-- Create index for performance
CREATE INDEX idx_photo_scores_post_id ON public.photo_scores(post_id);
CREATE INDEX idx_photo_scores_total_score ON public.photo_scores(total_score DESC);