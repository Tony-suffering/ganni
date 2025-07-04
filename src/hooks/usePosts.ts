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
  addPost: (postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'author' | 'likeCount' | 'likedByCurrentUser' | 'bookmarkedByCurrentUser' | 'commentCount'> & { inspirationSourceId?: string | null; inspirationType?: string; inspirationNote?: string }) => Promise<Post | null>;
  updatePost: (postId: string, updates: Partial<Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'author'>>) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  unlikePost: (postId: string) => Promise<void>;
  bookmarkPost: (postId: string) => Promise<void>;
  unbookmarkPost: (postId: string) => Promise<void>;
  hasNextPage: boolean;
  loadMore: () => void;
  isLoadingMore: boolean;
}

// 新規投稿通知を送信する関数
const sendNewPostNotifications = async (postId: string, authorId: string) => {
  try {
    // user_notification_settingsテーブルが存在しない可能性があるため、エラーハンドリングを改善
    console.log('📨 新規投稿通知の送信を試行中...');
    
    // 新規投稿通知を有効にしているユーザーを取得
    const { data: notificationUsers, error } = await supabase
      .from('user_notification_settings')
      .select('user_id')
      .eq('newPosts', true)
      .neq('user_id', authorId); // 投稿者自身を除外

    if (error) {
      // テーブルが存在しない場合は警告のみで処理を継続
      console.warn('通知設定の取得に失敗 (テーブルが存在しない可能性があります):', error);
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
    } else {
      console.log('✅ 通知を送信しました:', notifications.length, '件');
    }
  } catch (error) {
    console.warn('新規投稿通知の送信でエラー (処理は継続):', error);
  }
};

export const usePosts = (): UsePostsReturn => {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [displayedPosts, setDisplayedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const POSTS_PER_PAGE = 12; // 1ページあたり12枚表示（デスクトップ：4x3グリッド）

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
            ai_comment, image_analysis, created_at, updated_at 
          )
        `)
        .order('created_at', { ascending: false });

      if (error || !data) throw error || new Error('No data');

      const { data: { user: currentUser } } = await supabase.auth.getUser();

      // いいね、ブックマーク、コメント、photo_scores、inspirations情報を並列で取得
      const postIds = (data as PostWithRelations[]).map(post => post.id);
      const [likesData, bookmarksData, commentsData, photoScoresData, inspirationsData] = await Promise.all([
        supabase.from('likes').select('post_id, user_id').in('post_id', postIds),
        currentUser ? supabase.from('bookmarks').select('post_id').eq('user_id', currentUser.id) : Promise.resolve({ data: [], error: null }),
        supabase.from('comments').select('post_id').in('post_id', postIds),
        supabase.from('photo_scores').select('*').in('post_id', postIds),
        supabase.from('inspirations').select(`
          inspired_post_id,
          source_post_id,
          inspiration_type,
          inspiration_note,
          chain_level
        `).in('inspired_post_id', postIds)
      ]);


      if (likesData.error) throw likesData.error;
      if (bookmarksData.error) throw bookmarksData.error;
      if (commentsData.error) throw commentsData.error;
      if (photoScoresData.error) {
        console.warn('photo_scores取得エラー:', photoScoresData.error);
      }
      if (inspirationsData.error) {
        console.warn('inspirations取得エラー:', inspirationsData.error);
      } else {
        console.log('🎨 inspirationsData:', inspirationsData.data);
        console.log('🆔 postIds for inspiration lookup:', postIds);
      }
      
      const bookmarkedPostIds = new Set((bookmarksData.data ?? []).map(b => b.post_id));
      
      // photo_scoresをpost_idでマップ化
      const photoScoresMap = new Map();
      (photoScoresData.data ?? []).forEach(score => {
        photoScoresMap.set(score.post_id, score);
      });
      
      // inspirationsをpost_idでマップ化
      const inspirationsMap = new Map();
      (inspirationsData.data ?? []).forEach(inspiration => {
        inspirationsMap.set(inspiration.inspired_post_id, inspiration);
      });
      
      // インスピレーションのソース投稿データを取得
      const sourcePostIds = [...new Set((inspirationsData.data ?? []).map(i => i.source_post_id))];
      let sourcePostsMap = new Map();
      
      if (sourcePostIds.length > 0) {
        const { data: sourcePostsData, error: sourcePostsError } = await supabase
          .from('posts')
          .select(`
            id,
            title,
            image_url,
            author_id,
            profiles:author_id (id, name, avatar_url)
          `)
          .in('id', sourcePostIds);
          
        if (sourcePostsError) {
          console.warn('ソース投稿取得エラー:', sourcePostsError);
        } else {
          (sourcePostsData ?? []).forEach(post => {
            sourcePostsMap.set(post.id, post);
          });
          console.log('📚 ソース投稿データ:', sourcePostsData);
        }
      }

      const formattedPosts = (data as PostWithRelations[]).map(post => {
        const postLikes = (likesData.data ?? []).filter(like => like.post_id === post.id);
        const likeCount = postLikes.length;
        const likedByCurrentUser = !!currentUser && postLikes.some(like => like.user_id === currentUser.id);
        const commentCount = (commentsData.data ?? []).filter(comment => comment.post_id === post.id).length;
        
        // photoScoreを別途取得したデータから設定
        const photoScoreFromJoin = (post as any).photo_scores?.[0];
        const photoScoreFromMap = photoScoresMap.get(post.id);
        const finalPhotoScore = photoScoreFromMap || photoScoreFromJoin;
        
        // inspirationを別途取得したデータから設定
        const inspirationData = inspirationsMap.get(post.id);
        let inspiration = undefined;
        
        console.log(`🔍 Post ${post.id} - inspirationData:`, inspirationData);
        
        if (inspirationData && inspirationData.source_post_id) {
          const sourcePost = sourcePostsMap.get(inspirationData.source_post_id);
          console.log(`📖 Post ${post.id} - sourcePost:`, sourcePost);
          
          if (sourcePost) {
            inspiration = {
              source_post_id: inspirationData.source_post_id,
              source_post: {
                id: sourcePost.id,
                title: sourcePost.title,
                imageUrl: sourcePost.image_url,
                author: {
                  id: sourcePost.profiles?.id ?? sourcePost.author_id,
                  name: sourcePost.profiles?.name ?? '匿名ユーザー',
                  avatar: sourcePost.profiles?.avatar_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(sourcePost.profiles?.name ?? '匿名ユーザー')}&background=random`
                }
              },
              type: inspirationData.inspiration_type,
              note: inspirationData.inspiration_note,
              chain_level: inspirationData.chain_level
            };
            console.log(`✅ Post ${post.id} にinspiration情報を設定:`, inspiration);
          } else {
            console.log(`⚠️ Post ${post.id} - ソース投稿が見つからない:`, inspirationData.source_post_id);
          }
        } else if (inspirationData) {
          console.log(`⚠️ Post ${post.id} にinspirationDataはあるがsource_post_idがない:`, inspirationData);
        }
        
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
            id: post.profiles?.id ?? post.author_id ?? '',
            name: post.profiles?.name ?? post.author_name ?? '匿名ユーザー',
            avatar: post.profiles?.avatar_url ?? post.author_avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(post.profiles?.name || post.author_name || '匿名ユーザー')}&background=random`
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
          photoScore: finalPhotoScore || undefined,
          inspiration
        };
      });


      setAllPosts(formattedPosts);
      // 初期表示は最初の12枚のみ
      const initialPosts = formattedPosts.slice(0, POSTS_PER_PAGE);
      setDisplayedPosts(initialPosts);
      setPage(1);
      setHasNextPage(formattedPosts.length > POSTS_PER_PAGE);
      console.log(`📊 Posts loaded: ${formattedPosts.length} total, ${initialPosts.length} displayed initially, hasNextPage: ${formattedPosts.length > POSTS_PER_PAGE}`);
      setLoading(false);
    } catch (e: any) {
      setError(`投稿の読み込みに失敗しました: ${e.message}`);
      console.error(e);
      setAllPosts([]); // エラー時は空にする
      // Dynamic import for mockData
      import('../data/mockData').then(({ mockPosts }) => {
        setDisplayedPosts(mockPosts.slice(0, POSTS_PER_PAGE));
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
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, async (payload) => {
        console.log('Likes change received!', payload);
        await fetchPosts();
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
    console.log('LoadMore実行:', { page, hasNextPage, displayedPostsLength: displayedPosts.length });
    
    try {
      const currentDisplayed = displayedPosts.length;
      const nextPageEnd = currentDisplayed + POSTS_PER_PAGE;
      
      if (allPosts.length > nextPageEnd) {
        setDisplayedPosts(allPosts.slice(0, nextPageEnd));
        setPage(prev => prev + 1);
        setHasNextPage(nextPageEnd < allPosts.length);
      } else {
        setDisplayedPosts([...allPosts]);
        setHasNextPage(false);
      }
      
      console.log('LoadMore完了:', { newLength: Math.min(nextPageEnd, allPosts.length), hasNextPage: nextPageEnd < allPosts.length });
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, allPosts, hasNextPage, loading, isLoadingMore, displayedPosts.length]);

  const addPost = useCallback(async (newPostInput: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'author' | 'likeCount' | 'likedByCurrentUser' | 'bookmarkedByCurrentUser' | 'commentCount'> & { inspirationSourceId?: string | null; inspirationType?: string; inspirationNote?: string }) => {
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

      // 4. ユーザープロフィール情報を取得（投稿表示時に使用）
      const { data: profileData } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', userId)
        .single();

      // プロフィール情報は投稿オブジェクト作成時に使用

      // 5. postsテーブルにinsert
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert({
          title: newPostInput.title,
          image_url: publicUrl,
          user_comment: newPostInput.userComment ?? '',
          ai_description: newPostInput.aiDescription,
          author_id: userId // ログインユーザーのIDを正しく設定
          // author_nameとauthor_avatarはDBスキーマに存在しないため削除
          // imageAIDescriptionはDBに保存しない
        })
        .select()
        .single();

      if (postError) {
        console.error('❌ 投稿保存エラー:', {
          code: postError.code,
          message: postError.message,
          details: postError.details,
          hint: postError.hint,
          postData: {
            title: newPostInput.title,
            description: newPostInput.userComment,
            image_url: newPostInput.imageUrl,
            ai_description: newPostInput.aiDescription,
            author_id: newPostInput.author.id
          }
        });
        throw postError; // エラーをそのまま投げて呼び出し元で処理
      }

      // 6. 関連テーブルにinsert
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

      // 7. 写真スコアを保存
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
          ai_comment: newPostInput.photoScore.ai_comment,
          image_analysis: newPostInput.photoScore.image_analysis || null
        });
        
        if (scoreError) {
          console.error('Error saving photo score:', scoreError);
          // 写真スコアの保存に失敗してもエラーは投げない（投稿自体は成功させる）
        }
      }

      // 7. インスピレーション情報を保存
      if (newPostInput.inspirationSourceId) {
        console.log('🎨 インスピレーション情報を保存:', {
          sourceId: newPostInput.inspirationSourceId,
          type: newPostInput.inspirationType,
          note: newPostInput.inspirationNote
        });
        
        // チェーンレベルを計算（関数が存在しない場合は1を使用）
        let chainLevel = 1;
        try {
          const { data: chainLevelData } = await supabase
            .rpc('get_inspiration_chain_depth', {
              post_id: newPostInput.inspirationSourceId
            });
          chainLevel = (chainLevelData || 0) + 1; // 深度 + 1 = チェーンレベル
        } catch (error) {
          console.log('チェーンレベル計算をスキップ:', error);
        }
        
        try {
          // ポイント付与を含む完全なインスピレーション処理を実行
          const { data: inspirationId, error: inspirationError } = await supabase
            .rpc('create_inspiration_simple', {
              p_source_post_id: newPostInput.inspirationSourceId,
              p_inspired_post_id: postData.id,
              p_creator_id: userId,
              p_inspiration_type: newPostInput.inspirationType || 'direct',
              p_inspiration_note: newPostInput.inspirationNote ? decodeURIComponent(newPostInput.inspirationNote) : null
            });
          
          if (inspirationError) {
            console.error('❌ インスピレーション保存エラー:', {
              code: inspirationError.code,
              message: inspirationError.message,
              details: inspirationError.details,
              hint: inspirationError.hint,
              params: {
                source_post_id: newPostInput.inspirationSourceId,
                inspired_post_id: postData.id,
                creator_id: userId,
                inspiration_type: newPostInput.inspirationType || 'direct',
                inspiration_note: newPostInput.inspirationNote
              }
            });
            // ポイント関連のエラーでも投稿自体は成功させる
          } else {
            console.log('✅ インスピレーション保存成功！ID:', inspirationId);
            
            // ポイント付与の確認
            try {
              const { data: pointsCheck, error: pointsError } = await supabase
                .rpc('check_inspiration_points', { p_user_id: userId });
              
              if (pointsError) {
                console.warn('⚠️ ポイント確認エラー:', pointsError);
              } else {
                console.log('💎 ポイント確認完了:', pointsCheck);
              }
            } catch (pointsError) {
              console.error('❌ ポイント確認で予期しないエラー:', pointsError);
            }
          }
        } catch (error) {
          console.error('❌ インスピレーション保存で予期しないエラー:', error);
          // どんなエラーでも投稿は継続
        }
      }

      // インスピレーション情報を取得（もしあれば）
      console.log('🔍 usePosts.addPost - インスピレーション情報デバッグ:');
      console.log('  - newPostInput.inspirationSourceId:', newPostInput.inspirationSourceId);
      console.log('  - newPostInput.inspirationType:', newPostInput.inspirationType);
      console.log('  - newPostInput.inspirationNote:', newPostInput.inspirationNote);
      
      let inspirationData = null;
      if (newPostInput.inspirationSourceId) {
        console.log('  - インスピレーション情報の取得を開始...');
        try {
          // インスピレーション元の投稿を取得
          const { data: sourcePost } = await supabase
            .from('posts')
            .select('id, title, image_url, author_id')
            .eq('id', newPostInput.inspirationSourceId)
            .single();

          if (sourcePost) {
            // 作成者情報を取得
            let authorData = null;
            if (sourcePost.author_id) {
              const { data: userData } = await supabase
                .from('users')
                .select('id, name, avatar_url')
                .eq('id', sourcePost.author_id)
                .single();

              if (!userData) {
                const { data: profileData } = await supabase
                  .from('profiles')
                  .select('id, name, avatar_url')
                  .eq('id', sourcePost.author_id)
                  .single();
                authorData = profileData;
              } else {
                authorData = userData;
              }
            }

            const authorName = authorData?.name || '匿名ユーザー';
            const avatarUrl = authorData?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=random`;

            inspirationData = {
              source_post_id: newPostInput.inspirationSourceId,
              source_post: {
                id: sourcePost.id,
                title: sourcePost.title,
                imageUrl: sourcePost.image_url,
                author: {
                  id: sourcePost.author_id,
                  name: authorName,
                  avatar: avatarUrl
                }
              },
              type: newPostInput.inspirationType || 'direct',
              note: newPostInput.inspirationNote || '',
              chain_level: 1 // 新規投稿なので1に設定
            };
            
            console.log('  - インスピレーションデータを構築完了:', inspirationData);
          }
        } catch (error) {
          console.error('インスピレーション情報の取得に失敗:', error);
        }
      } else {
        console.log('  - インスピレーション元IDがないためスキップ');
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
          name: profileData?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'ユーザー',
          avatar: profileData?.avatar_url || user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'ユーザー')}&background=0072f5&color=fff`
        },
        aiComments: newPostInput.aiComments || [],
        likeCount: 0,
        likedByCurrentUser: false,
        bookmarkedByCurrentUser: false,
        commentCount: 0,
        inspiration: inspirationData
      };
      
      console.log('🎆 usePosts.addPost - 最終投稿データ:');
      console.log('  - newPost.id:', newPost.id);
      console.log('  - newPost.inspiration:', newPost.inspiration);
      if (newPost.inspiration) {
        console.log('    - source_post_id:', newPost.inspiration.source_post_id);
        console.log('    - type:', newPost.inspiration.type);
        console.log('    - note:', newPost.inspiration.note);
        console.log('    - source_post:', newPost.inspiration.source_post);
      }

      // 新規投稿通知を送信
      try {
        await sendNewPostNotifications(postData.id, userId);
      } catch (error) {
        console.log('新規投稿通知の送信に失敗:', error);
      }

      // 新規投稿をpostsの先頭に追加（fetchPostsを呼ばずに直接追加）
      setDisplayedPosts(prevPosts => [newPost, ...prevPosts]);
      setAllPosts(prevAllPosts => [newPost, ...prevAllPosts]);
      console.log('✅ 新規投稿をPosts配列に直接追加しました');
      
      return newPost;
    } catch (error) {
      console.error("❌ Failed to add post:", {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        newPostInput: {
          title: newPostInput.title,
          userComment: newPostInput.userComment,
          imageUrl: newPostInput.imageUrl?.substring(0, 100) + '...',
          aiDescription: newPostInput.aiDescription?.substring(0, 100) + '...',
          author: newPostInput.author,
          tags: newPostInput.tags.map(t => ({ id: t.id, name: t.name })),
          aiComments: newPostInput.aiComments?.length || 0
        }
      });
      return null;
    }
  }, [fetchPosts]);

  // フィルター機能は削除済み - シンプルな無限ローディングのみ

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
          ai_comment: updates.photoScore.ai_comment,
          image_analysis: updates.photoScore.image_analysis || null
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
          ai_comment: updates.photoScore.ai_comment,
          image_analysis: updates.photoScore.image_analysis || null
        });
      }
    }
    
    await fetchPosts();
  }, [fetchPosts]);

  // 投稿削除
  const deletePost = useCallback(async (postId: string) => {
    setAllPosts(prev => prev.filter(p => p.id !== postId)); // Optimistic update
    setDisplayedPosts(prev => prev.filter(p => p.id !== postId));
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
    
    if (postData) {
      // 通知作成
      if (postData.author_id !== user.id) {
        const { createNotification } = await import('../utils/notifications');
        await createNotification({
          recipientId: postData.author_id,
          senderId: user.id,
          postId: postId,
          type: 'like'
        });
      }

      // ポイント付与機能は無効化
      // console.log('いいね機能正常動作');
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
    
    if (postData) {
      // 通知削除
      if (postData.author_id !== user.id) {
        const { deleteNotification } = await import('../utils/notifications');
        await deleteNotification({
          recipientId: postData.author_id,
          senderId: user.id,
          postId: postId,
          type: 'like'
        });
      }

      // ポイント機能は無効化
      // console.log('いいね取り消し機能正常動作');
    }
    
    await fetchPosts();
  }, [fetchPosts]);

  const bookmarkPost = useCallback(async (postId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setAllPosts(prev => prev.map(p => p.id === postId ? { ...p, bookmarkedByCurrentUser: true } : p));
    setDisplayedPosts(prev => prev.map(p => p.id === postId ? { ...p, bookmarkedByCurrentUser: true } : p));
    const { error } = await supabase.from('bookmarks').insert({ post_id: postId, user_id: user.id });
    
    if (error) {
      console.error("Error bookmarking post:", error);
      setAllPosts(prev => prev.map(p => p.id === postId ? { ...p, bookmarkedByCurrentUser: false } : p));
      setDisplayedPosts(prev => prev.map(p => p.id === postId ? { ...p, bookmarkedByCurrentUser: false } : p));
    } else {
      // ブックマーク成功時にポイント付与
      try {
        // 投稿者IDを取得
        const { data: postData } = await supabase
          .from('posts')
          .select('author_id')
          .eq('id', postId)
          .single();

        // ポイント機能は無効化
        // console.log('ブックマーク機能正常動作');
      } catch (pointError) {
        console.warn('⚠️ ブックマークエラー:', pointError);
      }
    }
  }, []);

  const unbookmarkPost = useCallback(async (postId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    setAllPosts(prev => prev.map(p => p.id === postId ? { ...p, bookmarkedByCurrentUser: false } : p));
    setDisplayedPosts(prev => prev.map(p => p.id === postId ? { ...p, bookmarkedByCurrentUser: false } : p));
    const { error } = await supabase.from('bookmarks').delete().match({ post_id: postId, user_id: user.id });
     if (error) {
      console.error("Error unbookmarking post:", error);
      setAllPosts(prev => prev.map(p => p.id === postId ? { ...p, bookmarkedByCurrentUser: true } : p));
      setDisplayedPosts(prev => prev.map(p => p.id === postId ? { ...p, bookmarkedByCurrentUser: true } : p));
    } else {
      // ブックマーク削除成功時にポイント削除
      try {
        // 投稿者IDを取得
        const { data: postData } = await supabase
          .from('posts')
          .select('author_id')
          .eq('id', postId)
          .single();

        // ポイント機能は無効化
        // console.log('ブックマーク削除機能正常動作');
      } catch (pointError) {
        console.warn('⚠️ ブックマーク削除エラー:', pointError);
      }
    }
  }, []);

  console.log(`🔍 usePosts return: displayedPosts=${displayedPosts.length}, allPosts=${allPosts.length}, hasNextPage=${hasNextPage}`);
  return { posts: displayedPosts, allPosts, loading, error, fetchPosts, addPost, updatePost, deletePost, likePost, unlikePost, bookmarkPost, unbookmarkPost, hasNextPage, loadMore, isLoadingMore };
};
