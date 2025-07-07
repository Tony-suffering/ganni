import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Medal, Award, ChevronDown, ChevronUp } from 'lucide-react';
import { Post } from '../../types';

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
  const [activeTab, setActiveTab] = useState<'today' | 'all' | 'weekly' | 'average'>('today');
  // 本日の投稿を取得
  const todayPosts = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return allPosts.filter(post => {
      const postDate = new Date(post.createdAt).toISOString().split('T')[0];
      return postDate === today && post.photoScore?.total_score && post.photoScore.total_score > 0;
    });
  }, [allPosts]);

  // 週間投稿を取得（過去7日間）
  const weeklyPosts = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return allPosts.filter(post => {
      const postDate = new Date(post.createdAt);
      return postDate >= oneWeekAgo && post.photoScore?.total_score && post.photoScore.total_score > 0;
    });
  }, [allPosts]);

  // 歴代全投稿を取得
  const allTimePosts = useMemo(() => {
    return allPosts.filter(post => post.photoScore?.total_score && post.photoScore.total_score > 0);
  }, [allPosts]);

  // ユーザー平均スコアランキングを取得
  const averageScoreRanking = useMemo(() => {
    const userStats = new Map<string, { userId: string; name: string; avatar: string; scores: number[]; totalScore: number; avgScore: number }>();
    
    // ユーザーごとにスコアを集計
    allPosts.forEach(post => {
      if (post.photoScore?.total_score && post.photoScore.total_score > 0) {
        const userId = post.author.id;
        if (!userStats.has(userId)) {
          userStats.set(userId, {
            userId,
            name: post.author.name,
            avatar: post.author.avatar,
            scores: [],
            totalScore: 0,
            avgScore: 0
          });
        }
        const userStat = userStats.get(userId)!;
        userStat.scores.push(post.photoScore.total_score);
        userStat.totalScore += post.photoScore.total_score;
      }
    });

    // 平均スコアを計算して配列に変換
    return Array.from(userStats.values())
      .map(user => ({
        ...user,
        avgScore: Math.round(user.totalScore / user.scores.length)
      }))
      .filter(user => user.scores.length >= 2) // 最低2投稿以上のユーザーのみ
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, limit);
  }, [allPosts, limit]);

  // 現在選択されているタブの投稿をソート
  const rankedPosts = useMemo(() => {
    if (activeTab === 'average') {
      // 平均スコアランキングの場合は空配列を返す（別途表示）
      return [];
    }
    
    const posts = activeTab === 'today' ? todayPosts : 
                  activeTab === 'weekly' ? weeklyPosts : allTimePosts;
    return posts
      .sort((a, b) => b.photoScore!.total_score - a.photoScore!.total_score)
      .slice(0, limit);
  }, [activeTab, todayPosts, weeklyPosts, allTimePosts, limit]);

  // 表示するデータを決定（投稿 or ユーザー平均）
  const displayPosts = activeTab === 'average' ? [] : (showAll ? rankedPosts : rankedPosts.slice(0, 3));
  const displayUsers = activeTab === 'average' ? (showAll ? averageScoreRanking : averageScoreRanking.slice(0, 3)) : [];
  const hasMoreItems = activeTab === 'average' ? averageScoreRanking.length > 3 : rankedPosts.length > 3;

  // ランキング表示用のアイコンを取得
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="flex items-center space-x-1">
            <img src="/Trophy.png" alt="Trophy" className="w-5 h-5 brightness-150 contrast-125" />
            <span className="text-sm font-bold text-gray-600">1</span>
          </div>
        );
      case 2:
        return (
          <div className="flex items-center space-x-1">
            <Medal className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-bold text-gray-500">2</span>
          </div>
        );
      case 3:
        return (
          <div className="flex items-center space-x-1">
            <Award className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-bold text-gray-500">3</span>
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
        return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200';
      case 3:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200';
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

  if (rankedPosts.length === 0 && averageScoreRanking.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 pt-0 pb-2">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-600 to-gray-700 px-4 py-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <img src="/Trophy.png" alt="Trophy" className="w-5 h-5 brightness-200 contrast-150" />
                <h2 className="text-sm font-bold text-white">スコアランキング</h2>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => setActiveTab('today')}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                    activeTab === 'today'
                      ? 'bg-white text-gray-700'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  本日
                </button>
                <button
                  onClick={() => setActiveTab('weekly')}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                    activeTab === 'weekly'
                      ? 'bg-white text-gray-700'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  週間
                </button>
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                    activeTab === 'all'
                      ? 'bg-white text-gray-700'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  歴代
                </button>
                <button
                  onClick={() => setActiveTab('average')}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                    activeTab === 'average'
                      ? 'bg-white text-gray-700'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  平均
                </button>
              </div>
            </div>
          </div>
          <div className="p-3 text-center text-gray-500 text-xs">
            {activeTab === 'today' ? '本日はまだスコア付きの投稿がありません' : 
             activeTab === 'weekly' ? '今週はまだスコア付きの投稿がありません' :
             activeTab === 'average' ? '平均スコアを計算できるユーザーがいません（最低2投稿必要）' :
             'スコア付きの投稿がありません'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pt-0 pb-2">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* ヘッダーとタブ */}
        <div className="bg-gradient-to-r from-gray-600 to-gray-700 px-4 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img src="/Trophy.png" alt="Trophy" className="w-5 h-5 brightness-150 contrast-125" />
              <h2 className="text-sm font-bold text-white">スコアランキング</h2>
            </div>
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('today')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                  activeTab === 'today'
                    ? 'bg-white text-gray-700'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                本日
              </button>
              <button
                onClick={() => setActiveTab('weekly')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                  activeTab === 'weekly'
                    ? 'bg-white text-gray-700'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                週間
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-white text-gray-700'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                歴代
              </button>
              <button
                onClick={() => setActiveTab('average')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                  activeTab === 'average'
                    ? 'bg-white text-gray-700'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                平均
              </button>
            </div>
          </div>
        </div>

        {/* ランキングリスト */}
        <div className="divide-y divide-gray-100">
          {/* 投稿ランキング表示 */}
          {activeTab !== 'average' && displayPosts.map((post, index) => {
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
                      <h3 className="font-medium text-gray-700 text-xs leading-tight line-clamp-1 flex-1">
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
                    <div className="text-lg font-bold text-gray-700">
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

          {/* ユーザー平均スコアランキング表示 */}
          {activeTab === 'average' && displayUsers.map((user, index) => {
            const rank = index + 1;
            
            return (
              <motion.div
                key={user.userId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`p-2 hover:bg-gray-50 transition-colors ${getRankBgColor(rank)}`}
              >
                <div className="flex items-center space-x-2">
                  {/* ランキング番号 */}
                  <div className="flex-shrink-0 w-8">
                    {getRankIcon(rank)}
                  </div>

                  {/* ユーザーアバター */}
                  <div className="relative w-12 h-12 flex-shrink-0 rounded-full overflow-hidden">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {/* スコア表示 */}
                    <div className="absolute bottom-0 left-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-1 py-0.5 text-xs font-bold rounded-tr-sm">
                      {user.avgScore}
                    </div>
                  </div>

                  {/* ユーザー情報 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium text-gray-700 text-sm leading-tight line-clamp-1 flex-1">
                        {user.name}
                      </h3>
                      {/* レベル表示 */}
                      <span className="px-1.5 py-0.5 rounded text-xs font-bold ml-2 flex-shrink-0 bg-purple-100 text-purple-600">
                        AVG
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs line-clamp-1 mb-1">
                      {user.scores.length}件の投稿
                    </p>
                  </div>

                  {/* 平均スコア */}
                  <div className="text-right">
                    <div className="text-lg font-bold text-purple-600">
                      {user.avgScore}
                    </div>
                    <div className="text-xs text-gray-400">
                      平均pt
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* 展開/折りたたみボタン */}
          {hasMoreItems && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-2 bg-gray-50 border-t border-gray-100"
              >
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="w-full flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-700 transition-colors"
                >
                  <span className="text-xs font-medium">
                    {showAll ? '上位3位のみ表示' : 
                     activeTab === 'average' ? `残り${averageScoreRanking.length - 3}位まで表示` :
                     `残り${rankedPosts.length - 3}位まで表示`}
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