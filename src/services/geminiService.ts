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
この投稿に対して、モダンでおしゃれな視点からコメント。今風の表現とセンスのいい観察を。

タイトル: ${title}
投稿者コメント: ${userComment}
${imageAIDescription ? `画像分析: ${imageAIDescription}` : ''}

スタイル要件:
• 150文字以内で簡潔に
• 今風でおしゃれな表現
• 具体的で印象的な言葉選び
• 温かみとセンスのある視点
• 過度な固有名詞は避ける

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
   * 共通のGemini API呼び出しメソッド（統合サービス用）
   */
  async callGeminiAPI(prompt: string): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini API is not available');
    }

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Gemini API call failed:', error);
      throw error;
    }
  }

  /**
   * テキスト生成用のシンプルなメソッド
   */
  async generateText(prompt: string): Promise<string> {
    if (!this.model) {
      console.warn('Gemini API not available, using fallback response');
      return 'API接続エラーのため、デフォルトの応答を使用しています。';
    }
    
    try {
      return await this.callGeminiAPI(prompt);
    } catch (error) {
      console.error('Gemini generateText failed:', error);
      return 'AI分析の生成に失敗しました。しばらく時間をおいて再試行してください。';
    }
  }

  /**
   * 投稿に対する魅力的なAIコメントを1つ生成
   */
  async generateAIComments(title: string, userComment: string, aiDescription: string, contextualInfo?: string): Promise<AIComment[]> {
    if (!this.model) {
      return this.getFallbackComments();
    }

    const inspiringPrompt = this.createInspiringCommentPrompt(title, userComment, aiDescription, contextualInfo);

    try {
      const result = await this.model.generateContent(inspiringPrompt);
      const response = await result.response;

      return [
        {
          id: Date.now().toString(),
          type: 'ai_comment',
          content: response.text().trim(),
          createdAt: new Date().toISOString()
        }
      ];
    } catch (error) {
      console.error('AI Comments generation failed:', error);
      return this.getFallbackComments();
    }
  }

  private createInspiringCommentPrompt(title: string, userComment: string, aiDescription: string, contextualInfo?: string): string {
    return `
あなたは人気のフォトグラファーのAIアシスタントです。この素敵な投稿に、投稿者が喜び、「またこのアプリを使いたい」と思えるような魅力的なコメントを書いてください。

タイトル: ${title}
投稿者コメント: ${userComment}
分析結果: ${aiDescription}
${contextualInfo ? `追加コンテキスト: ${contextualInfo}` : ''}

コメントのガイドライン:
• 120文字以内で印象的に
• 投稿者の感性を褒める
• 写真の技術的・芸術的価値を発見
• 温かく、でもプロフェッショナルな視点
• 「また撮りたい」気持ちを引き出す
• センスが光る今風の表現
• 親しみやすい文体で

投稿者が思わず嬉しくなって、友達にも見せたくなるようなコメントをお願いします。
`;
  }

  private getFallbackDescription(): string {
    const descriptions = [
      "この瞬間、光とスペースが絶妙にマッチング 朝の空気感がエモい",
      "建築とヒトの動きがクロスオーバー 現代アートみたいな構図",
      "空の表情がドラマチック 旅心をくすぐるシチュエーション",
      "静けさの中の緊張感、めちゃくちゃ印象的 時が止まった感じ"
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  private getFallbackComments(): AIComment[] {
    const inspiringComments = [
      '素晴らしい瞬間をキャッチしましたね！光の使い方がプロレベルで、見る人の心を惹きつける一枚です',
      'この構図、本当にセンスが光ってる！何気ない日常を芸術作品に変える、あなたの視点が素敵です',
      '写真から感情が伝わってくる... 技術的な完成度と芸術性のバランスが絶妙で、思わず見入ってしまいます',
      '空気感の表現が見事！この瞬間を切り取るタイミングとセンス、フォトグラファーとしての才能を感じます'
    ];
    
    return [
      {
        id: Date.now().toString(),
        type: 'ai_comment',
        content: inspiringComments[Math.floor(Math.random() * inspiringComments.length)],
        createdAt: new Date().toISOString()
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