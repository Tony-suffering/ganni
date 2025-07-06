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
  author_name?: string; // フォールバック用
  author_avatar?: string; // フォールバック用
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
  // 深層心理分析用の詳細画像データ
  image_analysis?: {
    mainColors: string[];
    colorTemperature: string;
    compositionType: string;
    mainSubject: string;
    specificContent: string;  // 具体的な内容物、固有名詞
    backgroundElements: string[];
    lightingQuality: string;
    moodAtmosphere: string;
    shootingAngle: string;
    depthPerception: string;
    visualImpact: string;
    emotionalTrigger: string;
    technicalSignature: string;
  };
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


// ========================================
// ゲーミフィケーション・ポイントシステム
// ========================================

// ユーザーポイント
export interface UserPoints {
  id: string;
  user_id: string;
  learning_points: number; // 学習ポイント (LP)
  influence_points: number; // 影響力ポイント (IP)
  total_points: number; // 総合ポイント
  level: number; // ユーザーレベル
  created_at: string;
  updated_at: string;
}

// ポイント履歴
export interface PointHistory {
  id: string;
  user_id: string;
  point_type: 'learning' | 'influence';
  points: number;
  action_type: string; // 'inspiration_created', 'inspiration_received', 'chain_bonus'
  related_post_id?: string;
  related_inspiration_id?: string;
  description?: string;
  created_at: string;
}

// バッジ定義
export interface Badge {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  icon: string; // emoji
  category: 'learner' | 'mentor' | 'special';
  requirement_type: string; // 'inspiration_count', 'inspired_count', 'chain_level'
  requirement_value: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  color: string;
  is_active: boolean;
  created_at: string;
}

// ユーザーバッジ
export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  is_displayed: boolean;
  badge?: Badge; // JOIN時に含まれる
}

// ユーザー統計
export interface UserInspirationStats {
  id: string;
  user_id: string;
  inspiration_given_count: number; // 与えたインスピレーション数
  inspiration_received_count: number; // 受けたインスピレーション数
  max_chain_level: number; // 最大チェーンレベル
  different_types_used: number; // 使用した異なるタイプ数
  weekly_inspiration_count: number; // 今週のインスピレーション数
  monthly_inspiration_count: number; // 今月のインスピレーション数
  last_inspiration_date?: string;
  streak_days: number; // 連続インスピレーション日数
  created_at: string;
  updated_at: string;
}

// ユーザープロフィール拡張（ポイント・バッジ情報含む）
export interface ExtendedUser extends User {
  points?: UserPoints;
  badges?: UserBadge[];
  stats?: UserInspirationStats;
  level?: number;
  displayBadges?: Badge[]; // 表示用のバッジ情報
}

// レベル情報
export interface LevelInfo {
  level: number;
  currentPoints: number;
  nextLevelPoints: number;
  progressPercentage: number;
  levelName: string;
}

// ランキング項目
export interface RankingUser {
  user_id: string;
  name: string;
  avatar: string;
  points: number;
  level: number;
  rank: number;
  badges: Badge[];
}

// 開発者専用1000点満点採点システム V2
export * from './photoScoreV2';

// AIパーソナルキュレーター統合システム
export * from './curator';