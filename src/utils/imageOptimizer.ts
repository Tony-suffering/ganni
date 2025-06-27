/**
 * 画像最適化ユーティリティ
 * ファイルサイズ削減とパフォーマンス向上のための機能を提供
 */

export class ImageOptimizer {
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
   * 最適な出力フォーマットを判定
   */
  private static getOptimalFormat(originalFormat: string): string {
    // WebPがサポートされている場合は WebP を優先
    if (this.isWebPSupported()) {
      return 'image/webp';
    }

    // JPEGが適している場合（写真など）
    if (originalFormat === 'image/jpeg' || originalFormat === 'image/jpg') {
      return 'image/jpeg';
    }

    // 透明度が必要な場合はPNG
    if (originalFormat === 'image/png') {
      return 'image/png';
    }

    // デフォルトはJPEG
    return 'image/jpeg';
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
}