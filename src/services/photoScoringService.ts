import { GoogleGenerativeAI } from '@google/generative-ai';

interface PhotoScore {
  technical: number;    // 技術的品質 (25点)
  composition: number;  // 構図・バランス (25点)
  creativity: number;   // 創造性・独創性 (25点)
  engagement: number;   // エンゲージメント予測 (25点)
  total: number;       // 合計100点
  breakdown: {
    technical: TechnicalScore;
    composition: CompositionScore;
    creativity: CreativityScore;
    engagement: EngagementScore;
  };
  comment: string;     // 詳細なフィードバック
}

interface TechnicalScore {
  quality: number;     // 画質 (5点)
  exposure: number;    // 露出 (5点)
  color: number;       // 色彩 (5点)
  sharpness: number;   // シャープネス (5点)
  noise: number;       // ノイズ (5点)
}

interface CompositionScore {
  ruleOfThirds: number;  // 三分割法 (8点)
  symmetry: number;      // 対称性 (5点)
  placement: number;     // 被写体配置 (7点)
  background: number;    // 背景バランス (5点)
}

interface CreativityScore {
  uniquePerspective: number;  // ユニークな視点 (10点)
  artisticExpression: number; // 芸術的表現 (8点)
  storytelling: number;       // ストーリー性 (7点)
}

interface EngagementScore {
  emotionalImpact: number;   // 感情的インパクト (10点)
  visualAppeal: number;      // 視覚的魅力 (8点)
  relatability: number;      // 共感度 (7点)
}

export class PhotoScoringService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    console.log('🔑 Gemini API initialized with key:', apiKey.slice(0, 10) + '...');
  }

  /**
   * APIキーをテスト
   */
  async testAPIKey(): Promise<boolean> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent('Hello, test message');
      const response = result.response.text();
      console.log('✅ API key test successful:', response.slice(0, 50));
      return true;
    } catch (error) {
      console.error('❌ API key test failed:', error);
      return false;
    }
  }

  /**
   * 写真を100点満点で採点
   */
  async scorePhoto(imageUrl: string, title?: string, description?: string): Promise<PhotoScore> {
    try {
      console.log('📸 Starting photo scoring for:', imageUrl);
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      // 画像をfetchしてBase64に変換
      console.log('🔄 Fetching image...');
      
      // CORS問題を回避するため、プロキシまたは異なる方法で画像を取得
      let response: Response;
      try {
        // 最初は直接fetch
        response = await fetch(imageUrl, {
          mode: 'cors',
          headers: {
            'Accept': 'image/*'
          }
        });
      } catch (corsError) {
        console.log('🚫 CORS error, trying alternative method...');
        // CORS失敗時はプロキシ経由で試行
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`;
        response = await fetch(proxyUrl);
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      console.log('📄 Image content type:', contentType);
      
      const arrayBuffer = await response.arrayBuffer();
      console.log('📦 Image size:', arrayBuffer.byteLength, 'bytes');
      
      // 画像サイズが大きすぎる場合は制限
      if (arrayBuffer.byteLength > 4 * 1024 * 1024) { // 4MB制限
        throw new Error(`Image too large: ${arrayBuffer.byteLength} bytes (max 4MB)`);
      }
      
      // 大きな画像でもスタックオーバーフローしない安全なBase64変換
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      const chunkSize = 8192;
      
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.slice(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }
      
      const base64 = btoa(binary);
      console.log('🔤 Base64 length:', base64.length);
      
      const prompt = this.createScoringPrompt(title, description);
      console.log('💭 Sending to Gemini...');
      
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64,
            mimeType: contentType
          }
        }
      ]);
      
      const responseText = result.response.text();
      console.log('✅ Gemini response received:', responseText.slice(0, 200) + '...');
      
      const score = this.parseScoreResponse(responseText);
      console.log('🏆 Final score:', score.total);
      
      return score;
      
    } catch (error) {
      console.error('❌ Photo scoring error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        imageUrl,
        title,
        description
      });
      return this.getDefaultScore();
    }
  }

  /**
   * AIプロンプトを作成
   */
  private createScoringPrompt(title?: string, description?: string): string {
    return `この写真を100点満点で詳細に採点してください。

【採点基準】
1. 技術的品質 (25点満点)
   - 画質・解像度 (5点)
   - 露出・明るさ (5点)
   - 色彩バランス (5点)
   - シャープネス (5点)
   - ノイズレベル (5点)

2. 構図・バランス (25点満点)
   - 三分割法の活用 (8点)
   - 対称性・非対称性 (5点)
   - 被写体の配置 (7点)
   - 背景とのバランス (5点)

3. 創造性・独創性 (25点満点)
   - ユニークな視点 (10点)
   - 芸術的表現 (8点)
   - ストーリー性 (7点)

4. エンゲージメント予測 (25点満点)
   - 感情的インパクト (10点)
   - 視覚的魅力 (8点)
   - 共感度予測 (7点)

${title ? `タイトル: ${title}` : ''}
${description ? `説明: ${description}` : ''}

以下のJSON形式で回答してください:
{
  "technical": {
    "quality": 数値,
    "exposure": 数値,
    "color": 数値,
    "sharpness": 数値,
    "noise": 数値,
    "total": 数値
  },
  "composition": {
    "ruleOfThirds": 数値,
    "symmetry": 数値,
    "placement": 数値,
    "background": 数値,
    "total": 数値
  },
  "creativity": {
    "uniquePerspective": 数値,
    "artisticExpression": 数値,
    "storytelling": 数値,
    "total": 数値
  },
  "engagement": {
    "emotionalImpact": 数値,
    "visualAppeal": 数値,
    "relatability": 数値,
    "total": 数値
  },
  "total": 数値,
  "comment": "詳細なフィードバック（日本語200文字程度）"
}`;
  }

  /**
   * AIレスポンスをパース
   */
  private parseScoreResponse(responseText: string): PhotoScore {
    try {
      // JSONの開始と終了を見つける
      const jsonStart = responseText.indexOf('{');
      const jsonEnd = responseText.lastIndexOf('}') + 1;
      
      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error('JSON not found in response');
      }
      
      const jsonText = responseText.slice(jsonStart, jsonEnd);
      const parsed = JSON.parse(jsonText);
      
      return {
        technical: parsed.technical.total,
        composition: parsed.composition.total,
        creativity: parsed.creativity.total,
        engagement: parsed.engagement.total,
        total: parsed.total,
        breakdown: {
          technical: parsed.technical,
          composition: parsed.composition,
          creativity: parsed.creativity,
          engagement: parsed.engagement
        },
        comment: parsed.comment
      };
      
    } catch (error) {
      console.error('Score parsing error:', error);
      return this.getDefaultScore();
    }
  }

  /**
   * デフォルトスコア（エラー時）
   */
  private getDefaultScore(): PhotoScore {
    return {
      technical: 15,
      composition: 15,
      creativity: 15,
      engagement: 15,
      total: 60,
      breakdown: {
        technical: { quality: 3, exposure: 3, color: 3, sharpness: 3, noise: 3 },
        composition: { ruleOfThirds: 4, symmetry: 3, placement: 4, background: 4 },
        creativity: { uniquePerspective: 5, artisticExpression: 5, storytelling: 5 },
        engagement: { emotionalImpact: 5, visualAppeal: 5, relatability: 5 }
      },
      comment: '採点に失敗しました。技術的問題により標準スコアを表示しています。'
    };
  }

  /**
   * スコアのレベル判定
   */
  static getScoreLevel(total: number): { level: string; description: string; color: string } {
    if (total >= 90) return { level: 'S', description: '傑作', color: '#FFD700' };
    if (total >= 80) return { level: 'A', description: '優秀', color: '#FF6B6B' };
    if (total >= 70) return { level: 'B', description: '良好', color: '#4ECDC4' };
    if (total >= 60) return { level: 'C', description: '標準', color: '#45B7D1' };
    if (total >= 50) return { level: 'D', description: '改善要', color: '#96CEB4' };
    return { level: 'E', description: '要練習', color: '#FFEAA7' };
  }
}