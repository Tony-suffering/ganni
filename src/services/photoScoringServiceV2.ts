import { GoogleGenerativeAI } from '@google/generative-ai';
import { DetailedPhotoScore, ScoreBreakdown } from '../types';

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
      console.warn('Gemini model not available, using mock data');
      return this.getMockDetailedScore();
    }

    try {
      const startTime = Date.now();
      
      // 画像を取得してBase64に変換
      const imageData = await this.fetchImageAsBase64(imageUrl);
      
      // 画像付きでGemini APIを呼び出し
      const prompt = this.createDetailedScoringPrompt(title, description);
      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageData,
            mimeType: "image/jpeg"
          }
        }
      ]);
      
      const response = await result.response;
      const processingTime = Date.now() - startTime;
      
      const analysisText = response.text();
      console.log('🤖 Gemini API Response:', analysisText);
      
      return this.parseDetailedScore(analysisText, processingTime);
    } catch (error) {
      console.error('❌ Detailed scoring failed:', error);
      console.log('📝 Falling back to mock data');
      return this.getMockDetailedScore();
    }
  }

  /**
   * 画像URLからBase64データを取得
   */
  private async fetchImageAsBase64(imageUrl: string): Promise<string> {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          // "data:image/jpeg;base64," の部分を除去
          const base64Data = base64String.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Failed to fetch image as base64:', error);
      throw error;
    }
  }

  private createDetailedScoringPrompt(title: string, description: string): string {
    return `
あなたは国際的な写真コンテストの審査員で、厳格で精密な評価基準を持つプロフェッショナルです。提供された画像を分析し、1000点満点で極めて詳細に評価してください。

**画像情報:**
- タイトル: "${title}"
- 撮影者のコメント: "${description}"

**超重要指示:**
1. 画像を5秒以上じっくり観察し、細部まで分析してください
2. 各項目で具体的な減点・加点理由を見つけてください
3. 点数は1点単位で厳密に算出してください（例：47点、53点、61点など）
4. 同じ写真でも微細な要素で点数が変動するよう、鋭敏に評価してください
5. **重要**: 画像の具体的な内容（色彩、被写体、構図要素）を詳細に観察・記録してください

**超詳細評価基準 (1000点満点):**

**1. 技術的品質 (300点満点)**

**露出・明度 (60点満点):**
- ハイライトの飛び具合 (0-15点): 白飛びの有無・程度
- シャドウの潰れ具合 (0-15点): 黒潰れの有無・階調
- 全体的な明度バランス (0-15点): 適正露出の度合い
- HDR処理の自然さ (0-15点): 不自然な処理の有無

**フォーカス・シャープネス (60点満点):**
- 主被写体のピント精度 (0-20点): ピンポイントの精度
- 被写界深度の効果的活用 (0-15点): ボケの美しさ・意図性
- 画面全体のシャープネス (0-15点): 解像感
- 手ブレ・被写体ブレ (0-10点): ブレの有無・影響度

**色彩・画質 (60点満点):**
- 色温度の適切さ (0-15点): ホワイトバランスの精度
- 彩度・コントラストバランス (0-15点): 色の鮮やかさと自然さ
- ノイズレベル (0-15点): ISO感度によるノイズの影響
- 色の階調・グラデーション (0-15点): 色の滑らかさ

**撮影技術 (60点満点):**
- シャッタースピードの選択 (0-15点): 動きの表現・手ブレ防止
- 絞り値の効果的活用 (0-15点): 被写界深度の意図性
- ISO感度の適切さ (0-15点): ノイズとのバランス
- レンズ特性の活用 (0-15点): 歪み・収差の制御

**後処理技術 (60点満点):**
- 編集の自然さ (0-20点): 過度な処理の有無
- トーンカーブの調整 (0-15点): 明暗の調整技術
- 色調補正の技術 (0-15点): 色味の調整センス
- 細部の調整技術 (0-10点): シャープネス・ノイズ処理

**2. 構図・アート性 (250点満点)**

**基本構図法 (80点満点):**
- 三分割法の活用 (0-20点): 分割線上の配置効果
- 黄金比・白銀比の活用 (0-20点): 美的比率の意識
- 対称性・非対称性 (0-20点): バランス感覚
- 視線誘導・導線 (0-20点): 視線の流れの設計

**空間構成 (70点満点):**
- 前景・中景・背景の層 (0-25点): 奥行きの表現力
- 空間の使い方 (0-20点): 余白・詰め具合の効果
- フレーミング効果 (0-15点): 自然なフレーム要素
- パースペクティブ (0-10点): 遠近感の活用

**視覚的バランス (50点満点):**
- 重量感のバランス (0-15点): 要素の配置バランス
- 色彩バランス (0-15点): 色の配分・調和
- 明暗バランス (0-10点): 光と影の配置
- 質感のバランス (0-10点): 異なる質感の調和

**独創的視点 (50点満点):**
- アングルの独創性 (0-20点): 一般的でない視点
- 切り取り方の新鮮さ (0-15点): 予想外のトリミング
- 時間軸の捉え方 (0-10点): 瞬間の選択センス
- 空間軸の捉え方 (0-5点): 距離感・位置の工夫

**3. 創造性・表現力 (250点満点)**

**光の表現 (80点満点):**
- 自然光の活用技術 (0-25点): 太陽光・空の光の使い方
- 人工光の効果的利用 (0-20点): 人工照明の技術
- 影の効果的活用 (0-20点): 影による立体感・ドラマ
- 光の方向性・質感 (0-15点): ライティングの意図性

**被写体・瞬間 (70点満点):**
- 被写体選択の独創性 (0-20点): 着眼点の独特さ
- 決定的瞬間の捕捉 (0-25点): タイミングの完璧さ
- 表情・動きの捉え方 (0-15点): 生き生きとした表現
- 被写体と環境の関係 (0-10点): 調和・対比の効果

**ストーリーテリング (60点満点):**
- 物語性の強さ (0-20点): 見る人に伝わる物語
- 感情の表現力 (0-20点): 感情の伝達力
- メッセージ性 (0-15点): 込められた意図・主張
- 想像力を掻き立てる力 (0-5点): 続きを想像させる力

**芸術的価値 (40点満点):**
- 美的センス (0-15点): 普遍的な美しさ
- 独自性・オリジナリティ (0-15点): 他にない個性
- 文化的・時代的価値 (0-5点): 社会的意義
- 技術革新性 (0-5点): 新しい表現技法

**4. エンゲージメント・魅力度 (200点満点)**

**視覚的インパクト (70点満点):**
- 第一印象の強烈さ (0-25点): 瞬間的な驚き・感動
- 目を引く要素の効果 (0-20点): 注意を惹く力
- 色彩のインパクト (0-15点): 色による視覚効果
- 構図のインパクト (0-10点): 意外性のある構図

**共感・親近感 (60点満点):**
- 親しみやすさ (0-20点): 一般的な共感のしやすさ
- 感情的共鳴 (0-20点): 心に響く度合い
- 人間性・温かみ (0-15点): 人間的な魅力
- 普遍的テーマ (0-5点): 誰にでも関わるテーマ

**SNS適性 (40点満点):**
- シェアしたくなる度 (0-15点): 拡散したい衝動
- コメントしたくなる度 (0-10点): 反応したい気持ち
- ハッシュタグ適性 (0-10点): タグ付けのしやすさ
- バイラル要素 (0-5点): 話題になる要素

**記憶定着度 (30点満点):**
- 印象に残る度合い (0-15点): 長期記憶への定着度
- ユニークな要素 (0-10点): 他にない特徴
- 思い出しやすさ (0-5点): 再認識のしやすさ

**超重要: 点数付けの厳密さ**
- 各項目で必ず1点単位で評価
- 満点は滅多に付けない（完璧は稀）
- 平均的な写真は各項目の50-70%程度
- 優秀な写真でも80-90%程度
- 例: 47/60点、23/25点、18/20点 など

**必須回答フォーマット（厳密に従ってください）:**

TOTAL_SCORE: [正確な合計点 例:687]
LEVEL: [レベル]
LEVEL_DESC: [評価説明]

TECHNICAL: [技術合計点]
EXPOSURE: [具体的な点数 例:47]
FOCUS: [具体的な点数 例:52]
COLOR: [具体的な点数 例:43]
TECHNIQUE: [具体的な点数 例:38]
PROCESSING: [具体的な点数 例:41]

COMPOSITION: [構図合計点]
BASIC: [具体的な点数 例:61]
SPATIAL: [具体的な点数 例:48]
BALANCE: [具体的な点数 例:33]
CREATIVE: [具体的な点数 例:29]

CREATIVITY: [創造性合計点]
LIGHT: [具体的な点数 例:54]
SUBJECT: [具体的な点数 例:42]
STORY: [具体的な点数 例:37]
ARTISTIC: [具体的な点数 例:23]

ENGAGEMENT: [魅力度合計点]
IMPACT: [具体的な点数 例:45]
RELATE: [具体的な点数 例:39]
SOCIAL: [具体的な点数 例:24]
MEMORY: [具体的な点数 例:17]

COMMENT: [写真の具体的で詳細な評価コメント]

**詳細画像分析データ（深層心理分析用）:**
MAIN_COLORS: [主要色彩を具体的に 例:深い青空,暖かいオレンジ,柔らかいピンク]
COLOR_TEMPERATURE: [色温度の印象 例:温かみのある,クールで涼しい,ニュートラル]
COMPOSITION_TYPE: [構図タイプ 例:三分割法,中央配置,対角線構図,シンメトリー]
MAIN_SUBJECT: [主被写体の詳細 例:笑顔の女性,雄大な山景色,静物のコーヒーカップ]
BACKGROUND_ELEMENTS: [背景要素 例:ぼかされた街並み,自然光の木漏れ日,シンプルな白壁]
LIGHTING_QUALITY: [光の質 例:自然な日光,ソフトな間接光,ドラマチックな影]
MOOD_ATMOSPHERE: [写真の雰囲気 例:穏やかで癒し系,エネルギッシュで活動的,ノスタルジックで温かい]
SHOOTING_ANGLE: [撮影角度 例:正面からの水平視点,低い位置からの仰角,俯瞰の鳥瞰図]
DEPTH_PERCEPTION: [奥行き感 例:前景・中景・背景の層,平面的,強い奥行き感]
VISUAL_IMPACT: [視覚的インパクト 例:色彩の鮮やかさ,コントラストの強さ,静寂な美しさ]
EMOTIONAL_TRIGGER: [感情的トリガー 例:懐かしさを誘う,興奮を促す,安らぎを与える]
TECHNICAL_SIGNATURE: [技術的特徴 例:絞り開放のボケ味,長時間露光の軌跡,高ISO感度の粒状感]

STRENGTHS: [具体的な強み1],[具体的な強み2],[具体的な強み3]
IMPROVEMENTS: [具体的な改善点1],[具体的な改善点2],[具体的な改善点3]
TECHNICAL_ADVICE: [技術的な具体的アドバイス1],[技術的な具体的アドバイス2]
CREATIVE_SUGGESTIONS: [創造的な具体的提案1],[創造的な具体的提案2]
CONFIDENCE: [0.8-0.95の範囲で厳密な数値]

**最終確認:** 各項目の点数を足し算して、TOTAL_SCOREと一致することを確認してください。
`;
  }

  private parseDetailedScore(analysisText: string, processingTime: number): DetailedPhotoScore {
    console.log('🔍 Parsing Gemini response...');
    
    const lines = analysisText.split('\n');
    const data: any = {};
    
    // より柔軟なパーシング
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

    console.log('📊 Parsed data:', data);

    // 超精密パース関数
    const parseScore = (value: string | undefined): number => {
      if (!value) return 0;
      
      // より厳密な数値抽出（小数点も含む）
      const cleanValue = value.toString().replace(/[^\d.]/g, '');
      const numMatch = cleanValue.match(/(\d+\.?\d*)/);
      
      if (numMatch) {
        const num = parseFloat(numMatch[1]);
        return Math.round(num); // 整数に丸める
      }
      return 0;
    };
    
    const parseList = (value: string | undefined): string[] => {
      if (!value) return [];
      return value.split(',').map(s => s.trim()).filter(s => s && s.length > 0);
    };
    
    const parseLevel = (value: string | undefined): any => {
      if (!value) return 'C';
      const validLevels = ['S+', 'S', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'E'];
      const cleanValue = value.replace(/[^\w+]/g, '').toUpperCase();
      return validLevels.includes(cleanValue) ? cleanValue : 'C';
    };
    
    try {
      // 個別スコアの詳細計算と検証
      const exposureScore = parseScore(data['EXPOSURE']);
      const focusScore = parseScore(data['FOCUS']);
      const colorScore = parseScore(data['COLOR']);
      const techniqueScore = parseScore(data['TECHNIQUE']);
      const processingScore = parseScore(data['PROCESSING']);
      const technicalTotal = exposureScore + focusScore + colorScore + techniqueScore + processingScore;
      
      const basicScore = parseScore(data['BASIC']);
      const spatialScore = parseScore(data['SPATIAL']);
      const balanceScore = parseScore(data['BALANCE']);
      const creativeScore = parseScore(data['CREATIVE']);
      const compositionTotal = basicScore + spatialScore + balanceScore + creativeScore;
      
      const lightScore = parseScore(data['LIGHT']);
      const subjectScore = parseScore(data['SUBJECT']);
      const storyScore = parseScore(data['STORY']);
      const artisticScore = parseScore(data['ARTISTIC']);
      const creativityTotal = lightScore + subjectScore + storyScore + artisticScore;
      
      const impactScore = parseScore(data['IMPACT']);
      const relateScore = parseScore(data['RELATE']);
      const socialScore = parseScore(data['SOCIAL']);
      const memoryScore = parseScore(data['MEMORY']);
      const engagementTotal = impactScore + relateScore + socialScore + memoryScore;

      const calculatedTotal = technicalTotal + compositionTotal + creativityTotal + engagementTotal;
      const declaredTotal = parseScore(data['TOTAL_SCORE']);
      
      // 超詳細ログ出力
      console.log('🔢 Detailed scoring breakdown:', {
        technical: { exposure: exposureScore, focus: focusScore, color: colorScore, technique: techniqueScore, processing: processingScore, total: technicalTotal },
        composition: { basic: basicScore, spatial: spatialScore, balance: balanceScore, creative: creativeScore, total: compositionTotal },
        creativity: { light: lightScore, subject: subjectScore, story: storyScore, artistic: artisticScore, total: creativityTotal },
        engagement: { impact: impactScore, relate: relateScore, social: socialScore, memory: memoryScore, total: engagementTotal },
        calculated: calculatedTotal,
        declared: declaredTotal
      });
      
      // より厳密な合計検証（5点以内の誤差なら宣言値を採用）
      const finalTotal = Math.abs(calculatedTotal - declaredTotal) <= 5 ? declaredTotal : calculatedTotal;
      
      const result: DetailedPhotoScore = {
        totalScore: finalTotal,
        scoreLevel: parseLevel(data['LEVEL']),
        levelDescription: data['LEVEL_DESC'] || 'AI分析による評価',
        
        technical: {
          total: technicalTotal,
          exposure: parseScore(data['EXPOSURE']),
          focus: parseScore(data['FOCUS']),
          colorQuality: parseScore(data['COLOR']),
          shootingTechnique: parseScore(data['TECHNIQUE']),
          postProcessing: parseScore(data['PROCESSING'])
        },
        
        composition: {
          total: compositionTotal,
          basicComposition: parseScore(data['BASIC']),
          spatialComposition: parseScore(data['SPATIAL']),
          visualBalance: parseScore(data['BALANCE']),
          creativeViewpoint: parseScore(data['CREATIVE'])
        },
        
        creativity: {
          total: creativityTotal,
          lightExpression: parseScore(data['LIGHT']),
          subjectMoment: parseScore(data['SUBJECT']),
          storytelling: parseScore(data['STORY']),
          artisticValue: parseScore(data['ARTISTIC'])
        },
        
        engagement: {
          total: engagementTotal,
          visualImpact: parseScore(data['IMPACT']),
          relatability: parseScore(data['RELATE']),
          socialMedia: parseScore(data['SOCIAL']),
          memorability: parseScore(data['MEMORY'])
        },
        
        overallComment: data['COMMENT'] || 'Gemini AIによる詳細分析が完了しました。',
        detailedFeedback: {
          strengths: parseList(data['STRENGTHS']),
          improvements: parseList(data['IMPROVEMENTS']),
          technicalAdvice: parseList(data['TECHNICAL_ADVICE']),
          creativeSuggestions: parseList(data['CREATIVE_SUGGESTIONS'])
        },
        
        analysisVersion: '2.0.0-gemini',
        processingTime,
        confidence: Math.max(0.1, Math.min(1.0, parseFloat(data['CONFIDENCE']?.toString()) || 0.85))
      };
      
      console.log('✅ Successfully parsed Gemini response:', {
        totalScore: result.totalScore,
        level: result.scoreLevel,
        technical: result.technical.total,
        composition: result.composition.total,
        creativity: result.creativity.total,
        engagement: result.engagement.total
      });
      
      return result;
    } catch (error) {
      console.error('❌ Score parsing failed:', error);
      console.log('📝 Available data keys:', Object.keys(data));
      return this.getMockDetailedScore();
    }
  }

  private getMockDetailedScore(): DetailedPhotoScore {
    // より変動的なモックデータを生成
    const randomVariation = () => Math.floor(Math.random() * 20) - 10; // -10 to +10 の変動
    
    const baseTechnical = {
      exposure: 50 + randomVariation(),
      focus: 48 + randomVariation(),
      colorQuality: 45 + randomVariation(),
      shootingTechnique: 42 + randomVariation(),
      postProcessing: 38 + randomVariation()
    };
    
    const baseComposition = {
      basicComposition: 65 + randomVariation(),
      spatialComposition: 55 + randomVariation(),
      visualBalance: 40 + randomVariation(),
      creativeViewpoint: 35 + randomVariation()
    };
    
    const baseCreativity = {
      lightExpression: 60 + randomVariation(),
      subjectMoment: 55 + randomVariation(),
      storytelling: 45 + randomVariation(),
      artisticValue: 30 + randomVariation()
    };
    
    const baseEngagement = {
      visualImpact: 55 + randomVariation(),
      relatability: 48 + randomVariation(),
      socialMedia: 32 + randomVariation(),
      memorability: 25 + randomVariation()
    };
    
    const technicalTotal = Object.values(baseTechnical).reduce((a, b) => a + b, 0);
    const compositionTotal = Object.values(baseComposition).reduce((a, b) => a + b, 0);
    const creativityTotal = Object.values(baseCreativity).reduce((a, b) => a + b, 0);
    const engagementTotal = Object.values(baseEngagement).reduce((a, b) => a + b, 0);
    const totalScore = technicalTotal + compositionTotal + creativityTotal + engagementTotal;
    
    const mockComments = [
      'モックデータによる仮の評価です。実際の画像分析ではより詳細な評価が行われます。',
      'Gemini APIが利用できない場合のサンプル結果です。技術的な要素を重視した評価となっています。',
      'これはテスト用のデータです。実際の分析では写真の内容に基づいた具体的な評価が提供されます。'
    ];
    
    return {
      totalScore,
      scoreLevel: totalScore >= 800 ? 'A' : totalScore >= 700 ? 'B+' : totalScore >= 600 ? 'B' : 'C+',
      levelDescription: 'モックデータによる評価',
      
      technical: {
        total: technicalTotal,
        ...baseTechnical
      },
      
      composition: {
        total: compositionTotal,
        ...baseComposition
      },
      
      creativity: {
        total: creativityTotal,
        ...baseCreativity
      },
      
      engagement: {
        total: engagementTotal,
        ...baseEngagement
      },
      
      overallComment: mockComments[Math.floor(Math.random() * mockComments.length)],
      detailedFeedback: {
        strengths: [
          'モックデータによる強み評価1',
          'モックデータによる強み評価2',
          'モックデータによる強み評価3'
        ],
        improvements: [
          'モックデータによる改善提案1',
          'モックデータによる改善提案2'
        ],
        technicalAdvice: [
          'モックデータによる技術アドバイス1',
          'モックデータによる技術アドバイス2'
        ],
        creativeSuggestions: [
          'モックデータによる創造的提案1',
          'モックデータによる創造的提案2'
        ]
      },
      
      analysisVersion: '2.0.0-mock',
      processingTime: 800 + Math.floor(Math.random() * 1000), // 800-1800ms
      confidence: 0.1 + Math.random() * 0.2 // 0.1-0.3 (低い信頼度でモックと分かるように)
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