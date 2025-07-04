import { useState, useCallback } from 'react';
import { PhotoScore, AIComment, ProductRecommendation, Post } from '../types';
import { PhotoScoringService } from '../services/photoScoringService';
import { productRecommendationService } from '../services/productRecommendationService';
import { geminiService } from '../services/geminiService';
import { integratedAnalysisService, IntegratedAnalysisResult } from '../services/integratedAnalysisService';
import { PersonalPattern } from '../services/patternAnalysisService';
import { supabase } from '../supabase';

interface AIAnalysisState {
  isAnalyzing: boolean;
  photoScore: PhotoScore | null;
  aiComments: AIComment[]; // 互換性のため保持（空配列）
  productRecommendations: ProductRecommendation | null;
  personalPattern: PersonalPattern | null;
  progress: {
    photoScore: boolean;
    aiComments: boolean; // 互換性のため保持（常にtrue）
    productRecommendations: boolean;
    personalPattern: boolean;
  };
  error: string | null;
  integrationMetadata?: {
    api_calls_saved: number;
    analysis_method: 'legacy' | 'integrated' | 'hybrid';
    processing_time: number;
    pattern_analysis_enabled: boolean;
  };
}

interface AIAnalysisResult {
  photoScore?: PhotoScore;
  aiComments?: AIComment[];
  productRecommendations?: ProductRecommendation;
  personalPattern?: PersonalPattern;
}

export const usePostAIAnalysis = () => {
  const [analysisState, setAnalysisState] = useState<AIAnalysisState>({
    isAnalyzing: false,
    photoScore: null,
    aiComments: [],
    productRecommendations: null,
    personalPattern: null,
    progress: {
      photoScore: false,
      aiComments: true, // 常にtrueで互換性維持（AIコメント機能削除）
      productRecommendations: false,
      personalPattern: false
    },
    error: null,
    integrationMetadata: undefined
  });

  const resetAnalysis = useCallback(() => {
    setAnalysisState({
      isAnalyzing: false,
      photoScore: null,
      aiComments: [],
      productRecommendations: null,
      personalPattern: null,
      progress: {
        photoScore: false,
        aiComments: false,
        productRecommendations: false,
        personalPattern: false
      },
      error: null,
      integrationMetadata: undefined
    });
  }, []);

  const analyzePost = useCallback(async (
    imageUrl: string,
    title: string,
    userComment: string,
    imageAIDescription?: string
  ): Promise<AIAnalysisResult> => {
    console.log('🤖 Starting post-submission AI analysis...');
    console.log('📸 Image URL:', imageUrl?.substring(0, 100) + '...');
    console.log('📝 Title:', title);
    console.log('💬 User Comment:', userComment);
    console.log('🌐 Environment check:', {
      geminiApiKey: !!import.meta.env.VITE_GEMINI_API_KEY,
      apiKeyLength: import.meta.env.VITE_GEMINI_API_KEY?.length || 0,
      useIntegratedAnalysis: import.meta.env.VITE_USE_INTEGRATED_ANALYSIS === 'true',
      usePatternAnalysis: import.meta.env.VITE_USE_PATTERN_ANALYSIS === 'true'
    });
    
    setAnalysisState(prev => ({
      ...prev,
      isAnalyzing: true,
      error: null,
      progress: {
        photoScore: false,
        aiComments: false,
        productRecommendations: false,
        personalPattern: false
      },
      integrationMetadata: undefined
    }));

    const result: AIAnalysisResult = {};

    try {
      // 現在のユーザーIDを取得
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      // 統合分析サービスを使用
      console.log('🚀 Starting integrated analysis...');
      const integratedResult: IntegratedAnalysisResult = await integratedAnalysisService.analyzePostComprehensive(
        imageUrl,
        title,
        userComment,
        imageAIDescription,
        userId,
        undefined // location は将来的に位置情報APIから取得
      );

      // 結果をレガシー形式にマッピング（AIコメントとAI説明文除去）
      result.photoScore = integratedResult.photoScore;
      result.aiComments = []; // 空配列で互換性維持
      result.productRecommendations = integratedResult.productRecommendations;
      result.personalPattern = integratedResult.personalPattern;

      // 状態を更新
      setAnalysisState(prev => ({
        ...prev,
        isAnalyzing: false,
        photoScore: integratedResult.photoScore,
        aiComments: [], // 空配列で互換性維持
        productRecommendations: integratedResult.productRecommendations,
        personalPattern: integratedResult.personalPattern,
        progress: {
          photoScore: true,
          aiComments: true, // 常にtrueで互換性維持
          productRecommendations: true,
          personalPattern: !!integratedResult.personalPattern
        },
        integrationMetadata: integratedResult.integration_metadata
      }));

      console.log('🎉 Photo scoring analysis completed successfully!');
      console.log('💰 API calls saved:', integratedResult.integration_metadata.api_calls_saved);
      console.log('⚡ Analysis method:', integratedResult.integration_metadata.analysis_method);
      console.log('⏱️ Processing time:', integratedResult.integration_metadata.processing_time + 'ms');
      console.log('🧠 Pattern analysis enabled:', integratedResult.integration_metadata.pattern_analysis_enabled);
      console.log('📊 Pattern analysis result:', !!integratedResult.personalPattern);
      console.log('📄 Features removed: AI comments and AI descriptions for cost optimization');
      
      return result;

    } catch (error) {
      console.error('❌ AI analysis failed:', error);
      
      setAnalysisState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: error instanceof Error ? error.message : 'AI分析中にエラーが発生しました'
      }));

      return result;
    }
  }, []);

  const updateProgress = useCallback((step: keyof AIAnalysisState['progress'], completed: boolean) => {
    setAnalysisState(prev => ({
      ...prev,
      progress: {
        ...prev.progress,
        [step]: completed
      }
    }));
  }, []);

  const setPhotoScore = useCallback((photoScore: PhotoScore) => {
    setAnalysisState(prev => ({
      ...prev,
      photoScore,
      progress: { ...prev.progress, photoScore: true }
    }));
  }, []);

  const setAIComments = useCallback((aiComments: AIComment[]) => {
    setAnalysisState(prev => ({
      ...prev,
      aiComments,
      progress: { ...prev.progress, aiComments: true }
    }));
  }, []);

  const setProductRecommendations = useCallback((productRecommendations: ProductRecommendation) => {
    setAnalysisState(prev => ({
      ...prev,
      productRecommendations,
      progress: { ...prev.progress, productRecommendations: true }
    }));
  }, []);

  const isAnalysisComplete = !analysisState.isAnalyzing && (
    analysisState.photoScore !== null ||
    analysisState.aiComments.length > 0 ||
    analysisState.productRecommendations !== null ||
    analysisState.personalPattern !== null
  );

  const completionPercentage = Object.values(analysisState.progress).filter(Boolean).length / 3 * 100;

  return {
    // State
    ...analysisState,
    isAnalysisComplete,
    completionPercentage,
    
    // Actions
    analyzePost,
    resetAnalysis,
    updateProgress,
    setPhotoScore,
    setAIComments,
    setProductRecommendations
  };
};