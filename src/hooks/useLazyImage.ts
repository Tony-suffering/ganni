import { useState, useRef, useEffect, useCallback } from 'react';
import { imageCache } from '../utils/imageCache';

interface UseLazyImageProps {
  src: string;
  threshold?: number;
  rootMargin?: string;
  eager?: boolean; // 即座に読み込むかどうか
}

export const useLazyImage = ({ 
  src, 
  threshold = 0.1, 
  rootMargin = '50px',
  eager = false
}: UseLazyImageProps) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef<HTMLDivElement | null>(null);
  
  // 画像のonLoadハンドラー
  const handleImageLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  // 画像のonErrorハンドラー
  const handleImageError = useCallback(() => {
    setIsError(true);
    setIsLoaded(false);
    setImageSrc(null);
  }, []);

  // 即座に読み込む関数
  const loadImage = () => {
    // キャッシュから取得を試みる
    const cachedImage = imageCache.get(src);
    if (cachedImage) {
      setImageSrc(src);
      setIsLoaded(true);
      setIsError(false);
      return;
    }

    // キャッシュにない場合はプリロード
    imageCache.preload(src, eager)
      .then(() => {
        setImageSrc(src);
        setIsLoaded(true);
        setIsError(false);
      })
      .catch(() => {
        setIsError(true);
        setIsLoaded(false);
        setImageSrc(null);
      });
  };

  useEffect(() => {
    // 即座に読み込む場合
    if (eager) {
      loadImage();
      return;
    }

    // 通常の遅延読み込み
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadImage();
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    const currentRef = imgRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      observer.disconnect();
    };
  }, [src, threshold, rootMargin, eager]);

  return {
    imgRef,
    imageSrc,
    isLoaded,
    isError,
    handleImageLoad,
    handleImageError,
  };
};