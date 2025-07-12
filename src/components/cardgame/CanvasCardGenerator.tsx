import React, { useRef, useEffect, useState } from 'react';
import { GameCard } from '../../types/cardgame';

interface CanvasCardProps {
  card: GameCard;
  size?: 'small' | 'medium' | 'large';
}

export const CanvasCardGenerator: React.FC<CanvasCardProps> = ({ card, size = 'medium' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  const dimensions = {
    small: { width: 140, height: 196 },
    medium: { width: 200, height: 280 },
    large: { width: 280, height: 392 }
  };

  const dim = dimensions[size];

  useEffect(() => {
    const generateCard = async () => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      setIsLoading(true);

      try {
        // キャンバスサイズ設定
        canvas.width = dim.width;
        canvas.height = dim.height;

        // ベースカード画像を読み込み
        const baseImage = new Image();
        baseImage.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          baseImage.onload = resolve;
          baseImage.onerror = reject;
          baseImage.src = '/card.png';
        });

        // ベース画像を描画
        ctx.drawImage(baseImage, 0, 0, dim.width, dim.height);

        // 投稿画像を読み込み・合成
        if (card.imageUrl) {
          const postImage = new Image();
          postImage.crossOrigin = 'anonymous';
          
          await new Promise((resolve, reject) => {
            postImage.onload = resolve;
            postImage.onerror = () => resolve(null); // エラーでも続行
            postImage.src = card.imageUrl;
          });

          // 投稿画像を中央エリアに描画（card.pngの画像部分に合わせて調整）
          const imageArea = {
            x: dim.width * 0.08,
            y: dim.height * 0.12,
            width: dim.width * 0.84,
            height: dim.height * 0.52
          };

          // 角丸クリッピング
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(imageArea.x, imageArea.y, imageArea.width, imageArea.height, 8);
          ctx.clip();

          // アスペクト比を保持して描画
          const scale = Math.max(
            imageArea.width / postImage.width,
            imageArea.height / postImage.height
          );
          const scaledWidth = postImage.width * scale;
          const scaledHeight = postImage.height * scale;
          const offsetX = imageArea.x + (imageArea.width - scaledWidth) / 2;
          const offsetY = imageArea.y + (imageArea.height - scaledHeight) / 2;

          ctx.drawImage(postImage, offsetX, offsetY, scaledWidth, scaledHeight);
          ctx.restore();
        }

        // レベル数値を描画（左上円形エリア）
        ctx.save();
        ctx.font = `bold ${size === 'large' ? '18px' : size === 'small' ? '12px' : '16px'} Arial`;
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const levelX = dim.width * 0.16;
        const levelY = dim.height * 0.08;
        ctx.strokeText(card.level.toString(), levelX, levelY);
        ctx.fillText(card.level.toString(), levelX, levelY);
        ctx.restore();

        // カード名を描画（中央下部バー）
        ctx.save();
        ctx.font = `bold ${size === 'large' ? '14px' : size === 'small' ? '10px' : '12px'} Arial`;
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const nameX = dim.width * 0.5;
        const nameY = dim.height * 0.71;
        const displayName = card.title.length > 15 ? card.title.substring(0, 15) + '...' : card.title;
        ctx.strokeText(displayName.toUpperCase(), nameX, nameY);
        ctx.fillText(displayName.toUpperCase(), nameX, nameY);
        ctx.restore();

        // 効果テキストを描画（下部黒エリア）
        ctx.save();
        ctx.font = `${size === 'large' ? '11px' : size === 'small' ? '8px' : '10px'} Arial`;
        ctx.fillStyle = '#FFFFFF';
        
        const textArea = {
          x: dim.width * 0.1,
          y: dim.height * 0.78,
          width: dim.width * 0.8,
          height: dim.height * 0.14
        };

        // 背景を半透明黒で塗りつぶし
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(textArea.x, textArea.y, textArea.width, textArea.height);

        // テキストを描画
        ctx.fillStyle = '#FFFFFF';
        const effectText = card.effectText.length > 60 ? card.effectText.substring(0, 60) + '...' : card.effectText;
        
        // 改行処理
        const words = effectText.split(' ');
        let line = '';
        let lineY = textArea.y + 12;
        const lineHeight = 12;
        
        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + ' ';
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > textArea.width - 10 && i > 0) {
            ctx.fillText(line, textArea.x + 5, lineY);
            line = words[i] + ' ';
            lineY += lineHeight;
            
            if (lineY > textArea.y + textArea.height - 5) break;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, textArea.x + 5, lineY);
        ctx.restore();

        // ATK値を描画（左下）
        ctx.save();
        ctx.font = `bold ${size === 'large' ? '16px' : size === 'small' ? '12px' : '14px'} Arial`;
        ctx.fillStyle = '#FF4444';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const atkX = dim.width * 0.2;
        const atkY = dim.height * 0.95;
        const atkValue = Math.round(card.stats.attack / 10) * 100;
        ctx.strokeText(atkValue.toString(), atkX, atkY);
        ctx.fillText(atkValue.toString(), atkX, atkY);
        ctx.restore();

        // レアリティマーカーを描画（右上）
        ctx.save();
        ctx.font = `bold ${size === 'large' ? '12px' : size === 'small' ? '8px' : '10px'} Arial`;
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const rarityX = dim.width * 0.88;
        const rarityY = dim.height * 0.08;
        
        // レアリティ背景色
        const rarityColor = card.rarity === 'UR' ? '#9333EA' : 
                           card.rarity === 'SR' ? '#DC2626' :
                           card.rarity === 'R' ? '#2563EB' : '#6B7280';
        
        ctx.fillStyle = rarityColor;
        ctx.fillRect(rarityX - 12, rarityY - 8, 24, 16);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeText(card.rarity, rarityX, rarityY);
        ctx.fillText(card.rarity, rarityX, rarityY);
        ctx.restore();

        setIsLoading(false);
      } catch (error) {
        console.error('カード生成エラー:', error);
        setIsLoading(false);
      }
    };

    generateCard();
  }, [card, size, dim]);

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
        className={`${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300 cursor-pointer hover:scale-105 transform transition-transform`}
        style={{
          width: dim.width,
          height: dim.height,
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}
      />
    </div>
  );
};