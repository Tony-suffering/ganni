import React, { useState, useEffect } from 'react';

// シンプルな画像テストコンポーネント
export const ImageDebugTest: React.FC = () => {
  const [testResults, setTestResults] = useState<Array<{
    url: string;
    status: 'loading' | 'success' | 'error';
    error?: string;
  }>>([]);

  // テスト用の実際のSupabase画像URL（データベースから取得）
  const testUrls = [
    'https://dijtrtaydurrhkgmulnj.supabase.co/storage/v1/object/public/post-images/f53df428-db87-4e65-a1db-19c09f7f7fd3/1751196036680',
    'https://dijtrtaydurrhkgmulnj.supabase.co/storage/v1/object/public/post-images/e60de5e2-5431-4c30-b4f8-2c1a1670693b/1751186486659',
    'https://dijtrtaydurrhkgmulnj.supabase.co/storage/v1/object/public/post-images/e60de5e2-5431-4c30-b4f8-2c1a1670693b/1751185685732',
    'https://dijtrtaydurrhkgmulnj.supabase.co/storage/v1/object/public/post-images/3b242145-301f-40fc-ab38-88c54173d73a/1751184176587',
    'https://dijtrtaydurrhkgmulnj.supabase.co/storage/v1/object/public/post-images/b20dfe57-4147-4e58-9e8c-2152187f18b6/1751141570968',
  ];

  useEffect(() => {
    const testImageLoading = async () => {
      console.log('🧪 画像読み込みテスト開始');
      
      const results = testUrls.map(url => ({
        url,
        status: 'loading' as const
      }));
      setTestResults(results);

      for (let i = 0; i < testUrls.length; i++) {
        const url = testUrls[i];
        try {
          console.log(`📷 テスト中: ${url}`);
          
          // Fetch APIでテスト
          const response = await fetch(url);
          console.log(`📊 Response status: ${response.status}`);
          console.log(`📊 Response headers:`, Object.fromEntries(response.headers.entries()));
          
          if (response.ok) {
            // Image要素でテスト
            const img = new Image();
            const imgPromise = new Promise<void>((resolve, reject) => {
              img.onload = () => {
                console.log(`✅ 画像読み込み成功: ${url}`);
                resolve();
              };
              img.onerror = (e) => {
                console.error(`❌ Image要素でエラー: ${url}`, e);
                reject(new Error('Image element failed'));
              };
            });
            
            img.src = url;
            await imgPromise;
            
            setTestResults(prev => prev.map((result, index) => 
              index === i ? { ...result, status: 'success' } : result
            ));
          } else {
            throw new Error(`HTTP ${response.status}`);
          }
        } catch (error) {
          console.error(`❌ 画像読み込み失敗: ${url}`, error);
          setTestResults(prev => prev.map((result, index) => 
            index === i ? { 
              ...result, 
              status: 'error', 
              error: error instanceof Error ? error.message : '不明なエラー' 
            } : result
          ));
        }
      }
    };

    testImageLoading();
  }, []);

  return (
    <div className="p-4 bg-gray-100 rounded-lg m-4">
      <h2 className="text-lg font-bold mb-4">🧪 画像読み込みデバッグテスト</h2>
      
      <div className="space-y-2">
        {testResults.map((result, index) => (
          <div key={index} className="p-2 bg-white rounded border">
            <div className="text-sm font-mono text-gray-600 mb-1">
              URL: {result.url}
            </div>
            <div className={`text-sm font-semibold ${
              result.status === 'success' ? 'text-green-600' : 
              result.status === 'error' ? 'text-red-600' : 'text-yellow-600'
            }`}>
              ステータス: {result.status}
              {result.error && ` - ${result.error}`}
            </div>
            
            {result.status === 'success' && (
              <img 
                src={result.url} 
                alt="テスト画像" 
                className="mt-2 max-w-32 max-h-32 border"
                onError={(e) => console.error('img要素でエラー:', e)}
                onLoad={() => console.log('img要素で読み込み成功')}
              />
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        ブラウザのコンソール（F12）でより詳細なログを確認してください
      </div>
    </div>
  );
};