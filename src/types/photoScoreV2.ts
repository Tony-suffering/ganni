// 開発者専用1000点満点システム用の型定義

export interface DetailedPhotoScore {
  // 総合スコア
  totalScore: number; // 1000点満点
  scoreLevel: 'S+' | 'S' | 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'E';
  levelDescription: string;
  
  // 技術的品質 (300点)
  technical: {
    total: number;
    exposure: number; // 60点 - 露出・明度
    focus: number; // 60点 - フォーカス・シャープネス
    colorQuality: number; // 60点 - 色彩・画質
    shootingTechnique: number; // 60点 - 撮影技術
    postProcessing: number; // 60点 - 後処理技術
  };
  
  // 構図・アート性 (250点)
  composition: {
    total: number;
    basicComposition: number; // 80点 - 基本構図法
    spatialComposition: number; // 70点 - 空間構成
    visualBalance: number; // 50点 - 視覚的バランス
    creativeViewpoint: number; // 50点 - 独創的視点
  };
  
  // 創造性・表現力 (250点)
  creativity: {
    total: number;
    lightExpression: number; // 80点 - 光の表現
    subjectMoment: number; // 70点 - 被写体・瞬間
    storytelling: number; // 60点 - ストーリーテリング
    artisticValue: number; // 40点 - 芸術的価値
  };
  
  // エンゲージメント・魅力度 (200点)
  engagement: {
    total: number;
    visualImpact: number; // 70点 - 視覚的インパクト
    relatability: number; // 60点 - 共感・親近感
    socialMedia: number; // 40点 - SNS適性
    memorability: number; // 30点 - 記憶定着度
  };
  
  // フィードバック
  overallComment: string;
  detailedFeedback: {
    strengths: string[]; // 強み
    improvements: string[]; // 改善点
    technicalAdvice: string[]; // 技術的アドバイス
    creativeSuggestions: string[]; // 創造的提案
  };
  
  // 詳細画像分析データ（深層心理分析用）
  imageAnalysis: {
    mainColors: string[]; // 主要色彩
    colorTemperature: string; // 色温度の印象
    compositionType: string; // 構図タイプ
    mainSubject: string; // 主被写体
    backgroundElements: string[]; // 背景要素
    lightingQuality: string; // 光の質
    moodAtmosphere: string; // 写真の雰囲気
    shootingAngle: string; // 撮影角度
    depthPerception: string; // 奥行き感
    visualImpactDescription: string; // 視覚的インパクト
    emotionalTrigger: string; // 感情的トリガー
    technicalSignature: string; // 技術的特徴
  };
  
  // メタデータ
  analysisVersion: string;
  processingTime: number;
  confidence: number; // AI分析の信頼度 (0-1)
}

export interface ScoreBreakdown {
  category: string;
  score: number;
  maxScore: number;
  feedback: string;
  suggestions: string[];
}

// 開発者認証用
export interface DevAuthConfig {
  isDeveloper: boolean;
  accessLevel: 'basic' | 'advanced' | 'full';
  features: string[];
}