// AI パーソナル体験キュレーター統合システムの型定義

/**
 * 感情・嗜好分析結果
 */
export interface EmotionAnalysis {
  // 基本感情スコア (0-1)
  emotions: {
    joy: number;           // 喜び
    peace: number;         // 平和・安らぎ
    excitement: number;    // 興奮・刺激
    melancholy: number;    // 憂愁・物思い
    nostalgia: number;     // 郷愁・懐かしさ
    curiosity: number;     // 好奇心
    stress: number;        // ストレス・疲労
  };
  
  // 嗜好・関心分野 (0-1)
  interests: {
    nature: number;        // 自然・アウトドア
    urban: number;         // 都市・建築
    art: number;           // アート・美術
    food: number;          // 食・グルメ
    people: number;        // 人物・ポートレート
    travel: number;        // 旅行・観光
    culture: number;       // 文化・歴史
    technology: number;    // テクノロジー
  };
  
  // 撮影パターン
  patterns: {
    timePreference: 'morning' | 'afternoon' | 'evening' | 'night' | 'mixed';
    seasonPreference: 'spring' | 'summer' | 'autumn' | 'winter' | 'mixed';
    locationPreference: 'indoor' | 'outdoor' | 'mixed';
    socialPreference: 'solo' | 'group' | 'mixed';
  };
  
  confidence: number;      // 分析の信頼度 (0-1)
  lastUpdated: string;     // 最終更新日時
}

/**
 * 音楽・アート情報
 */
export interface CulturalContext {
  music: {
    genres: string[];           // 好みの音楽ジャンル
    mood: string;              // 現在の音楽的気分
    recommendations: string[]; // おすすめ楽曲・アーティスト
  };
  
  art: {
    exhibitions: ArtExhibition[];  // 近隣の展示会情報
    styles: string[];              // 好みのアートスタイル
    venues: ArtVenue[];            // おすすめ美術館・ギャラリー
  };
}

export interface ArtExhibition {
  id: string;
  title: string;
  venue: string;
  description: string;
  startDate: string;
  endDate: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  genres: string[];
  ticketPrice?: number;
  website?: string;
}

export interface ArtVenue {
  id: string;
  name: string;
  type: 'museum' | 'gallery' | 'cultural_center';
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  rating: number;
  description: string;
  openingHours: string;
  website?: string;
}

/**
 * レビュー・場所情報
 */
export interface PlaceRecommendation {
  id: string;
  name: string;
  type: 'restaurant' | 'cafe' | 'park' | 'viewpoint' | 'cultural_site' | 'shop';
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  rating: number;
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  description: string;
  tags: string[];
  reviewCount: number;
  photos: string[];
  openingHours?: string;
  website?: string;
}

/**
 * 生活パターン分析
 */
export interface LifestylePattern {
  // 活動時間帯
  timePatterns: {
    mostActiveHours: number[];     // 最も活発な時間帯
    weekdayPattern: number[];      // 平日の活動パターン
    weekendPattern: number[];      // 週末の活動パターン
  };
  
  // 移動・行動パターン
  behaviorPatterns: {
    averagePostingFrequency: number;   // 投稿頻度（週単位）
    travelRadius: number;              // 行動半径（km）
    favoriteLocations: string[];       // よく行く場所
    activityLevel: 'low' | 'medium' | 'high';
  };
  
  // 季節・天候パターン
  environmentalPatterns: {
    seasonalActivity: Record<string, number>;  // 季節別活動度
    weatherPreference: string[];               // 好む天候
  };
  
  lastAnalyzed: string;
  confidence: number;
}

/**
 * AI提案内容
 */
export interface PersonalizedSuggestion {
  id: string;
  type: 'experience' | 'location' | 'activity' | 'cultural' | 'growth' | 'food' | 'fitness' | 'education' | 'lifestyle';
  title: string;
  description: string;
  reasoning: string;         // 提案理由
  
  // 具体的な提案内容
  content: {
    primaryAction: string;    // メインアクション
    location?: PlaceRecommendation;
    timeRecommendation?: {
      bestTime: string;
      duration: string;
    };
    culturalContext?: CulturalContext;
    preparations?: string[];  // 準備・持ち物
    followUpActions?: string[]; // 次のアクション候補
  };
  
  // メタデータ
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  estimatedEngagement: number;  // 予想エンゲージメント (0-1)
  expirationDate?: string;      // 提案の有効期限
  
  // マネタイゼーション情報
  monetization?: {
    category: string;
    estimatedValue: number;
    affiliateOpportunity: string;
    conversionPotential: 'low' | 'medium' | 'high';
  };
  
  createdAt: string;
  generatedBy: 'ai_curator' | 'lifestyle_concierge' | 'growth_partner' | 'premium_ai_curator';
}

/**
 * ユーザーの成長追跡
 */
export interface GrowthTracking {
  // 技術的成長
  photographySkills: {
    technical: number;      // 技術レベル (0-100)
    artistic: number;       // 芸術レベル (0-100)
    consistency: number;    // 一貫性 (0-100)
    improvement: number;    // 改善度 (0-100)
  };
  
  // 体験の多様性
  experienceDiversity: {
    locationDiversity: number;   // 場所の多様性
    timeDiversity: number;       // 時間の多様性
    subjectDiversity: number;    // 被写体の多様性
    styleDiversity: number;      // スタイルの多様性
  };
  
  // 精神的・感情的成長
  emotionalGrowth: {
    positivity: number;          // ポジティブ度の変化
    openness: number;            // 新しい体験への開放性
    confidence: number;          // 自信度
    socialConnection: number;    // 社会的つながり
  };
  
  // マイルストーン
  milestones: Milestone[];
  
  // 成長グラフデータ
  growthHistory: {
    date: string;
    scores: Record<string, number>;
  }[];
  
  lastUpdated: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  category: 'technical' | 'artistic' | 'personal' | 'social';
  achievedAt: string;
  significance: 'small' | 'medium' | 'major';
}

/**
 * 統合キュレーターの設定
 */
export interface CuratorConfig {
  // 機能の有効/無効
  features: {
    emotionAnalysis: boolean;
    culturalRecommendations: boolean;
    lifestyleTracking: boolean;
    growthMonitoring: boolean;
    locationServices: boolean;
  };
  
  // パーソナライゼーション設定
  preferences: {
    suggestionFrequency: 'minimal' | 'moderate' | 'frequent';
    adventureLevel: 'conservative' | 'moderate' | 'adventurous';
    privacyLevel: 'strict' | 'balanced' | 'open';
    focusAreas: string[];  // 重点分野
  };
  
  // API設定
  apiKeys: {
    spotify?: string;
    googleMaps?: string;
    culturalAPIs?: Record<string, string>;
  };
  
  lastConfigUpdate: string;
}

/**
 * キュレーターの総合状態
 */
export interface CuratorState {
  userId: string;
  emotionAnalysis: EmotionAnalysis;
  lifestylePattern: LifestylePattern;
  growthTracking: GrowthTracking;
  activeSuggestions: PersonalizedSuggestion[];
  config: CuratorConfig;
  
  // システム情報
  lastFullAnalysis: string;
  nextScheduledUpdate: string;
  analysisVersion: string;
}

/**
 * 分析リクエスト
 */
export interface AnalysisRequest {
  userId: string;
  posts: {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    createdAt: string;
    location?: {
      latitude: number;
      longitude: number;
    };
    tags: string[];
    photoScore?: {
      technical_score: number;
      composition_score: number;
      creativity_score: number;
      engagement_score: number;
      total_score: number;
      score_level: string;
      level_description: string;
      ai_comment: string;
    };
  }[];
  timeframe?: {
    start: string;
    end: string;
  };
  analysisDepth: 'quick' | 'standard' | 'deep';
}

/**
 * API応答形式
 */
export interface CuratorResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    processingTime: number;
    confidence: number;
    version: string;
  };
}