class ImageCache {
  private cache = new Map<string, HTMLImageElement>();
  private preloadQueue = new Set<string>();
  private maxCacheSize = 200; // 最大キャッシュ数を増加
  private currentSize = 0;

  constructor() {
    // ページ離脱時にキャッシュをクリア
    window.addEventListener('beforeunload', () => {
      this.clear();
    });
  }

  // 画像をプリロード
  preload(src: string, priority: boolean = false): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      // キャッシュに存在する場合は即座に返す
      if (this.cache.has(src)) {
        resolve(this.cache.get(src)!);
        return;
      }

      // 既にプリロード中の場合は待機用のPromiseを返す（優先度が高い場合は除く）
      if (this.preloadQueue.has(src) && !priority) {
        // 既にプリロード中の場合は、完了まで待機（タイムアウト付き）
        const checkCache = () => {
          return new Promise<HTMLImageElement>((resolveWait, rejectWait) => {
            let timeoutCount = 0;
            const maxTimeout = 500; // 5秒タイムアウト（10ms * 500 = 5000ms）
            
            const interval = setInterval(() => {
              timeoutCount++;
              
              if (this.cache.has(src)) {
                clearInterval(interval);
                resolveWait(this.cache.get(src)!);
              } else if (!this.preloadQueue.has(src)) {
                // プリロードが失敗した場合
                clearInterval(interval);
                rejectWait(new Error(`Image preload failed or cancelled: ${src}`));
              } else if (timeoutCount >= maxTimeout) {
                // タイムアウトした場合
                clearInterval(interval);
                rejectWait(new Error(`Image preload timeout: ${src}`));
              }
            }, 10);
          });
        };
        checkCache().then(resolve).catch(reject);
        return;
      }

      this.preloadQueue.add(src);

      const img = new Image();
      
      // fetchPriorityとデコードヒントを設定（crossOriginは削除してSupabase互換性を向上）
      if (priority) {
        if ('fetchPriority' in img) {
          (img as any).fetchPriority = 'high';
        }
        // 優先読み込み時は同期デコード
        if ('decoding' in img) {
          img.decoding = 'sync';
        }
      } else {
        if ('fetchPriority' in img) {
          (img as any).fetchPriority = 'low';
        }
        if ('decoding' in img) {
          img.decoding = 'async';
        }
      }
      
      // プリロードでは常にeagerで読み込み（lazyにするとIntersectionObserverで検出しても読み込まれない）
      if ('loading' in img) {
        img.loading = 'eager';
      }

      img.onload = () => {
        this.preloadQueue.delete(src);
        this.addToCache(src, img);
        resolve(img);
      };
      
      img.onerror = () => {
        this.preloadQueue.delete(src);
        reject(new Error(`Failed to load image: ${src}`));
      };

      img.src = src;
    });
  }

  // 画像を取得（キャッシュから）- LRU動作のためtouchも呼ぶ
  get(src: string): HTMLImageElement | null {
    const img = this.cache.get(src) || null;
    if (img) {
      this.touch(src);
    }
    return img;
  }

  // キャッシュに追加
  private addToCache(src: string, img: HTMLImageElement) {
    // キャッシュサイズが上限に達した場合、古いものを削除
    if (this.currentSize >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
        this.currentSize--;
      }
    }

    this.cache.set(src, img);
    this.currentSize++;
  }

  // 特定の画像をキャッシュから削除
  remove(src: string) {
    if (this.cache.has(src)) {
      this.cache.delete(src);
      this.currentSize--;
    }
  }

  // キャッシュをクリア
  clear() {
    this.cache.clear();
    this.preloadQueue.clear();
    this.currentSize = 0;
  }

  // キャッシュサイズを取得
  size(): number {
    return this.currentSize;
  }

  // 近くの画像を先読み（バッチサイズを増加）
  preloadBatch(urls: string[], batchSize: number = 8) {
    const batch = urls.slice(0, batchSize);
    
    batch.forEach((url, index) => {
      // 最初の3枚は優先読み込み
      const isPriority = index < 3;
      
      // プリロードを非同期で実行
      this.preload(url, isPriority).catch(() => {
        // エラーは無視
      });
    });
  }
  
  // LRU（Least Recently Used）キャッシュとして動作するよう改善
  touch(src: string) {
    if (this.cache.has(src)) {
      const img = this.cache.get(src)!;
      this.cache.delete(src);
      this.cache.set(src, img); // 最後に移動
    }
  }
  
  // メモリ使用量を監視して自動的にキャッシュサイズを調整
  getOptimalCacheSize(): number {
    // 利用可能メモリに基づいてキャッシュサイズを動的に調整
    const memory = (performance as any).memory;
    if (memory && memory.usedJSHeapSize) {
      const usedMemoryMB = memory.usedJSHeapSize / (1024 * 1024);
      if (usedMemoryMB > 100) {
        return Math.max(50, this.maxCacheSize - 20);
      }
    }
    return this.maxCacheSize;
  }
}

export const imageCache = new ImageCache();