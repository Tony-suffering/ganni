import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  LifestylePattern, 
  PlaceRecommendation, 
  PersonalizedSuggestion, 
  EmotionAnalysis,
  AnalysisRequest,
  CuratorResponse 
} from '../types/curator';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

/**
 * AIライフスタイル・コンシェルジュサービス
 * 生活パターン学習とレビューサイト連携による個人化サービス
 */
export class LifestyleConciergeService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor() {
    if (API_KEY) {
      this.genAI = new GoogleGenerativeAI(API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    }
  }

  /**
   * 投稿履歴から生活パターンを学習・分析
   */
  async analyzeLifestylePattern(request: AnalysisRequest): Promise<CuratorResponse<LifestylePattern>> {
    console.log('🏠 Analyzing lifestyle patterns for user:', request.userId);

    if (!this.model) {
      console.warn('Gemini API not available, using mock lifestyle analysis');
      return {
        success: true,
        data: this.getMockLifestylePattern(),
        metadata: {
          processingTime: 800,
          confidence: 0.3,
          version: '1.0.0-mock'
        }
      };
    }

    try {
      const startTime = Date.now();
      
      // 生活パターン分析プロンプト生成
      const analysisPrompt = this.createLifestyleAnalysisPrompt(request);
      
      const result = await this.model.generateContent(analysisPrompt);
      const response = await result.response;
      const analysisText = response.text();
      
      console.log('🤖 Gemini lifestyle analysis result:', analysisText);
      
      const processingTime = Date.now() - startTime;
      const lifestyleData = this.parseLifestyleAnalysis(analysisText);
      
      return {
        success: true,
        data: lifestyleData,
        metadata: {
          processingTime,
          confidence: lifestyleData.confidence,
          version: '1.0.0-gemini'
        }
      };
    } catch (error) {
      console.error('❌ Lifestyle pattern analysis failed:', error);
      return {
        success: false,
        error: 'Failed to analyze lifestyle patterns',
        data: this.getMockLifestylePattern(),
        metadata: {
          processingTime: 800,
          confidence: 0.1,
          version: '1.0.0-fallback'
        }
      };
    }
  }

  /**
   * 感情分析と生活パターンに基づく場所推薦
   */
  async generatePlaceRecommendations(
    emotionAnalysis: EmotionAnalysis,
    lifestylePattern: LifestylePattern,
    userLocation?: { latitude: number; longitude: number }
  ): Promise<CuratorResponse<PlaceRecommendation[]>> {
    console.log('📍 Generating personalized place recommendations...');

    try {
      const startTime = Date.now();
      
      // レビューサイトAPI連携（実装時はぐるなび、食べログ等のAPIを使用）
      const places = await this.fetchPlaceRecommendations(emotionAnalysis, lifestylePattern, userLocation);
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        data: places,
        metadata: {
          processingTime,
          confidence: 0.8,
          version: '1.0.0'
        }
      };
    } catch (error) {
      console.error('❌ Place recommendation generation failed:', error);
      return {
        success: false,
        error: 'Failed to generate place recommendations',
        data: this.getMockPlaceRecommendations(emotionAnalysis),
        metadata: {
          processingTime: 500,
          confidence: 0.3,
          version: '1.0.0-fallback'
        }
      };
    }
  }

  /**
   * パーソナライズされた体験提案生成
   */
  async generatePersonalizedSuggestions(
    emotionAnalysis: EmotionAnalysis,
    lifestylePattern: LifestylePattern,
    userLocation?: { latitude: number; longitude: number }
  ): Promise<CuratorResponse<PersonalizedSuggestion[]>> {
    console.log('💡 Creating personalized lifestyle suggestions...');

    if (!this.model) {
      return {
        success: true,
        data: this.getMockPersonalizedSuggestions(),
        metadata: {
          processingTime: 600,
          confidence: 0.3,
          version: '1.0.0-mock'
        }
      };
    }

    try {
      const startTime = Date.now();
      
      const suggestionPrompt = this.createSuggestionPrompt(emotionAnalysis, lifestylePattern);
      
      const result = await this.model.generateContent(suggestionPrompt);
      const response = await result.response;
      const suggestionsText = response.text();
      
      console.log('🤖 Gemini lifestyle suggestions:', suggestionsText);
      
      const suggestions = this.parseSuggestions(suggestionsText, emotionAnalysis, lifestylePattern);
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        data: suggestions,
        metadata: {
          processingTime,
          confidence: 0.85,
          version: '1.0.0-gemini'
        }
      };
    } catch (error) {
      console.error('❌ Personalized suggestions generation failed:', error);
      return {
        success: false,
        error: 'Failed to generate suggestions',
        data: this.getMockPersonalizedSuggestions(),
        metadata: {
          processingTime: 600,
          confidence: 0.2,
          version: '1.0.0-fallback'
        }
      };
    }
  }

  /**
   * 生活パターン分析プロンプト作成
   */
  private createLifestyleAnalysisPrompt(request: AnalysisRequest): string {
    const postAnalytics = this.analyzePostTimings(request.posts);
    
    const postSummary = request.posts.map(post => {
      const date = new Date(post.createdAt);
      return `
- ${date.toLocaleDateString('ja-JP')} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')} | ${post.title} | ${post.tags.join(', ')}`;
    }).join('\n');

    return `
あなたは生活パターン分析の専門家です。以下の投稿データから、ユーザーの生活リズム、行動パターン、ライフスタイルを詳細に分析してください。

【分析データ】
投稿数: ${request.posts.length}件
期間: ${postAnalytics.period}
投稿詳細:
${postSummary}

【分析観点】
1. 活動時間帯パターン（0-23時の活動度）
2. 週間リズム（平日vs週末の違い）
3. 行動半径と移動パターン
4. 投稿頻度と生活充実度
5. 季節・天候による行動変化
6. 社交性とライフスタイル

【重要分析項目】
- 最も活発な時間帯（3つまで）
- 平日と週末の活動パターンの違い
- 投稿頻度から見る生活充実度
- 行動範囲の広さ（活動的 vs 地域密着）
- 好む場所や体験の傾向

**必須回答フォーマット:**

ACTIVE_HOURS: [時間1,時間2,時間3] (0-23の数値)
WEEKDAY_PATTERN: [活動度0-10を7つ] (月-日の活動度)
WEEKEND_PATTERN: [活動度0-10を2つ] (土日の活動度)
POST_FREQUENCY: [週間投稿数の平均]
TRAVEL_RADIUS: [行動半径km]
FAVORITE_LOCATIONS: [場所1,場所2,場所3]
ACTIVITY_LEVEL: [low|medium|high]
SEASONAL_SPRING: [0.0-1.0]
SEASONAL_SUMMER: [0.0-1.0]
SEASONAL_AUTUMN: [0.0-1.0]
SEASONAL_WINTER: [0.0-1.0]
WEATHER_PREFS: [天候1,天候2,天候3]
CONFIDENCE: [0.0-1.0]
LIFESTYLE_SUMMARY: [ライフスタイルの要約 150文字以内]

【分析精度向上のため】
- 投稿時間から実際の活動時間を推測
- タグや場所情報から行動範囲を算出
- 継続性と変化を両方考慮
- 文化的・社会的背景も考慮
`;
  }

  /**
   * パーソナライズ提案プロンプト作成
   */
  private createSuggestionPrompt(emotionAnalysis: EmotionAnalysis, lifestylePattern: LifestylePattern): string {
    const currentHour = new Date().getHours();
    const isWeekend = [0, 6].includes(new Date().getDay());
    const season = this.getCurrentSeason();
    
    return `
あなたは超精密パーソナライゼーションの専門家です。一般的な提案ではなく、今すぐ実行できる超具体的な提案を1つだけ作成してください。

【現在の状況】
時刻: ${currentHour}時
曜日: ${isWeekend ? '休日' : '平日'}
季節: ${season}

【ユーザー分析】
感情状態: 好奇心${emotionAnalysis.emotions.curiosity.toFixed(1)}, ストレス${emotionAnalysis.emotions.stress.toFixed(1)}, 喜び${emotionAnalysis.emotions.joy.toFixed(1)}
活動パターン: ${lifestylePattern.behaviorPatterns.activityLevel}レベル, 週${lifestylePattern.behaviorPatterns.averagePostingFrequency}回投稿
行動範囲: 半径${lifestylePattern.behaviorPatterns.travelRadius}km
好みの場所: ${lifestylePattern.behaviorPatterns.favoriteLocations.slice(0,2).join(', ')}

【絶対条件】
- 「明日の14:30」のように具体的時刻指定
- 「新宿駅から徒歩5分」のように正確な位置
- 「1時間で500円」のように時間とコスト明記
- 曖昧な表現禁止(「カフェ巡り」「美術館」等)
- 実在する店名・施設名を使用

**必須回答フォーマット:**

ULTRA_SPECIFIC_SUGGESTION:
TITLE: [アクション目的の具体タイトル 20文字以内]
DESCRIPTION: [「いつ、どこで、何を、どうする」が全て明確 80文字以内]
SPECIFIC_TIME: [明日の15:30のように精密時刻]
EXACT_LOCATION: [施設名 + 駅からの正確な距離と時間]
ACTION_STEPS: [ステップバイステップの具体的行動 3ステップ]
COST_TIME: [所要時間 + おおよその費用]
EXPECTED_RESULT: [期待される具体的成果]
PRIORITY: [urgent のみ - 今すぐ実行すべき]
ENGAGEMENT: [0.9以上の高エンゲージメントのみ]

【提案例】
× 悪い例: 「新しいカフェを探してみる」
○ 良い例: 「明日の16:15、新宿南口から徒歩3分のBlue Seal Coffeeでオキナワ特製アイスコーヒー(税込450円)を注文し、窓際席で40分間読書」
`;
  }

  /**
   * 投稿タイミング分析
   */
  private analyzePostTimings(posts: any[]): any {
    const times = posts.map(post => new Date(post.createdAt));
    const hours = times.map(time => time.getHours());
    const days = times.map(time => time.getDay());
    
    const period = posts.length > 0 ? 
      `${times[times.length-1].toLocaleDateString()} - ${times[0].toLocaleDateString()}` : 
      'データなし';
      
    return {
      period,
      mostActiveHours: this.findMostFrequent(hours, 3),
      weekdayActivity: this.calculateWeekdayActivity(days),
      averageFrequency: posts.length / Math.max(1, this.getWeeksBetween(times))
    };
  }

  private findMostFrequent(array: number[], count: number): number[] {
    const frequency: Record<number, number> = {};
    array.forEach(item => frequency[item] = (frequency[item] || 0) + 1);
    
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, count)
      .map(([hour]) => parseInt(hour));
  }

  private calculateWeekdayActivity(days: number[]): number[] {
    const activity = new Array(7).fill(0);
    days.forEach(day => activity[day]++);
    
    const max = Math.max(...activity);
    return activity.map(count => max > 0 ? Math.round((count / max) * 10) : 0);
  }

  private getWeeksBetween(dates: Date[]): number {
    if (dates.length < 2) return 1;
    const diffTime = Math.abs(dates[0].getTime() - dates[dates.length-1].getTime());
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7)));
  }

  /**
   * 生活パターン分析結果のパース
   */
  private parseLifestyleAnalysis(analysisText: string): LifestylePattern {
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

    const parseNumberArray = (value: string | undefined): number[] => {
      if (!value) return [];
      return value.replace(/[\[\]]/g, '').split(',').map(s => parseInt(s.trim()) || 0);
    };

    const parseStringArray = (value: string | undefined): string[] => {
      if (!value) return [];
      return value.replace(/[\[\]]/g, '').split(',').map(s => s.trim()).filter(s => s);
    };

    const parseFloat01 = (value: string | undefined): number => {
      if (!value) return 0.5;
      const num = parseFloat(value.replace(/[^\d.]/g, ''));
      return Math.max(0, Math.min(1, isNaN(num) ? 0.5 : num));
    };

    const mostActiveHours = parseNumberArray(data['ACTIVE_HOURS']).slice(0, 3);
    const weekdayPattern = parseNumberArray(data['WEEKDAY_PATTERN']).slice(0, 7);
    const weekendPattern = parseNumberArray(data['WEEKEND_PATTERN']).slice(0, 2);

    return {
      timePatterns: {
        mostActiveHours: mostActiveHours.length > 0 ? mostActiveHours : [9, 15, 20],
        weekdayPattern: weekdayPattern.length === 7 ? weekdayPattern : [5, 6, 6, 6, 6, 8, 7],
        weekendPattern: weekendPattern.length === 2 ? weekendPattern : [8, 7]
      },
      behaviorPatterns: {
        averagePostingFrequency: parseFloat(data['POST_FREQUENCY']?.replace(/[^\d.]/g, '') || '2'),
        travelRadius: parseFloat(data['TRAVEL_RADIUS']?.replace(/[^\d.]/g, '') || '10'),
        favoriteLocations: parseStringArray(data['FAVORITE_LOCATIONS']),
        activityLevel: ['low', 'medium', 'high'].includes(data['ACTIVITY_LEVEL']?.toLowerCase()) ? 
          data['ACTIVITY_LEVEL'].toLowerCase() as any : 'medium'
      },
      environmentalPatterns: {
        seasonalActivity: {
          spring: parseFloat01(data['SEASONAL_SPRING']),
          summer: parseFloat01(data['SEASONAL_SUMMER']),
          autumn: parseFloat01(data['SEASONAL_AUTUMN']),
          winter: parseFloat01(data['SEASONAL_WINTER'])
        },
        weatherPreference: parseStringArray(data['WEATHER_PREFS'])
      },
      lastAnalyzed: new Date().toISOString(),
      confidence: parseFloat01(data['CONFIDENCE'])
    };
  }

  /**
   * 提案内容のパース
   */
  private parseSuggestions(suggestionsText: string, emotionAnalysis: EmotionAnalysis, lifestylePattern: LifestylePattern): PersonalizedSuggestion[] {
    const suggestions: PersonalizedSuggestion[] = [];
    const suggestionBlocks = suggestionsText.split('SUGGESTION_').filter(block => block.trim());

    suggestionBlocks.forEach((block, index) => {
      const lines = block.split('\n');
      const suggestionData: any = {};
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.includes(':')) {
          const colonIndex = trimmedLine.indexOf(':');
          const key = trimmedLine.substring(0, colonIndex).trim();
          const value = trimmedLine.substring(colonIndex + 1).trim();
          
          if (key && value) {
            suggestionData[key] = value;
          }
        }
      }

      if (suggestionData['TITLE']) {
        suggestions.push({
          id: `lifestyle-suggestion-${Date.now()}-${index}`,
          type: 'experience',
          title: suggestionData['TITLE'] || 'ライフスタイル提案',
          description: suggestionData['DESCRIPTION'] || '生活を豊かにする提案です',
          reasoning: suggestionData['REASONING'] || '分析に基づく推奨事項',
          content: {
            primaryAction: suggestionData['ACTION'] || '新しい体験を試してみましょう',
            timeRecommendation: {
              bestTime: suggestionData['TIME_BEST'] || '午後',
              duration: suggestionData['DURATION'] || '1-2時間'
            },
            preparations: [],
            followUpActions: []
          },
          priority: ['low', 'medium', 'high', 'urgent'].includes(suggestionData['PRIORITY']) ? 
            suggestionData['PRIORITY'] as any : 'medium',
          tags: ['ライフスタイル', '個人化提案'],
          estimatedEngagement: this.parseFloatSafe(suggestionData['ENGAGEMENT'], 0.7),
          createdAt: new Date().toISOString(),
          generatedBy: 'lifestyle_concierge'
        });
      }
    });

    // 提案を最高の1つに絞り込み
    const bestSuggestion = suggestions.length > 0 ? 
      suggestions.sort((a, b) => b.estimatedEngagement - a.estimatedEngagement)[0] : 
      this.getMockPersonalizedSuggestions()[0];
    
    return [bestSuggestion];
  }

  private parseFloatSafe(value: string | undefined, defaultValue: number): number {
    if (!value) return defaultValue;
    const num = parseFloat(value.replace(/[^\d.]/g, ''));
    return isNaN(num) ? defaultValue : Math.max(0, Math.min(1, num));
  }

  /**
   * レビューサイト連携による場所推薦（モック実装）
   */
  private async fetchPlaceRecommendations(
    emotionAnalysis: EmotionAnalysis,
    lifestylePattern: LifestylePattern,
    userLocation?: { latitude: number; longitude: number }
  ): Promise<PlaceRecommendation[]> {
    // 実装時は実際のレビューサイトAPIを使用
    return this.getMockPlaceRecommendations(emotionAnalysis);
  }

  /**
   * モック生活パターンデータ
   */
  private getMockLifestylePattern(): LifestylePattern {
    return {
      timePatterns: {
        mostActiveHours: [9, 15, 20],
        weekdayPattern: [4, 5, 6, 6, 5, 8, 7], // 月-日
        weekendPattern: [8, 7] // 土日
      },
      behaviorPatterns: {
        averagePostingFrequency: 2.5,
        travelRadius: 12,
        favoriteLocations: ['公園', 'カフェ', '美術館'],
        activityLevel: 'medium'
      },
      environmentalPatterns: {
        seasonalActivity: {
          spring: 0.8,
          summer: 0.9,
          autumn: 0.7,
          winter: 0.5
        },
        weatherPreference: ['晴れ', '曇り', '雨上がり']
      },
      lastAnalyzed: new Date().toISOString(),
      confidence: 0.3
    };
  }

  /**
   * モック場所推薦データ
   */
  private getMockPlaceRecommendations(emotionAnalysis: EmotionAnalysis): PlaceRecommendation[] {
    const baseRecommendations: PlaceRecommendation[] = [
      {
        id: 'place-1',
        name: '静寂のカフェ "Quiet Moments"',
        type: 'cafe',
        location: {
          latitude: 35.6762,
          longitude: 139.6503,
          address: '東京都港区南青山2-14-9'
        },
        rating: 4.5,
        priceRange: '$$',
        description: '落ち着いた雰囲気で読書や作業に最適な隠れ家カフェ',
        tags: ['静か', '作業環境', '本格コーヒー'],
        reviewCount: 892,
        photos: [],
        openingHours: '8:00-22:00',
        website: 'https://example-cafe.com'
      },
      {
        id: 'place-2',
        name: '新宿御苑',
        type: 'park',
        location: {
          latitude: 35.6851,
          longitude: 139.7105,
          address: '東京都新宿区内藤町11'
        },
        rating: 4.8,
        priceRange: '$',
        description: '四季折々の自然を楽しめる都心のオアシス',
        tags: ['自然', '撮影', 'リフレッシュ'],
        reviewCount: 12453,
        photos: []
      },
      {
        id: 'place-3',
        name: 'アート空間 "Gallery MUSE"',
        type: 'cultural_site',
        location: {
          latitude: 35.6694,
          longitude: 139.7014,
          address: '東京都渋谷区神宮前5-10-1'
        },
        rating: 4.3,
        priceRange: '$$',
        description: '現代アートと伝統工芸の融合を体験できるギャラリー',
        tags: ['アート', '文化', 'インスピレーション'],
        reviewCount: 567,
        photos: []
      }
    ];

    // 感情状態に基づいて推薦を調整
    if (emotionAnalysis.emotions.stress > 0.6) {
      return baseRecommendations.filter(place => 
        place.tags.includes('リフレッシュ') || place.tags.includes('静か')
      );
    } else if (emotionAnalysis.emotions.curiosity > 0.7) {
      return baseRecommendations.filter(place => 
        place.tags.includes('アート') || place.tags.includes('文化')
      );
    }

    return baseRecommendations;
  }

  /**
   * 現在の季節を取得
   */
  private getCurrentSeason(): string {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) return '春';
    if (month >= 6 && month <= 8) return '夏';
    if (month >= 9 && month <= 11) return '秋';
    return '冬';
  }

  /**
   * 超具体的モック提案データ
   */
  private getMockPersonalizedSuggestions(): PersonalizedSuggestion[] {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowFormatted = tomorrow.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
    
    return [
      {
        id: 'ultra-specific-suggestion-1',
        type: 'experience',
        title: '明日の14:30、ブルーシールコーヒーでアイスコーヒー',
        description: `${tomorrowFormatted}の14:30、新宿南口から徒歩3分のBlue Seal Coffeeでオキナワ特製アイスコーヒー(税込450円)を注文。窓際席で読書しながらリフレッシュ。`,
        reasoning: '好奇心が高くストレスを抑えたい状態で、新しい体験とリラックスを両立できるため',
        content: {
          primaryAction: `${tomorrowFormatted}14:30に新宿南口東口から徒歩3分のBlue Seal Coffee新宿店へ`,
          timeRecommendation: {
            bestTime: '14:30-15:30',
            duration: '60分'
          },
          preparations: ['読みたい本', 'スマートフォン', '現金450円'],
          followUpActions: ['アイスコーヒーの味を記録', '窓際の景色を写真撮影', '次回のメニューをチェック']
        },
        priority: 'urgent',
        tags: ['アイスコーヒー', '新宿', '読書'],
        estimatedEngagement: 0.95,
        createdAt: new Date().toISOString(),
        generatedBy: 'lifestyle_concierge'
      }
    ];
  }

  /**
   * 生活パターンの変化追跡
   */
  compareLifestyleEvolution(current: LifestylePattern, previous: LifestylePattern): {
    timeChanges: any;
    behaviorChanges: any;
    significantChanges: string[];
    recommendations: string[];
  } {
    const significantChanges: string[] = [];
    const recommendations: string[] = [];

    // 活動レベルの変化
    if (current.behaviorPatterns.activityLevel !== previous.behaviorPatterns.activityLevel) {
      significantChanges.push(`活動レベルが${previous.behaviorPatterns.activityLevel}から${current.behaviorPatterns.activityLevel}に変化`);
    }

    // 投稿頻度の変化
    const frequencyChange = current.behaviorPatterns.averagePostingFrequency - previous.behaviorPatterns.averagePostingFrequency;
    if (Math.abs(frequencyChange) > 0.5) {
      significantChanges.push(`投稿頻度が${frequencyChange > 0 ? '増加' : '減少'}: ${Math.abs(frequencyChange).toFixed(1)}回/週の変化`);
      
      if (frequencyChange < -1) {
        recommendations.push('最近投稿が減っています。新しい体験や場所を探してみませんか？');
      }
    }

    // 行動半径の変化
    const radiusChange = current.behaviorPatterns.travelRadius - previous.behaviorPatterns.travelRadius;
    if (Math.abs(radiusChange) > 5) {
      significantChanges.push(`行動半径が${radiusChange > 0 ? '拡大' : '縮小'}: ${Math.abs(radiusChange).toFixed(0)}kmの変化`);
    }

    return {
      timeChanges: {
        activeHourShift: current.timePatterns.mostActiveHours,
        weekdayActivityChange: current.timePatterns.weekdayPattern
      },
      behaviorChanges: {
        frequencyChange,
        radiusChange,
        activityLevelChange: current.behaviorPatterns.activityLevel
      },
      significantChanges,
      recommendations
    };
  }

  /**
   * API利用可能性チェック
   */
  isApiAvailable(): boolean {
    return !!API_KEY && !!this.model;
  }
}

export const lifestyleConciergeService = new LifestyleConciergeService();