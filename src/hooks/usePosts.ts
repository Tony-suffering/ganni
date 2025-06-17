import { useState, useEffect, useCallback } from 'react';
import { Post, FilterOptions, Database, Tag, AIComment } from '../types';
import { supabase } from '../supabase';
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
          post_tags ( tags ( id, name, category, color ) ),
          ai_comments ( id, type, content, created_at )
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
      setError('投稿の読み込みに失敗しました。');
      console.error(e);
      // フォールバックとしてモックデータを表示
      setPosts(mockPosts);
      setFilteredPosts(mockPosts.slice(0, POSTS_PER_PAGE));
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();

    const subscription = supabase
      .channel('posts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' },
        () => {
          fetchPosts(); // 変更があったら投稿を再取得
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchPosts]);

  const loadMore = useCallback(() => {
    if (!hasNextPage || loading) return;
    const newPosts = posts.slice(page * POSTS_PER_PAGE, (page + 1) * POSTS_PER_PAGE);
    if (newPosts.length > 0) {
      setFilteredPosts(prev => [...prev, ...newPosts]);
      setPage(prev => prev + 1);
    }
    if ((page + 1) * POSTS_PER_PAGE >= posts.length) {
      setHasNextPage(false);
    }
  }, [page, posts, hasNextPage, loading]);

  const addPost = useCallback(async (newPost: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>) => {
    // 1. ユーザーID取得
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('ユーザーが認証されていません。再ログインしてください。');
    }
    const userId = user.id;

    // 2. 画像アップロード
    const imageFile = await fetch(newPost.imageUrl).then(r => r.blob());
    const imageName = `${userId}/${Date.now()}`;
    const { error: imageError } = await supabase.storage.from('post-images').upload(imageName, imageFile);
    if (imageError) {
      console.error('画像アップロードエラー:', imageError);
      throw new Error('画像アップロードに失敗しました。');
    }

    // 3. 公開URL取得
    const { data: publicUrlData } = supabase.storage.from('post-images').getPublicUrl(imageName);
    const publicUrl = publicUrlData.publicUrl;

    // 4. postsテーブルにinsert
    const { data: postData, error: postError } = await supabase
      .from('posts')
      .insert({
        title: newPost.title,
        image_url: publicUrl,
        user_comment: newPost.userComment,
        ai_description: newPost.aiDescription,
        author_id: userId // 👈 ログインユーザーのIDを正しく設定
      })
      .select()
      .single();

    if (postError) {
      console.error('投稿保存エラー:', postError);
      throw postError; // エラーをそのまま投げて呼び出し元で処理
    }

    // 5. 関連テーブルにinsert
    if (newPost.tags.length > 0) {
        const { error: tagError } = await supabase.from('post_tags').insert(
            newPost.tags.map(tag => ({ post_id: postData.id, tag_id: tag.id }))
        );
        if (tagError) console.error('タグ保存エラー:', tagError); // エラーは記録するが処理は止めない
    }

    if (newPost.aiComments && newPost.aiComments.length > 0) {
        const { error: commentError } = await supabase.from('ai_comments').insert(
            newPost.aiComments.map(comment => ({ post_id: postData.id, type: comment.type, content: comment.content }))
        );
        if (commentError) console.error('AIコメント保存エラー:', commentError);
    }

    // 7. 投稿後に再取得
    await fetchPosts();
  }, [fetchPosts]);

  const filterPosts = useCallback((filters: FilterOptions, searchQuery: string) => {
    let filtered = [...posts];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(query) ||
        post.userComment.toLowerCase().includes(query) ||
        post.aiDescription.toLowerCase().includes(query) ||
        post.tags.some(tag => tag.name.toLowerCase().includes(query))
      );
    }
    if (filters.tags.length > 0) {
      filtered = filtered.filter(post => post.tags.some(tag => filters.tags.includes(tag.id)));
    }
    switch (filters.sortBy) {
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'popular':
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
