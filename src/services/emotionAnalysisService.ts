import { GoogleGenerativeAI } from '@google/generative-ai';
import { EmotionAnalysis, AnalysisRequest, CuratorResponse } from '../types/curator';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

/**
 * AI感情・嗜好分析サービス
 * 投稿写真とコメントから感情状態と嗜好パターンを分析
 */
export class EmotionAnalysisService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor() {
    if (API_KEY) {
      this.genAI = new GoogleGenerativeAI(API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    }
  }

  /**
   * 複数の投稿から感情・嗜好を総合分析
   */
  async analyzeUserEmotions(request: AnalysisRequest): Promise<CuratorResponse<EmotionAnalysis>> {
    console.log('🧠 Starting emotion analysis for user:', request.userId);
    
    if (!this.model) {
      console.warn('Gemini API not available, using mock analysis');
      return {
        success: true,
        data: this.getMockEmotionAnalysis(),
        metadata: {
          processingTime: 500,
          confidence: 0.3,
          version: '1.0.0-mock'
        }
      };
    }

    try {
      const startTime = Date.now();
      
      // 分析の深度に応じてプロンプトを調整
      const analysisPrompt = this.createEmotionAnalysisPrompt(request);
      
      const result = await this.model.generateContent(analysisPrompt);
      const response = await result.response;
      const analysisText = response.text();
      
      console.log('🤖 Gemini emotion analysis result:', analysisText);
      
      const processingTime = Date.now() - startTime;
      const emotionData = this.parseEmotionAnalysis(analysisText);
      
      return {
        success: true,
        data: emotionData,
        metadata: {
          processingTime,
          confidence: emotionData.confidence,
          version: '1.0.0-gemini'
        }
      };
    } catch (error) {
      console.error('❌ Emotion analysis failed:', error);
      return {
        success: false,
        error: 'Failed to analyze emotions',
        data: this.getMockEmotionAnalysis(),
        metadata: {
          processingTime: 500,
          confidence: 0.1,
          version: '1.0.0-fallback'
        }
      };
    }
  }

  /**
   * 単一投稿の感情分析（リアルタイム用）
   */
  async analyzeSinglePost(
    title: string, 
    description: string, 
    imageUrl?: string, 
    tags: string[] = []
  ): Promise<Partial<EmotionAnalysis>> {
    if (!this.model) {
      return this.getMockSinglePostEmotion();
    }

    const prompt = this.createSinglePostAnalysisPrompt(title, description, tags);
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const analysisText = response.text();
      
      return this.parseSinglePostEmotion(analysisText);
    } catch (error) {
      console.error('Single post emotion analysis failed:', error);
      return this.getMockSinglePostEmotion();
    }
  }

  /**
   * 詳細感情分析プロンプト作成
   */
  private createEmotionAnalysisPrompt(request: AnalysisRequest): string {
    const postSummaries = request.posts.map((post, index) => {
      return `
投稿${index + 1}:
タイトル: "${post.title}"
説明: "${post.description}"
タグ: ${post.tags.join(', ')}
投稿日: ${new Date(post.createdAt).toLocaleDateString('ja-JP')}
`;
    }).join('\n');

    return `
あなたは心理学と感情分析の専門家です。以下の写真投稿データから、投稿者の感情状態、嗜好、行動パターンを詳細に分析してください。

【分析対象】
投稿数: ${request.posts.length}件
期間: ${request.timeframe ? `${request.timeframe.start} ～ ${request.timeframe.end}` : '全期間'}

【投稿データ】
${postSummaries}

【分析観点】
1. 感情状態の傾向（0.0-1.0のスコアで評価）
2. 興味・関心分野の嗜好度合い
3. 撮影パターンと生活リズム
4. 心理的特徴と成長可能性

【重要な分析ポイント】
- 投稿のタイミング（時期、頻度）から生活パターンを読み取る
- 使用する言葉の感情的トーン
- 被写体の選択から価値観を推測
- タグから興味領域を特定
- 季節性や一貫性のパターン

**必須回答フォーマット（厳密に従ってください）:**

EMOTIONS:
JOY: [0.0-1.0]
PEACE: [0.0-1.0]
EXCITEMENT: [0.0-1.0]
MELANCHOLY: [0.0-1.0]
NOSTALGIA: [0.0-1.0]
CURIOSITY: [0.0-1.0]
STRESS: [0.0-1.0]

INTERESTS:
NATURE: [0.0-1.0]
URBAN: [0.0-1.0]
ART: [0.0-1.0]
FOOD: [0.0-1.0]
PEOPLE: [0.0-1.0]
TRAVEL: [0.0-1.0]
CULTURE: [0.0-1.0]
TECHNOLOGY: [0.0-1.0]

PATTERNS:
TIME_PREF: [morning|afternoon|evening|night|mixed]
SEASON_PREF: [spring|summer|autumn|winter|mixed]
LOCATION_PREF: [indoor|outdoor|mixed]
SOCIAL_PREF: [solo|group|mixed]

CONFIDENCE: [0.0-1.0]
SUMMARY: [この人の感情的特徴と嗜好の要約 200文字以内]

【分析の精度を高めるために】
- 微細な感情の違いを捉える
- 文化的背景や季節要因を考慮
- 投稿頻度と内容の関連性を分析
- 成長や変化の兆候を検出
`;
  }

  /**
   * 単一投稿分析プロンプト
   */
  private createSinglePostAnalysisPrompt(title: string, description: string, tags: string[]): string {
    return `
この1つの投稿から、投稿者の現在の感情状態と興味関心を素早く分析してください。

投稿情報:
タイトル: "${title}"
説明: "${description}"
タグ: ${tags.join(', ')}

簡潔な回答フォーマット:
JOY: [0.0-1.0]
PEACE: [0.0-1.0]
EXCITEMENT: [0.0-1.0]
CURIOSITY: [0.0-1.0]
NATURE: [0.0-1.0]
ART: [0.0-1.0]
FOOD: [0.0-1.0]
CONFIDENCE: [0.0-1.0]
`;
  }

  /**
   * Gemini応答のパース
   */
  private parseEmotionAnalysis(analysisText: string): EmotionAnalysis {
    const lines = analysisText.split('\n');
    const data: any = {};
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.includes(':')) {
        const colonIndex = trimmedLine.indexOf(':');
        const key = trimmedLine.substring(0, colonIndex).trim();
        const value = trimmedLine.substring(colonIndex + 1).trim();
        
        if (key && value) {
          data[key] = value;
        }
      }
    }

    const parseFloat01 = (value: string | undefined): number => {
      if (!value) return 0.5;
      const num = parseFloat(value.replace(/[^\d.]/g, ''));
      return Math.max(0, Math.min(1, isNaN(num) ? 0.5 : num));
    };

    const parsePattern = (value: string | undefined, options: string[]): string => {
      if (!value) return 'mixed';
      const cleanValue = value.toLowerCase().trim();
      return options.includes(cleanValue) ? cleanValue : 'mixed';
    };

    return {
      emotions: {
        joy: parseFloat01(data['JOY']),
        peace: parseFloat01(data['PEACE']),
        excitement: parseFloat01(data['EXCITEMENT']),
        melancholy: parseFloat01(data['MELANCHOLY']),
        nostalgia: parseFloat01(data['NOSTALGIA']),
        curiosity: parseFloat01(data['CURIOSITY']),
        stress: parseFloat01(data['STRESS'])
      },
      interests: {
        nature: parseFloat01(data['NATURE']),
        urban: parseFloat01(data['URBAN']),
        art: parseFloat01(data['ART']),
        food: parseFloat01(data['FOOD']),
        people: parseFloat01(data['PEOPLE']),
        travel: parseFloat01(data['TRAVEL']),
        culture: parseFloat01(data['CULTURE']),
        technology: parseFloat01(data['TECHNOLOGY'])
      },
      patterns: {
        timePreference: parsePattern(data['TIME_PREF'], ['morning', 'afternoon', 'evening', 'night', 'mixed']) as any,
        seasonPreference: parsePattern(data['SEASON_PREF'], ['spring', 'summer', 'autumn', 'winter', 'mixed']) as any,
        locationPreference: parsePattern(data['LOCATION_PREF'], ['indoor', 'outdoor', 'mixed']) as any,
        socialPreference: parsePattern(data['SOCIAL_PREF'], ['solo', 'group', 'mixed']) as any
      },
      confidence: parseFloat01(data['CONFIDENCE']),
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * 単一投稿の感情パース
   */
  private parseSinglePostEmotion(analysisText: string): Partial<EmotionAnalysis> {
    const lines = analysisText.split('\n');
    const data: any = {};
    
    for (const line of lines) {
      const [key, value] = line.split(':').map(s => s.trim());
      if (key && value) {
        data[key] = value;
      }
    }

    const parseFloat01 = (value: string | undefined): number => {
      if (!value) return 0.5;
      const num = parseFloat(value.replace(/[^\d.]/g, ''));
      return Math.max(0, Math.min(1, isNaN(num) ? 0.5 : num));
    };

    return {
      emotions: {
        joy: parseFloat01(data['JOY']),
        peace: parseFloat01(data['PEACE']),
        excitement: parseFloat01(data['EXCITEMENT']),
        melancholy: 0.3,
        nostalgia: 0.3,
        curiosity: parseFloat01(data['CURIOSITY']),
        stress: 0.2
      },
      interests: {
        nature: parseFloat01(data['NATURE']),
        urban: 0.5,
        art: parseFloat01(data['ART']),
        food: parseFloat01(data['FOOD']),
        people: 0.5,
        travel: 0.5,
        culture: 0.5,
        technology: 0.3
      },
      confidence: parseFloat01(data['CONFIDENCE']),
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * モック感情分析データ（API利用不可時）
   */
  private getMockEmotionAnalysis(): EmotionAnalysis {
    const randomVariation = () => 0.3 + Math.random() * 0.4; // 0.3-0.7の範囲

    return {
      emotions: {
        joy: randomVariation(),
        peace: randomVariation(),
        excitement: randomVariation(),
        melancholy: Math.random() * 0.4, // 0-0.4
        nostalgia: Math.random() * 0.5,
        curiosity: 0.5 + Math.random() * 0.3, // 0.5-0.8
        stress: Math.random() * 0.3 // 0-0.3
      },
      interests: {
        nature: randomVariation(),
        urban: randomVariation(),
        art: randomVariation(),
        food: randomVariation(),
        people: randomVariation(),
        travel: randomVariation(),
        culture: randomVariation(),
        technology: Math.random() * 0.6
      },
      patterns: {
        timePreference: ['morning', 'afternoon', 'evening', 'mixed'][Math.floor(Math.random() * 4)] as any,
        seasonPreference: ['spring', 'summer', 'autumn', 'winter', 'mixed'][Math.floor(Math.random() * 5)] as any,
        locationPreference: ['indoor', 'outdoor', 'mixed'][Math.floor(Math.random() * 3)] as any,
        socialPreference: ['solo', 'group', 'mixed'][Math.floor(Math.random() * 3)] as any
      },
      confidence: 0.2 + Math.random() * 0.2, // 低い信頼度でモックデータと明示
      lastUpdated: new Date().toISOString()
    };
  }

  private getMockSinglePostEmotion(): Partial<EmotionAnalysis> {
    return {
      emotions: {
        joy: 0.4 + Math.random() * 0.3,
        peace: 0.3 + Math.random() * 0.4,
        excitement: 0.2 + Math.random() * 0.5,
        melancholy: Math.random() * 0.3,
        nostalgia: Math.random() * 0.4,
        curiosity: 0.4 + Math.random() * 0.4,
        stress: Math.random() * 0.2
      },
      interests: {
        nature: 0.3 + Math.random() * 0.4,
        urban: Math.random() * 0.6,
        art: 0.2 + Math.random() * 0.5,
        food: 0.3 + Math.random() * 0.4,
        people: Math.random() * 0.6,
        travel: 0.3 + Math.random() * 0.4,
        culture: Math.random() * 0.6,
        technology: Math.random() * 0.4
      },
      confidence: 0.15 + Math.random() * 0.15,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * API可用性チェック
   */
  isApiAvailable(): boolean {
    return !!API_KEY && !!this.model;
  }

  /**
   * 感情分析の傾向比較（前回との比較）
   */
  compareEmotionTrends(current: EmotionAnalysis, previous: EmotionAnalysis): {
    emotionChanges: Record<string, number>;
    interestChanges: Record<string, number>;
    significantChanges: string[];
  } {
    const emotionChanges: Record<string, number> = {};
    const interestChanges: Record<string, number> = {};
    const significantChanges: string[] = [];

    // 感情の変化を計算
    Object.keys(current.emotions).forEach(key => {
      const change = current.emotions[key as keyof typeof current.emotions] - 
                    previous.emotions[key as keyof typeof previous.emotions];
      emotionChanges[key] = change;
      
      if (Math.abs(change) > 0.2) {
        significantChanges.push(`${key}: ${change > 0 ? '+' : ''}${(change * 100).toFixed(0)}%`);
      }
    });

    // 興味の変化を計算
    Object.keys(current.interests).forEach(key => {
      const change = current.interests[key as keyof typeof current.interests] - 
                    previous.interests[key as keyof typeof previous.interests];
      interestChanges[key] = change;
      
      if (Math.abs(change) > 0.15) {
        significantChanges.push(`${key}への関心: ${change > 0 ? '+' : ''}${(change * 100).toFixed(0)}%`);
      }
    });

    return {
      emotionChanges,
      interestChanges,
      significantChanges
    };
  }
}

export const emotionAnalysisService = new EmotionAnalysisService();