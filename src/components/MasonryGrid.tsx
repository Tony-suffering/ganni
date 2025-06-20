import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { PostCard } from './PostCard';
import { Post } from '../types';

interface MasonryGridProps {
  posts: Post[];
  onPostClick: (post: Post) => void;
  hasNextPage: boolean;
  onLoadMore: () => void;
  likePost: (postId: string) => void;
  unlikePost: (postId: string) => void;
}

export const MasonryGrid: React.FC<MasonryGridProps & { loading?: boolean }> = ({
  posts,
  onPostClick,
  hasNextPage,
  onLoadMore,
  likePost,
  unlikePost,
  loading = false
}) => {
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  React.useEffect(() => {
    if (inView && hasNextPage) {
      onLoadMore();
    }
  }, [inView, hasNextPage, onLoadMore]);

  // Create columns for masonry layout
  const columns = React.useMemo(() => {
    const cols: Post[][] = [[], [], []];
    posts.forEach((post, index) => {
      cols[index % 3].push(post);
    });
    return cols;
  }, [posts]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 min-h-[50vh]">
        <div className="w-12 h-12 mb-4 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <div className="text-neutral-500">読み込み中...</div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 min-h-[50vh]">
        <div className="text-6xl mb-4">✈️</div>
        <h3 className="text-xl font-display font-semibold text-neutral-900 mb-2">
          まだ投稿がありません
        </h3>
        <p className="text-neutral-600 text-center max-w-md">
          最初の空港写真を投稿して、あなたの空港体験をシェアしてください
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8 scroll-container w-full overflow-x-hidden">
      {/* Desktop Masonry Grid */}
      <div className="hidden md:grid md:grid-cols-3 gap-6">
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className="space-y-6">
            {column.map((post, index) => (
              <PostCard
                key={post.id}
                post={post}
                onClick={() => onPostClick(post)}
                index={columnIndex * Math.ceil(posts.length / 3) + index}
                likePost={likePost}
                unlikePost={unlikePost}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Mobile Single Column */}
      <div className="md:hidden space-y-6">
        {posts.map((post, index) => (
          <PostCard
            key={post.id}
            post={post}
            onClick={() => onPostClick(post)}
            index={index}
            likePost={likePost}
            unlikePost={unlikePost}
          />
        ))}
      </div>

      {/* Load More Trigger */}
      {hasNextPage && (
        <div ref={ref} className="flex justify-center py-8">
          <div
            className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"
          />
        </div>
      )}
    </div>
  );
};