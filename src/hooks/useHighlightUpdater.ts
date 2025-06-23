import { useEffect, useRef } from 'react';
import { Post } from '../types';
import { HighlightService } from '../services/highlightService';

interface UseHighlightUpdaterOptions {
  allPosts: Post[];
  updateIntervalMinutes?: number;
  enabled?: boolean;
}

/**
 * バックグラウンドでハイライト投稿を定期更新するカスタムフック
 */
export const useHighlightUpdater = ({
  allPosts,
  updateIntervalMinutes = 30, // デフォルト30分間隔
  enabled = true
}: UseHighlightUpdaterOptions) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled || allPosts.length === 0) {
      return;
    }

    // 分をミリ秒に変換
    const minUpdateInterval = updateIntervalMinutes * 60 * 1000;

    const updateHighlights = async () => {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateRef.current;

      // 最小更新間隔をチェック
      if (timeSinceLastUpdate < minUpdateInterval) {
        return;
      }

      try {
        console.log('バックグラウンドでハイライトを更新中...');
        await HighlightService.updateHighlights(allPosts);
        lastUpdateRef.current = now;
        console.log('ハイライト更新完了');
      } catch (error) {
        console.error('バックグラウンドハイライト更新エラー:', error);
      }
    };

    // 初回実行（少し遅延させてアプリ起動への影響を最小化）
    const initialTimeout = setTimeout(() => {
      updateHighlights();
    }, 5000); // 5秒後

    // 定期実行を設定
    intervalRef.current = setInterval(updateHighlights, minUpdateInterval);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [allPosts, updateIntervalMinutes, enabled]);

  // 手動更新関数を提供
  const manualUpdate = async () => {
    if (allPosts.length === 0) return;
    
    try {
      await HighlightService.updateHighlights(allPosts);
      lastUpdateRef.current = Date.now();
    } catch (error) {
      console.error('手動ハイライト更新エラー:', error);
      throw error;
    }
  };

  return { manualUpdate };
};