import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  GrowthTracking, 
  Milestone, 
  PersonalizedSuggestion, 
  EmotionAnalysis,
  LifestylePattern,
  AnalysisRequest,
  CuratorResponse 
} from '../types/curator';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

/**
 * AI成長パートナーサービス
 * 長期的な個人成長とスキル向上をサポート
 */
export class GrowthPartnerService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor() {
    if (API_KEY) {
      this.genAI = new GoogleGenerativeAI(API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    }
  }

  /**
   * 投稿履歴から成長追跡分析
   */
  async trackGrowthProgress(
    request: AnalysisRequest,
    previousGrowthData?: GrowthTracking
  ): Promise<CuratorResponse<GrowthTracking>> {
    console.log('📈 Tracking growth progress for user:', request.userId);

    if (!this.model) {
      console.warn('Gemini API not available, using mock growth analysis');
      return {
        success: true,
        data: this.getMockGrowthTracking(),
        metadata: {
          processingTime: 1000,
          confidence: 0.3,
          version: '1.0.0-mock'
        }
      };
    }

    try {
      const startTime = Date.now();
      
      // 成長追跡分析プロンプト生成
      const growthPrompt = this.createGrowthTrackingPrompt(request, previousGrowthData);
      
      const result = await this.model.generateContent(growthPrompt);
      const response = await result.response;
      const analysisText = response.text();
      
      console.log('🤖 Gemini growth analysis result:', analysisText);
      
      const processingTime = Date.now() - startTime;
      const growthData = this.parseGrowthTracking(analysisText, previousGrowthData);
      
      return {
        success: true,
        data: growthData,
        metadata: {
          processingTime,
          confidence: growthData.photographySkills.consistency / 100,
          version: '1.0.0-gemini'
        }
      };
    } catch (error) {
      console.error('❌ Growth tracking analysis failed:', error);
      return {
        success: false,
        error: 'Failed to track growth progress',
        data: this.getMockGrowthTracking(),
        metadata: {
          processingTime: 1000,
          confidence: 0.1,
          version: '1.0.0-fallback'
        }
      };
    }
  }

  /**
   * 成長に基づく次のステップ提案
   */
  async generateGrowthSuggestions(
    growthTracking: GrowthTracking,
    emotionAnalysis: EmotionAnalysis,
    lifestylePattern: LifestylePattern
  ): Promise<CuratorResponse<PersonalizedSuggestion[]>> {
    console.log('🎯 Generating growth-oriented suggestions...');

    if (!this.model) {
      return {
        success: true,
        data: this.getMockGrowthSuggestions(),
        metadata: {
          processingTime: 800,
          confidence: 0.3,
          version: '1.0.0-mock'
        }
      };
    }

    try {
      const startTime = Date.now();
      
      const suggestionPrompt = this.createGrowthSuggestionPrompt(growthTracking, emotionAnalysis, lifestylePattern);
      
      const result = await this.model.generateContent(suggestionPrompt);
      const response = await result.response;
      const suggestionsText = response.text();
      
      console.log('🤖 Gemini growth suggestions:', suggestionsText);
      
      const suggestions = this.parseGrowthSuggestions(suggestionsText, growthTracking);
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        data: suggestions,
        metadata: {
          processingTime,
          confidence: 0.9,
          version: '1.0.0-gemini'
        }
      };
    } catch (error) {
      console.error('❌ Growth suggestions generation failed:', error);
      return {
        success: false,
        error: 'Failed to generate growth suggestions',
        data: this.getMockGrowthSuggestions(),
        metadata: {
          processingTime: 800,
          confidence: 0.2,
          version: '1.0.0-fallback'
        }
      };
    }
  }

  /**
   * マイルストーン達成の検出と記録
   */
  async detectMilestones(
    currentGrowth: GrowthTracking,
    previousGrowth?: GrowthTracking,
    recentPosts?: any[]
  ): Promise<Milestone[]> {
    const newMilestones: Milestone[] = [];
    const now = new Date().toISOString();

    if (!previousGrowth) {
      // 初回分析時の基本マイルストーン
      newMilestones.push({
        id: `milestone-${Date.now()}-start`,
        title: '成長追跡スタート',
        description: 'AIパートナーによる成長サポートが開始されました',
        category: 'personal',
        achievedAt: now,
        significance: 'small'
      });
      return newMilestones;
    }

    // 技術的成長のマイルストーン
    if (currentGrowth.photographySkills.technical >= 80 && previousGrowth.photographySkills.technical < 80) {
      newMilestones.push({
        id: `milestone-${Date.now()}-tech-expert`,
        title: '技術エキスパート達成',
        description: '写真技術レベルが80点を突破しました',
        category: 'technical',
        achievedAt: now,
        significance: 'major'
      });
    }

    // 芸術的成長のマイルストーン
    if (currentGrowth.photographySkills.artistic >= 75 && previousGrowth.photographySkills.artistic < 75) {
      newMilestones.push({
        id: `milestone-${Date.now()}-artist`,
        title: 'アーティスト認定',
        description: '芸術性レベルが75点を達成しました',
        category: 'artistic',
        achievedAt: now,
        significance: 'major'
      });
    }

    // 一貫性のマイルストーン
    if (currentGrowth.photographySkills.consistency >= 90 && previousGrowth.photographySkills.consistency < 90) {
      newMilestones.push({
        id: `milestone-${Date.now()}-consistent`,
        title: '安定した創作活動',
        description: '継続性スコアが90点を達成しました',
        category: 'personal',
        achievedAt: now,
        significance: 'medium'
      });
    }

    // 多様性のマイルストーン
    const diversityAverage = (
      currentGrowth.experienceDiversity.locationDiversity +
      currentGrowth.experienceDiversity.timeDiversity +
      currentGrowth.experienceDiversity.subjectDiversity +
      currentGrowth.experienceDiversity.styleDiversity
    ) / 4;

    const prevDiversityAverage = previousGrowth ? (
      previousGrowth.experienceDiversity.locationDiversity +
      previousGrowth.experienceDiversity.timeDiversity +
      previousGrowth.experienceDiversity.subjectDiversity +
      previousGrowth.experienceDiversity.styleDiversity
    ) / 4 : 0;

    if (diversityAverage >= 85 && prevDiversityAverage < 85) {
      newMilestones.push({
        id: `milestone-${Date.now()}-explorer`,
        title: '多様性エクスプローラー',
        description: '様々な体験と表現に挑戦し続けています',
        category: 'personal',
        achievedAt: now,
        significance: 'major'
      });
    }

    // 感情的成長のマイルストーン
    if (currentGrowth.emotionalGrowth.confidence >= 80 && previousGrowth.emotionalGrowth.confidence < 80) {
      newMilestones.push({
        id: `milestone-${Date.now()}-confident`,
        title: '自信の獲得',
        description: '自信レベルが大幅に向上しました',
        category: 'personal',
        achievedAt: now,
        significance: 'major'
      });
    }

    return newMilestones;
  }

  /**
   * 成長追跡プロンプト作成
   */
  private createGrowthTrackingPrompt(request: AnalysisRequest, previousGrowth?: GrowthTracking): string {
    const postSummary = request.posts.map((post, index) => {
      const date = new Date(post.createdAt);
      return `
投稿${index + 1}: ${date.toLocaleDateString('ja-JP')}
タイトル: "${post.title}"
説明: "${post.description}"
タグ: ${post.tags.join(', ')}`;
    }).join('\n');

    const previousInfo = previousGrowth ? `
【前回の成長データ（比較用）】
技術レベル: ${previousGrowth.photographySkills.technical}
芸術レベル: ${previousGrowth.photographySkills.artistic}
一貫性: ${previousGrowth.photographySkills.consistency}
改善度: ${previousGrowth.photographySkills.improvement}
最終更新: ${previousGrowth.lastUpdated}
` : '【初回分析】前回データなし';

    return `
あなたは個人成長分析の専門家です。写真投稿の変化から、この人の技術的・芸術的・感情的成長を詳細に評価してください。

【分析対象データ】
投稿数: ${request.posts.length}件
期間: ${request.timeframe ? `${request.timeframe.start} ～ ${request.timeframe.end}` : '全期間'}

${postSummary}

${previousInfo}

【成長評価の観点】
1. 写真技術の向上（構図、光の使い方、技術的完成度）
2. 芸術的表現力の発達（創造性、独自性、感性）
3. 継続性と安定性（投稿の質の一貫性）
4. 体験の多様性（場所、時間、被写体、スタイルの広がり）
5. 精神的・感情的成長（自信、開放性、ポジティブ度）

【重要な分析ポイント】
- 時系列での変化と進歩
- 挑戦への意欲と結果
- 表現の幅の拡大
- 自己表現の深化
- 社会的つながりの発展

**必須回答フォーマット（0-100の数値で評価）:**

PHOTOGRAPHY_SKILLS:
TECHNICAL: [0-100] (技術的品質の向上度)
ARTISTIC: [0-100] (芸術的表現力)
CONSISTENCY: [0-100] (作品の一貫した質)
IMPROVEMENT: [0-100] (前回からの改善度)

EXPERIENCE_DIVERSITY:
LOCATION: [0-100] (撮影場所の多様性)
TIME: [0-100] (時間帯・季節の多様性)
SUBJECT: [0-100] (被写体の多様性)
STYLE: [0-100] (表現スタイルの多様性)

EMOTIONAL_GROWTH:
POSITIVITY: [0-100] (ポジティブ度の変化)
OPENNESS: [0-100] (新しい体験への開放性)
CONFIDENCE: [0-100] (自信度)
SOCIAL: [0-100] (社会的つながり)

GROWTH_SUMMARY: [成長の要約と特徴 200文字以内]
STRENGTHS: [成長の強み3つ]
NEXT_CHALLENGES: [次の挑戦すべき領域3つ]
CONFIDENCE_LEVEL: [0.0-1.0の分析信頼度]

【評価基準】
- 50点: 平均的レベル
- 70点: 優秀レベル
- 85点: エキスパートレベル
- 95点以上: マスターレベル
`;
  }

  /**
   * 成長提案プロンプト作成
   */
  private createGrowthSuggestionPrompt(
    growthTracking: GrowthTracking, 
    emotionAnalysis: EmotionAnalysis, 
    lifestylePattern: LifestylePattern
  ): string {
    const weakestAreas = this.identifyWeakestGrowthAreas(growthTracking);
    const strongestAreas = this.identifyStrongestGrowthAreas(growthTracking);

    return `
あなたは個人成長コーチの専門家です。以下のデータを基に、この人の次のレベルへの成長を促進する具体的な提案を3つ作成してください。

【現在の成長状況】
技術レベル: ${growthTracking.photographySkills.technical}/100
芸術レベル: ${growthTracking.photographySkills.artistic}/100
一貫性: ${growthTracking.photographySkills.consistency}/100
改善度: ${growthTracking.photographySkills.improvement}/100

【体験の多様性】
場所: ${growthTracking.experienceDiversity.locationDiversity}/100
時間: ${growthTracking.experienceDiversity.timeDiversity}/100
被写体: ${growthTracking.experienceDiversity.subjectDiversity}/100
スタイル: ${growthTracking.experienceDiversity.styleDiversity}/100

【感情的成長】
ポジティブ度: ${growthTracking.emotionalGrowth.positivity}/100
開放性: ${growthTracking.emotionalGrowth.openness}/100
自信度: ${growthTracking.emotionalGrowth.confidence}/100
社会性: ${growthTracking.emotionalGrowth.socialConnection}/100

【現在の感情状態】
喜び: ${emotionAnalysis.emotions.joy}
好奇心: ${emotionAnalysis.emotions.curiosity}
ストレス: ${emotionAnalysis.emotions.stress}

【弱点領域】${weakestAreas.join(', ')}
【強み領域】${strongestAreas.join(', ')}

【成長提案の方針】
1. 弱点を具体的にターゲットした挑戦
2. 強みをさらに伸ばす高度な体験
3. 総合的な成長を促進する新しい領域

**回答フォーマット（3つの提案）:**

GROWTH_SUGGESTION_1:
TITLE: [成長提案タイトル]
DESCRIPTION: [詳細説明 120文字以内]
REASONING: [提案理由 100文字以内]
TARGET_AREA: [対象成長領域]
ACTION: [具体的アクション]
DIFFICULTY: [easy|medium|hard|expert]
DURATION: [実施期間]
SUCCESS_METRICS: [成功の測定方法]
PRIORITY: [low|medium|high|urgent]
ENGAGEMENT: [0.0-1.0の期待エンゲージメント]

GROWTH_SUGGESTION_2:
[同様の形式]

GROWTH_SUGGESTION_3:
[同様の形式]

【重要な考慮事項】
- 現在のスキルレベルに適した挑戦
- 段階的な成長戦略
- モチベーション維持の工夫
- 実現可能性と効果のバランス
- 長期的な視点での成長計画
`;
  }

  /**
   * 成長データの弱点領域特定
   */
  private identifyWeakestGrowthAreas(growthTracking: GrowthTracking): string[] {
    const areas = [
      { name: '技術力', score: growthTracking.photographySkills.technical },
      { name: '芸術性', score: growthTracking.photographySkills.artistic },
      { name: '一貫性', score: growthTracking.photographySkills.consistency },
      { name: '場所多様性', score: growthTracking.experienceDiversity.locationDiversity },
      { name: '時間多様性', score: growthTracking.experienceDiversity.timeDiversity },
      { name: '被写体多様性', score: growthTracking.experienceDiversity.subjectDiversity },
      { name: '自信度', score: growthTracking.emotionalGrowth.confidence },
      { name: '社会性', score: growthTracking.emotionalGrowth.socialConnection }
    ];

    return areas
      .sort((a, b) => a.score - b.score)
      .slice(0, 3)
      .map(area => area.name);
  }

  /**
   * 成長データの強み領域特定
   */
  private identifyStrongestGrowthAreas(growthTracking: GrowthTracking): string[] {
    const areas = [
      { name: '技術力', score: growthTracking.photographySkills.technical },
      { name: '芸術性', score: growthTracking.photographySkills.artistic },
      { name: '一貫性', score: growthTracking.photographySkills.consistency },
      { name: '場所多様性', score: growthTracking.experienceDiversity.locationDiversity },
      { name: '開放性', score: growthTracking.emotionalGrowth.openness },
      { name: 'ポジティブ度', score: growthTracking.emotionalGrowth.positivity }
    ];

    return areas
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(area => area.name);
  }

  /**
   * 成長追跡データのパース
   */
  private parseGrowthTracking(analysisText: string, previousGrowth?: GrowthTracking): GrowthTracking {
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

    const parseScore = (value: string | undefined): number => {
      if (!value) return 50;
      const num = parseInt(value.replace(/[^\d]/g, ''));
      return Math.max(0, Math.min(100, isNaN(num) ? 50 : num));
    };

    const parseStringArray = (value: string | undefined): string[] => {
      if (!value) return [];
      return value.replace(/[\[\]]/g, '').split(',').map(s => s.trim()).filter(s => s);
    };

    const parseFloat01 = (value: string | undefined): number => {
      if (!value) return 0.7;
      const num = parseFloat(value.replace(/[^\d.]/g, ''));
      return Math.max(0, Math.min(1, isNaN(num) ? 0.7 : num));
    };

    // 前回データがある場合は履歴を更新
    const growthHistory = previousGrowth?.growthHistory || [];
    const newDataPoint = {
      date: new Date().toISOString(),
      scores: {
        technical: parseScore(data['TECHNICAL']),
        artistic: parseScore(data['ARTISTIC']),
        consistency: parseScore(data['CONSISTENCY']),
        improvement: parseScore(data['IMPROVEMENT']),
        positivity: parseScore(data['POSITIVITY']),
        confidence: parseScore(data['CONFIDENCE'])
      }
    };
    growthHistory.push(newDataPoint);

    // 過去50エントリまで保持
    if (growthHistory.length > 50) {
      growthHistory.splice(0, growthHistory.length - 50);
    }

    return {
      photographySkills: {
        technical: parseScore(data['TECHNICAL']),
        artistic: parseScore(data['ARTISTIC']),
        consistency: parseScore(data['CONSISTENCY']),
        improvement: parseScore(data['IMPROVEMENT'])
      },
      experienceDiversity: {
        locationDiversity: parseScore(data['LOCATION']),
        timeDiversity: parseScore(data['TIME']),
        subjectDiversity: parseScore(data['SUBJECT']),
        styleDiversity: parseScore(data['STYLE'])
      },
      emotionalGrowth: {
        positivity: parseScore(data['POSITIVITY']),
        openness: parseScore(data['OPENNESS']),
        confidence: parseScore(data['CONFIDENCE']),
        socialConnection: parseScore(data['SOCIAL'])
      },
      milestones: previousGrowth?.milestones || [],
      growthHistory,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * 成長提案のパース
   */
  private parseGrowthSuggestions(suggestionsText: string, growthTracking: GrowthTracking): PersonalizedSuggestion[] {
    const suggestions: PersonalizedSuggestion[] = [];
    const suggestionBlocks = suggestionsText.split('GROWTH_SUGGESTION_').filter(block => block.trim());

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
          id: `growth-suggestion-${Date.now()}-${index}`,
          type: 'growth',
          title: suggestionData['TITLE'] || '成長チャレンジ',
          description: suggestionData['DESCRIPTION'] || '次のレベルへの挑戦です',
          reasoning: suggestionData['REASONING'] || '成長分析に基づく推奨',
          content: {
            primaryAction: suggestionData['ACTION'] || '新しいスキルに挑戦しましょう',
            timeRecommendation: {
              bestTime: '空いている時間',
              duration: suggestionData['DURATION'] || '1-2週間'
            },
            preparations: [],
            followUpActions: [suggestionData['SUCCESS_METRICS'] || '成果を記録']
          },
          priority: ['low', 'medium', 'high', 'urgent'].includes(suggestionData['PRIORITY']) ? 
            suggestionData['PRIORITY'] as any : 'medium',
          tags: ['成長', '挑戦', suggestionData['TARGET_AREA'] || 'スキル向上'],
          estimatedEngagement: this.parseFloatSafe(suggestionData['ENGAGEMENT'], 0.8),
          createdAt: new Date().toISOString(),
          generatedBy: 'growth_partner'
        });
      }
    });

    // 成長提案を最高の1つに絞り込み
    const bestSuggestion = suggestions.length > 0 ? 
      suggestions.sort((a, b) => b.estimatedEngagement - a.estimatedEngagement)[0] : 
      this.getMockGrowthSuggestions()[0];
    
    return [bestSuggestion];
  }

  private parseFloatSafe(value: string | undefined, defaultValue: number): number {
    if (!value) return defaultValue;
    const num = parseFloat(value.replace(/[^\d.]/g, ''));
    return isNaN(num) ? defaultValue : Math.max(0, Math.min(1, num));
  }

  /**
   * モック成長追跡データ
   */
  private getMockGrowthTracking(): GrowthTracking {
    const baseDate = new Date();
    return {
      photographySkills: {
        technical: 65 + Math.floor(Math.random() * 20),
        artistic: 58 + Math.floor(Math.random() * 25),
        consistency: 72 + Math.floor(Math.random() * 15),
        improvement: 45 + Math.floor(Math.random() * 30)
      },
      experienceDiversity: {
        locationDiversity: 60 + Math.floor(Math.random() * 25),
        timeDiversity: 55 + Math.floor(Math.random() * 20),
        subjectDiversity: 68 + Math.floor(Math.random() * 20),
        styleDiversity: 52 + Math.floor(Math.random() * 25)
      },
      emotionalGrowth: {
        positivity: 70 + Math.floor(Math.random() * 20),
        openness: 75 + Math.floor(Math.random() * 15),
        confidence: 62 + Math.floor(Math.random() * 25),
        socialConnection: 58 + Math.floor(Math.random() * 20)
      },
      milestones: [
        {
          id: 'milestone-mock-1',
          title: '成長追跡開始',
          description: 'AIパートナーによる成長サポートを開始しました',
          category: 'personal',
          achievedAt: new Date(baseDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          significance: 'small'
        }
      ],
      growthHistory: [
        {
          date: new Date(baseDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          scores: {
            technical: 60,
            artistic: 55,
            consistency: 70,
            improvement: 40,
            positivity: 68,
            confidence: 58
          }
        },
        {
          date: baseDate.toISOString(),
          scores: {
            technical: 65,
            artistic: 58,
            consistency: 72,
            improvement: 45,
            positivity: 70,
            confidence: 62
          }
        }
      ],
      lastUpdated: baseDate.toISOString()
    };
  }

  /**
   * モック成長提案データ
   */
  private getMockGrowthSuggestions(): PersonalizedSuggestion[] {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowFormatted = tomorrow.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
    
    return [
      {
        id: 'growth-suggestion-ultra-specific',
        type: 'growth',
        title: `${tomorrowFormatted}の17:30、新宿御苑でゴールデンアワー撮影`,
        description: `${tomorrowFormatted}の17:30、新宿御苑入口から徒歩5分の芝生エリアで夕日を背景にした人物シルエット撮影。光の方向と影の使い方を学習し技術レベルを向上。`,
        reasoning: '技術スコアの向上と光表現力の強化が必要で、具体的な時間と場所で実践的に学習できるため',
        content: {
          primaryAction: `${tomorrowFormatted}17:30に新宿御苑新宿門から入園し、芝生エリアでゴールデンアワー撮影実習`,
          timeRecommendation: {
            bestTime: '17:30-18:30',
            duration: '60分'
          },
          preparations: ['カメラ(スマホ可)', '入園料200円', '三脚(あれば)'],
          followUpActions: ['撮影設定をメモ', '光の変化を3枚で記録', 'SNSに投稿して反応確認']
        },
        priority: 'urgent',
        tags: ['技術向上', 'ゴールデンアワー', '新宿御苑'],
        estimatedEngagement: 0.95,
        createdAt: new Date().toISOString(),
        generatedBy: 'growth_partner'
      },
      {
        id: 'growth-suggestion-artistic',
        type: 'growth',
        title: 'ミニマリズム表現の探究',
        description: '複雑な要素を削ぎ落とし、本質的な美しさを追求する。構図の力とマイナススペースの効果を学習。',
        reasoning: '芸術性と独創性の向上により、表現の幅を拡大するため',
        content: {
          primaryAction: '毎日1枚、3つ以下の要素で構成された写真を撮影',
          timeRecommendation: {
            bestTime: '自由な時間',
            duration: '3週間継続'
          },
          preparations: ['ミニマリズム作品研究', '構図理論復習'],
          followUpActions: ['日々の作品比較', 'SNSでフィードバック収集', '最優秀作品選定']
        },
        priority: 'medium',
        tags: ['芸術性', 'ミニマリズム', '構図'],
        estimatedEngagement: 0.85,
        createdAt: new Date().toISOString(),
        generatedBy: 'growth_partner'
      },
      {
        id: 'growth-suggestion-social',
        type: 'growth',
        title: '写真コミュニティ参加',
        description: '地域の写真愛好家と交流し、異なる視点や技術を学ぶ。フィードバックの交換で成長を加速。',
        reasoning: '社会性スコア向上と多様な学習機会の獲得のため',
        content: {
          primaryAction: '地域の写真サークルまたはオンラインコミュニティに参加',
          timeRecommendation: {
            bestTime: '週末または平日夜',
            duration: '継続的参加'
          },
          preparations: ['コミュニティリサーチ', '自己紹介準備', 'ポートフォリオ整理'],
          followUpActions: ['月1回の作品発表', '他メンバーへのフィードバック', '合同撮影企画']
        },
        priority: 'medium',
        tags: ['社会性', 'コミュニティ', '学習'],
        estimatedEngagement: 0.75,
        createdAt: new Date().toISOString(),
        generatedBy: 'growth_partner'
      }
    ];
  }

  /**
   * 成長グラフデータの生成
   */
  generateGrowthChart(growthTracking: GrowthTracking): {
    labels: string[];
    datasets: { label: string; data: number[]; color: string }[];
  } {
    const history = growthTracking.growthHistory.slice(-10); // 最新10ポイント
    
    return {
      labels: history.map(point => new Date(point.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })),
      datasets: [
        {
          label: '技術力',
          data: history.map(point => point.scores.technical || 0),
          color: '#3B82F6'
        },
        {
          label: '芸術性',
          data: history.map(point => point.scores.artistic || 0),
          color: '#6B7280'
        },
        {
          label: '自信度',
          data: history.map(point => point.scores.confidence || 0),
          color: '#10B981'
        },
        {
          label: '改善度',
          data: history.map(point => point.scores.improvement || 0),
          color: '#F59E0B'
        }
      ]
    };
  }

  /**
   * API利用可能性チェック
   */
  isApiAvailable(): boolean {
    return !!API_KEY && !!this.model;
  }
}

export const growthPartnerService = new GrowthPartnerService();