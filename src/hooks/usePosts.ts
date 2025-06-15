import { useState, useEffect, useCallback } from 'react';
import { Post, FilterOptions, Database, Tag, AIComment } from '../types';
import { supabase } from '../lib/supabase';
import { mockPosts } from '../data/mockData';

type PostWithRelations = Database['public']['Tables']['posts']['Row'] & {
  profiles: Database['public']['Tables']['profiles']['Row'];
  post_tags: Array<{
    tags: Database['public']['Tables']['tags']['Row'];
  }>;
  ai_comments: Array<Database['public']['Tables']['ai_comments']['Row']>;
};

export const usePosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);

  const POSTS_PER_PAGE = 6;

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:author_id (name, avatar_url),
          post_tags (
            tags (
              id,
              name,
              category,
              color
            )
          ),
          ai_comments (
            id,
            type,
            content,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error || !data) throw error || new Error('No data');

      const formattedPosts = (data as PostWithRelations[]).map(post => ({
        id: post.id,
        title: post.title,
        imageUrl: post.image_url,
        userComment: post.user_comment,
        aiDescription: post.ai_description,
        tags: (post.post_tags ?? []).map(pt => pt.tags),
        createdAt: post.created_at,
        updatedAt: post.updated_at,
        author: {
          name: post.profiles?.name ?? '',
          avatar: post.profiles?.avatar_url ?? ''
        },
        aiComments: (post.ai_comments ?? []).map(comment => ({
          id: comment.id,
          type: comment.type,
          content: comment.content,
          createdAt: comment.created_at
        }))
      }));

      setPosts(formattedPosts);
      setFilteredPosts(formattedPosts.slice(0, POSTS_PER_PAGE));
      setLoading(false);
    } catch (e) {
      setError('Supabase fetch failed');
      setPosts(mockPosts);
      setFilteredPosts(mockPosts.slice(0, POSTS_PER_PAGE));
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('posts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts'
        },
        () => {
          fetchPosts(); // Refresh posts when changes occur
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchPosts]);

  const loadMore = useCallback(() => {
    if (!hasNextPage || loading) return;

    const startIndex = page * POSTS_PER_PAGE;
    const endIndex = startIndex + POSTS_PER_PAGE;
    const newPosts = posts.slice(startIndex, endIndex);

    if (newPosts.length > 0) {
      setFilteredPosts(prev => [...prev, ...newPosts]);
      setPage(prev => prev + 1);
    }

    if (endIndex >= posts.length) {
      setHasNextPage(false);
    }
  }, [page, posts, hasNextPage, loading]);

  const addPost = useCallback(async (newPost: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // 1. ユーザーID取得
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user?.id) {
        alert('ユーザー情報の取得に失敗しました。再ログインしてください。');
        throw userError || new Error('No user');
      }
      const userId = userData.user.id;

      // 2. 画像アップロード
      const imageFile = await fetch(newPost.imageUrl).then(r => r.blob());
      const imageName = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const { data: imageData, error: imageError } = await supabase.storage
        .from('post-images')
        .upload(imageName, imageFile);
      if (imageError) {
        alert('画像アップロードに失敗しました: ' + imageError.message);
        throw imageError;
      }

      // 3. 公開URL取得
      const { data: publicUrlData } = supabase.storage
        .from('post-images')
        .getPublicUrl(imageName);
      const publicUrl = publicUrlData.publicUrl;

      // 4. postsテーブルにinsert
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert({
          title: newPost.title,
          image_url: publicUrl,
          user_comment: newPost.userComment,
          ai_description: newPost.aiDescription,
          author_id: userId
        })
        .select()
        .single();
      if (postError) {
        alert('投稿の保存に失敗しました: ' + postError.message);
        throw postError;
      }

      // 5. post_tagsテーブルにinsert
      if (newPost.tags.length > 0) {
        const { error: tagError } = await supabase
          .from('post_tags')
          .insert(
            newPost.tags.map(tag => ({
              post_id: postData.id,
              tag_id: tag.id
            }))
          );
        if (tagError) {
          alert('タグの保存に失敗しました: ' + tagError.message);
          throw tagError;
        }
      }

      // 6. ai_commentsテーブルにinsert
      if (newPost.aiComments && newPost.aiComments.length > 0) {
        const { error: commentError } = await supabase
          .from('ai_comments')
          .insert(
            newPost.aiComments.map(comment => ({
              post_id: postData.id,
              type: comment.type,
              content: comment.content
            }))
          );
        if (commentError) {
          alert('AIコメントの保存に失敗しました: ' + commentError.message);
          throw commentError;
        }
      }

      // 7. 投稿後に再取得
      await fetchPosts();
    } catch (error) {
      setError('投稿に失敗しました');
      console.error('投稿エラー:', error);
      throw error;
    }
  }, [fetchPosts]);

  const filterPosts = useCallback((filters: FilterOptions, searchQuery: string) => {
    let filtered = [...posts];

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(query) ||
        post.userComment.toLowerCase().includes(query) ||
        post.aiDescription.toLowerCase().includes(query) ||
        post.tags.some(tag => tag.name.toLowerCase().includes(query))
      );
    }

    // Tag filters
    if (filters.tags.length > 0) {
      filtered = filtered.filter(post =>
        post.tags.some(tag => filters.tags.includes(tag.id))
      );
    }

    // Sort
    switch (filters.sortBy) {
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'popular':
        // Sort by number of AI comments
        filtered.sort((a, b) => (b.aiComments?.length || 0) - (a.aiComments?.length || 0));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    setFilteredPosts(filtered.slice(0, POSTS_PER_PAGE));
    setPage(1);
    setHasNextPage(filtered.length > POSTS_PER_PAGE);
  }, [posts]);

  return {
    posts: filteredPosts,
    loading,
    error,
    hasNextPage,
    loadMore,
    addPost,
    filterPosts,
    refetch: fetchPosts,
  };
};