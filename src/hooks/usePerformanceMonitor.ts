import { useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: number;
  activeImages: number;
  cacheSize: number;
}

export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    activeImages: 0,
    cacheSize: 0
  });
  
  const renderStartTime = useRef<number>(0);
  const observerRef = useRef<PerformanceObserver | null>(null);

  useEffect(() => {
    // レンダリング開始時間を記録
    renderStartTime.current = performance.now();
    
    // Performance Observer for navigation timing
    if ('PerformanceObserver' in window) {
      observerRef.current = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            // Navigation timing metrics
            console.log('Page Load Time:', entry.duration);
          } else if (entry.entryType === 'resource') {
            // Resource loading metrics
            if (entry.name.includes('image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(entry.name)) {
              console.log('Image Load Time:', entry.duration, entry.name);
            }
          }
        });
      });

      try {
        observerRef.current.observe({ entryTypes: ['navigation', 'resource'] });
      } catch (e) {
        console.warn('Performance Observer not supported');
      }
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    // レンダリング完了時間を計算
    const renderTime = performance.now() - renderStartTime.current;
    
    // メモリ使用量（対応ブラウザのみ）
    let memoryUsage;
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
    }

    // DOM内の画像要素数
    const activeImages = document.querySelectorAll('img').length;

    setMetrics({
      renderTime,
      memoryUsage,
      activeImages,
      cacheSize: 0 // imageCache.size() if accessible
    });
  }, []);

  const logPerformance = () => {
    console.group('🚀 Performance Metrics');
    console.log('Render Time:', `${metrics.renderTime.toFixed(2)}ms`);
    if (metrics.memoryUsage) {
      console.log('Memory Usage:', `${metrics.memoryUsage.toFixed(2)}MB`);
    }
    console.log('Active Images:', metrics.activeImages);
    console.log('Cache Size:', metrics.cacheSize);
    console.groupEnd();
  };

  return {
    metrics,
    logPerformance
  };
};