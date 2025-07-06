import { supabase } from '../supabase';
import { geminiService } from './geminiService';
import { photoScoringService } from './photoScoringService';

export interface IntegratedAnalysisResult {
  photoScore: any; // PhotoScore型
  aiComments: string[];
  personalPattern: any;
  integration_metadata: {
    api_calls_saved: number;
    analysis_method: string;
    processing_time: number;
    pattern_analysis_enabled: boolean;
  };
}

export interface AnalysisParams {
  imageUrl: string;
  title?: string;
  userComment?: string;
  imageAIDescription?: string;
}

class IntegratedAnalysisService {
  async analyzePostComprehensive(
    imageUrl: string,
    title?: string,
    userComment?: string,
    imageAIDescription?: string,
    userId?: string,
    location?: any
  ): Promise<IntegratedAnalysisResult> {
    const startTime = Date.now();
    
    try {
      console.log('🔍 Starting comprehensive analysis...');
      
      // 写真スコア分析を実行
      const rawPhotoScore = await photoScoringService.scorePhoto(imageUrl, title, userComment);
      console.log('📊 Photo score analysis completed:', rawPhotoScore);
      
      // PhotoScore型に変換
      const photoScore = {
        technical_score: rawPhotoScore.technical,
        composition_score: rawPhotoScore.composition,
        creativity_score: rawPhotoScore.creativity,
        engagement_score: rawPhotoScore.engagement,
        total_score: rawPhotoScore.total,
        score_level: this.getScoreLevel(rawPhotoScore.total),
        level_description: this.getScoreLevelDescription(rawPhotoScore.total),
        ai_comment: rawPhotoScore.comment,
        image_analysis: rawPhotoScore.imageAnalysis ? {
          mainColors: rawPhotoScore.imageAnalysis.mainColors || [],
          colorTemperature: rawPhotoScore.imageAnalysis.colorTemperature || '',
          compositionType: rawPhotoScore.imageAnalysis.compositionType || '',
          mainSubject: rawPhotoScore.imageAnalysis.mainSubject || '',
          specificContent: rawPhotoScore.imageAnalysis.specificContent || '',
          backgroundElements: rawPhotoScore.imageAnalysis.backgroundElements || [],
          lightingQuality: rawPhotoScore.imageAnalysis.lightingQuality || '',
          moodAtmosphere: rawPhotoScore.imageAnalysis.moodAtmosphere || '',
          shootingAngle: rawPhotoScore.imageAnalysis.shootingAngle || '',
          depthPerception: rawPhotoScore.imageAnalysis.depthPerception || '',
          visualImpact: rawPhotoScore.imageAnalysis.visualImpactDescription || '',
          emotionalTrigger: rawPhotoScore.imageAnalysis.emotionalTrigger || '',
          technicalSignature: rawPhotoScore.imageAnalysis.technicalSignature || ''
        } : undefined
      };
      
      // AIコメントは空配列（削除済み機能）
      const aiComments: string[] = [];
      
      // パーソナルパターン分析
      const personalPattern = {
        interests: [],
        style: 'casual',
        mood: 'positive'
      };
      
      const processingTime = Date.now() - startTime;
      
      return {
        photoScore,
        aiComments,
        personalPattern,
        integration_metadata: {
          api_calls_saved: 0,
          analysis_method: 'integrated',
          processing_time: processingTime,
          pattern_analysis_enabled: false
        }
      };
    } catch (error) {
      console.error('Comprehensive analysis failed:', error);
      throw new Error('分析に失敗しました');
    }
  }

  async analyzePost(
    imageUrl: string,
    title?: string,
    userComment?: string,
    imageAIDescription?: string
  ): Promise<IntegratedAnalysisResult> {
    // 後方互換性のため、analyzePostComprehensiveを呼び出す
    return this.analyzePostComprehensive(imageUrl, title, userComment, imageAIDescription);
  }

  private async analyzePhotoScore(params: AnalysisParams): Promise<number> {
    try {
      const result = await photoScoringService.scorePhoto(params.imageUrl, params.title, params.userComment);
      return result.total;
    } catch (error) {
      console.error('Photo scoring failed:', error);
      return 0;
    }
  }

  private async generateAIComments(params: AnalysisParams): Promise<string[]> {
    try {
      const prompt = `
        以下の情報を元に、写真に対する建設的で魅力的なコメントを3つ生成してください：
        
        画像URL: ${params.imageUrl}
        タイトル: ${params.title || ''}
        ユーザーコメント: ${params.userComment || ''}
        画像の説明: ${params.imageAIDescription || ''}
        
        コメントは以下の形式で返してください：
        ["コメント1", "コメント2", "コメント3"]
      `;

      // GeminiServiceのgenerateTextメソッドが削除されたため、空配列を返す
      return [];
    } catch (error) {
      console.error('AI comment generation failed:', error);
      return ['素晴らしい写真ですね！'];
    }
  }


  private async analyzePersonalPattern(params: AnalysisParams): Promise<any> {
    try {
      // 個人パターン分析のロジック
      const prompt = `
        以下の投稿内容から個人的な傾向やパターンを分析してください：
        
        タイトル: ${params.title || ''}
        ユーザーコメント: ${params.userComment || ''}
        画像の説明: ${params.imageAIDescription || ''}
        
        結果はJSON形式で返してください：
        {
          "interests": ["興味1", "興味2"],
          "style": "撮影スタイル",
          "mood": "感情的な傾向"
        }
      `;

      // GeminiServiceのgenerateTextメソッドが削除されたため、デフォルト値を返す
      return {
        interests: [],
        style: 'casual',
        mood: 'positive'
      };
    } catch (error) {
      console.error('Personal pattern analysis failed:', error);
      return {
        interests: [],
        style: 'casual',
        mood: 'positive'
      };
    }
  }

  private getScoreLevel(total: number): string {
    if (total >= 90) return 'S';
    if (total >= 80) return 'A';
    if (total >= 70) return 'B';
    if (total >= 60) return 'C';
    if (total >= 50) return 'D';
    return 'E';
  }

  private getScoreLevelDescription(total: number): string {
    if (total >= 90) return 'プロフェッショナル級の傑作';
    if (total >= 80) return '非常に優秀な作品';
    if (total >= 70) return '良好な品質';
    if (total >= 60) return '標準的な品質';
    if (total >= 50) return '改善の余地あり';
    return '要練習';
  }
}

export const integratedAnalysisService = new IntegratedAnalysisService();