import { useState, useRef, useEffect } from 'react';
import { imageCache } from '../utils/imageCache';

interface UseLazyImageProps {
  src: string;
  threshold?: number;
  rootMargin?: string;
}

export const useLazyImage = ({ 
  src, 
  threshold = 0.1, 
  rootMargin = '50px' 
}: UseLazyImageProps) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // キャッシュから取得を試みる
          const cachedImage = imageCache.get(src);
          if (cachedImage) {
            setImageSrc(src);
            setIsLoaded(true);
            setIsError(false);
            observer.disconnect();
            return;
          }

          // キャッシュにない場合はプリロード
          imageCache.preload(src)
            .then(() => {
              setImageSrc(src);
              setIsLoaded(true);
              setIsError(false);
            })
            .catch(() => {
              setIsError(true);
              setIsLoaded(false);
            })
            .finally(() => {
              observer.disconnect();
            });
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
  }, [src, threshold, rootMargin]);

  return {
    imgRef,
    imageSrc,
    isLoaded,
    isError,
  };
};