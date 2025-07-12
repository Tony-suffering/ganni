// カード生成に関するユーティリティ関数

import { GameCard } from '../types/cardgame';

// レア度判定基準
const RARITY_THRESHOLDS = {
  UR: 85,  // Ultra Rare: 85点以上
  SR: 70,  // Super Rare: 70点以上
  R: 50,   // Rare: 50点以上
  N: 0     // Normal: それ以下
};

// カードタイプ判定の基準
export interface CardMetrics {
  technicalScore: number;    // 技術的な質
  creativityScore: number;   // 創造性
  structureScore: number;    // 構成の良さ
  engagementScore: number;   // エンゲージメント（いいね、閲覧数など）
}

// スコアからレア度を判定
export const determineRarity = (totalScore: number): 'N' | 'R' | 'SR' | 'UR' => {
  if (totalScore >= RARITY_THRESHOLDS.UR) return 'UR';
  if (totalScore >= RARITY_THRESHOLDS.SR) return 'SR';
  if (totalScore >= RARITY_THRESHOLDS.R) return 'R';
  return 'N';
};

// カードタイプを自動判定
export const determineCardType = (
  metrics: CardMetrics,
  content?: string,
  tags?: string[]
): 'normal' | 'effect' | 'spell' | 'trap' => {
  const { technicalScore, creativityScore, structureScore } = metrics;
  
  // タグベースの判定（優先度高）
  if (tags) {
    const lowerTags = tags.map(tag => tag.toLowerCase());
    
    // 創造的・アート系のタグ → 魔法カード
    if (lowerTags.some(tag => 
      ['創作', 'アート', 'デザイン', '音楽', '詩', '小説', 'クリエイティブ'].includes(tag)
    )) {
      return 'spell';
    }
    
    // 技術的・プログラミング系のタグ → 罠カード
    if (lowerTags.some(tag => 
      ['プログラミング', 'コード', '技術', 'エンジニアリング', 'バグ', 'デバッグ'].includes(tag)
    )) {
      return 'trap';
    }
  }
  
  // スコアベースの判定
  const maxScore = Math.max(technicalScore, creativityScore, structureScore);
  
  // 創造性が特に高い → 魔法カード
  if (creativityScore === maxScore && creativityScore > 70) {
    return 'spell';
  }
  
  // 技術スコアが特に高い → 罠カード
  if (technicalScore === maxScore && technicalScore > 70) {
    return 'trap';
  }
  
  // バランスが良い高スコア → 効果モンスター
  if (totalScoreFromMetrics(metrics) > 60) {
    return 'effect';
  }
  
  // デフォルト → 通常モンスター
  return 'normal';
};

// メトリクスから総合スコアを計算
export const totalScoreFromMetrics = (metrics: CardMetrics): number => {
  const { technicalScore, creativityScore, structureScore, engagementScore } = metrics;
  return (technicalScore + creativityScore + structureScore + engagementScore) / 4;
};

// モンスタータイプを決定（種族）
export const determineMonsterType = (
  content: string,
  tags?: string[]
): string => {
  const lowerContent = content.toLowerCase();
  
  // タグベースの判定
  if (tags) {
    const lowerTags = tags.map(tag => tag.toLowerCase());
    
    if (lowerTags.some(tag => ['日常', '生活', '日記'].includes(tag))) {
      return '日常族';
    }
    if (lowerTags.some(tag => ['学習', '勉強', '成長'].includes(tag))) {
      return '成長族';
    }
    if (lowerTags.some(tag => ['挑戦', 'チャレンジ', '冒険'].includes(tag))) {
      return '挑戦族';
    }
    if (lowerTags.some(tag => ['感謝', '幸せ', '喜び'].includes(tag))) {
      return '幸福族';
    }
  }
  
  // コンテンツベースの判定
  if (lowerContent.includes('勉強') || lowerContent.includes('学習')) {
    return '学習族';
  }
  if (lowerContent.includes('仕事') || lowerContent.includes('プロジェクト')) {
    return 'ワーカー族';
  }
  if (lowerContent.includes('趣味') || lowerContent.includes('楽しい')) {
    return '趣味族';
  }
  
  return '日記族'; // デフォルト
};

// カード生成に必要な全ての情報を自動生成
export const generateCardData = (
  post: {
    title: string;
    content: string;
    imageUrl?: string;
    tags?: string[];
    likesCount?: number;
    viewsCount?: number;
  },
  metrics: CardMetrics
): Partial<GameCard> => {
  const totalScore = totalScoreFromMetrics(metrics);
  const rarity = determineRarity(totalScore);
  const cardType = determineCardType(metrics, post.content, post.tags);
  const monsterType = determineMonsterType(post.content, post.tags);
  
  // レベルを計算（1-8）
  const level = Math.min(8, Math.max(1, Math.ceil(totalScore / 12.5)));
  
  return {
    title: post.title,
    imageUrl: post.imageUrl || '/placeholder-image.jpg',
    level,
    rarity,
    attribute: post.tags || [],
    effectText: post.content.slice(0, 200) + (post.content.length > 200 ? '...' : ''),
    stats: {
      attack: Math.round(metrics.technicalScore * 30), // 最大3000
      defense: Math.round(metrics.structureScore * 30), // 最大3000
      speed: Math.round(metrics.creativityScore * 10), // 最大1000
      special: Math.round(metrics.engagementScore * 10) // 最大1000
    },
    totalScore,
    monsterType,
    tags: post.tags,
    likesCount: post.likesCount,
    viewsCount: post.viewsCount
  };
};