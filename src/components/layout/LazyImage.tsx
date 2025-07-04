import React from 'react';
import { motion } from 'framer-motion';
import { useLazyImage } from '../../hooks/useLazyImage';
import { imageCache } from '../../utils/imageCache';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
  threshold?: number;
  rootMargin?: string;
  placeholder?: React.ReactNode;
  priority?: boolean; // 優先読み込み用フラグ
  index?: number; // 配列内のインデックス
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  aspectRatio = 'aspect-square',
  threshold = 0.1,
  rootMargin = '100px',
  placeholder,
  priority = false,
  index = 0
}) => {
  // 表示中の画像のみ即座に読み込み（無限ローディング対応）
  const shouldLoadImmediately = priority;
  
  const { imgRef, imageSrc, isLoaded, isError, handleImageLoad, handleImageError } = useLazyImage({ 
    src, 
    threshold: shouldLoadImmediately ? 1 : threshold, // 即座に読み込む場合は閾値を1に
    rootMargin: shouldLoadImmediately ? '0px' : rootMargin,
    eager: shouldLoadImmediately // 即座に読み込み
  });

  const defaultPlaceholder = (
    <div className={`${aspectRatio} bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse flex items-center justify-center`}>
      <div className="w-8 h-8 text-gray-400">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 7v2.99s-1.99.01-2 0V7c0-1.1-.9-2-2-2s-2 .9-2 2v3c-.01-.01-2 0-2 0V7c0-2.76 2.24-5 5-5s5 2.24 5 5zM9 12.5c0 .83-.67 1.5-1.5 1.5S6 13.33 6 12.5s.67-1.5 1.5-1.5S9 11.67 9 12.5zM12 17l-3-4-2 3h10l-3-4-2 2z"/>
        </svg>
      </div>
    </div>
  );

  const errorPlaceholder = (
    <div className={`${aspectRatio} bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300`}>
      <div className="text-center text-gray-500">
        <div className="w-8 h-8 mx-auto mb-2">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM13 17h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
        </div>
        <span className="text-xs">画像の読み込みに失敗</span>
      </div>
    </div>
  );

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${aspectRatio === 'aspect-auto' ? '' : aspectRatio} ${className}`}
    >
      {!imageSrc && !isError && (placeholder || defaultPlaceholder)}
      
      {isError && errorPlaceholder}
      
      {imageSrc && (
        <motion.img
          src={imageSrc}
          alt={alt}
          className="w-full h-full object-cover"
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          onLoad={() => {
            // onLoadが呼ばれた場合も確実にisLoadedを更新
            if (!isLoaded) {
              handleImageLoad();
            }
          }}
          onError={() => {
            handleImageError();
          }}
        />
      )}
      
      {imageSrc && !isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  );
};