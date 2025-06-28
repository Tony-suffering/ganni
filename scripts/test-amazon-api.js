#!/usr/bin/env node

/**
 * Amazon PA-API v5 接続テストスクリプト
 */

import dotenv from 'dotenv';
import path from 'path';

// 環境変数を読み込み
dotenv.config();

async function testAmazonAPI() {
  console.log('🔍 Amazon PA-API v5 接続テストを開始...\n');

  // 環境変数の確認
  console.log('📋 環境変数の確認:');
  console.log(`- VITE_AMAZON_ACCESS_KEY: ${process.env.VITE_AMAZON_ACCESS_KEY ? '✅ 設定済み' : '❌ 未設定'}`);
  console.log(`- VITE_AMAZON_SECRET_KEY: ${process.env.VITE_AMAZON_SECRET_KEY ? '✅ 設定済み' : '❌ 未設定'}`);
  console.log(`- VITE_AMAZON_ASSOCIATE_TAG: ${process.env.VITE_AMAZON_ASSOCIATE_TAG ? '✅ 設定済み' : '❌ 未設定'}`);
  console.log(`- VITE_AMAZON_REGION: ${process.env.VITE_AMAZON_REGION || 'FE (デフォルト)'}\n`);

  if (!process.env.VITE_AMAZON_ACCESS_KEY || !process.env.VITE_AMAZON_SECRET_KEY || !process.env.VITE_AMAZON_ASSOCIATE_TAG) {
    console.log('❌ 必要な環境変数が設定されていません。');
    console.log('README_AMAZON_SETUP.md を参照して環境変数を設定してください。\n');
    
    console.log('💡 テスト用の環境変数設定例:');
    console.log('VITE_AMAZON_ACCESS_KEY=AKIA******************');
    console.log('VITE_AMAZON_SECRET_KEY=****************************************');
    console.log('VITE_AMAZON_ASSOCIATE_TAG=your-associate-tag-20');
    console.log('VITE_AMAZON_REGION=FE');
    return;
  }

  try {
    // 動的インポートでES6モジュールを読み込み
    const { amazonService } = await import('../src/services/amazonService.ts');
    
    console.log('🔧 Amazon API サービスの初期化...');
    const isReady = amazonService.isReady();
    console.log(`初期化状態: ${isReady ? '✅ 成功' : '❌ 失敗'}\n`);

    if (!isReady) {
      console.log('❌ Amazon API サービスの初期化に失敗しました。');
      console.log('認証情報を確認してください。\n');
      return;
    }

    // テスト検索を実行
    console.log('🛍️ テスト検索を実行中...');
    console.log('検索キーワード: "モバイルバッテリー"\n');
    
    const products = await amazonService.searchItems('モバイルバッテリー', 'All', 3);
    
    console.log(`検索結果: ${products.length}件の商品が見つかりました\n`);
    
    if (products.length > 0) {
      console.log('📦 商品詳細:');
      products.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name}`);
        console.log(`   価格: ${product.price}`);
        console.log(`   ASIN: ${product.id}`);
        console.log(`   カテゴリ: ${product.category}`);
        console.log(`   画像URL: ${product.imageUrl ? '✅ あり' : '❌ なし'}`);
        console.log(`   アフィリエイトURL: ${product.affiliateUrl}`);
        console.log('');
      });
    }

    // API使用状況の表示
    const stats = amazonService.getUsageStats();
    console.log('📊 API使用状況:');
    console.log(`- 今回のリクエスト数: ${stats.requestCount}`);
    console.log(`- 設定状態: ${stats.isConfigured ? '✅ 正常' : '❌ 異常'}\n`);

    console.log('✅ Amazon PA-API v5 接続テストが完了しました！');
    
  } catch (error) {
    console.error('❌ テスト中にエラーが発生しました:');
    console.error(error.message);
    
    if (error.response) {
      console.error(`HTTP ステータス: ${error.response.status}`);
      console.error(`レスポンス: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    
    console.log('\n💡 トラブルシューティング:');
    console.log('1. 環境変数が正しく設定されているか確認');
    console.log('2. Amazon アソシエイト・プログラムの承認状況を確認');
    console.log('3. Product Advertising API (PA-API) v5 の申請状況を確認');
    console.log('4. APIキーの有効期限を確認');
    console.log('5. ネットワーク接続を確認');
  }
}

// スクリプトを実行
testAmazonAPI().catch(console.error);