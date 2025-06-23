-- Update highlight_posts table policies to be more permissive
-- This migration updates the RLS policies to allow all operations

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access to highlight posts" ON public.highlight_posts;
DROP POLICY IF EXISTS "Allow authenticated users to manage highlight posts" ON public.highlight_posts;

-- Create more permissive policies  
CREATE POLICY "Allow all read access to highlight posts" ON public.highlight_posts FOR SELECT USING (true);
CREATE POLICY "Allow all write access to highlight posts" ON public.highlight_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update access to highlight posts" ON public.highlight_posts FOR UPDATE USING (true);
CREATE POLICY "Allow all delete access to highlight posts" ON public.highlight_posts FOR DELETE USING (true);

-- Add comments for documentation
COMMENT ON POLICY "Allow all read access to highlight posts" ON public.highlight_posts IS 'Allows unrestricted read access to highlight posts';
COMMENT ON POLICY "Allow all write access to highlight posts" ON public.highlight_posts IS 'Allows unrestricted insert access to highlight posts';
COMMENT ON POLICY "Allow all update access to highlight posts" ON public.highlight_posts IS 'Allows unrestricted update access to highlight posts';
COMMENT ON POLICY "Allow all delete access to highlight posts" ON public.highlight_posts IS 'Allows unrestricted delete access to highlight posts';