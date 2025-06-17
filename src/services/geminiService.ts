import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIComment } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn('Gemini API key not found. AI features will use mock data.');
}

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor() {
    if (API_KEY) {
      this.genAI = new GoogleGenerativeAI(API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    }
  }

  /**
   * 投稿内容を分析してAI情景描写を生成
   */
  async generateAIDescription(title: string, userComment: string): Promise<string> {
    if (!this.model) {
      return this.getFallbackDescription();
    }

    const prompt = `
以下の投稿について、とにかく褒めまくる、AIの視点から独自の意見を出しつつも、コメントに寄り添った、暖かい、元気のでる文章を書いてください
関西弁で書いてください

タイトル: "${title}"
投稿者コメント: "${userComment}"

要求事項:
- 150文字程度
- とにかく褒めまくる、AIの視点から独自の意見を出しつつも、コメントに寄り添った、暖かい、元気のでる文章を書いてください

例: 


`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('AI Description generation failed:', error);
      return this.getFallbackDescription();
    }
  }

  /**
   * 投稿に対するAIコメント群を生成
   */
  async generateAIComments(title: string, userComment: string, aiDescription: string): Promise<AIComment[]> {
    if (!this.model) {
      return this.getFallbackComments();
    }

    const commentPrompt = this.createCommentPrompt(title, userComment, aiDescription);
    const questionPrompt = this.createQuestionPrompt(title, userComment, aiDescription);
    const observationPrompt = this.createObservationPrompt(title, userComment, aiDescription);

    try {
      const [commentResult, questionResult, observationResult] = await Promise.all([
        this.model.generateContent(commentPrompt),
        this.model.generateContent(questionPrompt),
        this.model.generateContent(observationPrompt)
      ]);

      const commentResponse = await commentResult.response;
      const questionResponse = await questionResult.response;
      const observationResponse = await observationResult.response;

      return [
        {
          id: Date.now().toString(),
          type: 'comment',
          content: commentResponse.text().trim(),
          createdAt: new Date().toISOString()
        },
        {
          id: (Date.now() + 1).toString(),
          type: 'question',
          content: questionResponse.text().trim(),
          createdAt: new Date(Date.now() + 60000).toISOString()
        },
        {
          id: (Date.now() + 2).toString(),
          type: 'observation',
          content: observationResponse.text().trim(),
          createdAt: new Date(Date.now() + 120000).toISOString()
        }
      ];
    } catch (error) {
      console.error('AI Comments generation failed:', error);
      return this.getFallbackComments();
    }
  }

  private createCommentPrompt(title: string, userComment: string, aiDescription: string): string {
    return `
以下の投稿に対して、笑える返答をしてください。

タイトル: "${title}"
投稿者コメント: "${userComment}"
AI情景描写: "${aiDescription}"

要求事項:
- 50文字程度
- 投稿者の感性や視点を称賛
- 投稿者の体験に共感を示す

例: お前おもろいやつやけどセンスはあるな！
`;
  }

  private createQuestionPrompt(title: string, userComment: string, aiDescription: string): string {
    return `
以下の空港写真投稿に対して、対話を促す興味深い質問を日本語で生成してください。

タイトル: "${title}"
投稿者コメント: "${userComment}"
AI情景描写: "${aiDescription}"

要求事項:
- 50文字程度
- 投稿者の体験をより深く聞き出す質問
- 撮影時の感情や状況について尋ねる
- 丁寧で親しみやすい口調
- 投稿者が答えたくなるような質問

例: この写真を撮影された時、周りにはどのような音や匂い、空気感がありましたか？五感で感じた空港の雰囲気についても詳しく聞かせてください。
`;
  }

  private createObservationPrompt(title: string, userComment: string, aiDescription: string): string {
    return `
以下の空港写真投稿に対して、新しい視点や気づきを提供する観察コメントを日本語で生成してください。

タイトル: "${title}"
投稿者コメント: "${userComment}"
AI情景描写: "${aiDescription}"

要求事項:
- 50文字程度

- 知的で洞察に富んだ内容
- 投稿者が気づかなかった新しい価値を提示

例: この写真には現代の旅行文化の本質が凝縮されていますね。グローバル化が進む中で、空港が果たす役割の重要性を視覚的に表現した作品だと感じます。
`;
  }

  private getFallbackDescription(): string {
    const descriptions = [
      "朝の光が建物全体を包み込んで、まるで光の聖堂のような神秘的な空間が広がります。旅立ちの高揚感と建築の美しさが重なる特別な瞬間です。",
      "空港の幾何学的な美しさと、そこを行き交う人々の有機的な動きが織りなす現代のアートです。機能美と人間性が調和した空間の詩的表現です。",
      "夕日に染まった雲海と機体のシルエットが、旅への憧れと冒険心を呼び覚まします。空の舞台で繰り広げられる、壮大な物語の一場面です。",
      "静寂の中に漂う期待感と緊張感が、空港という特別な場所の魅力を物語ります。時間が止まったような美しい瞬間の切り取りです。"
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  private getFallbackComments(): AIComment[] {
    return [
      {
        id: Date.now().toString(),
        type: 'comment',
        content: 'この写真から感じる光と影のコントラストが、まさに旅の始まりと終わりを象徴しているように思えます。空港という場所が持つ独特の時間の流れを見事に捉えていますね。',
        createdAt: new Date().toISOString()
      },
      {
        id: (Date.now() + 1).toString(),
        type: 'question',
        content: 'この瞬間を撮影された時、周りにはどのような音が聞こえていましたか？空港特有の音の風景も、この写真の物語の一部のような気がします。',
        createdAt: new Date(Date.now() + 60000).toISOString()
      },
      {
        id: (Date.now() + 2).toString(),
        type: 'observation',
        content: '建築の幾何学的な美しさと、そこを行き交う人々の有機的な動きの対比が印象的です。現代の空港デザインが目指す「機能美」の本質を表現した一枚だと感じます。',
        createdAt: new Date(Date.now() + 120000).toISOString()
      }
    ];
  }

  /**
   * API接続状態をチェック
   */
  isApiAvailable(): boolean {
    return !!API_KEY && !!this.model;
  }

  /**
   * API使用状況を取得
   */
  getApiStatus(): { available: boolean; provider: string } {
    return {
      available: this.isApiAvailable(),
      provider: this.isApiAvailable() ? 'Gemini AI' : 'Mock Data'
    };
  }
}

export const geminiService = new GeminiService();

export async function analyzeImageAndComment(imageUrl: string) {
  const res = await fetch('/functions/v1/analyzeImage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl }),
  });
  if (!res.ok) throw new Error('画像認識に失敗しました');
  return await res.json(); // { labels, comment }
}