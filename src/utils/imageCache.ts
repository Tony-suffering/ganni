class ImageCache {
  private cache = new Map<string, HTMLImageElement>();
  private preloadQueue = new Set<string>();
  private maxCacheSize = 100; // 最大キャッシュ数
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

      // 既にプリロード中の場合はスキップ（優先度が高い場合は除く）
      if (this.preloadQueue.has(src) && !priority) {
        return;
      }

      this.preloadQueue.add(src);

      const img = new Image();
      
      // 優先読み込みの場合はcrossOriginとfetchPriorityを設定
      if (priority) {
        img.crossOrigin = 'anonymous';
        if ('fetchPriority' in img) {
          (img as any).fetchPriority = 'high';
        }
        // デコードヒントを設定
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

  // 画像を取得（キャッシュから）
  get(src: string): HTMLImageElement | null {
    return this.cache.get(src) || null;
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

  // 近くの画像を先読み
  preloadBatch(urls: string[], batchSize: number = 5) {
    const batch = urls.slice(0, batchSize);
    
    batch.forEach(url => {
      // プリロードを非同期で実行
      this.preload(url).catch(() => {
        // エラーは無視（ログに記録するかは任意）
        console.warn(`Failed to preload image: ${url}`);
      });
    });
  }
}

export const imageCache = new ImageCache();