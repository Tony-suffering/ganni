import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase';
import { Post } from '../types';
import PostCard from '../components/PostCard';
import { MasonryGrid } from '../components/layout/MasonryGrid';
import { PostModal } from '../components/modals/PostModal';

export const Bookmarks: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    if (user) {
      fetchBookmarkedPosts();
    }
  }, [user]);

  const fetchBookmarkedPosts = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // console.log('🔍 ブックマーク取得開始 - ユーザーID:', user.id);
      
      // ブックマークした投稿を取得
      const { data: bookmarks, error: bookmarksError } = await supabase
        .from('bookmarks')
        .select(`
          post_id,
          created_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // console.log('📚 ブックマーク取得結果:', bookmarks);
      // console.log('❌ ブックマーク取得エラー:', bookmarksError);

      if (bookmarksError) {
        console.error('ブックマーク取得エラー:', bookmarksError);
        // テーブルが存在しない場合の処理
        if (bookmarksError.code === 'PGRST116' || bookmarksError.message?.includes('does not exist')) {
          console.log('💡 ブックマークテーブルが存在しません。データベースマイグレーションを実行してください。');
          setBookmarkedPosts([]);
        }
        return;
      }

      if (!bookmarks || bookmarks.length === 0) {
        setBookmarkedPosts([]);
        return;
      }

      const postIds = bookmarks.map(b => b.post_id);

      // 投稿データを取得
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          author:users(id, name, avatar_url)
        `)
        .in('id', postIds);

      // console.log('📝 投稿データ取得結果:', posts);
      // console.log('❌ 投稿データ取得エラー:', postsError);

      if (postsError) {
        console.error('投稿取得エラー:', postsError);
        
        // users結合に失敗した場合、投稿データのみ取得
        const { data: postsOnly, error: postsOnlyError } = await supabase
          .from('posts')
          .select('*')
          .in('id', postIds);
        
        // console.log('📝 投稿データのみ取得結果:', postsOnly);
        
        if (postsOnlyError) {
          console.error('投稿データのみ取得もエラー:', postsOnlyError);
          return;
        }
        
        // ユーザー情報は別途取得
        const authorIds = [...new Set(postsOnly?.map(p => p.author_id).filter(Boolean))];
        console.log('取得する作成者ID:', authorIds);
        let usersData = [];
        
        if (authorIds.length > 0) {
          // まずusersテーブルから取得を試行
          const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, name, avatar_url')
            .in('id', authorIds);
          
          if (usersError) {
            console.log('usersテーブル取得エラー、profilesテーブルを試行:', usersError);
            // usersテーブルが失敗した場合、profilesテーブルを試す
            const { data: profiles, error: profilesError } = await supabase
              .from('profiles')
              .select('id, name, avatar_url')
              .in('id', authorIds);
            
            if (profilesError) {
              console.log('profilesテーブル取得エラー、フォールバック情報を使用:', profilesError);
              // プロフィール情報が取得できない場合、フォールバック
              usersData = authorIds.map(id => ({
                id,
                name: '匿名ユーザー',
                avatar_url: null
              }));
            } else {
              console.log('profilesから取得成功:', profiles);
              usersData = profiles || [];
            }
          } else {
            console.log('usersから取得成功:', users);
            usersData = users || [];
          }
        }
        
        // データを統合
        const formattedPosts = postsOnly?.map(post => {
          const userData = usersData.find(u => u.id === post.author_id);
          const authorName = userData?.name || '匿名ユーザー';
          const avatarUrl = userData?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=random`;
          
          console.log('投稿データ処理:', {
            postId: post.id,
            authorId: post.author_id,
            userData,
            authorName,
            avatarUrl
          });
          
          return {
            id: post.id,
            title: post.title,
            imageUrl: post.image_url,
            aiDescription: post.ai_description || '',
            userComment: post.user_comment || '',
            author: {
              id: post.author_id,
              name: authorName,
              avatar: avatarUrl
            },
            tags: [],
            createdAt: post.created_at,
            updatedAt: post.updated_at,
            likeCount: 0,
            likedByCurrentUser: false,
            bookmarkedByCurrentUser: true,
            aiComments: [],
            commentCount: 0
          };
        }) || [];
        
        setBookmarkedPosts(formattedPosts);
        return;
      }

      // ライク、ブックマーク、コメント情報を取得
      const [likesResult, allBookmarksResult, commentsResult] = await Promise.all([
        supabase.from('likes').select('post_id, user_id').in('post_id', postIds),
        supabase.from('bookmarks').select('post_id, user_id').in('post_id', postIds),
        supabase.from('comments').select('post_id').in('post_id', postIds)
      ]);

      const { data: likes, error: likesError } = likesResult;
      const { data: allBookmarks, error: allBookmarksError } = allBookmarksResult;
      const { data: comments, error: commentsError } = commentsResult;

      if (likesError) {
        console.error('ライク取得エラー:', likesError);
      }
      if (allBookmarksError) {
        console.error('ブックマーク取得エラー:', allBookmarksError);
      }
      if (commentsError) {
        console.error('コメント取得エラー:', commentsError);
      }

      // データを整形
      const formattedPosts: Post[] = posts?.map(post => {
        const authorName = post.author?.name || '匿名ユーザー';
        const avatarUrl = post.author?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=random`;
        const commentCount = comments?.filter(comment => comment.post_id === post.id).length || 0;
        
        return {
          id: post.id,
          title: post.title,
          imageUrl: post.image_url,
          aiDescription: post.ai_description || '',
          userComment: post.user_comment || '',
          author: {
            id: post.author?.id || post.author_id,
            name: authorName,
            avatar: avatarUrl
          },
          tags: [], // タグ機能は後で実装
          createdAt: post.created_at,
          updatedAt: post.updated_at,
          likeCount: likes?.filter(like => like.post_id === post.id).length || 0,
          likedByCurrentUser: likes?.some(like => 
            like.post_id === post.id && like.user_id === user.id
          ) || false,
          bookmarkedByCurrentUser: allBookmarks?.some(bookmark => 
            bookmark.post_id === post.id && bookmark.user_id === user.id
          ) || false,
          aiComments: [],
          commentCount
        };
      }) || [];

      // ブックマーク順でソート
      const sortedPosts = formattedPosts.sort((a, b) => {
        const aBookmark = bookmarks.find(bm => bm.post_id === a.id);
        const bBookmark = bookmarks.find(bm => bm.post_id === b.id);
        return new Date(bBookmark?.created_at || 0).getTime() - new Date(aBookmark?.created_at || 0).getTime();
      });

      setBookmarkedPosts(sortedPosts);
    } catch (error) {
      console.error('ブックマーク取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!user) return;

    try {
      await supabase.from('likes').insert([{ post_id: postId, user_id: user.id }]);
      setBookmarkedPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, likedByCurrentUser: true, likeCount: post.likeCount + 1 }
          : post
      ));
    } catch (error) {
      console.error('ライクエラー:', error);
    }
  };

  const handleUnlikePost = async (postId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      setBookmarkedPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, likedByCurrentUser: false, likeCount: Math.max(0, post.likeCount - 1) }
          : post
      ));
    } catch (error) {
      console.error('ライク解除エラー:', error);
    }
  };

  const handleBookmarkPost = async (postId: string) => {
    if (!user) return;

    try {
      await supabase.from('bookmarks').insert([{ post_id: postId, user_id: user.id }]);
      setBookmarkedPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, bookmarkedByCurrentUser: true }
          : post
      ));
    } catch (error) {
      console.error('ブックマークエラー:', error);
    }
  };

  const handleUnbookmarkPost = async (postId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('bookmarks')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      // ブックマークを解除したら一覧からも削除
      setBookmarkedPosts(prev => prev.filter(post => post.id !== postId));
    } catch (error) {
      console.error('ブックマーク解除エラー:', error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!user) return;

    try {
      await supabase.from('posts').delete().eq('id', postId).eq('author_id', user.id);
      setBookmarkedPosts(prev => prev.filter(post => post.id !== postId));
    } catch (error) {
      console.error('投稿削除エラー:', error);
    }
  };

  const filteredPosts = bookmarkedPosts.filter(post =>
    searchQuery === '' || 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.userComment.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500 mb-4">ブックマークを見るにはログインが必要です</p>
          <button 
            onClick={() => navigate('/login')} 
            className="btn-primary"
          >
            ログイン
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 mt-16 md:mt-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-16 md:top-20 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900 dark:to-yellow-800 rounded-lg shadow-md">
                  <Sparkles className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    コレクション
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {bookmarkedPosts.length}件の特別な投稿
                  </p>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-lg mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="コレクションを検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="py-8">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900 dark:to-yellow-800 rounded-full flex items-center justify-center mb-6 shadow-lg">
                <Sparkles className="w-12 h-12 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {searchQuery ? '検索結果が見つかりません' : 'コレクションがありません'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                {searchQuery 
                  ? '別のキーワードで検索してみてください'
                  : '特別な投稿をコレクションに追加して、後で簡単に見つけられます'
                }
              </p>
              {!searchQuery && (
                <button
                  onClick={() => navigate('/')}
                  className="btn-primary"
                >
                  投稿を探す
                </button>
              )}
            </motion.div>
          </div>
        ) : (
          <MasonryGrid
            posts={filteredPosts}
            onPostClick={setSelectedPost}
            hasNextPage={false}
            onLoadMore={() => {}}
            likePost={handleLikePost}
            unlikePost={handleUnlikePost}
            bookmarkPost={handleBookmarkPost}
            unbookmarkPost={handleUnbookmarkPost}
            deletePost={handleDeletePost}
            searchQuery={searchQuery}
          />
        )}
      </div>

      {/* Post Modal */}
      <PostModal
        post={selectedPost}
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        likePost={handleLikePost}
        unlikePost={handleUnlikePost}
      />
    </div>
  );
};