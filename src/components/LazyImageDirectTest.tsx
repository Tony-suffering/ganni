import React from 'react';
import { LazyImage } from './LazyImage';

// LazyImageコンポーネントの直接テスト
export const LazyImageDirectTest: React.FC = () => {
  const testUrls = [
    'https://dijtrtaydurrhkgmulnj.supabase.co/storage/v1/object/public/post-images/f53df428-db87-4e65-a1db-19c09f7f7fd3/1751196036680',
    'https://dijtrtaydurrhkgmulnj.supabase.co/storage/v1/object/public/post-images/e60de5e2-5431-4c30-b4f8-2c1a1670693b/1751186486659'
  ];

  return (
    <div className="p-4 bg-yellow-100 rounded-lg m-4">
      <h2 className="text-lg font-bold mb-4">🧪 LazyImage直接テスト</h2>
      
      <div className="grid grid-cols-2 gap-4">
        {testUrls.map((url, index) => (
          <div key={index} className="border p-2 bg-white rounded">
            <div className="text-sm font-mono text-gray-600 mb-2">
              Test {index + 1}: LazyImage
            </div>
            <LazyImage
              src={url}
              alt={`Test image ${index + 1}`}
              className="w-32 h-32"
              priority={true}
              index={index}
            />
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        LazyImageコンポーネントが実際にどう動作するかをテスト
      </div>
    </div>
  );
};