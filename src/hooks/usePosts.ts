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

      // 追加: いいね情報取得
      // 1. 全投稿IDリスト
      const postIds = (data as PostWithRelations[]).map(post => post.id);
      // 2. likesテーブルから件数取得
      const { data: likesData, error: likesError } = await supabase
        .from('likes')
        .select('post_id, user_id');
      if (likesError) throw likesError;
      // 3. ログインユーザー取得
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      // 4. 投稿ごとにlikeCount, likedByCurrentUserを付与
      const formattedPosts = (data as PostWithRelations[]).map(post => {
        const postLikes = (likesData ?? []).filter(like => like.post_id === post.id);
        const likeCount = postLikes.length;
        const likedByCurrentUser = !!currentUser && postLikes.some(like => like.user_id === currentUser.id);
        return {
          id: post.id,
          title: post.title,
          imageUrl: post.image_url,
          userComment: post.user_comment,
          aiDescription: post.ai_description,
          imageAIDescription: (post as any).imageAIDescription || '',
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
          })),
          likeCount,
          likedByCurrentUser
        };
      });

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

  const addPost = useCallback(async (newPostInput: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>) => {
    // 1. ユーザーID取得
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('ユーザーが認証されていません。再ログインしてください。');
    }
    const userId = user.id;

    // 2. 画像アップロード
    const imageFile = await fetch(newPostInput.imageUrl).then(r => r.blob());
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
        title: newPostInput.title,
        image_url: publicUrl,
        user_comment: newPostInput.userComment ?? '',
        ai_description: newPostInput.aiDescription,
        author_id: userId // ログインユーザーのIDを正しく設定
        // imageAIDescriptionはDBに保存しない
      })
      .select()
      .single();

    if (postError) {
      console.error('投稿保存エラー:', postError);
      throw postError; // エラーをそのまま投げて呼び出し元で処理
    }

    // 5. 関連テーブルにinsert
    if (newPostInput.tags.length > 0) {
      await supabase.from('post_tags').insert(
        newPostInput.tags.map(tag => ({ post_id: postData.id, tag_id: tag.id }))
      );
    }

    if (newPostInput.aiComments && newPostInput.aiComments.length > 0) {
      await supabase.from('ai_comments').insert(
        newPostInput.aiComments.map(comment => ({ post_id: postData.id, type: comment.type, content: comment.content }))
      );
    }

    // 投稿データを返す
    const newPost: Post = {
      id: postData.id,
      title: postData.title,
      imageUrl: publicUrl,
      userComment: postData.user_comment,
      aiDescription: postData.ai_description,
      imageAIDescription: newPostInput.imageAIDescription || '',
      tags: newPostInput.tags,
      createdAt: postData.created_at,
      updatedAt: postData.updated_at,
      author: {
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'ユーザー',
        avatar: user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata?.name || user.email?.split('@')[0] || 'ユーザー')}&background=0072f5&color=fff`
      },
      aiComments: newPostInput.aiComments || [],
      likeCount: 0,
      likedByCurrentUser: false
    };
    await fetchPosts();
    setTimeout(fetchPosts, 500);
    return newPost;
  }, [fetchPosts]);

  const filterPosts = useCallback((filters: FilterOptions, searchQuery: string) => {
    let filtered = [...posts];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(query) ||
        post.userComment.toLowerCase().includes(query) ||
        post.aiDescription.toLowerCase().includes(query)
      );
    }
    switch (filters.sortBy) {
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'popular':
        filtered.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
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

  // 投稿編集
  const updatePost = useCallback(async (postId: string, updates: Partial<Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'author'>>) => {
    // 1. postsテーブル更新
    const { error: postError } = await supabase.from('posts').update({
      title: updates.title,
      user_comment: updates.userComment,
      ai_description: updates.aiDescription
    }).eq('id', postId);
    if (postError) throw postError;

    // 2. タグ更新（post_tags）
    if (updates.tags) {
      // 既存タグ削除
      await supabase.from('post_tags').delete().eq('post_id', postId);
      // 新タグ挿入
      if (updates.tags.length > 0) {
        await supabase.from('post_tags').insert(updates.tags.map(tag => ({ post_id: postId, tag_id: tag.id })));
      }
    }
    // 3. AIコメント更新（全削除→再挿入）
    if (updates.aiComments) {
      await supabase.from('ai_comments').delete().eq('post_id', postId);
      if (updates.aiComments.length > 0) {
        await supabase.from('ai_comments').insert(updates.aiComments.map(comment => ({ post_id: postId, type: comment.type, content: comment.content })));
      }
    }
    await fetchPosts();
  }, [fetchPosts]);

  // 投稿削除
  const deletePost = useCallback(async (postId: string) => {
    // 関連テーブルも削除
    await supabase.from('ai_comments').delete().eq('post_id', postId);
    await supabase.from('post_tags').delete().eq('post_id', postId);
    await supabase.from('posts').delete().eq('id', postId);
    await fetchPosts();
  }, [fetchPosts]);

  // いいね追加
  const likePost = useCallback(async (postId: string) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return;
    await supabase.from('likes').insert({ post_id: postId, user_id: user.id });
    await fetchPosts();
  }, [fetchPosts]);

  // いいね解除
  const unlikePost = useCallback(async (postId: string) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return;
    await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id);
    await fetchPosts();
  }, [fetchPosts]);

  return {
    posts: filteredPosts,
    loading,
    error,
    hasNextPage,
    loadMore,
    addPost,
    filterPosts,
    refetch: fetchPosts,
    updatePost,
    deletePost,
    likePost,
    unlikePost,
  };
};
