import React, { useMemo, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import PostCard from '../PostCard';
import { Post } from '../../types';
import { imageCache } from '../../utils/imageCache';

interface MasonryGridProps {
  posts: Post[];
  onPostClick: (post: Post) => void;
  hasNextPage: boolean;
  onLoadMore: () => void;
  likePost: (postId: string) => void;
  unlikePost: (postId: string) => void;
  bookmarkPost: (postId: string) => void;
  unbookmarkPost: (postId: string) => void;
  deletePost: (postId: string) => void;
  searchQuery?: string;
  isLoadingMore?: boolean;
}

export const MasonryGrid: React.FC<MasonryGridProps & { loading?: boolean }> = ({
  posts,
  onPostClick,
  hasNextPage,
  onLoadMore,
  likePost,
  unlikePost,
  bookmarkPost,
  unbookmarkPost,
  deletePost,
  searchQuery,
  loading = false,
  isLoadingMore = false
}) => {
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  React.useEffect(() => {
    if (inView && hasNextPage && !isLoadingMore) {
      onLoadMore();
    }
  }, [inView, hasNextPage, isLoadingMore, onLoadMore]);

  // Create columns for masonry layout with memoization
  const columns = useMemo(() => {
    const cols: Post[][] = [[], [], []];
    posts.forEach((post, index) => {
      cols[index % 3].push(post);
    });
    return cols;
  }, [posts]);

  // Memoized PostCard rendering functions
  const renderPostCard = useCallback((post: Post, index: number) => (
    <motion.div
      key={post.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <PostCard
        post={post}
        onClick={() => onPostClick(post)}
        likePost={likePost}
        unlikePost={unlikePost}
        bookmarkPost={bookmarkPost}
        unbookmarkPost={unbookmarkPost}
        deletePost={deletePost}
        priority={index < 6} // 最初の6枚は優先読み込み
        index={index}
      />
    </motion.div>
  ), [onPostClick, likePost, unlikePost, bookmarkPost, unbookmarkPost, deletePost]);

  // 画像プリロード効果（無限ローディング対応）
  useEffect(() => {
    // 現在表示中の投稿の画像のみプリロード（バッチサイズを制限）
    const imageUrls = posts
      .slice(0, 12) // 最初の12投稿をプリロード
      .map(post => post.imageUrl)
      .filter(Boolean);
    
    if (imageUrls.length > 0) {
      imageCache.preloadBatch(imageUrls, 6); // バッチサイズを増加
    }
  }, [posts]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 min-h-[50vh] mt-20 md:mt-24">
        <div className="w-12 h-12 mb-4 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <div className="text-neutral-500">読み込み中...</div>
      </div>
    );
  }

  if (posts.length === 0) {
    // 検索結果が空の場合
    if (searchQuery && searchQuery.trim() !== '') {
      return (
        <div className="flex flex-col items-center justify-center py-16 min-h-[50vh]">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-display font-semibold text-neutral-900 mb-2">
            検索結果が見つかりませんでした
          </h3>
          <p className="text-neutral-600 text-center max-w-md">
            「{searchQuery}」に一致する投稿がありません。<br />
            別のキーワードで検索してみてください。
          </p>
        </div>
      );
    }

    // 投稿が全くない場合
    return (
      <div className="flex flex-col items-center justify-center py-16 min-h-[50vh]">
        <div className="text-6xl mb-4">📸</div>
        <h3 className="text-xl font-display font-semibold text-neutral-900 mb-2">
          まだ投稿がありません
        </h3>
        <p className="text-neutral-600 text-center max-w-md">
          最初の写真を投稿して、あなたの体験をシェアしてください
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8 scroll-container w-full overflow-x-hidden">
      {/* Desktop Masonry Grid */}
      <div className="hidden md:grid md:grid-cols-3 gap-4">
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className="space-y-4">
            {column.map((post, index) => {
              // 正しいグローバルインデックスを計算（元の投稿順序を維持）
              const globalIndex = posts.findIndex(p => p.id === post.id);
              return renderPostCard(post, globalIndex);
            })}
          </div>
        ))}
      </div>

      {/* Mobile Single Column */}
      <div className="md:hidden space-y-4">
        {posts.map((post, index) => renderPostCard(post, index))}
      </div>

      {/* Load More Trigger */}
      {hasNextPage && (
        <div ref={ref} className="flex justify-center py-8">
          {isLoadingMore && (
            <div
              className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"
            />
          )}
        </div>
      )}
    </div>
  );
};