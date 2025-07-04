import { supabase } from '../supabase';
import { geminiService } from './geminiService';
import { photoScoringService } from './photoScoringService';
import { productRecommendationService } from './productRecommendationService';

export interface IntegratedAnalysisResult {
  photoScore: number;
  aiComments: string[];
  productRecommendations: any[];
  personalPattern: any;
}

export interface AnalysisParams {
  imageUrl: string;
  title?: string;
  userComment?: string;
  imageAIDescription?: string;
}

class IntegratedAnalysisService {
  async analyzePost(
    imageUrl: string,
    title?: string,
    userComment?: string,
    imageAIDescription?: string
  ): Promise<IntegratedAnalysisResult> {
    try {
      const analysisParams: AnalysisParams = {
        imageUrl,
        title,
        userComment,
        imageAIDescription
      };

      // 並列で各分析を実行
      const [photoScore, aiComments, productRecommendations, personalPattern] = await Promise.all([
        this.analyzePhotoScore(analysisParams),
        this.generateAIComments(analysisParams),
        this.generateProductRecommendations(analysisParams),
        this.analyzePersonalPattern(analysisParams)
      ]);

      return {
        photoScore,
        aiComments,
        productRecommendations,
        personalPattern
      };
    } catch (error) {
      console.error('Integrated analysis failed:', error);
      throw new Error('分析に失敗しました');
    }
  }

  private async analyzePhotoScore(params: AnalysisParams): Promise<number> {
    try {
      const result = await photoScoringService.analyzePhotoScore(params.imageUrl);
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

      const response = await geminiService.generateText(prompt);
      
      try {
        const comments = JSON.parse(response);
        return Array.isArray(comments) ? comments : [response];
      } catch {
        return [response];
      }
    } catch (error) {
      console.error('AI comment generation failed:', error);
      return ['素晴らしい写真ですね！'];
    }
  }

  private async generateProductRecommendations(params: AnalysisParams): Promise<any[]> {
    try {
      return await productRecommendationService.generateRecommendations(
        params.imageUrl,
        params.title || '',
        params.userComment || ''
      );
    } catch (error) {
      console.error('Product recommendation failed:', error);
      return [];
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

      const response = await geminiService.generateText(prompt);
      
      try {
        return JSON.parse(response);
      } catch {
        return {
          interests: [],
          style: 'casual',
          mood: 'positive'
        };
      }
    } catch (error) {
      console.error('Personal pattern analysis failed:', error);
      return {
        interests: [],
        style: 'casual',
        mood: 'positive'
      };
    }
  }
}

export const integratedAnalysisService = new IntegratedAnalysisService();