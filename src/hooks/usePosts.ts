import { useState, useEffect, useCallback } from 'react';
import { Post, FilterOptions, Database } from '../types';
import { supabase } from '../supabase';
// Dynamic import for mockData to reduce bundle size

type PostWithRelations = Database['public']['Tables']['posts']['Row'] & {
  profiles: { id: string; name: string; avatar_url: string | null; };
  post_tags: Array<{
    tags: Database['public']['Tables']['tags']['Row'];
  }>;
  ai_comments: Array<Database['public']['Tables']['ai_comments']['Row']>;
  photo_scores: Array<Database['public']['Tables']['photo_scores']['Row']>;
};

interface UsePostsReturn {
  posts: Post[];
  allPosts: Post[];
  loading: boolean;
  error: string | null;
  fetchPosts: () => Promise<void>;
  addPost: (postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'author' | 'likeCount' | 'likedByCurrentUser' | 'bookmarkedByCurrentUser' | 'commentCount'>) => Promise<Post | null>;
  updatePost: (postId: string, updates: Partial<Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'author'>>) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  unlikePost: (postId: string) => Promise<void>;
  bookmarkPost: (postId: string) => Promise<void>;
  unbookmarkPost: (postId: string) => Promise<void>;
  filterPosts: (filters: FilterOptions, searchQuery: string) => void;
  hasNextPage: boolean;
  loadMore: () => void;
  isLoadingMore: boolean;
  isFiltering: boolean;
}

// 新規投稿通知を送信する関数
const sendNewPostNotifications = async (postId: string, authorId: string) => {
  try {
    // 新規投稿通知を有効にしているユーザーを取得
    const { data: notificationUsers, error } = await supabase
      .from('user_notification_settings')
      .select('user_id')
      .eq('newPosts', true)
      .neq('user_id', authorId); // 投稿者自身を除外

    if (error) {
      console.error('通知設定の取得に失敗:', error);
      return;
    }

    if (!notificationUsers || notificationUsers.length === 0) {
      return;
    }

    // 各ユーザーに通知を作成
    const notifications = notificationUsers.map(user => ({
      recipient_id: user.user_id,
      sender_id: authorId,
      post_id: postId,
      type: 'new_post' as const,
      content: '新しい投稿がありました',
      is_read: false
    }));

    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (insertError) {
      console.error('通知の作成に失敗:', insertError);
    }
  } catch (error) {
    console.error('新規投稿通知の送信でエラー:', error);
  }
};

export const usePosts = (): UsePostsReturn => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [currentFilters, setCurrentFilters] = useState<FilterOptions>({ tags: [], sortBy: 'newest' });
  const [currentSearchQuery, setCurrentSearchQuery] = useState<string>('');
  const [randomSeed, setRandomSeed] = useState<number>(Date.now());
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);

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
          ai_comments ( id, type, content, created_at ),
          photo_scores ( 
            id, technical_score, composition_score, creativity_score, 
            engagement_score, total_score, score_level, level_description, 
            ai_comment, created_at, updated_at 
          )
        `)
        .order('created_at', { ascending: false });

      if (error || !data) throw error || new Error('No data');

      const { data: { user: currentUser } } = await supabase.auth.getUser();

      // いいね、ブックマーク、コメント、photo_scores情報を並列で取得
      const postIds = (data as PostWithRelations[]).map(post => post.id);
      const [likesData, bookmarksData, commentsData, photoScoresData] = await Promise.all([
        supabase.from('likes').select('post_id, user_id').in('post_id', postIds),
        currentUser ? supabase.from('bookmarks').select('post_id').eq('user_id', currentUser.id) : Promise.resolve({ data: [], error: null }),
        supabase.from('comments').select('post_id').in('post_id', postIds),
        supabase.from('photo_scores').select('*').in('post_id', postIds)
      ]);


      if (likesData.error) throw likesData.error;
      if (bookmarksData.error) throw bookmarksData.error;
      if (commentsData.error) throw commentsData.error;
      if (photoScoresData.error) {
        console.warn('photo_scores取得エラー:', photoScoresData.error);
      }
      
      const bookmarkedPostIds = new Set((bookmarksData.data ?? []).map(b => b.post_id));
      
      // photo_scoresをpost_idでマップ化
      const photoScoresMap = new Map();
      (photoScoresData.data ?? []).forEach(score => {
        photoScoresMap.set(score.post_id, score);
      });

      const formattedPosts = (data as PostWithRelations[]).map(post => {
        const postLikes = (likesData.data ?? []).filter(like => like.post_id === post.id);
        const likeCount = postLikes.length;
        const likedByCurrentUser = !!currentUser && postLikes.some(like => like.user_id === currentUser.id);
        const commentCount = (commentsData.data ?? []).filter(comment => comment.post_id === post.id).length;
        
        // photoScoreを別途取得したデータから設定
        const photoScoreFromJoin = (post as any).photo_scores?.[0];
        const photoScoreFromMap = photoScoresMap.get(post.id);
        const finalPhotoScore = photoScoreFromMap || photoScoreFromJoin;
        
        
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
          bookmarkedByCurrentUser: bookmarkedPostIds.has(post.id),
          commentCount,
          photoScore: finalPhotoScore || undefined
        };
      });


      setPosts(formattedPosts);
      // 初期表示は新しい順で表示（データベースから既にソート済み）
      setFilteredPosts(formattedPosts.slice(0, POSTS_PER_PAGE));
      setHasNextPage(formattedPosts.length > POSTS_PER_PAGE);
      setLoading(false);
    } catch (e: any) {
      setError(`投稿の読み込みに失敗しました: ${e.message}`);
      console.error(e);
      setPosts([]); // エラー時は空にする
      // Dynamic import for mockData
      import('../data/mockData').then(({ mockPosts }) => {
        setFilteredPosts(mockPosts.slice(0, POSTS_PER_PAGE));
      });
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();

    // チャンネル名にタイムスタンプを追加してユニークにする
    const channelName = `realtime_posts_and_likes_${Date.now()}_${Math.random()}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, async (payload) => {
        console.log('Posts change received!', payload);
        await fetchPosts();
        // データ更新後、現在のフィルター状態を維持
        if (currentFilters || currentSearchQuery) {
          setTimeout(() => {
            filterPosts(currentFilters, currentSearchQuery);
          }, 100);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, async (payload) => {
        console.log('Likes change received!', payload);
        await fetchPosts();
        // データ更新後、現在のフィルター状態を維持
        if (currentFilters || currentSearchQuery) {
          setTimeout(() => {
            filterPosts(currentFilters, currentSearchQuery);
          }, 100);
        }
      })
      .subscribe();

    return () => {
      // チャンネルを適切にクリーンアップ
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []); // 空の依存配列に戻して初回のみ実行

  const loadMore = useCallback(() => {
    if (!hasNextPage || loading || isLoadingMore) return;
    
    setIsLoadingMore(true);
    console.log('LoadMore実行:', { page, hasNextPage, filteredPostsLength: filteredPosts.length });
    
    try {
      // 現在表示中の投稿数を確認
      const currentDisplayed = filteredPosts.length;
      const nextPageEnd = currentDisplayed + POSTS_PER_PAGE;
      
      // 全投稿を再計算
      let allFiltered = [...posts];
      
      // 検索クエリによるフィルタリング
      if (currentSearchQuery.trim()) {
        const query = currentSearchQuery.toLowerCase();
        allFiltered = allFiltered.filter(post =>
          post.title.toLowerCase().includes(query) ||
          post.userComment.toLowerCase().includes(query) ||
          post.aiDescription.toLowerCase().includes(query)
        );
      }
      
      // タグによるフィルタリング
      if (currentFilters.tags.length > 0) {
        allFiltered = allFiltered.filter(post =>
          post.tags.some(tag => currentFilters.tags.includes(tag.id))
        );
      }
      
      // ソート処理
      switch (currentFilters.sortBy) {
        case 'oldest':
          allFiltered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          break;
        case 'popular':
          allFiltered.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
          break;
        case 'random':
          allFiltered.sort((a, b) => {
            const seedA = randomSeed + a.id.charCodeAt(0);
            const seedB = randomSeed + b.id.charCodeAt(0);
            return seededRandom(seedA) - seededRandom(seedB);
          });
          break;
        case 'newest':
        default:
          allFiltered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
      }
      
      if (allFiltered.length > nextPageEnd) {
        setFilteredPosts(allFiltered.slice(0, nextPageEnd));
        setPage(prev => prev + 1);
        setHasNextPage(nextPageEnd < allFiltered.length);
      } else {
        setFilteredPosts(allFiltered);
        setHasNextPage(false);
      }
      
      console.log('LoadMore完了:', { newLength: allFiltered.slice(0, nextPageEnd).length, hasNextPage: nextPageEnd < allFiltered.length });
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, posts, hasNextPage, loading, isLoadingMore, currentFilters, currentSearchQuery, randomSeed, filteredPosts.length]);

  const addPost = useCallback(async (newPostInput: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'author' | 'likeCount' | 'likedByCurrentUser' | 'bookmarkedByCurrentUser' | 'commentCount'>) => {
    try {
      // 1. ユーザーID取得
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('ユーザーが認証されていません。再ログインしてください。');
      }
      const userId = user.id;

      // 2. 画像アップロード（最適化版）
      const imageFile = await fetch(newPostInput.imageUrl).then(r => r.blob());
      
      // ファイルサイズチェック（5MB制限）
      if (imageFile.size > 5 * 1024 * 1024) {
        throw new Error('ファイルサイズが大きすぎます。5MB以下の画像をアップロードしてください。');
      }
      
      const imageName = `${userId}/${Date.now()}`;
      const { error: imageError } = await supabase.storage.from('post-images').upload(imageName, imageFile, {
        cacheControl: '86400', // 24時間キャッシュでパフォーマンス改善
        upsert: false
      });
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
        const { error: tagError } = await supabase.from('post_tags').insert(
          newPostInput.tags.map(tag => ({ post_id: postData.id, tag_id: tag.id }))
        );
        
        if (tagError) {
          console.error('Error saving post tags:', tagError);
          throw new Error('タグの保存に失敗しました');
        }
      }

      if (newPostInput.aiComments && newPostInput.aiComments.length > 0) {
        await supabase.from('ai_comments').insert(
          newPostInput.aiComments.map(comment => ({ post_id: postData.id, type: comment.type, content: comment.content }))
        );
      }

      // 6. 写真スコアを保存
      if (newPostInput.photoScore) {
        const { error: scoreError } = await supabase.from('photo_scores').insert({
          post_id: postData.id,
          technical_score: newPostInput.photoScore.technical_score,
          composition_score: newPostInput.photoScore.composition_score,
          creativity_score: newPostInput.photoScore.creativity_score,
          engagement_score: newPostInput.photoScore.engagement_score,
          total_score: newPostInput.photoScore.total_score,
          score_level: newPostInput.photoScore.score_level,
          level_description: newPostInput.photoScore.level_description,
          ai_comment: newPostInput.photoScore.ai_comment
        });
        
        if (scoreError) {
          console.error('Error saving photo score:', scoreError);
          // 写真スコアの保存に失敗してもエラーは投げない（投稿自体は成功させる）
        }
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
        bookmarkedByCurrentUser: false,
        commentCount: 0
      };

      // 新規投稿通知を送信
      try {
        await sendNewPostNotifications(postData.id, userId);
      } catch (error) {
        console.log('新規投稿通知の送信に失敗:', error);
      }

      await fetchPosts();
      setTimeout(fetchPosts, 500);
      return newPost;
    } catch (error) {
      console.error("Failed to add post:", error);
      return null;
    }
  }, [fetchPosts]);

  // シードベースのランダム関数（通常の関数として定義）
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const filterPosts = useCallback((filters: FilterOptions, searchQuery: string) => {
    // フィルタリング開始
    setIsFiltering(true);
    
    // 現在のフィルター・検索クエリを保存
    setCurrentFilters(filters);
    setCurrentSearchQuery(searchQuery);
    
    // ランダムソートの場合のみ、フィルターが変更された時に新しいシードを生成
    if (filters.sortBy === 'random' && currentFilters.sortBy !== 'random') {
      setRandomSeed(Date.now());
    }
    
    // 少し遅延させてフィルタリング感を演出
    setTimeout(() => {
      let filtered = [...posts];
    
    // 検索クエリによるフィルタリング
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(query) ||
        post.userComment.toLowerCase().includes(query) ||
        post.aiDescription.toLowerCase().includes(query)
      );
    }
    
    // タグによるフィルタリング
    if (filters.tags.length > 0) {
      filtered = filtered.filter(post =>
        post.tags.some(tag => filters.tags.includes(tag.id))
      );
    }
    
    // ソート処理
    switch (filters.sortBy) {
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'popular':
        filtered.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
        break;
      case 'random':
        // シードベースの安定したランダムソート
        filtered.sort((a, b) => {
          const seedA = randomSeed + a.id.charCodeAt(0);
          const seedB = randomSeed + b.id.charCodeAt(0);
          return seededRandom(seedA) - seededRandom(seedB);
        });
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }
    
    console.log(`フィルター適用: ${filters.sortBy}, 件数: ${filtered.length}, シード: ${randomSeed}`);
    if (filtered.length > 0) {
      console.log('最初の投稿:', filtered[0].title, filtered[0].createdAt);
    }
    
      setFilteredPosts(filtered.slice(0, POSTS_PER_PAGE));
      setPage(1);
      setHasNextPage(filtered.length > POSTS_PER_PAGE);
      
      // フィルタリング完了
      setIsFiltering(false);
    }, 150); // 150ms の遅延でスムーズな感じを演出
  }, [posts, randomSeed, currentFilters.sortBy]);

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
    
    // 4. 写真スコア更新（既存があれば更新、なければ挿入）
    if (updates.photoScore) {
      const { data: existingScore } = await supabase
        .from('photo_scores')
        .select('id')
        .eq('post_id', postId)
        .single();
      
      if (existingScore) {
        // 既存スコア更新
        await supabase.from('photo_scores').update({
          technical_score: updates.photoScore.technical_score,
          composition_score: updates.photoScore.composition_score,
          creativity_score: updates.photoScore.creativity_score,
          engagement_score: updates.photoScore.engagement_score,
          total_score: updates.photoScore.total_score,
          score_level: updates.photoScore.score_level,
          level_description: updates.photoScore.level_description,
          ai_comment: updates.photoScore.ai_comment
        }).eq('post_id', postId);
      } else {
        // 新規スコア挿入
        await supabase.from('photo_scores').insert({
          post_id: postId,
          technical_score: updates.photoScore.technical_score,
          composition_score: updates.photoScore.composition_score,
          creativity_score: updates.photoScore.creativity_score,
          engagement_score: updates.photoScore.engagement_score,
          total_score: updates.photoScore.total_score,
          score_level: updates.photoScore.score_level,
          level_description: updates.photoScore.level_description,
          ai_comment: updates.photoScore.ai_comment
        });
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

  return { posts: filteredPosts, allPosts: posts, loading, error, fetchPosts, addPost, updatePost, deletePost, likePost, unlikePost, bookmarkPost, unbookmarkPost, filterPosts, hasNextPage, loadMore, isLoadingMore, isFiltering };
};
