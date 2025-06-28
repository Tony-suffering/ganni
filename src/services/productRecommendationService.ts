import { GoogleGenerativeAI } from '@google/generative-ai';
import { amazonService } from './amazonService';

// 商品情報の型定義
export interface Product {
  id: string;
  name: string;
  price: string;
  imageUrl?: string;
  affiliateUrl: string;
  category: string;
  tags: string[];
  reason?: string;
}

// 商品推薦結果の型定義
export interface ProductRecommendation {
  products: Product[];
  context: PostContext;
  recommendations: RecommendationGroup[];
}

// 投稿コンテキストの型定義
export interface PostContext {
  objects: string[];          // 検出されたオブジェクト
  scene: string;             // シーン（屋内、屋外、イベントなど）
  emotion: string;           // 感情（楽しい、悲しい、感動など）
  needs: string[];           // 抽出されたニーズ
  season?: string;           // 季節
  timeOfDay?: string;        // 時間帯
}

// 推薦グループの型定義
export interface RecommendationGroup {
  title: string;             // グループタイトル（例：「ガーデニング用品」）
  products: Product[];
  reason: string;           // このグループを推薦する理由
}

// 商品カテゴリの定義
export const ProductCategories = {
  OUTDOOR: 'アウトドア・レジャー',
  GARDENING: 'ガーデニング',
  PET: 'ペット用品',
  KIDS: '子供・育児',
  SPORTS: 'スポーツ・フィットネス',
  FOOD: '食品・飲料',
  ELECTRONICS: '家電・カメラ',
  FASHION: 'ファッション',
  HOME: 'ホーム・インテリア',
  BEAUTY: 'ビューティー・健康',
  HOBBY: '趣味・DIY',
  TRAVEL: '旅行・お出かけ'
} as const;

export class ProductRecommendationService {
  private genAI: GoogleGenerativeAI;
  
  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * 投稿内容から商品推薦を生成
   */
  async analyzeAndRecommend(
    imageUrl: string,
    title: string,
    comment: string
  ): Promise<ProductRecommendation> {
    try {
      console.log('🛍️ Starting product recommendation analysis...');
      
      // 1. 投稿内容を分析してコンテキストを抽出
      const context = await this.analyzePostContext(imageUrl, title, comment);
      console.log('📊 Post context:', context);
      
      // 2. コンテキストに基づいて商品を推薦
      const recommendations = await this.generateRecommendations(context);
      console.log('🎯 Generated recommendations:', recommendations);
      
      // 3. すべての商品をフラットなリストにまとめる
      const allProducts = recommendations.flatMap(group => group.products);
      
      return {
        products: allProducts,
        context,
        recommendations
      };
      
    } catch (error) {
      console.error('❌ Product recommendation error:', error);
      throw error;
    }
  }

  /**
   * 投稿コンテキストを分析
   */
  private async analyzePostContext(
    imageUrl: string,
    title: string,
    comment: string
  ): Promise<PostContext> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `この投稿内容を分析して、商品推薦のためのコンテキストを抽出してください。

タイトル: ${title}
コメント: ${comment}

以下のJSON形式で回答してください:
{
  "objects": ["検出されたオブジェクト（犬、花、料理など）"],
  "scene": "シーンの種類（屋内、屋外、公園、レストラン、イベントなど）",
  "emotion": "感情（楽しい、感動、困っている、満足など）",
  "needs": ["潜在的なニーズ（例：ペット用品が必要、アウトドアグッズが欲しい）"],
  "season": "季節（春、夏、秋、冬、不明）",
  "timeOfDay": "時間帯（朝、昼、夕方、夜、不明）"
}`;

    try {
      let base64Data = '';
      let mimeType = 'image/jpeg';
      
      // Base64データURLの場合
      if (imageUrl.startsWith('data:')) {
        const [header, data] = imageUrl.split(',');
        base64Data = data;
        mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
      } else {
        // URLから画像を取得
        const response = await fetch(imageUrl);
        const arrayBuffer = await response.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        
        // Base64に変換
        let binary = '';
        const chunkSize = 8192;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          const chunk = bytes.slice(i, i + chunkSize);
          binary += String.fromCharCode.apply(null, Array.from(chunk));
        }
        base64Data = btoa(binary);
        mimeType = response.headers.get('content-type') || 'image/jpeg';
      }
      
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        }
      ]);
      
      const responseText = result.response.text();
      const jsonStart = responseText.indexOf('{');
      const jsonEnd = responseText.lastIndexOf('}') + 1;
      const jsonText = responseText.slice(jsonStart, jsonEnd);
      
      return JSON.parse(jsonText);
      
    } catch (error) {
      console.error('Context analysis error:', error);
      // エラー時はテキストのみで分析
      return this.analyzeTextOnly(title, comment);
    }
  }

  /**
   * テキストのみでコンテキストを分析（フォールバック）
   */
  private async analyzeTextOnly(title: string, comment: string): Promise<PostContext> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `以下のテキストから商品推薦のためのコンテキストを抽出してください。

タイトル: ${title}
コメント: ${comment}

以下のJSON形式で回答してください:
{
  "objects": ["推測されるオブジェクト"],
  "scene": "推測されるシーン",
  "emotion": "感情",
  "needs": ["潜在的なニーズ"],
  "season": "季節（不明でも可）",
  "timeOfDay": "時間帯（不明でも可）"
}`;

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const jsonStart = responseText.indexOf('{');
      const jsonEnd = responseText.lastIndexOf('}') + 1;
      const jsonText = responseText.slice(jsonStart, jsonEnd);
      
      return JSON.parse(jsonText);
    } catch (error) {
      // 最終的なフォールバック
      return {
        objects: [],
        scene: '不明',
        emotion: '中立',
        needs: [],
        season: '不明',
        timeOfDay: '不明'
      };
    }
  }

  /**
   * コンテキストに基づいて商品を推薦
   */
  private async generateRecommendations(context: PostContext): Promise<RecommendationGroup[]> {
    try {
      // 1. AIで商品カテゴリとキーワードを生成
      const searchKeywords = await this.generateSearchKeywords(context);
      console.log('🔍 Generated search keywords:', searchKeywords);

      // 2. Amazon APIで実際の商品を検索
      const recommendations: RecommendationGroup[] = [];
      
      for (const keywordGroup of searchKeywords) {
        try {
          const products = await amazonService.searchItems(
            keywordGroup.keywords.join(' '),
            'All',
            5
          );
          
          if (products.length > 0) {
            recommendations.push({
              title: keywordGroup.category,
              reason: keywordGroup.reason,
              products: products.slice(0, 3) // 最大3商品
            });
          }
        } catch (searchError) {
          console.error(`Failed to search for ${keywordGroup.category}:`, searchError);
        }
      }

      // 3. 商品が見つからない場合はフォールバック
      if (recommendations.length === 0) {
        console.log('No Amazon products found, using fallback');
        return this.getDefaultRecommendations(context);
      }

      return recommendations;
      
    } catch (error) {
      console.error('Amazon recommendation generation error:', error);
      return this.getDefaultRecommendations(context);
    }
  }

  /**
   * AIでAmazon検索用のキーワードを生成
   */
  private async generateSearchKeywords(context: PostContext): Promise<Array<{
    category: string;
    keywords: string[];
    reason: string;
  }>> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `以下のコンテキストから、Amazon商品検索に適したキーワードを生成してください。

コンテキスト:
${JSON.stringify(context, null, 2)}

以下のJSON形式で3つのカテゴリの検索キーワードを生成してください:
{
  "searchGroups": [
    {
      "category": "カテゴリ名",
      "keywords": ["検索キーワード1", "検索キーワード2"],
      "reason": "このカテゴリを推薦する理由"
    }
  ]
}

注意事項:
- Amazon商品検索に有効な日本語キーワードを使用
- 投稿内容と密接に関連するカテゴリを選択
- 各カテゴリに2-3個のキーワードを含める`;

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const jsonStart = responseText.indexOf('{');
      const jsonEnd = responseText.lastIndexOf('}') + 1;
      const jsonText = responseText.slice(jsonStart, jsonEnd);
      
      const parsed = JSON.parse(jsonText);
      return parsed.searchGroups || [];
      
    } catch (error) {
      console.error('Keyword generation error:', error);
      // フォールバック用のキーワード
      return [
        {
          category: 'おすすめ商品',
          keywords: ['便利グッズ', '人気商品'],
          reason: '多くの人に愛用されている商品'
        }
      ];
    }
  }

  /**
   * デフォルトの推薦（エラー時のフォールバック）
   */
  private async getDefaultRecommendations(context: PostContext): Promise<RecommendationGroup[]> {
    const recommendations: RecommendationGroup[] = [];
    
    try {
      // Amazon APIを使ってフォールバック商品を検索
      const fallbackKeywords = [
        { category: 'ペット用品', keywords: ['ペット', '犬', '猫'] },
        { category: 'アウトドア用品', keywords: ['アウトドア', 'キャンプ'] },
        { category: '便利グッズ', keywords: ['便利グッズ', 'ガジェット'] }
      ];

      for (const fallback of fallbackKeywords) {
        // コンテキストに関連するキーワードを優先
        const isRelevant = context.objects.some(obj => 
          fallback.keywords.some(keyword => 
            obj.includes(keyword) || keyword.includes(obj)
          )
        ) || context.scene.includes('屋外') && fallback.category.includes('アウトドア');

        if (isRelevant || recommendations.length === 0) {
          try {
            const products = await amazonService.searchItems(
              fallback.keywords.join(' '),
              'All',
              3
            );
            
            if (products.length > 0) {
              recommendations.push({
                title: fallback.category,
                reason: `${fallback.category}の人気商品をご提案します`,
                products: products
              });
              
              // 1つのカテゴリで十分な場合は終了
              if (recommendations.length >= 1) break;
            }
          } catch (error) {
            console.error(`Fallback search failed for ${fallback.category}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Fallback recommendations failed:', error);
    }

    // 最終的なフォールバック（静的なモック商品）
    if (recommendations.length === 0) {
      recommendations.push({
        title: 'おすすめ商品',
        reason: '人気の商品をご紹介します',
        products: [
          {
            id: 'fallback-1',
            name: 'モバイルバッテリー 大容量',
            price: '¥2,980',
            category: ProductCategories.ELECTRONICS,
            tags: ['ガジェット', '便利グッズ'],
            affiliateUrl: 'https://amazon.co.jp/',
            imageUrl: '/api/placeholder/300/300',
            reason: '外出時の必需品'
          }
        ]
      });
    }
    
    return recommendations;
  }

  /**
   * 商品をAIコメントに自然に織り込む
   */
  async generateProductMentionComment(
    originalComment: string,
    product: Product,
    context: PostContext
  ): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `以下のAIコメントに、商品を自然に織り込んでください。
押し売りにならないよう、さりげなく商品に言及してください。

元のコメント: ${originalComment}
商品名: ${product.name}
商品の推薦理由: ${product.reason}
コンテキスト: ${JSON.stringify(context, null, 2)}

自然で親しみやすい日本語で、100文字程度で回答してください。
商品名は[${product.name}]のようにマークダウンリンク形式で含めてください。`;

    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      // エラー時は元のコメントに商品リンクを追加
      return `${originalComment} ちなみに[${product.name}](${product.affiliateUrl})が人気ですよ！`;
    }
  }
}

// シングルトンインスタンスをエクスポート
export const productRecommendationService = new ProductRecommendationService();