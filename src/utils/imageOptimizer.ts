/**
 * 画像最適化ユーティリティ
 * ファイルサイズ削減とパフォーマンス向上のための機能を提供
 */

export interface ImageSize {
  name: 'thumbnail' | 'medium' | 'full';
  width: number;
  height: number;
  quality: number;
}

export interface OptimizedImageSet {
  full: string;
  medium: string;
  thumbnail: string;
  metadata: {
    originalSize: number;
    optimizedSizes: Record<string, number>;
    format: string;
  };
}

export class ImageOptimizer {
  // 標準解像度設定
  static readonly IMAGE_SIZES: ImageSize[] = [
    { name: 'thumbnail', width: 400, height: 400, quality: 0.8 },
    { name: 'medium', width: 800, height: 800, quality: 0.85 },
    { name: 'full', width: 1920, height: 1920, quality: 0.9 }
  ];

  /**
   * 複数解像度の画像セットを生成
   * @param file 元の画像ファイル
   * @returns 最適化された画像セット
   */
  static async generateImageSet(file: File): Promise<OptimizedImageSet> {
    const originalSize = file.size;
    const results: Partial<OptimizedImageSet> = {};
    const optimizedSizes: Record<string, number> = {};

    // 各解像度で並列処理
    const promises = this.IMAGE_SIZES.map(async (size) => {
      const optimized = await this.optimizeImage(file, size.width, size.height, size.quality);
      const sizeInBytes = this.estimateFileSize(optimized);
      
      optimizedSizes[size.name] = sizeInBytes;
      return { [size.name]: optimized };
    });

    const imageResults = await Promise.all(promises);
    
    // 結果をマージ
    imageResults.forEach(result => Object.assign(results, result));

    return {
      full: results.full!,
      medium: results.medium!,
      thumbnail: results.thumbnail!,
      metadata: {
        originalSize,
        optimizedSizes,
        format: this.getOptimalFormat(file.type)
      }
    };
  }

  /**
   * 画像を圧縮・リサイズする
   * @param file 元の画像ファイル
   * @param maxWidth 最大幅（デフォルト: 1920px）
   * @param maxHeight 最大高さ（デフォルト: 1080px）
   * @param quality 品質（0.1-1.0、デフォルト: 0.8）
   * @returns 最適化された画像のBase64文字列
   */
  static async optimizeImage(
    file: File,
    maxWidth: number = 1920,
    maxHeight: number = 1080,
    quality: number = 0.8
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // 元のアスペクト比を保持しながらリサイズ
        const { width, height } = this.calculateOptimalSize(
          img.width,
          img.height,
          maxWidth,
          maxHeight
        );

        canvas.width = width;
        canvas.height = height;

        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // 高品質な描画設定
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // 画像を描画
        ctx.drawImage(img, 0, 0, width, height);

        // 最適なフォーマットを判定
        const outputFormat = this.getOptimalFormat(file.type);
        
        // Base64として出力
        const optimizedDataUrl = canvas.toDataURL(outputFormat, quality);
        resolve(optimizedDataUrl);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for optimization'));
      };

      // FileをData URLとして読み込み
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        reject(new Error('Failed to read image file'));
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * 最適なサイズを計算（アスペクト比保持）
   */
  private static calculateOptimalSize(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    let { width, height } = { width: originalWidth, height: originalHeight };

    // 最大サイズを超えている場合はスケールダウン
    if (width > maxWidth || height > maxHeight) {
      const aspectRatio = width / height;

      if (width > height) {
        width = maxWidth;
        height = width / aspectRatio;
      } else {
        height = maxHeight;
        width = height * aspectRatio;
      }

      // 念のため再チェック
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }
      if (width > maxWidth) {
        width = maxWidth;
        height = width / aspectRatio;
      }
    }

    return {
      width: Math.round(width),
      height: Math.round(height)
    };
  }

  /**
   * 最適な出力フォーマットを判定（強制的に最新フォーマット優先）
   */
  private static getOptimalFormat(originalFormat: string): string {
    // AVIF サポートチェック（最優先）
    if (this.isAVIFSupported()) {
      return 'image/avif';
    }

    // WebP サポートチェック（次優先）
    if (this.isWebPSupported()) {
      return 'image/webp';
    }

    // フォールバック: 透明度が必要な場合はPNG、そうでなければJPEG
    if (originalFormat === 'image/png') {
      return 'image/png';
    }

    return 'image/jpeg';
  }

  /**
   * フォーマット強制変換（品質重視）
   */
  static async forceModernFormat(
    file: File,
    preferAVIF: boolean = true,
    maxWidth: number = 1920,
    maxHeight: number = 1080,
    quality: number = 0.9
  ): Promise<{ dataUrl: string; format: string; compressionRatio: number }> {
    const originalSize = file.size;
    
    // フォーマット優先度を決定
    let targetFormat = 'image/jpeg';
    if (preferAVIF && this.isAVIFSupported()) {
      targetFormat = 'image/avif';
    } else if (this.isWebPSupported()) {
      targetFormat = 'image/webp';
    }

    const optimizedDataUrl = await this.optimizeToFormat(file, targetFormat, maxWidth, maxHeight, quality);
    const optimizedSize = this.estimateFileSize(optimizedDataUrl);
    const compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100;

    return {
      dataUrl: optimizedDataUrl,
      format: targetFormat,
      compressionRatio: Math.max(0, compressionRatio)
    };
  }

  /**
   * 指定フォーマットに最適化
   */
  private static async optimizeToFormat(
    file: File,
    format: string,
    maxWidth: number,
    maxHeight: number,
    quality: number
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const { width, height } = this.calculateOptimalSize(
          img.width,
          img.height,
          maxWidth,
          maxHeight
        );

        canvas.width = width;
        canvas.height = height;

        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // 最高品質設定
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // 画像を描画
        ctx.drawImage(img, 0, 0, width, height);

        // 指定フォーマットで出力
        const dataUrl = canvas.toDataURL(format, quality);
        resolve(dataUrl);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for format conversion'));
      };

      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        reject(new Error('Failed to read image file'));
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * WebPサポートを検出
   */
  private static isWebPSupported(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  /**
   * AVIFサポートを検出
   */
  private static isAVIFSupported(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    try {
      return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
    } catch {
      return false;
    }
  }

  /**
   * ファイルサイズを推定（Base64から）
   */
  static estimateFileSize(base64String: string): number {
    const base64Data = base64String.split(',')[1] || base64String;
    return Math.round((base64Data.length * 3) / 4);
  }

  /**
   * ファイルサイズを人間が読みやすい形式に変換
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * プログレッシブJPEGかどうかをチェック（簡易版）
   */
  static isProgressiveJPEG(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const bytes = new Uint8Array(reader.result as ArrayBuffer);
        // JPEG Progressive マーカーをチェック（簡易実装）
        const hasProgressiveMarker = bytes.some((byte, index) => 
          index < bytes.length - 1 && 
          byte === 0xFF && 
          bytes[index + 1] === 0xC2
        );
        resolve(hasProgressiveMarker);
      };
      reader.onerror = () => resolve(false);
      reader.readAsArrayBuffer(file.slice(0, 10000)); // 最初の10KBのみチェック
    });
  }

  /**
   * AI画像圧縮（知覚的品質維持 + 高効率圧縮）
   * 複数の品質レベルでテストし、最適な設定を選択
   */
  static async smartCompress(
    file: File,
    targetSizeKB?: number,
    maxWidth: number = 1920,
    maxHeight: number = 1080
  ): Promise<{ dataUrl: string; quality: number; compressionRatio: number; format: string }> {
    const originalSize = file.size;
    const targetSizeBytes = targetSizeKB ? targetSizeKB * 1024 : originalSize * 0.5; // デフォルト50%削減

    // 品質レベルのテストリスト（高品質→低品質）
    const qualityLevels = [0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5];
    
    let bestResult = {
      dataUrl: '',
      quality: 0.9,
      compressionRatio: 0,
      format: 'image/jpeg'
    };

    for (const quality of qualityLevels) {
      try {
        const result = await this.forceModernFormat(file, true, maxWidth, maxHeight, quality);
        const compressedSize = this.estimateFileSize(result.dataUrl);
        
        // 目標サイズ以下で最高品質を選択
        if (compressedSize <= targetSizeBytes) {
          bestResult = {
            dataUrl: result.dataUrl,
            quality,
            compressionRatio: ((originalSize - compressedSize) / originalSize) * 100,
            format: result.format
          };
          break;
        }
      } catch (error) {
        console.warn(`品質${quality}での圧縮に失敗:`, error);
        continue;
      }
    }

    // 全て失敗した場合は最低品質で実行
    if (!bestResult.dataUrl) {
      try {
        const fallbackResult = await this.forceModernFormat(file, true, maxWidth, maxHeight, 0.4);
        const compressedSize = this.estimateFileSize(fallbackResult.dataUrl);
        
        bestResult = {
          dataUrl: fallbackResult.dataUrl,
          quality: 0.4,
          compressionRatio: ((originalSize - compressedSize) / originalSize) * 100,
          format: fallbackResult.format
        };
      } catch (error) {
        throw new Error('AI圧縮に失敗しました: ' + error);
      }
    }

    return bestResult;
  }

  /**
   * 批量AI圧縮（複数画像の一括処理）
   */
  static async batchSmartCompress(
    files: File[],
    targetSizeKB?: number,
    maxWidth: number = 1920,
    maxHeight: number = 1080
  ): Promise<Array<{ 
    file: File; 
    result: { dataUrl: string; quality: number; compressionRatio: number; format: string } | null;
    error?: string;
  }>> {
    const promises = files.map(async (file) => {
      try {
        const result = await this.smartCompress(file, targetSizeKB, maxWidth, maxHeight);
        return { file, result };
      } catch (error) {
        return { 
          file, 
          result: null, 
          error: error instanceof Error ? error.message : '不明なエラー' 
        };
      }
    });

    return Promise.all(promises);
  }
}