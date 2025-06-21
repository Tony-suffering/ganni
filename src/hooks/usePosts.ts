import { useState, useEffect, useCallback } from 'react';
import { Post, FilterOptions, Database, Tag, AIComment } from '../types';
import { supabase } from '../supabase';
import { mockPosts } from '../data/mockData';

type PostWithRelations = Database['public']['Tables']['posts']['Row'] & {
  profiles: { id: string; name: string; avatar_url: string | null; };
  post_tags: Array<{
    tags: Database['public']['Tables']['tags']['Row'];
  }>;
  ai_comments: Array<Database['public']['Tables']['ai_comments']['Row']>;
};

interface UsePostsReturn {
  posts: Post[];
  loading: boolean;
  error: string | null;
  fetchPosts: () => Promise<void>;
  addPost: (postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'author' | 'likeCount' | 'likedByCurrentUser' | 'bookmarkedByCurrentUser'>) => Promise<Post | null>;
  deletePost: (postId: string) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  unlikePost: (postId: string) => Promise<void>;
  bookmarkPost: (postId: string) => Promise<void>;
  unbookmarkPost: (postId: string) => Promise<void>;
  filterPosts: (filters: FilterOptions, searchQuery: string) => void;
  hasNextPage: boolean;
  loadMore: () => void;
}

export const usePosts = (): UsePostsReturn => {
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
          profiles:author_id (id, name, avatar_url),
          post_tags ( tags ( id, name, category, color ) ),
          ai_comments ( id, type, content, created_at )
        `)
        .order('created_at', { ascending: false });

      if (error || !data) throw error || new Error('No data');

      const { data: { user: currentUser } } = await supabase.auth.getUser();

      // いいねとブックマーク情報を並列で取得
      const postIds = (data as PostWithRelations[]).map(post => post.id);
      const [likesData, bookmarksData] = await Promise.all([
        supabase.from('likes').select('post_id, user_id').in('post_id', postIds),
        currentUser ? supabase.from('bookmarks').select('post_id').eq('user_id', currentUser.id) : Promise.resolve({ data: [], error: null })
      ]);

      if (likesData.error) throw likesData.error;
      if (bookmarksData.error) throw bookmarksData.error;
      
      const bookmarkedPostIds = new Set((bookmarksData.data ?? []).map(b => b.post_id));

      const formattedPosts = (data as PostWithRelations[]).map(post => {
        const postLikes = (likesData.data ?? []).filter(like => like.post_id === post.id);
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
            id: post.profiles?.id ?? '',
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
          likedByCurrentUser,
          bookmarkedByCurrentUser: bookmarkedPostIds.has(post.id)
        };
      });

      setPosts(formattedPosts);
      setFilteredPosts(formattedPosts.slice(0, POSTS_PER_PAGE));
      setLoading(false);
    } catch (e: any) {
      setError(`投稿の読み込みに失敗しました: ${e.message}`);
      console.error(e);
      setPosts([]); // エラー時は空にする
      setFilteredPosts(mockPosts.slice(0, POSTS_PER_PAGE));
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();

    const channel = supabase
      .channel('realtime_posts_and_likes')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        // console.log('Change received!', payload);
        fetchPosts(); // 変更があったら投稿を再取得
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

  const addPost = useCallback(async (newPostInput: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'author' | 'likeCount' | 'likedByCurrentUser' | 'bookmarkedByCurrentUser'>) => {
    try {
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
          id: userId,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'ユーザー',
          avatar: user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata?.name || user.email?.split('@')[0] || 'ユーザー')}&background=0072f5&color=fff`
        },
        aiComments: newPostInput.aiComments || [],
        likeCount: 0,
        likedByCurrentUser: false,
        bookmarkedByCurrentUser: false
      };
      await fetchPosts();
      setTimeout(fetchPosts, 500);
      return newPost;
    } catch (error) {
      console.error("Failed to add post:", error);
      return null;
    }
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
    setPosts(prev => prev.filter(p => p.id !== postId)); // Optimistic update
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) {
      console.error("Error deleting post:", error);
      fetchPosts(); // Revert on error
    }
  }, [fetchPosts]);

  // いいね追加
  const likePost = useCallback(async (postId: string) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return;
    
    // いいねを追加
    await supabase.from('likes').insert({ post_id: postId, user_id: user.id });
    
    // 投稿者IDを取得して通知を作成
    const { data: postData } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', postId)
      .single();
    
    if (postData && postData.author_id !== user.id) {
      // 通知作成
      const { createNotification } = await import('../utils/notifications');
      await createNotification({
        recipientId: postData.author_id,
        senderId: user.id,
        postId: postId,
        type: 'like'
      });
    }
    
    await fetchPosts();
  }, [fetchPosts]);

  // いいね解除
  const unlikePost = useCallback(async (postId: string) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return;
    
    // いいねを削除
    await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id);
    
    // 投稿者IDを取得して通知を削除
    const { data: postData } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', postId)
      .single();
    
    if (postData && postData.author_id !== user.id) {
      // 通知削除
      const { deleteNotification } = await import('../utils/notifications');
      await deleteNotification({
        recipientId: postData.author_id,
        senderId: user.id,
        postId: postId,
        type: 'like'
      });
    }
    
    await fetchPosts();
  }, [fetchPosts]);

  const bookmarkPost = useCallback(async (postId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setPosts(prev => prev.map(p => p.id === postId ? { ...p, bookmarkedByCurrentUser: true } : p));
    const { error } = await supabase.from('bookmarks').insert({ post_id: postId, user_id: user.id });
    if (error) {
      console.error("Error bookmarking post:", error);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, bookmarkedByCurrentUser: false } : p));
    }
  }, []);

  const unbookmarkPost = useCallback(async (postId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, bookmarkedByCurrentUser: false } : p));
    const { error } = await supabase.from('bookmarks').delete().match({ post_id: postId, user_id: user.id });
     if (error) {
      console.error("Error unbookmarking post:", error);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, bookmarkedByCurrentUser: true } : p));
    }
  }, []);

  return { posts: filteredPosts, loading, error, fetchPosts, addPost, deletePost, likePost, unlikePost, bookmarkPost, unbookmarkPost, filterPosts, hasNextPage, loadMore };
};
