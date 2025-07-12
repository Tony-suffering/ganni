import React, { useRef, useEffect, useState } from 'react';

interface YuGiOhCardProps {
  title: string;
  level: number;
  attribute: string;
  type: string;
  attack: number;
  defense: number;
  effectText: string;
  imageUrl: string;
  cardType?: 'normal' | 'effect' | 'spell' | 'trap';
  size?: 'small' | 'medium' | 'large';
}

export const YuGiOhCardGenerator: React.FC<YuGiOhCardProps> = ({ 
  title,
  level,
  attribute,
  type,
  attack,
  defense,
  effectText,
  imageUrl,
  cardType = 'normal',
  size = 'medium'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  const dimensions = {
    small: { width: 140, height: 204 },
    medium: { width: 200, height: 291 },
    large: { width: 280, height: 408 }
  };

  const dim = dimensions[size];
  const scale = dim.width / 200; // 基準サイズからのスケール

  useEffect(() => {
    const generateCard = async () => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      setIsLoading(true);

      // キャンバスサイズ設定（高解像度対応）
      canvas.width = dim.width * 2;
      canvas.height = dim.height * 2;
      canvas.style.width = dim.width + 'px';
      canvas.style.height = dim.height + 'px';
      ctx.scale(2, 2);

      try {
        // 背景（カードベース）
        const gradient = ctx.createLinearGradient(0, 0, dim.width, dim.height);
        if (cardType === 'normal') {
          gradient.addColorStop(0, '#F4E4C1');
          gradient.addColorStop(1, '#E8D5B7');
        } else if (cardType === 'effect') {
          gradient.addColorStop(0, '#FFB366');
          gradient.addColorStop(1, '#FF8C42');
        } else if (cardType === 'spell') {
          gradient.addColorStop(0, '#4AA96C');
          gradient.addColorStop(1, '#3D8B4F');
        } else {
          gradient.addColorStop(0, '#9B59B6');
          gradient.addColorStop(1, '#8E44AD');
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, dim.width, dim.height);

        // カード枠（ゴールドボーダー）
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 8 * scale;
        ctx.strokeRect(4 * scale, 4 * scale, dim.width - 8 * scale, dim.height - 8 * scale);

        // 内側の枠
        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 2 * scale;
        ctx.strokeRect(8 * scale, 8 * scale, dim.width - 16 * scale, dim.height - 16 * scale);

        // カード名エリア
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(12 * scale, 12 * scale, dim.width - 24 * scale, 30 * scale);

        // カード名
        ctx.font = `bold ${16 * scale}px Yu Gothic, sans-serif`;
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(title, 16 * scale, 27 * scale);

        // 属性アイコン（右上）
        ctx.font = `${12 * scale}px Arial`;
        ctx.textAlign = 'right';
        ctx.fillStyle = '#666666';
        ctx.fillText(`【${attribute}】`, dim.width - 16 * scale, 27 * scale);

        // レベル（星）表示
        if (cardType === 'normal' || cardType === 'effect') {
          const starSize = 14 * scale;
          const starY = 46 * scale;
          const totalStarsWidth = level * starSize;
          const startX = dim.width - 16 * scale - totalStarsWidth;
          
          ctx.fillStyle = '#FFD700';
          for (let i = 0; i < level; i++) {
            drawStar(ctx, startX + i * starSize + starSize/2, starY + starSize/2, starSize/2);
          }
        }

        // 画像エリア
        const imageAreaY = cardType === 'spell' || cardType === 'trap' ? 46 * scale : 62 * scale;
        const imageAreaHeight = 120 * scale;
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(12 * scale, imageAreaY, dim.width - 24 * scale, imageAreaHeight);

        // 投稿画像を描画
        if (imageUrl) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = () => resolve(null);
            img.src = imageUrl;
          });

          if (img.complete && img.naturalHeight !== 0) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(14 * scale, imageAreaY + 2 * scale, dim.width - 28 * scale, imageAreaHeight - 4 * scale);
            ctx.clip();

            const imgScale = Math.max(
              (dim.width - 28 * scale) / img.width,
              (imageAreaHeight - 4 * scale) / img.height
            );
            const scaledWidth = img.width * imgScale;
            const scaledHeight = img.height * imgScale;
            const offsetX = 14 * scale + ((dim.width - 28 * scale) - scaledWidth) / 2;
            const offsetY = imageAreaY + 2 * scale + ((imageAreaHeight - 4 * scale) - scaledHeight) / 2;

            ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
            ctx.restore();
          }
        }

        // タイプ表示
        const typeY = imageAreaY + imageAreaHeight + 8 * scale;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(12 * scale, typeY, dim.width - 24 * scale, 20 * scale);

        ctx.font = `bold ${10 * scale}px Yu Gothic, sans-serif`;
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'left';
        ctx.fillText(`【${type}】`, 16 * scale, typeY + 10 * scale);

        // 効果テキストエリア
        const textAreaY = typeY + 24 * scale;
        const textAreaHeight = (cardType === 'normal' || cardType === 'effect') ? 50 * scale : 70 * scale;
        
        ctx.fillStyle = 'rgba(255, 248, 220, 0.9)';
        ctx.fillRect(12 * scale, textAreaY, dim.width - 24 * scale, textAreaHeight);

        // 効果テキスト
        ctx.font = `${9 * scale}px Yu Gothic, sans-serif`;
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'left';
        
        const lines = wrapText(ctx, effectText, dim.width - 32 * scale);
        let lineY = textAreaY + 12 * scale;
        const lineHeight = 11 * scale;
        
        for (let i = 0; i < Math.min(lines.length, 5); i++) {
          ctx.fillText(lines[i], 16 * scale, lineY);
          lineY += lineHeight;
        }

        // ATK/DEF表示（モンスターカードのみ）
        if (cardType === 'normal' || cardType === 'effect') {
          const statsY = dim.height - 24 * scale;
          
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.fillRect(12 * scale, statsY, dim.width - 24 * scale, 18 * scale);

          ctx.font = `bold ${11 * scale}px Arial`;
          ctx.fillStyle = '#FFFFFF';
          ctx.textAlign = 'right';
          ctx.fillText(`ATK/${attack}  DEF/${defense}`, dim.width - 16 * scale, statsY + 11 * scale);
        }

        // カード下部の著作権表示風
        ctx.font = `${6 * scale}px Arial`;
        ctx.fillStyle = '#666666';
        ctx.textAlign = 'center';
        ctx.fillText('©2024 AI Diary Card Game', dim.width / 2, dim.height - 6 * scale);

        setIsLoading(false);
      } catch (error) {
        console.error('カード生成エラー:', error);
        setIsLoading(false);
      }
    };

    generateCard();
  }, [title, level, attribute, type, attack, defense, effectText, imageUrl, cardType, size, dim]);

  // 星を描画する関数
  const drawStar = (ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) => {
    const spikes = 5;
    const outerRadius = radius;
    const innerRadius = radius * 0.5;
    
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
  };

  // テキスト折り返し処理
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split('');
    const lines: string[] = [];
    let currentLine = '';
    
    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine + words[i];
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine !== '') {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine !== '') {
      lines.push(currentLine);
    }
    
    return lines;
  };

  return (
    <div className="relative">
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center"
          style={{ width: dim.width, height: dim.height }}
        >
          <span className="text-gray-500 text-sm">生成中...</span>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={`${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300 cursor-pointer hover:scale-105 transform transition-transform rounded-lg`}
        style={{
          width: dim.width,
          height: dim.height,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}
      />
    </div>
  );
};