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
  imageAnalysis?: {    // 詳細画像分析データ（深層心理分析用）
    mainColors: string[];
    colorTemperature: string;
    compositionType: string;
    mainSubject: string;
    specificContent: string;  // 具体的な内容物、固有名詞
    backgroundElements: string[];
    lightingQuality: string;
    moodAtmosphere: string;
    shootingAngle: string;
    depthPerception: string;
    visualImpactDescription: string;
    emotionalTrigger: string;
    technicalSignature: string;
  };
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
      console.log('📸 Starting photo scoring for:', imageUrl?.substring(0, 100));
      console.log('🔑 API Key available:', !!import.meta.env.VITE_GEMINI_API_KEY);
      
      // APIキーがない場合は即座にデフォルトスコアを返す
      if (!import.meta.env.VITE_GEMINI_API_KEY) {
        console.warn('⚠️ Gemini API key not available, returning default score');
        const defaultScore = this.getDefaultScore();
        defaultScore.comment = 'API設定が必要です。基本スコアを表示しています。';
        return defaultScore;
      }
      
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      console.log('🤖 Gemini model created');
      
      // Base64データURLの場合はそのまま使用
      if (imageUrl.startsWith('data:')) {
        console.log('📄 Using base64 data URL directly');
        const [header, base64] = imageUrl.split(',');
        
        if (!base64 || base64.length === 0) {
          throw new Error('Base64データが無効です');
        }
        
        const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
        console.log('📄 Detected MIME type:', mimeType);
        
        // サポートされている画像形式かチェック
        const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        if (!supportedTypes.includes(mimeType)) {
          throw new Error(`サポートされていない画像形式: ${mimeType}. JPEG, PNG, WebP, GIFのみサポートしています。`);
        }
        
        // Base64データの妥当性をチェック
        try {
          // Base64文字列が有効かテスト
          const binaryString = atob(base64);
          if (binaryString.length === 0) {
            throw new Error('Base64データが空です');
          }
        } catch (e) {
          throw new Error('無効なBase64データです');
        }
        
        // Base64データサイズチェック
        const sizeInBytes = (base64.length * 3) / 4;
        console.log('📦 Image size:', sizeInBytes, 'bytes');
        
        if (sizeInBytes > 4 * 1024 * 1024) {
          throw new Error(`画像サイズが大きすぎます: ${Math.round(sizeInBytes / 1024 / 1024)}MB (最大4MB)`);
        }
        
        // 小さすぎる画像もチェック
        if (sizeInBytes < 100) {
          throw new Error('画像データが小さすぎます。有効な画像ファイルを選択してください。');
        }
        
        const prompt = this.createScoringPrompt(title, description);
        console.log('💭 Sending to Gemini with image size:', sizeInBytes, 'bytes, type:', mimeType);
        
        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: base64,
              mimeType: mimeType
            }
          }
        ]);
        
        if (!result || !result.response) {
          throw new Error('Gemini APIからの応答が無効です');
        }
        
        const responseText = result.response.text();
        console.log('✅ Gemini response received (full):', responseText);
        console.log('📸 画像分析指示送信済み - タイトル:', title, 'サイズ:', sizeInBytes, 'bytes');
        
        const score = this.parseScoreResponse(responseText);
        console.log('🏆 Final score:', score.total);
        
        return score;
      }
      
      // URLの場合は従来通りfetch
      console.log('🔄 Fetching image from URL:', imageUrl);
      
      // Supabase StorageのURLかチェック
      const isSupabaseUrl = imageUrl.includes('supabase.co/storage/');
      console.log('🗄️ Is Supabase URL:', isSupabaseUrl);
      
      let response: Response;
      try {
        // 最初は直接fetch（Supabase URLの場合はCORSが有効）
        response = await fetch(imageUrl, {
          mode: 'cors',
          headers: {
            'Accept': 'image/*'
          }
        });
        console.log('✅ Direct fetch successful:', response.status);
      } catch (corsError) {
        console.log('🚫 CORS error:', corsError);
        console.log('🔄 Trying alternative proxy...');
        // 複数のプロキシを試行
        const proxies = [
          `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`,
          `https://corsproxy.io/?${encodeURIComponent(imageUrl)}`,
          `https://cors-anywhere.herokuapp.com/${imageUrl}`
        ];
        
        let proxyError = null;
        for (const proxyUrl of proxies) {
          try {
            response = await fetch(proxyUrl);
            if (response.ok) break;
          } catch (e) {
            proxyError = e;
            continue;
          }
        }
        
        if (!response! || !response.ok) {
          throw new Error('すべてのプロキシ経由でも画像の取得に失敗しました。画像のURLを確認してください。');
        }
      }
      
      if (!response.ok) {
        throw new Error(`画像の取得に失敗しました: ${response.status} ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      console.log('📄 Image content type:', contentType);
      
      const arrayBuffer = await response.arrayBuffer();
      console.log('📦 Image size:', arrayBuffer.byteLength, 'bytes');
      
      // 画像サイズが大きすぎる場合は制限
      if (arrayBuffer.byteLength > 4 * 1024 * 1024) { // 4MB制限
        throw new Error(`画像サイズが大きすぎます: ${Math.round(arrayBuffer.byteLength / 1024 / 1024)}MB (最大4MB)`);
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
      
      if (!result || !result.response) {
        throw new Error('Gemini APIからの応答が無効です');
      }
      
      const responseText = result.response.text();
      console.log('✅ Gemini response received:', responseText.slice(0, 200) + '...');
      
      const score = this.parseScoreResponse(responseText);
      console.log('🏆 Final score:', score.total);
      
      return score;
      
    } catch (error) {
      console.error('❌ Photo scoring error:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      let errorMessage = '採点に失敗しました。';
      
      if (error instanceof Error) {
        const message = error.message;
        console.error('Error details:', {
          message,
          imageUrl: imageUrl.slice(0, 100) + '...',
          title,
          description
        });
        
        // Gemini API特有のエラーを詳細に処理
        if (message.includes('Provided image is not valid')) {
          errorMessage = '画像形式が無効です。JPEG、PNG、WebP形式の画像を使用してください。';
        } else if (message.includes('400')) {
          errorMessage = 'リクエストが無効です。画像のサイズや形式を確認してください。';
        } else if (message.includes('403')) {
          errorMessage = 'API キーが無効です。管理者にお問い合わせください。';
        } else if (message.includes('429')) {
          errorMessage = 'API の利用制限に達しました。しばらく時間をおいて再試行してください。';
        } else if (message.includes('500')) {
          errorMessage = 'Gemini APIサーバーエラーです。しばらく時間をおいて再試行してください。';
        } else if (message.includes('ネットワーク') || message.includes('fetch')) {
          errorMessage = 'ネットワーク接続エラーです。インターネット接続を確認してください。';
        } else {
          errorMessage = `採点エラー: ${message}`;
        }
      } else {
        errorMessage = '不明なエラーが発生しました。';
      }
      
      // エラーメッセージを含むスコアを返す
      const errorScore = this.getDefaultScore();
      errorScore.comment = errorMessage;
      return errorScore;
    }
  }

  /**
   * AIプロンプトを作成
   */
  private createScoringPrompt(title?: string, description?: string): string {
    return `この写真を100点満点で詳細に採点し、深層心理分析用の詳細な画像データも提供してください。

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

**重要指示：** 画像を詳細に観察し、以下を具体的に分析してください：
- 写っている具体的な物、人、場所、建物、料理、商品、ブランド名、店名など（固有名詞を含む）
- 読み取れる文字、看板、ラベル、商品名などのテキスト情報
- 色彩、構図、被写体、雰囲気、光の質、技術的特徴
- 写真から読み取れる状況、シーン、ストーリー、感情

以下の分析データも含めてください：

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
  "comment": "詳細なフィードバック（日本語200文字程度）",
  "imageAnalysis": {
    "mainColors": ["主要色彩1", "主要色彩2", "主要色彩3"],
    "colorTemperature": "色温度の印象（例：温かみのある、クールな、ニュートラル）",
    "compositionType": "構図タイプ（例：三分割法、中央配置、対角線構図）",
    "mainSubject": "主被写体の詳細説明（具体的な物、人、場所、固有名詞を含む）",
    "specificContent": "写真に写っている具体的な内容物、文字、ブランド名、店名、地名など",
    "backgroundElements": ["背景要素1", "背景要素2"],
    "lightingQuality": "光の質（例：自然光、間接光、ドラマチック）",
    "moodAtmosphere": "写真の雰囲気（例：穏やか、エネルギッシュ、ノスタルジック）",
    "shootingAngle": "撮影角度（例：水平、仰角、俯瞰）",
    "depthPerception": "奥行き感（例：強い奥行き、平面的、層構造）",
    "visualImpactDescription": "視覚的インパクトの説明",
    "emotionalTrigger": "感情的トリガー（例：懐かしさ、興奮、安らぎ）",
    "technicalSignature": "技術的特徴（例：ボケ味、長時間露光、粒状感）"
  }
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
      
      const result: PhotoScore = {
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
        comment: parsed.comment,
        imageAnalysis: parsed.imageAnalysis
      };

      // 画像分析データが含まれている場合は追加
      if (parsed.imageAnalysis) {
        console.log('🔍 画像分析データが見つかりました:', parsed.imageAnalysis);
        result.imageAnalysis = {
          mainColors: parsed.imageAnalysis.mainColors || [],
          colorTemperature: parsed.imageAnalysis.colorTemperature || '',
          compositionType: parsed.imageAnalysis.compositionType || '',
          mainSubject: parsed.imageAnalysis.mainSubject || '',
          specificContent: parsed.imageAnalysis.specificContent || '',
          backgroundElements: parsed.imageAnalysis.backgroundElements || [],
          lightingQuality: parsed.imageAnalysis.lightingQuality || '',
          moodAtmosphere: parsed.imageAnalysis.moodAtmosphere || '',
          shootingAngle: parsed.imageAnalysis.shootingAngle || '',
          depthPerception: parsed.imageAnalysis.depthPerception || '',
          visualImpactDescription: parsed.imageAnalysis.visualImpactDescription || '',
          emotionalTrigger: parsed.imageAnalysis.emotionalTrigger || '',
          technicalSignature: parsed.imageAnalysis.technicalSignature || ''
        };
        console.log('✅ 保存する画像分析データ:', result.imageAnalysis);
      } else {
        console.log('❌ 画像分析データが見つかりませんでした');
      }

      return result;
      
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

// インスタンスをエクスポート
export const photoScoringService = new PhotoScoringService();