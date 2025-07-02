import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Filter, ArrowLeft, Sparkles, TrendingUp, Clock, Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../hooks/usePosts';
import PostCard from '../components/PostCard';
import { Post } from '../types';

export const InspirationExplore: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const suggestedPostId = searchParams.get('suggested');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'quality'>('quality');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'photography' | 'art' | 'design'>('all');
  
  const {
    allPosts,
    loading,
    selectedPost,
    setSelectedPost,
    likePost,
    unlikePost,
    bookmarkPost,
    unbookmarkPost,
    deletePost
  } = usePosts();

  // 高品質投稿のフィルタリング
  const filteredPosts = useMemo(() => {
    let filtered = allPosts.filter(post => {
      // 基本的な品質基準
      const hasMinimumQuality = 
        (post.photoScore && post.photoScore.total_score >= 60) ||
        post.likeCount >= 2 ||
        (post.tags && post.tags.length >= 1);
      
      if (!hasMinimumQuality) return false;

      // 検索クエリフィルタ
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          post.title.toLowerCase().includes(query) ||
          post.userComment?.toLowerCase().includes(query) ||
          post.tags?.some(tag => tag.name.toLowerCase().includes(query));
        
        if (!matchesSearch) return false;
      }

      // カテゴリフィルタ
      if (selectedCategory !== 'all') {
        const categoryTags = {
          photography: ['写真', '風景', 'ポートレート', 'street', 'nature'],
          art: ['アート', '絵画', 'イラスト', 'デザイン', 'creative'],
          design: ['デザイン', 'UI', 'UX', 'グラフィック', 'logo']
        };
        
        const relevantTags = categoryTags[selectedCategory];
        const hasRelevantTag = post.tags?.some(tag => 
          relevantTags.some(catTag => 
            tag.name.toLowerCase().includes(catTag.toLowerCase())
          )
        );
        
        if (!hasRelevantTag) return false;
      }

      return true;
    });

    // ソート
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'popular':
        filtered.sort((a, b) => b.likeCount - a.likeCount);
        break;
      case 'quality':
        filtered.sort((a, b) => {
          const scoreA = a.photoScore?.total_score || 0;
          const scoreB = b.photoScore?.total_score || 0;
          return scoreB - scoreA;
        });
        break;
    }

    return filtered;
  }, [allPosts, searchQuery, sortBy, selectedCategory]);

  // 提案された投稿をハイライト
  const suggestedPost = useMemo(() => {
    if (!suggestedPostId) return null;
    return allPosts.find(post => post.id === suggestedPostId);
  }, [allPosts, suggestedPostId]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-500" />
              <h1 className="text-2xl font-bold text-gray-900">インスピレーション探索</h1>
            </div>
          </div>

          {/* 提案された投稿のハイライト */}
          {suggestedPost && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200"
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-purple-700">AI推奨投稿</span>
              </div>
              <p className="text-sm text-gray-700 mb-3">
                この投稿からインスピレーションを得て、新しい作品を創造してみませんか？
              </p>
              <div className="max-w-xs">
                <PostCard
                  post={suggestedPost}
                  onClick={setSelectedPost}
                  likePost={likePost}
                  unlikePost={unlikePost}
                  bookmarkPost={bookmarkPost}
                  unbookmarkPost={unbookmarkPost}
                  deletePost={deletePost}
                  priority={true}
                  index={0}
                />
              </div>
            </motion.div>
          )}

          {/* 検索とフィルター */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* 検索バー */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="インスピレーションを検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* ソート */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            >
              <option value="quality">品質順</option>
              <option value="popular">人気順</option>
              <option value="recent">新着順</option>
            </select>

            {/* カテゴリ */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            >
              <option value="all">全カテゴリ</option>
              <option value="photography">写真</option>
              <option value="art">アート</option>
              <option value="design">デザイン</option>
            </select>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 統計情報 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-600">高品質投稿</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {filteredPosts.filter(post => post.photoScore && post.photoScore.total_score >= 80).length}
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              <span className="text-sm text-gray-600">人気投稿</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {filteredPosts.filter(post => post.likeCount >= 5).length}
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-gray-600">今日の投稿</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {filteredPosts.filter(post => 
                new Date(post.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
              ).length}
            </p>
          </div>
        </div>

        {/* 投稿グリッド */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <PostCard
                  post={post}
                  onClick={setSelectedPost}
                  likePost={likePost}
                  unlikePost={unlikePost}
                  bookmarkPost={bookmarkPost}
                  unbookmarkPost={unbookmarkPost}
                  deletePost={deletePost}
                  index={index}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              インスピレーションが見つかりませんでした
            </h3>
            <p className="text-gray-600">
              検索条件を変更して、新しいインスピレーションを探してみてください。
            </p>
          </div>
        )}
      </div>
    </div>
  );
};