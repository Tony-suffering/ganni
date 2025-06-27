import React from 'react';
import { ExternalLink, Tag } from 'lucide-react';
import { Product } from '../types';

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
    window.open(product.affiliateUrl, '_blank', 'noopener,noreferrer');
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
        transition-all duration-200 cursor-pointer hover:border-blue-300
        ${sizeClasses[size]} ${className}
      `}
      onClick={handleClick}
    >
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
          <p className={`${textSizeClasses[size].price} text-blue-600 mt-1`}>
            {product.price}
          </p>
          
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
        
        {/* 外部リンクアイコン */}
        <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
      </div>
    </div>
  );
};