export interface Post {
  id: string;
  title: string;
  imageUrl: string;
  userComment: string;
  aiDescription: string;
  imageAIDescription: string;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  aiComments: AIComment[];
  likeCount: number;
  likedByCurrentUser: boolean;
  bookmarkedByCurrentUser: boolean;
  commentCount: number;
  photoScore?: PhotoScore;
  inspiration?: {
    source_post_id: string;
    source_post?: {
      id: string;
      title: string;
      imageUrl: string;
      author: {
        id: string;
        name: string;
        avatar: string;
      };
    };
    type: string;
    note?: string;
    chain_level: number;
  };
}

export interface PhotoScore {
  id?: string;
  post_id?: string;
  technical_score: number;
  composition_score: number;
  creativity_score: number;
  engagement_score: number;
  total_score: number;
  score_level: string;
  level_description: string;
  ai_comment: string;
  created_at?: string;
  updated_at?: string;
}

export interface AIComment {
  id: string;
  type: string;
  content: string;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  category: string;
  color: string;
}

export interface FilterOptions {
  tags: string[];
  sortBy: 'newest' | 'oldest' | 'popular' | 'random';
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  role: 'user' | 'admin';
}

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
    avatar_url?: string;
  };
}

// Import database types
export { Database } from './database';

// コメント関連の型定義
export interface Comment {
  id: string;
  content: string;
  type: 'user' | 'ai_comment' | 'ai_question' | 'ai_observation';
  author_id: string;
  post_id: string;
  parent_id?: string;
  published: boolean;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

// 商品推薦関連の型定義
export interface Product {
  id: string;
  name: string;
  price: string;
  imageUrl?: string;
  affiliateUrl: string;
  category: string;
  tags: string[];
  reason?: string;
}

export interface ProductRecommendation {
  products: Product[];
  context: PostContext;
  recommendations: RecommendationGroup[];
}

export interface PostContext {
  objects: string[];
  scene: string;
  emotion: string;
  needs: string[];
  season?: string;
  timeOfDay?: string;
}

export interface RecommendationGroup {
  title: string;
  products: Product[];
  reason: string;
}

// 開発者専用1000点満点採点システム V2
export * from './photoScoreV2';

// AIパーソナルキュレーター統合システム
export * from './curator';