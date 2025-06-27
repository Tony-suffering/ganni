import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Award, ChevronDown, ChevronUp } from 'lucide-react';
import { Post } from '../types';

interface PhotoRankingSectionProps {
  allPosts: Post[];
  onPostClick: (post: Post) => void;
  limit?: number;
}

export const PhotoRankingSection: React.FC<PhotoRankingSectionProps> = ({
  allPosts,
  onPostClick,
  limit = 10
}) => {
  const [showAll, setShowAll] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'all'>('today');
  // 本日の投稿を取得
  const todayPosts = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return allPosts.filter(post => {
      const postDate = new Date(post.createdAt).toISOString().split('T')[0];
      return postDate === today && post.photoScore?.total_score && post.photoScore.total_score > 0;
    });
  }, [allPosts]);

  // 歴代全投稿を取得
  const allTimePosts = useMemo(() => {
    return allPosts.filter(post => post.photoScore?.total_score && post.photoScore.total_score > 0);
  }, [allPosts]);

  // 現在選択されているタブの投稿をソート
  const rankedPosts = useMemo(() => {
    const posts = activeTab === 'today' ? todayPosts : allTimePosts;
    return posts
      .sort((a, b) => b.photoScore!.total_score - a.photoScore!.total_score)
      .slice(0, limit);
  }, [activeTab, todayPosts, allTimePosts, limit]);

  // 表示する投稿を決定（上位3位 or 全て）
  const displayPosts = showAll ? rankedPosts : rankedPosts.slice(0, 3);
  const hasMorePosts = rankedPosts.length > 3;

  // ランキング表示用のアイコンを取得
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="flex items-center space-x-1">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-bold text-yellow-600">1</span>
          </div>
        );
      case 2:
        return (
          <div className="flex items-center space-x-1">
            <Medal className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-bold text-gray-600">2</span>
          </div>
        );
      case 3:
        return (
          <div className="flex items-center space-x-1">
            <Award className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-bold text-orange-600">3</span>
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-sm font-bold text-gray-600">{rank}</span>
          </div>
        );
    }
  };

  // ランキング表示用の背景色を取得
  const getRankBgColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200';
      case 3:
        return 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  // スコアレベルの色を取得
  const getScoreLevelColor = (level: string) => {
    switch (level) {
      case 'S':
        return 'text-blue-600 bg-blue-100';
      case 'A':
        return 'text-red-600 bg-red-100';
      case 'B':
        return 'text-teal-600 bg-teal-100';
      case 'C':
        return 'text-blue-600 bg-blue-100';
      case 'D':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  if (rankedPosts.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 pt-0 pb-2">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-white" />
                <h2 className="text-sm font-bold text-white">🏆 スコアランキング</h2>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('today');
                  }}
                  className={`px-4 py-2 text-xs font-medium rounded transition-colors cursor-pointer ${
                    activeTab === 'today'
                      ? 'bg-white text-blue-600'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                  type="button"
                >
                  本日
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('all');
                  }}
                  className={`px-4 py-2 text-xs font-medium rounded transition-colors cursor-pointer ${
                    activeTab === 'all'
                      ? 'bg-white text-blue-600'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                  type="button"
                >
                  歴代
                </button>
              </div>
            </div>
          </div>
          <div className="p-3 text-center text-gray-500 text-xs">
            {activeTab === 'today' ? '本日はまだスコア付きの投稿がありません' : 'スコア付きの投稿がありません'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pt-0 pb-2">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* ヘッダーとタブ */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Trophy className="w-4 h-4 text-white" />
              <h2 className="text-sm font-bold text-white">🏆 スコアランキング</h2>
            </div>
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('today')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                  activeTab === 'today'
                    ? 'bg-white text-blue-600'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
                type="button"
              >
                本日
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-white text-blue-600'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
                type="button"
              >
                歴代
              </button>
            </div>
          </div>
        </div>

        {/* ランキングリスト */}
        <div className="divide-y divide-gray-100">
          {displayPosts.map((post, index) => {
            const rank = index + 1;
            const score = post.photoScore!;
            
            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`p-2 hover:bg-gray-50 cursor-pointer transition-colors ${getRankBgColor(rank)}`}
                onClick={() => onPostClick(post)}
              >
                <div className="flex items-center space-x-2">
                  {/* ランキング番号 */}
                  <div className="flex-shrink-0 w-8">
                    {getRankIcon(rank)}
                  </div>

                  {/* 写真 */}
                  <div className="relative w-12 h-12 flex-shrink-0 rounded-md overflow-hidden">
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    {/* スコア表示 */}
                    <div className="absolute bottom-0 left-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-1 py-0.5 text-xs font-bold rounded-tr-sm">
                      {score.total_score}
                    </div>
                  </div>

                  {/* 投稿情報 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium text-gray-900 text-xs leading-tight line-clamp-1 flex-1">
                        {post.title}
                      </h3>
                      {/* スコアレベル */}
                      <span className={`px-1.5 py-0.5 rounded text-xs font-bold ml-2 flex-shrink-0 ${getScoreLevelColor(score.score_level)}`}>
                        {score.score_level}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs line-clamp-1 mb-1">
                      {post.author.name}
                    </p>
                  </div>

                  {/* 総合スコア */}
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {score.total_score}
                    </div>
                    <div className="text-xs text-gray-400">
                      pt
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* 展開/折りたたみボタン */}
          {hasMorePosts && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-2 bg-gray-50 border-t border-gray-100"
              >
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="w-full flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <span className="text-xs font-medium">
                    {showAll ? '上位3位のみ表示' : `残り${rankedPosts.length - 3}位まで表示`}
                  </span>
                  {showAll ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              </motion.div>
            </AnimatePresence>
          )}
        </div>

      </div>
    </div>
  );
};