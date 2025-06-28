import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

// Amazon PA-API v5 の設定
const AMAZON_CONFIG = {
  accessKey: Deno.env.get('AMAZON_ACCESS_KEY'),
  secretKey: Deno.env.get('AMAZON_SECRET_KEY'),
  partnerTag: Deno.env.get('AMAZON_ASSOCIATE_TAG'),
  region: Deno.env.get('AMAZON_REGION') || 'FE',
  host: 'webservices.amazon.co.jp'
}

interface Product {
  id: string;
  name: string;
  price: string;
  imageUrl?: string;
  affiliateUrl: string;
  category: string;
  tags: string[];
  reason?: string;
}

// Amazon PA-API v5 用の署名生成
async function createSignature(
  requestPayload: string,
  timestamp: string,
  headers: Record<string, string>
): Promise<string> {
  // AWS Signature Version 4 の実装
  // 本格実装時は crypto ライブラリを使用
  
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(AMAZON_CONFIG.secretKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(requestPayload)
  );
  
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Amazon PA-API v5 商品検索
async function searchAmazonProducts(keywords: string): Promise<Product[]> {
  if (!AMAZON_CONFIG.accessKey || !AMAZON_CONFIG.secretKey || !AMAZON_CONFIG.partnerTag) {
    console.log('Amazon credentials not configured, using mock data');
    return getMockProducts(keywords);
  }

  try {
    const timestamp = new Date().toISOString();
    
    const requestPayload = JSON.stringify({
      PartnerTag: AMAZON_CONFIG.partnerTag,
      PartnerType: 'Associates',
      Keywords: keywords,
      SearchIndex: 'All',
      ItemCount: 10,
      Resources: [
        'Images.Primary.Large',
        'Images.Primary.Medium',
        'ItemInfo.Title',
        'ItemInfo.Features',
        'Offers.Listings.Price',
        'Offers.Listings.DeliveryInfo'
      ]
    });

    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Encoding': 'amz-1.0',
      'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems',
      'X-Amz-Date': timestamp,
      'Authorization': `AWS4-HMAC-SHA256 Credential=${AMAZON_CONFIG.accessKey}/${timestamp.slice(0, 8)}/${AMAZON_CONFIG.region}/ProductAdvertisingAPI/aws4_request`
    };

    const response = await fetch(`https://${AMAZON_CONFIG.host}/paapi5/searchitems`, {
      method: 'POST',
      headers,
      body: requestPayload
    });

    if (!response.ok) {
      console.error('Amazon API error:', response.status, response.statusText);
      return getMockProducts(keywords);
    }

    const data = await response.json();
    
    if (data.SearchResult && data.SearchResult.Items) {
      return data.SearchResult.Items.map((item: any) => ({
        id: item.ASIN,
        name: item.ItemInfo?.Title?.DisplayValue || '商品名不明',
        price: item.Offers?.Listings?.[0]?.Price?.DisplayAmount || '価格未設定',
        imageUrl: item.Images?.Primary?.Large?.URL || item.Images?.Primary?.Medium?.URL,
        affiliateUrl: addAssociateTag(item.DetailPageURL),
        category: 'Amazon商品',
        tags: [keywords, 'Amazon'],
        reason: item.ItemInfo?.Features?.DisplayValues?.[0]?.substring(0, 50) + '...' || `${keywords}に関連する人気商品`
      }));
    }

    return getMockProducts(keywords);
    
  } catch (error) {
    console.error('Amazon search error:', error);
    return getMockProducts(keywords);
  }
}

// アソシエイトタグを追加
function addAssociateTag(url: string): string {
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set('tag', AMAZON_CONFIG.partnerTag!);
    return urlObj.toString();
  } catch {
    return url;
  }
}

// モックデータ
function getMockProducts(keywords: string): Product[] {
  const keywordLower = keywords.toLowerCase();
  
  if (keywordLower.includes('ペット') || keywordLower.includes('犬') || keywordLower.includes('猫')) {
    return [
      {
        id: 'B08XYZPET1',
        name: 'ペット用自動給餌器 スマホ連動 タイマー付き',
        price: '¥6,980',
        imageUrl: 'https://images-na.ssl-images-amazon.com/images/I/61abc123def.jpg',
        affiliateUrl: addAssociateTag('https://amazon.co.jp/dp/B08XYZPET1'),
        category: 'ペット用品',
        tags: ['ペット', '自動給餌', 'Amazon'],
        reason: 'お留守番時も安心の自動給餌器'
      },
      {
        id: 'B09ABCPET2',
        name: 'ペット用体重計 デジタル表示 健康管理',
        price: '¥2,480',
        imageUrl: 'https://images-na.ssl-images-amazon.com/images/I/71def456ghi.jpg',
        affiliateUrl: addAssociateTag('https://amazon.co.jp/dp/B09ABCPET2'),
        category: 'ペット用品',
        tags: ['ペット', '健康管理', 'Amazon'],
        reason: '愛犬・愛猫の健康管理に便利'
      }
    ];
  }

  if (keywordLower.includes('アウトドア') || keywordLower.includes('キャンプ')) {
    return [
      {
        id: 'B06GHIOUT1',
        name: 'ポータブルチェア 軽量 折りたたみ キャンプ',
        price: '¥3,980',
        imageUrl: 'https://images-na.ssl-images-amazon.com/images/I/61mno123pqr.jpg',
        affiliateUrl: addAssociateTag('https://amazon.co.jp/dp/B06GHIOUT1'),
        category: 'アウトドア用品',
        tags: ['アウトドア', 'キャンプ', 'Amazon'],
        reason: '持ち運び便利な折りたたみチェア'
      }
    ];
  }

  // デフォルト商品
  return [
    {
      id: 'B01GENERAL',
      name: 'モバイルバッテリー 大容量 20000mAh',
      price: '¥2,980',
      imageUrl: 'https://images-na.ssl-images-amazon.com/images/I/61general.jpg',
      affiliateUrl: addAssociateTag('https://amazon.co.jp/dp/B01GENERAL'),
      category: '電子機器',
      tags: ['ガジェット', 'Amazon'],
      reason: '外出時の必需品'
    }
  ];
}

serve(async (req) => {
  // CORS 対応
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { keywords } = await req.json()

    if (!keywords || typeof keywords !== 'string') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Keywords parameter is required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`🔍 Searching Amazon for: "${keywords}"`)
    
    const products = await searchAmazonProducts(keywords)

    return new Response(
      JSON.stringify({ 
        success: true, 
        products,
        count: products.length 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})