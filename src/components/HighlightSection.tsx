import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Award } from 'lucide-react';
import { HighlightPost, HighlightService } from '../services/highlightService';
import { Post } from '../types';

interface HighlightSectionProps {
  allPosts: Post[];
  onPostClick: (post: Post) => void;
  likePost?: (postId: string) => void;
  unlikePost?: (postId: string) => void;
  compact?: boolean;
}

export const HighlightSection: React.FC<HighlightSectionProps> = ({
  allPosts,
  onPostClick,
  compact = false
}) => {
  const [highlights, setHighlights] = useState<HighlightPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 強制リフレッシュ用のキーを追加
  const [refreshKey, setRefreshKey] = useState(Date.now());

  // allPostsの変更をメモ化してパフォーマンス向上
  // 投稿の数だけでなく、投稿のIDと更新時刻も依存関係に含める
  const memoizedAllPosts = useMemo(() => allPosts, [
    allPosts.length,
    allPosts.map(p => p.id).join(','),
    allPosts.map(p => p.updatedAt).join(',')
  ]);

  const loadHighlights = useCallback(async () => {
    if (memoizedAllPosts.length === 0) return;

    try {
      setLoading(true);
      setError(null);

      console.log('🔄 ハイライト読み込み開始:', {
        投稿数: memoizedAllPosts.length,
        タイムスタンプ: new Date().toISOString(),
        強制更新: true
      });

      // 毎回新しくハイライトを生成（リロード毎に変更）
      // 前回の結果をクリアして完全に新しい選択を強制
      setHighlights([]);
      
      const newHighlights = await HighlightService.selectHighlightPosts(memoizedAllPosts);
      console.log('🎨 新しいハイライト生成:', newHighlights.map(h => ({
        id: h.id.slice(0,8) + '...',
        タイトル: h.title.slice(0,25) + '...',
        スコア: h.highlightScore,
        理由: h.highlightReason
      })));
      
      setHighlights(newHighlights);
      
      // バックグラウンドで保存（エラーが出ても表示は継続）
      // 保存する前に、古いハイライトをクリアして新しい選択を確実にする
      try {
        await HighlightService.clearStoredHighlights();
        await HighlightService.saveHighlights(newHighlights);
      } catch (err) {
        console.warn('ハイライト保存に失敗:', err);
      }
    } catch (err) {
      console.error('ハイライト読み込みエラー:', err);
      setError('ハイライトの読み込みに失敗しました');
      
      // フォールバック: 保存されたハイライトは使用せず、エラー時は空の状態を維持
      // これにより、毎回新しい選択を強制する
      console.warn('⚠️ ハイライト生成に失敗。フォールバックはスキップして新しい選択を試行します。');
      
      // 一定時間後に再試行
      setTimeout(() => {
        console.log('🔄 ハイライト生成を再試行中...');
        loadHighlights();
      }, 2000);
    } finally {
      setLoading(false);
    }
  }, [memoizedAllPosts]);

  useEffect(() => {
    // ページ読み込み時に新しいリフレッシュキーを生成
    setRefreshKey(Date.now());
    loadHighlights();
  }, [loadHighlights]);

  // ページのフォーカス時にもリフレッシュ（リロード時の新しい選択を確保）
  useEffect(() => {
    const handleFocus = () => {
      console.log('🔄 ページフォーカス時のハイライト更新');
      setRefreshKey(Date.now());
      setTimeout(() => loadHighlights(), 100);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 ページ表示時のハイライト更新');
        setRefreshKey(Date.now());
        setTimeout(() => loadHighlights(), 100);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadHighlights]);

  // ページのフォーカス時にもリフレッシュ
  useEffect(() => {
    const handleFocus = () => {
      console.log('🔄 ページフォーカス時にハイライトをリフレッシュ');
      setRefreshKey(Date.now());
      loadHighlights();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadHighlights]);

  // highlightsの状態変化を監視
  useEffect(() => {
    console.log('📱 HighlightSection highlights更新:', {
      長さ: highlights.length,
      投稿ID: highlights.map(h => `${h.id.slice(0,8)}...`),
      重複チェック: highlights.length !== new Set(highlights.map(h => h.id)).size ? '⚠️ 重複あり' : '✅ 重複なし'
    });
  }, [highlights]);

  // 不要な関数を削除

  if (loading) {
    if (compact) {
      return (
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-gray-500">選択中...</span>
        </div>
      );
    }
    return (
      <section className="bg-white py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-600 font-medium">AIピックアップを選択中...</span>
          </div>
        </div>
      </section>
    );
  }

  if (error && highlights.length === 0) {
    return null; // エラー時は何も表示しない
  }

  if (highlights.length === 0) return null;

  // コンパクト表示の場合
  if (compact) {
    return (
      <div className="flex items-center">
        {highlights
          .filter((post, index, arr) => arr.findIndex(p => p.id === post.id) === index)
          .slice(0, 1)
          .map((post) => (
            <motion.div
              key={`compact-highlight-${post.id}-${refreshKey}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="group cursor-pointer"
              onClick={() => onPostClick(post)}
            >
              <div className="flex items-center space-x-2 hover:bg-gray-50 rounded-lg p-1 transition-colors">
                <div className="relative w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 rounded overflow-hidden">
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute bottom-0 left-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-1 text-xs font-bold">
                    {post.photoScore?.total_score ? `${post.photoScore.total_score}pt` : '--'}
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400 font-medium">AI厳選</span>
                  <span className="text-xs sm:text-sm text-gray-700 font-medium truncate max-w-16 sm:max-w-24">
                    {post.title}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      {/* AIピックアップセクション - 通常デザイン */}
      {highlights.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-5 h-5 bg-gray-800 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">★</span>
            </div>
            <h3 className="text-sm font-medium text-gray-700">AIピックアップ</h3>
          </div>
          
          {highlights
            .filter((post, index, arr) => arr.findIndex(p => p.id === post.id) === index)
            .slice(0, 1)
            .map((post) => {
              return (
              <motion.div
                key={`highlight-${post.id}-${refreshKey}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="group cursor-pointer"
                onClick={() => onPostClick(post)}
              >
                <div className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 overflow-hidden">
                  <div className="flex p-3 space-x-3">
                    {/* 画像 */}
                    <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      
                      {/* 左下のAI写真採点点数 - AI採点がある場合のみ表示 */}
                      {post.photoScore?.total_score && (
                        <div className="absolute bottom-0 left-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-0.5 text-xs font-bold rounded-tr-md">
                          {post.photoScore.total_score}pt
                        </div>
                      )}
                    </div>
                    
                    {/* 投稿情報 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-medium text-gray-900 text-sm leading-tight line-clamp-1 flex-1">
                          {post.title}
                        </h4>
                        
                        {/* 右上のAI厳選バッジ - シンプル */}
                        <span className="bg-gray-800 text-white px-2 py-1 rounded text-xs font-medium ml-2 flex-shrink-0">
                          AI厳選
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-xs line-clamp-2 mb-2 leading-relaxed">
                        {post.userComment || post.aiDescription}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {post.author.name}
                        </span>
                        
                        <div className="flex items-center space-x-2">
                          {post.photoScore && post.photoScore.score_level && (
                            <span className="text-xs text-gray-600 font-medium">
                              {post.photoScore.score_level}級
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {post.highlightReason}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
              );
            })}
        </div>
      )}
    </div>
  );
};