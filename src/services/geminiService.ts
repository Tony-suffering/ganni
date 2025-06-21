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

📸 ${title}
💭 ${userComment}
${imageAIDescription ? `🔍 ${imageAIDescription}` : ''}

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
この瞬間にウィットの効いたコメントを。センス良く、軽やかに。

📸 ${title}
💭 ${userComment}
🎯 ${aiDescription}

求める雰囲気:
• 100文字以内でスマート
• さりげないユーモア
• 共感できる視点
• 今風の軽やかな表現
• 親しみやすい口調

`;
  }

  private createQuestionPrompt(title: string, userComment: string, aiDescription: string): string {
    return `
この投稿にもっと詳しく聞いてみたい質問を、自然に会話が続くように。

📸 ${title}
💭 ${userComment}
✨ ${aiDescription}

質問のポイント:
• 80文字以内で簡潔に
• 撮影の瞬間や体験について
• 続きが気になる質問
• カジュアルで親しみやすく
• 最後に「また聞かせて！」的な一言

`;
  }

  private createObservationPrompt(title: string, userComment: string, aiDescription: string): string {
    return `
この投稿の新しい発見や気づきを、スマートに指摘。

📸 ${title}
💭 ${userComment}
🔎 ${aiDescription}

観察のスタイル:
• 90文字以内で鋭く
• 意外な視点や気づき
• おしゃれで知的な表現
• 写真の隠れた魅力を発見
• 次も見たくなる一言

`;
  }

  private getFallbackDescription(): string {
    const descriptions = [
      "この瞬間、光とスペースが絶妙にマッチング ✨ 朝の空気感がエモい",
      "建築とヒトの動きがクロスオーバー 🏗️ 現代アートみたいな構図",
      "空の表情がドラマチック ☁️ 旅心をくすぐるシチュエーション",
      "静けさの中の緊張感、めちゃくちゃ印象的 🌅 時が止まった感じ"
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  private getFallbackComments(): AIComment[] {
    return [
      {
        id: Date.now().toString(),
        type: 'comment',
        content: '光と影のコントラストがエモすぎる ✨ 旅の始まりの高揚感が伝わってくる！',
        createdAt: new Date().toISOString()
      },
      {
        id: (Date.now() + 1).toString(),
        type: 'question',
        content: 'この瞬間の音の風景も気になる！どんなサウンドが聞こえてた？',
        createdAt: new Date(Date.now() + 60000).toISOString()
      },
      {
        id: (Date.now() + 2).toString(),
        type: 'observation',
        content: '建築と人の動きのコントラストが美しい 🏗️ 機能美の新しい表現だね',
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