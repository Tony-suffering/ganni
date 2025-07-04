import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar,
  Heart,
  MessageCircle,
  MapPin,
  Clock,
  Eye,
  Tag as TagIcon,
  Filter,
  Search
} from 'lucide-react';
import { Post } from '../../types';
import { LazyImage } from '../layout/LazyImage';
import { UserPostService } from '../../services/userPostService';

interface PostGalleryProps {
  posts: Post[];
  viewMode: 'grid' | 'timeline';
}

export const PostGallery: React.FC<PostGalleryProps> = ({ posts, viewMode }) => {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'likes'>('date');
  
  const userPostService = new UserPostService();

  // フィルタリングとソート
  const filteredAndSortedPosts = React.useMemo(() => {
    let filtered = posts;

    // 検索フィルター
    if (searchTerm) {
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.userComment.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // タグフィルター
    if (selectedTag) {
      filtered = filtered.filter(post => 
        post.tags.some(tag => tag.name === selectedTag)
      );
    }

    // ソート
    return filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        return b.likeCount - a.likeCount;
      }
    });
  }, [posts, searchTerm, selectedTag, sortBy]);

  // 全タグを取得
  const allTags = React.useMemo(() => {
    const tagSet = new Set<string>();
    posts.forEach(post => {
      post.tags.forEach(tag => tagSet.add(tag.name));
    });
    return Array.from(tagSet).sort();
  }, [posts]);

  // 月別グループ化（タイムライン表示用）
  const groupedPosts = React.useMemo(() => {
    return userPostService.groupPostsByMonth(filteredAndSortedPosts);
  }, [filteredAndSortedPosts]);

  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Eye className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          まだ投稿がありません
        </h3>
        <p className="text-gray-600">
          最初の投稿をして、あなたのジャーニーを始めましょう！
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* フィルター・検索バー */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* 検索 */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* ソート */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'likes')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="date">新しい順</option>
            <option value="likes">いいね順</option>
          </select>
        </div>

        {/* タグフィルター */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedTag === null
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              すべて
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedTag === tag
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 結果表示 */}
      <div className="mb-4 text-sm text-gray-600">
        <span className="hidden md:inline">{filteredAndSortedPosts.length} / {posts.length} 件の投稿</span>
        <span className="md:hidden">{filteredAndSortedPosts.length}/{posts.length}</span>
      </div>

      {/* 投稿表示 */}
      {viewMode === 'grid' ? (
        <GridView posts={filteredAndSortedPosts} onPostClick={setSelectedPost} />
      ) : (
        <TimelineView groupedPosts={groupedPosts} onPostClick={setSelectedPost} />
      )}

      {/* 投稿詳細モーダル */}
      <AnimatePresence>
        {selectedPost && (
          <PostDetailModal 
            post={selectedPost} 
            onClose={() => setSelectedPost(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// グリッド表示
interface GridViewProps {
  posts: Post[];
  onPostClick: (post: Post) => void;
}

const GridView: React.FC<GridViewProps> = ({ posts, onPostClick }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {posts.map((post, index) => (
      <motion.div
        key={post.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="group cursor-pointer"
        onClick={() => onPostClick(post)}
      >
        <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
          <LazyImage
            src={post.imageUrl}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* オーバーレイ */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-end">
            <div className="p-3 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <h3 className="font-semibold text-sm truncate">{post.title}</h3>
              <div className="flex items-center space-x-2 text-xs mt-1">
                <div className="flex items-center space-x-1">
                  <Heart className="w-3 h-3" />
                  <span>{post.likeCount}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(post.createdAt).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    ))}
  </div>
);

// タイムライン表示
interface TimelineViewProps {
  groupedPosts: Record<string, Post[]>;
  onPostClick: (post: Post) => void;
}

const TimelineView: React.FC<TimelineViewProps> = ({ groupedPosts, onPostClick }) => {
  const monthOrder = Object.keys(groupedPosts).sort().reverse();

  return (
    <div className="space-y-8">
      {monthOrder.map(monthKey => {
        const posts = groupedPosts[monthKey];
        const [year, month] = monthKey.split('-');
        const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('ja-JP', { 
          year: 'numeric', 
          month: 'long' 
        });

        return (
          <div key={monthKey}>
            <div className="flex items-center mb-4">
              <div className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full">
                <h3 className="font-semibold">{monthName}</h3>
              </div>
              <div className="flex-1 h-px bg-gray-200 ml-4"></div>
              <span className="text-sm text-gray-500 ml-4">{posts.length}件</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map(post => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onPostClick(post)}
                >
                  <div className="aspect-video">
                    <LazyImage
                      src={post.imageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">{post.title}</h4>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{post.userComment}</p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <Heart className="w-3 h-3" />
                          <span>{post.likeCount}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(post.createdAt).toLocaleDateString('ja-JP')}</span>
                        </div>
                      </div>
                      {post.tags.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <TagIcon className="w-3 h-3" />
                          <span>{post.tags[0].name}</span>
                          {post.tags.length > 1 && <span>+{post.tags.length - 1}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// 投稿詳細モーダル
interface PostDetailModalProps {
  post: Post;
  onClose: () => void;
}

const PostDetailModal: React.FC<PostDetailModalProps> = ({ post, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="aspect-video">
        <LazyImage
          src={post.imageUrl}
          alt={post.title}
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h2>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(post.createdAt).toLocaleDateString('ja-JP')}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Heart className="w-4 h-4" />
                <span>{post.likeCount} いいね</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Eye className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-gray-700 leading-relaxed">{post.userComment}</p>
        </div>

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map(tag => (
              <span
                key={tag.id}
                className="px-3 py-1 rounded-full text-sm"
                style={{ 
                  backgroundColor: tag.color + '20', 
                  color: tag.color 
                }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {post.aiDescription && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">AI説明</h4>
            <p className="text-blue-800 text-sm">{post.aiDescription}</p>
          </div>
        )}
      </div>
    </motion.div>
  </motion.div>
);