import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Search, ArrowRight } from 'lucide-react';
import { supabase } from '../../supabase';
import { Post } from '../../types';
import { MasonryGrid } from '../layout/MasonryGrid';
import { PostModal } from '../modals/PostModal';

interface CollectionTabProps {
  userId: string;
}

export const CollectionTab: React.FC<CollectionTabProps> = ({ userId }) => {
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    fetchBookmarkedPosts();
  }, [userId]);

  const fetchBookmarkedPosts = async () => {
    try {
      setLoading(true);
      
      // ブックマークした投稿を取得
      const { data: bookmarks, error: bookmarksError } = await supabase
        .from('bookmarks')
        .select('post_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (bookmarksError) {
        console.error('ブックマーク取得エラー:', bookmarksError);
        setBookmarkedPosts([]);
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
          author:profiles(id, name, avatar_url)
        `)
        .in('id', postIds);

      if (postsError) {
        console.error('投稿取得エラー:', postsError);
        return;
      }

      // ライク、ブックマーク、コメント情報を取得
      const [likesResult, allBookmarksResult, commentsResult] = await Promise.all([
        supabase.from('likes').select('post_id, user_id').in('post_id', postIds),
        supabase.from('bookmarks').select('post_id, user_id').in('post_id', postIds),
        supabase.from('comments').select('post_id').in('post_id', postIds)
      ]);

      const { data: likes } = likesResult;
      const { data: allBookmarks } = allBookmarksResult;
      const { data: comments } = commentsResult;

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
          tags: [],
          createdAt: post.created_at,
          updatedAt: post.updated_at,
          likeCount: likes?.filter(like => like.post_id === post.id).length || 0,
          likedByCurrentUser: likes?.some(like => 
            like.post_id === post.id && like.user_id === userId
          ) || false,
          bookmarkedByCurrentUser: allBookmarks?.some(bookmark => 
            bookmark.post_id === post.id && bookmark.user_id === userId
          ) || false,
          aiComments: [],
          commentCount,
          photoScore: post.photo_score,
          userId: post.user_id || post.author_id
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
    try {
      await supabase.from('likes').insert([{ post_id: postId, user_id: userId }]);
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
    try {
      await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

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
    try {
      await supabase.from('bookmarks').insert([{ post_id: postId, user_id: userId }]);
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
    try {
      await supabase
        .from('bookmarks')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      // ブックマークを解除したら一覧からも削除
      setBookmarkedPosts(prev => prev.filter(post => post.id !== postId));
    } catch (error) {
      console.error('ブックマーク解除エラー:', error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await supabase.from('posts').delete().eq('id', postId).eq('author_id', userId);
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

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg">
              <Sparkles className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                あなたのコレクション
              </h3>
              <p className="text-sm text-gray-500">
                {bookmarkedPosts.length}件の特別な投稿
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="コレクションを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Content */}
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
            <div className="w-24 h-24 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full flex items-center justify-center mb-6">
              <Sparkles className="w-12 h-12 text-yellow-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery ? '検索結果が見つかりません' : 'コレクションがありません'}
            </h3>
            <p className="text-gray-500 mb-6 max-w-md">
              {searchQuery 
                ? '別のキーワードで検索してみてください'
                : '特別な投稿をコレクションに追加して、後で簡単に見つけられます'
              }
            </p>
            {!searchQuery && (
              <button
                onClick={() => window.location.href = '/'}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                投稿を探す
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        </div>
      ) : (
        <div className="max-h-[600px] overflow-y-auto">
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
            loading={false}
          />
        </div>
      )}

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