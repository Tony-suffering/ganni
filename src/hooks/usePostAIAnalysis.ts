import { useState, useCallback } from 'react';
import { PhotoScore, AIComment } from '../types';
import { PhotoScoringService } from '../services/photoScoringService';
import { integratedAnalysisService, IntegratedAnalysisResult } from '../services/integratedAnalysisService';
import { PersonalPattern } from '../services/patternAnalysisService';
import { supabase } from '../supabase';

// テストモード用のランダムスコア生成
const generateRandomPhotoScore = (): PhotoScore => {
  const technical = Math.floor(Math.random() * 31) + 70; // 70-100
  const composition = Math.floor(Math.random() * 31) + 70; // 70-100
  const creativity = Math.floor(Math.random() * 31) + 70; // 70-100
  const engagement = Math.floor(Math.random() * 31) + 70; // 70-100
  const total = Math.floor((technical + composition + creativity + engagement) / 4);
  
  let level, description;
  if (total >= 90) {
    level = 'S';
    description = 'プロフェッショナル級の傑作';
  } else if (total >= 80) {
    level = 'A';
    description = '非常に優秀な作品';
  } else if (total >= 70) {
    level = 'B';
    description = '良好な品質';
  } else {
    level = 'C';
    description = '標準的な品質';
  }
  
  return {
    technical_score: technical,
    composition_score: composition,
    creativity_score: creativity,
    engagement_score: engagement,
    total_score: total,
    score_level: level,
    level_description: description,
    ai_comment: `テストモード: ${description}（総合スコア: ${total}点）`,
    image_analysis: 'テストモードで生成されたランダムスコア'
  };
};

interface AIAnalysisState {
  isAnalyzing: boolean;
  photoScore: PhotoScore | null;
  aiComments: AIComment[]; // 互換性のため保持（空配列）
  personalPattern: PersonalPattern | null;
  progress: {
    photoScore: boolean;
    aiComments: boolean; // 互換性のため保持（常にtrue）
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
  personalPattern?: PersonalPattern;
}

export const usePostAIAnalysis = () => {
  const [analysisState, setAnalysisState] = useState<AIAnalysisState>({
    isAnalyzing: false,
    photoScore: null,
    aiComments: [],
    personalPattern: null,
    progress: {
      photoScore: false,
      aiComments: true, // 常にtrueで互換性維持（AIコメント機能削除）
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
      personalPattern: null,
      progress: {
        photoScore: false,
        aiComments: false,
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
    imageAIDescription?: string,
    postId?: string
  ): Promise<AIAnalysisResult> => {
    const isTestMode = import.meta.env.VITE_TEST_MODE === 'true';
    
    console.log('🤖 Starting post-submission AI analysis...');
    console.log('🔧 Test Mode:', isTestMode);
    console.log('📸 Image URL:', imageUrl?.substring(0, 100) + '...');
    console.log('📝 Title:', title);
    console.log('💬 User Comment:', userComment);
    console.log('🌐 Environment check:', {
      testMode: isTestMode,
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
        personalPattern: false
      },
      integrationMetadata: undefined
    }));

    const result: AIAnalysisResult = {};

    try {
      // 現在のユーザーIDを取得
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      let integratedResult: IntegratedAnalysisResult;

      if (isTestMode) {
        console.log('🎲 Using test mode - generating random scores...');
        // テストモード: ランダムスコアを生成
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒待機でリアルな感じを演出
        
        integratedResult = {
          photoScore: generateRandomPhotoScore(),
          aiComments: [],
          personalPattern: null, // テストモードではパターン分析はスキップ
          integration_metadata: {
            api_calls_saved: 4, // テストモードなので4回のAPI呼び出しを節約
            analysis_method: 'test_mode' as any,
            processing_time: 1000,
            pattern_analysis_enabled: false
          }
        };
      } else {
        // 通常モード: 統合分析サービスを使用
        console.log('🚀 Starting integrated analysis...');
        integratedResult = await integratedAnalysisService.analyzePostComprehensive(
          imageUrl,
          title,
          userComment,
          imageAIDescription,
          userId,
          undefined // location は将来的に位置情報APIから取得
        );
      }

      // 結果をレガシー形式にマッピング（AIコメントとAI説明文除去）
      result.photoScore = integratedResult.photoScore;
      result.aiComments = []; // 空配列で互換性維持
      result.personalPattern = integratedResult.personalPattern;

      // 状態を更新
      setAnalysisState(prev => ({
        ...prev,
        isAnalyzing: false,
        photoScore: integratedResult.photoScore,
        aiComments: [], // 空配列で互換性維持
        personalPattern: integratedResult.personalPattern,
        progress: {
          photoScore: true,
          aiComments: true, // 常にtrueで互換性維持
          personalPattern: !!integratedResult.personalPattern
        },
        integrationMetadata: integratedResult.integration_metadata
      }));

      // postIdが指定されている場合、AI分析結果をデータベースに保存
      if (postId && integratedResult.photoScore) {
        try {
          console.log('💾 Saving photo score to database for post:', postId);
          const { error: scoreError } = await supabase
            .from('photo_scores')
            .insert({
              post_id: postId,
              technical_score: integratedResult.photoScore.technical_score,
              composition_score: integratedResult.photoScore.composition_score,
              creativity_score: integratedResult.photoScore.creativity_score,
              engagement_score: integratedResult.photoScore.engagement_score,
              total_score: integratedResult.photoScore.total_score,
              score_level: integratedResult.photoScore.score_level,
              level_description: integratedResult.photoScore.level_description,
              ai_comment: integratedResult.photoScore.ai_comment,
              image_analysis: integratedResult.photoScore.image_analysis
            });

          if (scoreError) {
            console.error('❌ Failed to save photo score:', scoreError);
          } else {
            console.log('✅ Photo score saved successfully to database');
          }
        } catch (dbError) {
          console.error('❌ Database error while saving photo score:', dbError);
        }
      }

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


  const isAnalysisComplete = !analysisState.isAnalyzing && (
    analysisState.photoScore !== null ||
    analysisState.aiComments.length > 0 ||
    analysisState.personalPattern !== null
  );

  const completionPercentage = Object.values(analysisState.progress).filter(Boolean).length / 2 * 100;

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
    setAIComments
  };
};