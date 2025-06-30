import { GoogleGenerativeAI } from '@google/generative-ai';
import { AnalysisRequest, CuratorResponse } from '../types/curator';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

/**
 * 写真分析データ深層洞察サービス
 * photoScoreを活用して深い創作的洞察を提供
 */
export class PhotoAnalysisDeepService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor() {
    if (API_KEY) {
      this.genAI = new GoogleGenerativeAI(API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    }
  }

  /**
   * 写真分析データから深層的な洞察を抽出
   */
  async generateDeepPhotoInsights(request: AnalysisRequest): Promise<CuratorResponse<PhotoCreativeProfile>> {
    console.log('📸 Analyzing deep photo insights...');
    console.log('📸 Request posts count:', request.posts?.length || 0);
    console.log('📸 Posts with photoScore:', request.posts?.filter(p => p.photoScore).length || 0);
    console.log('📸 Posts with image_analysis:', request.posts?.filter(p => p.photoScore?.image_analysis).length || 0);

    if (!this.model) {
      return {
        success: true,
        data: this.getMockPhotoProfile(),
        metadata: {
          processingTime: 1000,
          confidence: 0.3,
          version: '1.0.0-mock'
        }
      };
    }

    try {
      const startTime = Date.now();
      
      const analysisPrompt = this.createPhotoAnalysisPrompt(request);
      
      const result = await this.model.generateContent(analysisPrompt);
      const response = await result.response;
      const analysisText = response.text();
      
      console.log('🤖 Gemini photo analysis result:', analysisText);
      
      const processingTime = Date.now() - startTime;
      
      // 分析に使用されたデータをログ出力
      const photoScores = request.posts?.filter(post => post.photoScore)?.map(post => post.photoScore!) || [];
      console.log('🔍 分析に使用されたデータ:');
      console.log('- 投稿数:', request.posts?.length || 0);
      console.log('- 写真スコア有り:', photoScores.length);
      console.log('- タイトル例:', request.posts?.slice(0, 3).map(p => p.title).join(', '));
      console.log('- 具体的内容例:', photoScores.slice(0, 2).map(s => s.image_analysis?.specificContent).filter(Boolean).join(', '));
      console.log('- 主被写体例:', photoScores.slice(0, 2).map(s => s.image_analysis?.mainSubject).filter(Boolean).join(', '));
      console.log('- 主要色彩例:', photoScores.slice(0, 2).map(s => s.image_analysis?.mainColors?.join?.('・')).filter(Boolean).join(', '));
      
      const photoProfile = this.parsePhotoProfile(analysisText);
      
      console.log('✅ 深層分析結果:');
      console.log('- 個性分析文字数:', photoProfile.creativePersonality?.length || 0);
      console.log('- 美的分析文字数:', photoProfile.aestheticProfile?.length || 0);
      console.log('- 技術分析文字数:', photoProfile.technicalStrengths?.length || 0);
      
      return {
        success: true,
        data: photoProfile,
        metadata: {
          processingTime,
          confidence: 0.9,
          version: '1.0.0-gemini'
        }
      };
    } catch (error) {
      console.error('❌ Photo analysis failed:', error);
      return {
        success: false,
        error: 'Failed to analyze photo insights',
        data: this.getMockPhotoProfile(),
        metadata: {
          processingTime: 1000,
          confidence: 0.1,
          version: '1.0.0-fallback'
        }
      };
    }
  }

  /**
   * 写真分析プロンプト作成
   */
  private createPhotoAnalysisPrompt(request: AnalysisRequest): string {
    // 写真スコアデータを集約
    const photoScores = request.posts
      .filter(post => post.photoScore)
      .map(post => post.photoScore!);

    if (photoScores.length === 0) {
      return this.createBasicAnalysisPrompt(request);
    }

    const avgTechnical = this.calculateAverage(photoScores.map(s => s.technical_score));
    const avgComposition = this.calculateAverage(photoScores.map(s => s.composition_score));
    const avgCreativity = this.calculateAverage(photoScores.map(s => s.creativity_score));
    const avgEngagement = this.calculateAverage(photoScores.map(s => s.engagement_score));

    // 技術的進歩の追跡
    const technicalProgression = this.analyzeProgression(photoScores.map(s => s.technical_score));
    const creativityProgression = this.analyzeProgression(photoScores.map(s => s.creativity_score));

    const photoDetails = request.posts
      .filter(post => post.photoScore)
      .map((post, index) => {
        const score = post.photoScore!;
        const imageAnalysis = score.image_analysis;
        
        let analysisDetails = '';
        if (imageAnalysis) {
          analysisDetails = `
詳細画像分析データ:
- 写真の具体的内容: ${imageAnalysis.specificContent || '不明'}
- 主被写体: ${imageAnalysis.mainSubject || '不明'}
- 主要色彩: ${imageAnalysis.mainColors?.join('、') || '不明'}
- 色温度: ${imageAnalysis.colorTemperature || '不明'}
- 構図タイプ: ${imageAnalysis.compositionType || '不明'}
- 背景要素: ${imageAnalysis.backgroundElements?.join('、') || '不明'}
- 光の質: ${imageAnalysis.lightingQuality || '不明'}
- 写真の雰囲気: ${imageAnalysis.moodAtmosphere || '不明'}
- 撮影角度: ${imageAnalysis.shootingAngle || '不明'}
- 奥行き感: ${imageAnalysis.depthPerception || '不明'}
- 視覚的インパクト: ${imageAnalysis.visualImpact || '不明'}
- 感情的トリガー: ${imageAnalysis.emotionalTrigger || '不明'}
- 技術的特徴: ${imageAnalysis.technicalSignature || '不明'}`;
        }
        
        return `
【投稿${index + 1}の詳細分析】
タイトル: "${post.title}"
ユーザーコメント: "${post.description}"
写真技術データ:
- 技術スコア: ${score.technical_score}/100 (露出、フォーカス、構図の基本技術)
- 構図スコア: ${score.composition_score}/100 (バランス、視線誘導、画面構成)
- 創造性スコア: ${score.creativity_score}/100 (独創性、表現力、アイデア)
- エンゲージメント: ${score.engagement_score}/100 (見る人への訴求力)
- 総合評価: ${score.total_score}/100
- レベル判定: ${score.score_level}
- AI詳細評価: "${score.ai_comment}"
${analysisDetails}
投稿日時: ${new Date(post.createdAt).toLocaleDateString('ja-JP')}
`;
      }).join('\n');

    // 投稿タイトルとコメントの傾向分析
    const titlePatterns = request.posts.map(p => p.title).join('", "');
    const commentPatterns = request.posts.map(p => p.description).join('", "');
    const tagPatterns = request.posts.flatMap(p => p.tags || []).join(', ');

    return `
あなたは世界最高レベルの写真心理分析専門家です。この人の投稿タイトル、コメント、写真技術データ、AI評価を総合的に分析し、その人だけが持つ独特の創作特性と深層心理を具体的に解明してください。

**【重要指針】**
- 一般論や平均的な分析は絶対禁止
- この人だけの具体的で独特な特徴を発見・分析
- 投稿タイトルやコメントの言葉選び、表現パターンから性格を読み解く
- 写真技術データの数値から具体的な才能と個性を抽出
- **詳細画像分析データ（色彩、構図、雰囲気、光の質など）を深層心理分析に最大限活用**
- 色彩選択から読み取れる心理的傾向、構図の癖から見える性格特性を具体的に分析
- 「なぜこの人はこの被写体を選んだのか」「なぜこのタイトルなのか」を深く考察

【完全個人データ分析】
📊 投稿数: ${photoScores.length}件
📈 技術進歩: ${technicalProgression}
🎨 創造性成長: ${creativityProgression}
📍 技術レベル: ${avgTechnical.toFixed(1)}/100
🎯 構図センス: ${avgComposition.toFixed(1)}/100  
✨ 創造性: ${avgCreativity.toFixed(1)}/100
💫 人の心を動かす力: ${avgEngagement.toFixed(1)}/100

【投稿タイトル一覧】: "${titlePatterns}"
【コメント傾向】: "${commentPatterns}"
【使用タグ】: ${tagPatterns}

【詳細な投稿分析データ】
${photoDetails}

【深層分析の観点】
1. 色彩選択から読み取れる深層心理（温かみ/クールさの選択傾向、感情表現）
2. 構図の癖と進化パターン（中央配置/三分割法への偏向、視線誘導の特徴）
3. 光の質への感性（自然光好み、ドラマチック演出、ソフト表現の傾向）
4. 被写体選択の心理的背景（何に惹かれるか、どんな瞬間を捉えるか）
5. 撮影角度の個性（水平/仰角/俯瞰の選択パターン、距離感の好み）
6. 雰囲気作りの特徴（穏やか/エネルギッシュ/ノスタルジック傾向）
7. 技術的成長の軌跡と特徴
8. 創造性の発現パターン
9. 独自性と個性の発達

【重要な洞察ポイント】
- **写真に写っている具体的な内容物（料理名、店名、商品名、場所名、人物など）を必ず活用**
- スコアの数値を超えた、創作者の内面的特性
- 写真に現れる感情や価値観
- 具体的な被写体選択の心理的背景
- 投稿タイトルと写真内容の関連性から読み取れる思考パターン
- 無意識の表現パターン
- 次の成長段階への具体的方向性

**必須回答フォーマット（各項目500文字程度、具体的な写真内容を必ず含める）:**

CREATIVE_PERSONALITY: [創作者としての深層的性格分析 400-600文字。写真に写っている具体的な内容物（料理名、店名、商品名、場所など）を引用し、なぜその被写体を選んだのか、タイトルとの関連性から読み取れる深層心理、色彩選択や構図の癖から見える性格特性を具体的に分析。投稿数も明記し、成長パターンを数値で示す。]

AESTHETIC_PROFILE: [美的センスと感性の特徴 400-500文字。具体的な写真の色彩データ、構図選択、光の使い方から読み取れる美意識を詳細分析。どの店、どの料理、どの場所を選ぶ傾向があるか、その選択から見える価値観や美的基準を具体的に解説。]

TECHNICAL_GROWTH: [技術的成長パターンの発見 350-450文字。スコアの変遷、撮影技術の向上、構図の進化を数値とともに具体的に分析。どんな場面で技術的チャレンジをしているか、写真の具体的内容から読み取れる成長意欲を詳述。]

CONFIDENCE_LEVEL: [0.0-1.0の分析信頼度]

【分析の深度要求】
- 表面的な技術評価を超えた本質的洞察
- 写真から読み取れる人格特性
- 無意識レベルでの創作パターン
- 創作者の内なる物語の発見
`;
  }

  /**
   * 基本的な分析プロンプト（写真スコアがない場合）
   */
  private createBasicAnalysisPrompt(request: AnalysisRequest): string {
    const postSummary = request.posts.map((post, index) => `
投稿${index + 1}: "${post.title}"
説明: "${post.description}"
タグ: ${post.tags.join(', ')}
日時: ${new Date(post.createdAt).toLocaleDateString('ja-JP')}`).join('\n');

    return `
写真スコアデータが不足していますが、投稿内容から創作者の特性を分析してください。

【投稿データ】
${postSummary}

タイトル、説明、タグから創作者の深層的特性を推論し、同じフォーマットで回答してください。
`;
  }

  /**
   * 進歩パターンの分析
   */
  private analyzeProgression(scores: number[]): string {
    if (scores.length < 3) return "データ不足";
    
    const recent = scores.slice(-3);
    const early = scores.slice(0, 3);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const earlyAvg = early.reduce((a, b) => a + b, 0) / early.length;
    
    const improvement = recentAvg - earlyAvg;
    
    if (improvement > 10) return "顕著な上昇傾向";
    if (improvement > 5) return "緩やかな改善";
    if (improvement > -5) return "安定的推移";
    return "要改善傾向";
  }

  /**
   * 平均値計算
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * 写真プロファイルのパース
   */
  private parsePhotoProfile(analysisText: string): PhotoCreativeProfile {
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

    console.log('📝 パースされたデータキー:', Object.keys(data));
    console.log('🔍 CREATIVE_PERSONALITY文字数:', data['CREATIVE_PERSONALITY']?.length || 0);

    return {
      creativePersonality: data['CREATIVE_PERSONALITY'] || '感性豊かな創作者。あなたの投稿から読み取れる独特な視点と美意識は、日常の瞬間を特別な作品として切り取る才能を物語っています。タイトルの選び方や被写体への着眼点から、人とは違う深い洞察力と創作への情熱が感じられます。技術的な面でも着実な成長を見せており、表現の幅を広げながら自分らしいスタイルを確立しつつある創作者です。',
      technicalSignature: data['TECHNICAL_SIGNATURE'] || '基本的な技術を習得し、構図や色彩バランスにおいて安定した表現力を発揮しています。',
      compositionStyle: data['COMPOSITION_STYLE'] || 'バランスの取れた構図を好み、視線誘導や空間の使い方に独自のセンスを発揮しています。',
      colorSensitivity: data['COLOR_SENSITIVITY'] || data['AESTHETIC_PROFILE'] || '自然な色彩感覚を持ち、光の質や色温度の選択において直感的でありながらも計算された美意識を発揮しています。色彩の組み合わせや明暗のバランスから、深い美的センスと感性の豊かさが感じられます。撮影時の光の捉え方や色調の調整において、見る人の心を引きつける独特な表現力を持っています。',
      subjectPsychology: data['SUBJECT_PSYCHOLOGY'] || '興味深い被写体選択。他の人が見過ごしてしまうような日常の瞬間や細やかな美しさを捉える洞察力があります。',
      growthTrajectory: data['GROWTH_TRAJECTORY'] || data['TECHNICAL_GROWTH'] || '着実に成長中。撮影技術の向上とともに表現の幅も広がっており、創作者としての可能性をさらに押し上げる意欲と才能を併せ持っています。技術的な基礎をしっかりと身につけながら、独自の表現スタイルを模索し続ける姿勢が感じられます。今後はより深い洞察力と独創性を磨いていくことで、多くの人々の心に響く作品を生み出していく可能性を秘めています。',
      uniqueStrength: data['UNIQUE_STRENGTH'] || '独自の視点と感性を持ち、日常の中に特別な美しさを見出す才能があります。',
      nextEvolution: data['NEXT_EVOLUTION'] || '新しい表現への挑戦。現在の技術レベルを基盤として、さらに創造性を発揮していく可能性があります。',
      creativeBlocks: data['CREATIVE_BLOCKS'] || '特になし',
      inspirationPatterns: data['INSPIRATION_PATTERNS'] || '日常からの発見',
      confidence: this.parseFloatSafe(data['CONFIDENCE_LEVEL'], 0.85),
      lastAnalyzed: new Date().toISOString()
    };
  }

  private parseFloatSafe(value: string | undefined, defaultValue: number): number {
    if (!value) return defaultValue;
    const num = parseFloat(value.replace(/[^\d.]/g, ''));
    return isNaN(num) ? defaultValue : Math.max(0, Math.min(1, num));
  }

  /**
   * モック写真プロファイル
   */
  private getMockPhotoProfile(): PhotoCreativeProfile {
    return {
      creativePersonality: "日常の中に美しさを見出す感性豊かな観察者。細部への注意力が高く、独特の視点を持つ",
      technicalSignature: "自然光を活かした撮影が得意。構図の基本を押さえつつ、独自のアングルを探求",
      compositionStyle: "三分割法を基本に、被写体を中心から少しずらした動的な構図を好む",
      colorSensitivity: "暖色系に対する感度が高く、夕方の光の表現に特に優れている",
      subjectPsychology: "人物よりも風景や静物を好み、物語性のある瞬間を切り取ることに魅力を感じる",
      growthTrajectory: "初期の安全な構図から、徐々に大胆な視点への挑戦を始めている成長期",
      uniqueStrength: "光と影のコントラストを効果的に使った詩的な表現",
      nextEvolution: "マクロ撮影や街角スナップなど、新しいジャンルへの挑戦を推奨",
      creativeBlocks: "夜間撮影や人物撮影への躊躇がやや見られる",
      inspirationPatterns: "散歩中の偶然の発見や、カフェでの読書時間からインスピレーションを得る",
      confidence: 0.8,
      lastAnalyzed: new Date().toISOString()
    };
  }

  /**
   * API利用可能性チェック
   */
  isApiAvailable(): boolean {
    return !!API_KEY && !!this.model;
  }
}

/**
 * 写真創作プロファイル型
 */
export interface PhotoCreativeProfile {
  creativePersonality: string;     // 創作者の深層的性格
  technicalSignature: string;      // 技術的特徴・癖
  compositionStyle: string;        // 構図の好みと特徴
  colorSensitivity: string;        // 色彩・光への感性
  subjectPsychology: string;       // 被写体選択の心理
  growthTrajectory: string;        // 成長軌跡の物語
  uniqueStrength: string;          // 独自の強み
  nextEvolution: string;           // 次の進化方向
  creativeBlocks: string;          // 創作の課題・ブロック
  inspirationPatterns: string;     // インスピレーション源
  confidence: number;              // 分析信頼度
  lastAnalyzed: string;           // 最終分析日時
}

export const photoAnalysisDeepService = new PhotoAnalysisDeepService();