import { Product } from '../types';

// Amazon商品検索用のクライアント（フロントエンド対応）
interface AmazonConfig {
  accessKey: string;
  secretKey: string;
  partnerTag: string;
  region: string;
}

interface AmazonSearchResponse {
  success: boolean;
  products: Product[];
  error?: string;
}

export class AmazonService {
  private config: AmazonConfig;
  private isConfigured: boolean = false;
  private requestCount: number = 0;
  private lastRequestTime: number = 0;
  private readonly REQUEST_DELAY = 1000; // 1秒間隔

  constructor() {
    this.config = {
      accessKey: import.meta.env.VITE_AMAZON_ACCESS_KEY || '',
      secretKey: import.meta.env.VITE_AMAZON_SECRET_KEY || '',
      partnerTag: import.meta.env.VITE_AMAZON_ASSOCIATE_TAG || '',
      region: import.meta.env.VITE_AMAZON_REGION || 'FE'
    };

    this.initializeService();
  }

  private initializeService(): void {
    if (!this.config.accessKey || !this.config.secretKey || !this.config.partnerTag) {
      console.warn('Amazon PA-API credentials not configured. Using mock data.');
      this.isConfigured = false;
      return;
    }

    // フロントエンドではAPI呼び出しは制限されるため、サーバーサイド実装推奨
    console.log('⚠️  Amazon PA-API はサーバーサイドでの実装を推奨します');
    console.log('💡 現在はモックデータを使用中。本格運用時はSupabase Functionsまたは独自APIサーバーの実装が必要です');
    this.isConfigured = false; // フロントエンドでは無効化
  }

  /**
   * レート制限を守るための待機
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.REQUEST_DELAY) {
      const waitTime = this.REQUEST_DELAY - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * キーワードで商品を検索（フロントエンド用：モックデータを返す）
   */
  async searchItems(
    keywords: string,
    searchIndex: string = 'All',
    itemCount: number = 10
  ): Promise<Product[]> {
    console.log(`🔍 Searching for: "${keywords}" (using enhanced mock data)`);
    
    await this.waitForRateLimit();
    this.requestCount++;

    // フロントエンドではモックデータを返す
    return this.getEnhancedMockProducts(keywords);
  }

  /**
   * ASINで特定の商品を取得
   */
  async getItems(asins: string[]): Promise<Product[]> {
    console.log(`🔍 Getting items by ASIN: ${asins.join(', ')} (using mock data)`);
    return this.getEnhancedMockProducts('ASIN search');
  }

  /**
   * URLにアソシエイトタグを追加
   */
  private addAssociateTag(url: string): string {
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set('tag', this.config.partnerTag);
      return urlObj.toString();
    } catch (error) {
      return url;
    }
  }

  /**
   * 強化されたモックデータ（キーワードベース）
   */
  private getEnhancedMockProducts(keywords: string): Product[] {
    const keywordLower = keywords.toLowerCase();
    
    // キーワードベースの商品データベース
    const productDatabase: { [key: string]: Product[] } = {
      'ペット': [
        {
          id: 'B08XYZPET1',
          name: 'ペット用自動給餌器 スマホ連動 タイマー付き',
          price: '¥6,980',
          imageUrl: 'https://images-na.ssl-images-amazon.com/images/I/61abc123def.jpg',
          affiliateUrl: this.addAssociateTag('https://amazon.co.jp/dp/B08XYZPET1'),
          category: 'ペット用品',
          tags: ['ペット', '自動給餌', 'スマート', 'Amazon'],
          reason: 'お留守番時も安心の自動給餌器。スマホで遠隔操作可能'
        },
        {
          id: 'B09ABCPET2',
          name: 'ペット用体重計 デジタル表示 健康管理',
          price: '¥2,480',
          imageUrl: 'https://images-na.ssl-images-amazon.com/images/I/71def456ghi.jpg',
          affiliateUrl: this.addAssociateTag('https://amazon.co.jp/dp/B09ABCPET2'),
          category: 'ペット用品',
          tags: ['ペット', '健康管理', 'デジタル', 'Amazon'],
          reason: '愛犬・愛猫の健康管理に便利な高精度体重計'
        },
        {
          id: 'B07DEFPET3',
          name: 'ペット用知育おもちゃ ストレス解消',
          price: '¥1,280',
          imageUrl: 'https://images-na.ssl-images-amazon.com/images/I/81ghi789jkl.jpg',
          affiliateUrl: this.addAssociateTag('https://amazon.co.jp/dp/B07DEFPET3'),
          category: 'ペット用品',
          tags: ['ペット', 'おもちゃ', '知育', 'Amazon'],
          reason: '運動不足解消とストレス発散に最適な知育玩具'
        }
      ],
      'アウトドア': [
        {
          id: 'B06GHIOUT1',
          name: 'ポータブルチェア 軽量 折りたたみ キャンプ',
          price: '¥3,980',
          imageUrl: 'https://images-na.ssl-images-amazon.com/images/I/61mno123pqr.jpg',
          affiliateUrl: this.addAssociateTag('https://amazon.co.jp/dp/B06GHIOUT1'),
          category: 'アウトドア用品',
          tags: ['アウトドア', 'キャンプ', '軽量', 'Amazon'],
          reason: '持ち運び便利な超軽量折りたたみチェア'
        },
        {
          id: 'B05JKLOUT2',
          name: 'ポータブル電源 大容量 キャンプ 防災',
          price: '¥29,800',
          imageUrl: 'https://images-na.ssl-images-amazon.com/images/I/71stu456vwx.jpg',
          affiliateUrl: this.addAssociateTag('https://amazon.co.jp/dp/B05JKLOUT2'),
          category: 'アウトドア用品',
          tags: ['アウトドア', '電源', '防災', 'Amazon'],
          reason: 'キャンプや緊急時に頼れる大容量ポータブル電源'
        },
        {
          id: 'B04MNOOUT3',
          name: 'テント 2〜3人用 防水 簡単設営',
          price: '¥12,800',
          imageUrl: 'https://images-na.ssl-images-amazon.com/images/I/81yz012abc.jpg',
          affiliateUrl: this.addAssociateTag('https://amazon.co.jp/dp/B04MNOOUT3'),
          category: 'アウトドア用品',
          tags: ['アウトドア', 'テント', '防水', 'Amazon'],
          reason: '初心者でも簡単に設営できる高性能テント'
        }
      ],
      'ガジェット': [
        {
          id: 'B03PQRGAD1',
          name: 'モバイルバッテリー 大容量 20000mAh',
          price: '¥2,980',
          imageUrl: 'https://images-na.ssl-images-amazon.com/images/I/61def789ghi.jpg',
          affiliateUrl: this.addAssociateTag('https://amazon.co.jp/dp/B03PQRGAD1'),
          category: '電子機器',
          tags: ['ガジェット', 'バッテリー', '大容量', 'Amazon'],
          reason: '外出時の必需品。2台同時充電可能な大容量モデル'
        },
        {
          id: 'B02STUGAD2',
          name: 'ワイヤレスイヤホン Bluetooth5.0',
          price: '¥4,980',
          imageUrl: 'https://images-na.ssl-images-amazon.com/images/I/71jkl456mno.jpg',
          affiliateUrl: this.addAssociateTag('https://amazon.co.jp/dp/B02STUGAD2'),
          category: '電子機器',
          tags: ['ガジェット', 'イヤホン', 'ワイヤレス', 'Amazon'],
          reason: '高音質と長時間再生を実現したワイヤレスイヤホン'
        }
      ],
      '料理': [
        {
          id: 'B01VWXCOO1',
          name: '電気圧力鍋 2.2L 一人暮らし向け',
          price: '¥9,800',
          imageUrl: 'https://images-na.ssl-images-amazon.com/images/I/81pqr123stu.jpg',
          affiliateUrl: this.addAssociateTag('https://amazon.co.jp/dp/B01VWXCOO1'),
          category: 'キッチン用品',
          tags: ['料理', '圧力鍋', '電気', 'Amazon'],
          reason: '時短料理の強い味方。ボタン一つで本格料理'
        },
        {
          id: 'B09YZACOO2',
          name: '包丁セット ステンレス製 プロ仕様',
          price: '¥7,980',
          imageUrl: 'https://images-na.ssl-images-amazon.com/images/I/71vwx789yza.jpg',
          affiliateUrl: this.addAssociateTag('https://amazon.co.jp/dp/B09YZACOO2'),
          category: 'キッチン用品',
          tags: ['料理', '包丁', 'ステンレス', 'Amazon'],
          reason: '切れ味抜群のプロ仕様包丁セット'
        }
      ],
      '美容': [
        {
          id: 'B08BCDBEA1',
          name: 'ヘアドライヤー イオン機能付き',
          price: '¥8,980',
          imageUrl: 'https://images-na.ssl-images-amazon.com/images/I/61bcd345efg.jpg',
          affiliateUrl: this.addAssociateTag('https://amazon.co.jp/dp/B08BCDBEA1'),
          category: '美容・健康',
          tags: ['美容', 'ドライヤー', 'イオン', 'Amazon'],
          reason: 'サロン級の仕上がり。マイナスイオンで髪に優しい'
        }
      ],
      '掃除': [
        {
          id: 'B07EFGCLE1',
          name: 'ロボット掃除機 自動充電 スマート',
          price: '¥19,800',
          imageUrl: 'https://images-na.ssl-images-amazon.com/images/I/71hij678klm.jpg',
          affiliateUrl: this.addAssociateTag('https://amazon.co.jp/dp/B07EFGCLE1'),
          category: '家電',
          tags: ['掃除', 'ロボット', 'スマート', 'Amazon'],
          reason: '忙しい毎日の掃除を自動化。スマホで操作可能'
        }
      ]
    };

    // キーワードマッチング
    for (const [category, products] of Object.entries(productDatabase)) {
      if (keywordLower.includes(category) || 
          category.includes(keywordLower) ||
          products.some(p => p.tags.some(tag => 
            keywordLower.includes(tag.toLowerCase()) || 
            tag.toLowerCase().includes(keywordLower)
          ))) {
        return products;
      }
    }

    // 部分マッチング
    for (const [category, products] of Object.entries(productDatabase)) {
      const matchedProducts = products.filter(p => 
        p.name.toLowerCase().includes(keywordLower) ||
        p.category.toLowerCase().includes(keywordLower) ||
        p.tags.some(tag => tag.toLowerCase().includes(keywordLower))
      );
      if (matchedProducts.length > 0) {
        return matchedProducts;
      }
    }

    // デフォルト商品（人気商品）
    return [
      {
        id: 'B01GENERAL',
        name: 'モバイルバッテリー 大容量 20000mAh',
        price: '¥2,980',
        imageUrl: 'https://images-na.ssl-images-amazon.com/images/I/61general.jpg',
        affiliateUrl: this.addAssociateTag('https://amazon.co.jp/dp/B01GENERAL'),
        category: '電子機器',
        tags: ['ガジェット', '便利グッズ', 'Amazon'],
        reason: '外出時の必需品。多くの人に愛用されています'
      },
      {
        id: 'B02POPULAR',
        name: 'ワイヤレス充電器 置くだけ充電',
        price: '¥1,980',
        imageUrl: 'https://images-na.ssl-images-amazon.com/images/I/71popular.jpg',
        affiliateUrl: this.addAssociateTag('https://amazon.co.jp/dp/B02POPULAR'),
        category: '電子機器',
        tags: ['ガジェット', 'ワイヤレス', 'Amazon'],
        reason: 'ケーブル不要の便利な充電器'
      }
    ];
  }

  /**
   * API使用状況を取得
   */
  getUsageStats(): { requestCount: number; isConfigured: boolean } {
    return {
      requestCount: this.requestCount,
      isConfigured: this.isConfigured
    };
  }

  /**
   * 設定状況を確認
   */
  isReady(): boolean {
    // フロントエンドでは常にモックデータモードを返す
    return true;
  }

  /**
   * サーバーサイドAPI経由で商品検索（Supabase Functions使用）
   */
  async searchItemsViaAPI(keywords: string): Promise<Product[]> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl) {
        console.log('Supabase URL not configured, using mock data');
        return this.getEnhancedMockProducts(keywords);
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/amazon-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ keywords })
      });

      if (!response.ok) {
        console.error('Supabase function error:', response.status, response.statusText);
        return this.getEnhancedMockProducts(keywords);
      }

      const data: AmazonSearchResponse = await response.json();
      
      if (data.success && data.products.length > 0) {
        console.log(`✅ Found ${data.products.length} products via Supabase Functions`);
        return data.products;
      } else {
        console.log('No products found via API, using mock data');
        return this.getEnhancedMockProducts(keywords);
      }
    } catch (error) {
      console.error('Server-side Amazon API error:', error);
      return this.getEnhancedMockProducts(keywords);
    }
  }

  /**
   * 本格実装時用: サーバーサイドAPIを優先し、フォールバックでモックデータ
   */
  async searchItemsProduction(
    keywords: string,
    searchIndex: string = 'All',
    itemCount: number = 10
  ): Promise<Product[]> {
    // 本格運用時はこちらを使用
    console.log(`🔍 Production search for: "${keywords}"`);
    
    // まずサーバーサイドAPIを試行
    const serverResults = await this.searchItemsViaAPI(keywords);
    if (serverResults.length > 0) {
      return serverResults.slice(0, itemCount);
    }
    
    // フォールバック: 強化されたモックデータ
    console.log('Falling back to enhanced mock data');
    return this.getEnhancedMockProducts(keywords).slice(0, itemCount);
  }
}

// シングルトンインスタンスをエクスポート
export const amazonService = new AmazonService();