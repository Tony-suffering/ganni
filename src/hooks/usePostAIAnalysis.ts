import { useState, useCallback } from 'react';
import { PhotoScore, AIComment, ProductRecommendation, Post } from '../types';
import { PhotoScoringService } from '../services/photoScoringService';
import { productRecommendationService } from '../services/productRecommendationService';
import { geminiService } from '../services/geminiService';

interface AIAnalysisState {
  isAnalyzing: boolean;
  photoScore: PhotoScore | null;
  aiComments: AIComment[];
  productRecommendations: ProductRecommendation | null;
  progress: {
    photoScore: boolean;
    aiComments: boolean;
    productRecommendations: boolean;
  };
  error: string | null;
}

interface AIAnalysisResult {
  photoScore?: PhotoScore;
  aiComments?: AIComment[];
  productRecommendations?: ProductRecommendation;
}

export const usePostAIAnalysis = () => {
  const [analysisState, setAnalysisState] = useState<AIAnalysisState>({
    isAnalyzing: false,
    photoScore: null,
    aiComments: [],
    productRecommendations: null,
    progress: {
      photoScore: false,
      aiComments: false,
      productRecommendations: false
    },
    error: null
  });

  const resetAnalysis = useCallback(() => {
    setAnalysisState({
      isAnalyzing: false,
      photoScore: null,
      aiComments: [],
      productRecommendations: null,
      progress: {
        photoScore: false,
        aiComments: false,
        productRecommendations: false
      },
      error: null
    });
  }, []);

  const analyzePost = useCallback(async (
    imageUrl: string,
    title: string,
    userComment: string,
    imageAIDescription?: string
  ): Promise<AIAnalysisResult> => {
    console.log('🤖 Starting post-submission AI analysis...');
    
    setAnalysisState(prev => ({
      ...prev,
      isAnalyzing: true,
      error: null,
      progress: {
        photoScore: false,
        aiComments: false,
        productRecommendations: false
      }
    }));

    const result: AIAnalysisResult = {};

    try {
      // 1. 写真採点を実行
      console.log('📊 Step 1: Photo scoring...');
      try {
        const scoringService = new PhotoScoringService();
        const score = await scoringService.scorePhoto(imageUrl, title, userComment);
        const levelInfo = PhotoScoringService.getScoreLevel(score.total);
        
        const photoScore: PhotoScore = {
          technical_score: score.technical,
          composition_score: score.composition,
          creativity_score: score.creativity,
          engagement_score: score.engagement,
          total_score: score.total,
          score_level: levelInfo.level,
          level_description: levelInfo.description,
          ai_comment: score.comment,
          image_analysis: score.imageAnalysis ? {
            mainColors: score.imageAnalysis.mainColors || [],
            colorTemperature: score.imageAnalysis.colorTemperature || '',
            compositionType: score.imageAnalysis.compositionType || '',
            mainSubject: score.imageAnalysis.mainSubject || '',
            specificContent: score.imageAnalysis.specificContent || '',
            backgroundElements: score.imageAnalysis.backgroundElements || [],
            lightingQuality: score.imageAnalysis.lightingQuality || '',
            moodAtmosphere: score.imageAnalysis.moodAtmosphere || '',
            shootingAngle: score.imageAnalysis.shootingAngle || '',
            depthPerception: score.imageAnalysis.depthPerception || '',
            visualImpact: score.imageAnalysis.visualImpactDescription || score.imageAnalysis.visualImpact || '',
            emotionalTrigger: score.imageAnalysis.emotionalTrigger || '',
            technicalSignature: score.imageAnalysis.technicalSignature || ''
          } : undefined
        };

        result.photoScore = photoScore;
        
        setAnalysisState(prev => ({
          ...prev,
          photoScore,
          progress: { ...prev.progress, photoScore: true }
        }));
        
        console.log('✅ Photo scoring completed:', score.total, 'points');
      } catch (error) {
        console.error('❌ Photo scoring failed:', error);
      }

      // 2. AI説明文とコメントを生成
      console.log('💬 Step 2: AI comments generation...');
      try {
        // AI説明文を生成
        const aiDescription = await geminiService.generateAIDescription(
          title, 
          userComment, 
          imageAIDescription
        );

        // AIコメントを生成
        const aiComments = await geminiService.generateAIComments(
          title, 
          userComment, 
          aiDescription
        );

        result.aiComments = aiComments;
        
        setAnalysisState(prev => ({
          ...prev,
          aiComments,
          progress: { ...prev.progress, aiComments: true }
        }));
        
        console.log('✅ AI comments generated:', aiComments.length, 'comments');
      } catch (error) {
        console.error('❌ AI comments generation failed:', error);
      }

      // 3. 商品推薦を生成
      console.log('🛍️ Step 3: Product recommendations...');
      try {
        const recommendations = await productRecommendationService.analyzeAndRecommend(
          imageUrl,
          title,
          userComment
        );

        result.productRecommendations = recommendations;
        
        setAnalysisState(prev => ({
          ...prev,
          productRecommendations: recommendations,
          progress: { ...prev.progress, productRecommendations: true }
        }));
        
        console.log('✅ Product recommendations generated:', recommendations.recommendations.length, 'categories');
      } catch (error) {
        console.error('❌ Product recommendations failed:', error);
      }

      // 分析完了
      setAnalysisState(prev => ({
        ...prev,
        isAnalyzing: false
      }));

      console.log('🎉 AI analysis completed successfully!');
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
    analysisState.productRecommendations !== null
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