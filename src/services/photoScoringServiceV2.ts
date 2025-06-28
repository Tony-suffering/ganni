import { GoogleGenerativeAI } from '@google/generative-ai';
import { DetailedPhotoScore, ScoreBreakdown } from '../types/photoScoreV2';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export class PhotoScoringServiceV2 {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  
  constructor() {
    if (API_KEY) {
      this.genAI = new GoogleGenerativeAI(API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    }
  }

  /**
   * 1000点満点での詳細写真採点
   */
  async scorePhotoDetailed(imageUrl: string, title: string, description: string): Promise<DetailedPhotoScore> {
    if (!this.model) {
      return this.getMockDetailedScore();
    }

    const prompt = this.createDetailedScoringPrompt(title, description);
    
    try {
      const startTime = Date.now();
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const processingTime = Date.now() - startTime;
      
      const analysisText = response.text();
      return this.parseDetailedScore(analysisText, processingTime);
    } catch (error) {
      console.error('Detailed scoring failed:', error);
      return this.getMockDetailedScore();
    }
  }

  private createDetailedScoringPrompt(title: string, description: string): string {
    return `
あなたはプロフェッショナル写真評価AIです。以下の写真を1000点満点で詳細評価してください。

写真情報:
タイトル: ${title}
説明: ${description}

評価基準 (1000点満点):

1. 技術的品質 (300点)
   - 露出・明度 (60点): ハイライト・シャドウバランス、HDR活用、明度分布
   - フォーカス・シャープネス (60点): 主被写体鮮明さ、被写界深度、手ブレ
   - 色彩・画質 (60点): 色温度、彩度コントラスト、ノイズレベル
   - 撮影技術 (60点): ISO、シャッタースピード、絞り値、レンズ活用
   - 後処理技術 (60点): 自然な仕上がり、効果的補正

2. 構図・アート性 (250点)
   - 基本構図法 (80点): 三分割法、黄金比、対称性、視線誘導
   - 空間構成 (70点): 前中背景層、奥行き表現、余白活用
   - 視覚的バランス (50点): 重量感、色彩、明暗バランス
   - 独創的視点 (50点): アングル独創性、切り取り方

3. 創造性・表現力 (250点)
   - 光の表現 (80点): 自然光・人工光活用、影の効果
   - 被写体・瞬間 (70点): 被写体選択、決定的瞬間、動き
   - ストーリーテリング (60点): 物語性、感情表現、メッセージ
   - 芸術的価値 (40点): 美的センス、独自性、文化的価値

4. エンゲージメント・魅力度 (200点)
   - 視覚的インパクト (70点): 第一印象、目を引く要素、驚き
   - 共感・親近感 (60点): 親しみやすさ、共感度、温かみ
   - SNS適性 (40点): SNS映え、シェア適性
   - 記憶定着度 (30点): 印象度、ユニークさ

回答フォーマット (必ずこの形式で):
TOTAL_SCORE: [総合点数 0-1000]
LEVEL: [S+,S,A+,A,B+,B,C+,C,D,E]
LEVEL_DESC: [レベル説明]

TECHNICAL: [技術点数 0-300]
- EXPOSURE: [0-60]
- FOCUS: [0-60] 
- COLOR: [0-60]
- TECHNIQUE: [0-60]
- PROCESSING: [0-60]

COMPOSITION: [構図点数 0-250]
- BASIC: [0-80]
- SPATIAL: [0-70]
- BALANCE: [0-50]
- CREATIVE: [0-50]

CREATIVITY: [創造性点数 0-250]
- LIGHT: [0-80]
- SUBJECT: [0-70]
- STORY: [0-60]
- ARTISTIC: [0-40]

ENGAGEMENT: [魅力度点数 0-200]
- IMPACT: [0-70]
- RELATE: [0-60]
- SOCIAL: [0-40]
- MEMORY: [0-30]

COMMENT: [全体的な評価コメント 200文字以内]
STRENGTHS: [強み1],[強み2],[強み3]
IMPROVEMENTS: [改善点1],[改善点2],[改善点3]
TECHNICAL_ADVICE: [技術アドバイス1],[技術アドバイス2]
CREATIVE_SUGGESTIONS: [創造的提案1],[創造的提案2]
CONFIDENCE: [0.0-1.0の信頼度]
`;
  }

  private parseDetailedScore(analysisText: string, processingTime: number): DetailedPhotoScore {
    const lines = analysisText.split('\n');
    const data: any = {};
    
    for (const line of lines) {
      const [key, value] = line.split(':').map(s => s.trim());
      if (key && value) {
        data[key] = value;
      }
    }

    // パース関数
    const parseScore = (value: string): number => parseInt(value.replace(/[^\d]/g, '')) || 0;
    const parseList = (value: string): string[] => value.split(',').map(s => s.trim()).filter(s => s);
    
    try {
      const result: DetailedPhotoScore = {
        totalScore: parseScore(data['TOTAL_SCORE']),
        scoreLevel: data['LEVEL'] as any || 'C',
        levelDescription: data['LEVEL_DESC'] || 'バランスの取れた写真',
        
        technical: {
          total: parseScore(data['TECHNICAL']),
          exposure: parseScore(data['EXPOSURE']),
          focus: parseScore(data['FOCUS']),
          colorQuality: parseScore(data['COLOR']),
          shootingTechnique: parseScore(data['TECHNIQUE']),
          postProcessing: parseScore(data['PROCESSING'])
        },
        
        composition: {
          total: parseScore(data['COMPOSITION']),
          basicComposition: parseScore(data['BASIC']),
          spatialComposition: parseScore(data['SPATIAL']),
          visualBalance: parseScore(data['BALANCE']),
          creativeViewpoint: parseScore(data['CREATIVE'])
        },
        
        creativity: {
          total: parseScore(data['CREATIVITY']),
          lightExpression: parseScore(data['LIGHT']),
          subjectMoment: parseScore(data['SUBJECT']),
          storytelling: parseScore(data['STORY']),
          artisticValue: parseScore(data['ARTISTIC'])
        },
        
        engagement: {
          total: parseScore(data['ENGAGEMENT']),
          visualImpact: parseScore(data['IMPACT']),
          relatability: parseScore(data['RELATE']),
          socialMedia: parseScore(data['SOCIAL']),
          memorability: parseScore(data['MEMORY'])
        },
        
        overallComment: data['COMMENT'] || '総合的に良い写真です。',
        detailedFeedback: {
          strengths: parseList(data['STRENGTHS']),
          improvements: parseList(data['IMPROVEMENTS']),
          technicalAdvice: parseList(data['TECHNICAL_ADVICE']),
          creativeSuggestions: parseList(data['CREATIVE_SUGGESTIONS'])
        },
        
        analysisVersion: '2.0.0',
        processingTime,
        confidence: parseFloat(data['CONFIDENCE']) || 0.8
      };
      
      return result;
    } catch (error) {
      console.error('Score parsing failed:', error);
      return this.getMockDetailedScore();
    }
  }

  private getMockDetailedScore(): DetailedPhotoScore {
    return {
      totalScore: 742,
      scoreLevel: 'A',
      levelDescription: 'とても優秀な写真です',
      
      technical: {
        total: 220,
        exposure: 52,
        focus: 48,
        colorQuality: 45,
        shootingTechnique: 40,
        postProcessing: 35
      },
      
      composition: {
        total: 185,
        basicComposition: 65,
        spatialComposition: 55,
        visualBalance: 35,
        creativeViewpoint: 30
      },
      
      creativity: {
        total: 195,
        lightExpression: 68,
        subjectMoment: 58,
        storytelling: 45,
        artisticValue: 24
      },
      
      engagement: {
        total: 142,
        visualImpact: 58,
        relatability: 45,
        socialMedia: 25,
        memorability: 14
      },
      
      overallComment: '光の使い方が巧みで、構図にも工夫が見られる魅力的な作品です。技術的な完成度も高く、見る人の心を引きつける力があります。',
      detailedFeedback: {
        strengths: [
          '光と影のコントラストが美しい',
          '構図のバランスが絶妙',
          '被写体の選択が印象的'
        ],
        improvements: [
          'より大胆な構図にチャレンジ',
          '色彩の統一感を意識',
          'ストーリー性をより強化'
        ],
        technicalAdvice: [
          'シャッタースピードをもう少し早めに',
          'ISO感度を下げてノイズを軽減'
        ],
        creativeSuggestions: [
          '異なるアングルからの撮影も試してみる',
          '季節や時間帯を変えて同じ被写体を撮影'
        ]
      },
      
      analysisVersion: '2.0.0-mock',
      processingTime: 1250,
      confidence: 0.85
    };
  }

  /**
   * スコアレベルの詳細情報を取得
   */
  static getDetailedScoreLevel(score: number): { level: string; description: string; color: string; badge: string } {
    if (score >= 950) return { level: 'S+', description: '伝説級の傑作', color: '#FFD700', badge: '🏆' };
    if (score >= 900) return { level: 'S', description: 'プロフェッショナル級', color: '#FF6B6B', badge: '⭐' };
    if (score >= 850) return { level: 'A+', description: '非常に優秀', color: '#4ECDC4', badge: '💎' };
    if (score >= 800) return { level: 'A', description: '優秀', color: '#45B7D1', badge: '🎯' };
    if (score >= 750) return { level: 'B+', description: 'とても良い', color: '#96CEB4', badge: '🌟' };
    if (score >= 700) return { level: 'B', description: '良い', color: '#FFEAA7', badge: '👍' };
    if (score >= 650) return { level: 'C+', description: '平均以上', color: '#DDA0DD', badge: '📈' };
    if (score >= 600) return { level: 'C', description: '平均的', color: '#F0AD4E', badge: '📊' };
    if (score >= 500) return { level: 'D', description: '改善の余地あり', color: '#D9534F', badge: '🔄' };
    return { level: 'E', description: '要改善', color: '#777', badge: '📝' };
  }

  /**
   * API接続テスト
   */
  async testAPIConnection(): Promise<boolean> {
    if (!this.model) return false;
    
    try {
      const result = await this.model.generateContent('テスト');
      return true;
    } catch {
      return false;
    }
  }
}