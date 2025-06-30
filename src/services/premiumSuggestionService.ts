import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  PersonalizedSuggestion, 
  EmotionAnalysis, 
  LifestylePattern,
  CuratorResponse 
} from '../types/curator';
import { PhotoCreativeProfile } from './photoAnalysisDeepService';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

/**
 * プレミアム提案サービス
 * Geminiの深層分析を活用した高品質なパーソナライズ提案
 * マネタイズ対応（料理・フィットネス・読書・ライフスタイル商品）
 */
export class PremiumSuggestionService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor() {
    if (API_KEY) {
      this.genAI = new GoogleGenerativeAI(API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    }
  }

  /**
   * Gemini分析統合による最高品質提案生成
   */
  async generatePremiumSuggestions(
    emotionAnalysis: EmotionAnalysis,
    lifestylePattern: LifestylePattern,
    photoCreativeProfile: PhotoCreativeProfile | null
  ): Promise<CuratorResponse<PersonalizedSuggestion[]>> {
    console.log('💎 Generating premium personalized suggestions...');

    if (!this.model) {
      return {
        success: true,
        data: this.getMockPremiumSuggestions(),
        metadata: {
          processingTime: 1000,
          confidence: 0.8,
          version: '1.0.0-mock'
        }
      };
    }

    try {
      const startTime = Date.now();
      
      const suggestionPrompt = this.createPremiumSuggestionPrompt(
        emotionAnalysis, 
        lifestylePattern, 
        photoCreativeProfile
      );
      
      const result = await this.model.generateContent(suggestionPrompt);
      const response = await result.response;
      const suggestionsText = response.text();
      
      console.log('🤖 Gemini premium suggestions:', suggestionsText);
      
      const suggestions = this.parsePremiumSuggestions(suggestionsText);
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        data: suggestions,
        metadata: {
          processingTime,
          confidence: 0.95,
          version: '1.0.0-gemini'
        }
      };
    } catch (error) {
      console.error('❌ Premium suggestions generation failed:', error);
      return {
        success: false,
        error: 'Failed to generate premium suggestions',
        data: this.getMockPremiumSuggestions(),
        metadata: {
          processingTime: 1000,
          confidence: 0.3,
          version: '1.0.0-fallback'
        }
      };
    }
  }

  /**
   * プレミアム提案生成プロンプト
   */
  private createPremiumSuggestionPrompt(
    emotionAnalysis: EmotionAnalysis,
    lifestylePattern: LifestylePattern,
    photoCreativeProfile: PhotoCreativeProfile | null
  ): string {
    const currentHour = new Date().getHours();
    const season = this.getCurrentSeason();
    const weatherCondition = this.getCurrentWeatherCondition();

    // 深層分析データを統合
    const psychologyProfile = photoCreativeProfile ? `
創作者プロファイル: ${photoCreativeProfile.creativePersonality}
表現スタイル: ${photoCreativeProfile.compositionStyle}
色彩感性: ${photoCreativeProfile.colorSensitivity}
被写体心理: ${photoCreativeProfile.subjectPsychology}
独自の強み: ${photoCreativeProfile.uniqueStrength}
インスピレーション源: ${photoCreativeProfile.inspirationPatterns}
    ` : '';

    // 写真データの詳細分析を追加
    const photoInsights = emotionAnalysis && emotionAnalysis.photoAnalysisData ? `
【写真技術分析】
- 技術スコア: ${emotionAnalysis.photoAnalysisData.technical_score}/100 (構図、露出、フォーカス等)
- 構成力: ${emotionAnalysis.photoAnalysisData.composition_score}/100 (バランス、視線誘導等)
- 創造性: ${emotionAnalysis.photoAnalysisData.creativity_score}/100 (独創性、表現力等)
- 総合評価: ${emotionAnalysis.photoAnalysisData.total_score}/100
- レベル: ${emotionAnalysis.photoAnalysisData.score_level}
- AI評価: ${emotionAnalysis.photoAnalysisData.ai_comment}
    ` : '';
    
    const photoPreferences = lifestylePattern.photoPreferences ? `
【写真嗜好パターン】
- 好みの被写体: ${lifestylePattern.photoPreferences.preferredSubjects?.join(', ') || '不明'}
- 撮影時間帯: ${lifestylePattern.photoPreferences.preferredTimes?.join(', ') || '不明'}
- 色調傾向: ${lifestylePattern.photoPreferences.colorTendencies?.join(', ') || '不明'}
- 構図スタイル: ${lifestylePattern.photoPreferences.compositionStyles?.join(', ') || '不明'}
    ` : '';

    const emotionProfile = `
感情スコア: ${Object.entries(emotionAnalysis.emotions)
  .map(([emotion, value]) => `${emotion}:${value.toFixed(2)}`)
  .join(', ')}
主要関心分野: ${Object.entries(emotionAnalysis.interests || {})
  .sort(([,a], [,b]) => b - a)
  .slice(0, 3)
  .map(([interest, value]) => `${interest}:${value.toFixed(2)}`)
  .join(', ')}
    `;

    const lifestyleProfile = `
活動レベル: ${lifestylePattern.behaviorPatterns.activityLevel}
行動半径: ${lifestylePattern.behaviorPatterns.travelRadius}km
投稿頻度: 週${lifestylePattern.behaviorPatterns.averagePostingFrequency}回
好みの場所: ${lifestylePattern.behaviorPatterns.favoriteLocations.join(', ')}
活動時間帯: ${lifestylePattern.timePatterns.mostActiveHours.join(', ')}時
    `;

    return `
あなたは世界最高のAIライフスタイルコンサルタントです。この人の深層心理、創作スタイル、技術レベル、生活パターンを完全に理解し、その人だけの特別な才能と個性を見抜いてください。分析データからその人の隠れた強み、美的センス、独特の感性を発見し、心から褒めながら、人生を豊かにする最高品質の提案を4つのカテゴリーで生成してください。

**重要指針:**
- この人だけが持つ独特の美的感覚や創作スタイルを必ず見つけ出し、具体的に褒める
- 写真技術データ、構図センス、色彩感覚から才能を読み取る
- 「あなたは○○な才能をお持ちです」「△△な感性が素晴らしい」など、個性を認める言葉を必ず含める
- 一般論ではなく、この人だけの特別な提案を作成する

【現在の状況】
時刻: ${currentHour}時
季節: ${season}
天候: ${weatherCondition}

【超詳細個人プロファイル】
${psychologyProfile}

${photoInsights}

${photoPreferences}

【感情・嗜好分析】
${emotionProfile}

【ライフスタイル分析】
${lifestyleProfile}

【提案カテゴリーと要件】
1. **料理・グルメ提案** - 具体的レシピと食材、調理時間、栄養価値
2. **フィットネス・ウェルネス提案** - 運動メニュー、ジム情報、健康管理
3. **読書・学習提案** - 具体的書籍、学習コンテンツ、知的成長
4. **ライフスタイル商品提案** - 生活向上商品、投資価値、購入リンク

【絶対条件】
- この人の個性・才能・美的センスを具体的に褒める文言を必ず含める
- 写真技術データから読み取れる特徴を活かした提案内容
- 各提案は実在する具体的な商品・サービス・場所を含む
- その人だけの特別な体験（完全パーソナライゼーション）
- 価格帯を明記（透明性のある予算情報）
- 実行可能で成長を実感できる内容

**必須回答フォーマット:**

FOOD_SUGGESTION:
TITLE: [料理名・グルメ体験 具体的なタイトル]
DESCRIPTION: [詳細説明 120文字以内]
SPECIFIC_RECIPE: [具体的レシピまたは購入先]
INGREDIENTS: [必要な食材・調味料リスト]
COOKING_TIME: [調理時間]
NUTRITIONAL_VALUE: [栄養価・健康効果]
ESTIMATED_COST: [概算費用]
PERSONALIZATION: [この人の個性・才能を具体的に褒め、なぜ最適なのかを詳述]
MONETIZATION: [関連商品・サービス]

FITNESS_SUGGESTION:
TITLE: [フィットネス・ウェルネス提案タイトル]
DESCRIPTION: [詳細説明 120文字以内]
EXERCISE_PLAN: [具体的運動メニュー]
DURATION: [実施期間・頻度]
EQUIPMENT: [必要器具・ジム情報]
HEALTH_BENEFITS: [期待される健康効果]
ESTIMATED_COST: [概算費用]
PERSONALIZATION: [この人の個性・才能を具体的に褒め、なぜ最適なのかを詳述]
MONETIZATION: [関連商品・サービス]

BOOK_SUGGESTION:
TITLE: [読書・学習提案タイトル]
DESCRIPTION: [詳細説明 120文字以内]
SPECIFIC_BOOKS: [具体的書籍3冊（著者名含む）]
LEARNING_PATH: [学習ロードマップ]
READING_TIME: [読了目安時間]
KNOWLEDGE_GAIN: [得られる知識・スキル]
ESTIMATED_COST: [概算費用]
PERSONALIZATION: [この人の個性・才能を具体的に褒め、なぜ最適なのかを詳述]
MONETIZATION: [関連商品・サービス]

LIFESTYLE_SUGGESTION:
TITLE: [ライフスタイル商品・サービス提案]
DESCRIPTION: [詳細説明 120文字以内]
SPECIFIC_PRODUCTS: [具体的商品・サービス名]
USAGE_SCENARIO: [使用シーン・方法]
INVESTMENT_VALUE: [投資価値・長期メリット]
ESTIMATED_COST: [概算費用]
PERSONALIZATION: [この人の個性・才能を具体的に褒め、なぜ最適なのかを詳述]
MONETIZATION: [アフィリエイト・収益ポイント]

【重要注意事項】
- この人の個性・才能・美的センスを心から褒めることを最優先とする
- 写真技術データや創作スタイルから読み取れる特徴を必ず活用
- 「あなたの○○な感性が」「△△な才能を活かして」など、個人を認める表現を多用
- 一般的な提案は厳禁（完全にパーソナライズされた特別な提案のみ）
- 実在商品・サービスのみ推奨、価格帯は現実的で検証可能
- 提案の根拠となる個人データを必ず参照し、その人だけの体験を創造
`;
  }

  /**
   * 提案パース処理
   */
  private parsePremiumSuggestions(suggestionsText: string): PersonalizedSuggestion[] {
    const suggestions: PersonalizedSuggestion[] = [];
    const categories = ['FOOD_SUGGESTION', 'FITNESS_SUGGESTION', 'BOOK_SUGGESTION', 'LIFESTYLE_SUGGESTION'];
    
    categories.forEach((category, index) => {
      const categoryData = this.extractCategoryData(suggestionsText, category);
      if (categoryData.TITLE) {
        suggestions.push({
          id: `premium-${category.toLowerCase()}-${Date.now()}-${index}`,
          type: this.getCategoryType(category),
          title: categoryData.TITLE || '高品質提案',
          description: categoryData.DESCRIPTION || 'あなたのための特別な提案です',
          reasoning: categoryData.PERSONALIZATION || '個人分析に基づく推奨',
          content: {
            primaryAction: this.createPrimaryAction(categoryData, category),
            timeRecommendation: {
              bestTime: '最適なタイミング',
              duration: categoryData.DURATION || categoryData.COOKING_TIME || categoryData.READING_TIME || '適切な期間'
            },
            preparations: this.createPreparations(categoryData, category),
            followUpActions: ['成果の記録と評価', '継続的な改善', '次段階への準備']
          },
          priority: 'high',
          tags: this.createTags(category),
          estimatedEngagement: 0.9 + Math.random() * 0.1,
          createdAt: new Date().toISOString(),
          generatedBy: 'premium_ai_curator',
          monetization: {
            category: this.getMonetizationCategory(category),
            estimatedValue: this.extractCost(categoryData.ESTIMATED_COST),
            affiliateOpportunity: categoryData.MONETIZATION || '',
            conversionPotential: 'high'
          }
        });
      }
    });

    return suggestions.slice(0, 2); // 最高品質の2つに絞り込み
  }

  private extractCategoryData(text: string, category: string): any {
    const categoryStart = text.indexOf(category + ':');
    if (categoryStart === -1) return {};
    
    const nextCategoryPattern = /(FOOD_SUGGESTION|FITNESS_SUGGESTION|BOOK_SUGGESTION|LIFESTYLE_SUGGESTION):/g;
    const matches = [...text.matchAll(nextCategoryPattern)];
    const currentIndex = matches.findIndex(match => match.index === categoryStart);
    const nextMatch = matches[currentIndex + 1];
    
    const categoryText = nextMatch 
      ? text.substring(categoryStart, nextMatch.index)
      : text.substring(categoryStart);
    
    const data: any = {};
    const lines = categoryText.split('\n');
    
    lines.forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        if (key && value) {
          data[key] = value;
        }
      }
    });
    
    return data;
  }

  private getCategoryType(category: string): string {
    const typeMap: Record<string, string> = {
      'FOOD_SUGGESTION': 'food',
      'FITNESS_SUGGESTION': 'fitness', 
      'BOOK_SUGGESTION': 'education',
      'LIFESTYLE_SUGGESTION': 'lifestyle'
    };
    return typeMap[category] || 'lifestyle';
  }

  private createPrimaryAction(data: any, category: string): string {
    if (category === 'FOOD_SUGGESTION') {
      return `${data.SPECIFIC_RECIPE || '推奨レシピ'}を${data.COOKING_TIME || '適切な時間'}で調理`;
    } else if (category === 'FITNESS_SUGGESTION') {
      return `${data.EXERCISE_PLAN || '推奨エクササイズ'}を実践`;
    } else if (category === 'BOOK_SUGGESTION') {
      return `推奨書籍を${data.READING_TIME || '計画的'}に読書`;
    } else {
      return `${data.SPECIFIC_PRODUCTS || '推奨商品'}の導入を検討`;
    }
  }

  private createPreparations(data: any, category: string): string[] {
    if (category === 'FOOD_SUGGESTION') {
      return data.INGREDIENTS ? data.INGREDIENTS.split(',').map((s: string) => s.trim()) : ['必要な食材の準備'];
    } else if (category === 'FITNESS_SUGGESTION') {
      return data.EQUIPMENT ? [data.EQUIPMENT] : ['適切な運動環境の確保'];
    } else if (category === 'BOOK_SUGGESTION') {
      return data.SPECIFIC_BOOKS ? data.SPECIFIC_BOOKS.split(',').map((s: string) => s.trim()) : ['推奨書籍の入手'];
    } else {
      return ['商品・サービスの詳細確認', '予算の検討'];
    }
  }

  private createTags(category: string): string[] {
    const tagMap: Record<string, string[]> = {
      'FOOD_SUGGESTION': ['グルメ', '料理', '健康'],
      'FITNESS_SUGGESTION': ['フィットネス', '健康', 'ウェルネス'],
      'BOOK_SUGGESTION': ['読書', '学習', '成長'],
      'LIFESTYLE_SUGGESTION': ['ライフスタイル', '商品', '投資']
    };
    return tagMap[category] || ['プレミアム提案'];
  }

  private getMonetizationCategory(category: string): string {
    const categoryMap: Record<string, string> = {
      'FOOD_SUGGESTION': 'food_affiliate',
      'FITNESS_SUGGESTION': 'fitness_subscription',
      'BOOK_SUGGESTION': 'book_affiliate',
      'LIFESTYLE_SUGGESTION': 'product_affiliate'
    };
    return categoryMap[category] || 'general';
  }

  private extractCost(costText: string): number {
    if (!costText) return 0;
    const numbers = costText.match(/[\d,]+/g);
    return numbers ? parseInt(numbers[0].replace(/,/g, '')) : 0;
  }

  /**
   * 現在の季節取得
   */
  private getCurrentSeason(): string {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) return '春';
    if (month >= 6 && month <= 8) return '夏';
    if (month >= 9 && month <= 11) return '秋';
    return '冬';
  }

  /**
   * 現在の天候状況（モック）
   */
  private getCurrentWeatherCondition(): string {
    const conditions = ['晴れ', '曇り', '雨', '快晴'];
    return conditions[Math.floor(Math.random() * conditions.length)];
  }

  /**
   * モックプレミアム提案
   */
  private getMockPremiumSuggestions(): PersonalizedSuggestion[] {
    return [
      {
        id: 'premium-food-suggestion',
        type: 'food',
        title: '季節の野菜を使った地中海風パワーサラダ',
        description: 'あなたの創作活動に必要な栄養と集中力を高める、色彩豊かで美的満足度の高い料理体験。',
        reasoning: 'あなたの色彩感性と健康意識、創作活動への集中力向上ニーズに最適',
        content: {
          primaryAction: '新鮮な季節野菜10種類とオリーブオイルドレッシングで30分調理',
          timeRecommendation: {
            bestTime: '創作活動前の14:00-15:00',
            duration: '調理30分、味わい15分'
          },
          preparations: [
            'アルガンオイル(2,400円)', 
            '有機野菜セット(1,800円)', 
            'バルサミコ酢(1,200円)',
            '岩塩(800円)'
          ],
          followUpActions: [
            '食事の色彩写真を撮影',
            '栄養バランスと創作パフォーマンスの記録',
            '週2回の継続実践'
          ]
        },
        priority: 'high',
        tags: ['グルメ', '健康', 'クリエイティブ'],
        estimatedEngagement: 0.92,
        createdAt: new Date().toISOString(),
        generatedBy: 'premium_ai_curator',
        monetization: {
          category: 'food_affiliate',
          estimatedValue: 6200,
          affiliateOpportunity: '有機食材宅配サービス、調理器具、レシピ本',
          conversionPotential: 'high'
        }
      },
      {
        id: 'premium-book-suggestion', 
        type: 'education',
        title: '美的感性を研ぎ澄ます3冊の知的探究書',
        description: 'あなたの創作活動と人生観を深化させる、美学・心理学・創造性の最前線を学ぶ読書体験。',
        reasoning: 'あなたの知的好奇心と美的探究心、そして独自の表現力向上への欲求に完全適合',
        content: {
          primaryAction: '3冊を6週間で読破し、創作活動に応用する知識体系を構築',
          timeRecommendation: {
            bestTime: '集中できる夜21:00-22:30',
            duration: '週7時間の読書時間'
          },
          preparations: [
            '『美の構造』佐々木健一著(2,420円)',
            '『創造性の心理学』ミハイ・チクセントミハイ著(2,640円)', 
            '『視覚の生命力』ルドルフ・アルンハイム著(3,080円)'
          ],
          followUpActions: [
            '各章の学びを創作ノートに記録',
            '理論を実際の撮影で検証',
            'オンライン読書会への参加検討'
          ]
        },
        priority: 'high',
        tags: ['読書', '美学', '創造性'],
        estimatedEngagement: 0.88,
        createdAt: new Date().toISOString(),
        generatedBy: 'premium_ai_curator',
        monetization: {
          category: 'book_affiliate',
          estimatedValue: 8140,
          affiliateOpportunity: '書籍販売、オンライン講座、読書サブスクリプション',
          conversionPotential: 'high'
        }
      }
    ];
  }
}

// 提案に追加されるマネタイゼーション情報
interface MonetizationData {
  category: string;
  estimatedValue: number;
  affiliateOpportunity: string;
  conversionPotential: 'low' | 'medium' | 'high';
}

export const premiumSuggestionService = new PremiumSuggestionService();