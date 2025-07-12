import React, { useRef, useEffect, useState } from 'react';
import { CardRarityEffect } from './CardRarityEffect';

interface YuGiOhOrikaProps {
  title: string;
  level: number;
  attribute: string;
  type: string;
  attack: number;
  defense: number;
  effectText: string;
  imageUrl: string;
  cardType?: 'normal' | 'effect' | 'spell' | 'trap';
  rarity?: 'N' | 'R' | 'SR' | 'UR'; // レア度を追加
  size?: 'small' | 'medium' | 'large';
  debugMode?: boolean;
}

export const YuGiOhOrikaGenerator: React.FC<YuGiOhOrikaProps> = ({ 
  title,
  level,
  attribute,
  type,
  attack,
  defense,
  effectText,
  imageUrl,
  cardType = 'normal',
  rarity = 'N',
  size = 'medium',
  debugMode = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // デバッグ用の調整可能な値（スクリーンショットから最適化された値）
  const [imageAdjust, setImageAdjust] = useState({
    x: 0.121,
    y: 0.185, 
    width: 0.763,
    height: 0.519
  });
  
  const [textAdjust, setTextAdjust] = useState({
    y: 0.755,
    height: 0.180,
    padding: 0.071,
    typeFontSize: 0.025,
    effectFontSize: 0.022
  });
  
  const [titleAdjust, setTitleAdjust] = useState({
    x: 0.089,
    y: 0.079,
    fontSize: 0.048
  });

  const dimensions = {
    small: { width: 179, height: 262 },
    medium: { width: 421, height: 614 },
    large: { width: 600, height: 875 }
  };

  const dim = dimensions[size];

  useEffect(() => {
    const generateCard = async () => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      setIsLoading(true);

      // キャンバスサイズ設定
      canvas.width = dim.width;
      canvas.height = dim.height;

      try {
        // 背景をクリア
        ctx.clearRect(0, 0, dim.width, dim.height);
        // レア度とカードタイプに応じたフレームを選択
        const getFramePath = () => {
          // 魔法・罠カードの場合は専用フレーム
          if (cardType === 'spell') return '/cards/frame-spell.jpg';
          if (cardType === 'trap') return '/cards/frame-trap.jpg';
          
          // モンスターカードはレア度に応じたフレーム
          switch (rarity) {
            case 'UR': return '/cards/frame-ultra-rare.jpg';
            case 'SR': return '/cards/frame-super-rare.jpg';
            case 'R': return '/cards/frame-rare.jpg';
            case 'N':
            default: return '/cards/frame-normal.jpg';
          }
        };
        
        // フレーム画像を読み込み
        const templateImage = new Image();
        templateImage.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          templateImage.onload = () => resolve(null);
          templateImage.onerror = (error) => {
            console.error('Failed to load frame:', error);
            reject(error);
          };
          templateImage.src = getFramePath();
        });

        // テンプレートを描画
        ctx.drawImage(templateImage, 0, 0, dim.width, dim.height);

        // 投稿画像を読み込んで中央の白い部分に配置
        if (imageUrl && imageUrl !== '/placeholder-image.jpg') {
          try {
            const postImage = new Image();
            postImage.crossOrigin = 'anonymous';
            
            await new Promise((resolve, reject) => {
              postImage.onload = () => resolve(null);
              postImage.onerror = (error) => {
                console.warn('Failed to load post image:', error);
                resolve(null); // 画像が読み込めなくてもカード生成は続行
              };
              postImage.src = imageUrl;
            });

            if (postImage.complete && postImage.naturalHeight !== 0) {
              // 調整可能な画像エリア
              const imageArea = {
                x: dim.width * imageAdjust.x,
                y: dim.height * imageAdjust.y,
                width: dim.width * imageAdjust.width,
                height: dim.height * imageAdjust.height
              };

              // デバッグ用: 画像エリアの境界線を表示（赤）
              if (debugMode) {
                ctx.save();
                ctx.strokeStyle = 'red';
                ctx.lineWidth = 2;
                ctx.strokeRect(imageArea.x, imageArea.y, imageArea.width, imageArea.height);
                ctx.restore();
              }

              // アスペクト比を保持して枠いっぱいに表示（はみ出してもOK）
              const scale = Math.max(
                imageArea.width / postImage.width,
                imageArea.height / postImage.height
              ); // Math.maxに変更して枠を埋める
              
              const scaledWidth = postImage.width * scale;
              const scaledHeight = postImage.height * scale;
              const offsetX = imageArea.x + (imageArea.width - scaledWidth) / 2;
              const offsetY = imageArea.y + (imageArea.height - scaledHeight) / 2;

              ctx.save();
              // より厳密に枠内に制限
              ctx.beginPath();
              ctx.rect(imageArea.x, imageArea.y, imageArea.width, imageArea.height);
              ctx.clip();
              ctx.drawImage(postImage, offsetX, offsetY, scaledWidth, scaledHeight);
              ctx.restore();
            }
          } catch (error) {
            console.warn('Error loading post image:', error);
          }
        }

        // 遊戯王風フォントの設定と描画
        
        // カード名（上部黄色エリア）- シルバー色
        ctx.save();
        ctx.font = `bold ${Math.floor(dim.width * titleAdjust.fontSize)}px 'Yu Gothic', 'Hiragino Sans', 'ヒラギノ角ゴ ProN', 'Noto Sans JP', sans-serif`;
        
        // 白色のタイトル
        ctx.fillStyle = '#FFFFFF';
        
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        
        // カード名の配置（調整可能）
        const nameX = dim.width * titleAdjust.x;
        const nameY = dim.height * titleAdjust.y;
        
        // デバッグ用: タイトルエリアの境界線を表示（緑）
        if (debugMode) {
          ctx.save();
          ctx.strokeStyle = 'green';
          ctx.lineWidth = 2;
          const titleWidth = ctx.measureText(title).width;
          const titleHeight = Math.floor(dim.width * titleAdjust.fontSize);
          ctx.strokeRect(nameX - 5, nameY - titleHeight/2 - 5, titleWidth + 10, titleHeight + 10);
          ctx.restore();
        }
        
        // 黒い縁取りで視認性向上
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeText(title, nameX, nameY);
        ctx.fillText(title, nameX, nameY);
        ctx.restore();

        // 効果テキストエリア（調整可能）
        const textAreaY = dim.height * textAdjust.y;
        const textAreaHeight = dim.height * textAdjust.height;
        const textPadding = dim.width * textAdjust.padding;

        // デバッグ用: テキストエリアの境界線を表示（青）
        if (debugMode) {
          ctx.save();
          ctx.strokeStyle = 'blue';
          ctx.lineWidth = 2;
          ctx.strokeRect(textPadding, textAreaY, dim.width - textPadding * 2, textAreaHeight);
          ctx.restore();
        }

        // 種族・タイプテキスト（調整可能なサイズ）
        ctx.save();
        ctx.font = `bold ${Math.floor(dim.width * textAdjust.typeFontSize)}px 'Yu Gothic', sans-serif`;
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'left';
        const typeY = textAreaY + dim.height * 0.03;
        ctx.fillText(`【${type}】`, textPadding, typeY);
        ctx.restore();

        // 効果テキスト（調整可能なサイズ）
        ctx.save();
        ctx.font = `${Math.floor(dim.width * textAdjust.effectFontSize)}px 'Yu Gothic', sans-serif`;
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'left';
        
        const effectY = typeY + dim.height * 0.035;
        const maxWidth = dim.width - textPadding * 2;
        const lines = wrapText(ctx, effectText, maxWidth);
        
        let currentY = effectY;
        const lineHeight = dim.height * 0.022;
        
        // 効果テキストは8行まで（文字数制限を緩和）
        for (let i = 0; i < Math.min(lines.length, 8); i++) {
          ctx.fillText(lines[i], textPadding, currentY);
          currentY += lineHeight;
        }
        ctx.restore();

        // ATK/DEF表示（テキストエリア内の右下）
        if (cardType === 'normal' || cardType === 'effect') {
          ctx.save();
          ctx.font = `bold ${Math.floor(dim.width * 0.025)}px 'Yu Gothic', sans-serif`;
          ctx.fillStyle = '#000000';
          ctx.textAlign = 'right';
          
          // テキストエリア内の最下部に配置
          const statsY = textAreaY + textAreaHeight - dim.height * 0.015;
          const statsX = dim.width - textPadding;
          
          ctx.fillText(`ATK/${attack} DEF/${defense}`, statsX, statsY);
          ctx.restore();
        }

        setIsLoading(false);
      } catch (error) {
        console.error('カード生成エラー:', error);
        
        // エラー時もテンプレートだけでも表示
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, dim.width, dim.height);
            ctx.fillStyle = '#F5DEB3';
            ctx.fillRect(0, 0, dim.width, dim.height);
            ctx.fillStyle = '#000000';
            ctx.font = `${Math.floor(dim.width * 0.04)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('カード生成エラー', dim.width / 2, dim.height / 2);
            ctx.fillText('テンプレート読み込み失敗', dim.width / 2, dim.height / 2 + 30);
          }
        }
        setIsLoading(false);
      }
    };

    generateCard();
  }, [title, level, attribute, type, attack, defense, effectText, imageUrl, cardType, rarity, size, imageAdjust, textAdjust, titleAdjust, debugMode]);

  // 星を描画する関数
  const drawStar = (ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) => {
    const spikes = 5;
    const outerRadius = radius;
    const innerRadius = radius * 0.5;
    
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  // テキスト折り返し処理
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const lines: string[] = [];
    const paragraphs = text.split('\n');
    
    for (const paragraph of paragraphs) {
      const words = paragraph.split('');
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
    }
    
    return lines;
  };

  return (
    <div className="flex gap-4">
      <div className="relative">
        {isLoading && (
          <div 
            className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center"
            style={{ width: dim.width, height: dim.height }}
          >
            <span className="text-gray-500 text-sm">生成中...</span>
          </div>
        )}
        <div className="relative">
          <canvas
            ref={canvasRef}
            className={`${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300 cursor-pointer hover:scale-105 transform transition-transform`}
            style={{
              width: dim.width,
              height: dim.height,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              borderRadius: '4px'
            }}
          />
          {/* レア度エフェクト（無効化） */}
          {!isLoading && (
            <CardRarityEffect 
              rarity={rarity} 
              width={dim.width} 
              height={dim.height}
              isActive={false}
            />
          )}
        </div>
      </div>
      
      {debugMode && (
        <div className="bg-gray-100 p-4 rounded-lg w-80">
          <h3 className="font-bold mb-4">位置調整</h3>
          
          <div className="mb-4">
            <h4 className="font-semibold text-red-600 mb-2">画像エリア (赤)</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <label>X: {imageAdjust.x.toFixed(3)}</label>
              <input type="range" min="0" max="0.5" step="0.001" value={imageAdjust.x} 
                onChange={(e) => setImageAdjust({...imageAdjust, x: parseFloat(e.target.value)})} />
              <label>Y: {imageAdjust.y.toFixed(3)}</label>
              <input type="range" min="0" max="0.5" step="0.001" value={imageAdjust.y}
                onChange={(e) => setImageAdjust({...imageAdjust, y: parseFloat(e.target.value)})} />
              <label>Width: {imageAdjust.width.toFixed(3)}</label>
              <input type="range" min="0.3" max="1" step="0.001" value={imageAdjust.width}
                onChange={(e) => setImageAdjust({...imageAdjust, width: parseFloat(e.target.value)})} />
              <label>Height: {imageAdjust.height.toFixed(3)}</label>
              <input type="range" min="0.2" max="0.6" step="0.001" value={imageAdjust.height}
                onChange={(e) => setImageAdjust({...imageAdjust, height: parseFloat(e.target.value)})} />
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="font-semibold text-green-600 mb-2">タイトル (緑)</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <label>X: {titleAdjust.x.toFixed(3)}</label>
              <input type="range" min="0" max="0.2" step="0.001" value={titleAdjust.x}
                onChange={(e) => setTitleAdjust({...titleAdjust, x: parseFloat(e.target.value)})} />
              <label>Y: {titleAdjust.y.toFixed(3)}</label>
              <input type="range" min="0" max="0.15" step="0.001" value={titleAdjust.y}
                onChange={(e) => setTitleAdjust({...titleAdjust, y: parseFloat(e.target.value)})} />
              <label>Size: {titleAdjust.fontSize.toFixed(3)}</label>
              <input type="range" min="0.02" max="0.08" step="0.001" value={titleAdjust.fontSize}
                onChange={(e) => setTitleAdjust({...titleAdjust, fontSize: parseFloat(e.target.value)})} />
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="font-semibold text-blue-600 mb-2">テキストエリア (青)</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <label>Y: {textAdjust.y.toFixed(3)}</label>
              <input type="range" min="0.5" max="0.9" step="0.001" value={textAdjust.y}
                onChange={(e) => setTextAdjust({...textAdjust, y: parseFloat(e.target.value)})} />
              <label>Height: {textAdjust.height.toFixed(3)}</label>
              <input type="range" min="0.1" max="0.4" step="0.001" value={textAdjust.height}
                onChange={(e) => setTextAdjust({...textAdjust, height: parseFloat(e.target.value)})} />
              <label>Padding: {textAdjust.padding.toFixed(3)}</label>
              <input type="range" min="0.02" max="0.1" step="0.001" value={textAdjust.padding}
                onChange={(e) => setTextAdjust({...textAdjust, padding: parseFloat(e.target.value)})} />
              <label>TypeSize: {textAdjust.typeFontSize.toFixed(3)}</label>
              <input type="range" min="0.015" max="0.04" step="0.001" value={textAdjust.typeFontSize}
                onChange={(e) => setTextAdjust({...textAdjust, typeFontSize: parseFloat(e.target.value)})} />
              <label>EffectSize: {textAdjust.effectFontSize.toFixed(3)}</label>
              <input type="range" min="0.015" max="0.035" step="0.001" value={textAdjust.effectFontSize}
                onChange={(e) => setTextAdjust({...textAdjust, effectFontSize: parseFloat(e.target.value)})} />
            </div>
          </div>
          
          <button 
            className="w-full bg-gray-500 text-white p-2 rounded"
            onClick={() => console.log('現在の値:', {imageAdjust, titleAdjust, textAdjust})}
          >
            値をコンソールに出力
          </button>
        </div>
      )}
    </div>
  );
};