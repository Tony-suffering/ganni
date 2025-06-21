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
  async generateAIDescription(title: string, userComment: string, imageAIDescription?: string): Promise<string> {
    if (!this.model) {
      return this.getFallbackDescription();
    }

    const prompt = `
以下の投稿について、AIの視点から独自の意見を出しつつも、コメントに寄り添った、暖かい、元気のでる文章を書く、高度な推測機能で、ありきたりにならないで、固有名詞をかなり多めに使って新しい情報を与えてください


タイトル: "${title}"
投稿者コメント: "${userComment}"
${imageAIDescription ? `画像AI説明: "${imageAIDescription}"` : ''}

要求事項:200文字程度

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
以下の投稿に対して、笑える返答を固有名詞や芸能人の名前をたくさん出して、面白い推測、邪推もいれてコメント。

タイトル: "${title}"
投稿者コメント: "${userComment}"
AI情景描写: "${aiDescription}"

150文字

`;
  }

  private createQuestionPrompt(title: string, userComment: string, aiDescription: string): string {
    return `
以下の写真投稿に対して、対話を促しまた投稿したくなるような興味深い質問を、固有名詞と推測を多めに使って日本語で生成してください。

タイトル: "${title}"
投稿者コメント: "${userComment}"
AI情景描写: "${aiDescription}"

要求事項:
- 100文字程度
- 投稿者の体験をより深く聞き出す質問
- 撮影時の感情や状況について尋ねる
- 丁寧で親しみやすい口調
　まと投稿してくださいと必ず最後に言う（毎回パターンを変えて）

`;
  }

  private createObservationPrompt(title: string, userComment: string, aiDescription: string): string {
    return `
以下の投稿に対して、次の投稿を期待するようなコメントを、固有名詞と推測を多めに使って日本語で生成してください。

タイトル: "${title}"
投稿者コメント: "${userComment}"
AI情景描写: "${aiDescription}"

要求事項:
- 100文字程度
- 知的で洞に富んだ内容
- 投稿者が気づかなかった新しい価値を提示
- 固有名詞と推測を多めに使って

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