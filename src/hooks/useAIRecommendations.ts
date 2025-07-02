import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Post } from '../types';

interface RecommendationCriteria {
  minPhotoScore?: number;
  minLikes?: number;
  recentHours?: number;
  userActivityLevel?: 'low' | 'medium' | 'high';
}

interface AIRecommendation {
  id: string;
  type: 'inspiration_prompt' | 'quality_recognition' | 'engagement_boost';
  message: string;
  targetPath?: string;
  criteria: string[];
  priority: number;
  expiresAt?: Date;
}

export const useAIRecommendations = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [dismissedRecommendations, setDismissedRecommendations] = useState<Set<string>>(new Set());

  // 高品質投稿の判定基準
  const isHighQualityPost = useCallback((post: Post): boolean => {
    const criteria = {
      hasPhotoScore: post.photoScore && post.photoScore.total_score >= 70,
      hasGoodEngagement: post.likeCount >= 3,
      isRecent: new Date(post.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000), // 24時間以内
      hasDescription: post.userComment && post.userComment.length > 10,
      hasTags: post.tags && post.tags.length > 0
    };

    // 3つ以上の基準を満たす場合に高品質とみなす
    const metCriteria = Object.values(criteria).filter(Boolean).length;
    return metCriteria >= 3;
  }, []);

  // ユーザーの活動レベルを判定
  const getUserActivityLevel = useCallback((userPosts: Post[]): 'low' | 'medium' | 'high' => {
    const recentPosts = userPosts.filter(post => 
      new Date(post.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7日以内
    );

    if (recentPosts.length >= 5) return 'high';
    if (recentPosts.length >= 2) return 'medium';
    return 'low';
  }, []);

  // レコメンデーションメッセージのバリエーション
  const getRecommendationMessage = useCallback((post: Post, criteria: string[]): string => {
    const messages = [
      "素晴らしい写真ですね！他の投稿者にインスピレーションを与えてみませんか？",
      "この投稿は注目度が高いようです！インスピレーションとして共有してみては？",
      "クリエイティブな作品ですね！他のクリエイターとつながってみませんか？",
      "この投稿にインスパイアされた作品を探してみませんか？",
      "素敵な投稿です！同じテーマの作品を発見してみては？"
    ];

    // 基準に基づいてメッセージを選択
    if (criteria.includes('high_photo_score')) {
      return "AIが高品質と判定しました！他の投稿者にインスピレーションを与えてみませんか？";
    }
    if (criteria.includes('high_engagement')) {
      return "多くの人に愛されている投稿ですね！インスピレーションとして広めてみませんか？";
    }
    if (criteria.includes('creative_content')) {
      return "とてもクリエイティブな投稿です！同じテーマの作品を探してみませんか？";
    }

    // デフォルトメッセージからランダム選択
    return messages[Math.floor(Math.random() * messages.length)];
  }, []);

  // レコメンデーション生成
  const generateRecommendations = useCallback((posts: Post[], userPosts: Post[]) => {
    if (!user) return;

    const newRecommendations: AIRecommendation[] = [];
    const activityLevel = getUserActivityLevel(userPosts);

    // 最新の投稿をチェック
    const recentUserPosts = userPosts
      .filter(post => new Date(post.createdAt) > new Date(Date.now() - 6 * 60 * 60 * 1000)) // 6時間以内
      .slice(0, 3);

    recentUserPosts.forEach(post => {
      if (isHighQualityPost(post)) {
        const criteria: string[] = [];
        
        // 基準の詳細判定
        if (post.photoScore && post.photoScore.total_score >= 80) {
          criteria.push('high_photo_score');
        }
        if (post.likeCount >= 5) {
          criteria.push('high_engagement');
        }
        if (post.tags && post.tags.length >= 3) {
          criteria.push('well_tagged');
        }
        if (post.userComment && post.userComment.length > 50) {
          criteria.push('detailed_description');
        }

        const recommendationId = `inspiration_prompt_${post.id}_${Date.now()}`;
        
        // すでに無視されたレコメンデーションはスキップ
        if (dismissedRecommendations.has(recommendationId)) {
          return;
        }

        const recommendation: AIRecommendation = {
          id: recommendationId,
          type: 'inspiration_prompt',
          message: getRecommendationMessage(post, criteria),
          targetPath: `/inspiration/explore?suggested=${post.id}`,
          criteria,
          priority: criteria.length * 10 + post.likeCount,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24時間後に期限切れ
        };

        newRecommendations.push(recommendation);
      }
    });

    // 活動レベルに応じてレコメンデーション頻度を調整
    const maxRecommendations = activityLevel === 'high' ? 2 : activityLevel === 'medium' ? 1 : 1;
    
    // 優先度順にソートして制限
    const sortedRecommendations = newRecommendations
      .sort((a, b) => b.priority - a.priority)
      .slice(0, maxRecommendations);

    setRecommendations(sortedRecommendations);
  }, [user, isHighQualityPost, getUserActivityLevel, getRecommendationMessage, dismissedRecommendations]);

  // レコメンデーションを無視
  const dismissRecommendation = useCallback((recommendationId: string) => {
    setDismissedRecommendations(prev => new Set([...prev, recommendationId]));
    setRecommendations(prev => prev.filter(rec => rec.id !== recommendationId));
  }, []);

  // 期限切れレコメンデーションのクリーンアップ
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = new Date();
      setRecommendations(prev => 
        prev.filter(rec => !rec.expiresAt || rec.expiresAt > now)
      );
    }, 60000); // 1分ごとにチェック

    return () => clearInterval(cleanup);
  }, []);

  // ローカルストレージから無視リストを復元
  useEffect(() => {
    const saved = localStorage.getItem('dismissedAIRecommendations');
    if (saved) {
      try {
        const parsedDismissed = JSON.parse(saved);
        setDismissedRecommendations(new Set(parsedDismissed));
      } catch (error) {
        console.warn('Failed to parse dismissed recommendations:', error);
      }
    }
  }, []);

  // 無視リストをローカルストレージに保存
  useEffect(() => {
    localStorage.setItem(
      'dismissedAIRecommendations', 
      JSON.stringify([...dismissedRecommendations])
    );
  }, [dismissedRecommendations]);

  return {
    recommendations,
    generateRecommendations,
    dismissRecommendation,
    isHighQualityPost
  };
};