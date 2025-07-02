-- Test script to verify likes table functionality
-- Run this in your Supabase SQL editor

-- 1. Check if the likes table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'likes'
) AS likes_table_exists;

-- 2. Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'likes'
ORDER BY ordinal_position;

-- 3. Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'likes' AND schemaname = 'public';

-- 4. Check RLS policies
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'likes' AND schemaname = 'public';

-- 5. Test basic operations (only run if you're authenticated)
-- INSERT INTO public.likes (post_id, user_id) 
-- VALUES ('00000000-0000-0000-0000-000000000001', auth.uid())
-- ON CONFLICT (post_id, user_id) DO NOTHING;

-- SELECT * FROM public.likes WHERE user_id = auth.uid() LIMIT 1;

-- DELETE FROM public.likes WHERE post_id = '00000000-0000-0000-0000-000000000001' AND user_id = auth.uid();