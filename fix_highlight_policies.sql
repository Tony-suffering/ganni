-- Drop existing policies for highlight_posts table
DROP POLICY IF EXISTS "Allow public read access to highlight posts" ON public.highlight_posts;
DROP POLICY IF EXISTS "Allow authenticated users to manage highlight posts" ON public.highlight_posts;

-- Create new permissive policies for highlight_posts table
CREATE POLICY "Allow all read access to highlight posts" 
    ON public.highlight_posts 
    FOR SELECT 
    USING (true);

CREATE POLICY "Allow all write access to highlight posts" 
    ON public.highlight_posts 
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Allow all update access to highlight posts" 
    ON public.highlight_posts 
    FOR UPDATE 
    USING (true);

CREATE POLICY "Allow all delete access to highlight posts" 
    ON public.highlight_posts 
    FOR DELETE 
    USING (true);