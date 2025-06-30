-- Create highlight_posts table for storing AI-selected highlight posts
CREATE TABLE IF NOT EXISTS public.highlight_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    highlight_score DECIMAL(5,2) NOT NULL CHECK (highlight_score >= 0 AND highlight_score <= 1),
    highlight_reason TEXT NOT NULL,
    display_order INTEGER NOT NULL CHECK (display_order >= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_highlight_posts_display_order ON public.highlight_posts(display_order);
CREATE INDEX IF NOT EXISTS idx_highlight_posts_post_id ON public.highlight_posts(post_id);
CREATE INDEX IF NOT EXISTS idx_highlight_posts_created_at ON public.highlight_posts(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE public.highlight_posts ENABLE ROW LEVEL SECURITY;

-- Allow public read access to highlight posts
CREATE POLICY "Allow public read access to highlight posts" ON public.highlight_posts
    FOR SELECT USING (true);

-- Allow authenticated users to insert/update/delete highlight posts (for AI service)
CREATE POLICY "Allow authenticated users to manage highlight posts" ON public.highlight_posts
    FOR ALL USING (auth.role() = 'authenticated');

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_highlight_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_highlight_posts_updated_at_trigger
    BEFORE UPDATE ON public.highlight_posts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_highlight_posts_updated_at();

-- Add comment for documentation
COMMENT ON TABLE public.highlight_posts IS 'Stores AI-selected highlight posts with scoring and ranking information';
COMMENT ON COLUMN public.highlight_posts.highlight_score IS 'AI-calculated score between 0.0 and 1.0 indicating post quality/engagement';
COMMENT ON COLUMN public.highlight_posts.highlight_reason IS 'Human-readable reason why this post was highlighted';
COMMENT ON COLUMN public.highlight_posts.display_order IS 'Order in which highlights should be displayed (1-based)';