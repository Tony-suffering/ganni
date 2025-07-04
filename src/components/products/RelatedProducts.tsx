import React from 'react';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import { RecommendationGroup } from '../../types';
import { ProductCard } from './ProductCard';

interface RelatedProductsProps {
  recommendations: RecommendationGroup[];
  className?: string;
  maxGroupsToShow?: number;
  showHeader?: boolean;
}

export const RelatedProducts: React.FC<RelatedProductsProps> = ({ 
  recommendations, 
  className = '',
  maxGroupsToShow = 3,
  showHeader = true
}) => {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  const displayGroups = recommendations.slice(0, maxGroupsToShow);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* ヘッダー */}
      {showHeader && (
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              この投稿に関連する商品
            </h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            投稿内容から厳選したおすすめ商品
          </p>
        </div>
      )}
      
      {/* 商品グループ */}
      <div className="p-4 space-y-6">
        {displayGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-3">
            {/* グループタイトル */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-medium text-gray-900">
                  {group.title}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {group.reason}
                </p>
              </div>
              {group.products.length > 2 && (
                <button className="flex items-center text-sm text-blue-600 hover:text-blue-700">
                  もっと見る
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              )}
            </div>
            
            {/* 商品リスト */}
            <div className="space-y-3">
              {group.products.slice(0, 2).map((product, productIndex) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  size="small"
                  className="hover:bg-gray-50"
                />
              ))}
            </div>
            
            {/* セパレーター（最後のグループ以外） */}
            {groupIndex < displayGroups.length - 1 && (
              <div className="border-t border-gray-100 pt-3" />
            )}
          </div>
        ))}
      </div>
      
      {/* フッター（すべての商品を見るリンク） */}
      {recommendations.length > maxGroupsToShow && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
          <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
            すべての推薦商品を見る（{recommendations.length - maxGroupsToShow}カテゴリ）
          </button>
        </div>
      )}
    </div>
  );
};

// 投稿モーダル用のコンパクトバージョン
export const RelatedProductsCompact: React.FC<RelatedProductsProps> = ({ 
  recommendations, 
  className = '',
  maxGroupsToShow = 2
}) => {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  const displayGroups = recommendations.slice(0, maxGroupsToShow);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center space-x-2">
        <ShoppingBag className="w-4 h-4 text-blue-500" />
        <h4 className="text-sm font-medium text-gray-900">
          関連商品
        </h4>
      </div>
      
      <div className="space-y-4">
        {displayGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-2">
            <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
              {group.title}
            </h5>
            
            <div className="grid grid-cols-1 gap-2">
              {group.products.slice(0, 1).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  size="small"
                  className="border-gray-100"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};