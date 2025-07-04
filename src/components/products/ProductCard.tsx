import React from 'react';
import { ExternalLink, Tag, Star, ShoppingCart } from 'lucide-react';
import { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  className = '',
  size = 'medium'
}) => {
  const handleClick = () => {
    // Amazon商品ページを新しいタブで開く
    window.open(product.affiliateUrl, '_blank', 'noopener,noreferrer');
    
    // 分析用のトラッキング（オプション）
    console.log('Product clicked:', {
      id: product.id,
      name: product.name,
      category: product.category
    });
  };

  const sizeClasses = {
    small: 'p-3',
    medium: 'p-4',
    large: 'p-6'
  };

  const imageSizeClasses = {
    small: 'h-20 w-20',
    medium: 'h-24 w-24',
    large: 'h-32 w-32'
  };

  const textSizeClasses = {
    small: {
      title: 'text-sm font-medium',
      price: 'text-lg font-bold',
      reason: 'text-xs text-gray-600',
      category: 'text-xs'
    },
    medium: {
      title: 'text-base font-medium',
      price: 'text-xl font-bold',
      reason: 'text-sm text-gray-600',
      category: 'text-sm'
    },
    large: {
      title: 'text-lg font-medium',
      price: 'text-2xl font-bold',
      reason: 'text-base text-gray-600',
      category: 'text-base'
    }
  };

  return (
    <div 
      className={`
        bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md 
        transition-all duration-200 cursor-pointer hover:border-orange-300
        hover:scale-[1.02] group relative
        ${sizeClasses[size]} ${className}
      `}
      onClick={handleClick}
    >
      {/* Amazon バッジ */}
      <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
        Amazon
      </div>
      {/* 商品画像 */}
      <div className="flex items-start space-x-3">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className={`${imageSizeClasses[size]} object-cover rounded-md bg-gray-100 flex-shrink-0`}
            loading="lazy"
          />
        ) : (
          <div className={`${imageSizeClasses[size]} bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0`}>
            <Tag className="w-6 h-6 text-gray-400" />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          {/* 商品名 */}
          <h3 className={`${textSizeClasses[size].title} text-gray-900 line-clamp-2 leading-tight`}>
            {product.name}
          </h3>
          
          {/* 価格 */}
          <div className="flex items-center space-x-2 mt-1">
            <p className={`${textSizeClasses[size].price} text-orange-600 font-bold`}>
              {product.price}
            </p>
            {product.id.startsWith('B0') && (
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
            )}
          </div>
          
          {/* カテゴリ */}
          <p className={`${textSizeClasses[size].category} text-gray-500 mt-1`}>
            {product.category}
          </p>
          
          {/* 推薦理由 */}
          {product.reason && (
            <p className={`${textSizeClasses[size].reason} mt-2 line-clamp-2`}>
              {product.reason}
            </p>
          )}
          
          {/* タグ */}
          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {product.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
              {product.tags.length > 3 && (
                <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  +{product.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Amazon アイコン */}
        <div className="flex-shrink-0 flex flex-col items-center space-y-1">
          <ShoppingCart className="w-4 h-4 text-orange-500" />
          <span className="text-xs text-orange-600 font-medium">Amazon</span>
        </div>
      </div>
    </div>
  );
};